import React from 'react';
import type { UserProfile } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import { CheckIcon } from './icons';

type ArabicDialect = UserProfile['arabicDialect'];

interface ArabicDialectSwitcherProps {
  currentDialect: ArabicDialect;
  onDialectChange: (dialect: ArabicDialect) => void;
}

const dialectOptions: { value: ArabicDialect; labelKey: string; descriptionKey: string; }[] = [
  { value: 'msa', labelKey: 'dialectMSA', descriptionKey: 'dialectMSADescription' },
  { value: 'egyptian', labelKey: 'dialectEgyptian', descriptionKey: 'dialectEgyptianDescription' },
  { value: 'hijazi', labelKey: 'dialectHijazi', descriptionKey: 'dialectHijaziDescription' },
  { value: 'levantine', labelKey: 'dialectLevantine', descriptionKey: 'dialectLevantineDescription' },
  { value: 'gulf', labelKey: 'dialectGulf', descriptionKey: 'dialectGulfDescription' },
  { value: 'iraqi', labelKey: 'dialectIraqi', descriptionKey: 'dialectIraqiDescription' },
  { value: 'maghrebi', labelKey: 'dialectMaghrebi', descriptionKey: 'dialectMaghrebiDescription' },
];

const ArabicDialectSwitcher: React.FC<ArabicDialectSwitcherProps> = ({ currentDialect, onDialectChange }) => {
  const { t } = useLocale();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-[var(--color-primary)]">{t('arabicDialectTitle')}</h3>
        <p className="text-sm text-[var(--color-text-secondary)] -mt-1">{t('arabicDialectDescription')}</p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {dialectOptions.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onDialectChange(option.value)}
            className={`relative text-left p-3 rounded-lg border-2 transition-all duration-200 ${
              currentDialect === option.value
                ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] bg-[var(--color-card-quran-bg)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-[var(--color-text-primary)]">{t(option.labelKey as any)}</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">{t(option.descriptionKey as any)}</p>
              </div>
              {currentDialect === option.value && <CheckIcon className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 ms-2" />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArabicDialectSwitcher;