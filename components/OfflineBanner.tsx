import React from 'react';
import { useOnlineStatus } from '../contexts/OnlineStatusContext';
import { AlertIcon } from './icons';

const OfflineBanner: React.FC = () => {
  const { isOnline } = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed top-0 left-0 right-0 z-[101] bg-amber-500 text-black p-2 text-center text-sm font-semibold shadow-lg flex items-center justify-center gap-2 animate-fade-in-up"
      style={{paddingTop: `calc(0.5rem + env(safe-area-inset-top))`}}
    >
      <AlertIcon className="w-5 h-5" />
      <span>You are currently offline. AI features are disabled.</span>
    </div>
  );
};

export default OfflineBanner;