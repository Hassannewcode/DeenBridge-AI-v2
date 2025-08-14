import { useState, useCallback } from 'react';
import { getGenerativeText } from '../services/geminiService';

export const useTranslation = (originalText: string) => {
    const [translation, setTranslation] = useState<{ lang: string; text: string } | null>(null);
    const [transliteration, setTransliteration] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<string | null>(null); // Use string to store language being loaded or "transliterate"

    const translate = useCallback(async (language: string) => {
        if (isLoading) return;

        setIsLoading(language);
        setTransliteration(null); // Clear transliteration

        try {
            const prompt = `Provide a scholarly, concise translation of the following Arabic text into ${language}. Do not add any commentary, interpretation, or introductory phrases. Translate the text directly.\n\nText to translate: "${originalText}"`;
            const response = await getGenerativeText(prompt);
            setTranslation({ lang: language, text: response });
        } catch (error) {
            console.error(`Error translating to ${language}:`, error);
            setTranslation({ lang: language, text: "Sorry, translation failed." });
        } finally {
            setIsLoading(null);
        }
    }, [originalText, isLoading]);

    const transliterate = useCallback(async () => {
        if (isLoading) return;
        
        setIsLoading('transliterate');
        setTranslation(null); // Clear translation
        
        try {
            const prompt = `Provide a scholarly, easy-to-read English transliteration (romanization) for the following Arabic text. Do not provide a translation or any explanation, only the transliterated text.\n\n"${originalText}"`;
            const response = await getGenerativeText(prompt);
            setTransliteration(response);
        } catch (error) {
            console.error("Error transliterating:", error);
            setTransliteration("Sorry, transliteration failed.");
        } finally {
            setIsLoading(null);
        }
    }, [originalText, isLoading]);

    const hideTranslation = useCallback(() => setTranslation(null), []);
    const hideTransliteration = useCallback(() => setTransliteration(null), []);
    
    return {
        translation,
        transliteration,
        isLoading,
        translate,
        transliterate,
        hideTranslation,
        hideTransliteration,
    };
};