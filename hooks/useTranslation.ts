import { useState } from 'react';
import { getGenerativeText } from '../services/geminiService';

export const useTranslation = (originalText: string, type: 'quran' | 'hadith') => {
    const [translation, setTranslation] = useState<string | null>(null);
    const [isTranslationVisible, setIsTranslationVisible] = useState(false);
    const [transliteration, setTransliteration] = useState<string | null>(null);
    const [isTransliterationVisible, setIsTransliterationVisible] = useState(false);
    const [isLoading, setIsLoading] = useState<'translate' | 'transliterate' | null>(null);

    const toggleTranslation = async () => {
        if (isLoading) return;
        
        if (isTranslationVisible) {
            setIsTranslationVisible(false);
            return;
        }

        setIsTransliterationVisible(false); // Hide transliteration when showing translation
        setIsLoading('translate');
        
        if (!translation) {
            const prompt = `Provide a concise, scholarly English translation for the following ${type === 'quran' ? 'Quranic verse' : 'Hadith text'}. Do not add any commentary, interpretation, or introductory phrases. Translate the text directly.\n\nText to translate: "${originalText}"`;
            const response = await getGenerativeText(prompt);
            setTranslation(response);
        }
        
        setIsTranslationVisible(true);
        setIsLoading(null);
    };

    const toggleTransliteration = async () => {
        if (isLoading) return;

        if (isTransliterationVisible) {
            setIsTransliterationVisible(false);
            return;
        }

        setIsTranslationVisible(false); // Hide translation when showing transliteration
        setIsLoading('transliterate');

        if (!transliteration) {
            const prompt = `Provide a scholarly, easy-to-read English transliteration (romanization) for the following Arabic text. Do not provide a translation or any explanation, only the transliterated text.\n\n"${originalText}"`;
            const response = await getGenerativeText(prompt);
            setTransliteration(response);
        }

        setIsTransliterationVisible(true);
        setIsLoading(null);
    };
    
    return {
        translation,
        isTranslationVisible,
        transliteration,
        isTransliterationVisible,
        isLoading,
        toggleTranslation,
        toggleTransliteration,
    };
}