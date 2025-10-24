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
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null); // To prevent GC
    const keepAliveIntervalRef = useRef<number | null>(null);

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
            if (utteranceRef.current) {
                utteranceRef.current.onend = null;
                utteranceRef.current.onerror = null;
            }
            window.speechSynthesis.cancel();
            utteranceRef.current = null;
        }

        if (keepAliveIntervalRef.current) {
            clearInterval(keepAliveIntervalRef.current);
            keepAliveIntervalRef.current = null;
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
    
    const cancelRef = useRef(cancel);
    useEffect(() => {
        cancelRef.current = cancel;
    }, [cancel]);

    useEffect(() => {
        const handleBeforeUnload = () => {
            cancelRef.current();
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        // This function is returned and will be called only on unmount.
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            cancelRef.current();
        };
    }, []);

    const speak = useCallback(async (
        text: string, 
        lang: 'en' | 'ar', 
        settings: UserProfile['ttsSettings'], 
        onEnd: () => void,
        onError: (error: string) => void
    ) => {
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

        const handleError = (errorMsg: string, e?: any) => {
            if (e) console.error('Speech Synthesis Error:', e);
            if (!isCancelledRef.current) {
                onError(errorMsg);
            }
            handleEnd();
        };
        
        const useCloudTts = isCloudTtsSupported && settings.voice !== 'native' && audioContextRef.current;
        
        if (useCloudTts) {
            try {
                const audioBase64 = await getSpeech(plainText, settings.voice, lang);
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
                const pitchInCents = (settings.pitch - 1) * 600;
                source.detune.value = pitchInCents;
                source.connect(audioCtx.destination);
                
                source.onended = () => {
                    activeSourcesRef.current.delete(source);
                    handleEnd();
                };

                source.start();
                activeSourcesRef.current.add(source);
                setIsLoading(false); // Playback has started

            } catch (error) {
                handleError('Cloud TTS service failed. Please try again later.', error);
            }
        } else { // Fallback to native only if 'native' is selected or cloud is unsupported
            if (isBrowserTtsSupported) {
                try {
                    if (isCancelledRef.current) return;
                    
                    const utterance = new SpeechSynthesisUtterance(plainText);
                    utteranceRef.current = utterance; // Prevent garbage collection
                    utterance.lang = lang === 'ar' ? 'ar-SA' : 'en-US';
                    utterance.pitch = settings.pitch;
                    utterance.rate = settings.rate;
                    
                    const voices = window.speechSynthesis.getVoices();
                    let voice: SpeechSynthesisVoice | undefined;

                    if (lang === 'ar') {
                        voice = voices.find(v => v.lang.startsWith('ar'));
                    } else {
                        // Just find a default english voice if native is selected
                        voice = voices.find(v => v.lang.startsWith('en') && v.default) || 
                                voices.find(v => v.lang.startsWith('en'));
                    }
                    
                    if (voice) utterance.voice = voice;
                    
                    utterance.onend = () => {
                        if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
                        utteranceRef.current = null;
                        handleEnd();
                    };
                    utterance.onerror = (e) => {
                        if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
                        handleError(`Speech synthesis failed: ${e.error || 'Unknown error'}. Your browser's speech engine may be having issues.`, e);
                    };
                    
                    window.speechSynthesis.speak(utterance);
                    
                    // Keep-alive interval to prevent speech from cutting out
                    if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
                    keepAliveIntervalRef.current = window.setInterval(() => {
                        if (window.speechSynthesis.speaking) {
                            window.speechSynthesis.pause();
                            window.speechSynthesis.resume();
                        } else {
                            if (keepAliveIntervalRef.current) clearInterval(keepAliveIntervalRef.current);
                        }
                    }, 10000); // every 10 seconds

                    setIsLoading(false);

                } catch (error) {
                    handleError('Native TTS failed to start.', error);
                }
            } else {
                 handleEnd();
            }
        }
    }, [isSupported, isCloudTtsSupported, isBrowserTtsSupported, cancel]);
    
    return { speak, cancel, isSupported, isLoading };
};