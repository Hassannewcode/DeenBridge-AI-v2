import React from 'react';
import { usePWAInstall } from '../../contexts/PWAInstallContext';
import { ArrowDownTrayIcon } from './icons';

const InstallPWAButton: React.FC = () => {
    const { canInstall, promptInstall } = usePWAInstall();

    if (!canInstall) {
        return null;
    }

    return (
        <button
            onClick={promptInstall}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/50 rounded-lg transition-colors font-semibold active:scale-95"
        >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Install DeenBridge App
        </button>
    );
};

export default InstallPWAButton;