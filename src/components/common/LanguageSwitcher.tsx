import React from 'react';
import { useLocale } from '../../contexts/LocaleContext';
import { GlobeIcon } from './icons';

const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale } = useLocale();
  const nextLocale = locale === 'en' ? 'ar' : 'en';
  const buttonText = locale === 'en' ? 'العربية' : 'English';

  return (
    <button
      onClick={() => setLocale(nextLocale)}
      className="flex items-center gap-1 sm:gap-2 p-2 sm:px-3 text-sm font-semibold rounded-full bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_60%)] text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors backdrop-blur-sm active:scale-95"
      aria-label={`Switch language to ${buttonText}`}
      title={`Switch language to ${buttonText}`}
    >
      <GlobeIcon className="w-5 h-5" />
      <span className="hidden sm:inline">{buttonText}</span>
    </button>
  );
};

export default LanguageSwitcher;