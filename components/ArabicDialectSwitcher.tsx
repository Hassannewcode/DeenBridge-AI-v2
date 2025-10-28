import React from 'react';
import type { UserProfile, ArabicDialect } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import { CheckIcon } from './icons';
// FIX: Import the 'locales' object to resolve type definitions.
import { locales } from '../data/locales';

interface ArabicDialectSwitcherProps {
  currentDialect: ArabicDialect;
  onDialectChange: (dialect: ArabicDialect) => void;
}

const dialectGroups: {
  titleKey: keyof typeof locales.en;
  options: { value: ArabicDialect; labelKey: keyof typeof locales.en; descriptionKey: keyof typeof locales.en; arabicName: string }[];
}[] = [
  {
    titleKey: 'dialectGroupFormal',
    options: [
      { value: 'msa', labelKey: 'dialectMSA', descriptionKey: 'dialectMSADescription', arabicName: 'الفصحى' },
    ]
  },
  {
    titleKey: 'dialectGroupMashriqi',
    options: [
      { value: 'levantine', labelKey: 'dialectLevantine', descriptionKey: 'dialectLevantineDescription', arabicName: 'شامي' },
      { value: 'gulf', labelKey: 'dialectGulf', descriptionKey: 'dialectGulfDescription', arabicName: 'خليجي' },
      { value: 'hijazi', labelKey: 'dialectHijazi', descriptionKey: 'dialectHijaziDescription', arabicName: 'حجازي' },
      { value: 'iraqi', labelKey: 'dialectIraqi', descriptionKey: 'dialectIraqiDescription', arabicName: 'عراقي' },
    ]
  },
  {
    titleKey: 'dialectGroupMaghrebi',
    options: [
        { value: 'egyptian', labelKey: 'dialectEgyptian', descriptionKey: 'dialectEgyptianDescription', arabicName: 'مصري' },
        { value: 'maghrebi', labelKey: 'dialectMaghrebi', descriptionKey: 'dialectMaghrebiDescription', arabicName: 'مغربي' },
    ]
  }
];


const ArabicDialectSwitcher: React.FC<ArabicDialectSwitcherProps> = ({ currentDialect, onDialectChange }) => {
  const { t } = useLocale();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-bold text-[var(--color-primary)]">{t('arabicDialectTitle')}</h3>
        <p className="text-sm text-[var(--color-text-secondary)] -mt-1">{t('arabicDialectDescription')}</p>
      </div>
      
      {dialectGroups.map(group => (
        // FIX: Cast key to string to satisfy React's key prop type requirement.
        <div key={group.titleKey as string} className="space-y-2">
            <h4 className="font-semibold text-sm text-[var(--color-text-secondary)] border-b border-[var(--color-border)] pb-1">{t(group.titleKey)}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.options.map(option => (
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
                        <p className="font-bold text-[var(--color-text-primary)]">{t(option.labelKey)} <span className="font-normal text-[var(--color-text-subtle)]">({option.arabicName})</span></p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">{t(option.descriptionKey)}</p>
                    </div>
                    {currentDialect === option.value && <CheckIcon className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 ms-2" />}
                    </div>
                </button>
                ))}
            </div>
        </div>
      ))}
    </div>
  );
};

export default ArabicDialectSwitcher;