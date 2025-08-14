import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontalIcon, CheckIcon } from './icons';
import { LANGUAGES } from '../data/languages';
import { useClickOutside } from '../hooks/useClickOutside';

interface TranslationMenuProps {
  isLoading: string | null;
  translation: { lang: string; text: string } | null;
  transliteration: string | null;
  onTranslate: (language: string) => void;
  onTransliterate: () => void;
  onHideTranslation: () => void;
  onHideTransliteration: () => void;
}

const TranslationMenu: React.FC<TranslationMenuProps> = ({
  isLoading,
  translation,
  transliteration,
  onTranslate,
  onTransliterate,
  onHideTranslation,
  onHideTransliteration,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useClickOutside(() => setIsOpen(false));
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      // Focus search input when menu opens
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
        setSearch(''); // Reset search on close
    }
  }, [isOpen]);

  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(search.toLowerCase())
  );

  const handleLanguageClick = (lang: string) => {
    onTranslate(lang);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="p-1 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreHorizontalIcon />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-[var(--color-modal-bg)] border border-[var(--color-border)] rounded-lg shadow-2xl z-20 animate-fade-in-up" style={{animationDuration: '0.2s'}}>
          <div className="p-2">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search language..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-sm text-[var(--color-text-primary)]"
            />
          </div>
          <ul className="max-h-60 overflow-y-auto text-sm">
             {translation && (
              <li>
                <button onClick={() => { onHideTranslation(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-red-500 hover:bg-[var(--color-border)]">Hide Translation</button>
              </li>
             )}
            {transliteration ? (
                 <li>
                    <button onClick={() => { onHideTransliteration(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-red-500 hover:bg-[var(--color-border)]">Hide Transliteration</button>
                </li>
            ) : (
                <li>
                    <button onClick={() => { onTransliterate(); setIsOpen(false); }} className="w-full text-left px-3 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]">Transliterate</button>
                </li>
            )}
             <li className="h-px bg-[var(--color-border)] my-1"></li>
            {filteredLanguages.map(lang => (
              <li key={lang}>
                <button
                  onClick={() => handleLanguageClick(lang)}
                  className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[var(--color-border)] ${translation?.lang === lang ? 'font-bold text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
                >
                  <span>{isLoading === lang ? "Loading..." : lang}</span>
                  {translation?.lang === lang && <CheckIcon className="w-4 h-4 text-[var(--color-accent)]" />}
                </button>
              </li>
            ))}
             {filteredLanguages.length === 0 && <li className="px-3 py-2 text-center text-xs text-[var(--color-text-subtle)]">No languages found.</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default TranslationMenu;
