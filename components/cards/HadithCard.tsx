import React, { useEffect } from 'react';
import type { ScripturalResult, UserProfile } from '../../types';
import { BookIcon, ShieldCheckIcon } from '../icons';
import { useTranslation } from '../../hooks/useTranslation';
import TranslationMenu from '../TranslationMenu';
import { useLocale } from '../../contexts/LocaleContext';

const HadithCard: React.FC<{ result: ScripturalResult; index: number; isTrusted: boolean; profile: UserProfile }> = ({ result, index, isTrusted, profile }) => {
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
                title: `Hadith: ${citation}`,
                text: textToShare,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };


    return (
        <div key={`hadith-${index}`} className="mt-2 p-3 rounded-lg bg-[var(--color-card-bg)] border border-[var(--color-border)] shadow-sm">
            <blockquote className="text-[var(--color-text-secondary)] italic border-l-4 border-[var(--color-border)] pl-3 mb-2">
                "{result.text}"
            </blockquote>
            <div className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)]">
                <div className="w-5 h-5 flex-shrink-0 text-[var(--color-text-subtle)] mt-0.5"><BookIcon /></div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-[var(--color-text-primary)]">{result.source.title}</p>
                        {isTrusted && (
                            <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full" title="This source is from a pre-vetted, trusted collection.">
                                <ShieldCheckIcon className="w-3 h-3" />
                                Trusted
                            </span>
                        )}
                    </div>
                    <p className="text-xs">{result.source.reference}</p>
                    {result.source.author && result.source.author !== 'N/A' && <p className="text-xs italic">- {result.source.author}</p>}
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
                    <div className="mt-2 p-2 bg-[var(--color-card-quran-bg)] rounded text-sm text-[var(--color-text-secondary)] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                        <p className="font-semibold text-[var(--color-text-primary)]">{translation.lang} Translation:</p>
                        <p className="italic">"{translation.text}"</p>
                    </div>
                )}
                {transliteration && (
                    <div className="mt-2 p-2 bg-[var(--color-card-quran-bg)] rounded text-sm text-[var(--color-text-secondary)] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                        <p className="font-semibold text-[var(--color-text-primary)]">Transliteration:</p>
                        <p className="italic">{transliteration}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HadithCard;