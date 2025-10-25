import React from 'react';
import { useLocale } from '../../contexts/LocaleContext';

const OfflineBanner: React.FC = () => {
  const { t } = useLocale();

  return (
    <div
      role="status"
      aria-live="assertive"
      className="w-full bg-amber-500 text-center text-sm font-semibold text-black p-2 shadow-md z-50"
    >
      {t('offlineWarning')}
    </div>
  );
};

export default OfflineBanner;