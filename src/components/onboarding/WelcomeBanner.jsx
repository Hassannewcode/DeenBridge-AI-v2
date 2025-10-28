import React from 'react';
import { useLocale } from '../../contexts/LocaleContext';

const WelcomeBanner = () => {
  const { t } = useLocale();
  return (
    <div 
      className="p-4 mb-8 text-center bg-[var(--color-card-quran-bg)] border border-[var(--color-card-quran-border)] rounded-xl animate-fade-in-up" 
      style={{ animationDelay: '200ms' }}
    >
      <h3 className="font-bold text-[var(--color-text-primary)]">{t('ageDisclaimerPrivacyTitle')}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
        {t('ageDisclaimerPrivacyBody')}
      </p>
    </div>
  );
}

export default WelcomeBanner;