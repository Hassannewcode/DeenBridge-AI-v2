

import React, { useState, useCallback, useMemo, useEffect } from 'react';
// FIX: Import BookmarkIcon and BookmarkFilledIcon
import { CloseIcon, BookmarkIcon, BookmarkFilledIcon, LoadingSpinner } from './icons';
import TranslationMenu from './TranslationMenu';
import { useTranslation } from '../hooks/useTranslation';
import { getVerseTafsir } from '../services/geminiService';
import { SURAH_INFO } from '../data/surah-info';
// Fix: Import Surah, Ayah, and QuranBookmark from the central types file.
import type { Surah, Ayah, UserProfile, QuranBookmark } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import MarkdownRenderer from './MarkdownRenderer';

interface QuranInfoPanelProps {
    surah: Surah;
    ayah: Ayah;
    profile: UserProfile;
    onClose: () => void;
    bookmarks: QuranBookmark[];
    onToggleBookmark: (surahNum: number, ayahNum: number) => void;
}

const QuranInfoPanel: React.FC<QuranInfoPanelProps> = ({ surah, ayah, profile, onClose, bookmarks, onToggleBookmark }) => {
    const { t } = useLocale();
    const [tafsir, setTafsir] = useState<string | null>(null);
    const [isTafsirLoading, setIsTafsirLoading] = useState(false);
    const [tafsirError, setTafsirError] = useState<string | null>(null);

    const { 
        translation, transliteration, isLoading: isTranslationLoading, 
        translate, transliterate, hideTranslation, hideTransliteration
    } = useTranslation(ayah.text);

    const surahInfo = useMemo(() => SURAH_INFO.find(s => s.number === surah.number), [surah.number]);
    const isBookmarked = useMemo(() => bookmarks.some(b => b.surahNumber === surah.number && b.ayahNumber === ayah.number), [bookmarks, surah, ayah]);

    const handleGetTafsir = useCallback(async () => {
        if (!surahInfo) return;
        setIsTafsirLoading(true);
        setTafsirError(null);
        try {
            const commentary = await getVerseTafsir(surahInfo.name, ayah.number, ayah.text);
            setTafsir(commentary);
        } catch (err: any) {
            setTafsirError(err.message || "Failed to fetch Tafsir.");
        } finally {
            setIsTafsirLoading(false);
        }
    }, [surahInfo, ayah]);

    const handleCopy = useCallback(() => {
        const citation = `${surahInfo?.name} ${surah.number}:${ayah.number}`;
        let textToCopy = `"${ayah.text}" (${citation})\n\n`;
        if (translation) textToCopy += `${translation.lang} Translation: "${translation.text}"\n\n`;
        if (transliteration) textToCopy += `Transliteration: "${transliteration}"\n\n`;
        if (tafsir) textToCopy += `Tafsir: ${tafsir}`;
        navigator.clipboard.writeText(textToCopy).then(() => alert(t('copiedToClipboard')));
    }, [ayah, surah, surahInfo, translation, transliteration, tafsir, t]);

    const handleShare = useCallback(async () => {
        if (!navigator.share) return;
        const citation = `${surahInfo?.name} ${surah.number}:${ayah.number}`;
        let textToShare = `"${ayah.text}" (${citation})\n\n`;
        if (translation) textToShare += `${translation.lang} Translation: "${translation.text}"`;
        await navigator.share({ title: `Qur'an ${citation}`, text: textToShare });
    }, [ayah, surah, surahInfo, translation]);
    
    // Fix: Reset tafsir when ayah changes
    useEffect(() => {
        setTafsir(null);
        setTafsirError(null);
    }, [ayah]);

    return (
        <div className="quran-info-panel open" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <header className="p-4 border-b border-[var(--color-border)] flex-shrink-0 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{surahInfo?.name}: {ayah.number}</h2>
                <button onClick={onClose} className="p-2 -mr-2 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90">
                    <CloseIcon />
                </button>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="p-3 rounded-lg bg-[var(--color-card-quran-bg)] border border-[var(--color-card-quran-border)] quran-card-bg">
                    <p dir="rtl" lang="ar" className="qr-ayah-text text-right text-[var(--color-text-primary)] leading-relaxed" style={{ fontSize: '1.5rem', lineHeight: '2.5' }}>{ayah.text}</p>
                </div>

                <div className="flex items-center justify-between bg-[var(--color-card-bg)] p-1 rounded-full border border-[var(--color-border)]">
                    <button onClick={() => onToggleBookmark(surah.number, ayah.number)} className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-accent)] rounded-full hover:bg-[var(--color-border)] transition-colors flex items-center gap-1.5 text-xs font-semibold">
                         {isBookmarked ? <BookmarkFilledIcon className="w-4 h-4 text-[var(--color-accent)]" /> : <BookmarkIcon className="w-4 h-4" />}
                    </button>
                     <TranslationMenu
                        isLoading={isTranslationLoading}
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
                    <div className="p-2 bg-[var(--color-card-bg)] rounded text-sm text-[var(--color-text-secondary)] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
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
                
                <div className="border-t border-[var(--color-border)] pt-4">
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-2">{t('surahInfo')}</h3>
                    <div className="text-sm space-y-1 text-[var(--color-text-secondary)]">
                        <p><strong>{t('meaning')}:</strong> {surahInfo?.name_meaning}</p>
                        <p><strong>{t('revelation')}:</strong> {surahInfo?.revelationType}</p>
                        <p><strong>{t('verses')}:</strong> {surahInfo?.totalVerses}</p>
                    </div>
                </div>

                <div className="border-t border-[var(--color-border)] pt-4">
                    <h3 className="font-bold text-[var(--color-text-primary)] mb-2">{t('tafsir')}</h3>
                    { tafsir ? (
                         <div className="p-2 bg-[var(--color-card-quran-bg)] rounded">
                            <MarkdownRenderer content={tafsir} />
                         </div>
                    ) : isTafsirLoading ? (
                        <div className="flex items-center gap-2 text-[var(--color-text-subtle)]">
                            <LoadingSpinner />
                            <span>{t('tafsirLoading')}</span>
                        </div>
                    ) : (
                        <>
                            <button onClick={handleGetTafsir} className="w-full text-center px-4 py-2 text-sm bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_50%)] rounded-lg transition-colors font-semibold active:scale-95">
                                {t('getTafsir')}
                            </button>
                            {tafsirError && <p className="text-xs text-red-500 mt-2">{tafsirError}</p>}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default QuranInfoPanel;