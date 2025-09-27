import React from 'react';
import { useLocale } from '../contexts/LocaleContext';
import { locales } from '../data/locales';

type ArabicFont = 'amiri' | 'lateef' | 'noto' | 'uthmanic' | 'cairo' | 'tajawal' | 'elmessiri' | 'ibm' | 'readex';

interface ArabicFontSwitcherProps {
  currentFont: ArabicFont;
  onFontChange: (font: ArabicFont) => void;
}

const fontOptions: { name: ArabicFont; style: React.CSSProperties }[] = [
  { name: 'amiri', style: { fontFamily: "'Amiri', serif" } },
  { name: 'lateef', style: { fontFamily: "'Lateef', cursive" } },
  { name: 'noto', style: { fontFamily: "'Noto Naskh Arabic', serif" } },
  { name: 'uthmanic', style: { fontFamily: "'Scheherazade New', serif" } },
  { name: 'cairo', style: { fontFamily: "'Cairo', sans-serif" } },
  { name: 'tajawal', style: { fontFamily: "'Tajawal', sans-serif" } },
  { name: 'elmessiri', style: { fontFamily: "'El Messiri', serif" } },
  { name: 'ibm', style: { fontFamily: "'IBM Plex Sans Arabic', sans-serif" } },
  { name: 'readex', style: { fontFamily: "'Readex Pro', sans-serif" } },
];

const fontLabels: Record<ArabicFont, keyof typeof locales.en> = {
    amiri: 'fontAmiri',
    lateef: 'fontLateef',
    noto: 'fontNoto',
    uthmanic: 'fontUthmanic',
    cairo: 'fontCairo',
    tajawal: 'fontTajawal',
    elmessiri: 'fontElMessiri',
    ibm: 'fontIbm',
    readex: 'fontReadex',
};


const ArabicFontSwitcher: React.FC<ArabicFontSwitcherProps> = ({ currentFont, onFontChange }) => {
  const { t } = useLocale();

  return (
    <div>
      <h3 className="text-lg font-bold text-[var(--color-primary)] mb-2">{t('arabicFont')}</h3>
      <div className="grid grid-cols-3 gap-2">
        {fontOptions.map((option) => (
          <button
            key={option.name}
            onClick={() => onFontChange(option.name)}
            className={`w-full p-2 rounded-lg border-2 transition-all duration-200 flex items-center justify-center h-20 ${
              currentFont === option.name
                ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
            }`}
            aria-pressed={currentFont === option.name}
          >
            <span style={option.style} className="text-xl text-center text-[var(--color-text-primary)]">
              {t(fontLabels[option.name])}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ArabicFontSwitcher;