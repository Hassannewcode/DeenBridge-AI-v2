import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { analyzeQuranTopic } from '../services/quranAnalysisService';
import type { QuranAnalysisResult, ScripturalResult, UserProfile } from '../types';
import { CloseIcon, LoadingSpinner } from './icons';
import { useLocale } from '../contexts/LocaleContext';
import QuranVerseCard from './cards/QuranVerseCard';
import MarkdownRenderer from './MarkdownRenderer';

interface QuranSearchProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

const QuranSearch: React.FC<QuranSearchProps> = ({ isOpen, onClose, profile }) => {
  const [query, setQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<QuranAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setAnalysisResult(null);
    
    try {
      const data = await analyzeQuranTopic(query);
      setAnalysisResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to perform analysis. Please try again.");
      setAnalysisResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in-up"
      style={{ animationDuration: '0.3s' }}
      onClick={onClose}
    >
      <div
        className="quran-reader-modal" // Re-using styles for consistency
        onClick={e => e.stopPropagation()}
      >
        <aside className="quran-reader-nav flex flex-col">
          <header className="p-4 border-b border-[var(--color-border)] flex-shrink-0 flex items-center justify-between">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">{t('quranSearchTitle')}</h1>
             <button onClick={onClose} className="p-2 -mr-2 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90 lg:hidden">
              <CloseIcon />
            </button>
          </header>
          <div className="p-4">
            <form onSubmit={handleSearch}>
                <label htmlFor="quran-analysis-search" className="text-sm font-semibold text-[var(--color-text-secondary)]">Search by Topic</label>
                <input
                    ref={searchInputRef}
                    id="quran-analysis-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={t('quranSearchPlaceholder')}
                    className="mt-2 w-full px-4 py-2.5 text-base bg-[var(--color-card-bg)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                />
                <button type="submit" className="mt-3 w-full text-center px-4 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-inverted)] rounded-lg font-semibold transition-colors active:scale-95 disabled:from-slate-400 disabled:to-slate-500" disabled={isLoading}>
                    {isLoading ? t('loading') : t('search')}
                </button>
            </form>
          </div>
        </aside>

        <main className="quran-reader-main overflow-y-auto">
            <div className="p-4 md:p-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-center">
                        <LoadingSpinner />
                        <p className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">{t('analysis')}...</p>
                        <p className="text-sm text-[var(--color-text-subtle)]">The AI is analyzing the entire Qur'an for you.</p>
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500 p-4 bg-red-500/10 rounded-lg">{error}</div>
                ) : !hasSearched ? (
                     <div className="text-center text-[var(--color-text-subtle)] pt-16">
                        <p>Enter a topic to begin your Quranic analysis.</p>
                     </div>
                ) : analysisResult ? (
                    <div className="space-y-6 animate-fade-in-up">
                        <div>
                            <h2 className="text-2xl font-bold text-[var(--color-primary)] mb-2">{t('summary')}</h2>
                            <MarkdownRenderer content={analysisResult.topic_summary} />
                        </div>
                         <div>
                            <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">{t('statistics')}</h3>
                            <p className="text-[var(--color-text-secondary)] italic">{analysisResult.statistical_summary}</p>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[var(--color-primary)] mb-2">{t('relevantVerses')}</h3>
                            <div className="space-y-3">
                                {analysisResult.relevant_verses.map((verse, index) => {
                                    const result: ScripturalResult = {
                                        text: verse.arabic_text,
                                        source: {
                                            title: verse.surah_name,
                                            reference: `${verse.surah_number}:${verse.verse_number}`,
                                            author: 'N/A'
                                        }
                                    };
                                    return <QuranVerseCard key={`${verse.surah_number}-${verse.verse_number}`} result={result} index={index} profile={profile} />
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-[var(--color-text-subtle)] pt-16">
                        <p>No analysis found for "{query}". Try another topic.</p>
                    </div>
                )}
            </div>
        </main>
      </div>
    </div>,
    document.body
  );
};

export default QuranSearch;