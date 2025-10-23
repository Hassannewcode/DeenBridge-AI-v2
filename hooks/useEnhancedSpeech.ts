import { useCallback, useRef, useEffect, useState } from 'react';
import { marked } from 'marked';
import { getSpeech, isTtsServiceConfigured } from '../services/ttsService';
import { decode, decodeAudioData } from '../utils/audioUtils';
import type { UserProfile } from '../types';

// This custom renderer for Marked helps to convert Markdown into clean, speakable plain text.
const textRenderer = new marked.Renderer();
textRenderer.link = (_href, _title, text) => text;
textRenderer.image = (_href, _title, text) => text;
textRenderer.code = (code) => `\nCode block: ${code}\n`;
textRenderer.blockquote = (quote) => `${quote}\n`;
textRenderer.html = () => ''; // strip html
textRenderer.heading = (text) => `${text}. `;
textRenderer.hr = () => '. ';
textRenderer.list = (body) => `${body}`;
textRenderer.listitem = (text) => `• ${text}\n`;
textRenderer.paragraph = (text) => `${text}\n`;
textRenderer.strong = (text) => text;
textRenderer.em = (text) => text;
textRenderer.codespan = (text) => text;
textRenderer.br = () => '\n';
textRenderer.del = (text) => text;

/**
 * Strips Markdown formatting from a string to produce clean text for TTS.
 */
const stripMarkdown = (markdown: string): string => {
    try {
        const plainText = marked.parse(markdown, { renderer: textRenderer });
        return plainText.replace(/(\n\s*){2,}/g, '\n').trim();
    } catch (e) {
        console.error("Error stripping markdown:", e);
        return markdown; // Fallback
    }
};

/**
 * A hook to manage speech synthesis, prioritizing a high-quality Gemini TTS service
 * and falling back to the browser's native Web Speech API.
 */
export const useEnhancedSpeech = () => {
    const isCloudTtsSupported = isTtsServiceConfigured();
    const isBrowserTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const isSupported = isCloudTtsSupported || isBrowserTtsSupported;
    
    const [isLoading, setIsLoading] = useState(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const activeSourcesRef = useRef(new Set<AudioBufferSourceNode>());
    const onEndCallbackRef = useRef<(() => void) | null>(null);
    const isCancelledRef = useRef(false);

    // Initialize AudioContext once for Gemini TTS
    useEffect(() => {
        if (isCloudTtsSupported && !audioContextRef.current) {
            try {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            } catch (e) {
                console.error("Could not create AudioContext:", e);
            }
        }
    }, [isCloudTtsSupported]);

    // Prime browser voices
    useEffect(() => {
        if (isBrowserTtsSupported) {
            window.speechSynthesis.getVoices();
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
              window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
            }
        }
    }, [isBrowserTtsSupported]);

    const cancel = useCallback(() => {
        isCancelledRef.current = true;
        if (isBrowserTtsSupported) {
            window.speechSynthesis.cancel();
        }
        
        activeSourcesRef.current.forEach(source => {
            try {
                source.onended = null;
                source.stop();
            } catch (e) { /* Already stopped */ }
            source.disconnect();
        });
        activeSourcesRef.current.clear();

        if (onEndCallbackRef.current) {
            onEndCallbackRef.current();
            onEndCallbackRef.current = null;
        }
        setIsLoading(false);
    }, [isBrowserTtsSupported]);
    
    useEffect(() => {
        return () => cancel();
    }, [cancel]);

    const speak = useCallback(async (text: string, lang: 'en' | 'ar', settings: UserProfile['ttsSettings'], onEnd: () => void) => {
        cancel(); 
        isCancelledRef.current = false;
        onEndCallbackRef.current = onEnd;

        const plainText = stripMarkdown(text);
        
        if (!isSupported || !plainText) {
            onEnd();
            return;
        }

        setIsLoading(true);
        
        const handleEnd = () => {
            if (!isCancelledRef.current && onEndCallbackRef.current) {
                onEndCallbackRef.current();
            }
            onEndCallbackRef.current = null;
            setIsLoading(false);
        };
        
        const useCloudTts = isCloudTtsSupported && settings.voice !== 'native' && audioContextRef.current;
        let cloudTtsFailed = false;
        
        if (useCloudTts) {
            try {
                const audioBase64 = await getSpeech(plainText, settings.voice);
                if (isCancelledRef.current) return; 
                
                const audioCtx = audioContextRef.current!;
                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume();
                }
                const audioBytes = decode(audioBase64);
                const audioBuffer = await decodeAudioData(audioBytes, audioCtx, 24000, 1);

                if (isCancelledRef.current) return;

                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.playbackRate.value = settings.rate;
                source.detune.value = (settings.pitch - 1) * 600; // Pitch adjustment for Web Audio API
                source.connect(audioCtx.destination);
                
                source.onended = () => {
                    activeSourcesRef.current.delete(source);
                    handleEnd();
                };

                source.start();
                activeSourcesRef.current.add(source);
                setIsLoading(false); // Playback has started

            } catch (error) {
                console.error('Cloud TTS failed, falling back to native.', error);
                cloudTtsFailed = true;
            }
        } 
        
        if (!useCloudTts || cloudTtsFailed) {
            if (isBrowserTtsSupported) {
                try {
                    if (isCancelledRef.current) return;
                    
                    const utterance = new SpeechSynthesisUtterance(plainText);
                    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
                    utterance.pitch = settings.pitch;
                    utterance.rate = settings.rate;
                    
                    const voices = window.speechSynthesis.getVoices();
                    let voice: SpeechSynthesisVoice | undefined;

                    if (lang === 'ar') {
                        voice = voices.find(v => v.lang.startsWith('ar'));
                    } else {
                        // Only apply gender logic if falling back from a specific Gemini voice
                        if (cloudTtsFailed) {
                            const isMaleGeminiVoice = ['Zephyr', 'Fenrir', 'Charon'].includes(settings.voice);
                            voice = voices.find(v => v.lang.startsWith('en') && (isMaleGeminiVoice ? /male/i.test(v.name) : /female/i.test(v.name)));
                        }

                        // If no gender-specific voice is found, or if 'native' was selected, use a fallback sequence.
                        if (!voice) {
                            voice = voices.find(v => v.lang.startsWith('en') && v.default) ||
                                    voices.find(v => v.lang.startsWith('en') && /google/i.test(v.name)) || 
                                    voices.find(v => v.lang.startsWith('en'));
                        }
                    }
                    
                    if (voice) utterance.voice = voice;
                    
                    utterance.onend = handleEnd;
                    utterance.onerror = (e) => {
                        console.error('SpeechSynthesis Error:', e.error);
                        handleEnd();
                    };
                    
                    window.speechSynthesis.speak(utterance);
                    setIsLoading(false);

                } catch (error) {
                    console.error('Native TTS also failed:', error);
                    handleEnd();
                }
            } else {
                 handleEnd();
            }
        }
    }, [isSupported, isCloudTtsSupported, isBrowserTtsSupported, cancel]);
    
    return { speak, cancel, isSupported, isLoading };
};