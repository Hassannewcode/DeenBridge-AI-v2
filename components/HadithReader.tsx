import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { searchHadiths } from '../services/hadithService';
import type { Hadith } from '../services/hadithService';
import { CloseIcon, LoadingSpinner } from './icons';

interface HadithResultCardProps {
    hadith: Hadith;
}

const HadithResultCard: React.FC<HadithResultCardProps> = ({ hadith }) => {
    return (
        <div className="p-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-lg mb-4">
            <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-2">{hadith.title}</h3>
            <p dir="rtl" lang="ar" className="font-amiri text-xl text-right text-[var(--color-text-primary)] leading-relaxed mb-3">{hadith.arabic}</p>
            {hadith.english && <p className="text-[var(--color-text-secondary)] mb-3">{hadith.english}</p>}
            <p className="text-xs text-[var(--color-text-subtle)] italic">{hadith.attribution}</p>
        </div>
    );
};

interface HadithReaderProps {
  isOpen: boolean;
  onClose: () => void;
  setToastInfo: (info: { message: string, type: 'success' | 'error' } | null) => void;
}

const QuranSearch: React.FC<HadithReaderProps> = ({ isOpen, onClose, setToastInfo }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Hadith[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);

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
    
    try {
      // The service now searches the local Quran text
      const data = await searchHadiths(query);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "Failed to perform search. Please try again.");
      setResults([]);
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
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">Quran Search</h1>
             <button onClick={onClose} className="p-2 -mr-2 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90 lg:hidden">
              <CloseIcon />
            </button>
          </header>
          <div className="p-4">
            <form onSubmit={handleSearch}>
                <label htmlFor="hadith-search" className="text-sm font-semibold text-[var(--color-text-secondary)]">Search Quran (Arabic)</label>
                <input
                    ref={searchInputRef}
                    id="hadith-search"
                    dir="rtl"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., الصلاة, الرحمن, الجنة..."
                    className="mt-2 w-full px-4 py-2.5 text-base bg-[var(--color-card-bg)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                />
                <button type="submit" className="mt-3 w-full text-center px-4 py-2.5 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-inverted)] rounded-lg font-semibold transition-colors active:scale-95">
                    Search
                </button>
            </form>
          </div>
        </aside>

        <main className="quran-reader-main overflow-y-auto">
            <div className="p-4 md:p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64">
                        <LoadingSpinner />
                    </div>
                ) : error ? (
                    <div className="text-center text-red-500">{error}</div>
                ) : !hasSearched ? (
                     <div className="text-center text-[var(--color-text-subtle)] pt-16">
                        <p>Enter an Arabic keyword to search the Qur'an.</p>
                     </div>
                ) : results.length > 0 ? (
                    <div>
                        <p className="text-sm text-[var(--color-text-subtle)] mb-4">Found {results.length} results for "{query}".</p>
                        {results.map((hadith) => (
                            <HadithResultCard key={hadith.id} hadith={hadith} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-[var(--color-text-subtle)] pt-16">
                        <p>No results found for "{query}". Try another search term.</p>
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