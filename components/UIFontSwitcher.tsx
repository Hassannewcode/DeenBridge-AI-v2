import React from 'react';
import { useLocale } from '../contexts/LocaleContext';
import type { UserProfile } from '../types';

type UIFont = UserProfile['uiFont'];

interface UIFontSwitcherProps {
  currentFont: UIFont;
  onFontChange: (font: UIFont) => void;
}

const fontOptions: { name: UIFont; label: string; style: React.CSSProperties }[] = [
  { name: 'inter', label: 'Default', style: { fontFamily: "'Inter', sans-serif" } },
  { name: 'amiri', label: 'Serif', style: { fontFamily: "'Amiri', serif" } },
  { name: 'native', label: 'System', style: { fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" } },
];

const UIFontSwitcher: React.FC<UIFontSwitcherProps> = ({ currentFont, onFontChange }) => {
  const { t } = useLocale();

  return (
    <div>
      <h3 className="text-lg font-bold text-[var(--color-primary)] mb-2">UI Font</h3>
      <div className="grid grid-cols-3 gap-3">
        {fontOptions.map((option) => (
          <button
            key={option.name}
            onClick={() => onFontChange(option.name)}
            className={`w-full p-2 rounded-lg border-2 transition-all duration-200 flex flex-col items-center justify-center h-20 ${
              currentFont === option.name
                ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
            }`}
            aria-pressed={currentFont === option.name}
          >
            <span style={option.style} className="text-3xl font-bold text-[var(--color-text-primary)]">Ag</span>
            <span className="text-xs mt-1 text-[var(--color-text-secondary)]">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UIFontSwitcher;
