import React, { useState, useCallback, useMemo } from 'react';
import { CloseIcon, LoadingSpinner } from './icons';
import { getSurahOverview, processFullSurah } from '../services/geminiService';
import { Surah, Ayah } from '../types';
import { SURAH_INFO } from '../data/surah-info';
import { LANGUAGES } from '../data/languages';
import { useLocale } from '../contexts/LocaleContext';
import MarkdownRenderer from './MarkdownRenderer';

interface SurahInfoPanelProps {
    surah: Surah;
    surahInfo: typeof SURAH_INFO[0];
    onClose: () => void;
}

const SurahInfoPanel: React.FC<SurahInfoPanelProps> = ({ surah, surahInfo, onClose }) => {
    const { t } = useLocale();
    const [overview, setOverview] = useState<string | null>(null);
    const [isOverviewLoading, setIsOverviewLoading] = useState(false);
    const [overviewError, setOverviewError] = useState<string | null>(null);

    const [translation, setTranslation] = useState<string | null>(null);
    const [isTranslationLoading, setIsTranslationLoading] = useState(false);
    const [translationError, setTranslationError] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState('');
    
    const [transliteration, setTransliteration] = useState<string | null>(null);
    const [isTransliterationLoading, setIsTransliterationLoading] = useState(false);
    const [transliterationError, setTransliterationError] = useState<string | null>(null);

    const handleGetOverview = useCallback(async () => {
        setIsOverviewLoading(true);
        setOverviewError(null);
        try {
            const result = await getSurahOverview(surahInfo.name, surahInfo.number);
            setOverview(result);
        } catch (err: any) {
            setOverviewError(err.message || "Failed to fetch overview.");
        } finally {
            setIsOverviewLoading(false);
        }
    }, [surahInfo]);

    const handleGetTranslation = useCallback(async (language: string) => {
        if (!language) return;
        setSelectedLanguage(language);
        setIsTranslationLoading(true);
        setTranslationError(null);
        try {
            const result = await processFullSurah(surah, 'translate', language);
            setTranslation(result);
        } catch (err: any) {
            setTranslationError(err.message || "Failed to fetch translation.");
        } finally {
            setIsTranslationLoading(false);
        }
    }, [surah]);
    
    const handleGetTransliteration = useCallback(async () => {
        setIsTransliterationLoading(true);
        setTransliterationError(null);
        try {
            const result = await processFullSurah(surah, 'transliterate');
            setTransliteration(result);
        } catch (err: any) {
            setTransliterationError(err.message || "Failed to fetch transliteration.");
        } finally {
            setIsTransliterationLoading(false);
        }
    }, [surah]);

    const renderCollapsibleSection = (
        title: string,
        isLoading: boolean,
        error: string | null,
        content: string | null,
        actionElement: React.ReactNode,
        contentRenderer: (content: string) => React.ReactNode
    ) => (
        <details className="border-t border-[var(--color-border)] pt-4">
            <summary className="font-bold text-[var(--color-text-primary)] cursor-pointer list-outside">
                {title}
            </summary>
            <div className="mt-2 pl-2">
                {isLoading ? (
                    <div className="flex items-center gap-2 text-[var(--color-text-subtle)] p-2">
                        <LoadingSpinner /> <span>{t('loading')}</span>
                    </div>
                ) : error ? (
                    <p className="text-xs text-red-500 p-2">{error}</p>
                ) : content ? (
                    <div className="p-2 bg-[var(--color-card-quran-bg)] rounded text-sm">
                        {contentRenderer(content)}
                    </div>
                ) : (
                    actionElement
                )}
            </div>
        </details>
    );

    return (
        <div className="quran-info-panel open" onClick={e => e.stopPropagation()}>
            <header className="p-4 border-b border-[var(--color-border)] flex-shrink-0 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{t('surahInfo')}: {surahInfo.name}</h2>
                <button onClick={onClose} className="p-2 -mr-2 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90">
                    <CloseIcon />
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-sm space-y-1 text-[var(--color-text-secondary)]">
                    <p><strong>{t('meaning')}:</strong> {surahInfo.name_meaning}</p>
                    <p><strong>{t('revelation')}:</strong> {surahInfo.revelationType}</p>
                    <p><strong>{t('verses')}:</strong> {surahInfo.totalVerses}</p>
                </div>
                
                {renderCollapsibleSection(
                    t('surahOverview'),
                    isOverviewLoading,
                    overviewError,
                    overview,
                    <button onClick={handleGetOverview} className="w-full text-center px-4 py-2 text-sm bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_50%)] rounded-lg transition-colors font-semibold active:scale-95">{t('getOverview')}</button>,
                    (content) => <MarkdownRenderer content={content} />
                )}

                {renderCollapsibleSection(
                    t('fullTranslation'),
                    isTranslationLoading,
                    translationError,
                    translation,
                    <select value={selectedLanguage} onChange={e => handleGetTranslation(e.target.value)} className="w-full px-3 py-2 text-sm bg-[var(--color-card-bg)] border rounded-lg focus:outline-none focus:ring-2 text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] custom-select">
                        <option value="">{t('selectLanguage')}</option>
                        {LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>,
                    (content) => <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
                )}

                {renderCollapsibleSection(
                    t('fullTransliteration'),
                    isTransliterationLoading,
                    transliterationError,
                    transliteration,
                     <button onClick={handleGetTransliteration} className="w-full text-center px-4 py-2 text-sm bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_50%)] rounded-lg transition-colors font-semibold active:scale-95">{t('showTransliteration')}</button>,
                    (content) => <p className="whitespace-pre-wrap leading-relaxed font-mono text-xs">{content}</p>
                )}

            </div>
        </div>
    );
};

export default SurahInfoPanel;