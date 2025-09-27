import React, { useEffect } from 'react';
import type { ScripturalResult, UserProfile } from '../../types';
import { QuranIcon } from '../icons';
import { useTranslation } from '../../hooks/useTranslation';
import TranslationMenu from '../TranslationMenu';
import { useLocale } from '../../contexts/LocaleContext';

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
    const { t } = useLocale();

    useEffect(() => {
        // Automatically translate to the user's default language upon first view.
        if (profile.translationLanguage && !translation) {
            translate(profile.translationLanguage);
        }
    }, []); // Run only once on mount

    const handleCopy = () => {
        const citation = `${result.source.title} ${result.source.reference}`;
        let textToCopy = `"${result.text}"\n\n`;
        if (translation) {
            textToCopy += `${translation.lang} Translation: "${translation.text}"\n\n`;
        }
        if (transliteration) {
            textToCopy += `Transliteration: "${transliteration}"\n\n`;
        }
        textToCopy += `- ${citation}`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            alert(t('copiedToClipboard'));
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy text.');
        });
    };

    const handleShare = async () => {
        if (!navigator.share) return;
        const citation = `${result.source.title} ${result.source.reference}`;
        let textToShare = `"${result.text}"\n\n`;
        if (translation) {
            textToShare += `${translation.lang} Translation: "${translation.text}"\n\n`;
        }
        if (transliteration) {
            textToShare += `Transliteration: "${transliteration}"\n\n`;
        }
        textToShare += `- ${citation}`;

        try {
            await navigator.share({
                title: `Qur'an Verse: ${citation}`,
                text: textToShare,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return (
        <div key={`quran-${index}`} className="mt-2 p-3 rounded-lg bg-[var(--color-card-quran-bg)] border border-[var(--color-card-quran-border)] relative overflow-hidden quran-card-bg">
            <p dir="rtl" lang="ar" className="qr-ayah-text text-right text-[var(--color-text-primary)] leading-relaxed mb-2" style={{fontSize: '1.5rem', lineHeight: '2.5'}}>
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
                        onCopy={handleCopy}
                        onShare={handleShare}
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