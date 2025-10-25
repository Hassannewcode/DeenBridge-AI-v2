import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

type ThemeOption = {
  name: 'light' | 'dark' | 'madinah' | 'majlis';
  label: string;
  gradient: string;
};

const themeOptions: ThemeOption[] = [
  { name: 'light', label: 'Light', gradient: 'from-amber-100 to-amber-50' },
  { name: 'dark', label: 'Dark', gradient: 'from-slate-800 to-slate-900' },
  { name: 'madinah', label: 'Madinah', gradient: 'from-[#fdf9f0] to-[#b08d57]' },
  { name: 'majlis', label: 'Majlis', gradient: 'from-[#8a0303] to-[#2b1c1c]' },
];

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div>
        <h3 className="text-lg font-bold text-[var(--color-primary)]">Theme</h3>
        <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {themeOptions.map((option) => (
            <button
            key={option.name}
            onClick={() => setTheme(option.name)}
            className={`w-full p-2 rounded-lg border-2 transition-all duration-200 ${
                theme === option.name
                ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)]'
                : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
            }`}
            aria-pressed={theme === option.name}
            >
            <div className={`w-full h-10 rounded-md bg-gradient-to-br ${option.gradient}`} />
            <span className="block mt-2 text-sm font-medium text-[var(--color-text-secondary)]">{option.label}</span>
            </button>
        ))}
        </div>
    </div>
  );
};

export default ThemeSwitcher;