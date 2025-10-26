import React, { useState } from 'react';
import { usePWAInstall } from '../contexts/PWAInstallContext';
import { useDevice } from '../contexts/DeviceContext';
import { ArrowDownTrayIcon } from './icons';
import IOSInstallSheet from './IOSInstallSheet';

const InstallPWAButton: React.FC = () => {
    const { canInstall, promptInstall } = usePWAInstall();
    const { isIOS } = useDevice();
    const [isIOsSheetOpen, setIsIOsSheetOpen] = useState(false);

    // Check if the app is already running in standalone mode (installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    // We can show an install button on iOS even if `beforeinstallprompt` doesn't fire.
    // We hide it if it's already installed.
    const showButton = (canInstall || isIOS) && !isStandalone;

    if (!showButton) {
        return null;
    }

    const handleInstallClick = () => {
        if (isIOS) {
            setIsIOsSheetOpen(true);
        } else if (canInstall) {
            promptInstall();
        }
    };

    return (
        <>
            <button
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20 hover:border-emerald-500/50 rounded-lg transition-colors font-semibold active:scale-95"
            >
                <ArrowDownTrayIcon className="w-5 h-5" />
                Install DeenBridge App
            </button>
            {isIOS && <IOSInstallSheet isOpen={isIOsSheetOpen} onClose={() => setIsIOsSheetOpen(false)} />}
        </>
    );
};

export default InstallPWAButton;