

import React, { useState, useEffect } from 'react';
import { useLocale } from '../contexts/LocaleContext';

interface AgeDisclaimerModalProps {
  onAccept: () => void;
}

const AgeDisclaimerModal: React.FC<AgeDisclaimerModalProps> = ({ onAccept }) => {
  const [countdown, setCountdown] = useState(5);
  const { t } = useLocale();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="w-full max-w-lg bg-[var(--color-modal-bg)] rounded-2xl shadow-2xl p-6 md:p-8 text-center modal-bg-pattern">
        <h2 className="text-2xl md:text-3xl font-bold text-red-500">{t('ageDisclaimerTitle')}</h2>
        <p className="mt-4 text-[var(--color-text-secondary)]">
          {t('ageDisclaimerBody')}
        </p>

        <div className="mt-4 p-3 bg-[var(--color-card-quran-bg)] border border-[var(--color-border)] rounded-lg text-sm">
            <p className="font-bold text-[var(--color-text-primary)]">{t('ageDisclaimerPrivacyTitle')}</p>
            <p className="text-[var(--color-text-secondary)] mt-1">
                {t('ageDisclaimerPrivacyBody')}
            </p>
        </div>
        
        <p className="mt-4 text-lg font-bold text-[var(--color-text-primary)]">
          {t('ageDisclaimerWarning')}
        </p>
        
        <div className="mt-8">
          <button
            onClick={onAccept}
            disabled={countdown > 0}
            className="w-full px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-red-500/30 transition-all transform hover:scale-105 active:scale-95 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none"
          >
            {countdown > 0 ? `${t('ageDisclaimerWait')} ${countdown}s` : t('ageDisclaimerAccept')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgeDisclaimerModal;