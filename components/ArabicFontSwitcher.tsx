import React from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { locales } from '../data/locales';

type ArabicFont = 'amiri' | 'lateef' | 'noto' | 'uthmanic';

interface ArabicFontSwitcherProps {
  currentFont: ArabicFont;
  onFontChange: (font: ArabicFont) => void;
}

const fontOptions: { name: ArabicFont; style: React.CSSProperties }[] = [
  { name: 'amiri', style: { fontFamily: "'Amiri', serif" } },
  { name: 'lateef', style: { fontFamily: "'Lateef', cursive" } },
  { name: 'noto', style: { fontFamily: "'Noto Naskh Arabic', serif" } },
  { name: 'uthmanic', style: { fontFamily: "'Scheherazade New', serif" } },
];

const fontLabels: Record<ArabicFont, keyof typeof locales.en> = {
    amiri: 'fontAmiri',
    lateef: 'fontLateef',
    noto: 'fontNoto',
    uthmanic: 'fontUthmanic',
};


const ArabicFontSwitcher: React.FC<ArabicFontSwitcherProps> = ({ currentFont, onFontChange }) => {
  const { t } = useLocale();

  return (
    <div>
      <h3 className="text-lg font-bold text-[var(--color-primary)] mb-2">{t('arabicFont')}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {fontOptions.map((option) => (
          <button
            key={option.name}
            onClick={() => onFontChange(option.name)}
            className={`w-full p-2 rounded-lg border-2 transition-all duration-200 ${
              currentFont === option.name
                ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
            }`}
            aria-pressed={currentFont === option.name}
          >
            <span style={option.style} className="block text-2xl text-[var(--color-text-primary)]">
              {t(fontLabels[option.name])}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArabicFontSwitcher;