import React from 'react';
import { useLocale } from '../contexts/LocaleContext';

const WelcomeBanner = () => {
  const { t } = useLocale();
  return (
    <div 
      className="p-4 mb-8 text-center bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_60%)] backdrop-blur-md rounded-xl border border-[var(--color-border)] animate-fade-in-up" 
      style={{ animationDelay: '200ms' }}
    >
      <p className="text-sm text-[var(--color-text-secondary)] font-semibold">
        {t('disclaimer')}
      </p>
    </div>
  );
}

export default WelcomeBanner;