
import { useCallback, useRef, useEffect } from 'react';
import { marked } from 'marked';
import { getSpeech, isTtsServiceConfigured } from '../services/ttsService';

// This custom renderer for Marked helps to convert Markdown into clean, speakable plain text.
// It removes visual elements like images and links, and formats lists for natural flow.
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
 * @param {string} markdown - The markdown-formatted string.
 * @returns {string} The plain text version of the string.
 */
const stripMarkdown = (markdown: string): string => {
    try {
        const plainText = marked.parse(markdown, { renderer: textRenderer });
        // Clean up extra newlines and spaces for a more natural reading flow
        return plainText.replace(/(\n\s*){2,}/g, '\n').trim();
    } catch (e) {
        console.error("Error stripping markdown:", e);
        return markdown; // Fallback to original text on error
    }
};


/**
 * A hook to manage speech synthesis. It prioritizes a high-quality serverless TTS function
 * but robustly falls back to the browser's native Web Speech API if the service is not configured.
 * This ensures TTS functionality is available to all users.
 */
export const useEnhancedSpeech = () => {
    const isCloudTtsSupported = isTtsServiceConfigured();
    const isBrowserTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const isSupported = isCloudTtsSupported || isBrowserTtsSupported;

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const onEndCallbackRef = useRef<(() => void) | null>(null);

    // Ensure voices are loaded for browser TTS, which can be asynchronous.
    useEffect(() => {
        if (isBrowserTtsSupported) {
            window.speechSynthesis.getVoices(); // Prime the voice list
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
              window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
            }
        }
    }, [isBrowserTtsSupported]);

    const cleanupAudio = useCallback(() => {
        if (audioRef.current && onEndCallbackRef.current) {
            const callback = onEndCallbackRef.current;
            audioRef.current.removeEventListener('ended', callback);
            audioRef.current.removeEventListener('error', callback);
            audioRef.current.pause();
            audioRef.current.src = ''; 
            audioRef.current = null;
        }
    }, []);

    const cancel = useCallback(() => {
        if (isBrowserTtsSupported) window.speechSynthesis.cancel();
        
        const onEnd = onEndCallbackRef.current;
        cleanupAudio();
        if (onEnd) {
            onEnd();
            onEndCallbackRef.current = null;
        }
    }, [cleanupAudio, isBrowserTtsSupported]);
    
    const speak = useCallback(async (text: string, lang: 'en' | 'ar', onEnd: () => void) => {
        if (!isSupported || !text) {
            if (onEnd) onEnd();
            return;
        }
        
        cancel(); // Cancel any ongoing speech
        onEndCallbackRef.current = onEnd;

        const plainText = stripMarkdown(text);
        
        const handleEnd = () => {
            if (onEndCallbackRef.current) {
                onEndCallbackRef.current();
            }
            onEndCallbackRef.current = null;
            cleanupAudio();
            utteranceRef.current = null;
        };
        
        // Prioritize high-quality cloud TTS if configured
        if (isCloudTtsSupported) {
            try {
                const audioBase64 = await getSpeech(plainText, lang);
                // Check if a cancel request came in while we were fetching
                if (!onEndCallbackRef.current) return; 
                
                const audio = new Audio(`data:audio/mp3;base64,${audioBase64}`);
                audioRef.current = audio;
                
                audio.addEventListener('ended', handleEnd);
                audio.addEventListener('error', (e) => {
                    console.error('Audio playback error:', e);
                    handleEnd(); // Ensure state is cleaned up on error
                });
                
                await audio.play();
            } catch (error) {
                console.error('Failed to get speech from cloud service:', error);
                handleEnd(); // Clean up on failure
            }
        } 
        // Fallback to native browser TTS
        else if (isBrowserTtsSupported) {
            try {
                const utterance = new SpeechSynthesisUtterance(plainText);
                const languageCode = lang === 'ar' ? 'ar-SA' : 'en-US';
                utterance.lang = languageCode;
                utterance.rate = 0.95;
                utterance.pitch = 1.0;
                
                // Attempt to select a higher quality voice if available
                const voices = window.speechSynthesis.getVoices();
                let voice;
                if (lang === 'ar') {
                    voice = voices.find(v => v.lang.startsWith('ar'));
                } else {
                    voice = voices.find(v => v.lang.startsWith('en') && /google/i.test(v.name)) || voices.find(v => v.lang.startsWith('en'));
                }
                if (voice) utterance.voice = voice;
                
                utterance.onend = handleEnd;
                utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
                    console.error('SpeechSynthesis Error:', e.error);
                    handleEnd();
                };
                
                utteranceRef.current = utterance;
                window.speechSynthesis.speak(utterance);
            } catch (error) {
                console.error('Failed to use browser speech synthesis:', error);
                handleEnd();
            }
        } else {
             handleEnd(); // Should not happen if isSupported is checked, but for safety.
        }
    }, [isSupported, isCloudTtsSupported, isBrowserTtsSupported, cancel, cleanupAudio]);
    
    return { speak, cancel, isSupported };
};
