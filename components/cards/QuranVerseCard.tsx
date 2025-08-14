import React, { useEffect } from 'react';
import type { ScripturalResult, UserProfile } from '../../types';
import { QuranIcon } from '../icons';
import { useTranslation } from '../../hooks/useTranslation';
import TranslationMenu from '../TranslationMenu';

const QuranVerseCard: React.FC<{ result: ScripturalResult; index: number; profile: UserProfile }> = ({ result, index, profile }) => {
    const { 
        translation, 
        transliteration, 
        isLoading, 
        translate, 
        transliterate,
        hideTranslation,
        hideTransliteration,
    } = useTranslation(result.text);

    useEffect(() => {
        // Automatically translate to the user's default language upon first view.
        if (profile.translationLanguage && !translation) {
            translate(profile.translationLanguage);
        }
    }, []); // Run only once on mount

    return (
        <div key={`quran-${index}`} className="mt-2 p-3 rounded-lg bg-[var(--color-card-quran-bg)] border border-[var(--color-card-quran-border)] relative overflow-hidden quran-card-bg">
            <p dir="rtl" lang="ar" className="font-amiri text-xl text-right text-[var(--color-text-primary)] leading-relaxed mb-2">
                {result.text}
            </p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                    <div className="w-5 h-5">
                      <QuranIcon />
                    </div>
                    <span className="font-semibold">{result.source.title}</span>
                    <span>({result.source.reference})</span>
                </div>
            </div>
            <div className="mt-3 pt-2 border-t border-[color:rgb(from_var(--color-border)_r_g_b_/_50%)]">
                <div className="flex items-center justify-end">
                    <TranslationMenu
                        isLoading={isLoading}
                        translation={translation}
                        transliteration={transliteration}
                        onTranslate={translate}
                        onTransliterate={transliterate}
                        onHideTranslation={hideTranslation}
                        onHideTransliteration={hideTransliteration}
                    />
                </div>
                
                {translation && (
                    <div className="mt-2 p-2 bg-[var(--color-card-bg)] rounded text-sm text-[var(--color-text-secondary)] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                        <p className="font-semibold text-[var(--color-text-primary)]">{translation.lang} Translation:</p>
                        <p className="italic">"{translation.text}"</p>
                    </div>
                )}
                {transliteration && (
                    <div className="mt-2 p-2 bg-[var(--color-card-bg)] rounded text-sm text-[var(--color-text-secondary)] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                        <p className="font-semibold text-[var(--color-text-primary)]">Transliteration:</p>
                        <p className="italic">{transliteration}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuranVerseCard;