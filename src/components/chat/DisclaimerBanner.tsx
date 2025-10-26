import React from 'react';
import { AlertIcon } from '../common/icons';
import { useLocale } from '../../contexts/LocaleContext';

const DisclaimerBanner: React.FC = () => {
  const { t } = useLocale();

  return (
    <div className="p-3 mb-3 border-l-4 border-red-500 bg-red-500/10 rounded-r-lg">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 text-red-500 pt-0.5">
          <AlertIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-red-600 dark:text-red-400">{t('fatwaDisclaimerTitle')}</h3>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1" dangerouslySetInnerHTML={{ __html: t('fatwaDisclaimerBody') }} />
        </div>
      </div>
    </div>
  );
};

export default DisclaimerBanner;
