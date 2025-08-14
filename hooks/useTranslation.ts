import { useState } from 'react';
import { getGenerativeText } from '../services/geminiService';

interface TranslationState {
    lang: string;
    text: string;
}

export const useTranslation = (originalText: string, type: 'quran' | 'hadith') => {
    const [translation, setTranslation] = useState<TranslationState | null>(null);
    const [transliteration, setTransliteration] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<string | null>(null); // string will be the language or 'transliterate'

    const handleTranslate = async (language: string) => {
        if (isLoading) return;
        if (translation && translation.lang === language) return;
        
        setIsLoading(language);
        setTransliteration(null);
        const prompt = `Provide a concise, scholarly ${language} translation for the following ${type === 'quran' ? 'Quranic verse' : 'Hadith text'}. Do not add any commentary, interpretation, or introductory phrases. Translate the text directly.\n\nText to translate: "${originalText}"`;
        const response = await getGenerativeText(prompt);
        setTranslation({ lang: language, text: response });
        setIsLoading(null);
    };

    const handleTransliterate = async () => {
        if (isLoading || transliteration) return;

        setIsLoading('transliterate');
        setTranslation(null);
        const prompt = `Provide a scholarly, easy-to-read English transliteration (romanization) for the following Arabic text. Do not provide a translation or any explanation, only the transliterated text.\n\n"${originalText}"`;
        const response = await getGenerativeText(prompt);
        setTransliteration(response);
        setIsLoading(null);
    };

    const hideTranslation = () => {
        setTranslation(null);
    }

    const hideTransliteration = () => {
        setTransliteration(null);
    }
    
    return {
        translation,
        transliteration,
        isLoading,
        handleTranslate,
        handleTransliterate,
        hideTranslation,
        hideTransliteration,
    };
}