
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
// FIX: Import missing CopyIcon and ShareIcon
import { MoreHorizontalIcon, CheckIcon, CopyIcon, ShareIcon } from './icons';
import { LANGUAGES } from '../../data/languages';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useLocale } from '../../contexts/LocaleContext';

interface TranslationMenuProps {
  isLoading: string | null;
  translation: { lang: string; text: string } | null;
  transliteration: string | null;
  onTranslate: (language: string) => void;
  onTransliterate: () => void;
  onHideTranslation: () => void;
  onHideTransliteration: () => void;
  onCopy: () => void;
  onShare: () => void;
}

const TranslationMenu: React.FC<TranslationMenuProps> = ({
  isLoading,
  translation,
  transliteration,
  onTranslate,
  onTransliterate,
  onHideTranslation,
  onHideTransliteration,
  onCopy,
  onShare,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [style, setStyle] = useState<React.CSSProperties>({});
  const { t } = useLocale();
  
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useClickOutside([buttonRef, menuRef], () => {
    if (isOpen) setIsOpen(false);
  });

  useEffect(() => {
    if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        const menuHeight = 300; 
        const spaceBelow = window.innerHeight - rect.bottom;

        const top = (spaceBelow < menuHeight && rect.top > menuHeight) 
            ? rect.top - menuHeight - 8
            : rect.bottom + 8;

        const right = window.innerWidth - rect.right;

        setStyle({
            position: 'fixed',
            top: `${top}px`,
            right: `${right}px`,
            zIndex: 100
        });

        setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
        setSearch('');
    }
  }, [isOpen]);
  
  const handleAction = (action: (lang?: string) => void, lang?: string) => {
    if (lang) {
      action(lang);
    } else {
      (action as () => void)();
    }
    setIsOpen(false);
  };

  const filteredLanguages = LANGUAGES.filter(lang =>
    lang.toLowerCase().includes(search.toLowerCase())
  );
  
  const menuContent = (
    <div 
        ref={menuRef}
        className="translation-menu-portal w-64 bg-[var(--color-modal-bg)] border border-[var(--color-border)] rounded-lg shadow-2xl z-20 animate-fade-in-up flex flex-col" style={{...style, animationDuration: '0.2s', maxHeight: '300px'}}
    >
        <div className="p-2 flex-shrink-0 border-b border-[var(--color-border)]">
          <ul className="text-sm text-[var(--color-text-secondary)]">
            <li>
              <button onClick={() => handleAction(onCopy)} className="w-full text-left px-3 py-2 hover:bg-[var(--color-border)] flex items-center gap-2 rounded-md">
                <CopyIcon /> {t('copy')}
              </button>
            </li>
            {navigator.share && (
              <li>
                <button onClick={() => handleAction(onShare)} className="w-full text-left px-3 py-2 hover:bg-[var(--color-border)] flex items-center gap-2 rounded-md">
                   <ShareIcon /> {t('share')}
                </button>
              </li>
            )}
            {translation && (
            <li>
                <button onClick={() => handleAction(onHideTranslation)} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-md">Hide Translation</button>
            </li>
            )}
            {transliteration ? (
                <li>
                    <button onClick={() => handleAction(onHideTransliteration)} className="w-full text-left px-3 py-2 text-red-500 hover:bg-red-500/10 rounded-md">Hide Transliteration</button>
                </li>
            ) : (
                <li>
                    <button onClick={() => handleAction(onTransliterate)} className="w-full text-left px-3 py-2 hover:bg-[var(--color-border)] rounded-md">{t('transliterate')}</button>
                </li>
            )}
          </ul>
        </div>
        <div className="p-2 flex-shrink-0">
            <input
            ref={searchInputRef}
            type="text"
            placeholder={t('searchLanguage')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] text-[16px] text-[var(--color-text-primary)]"
            />
        </div>
        <ul className="flex-1 overflow-y-auto text-sm">
            <li className="px-3 py-1 text-xs text-[var(--color-text-subtle)] font-semibold">Translate</li>
            {filteredLanguages.map(lang => (
            <li key={lang}>
                <button
                onClick={() => handleAction(onTranslate, lang)}
                className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-[var(--color-border)] ${translation?.lang === lang ? 'font-bold text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`}
                >
                <span>{isLoading === lang ? t('loading') : lang}</span>
                {translation?.lang === lang && <CheckIcon className="w-4 h-4 text-[var(--color-accent)]" />}
                </button>
            </li>
            ))}
            {filteredLanguages.length === 0 && <li className="px-3 py-2 text-center text-xs text-[var(--color-text-subtle)]">{t('noLanguagesFound')}</li>}
        </ul>
    </div>
  );

  return (
    <div className="inline-block">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(prev => !prev)}
        className="p-1 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreHorizontalIcon />
      </button>

      {isOpen && ReactDOM.createPortal(menuContent, document.body)}
    </div>
  );
};

export default TranslationMenu;
