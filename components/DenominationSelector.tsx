

import React, { useState, useRef, useEffect } from 'react';
import { Denomination } from '../types';
import { SunniIcon, ShiaIcon, SufiIcon, IbadiIcon } from './icons';
import WelcomeBanner from './WelcomeBanner.jsx';
import { useLocale } from '../contexts/LocaleContext';

const SelectorCard: React.FC<{ onSelect: () => void, children: React.ReactNode }> = ({ onSelect, children }) => (
  <div 
    onClick={onSelect}
    className="group relative bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_60%)] backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl hover:shadow-[color:rgb(from_var(--color-accent)_r_g_b_/_20%)] transition-all duration-300 ease-in-out transform hover:-translate-y-2 cursor-pointer animate-fade-in-up"
  >
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="p-8 text-center flex flex-col items-center">
      {children}
    </div>
  </div>
);

const DenominationSelector: React.FC<{ onSelect: (denomination: Denomination) => void }> = ({ onSelect }) => {
  const { t } = useLocale();
  const [showMore, setShowMore] = useState(false);
  const showMoreButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (showMore) {
      setTimeout(() => {
        showMoreButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100); 
    }
  }, [showMore]);

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="w-full max-w-4xl mx-auto py-8">
        <header className="mb-12 animate-fade-in-up text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--color-text-primary)]">
            {t('welcomeTo')} <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">DeenBridge</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            {t('denominationSelectorPrompt')}
          </p>
        </header>

        <WelcomeBanner />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SelectorCard onSelect={() => onSelect(Denomination.Sunni)}>
            <SunniIcon className="h-16 w-16 sm:h-20 sm:w-20 mb-4 text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors duration-300" />
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]">{t('sunni')}</h2>
            <p className="mt-2 text-[var(--color-text-subtle)]">
              {t('sunniDescription')}
            </p>
          </SelectorCard>

          <SelectorCard onSelect={() => onSelect(Denomination.Shia)}>
            <ShiaIcon className="h-16 w-16 sm:h-20 sm:w-20 mb-4 text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors duration-300" />
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]">{t('shia')}</h2>
            <p className="mt-2 text-[var(--color-text-subtle)]">
              {t('shiaDescription')}
            </p>
          </SelectorCard>
        </div>
        
        <div className="mt-8 text-center">
          <button ref={showMoreButtonRef} onClick={() => setShowMore(!showMore)} className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-semibold transition-colors">
            {showMore ? t('showLessOptions') : t('showMoreOptions')}
          </button>
        </div>

        {showMore && (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 animate-fade-in-up">
              <SelectorCard onSelect={() => onSelect(Denomination.Sufi)}>
                <SufiIcon className="h-16 w-16 sm:h-20 sm:w-20 mb-4 text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors duration-300" />
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]">{t('sufism')}</h2>
                <p className="mt-2 text-[var(--color-text-subtle)]">
                  {t('sufismDescription')}
                </p>
              </SelectorCard>

              <SelectorCard onSelect={() => onSelect(Denomination.Ibadi)}>
                <IbadiIcon className="h-16 w-16 sm:h-20 sm:w-20 mb-4 text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors duration-300" />
                <h2 className="text-3xl sm:text-4xl font-bold text-[var(--color-text-primary)]">{t('ibadi')}</h2>
                <p className="mt-2 text-[var(--color-text-subtle)]">
                  {t('ibadiDescription')}
                </p>
              </SelectorCard>
            </div>
        )}

        <footer className="mt-16 text-center text-xs text-[var(--color-text-subtle)] animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <p>{t('changeLater')}</p>
        </footer>
      </div>
    </div>
  );
};

export default DenominationSelector;
