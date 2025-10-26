import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon, IOSShareIcon } from './icons';
import { useClickOutside } from '../hooks/useClickOutside';

interface IOSInstallSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const IOSInstallSheet: React.FC<IOSInstallSheetProps> = ({ isOpen, onClose }) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  useClickOutside([sheetRef], onClose);

  if (!isOpen) {
    return null;
  }

  return ReactDOM.createPortal(
    <>
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      ></div>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="ios-install-title"
        className="fixed bottom-0 left-0 right-0 z-50 flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div 
          ref={sheetRef}
          className={`relative w-full max-w-md mx-auto bg-[var(--color-modal-bg)] rounded-t-2xl shadow-2xl flex flex-col
            ${isOpen ? 'animate-elastic-slide-up' : 'opacity-0'}`}
        >
          {/* Handle */}
          <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[var(--color-border)] my-3" />
          
          <header className="px-6 pt-2 pb-4 flex-shrink-0 flex items-center justify-between">
            <h2 id="ios-install-title" className="text-2xl font-bold text-[var(--color-text-primary)]">Install App on iOS</h2>
            <button onClick={onClose} className="p-2 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90 -mr-2">
              <CloseIcon />
            </button>
          </header>

          <div className="px-6 pb-6 space-y-6">
            <p className="text-[var(--color-text-secondary)]">To install the DeenBridge app on your iPhone or iPad, follow these simple steps:</p>
            
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-card-quran-bg)] border border-[var(--color-border)] rounded-lg flex items-center justify-center text-xl font-bold text-[var(--color-text-primary)]">1</div>
              <p className="text-[var(--color-text-secondary)]">Tap the <strong className="text-[var(--color-text-primary)]">Share</strong> button in the Safari menu bar.</p>
              <div className="w-10 h-10 flex-shrink-0 text-[var(--color-primary)]"><IOSShareIcon /></div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-card-quran-bg)] border border-[var(--color-border)] rounded-lg flex items-center justify-center text-xl font-bold text-[var(--color-text-primary)]">2</div>
              <p className="text-[var(--color-text-secondary)]">Scroll down and tap <strong className="text-[var(--color-text-primary)]">"Add to Home Screen"</strong>.</p>
              <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-600 dark:text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
            </div>
            
             <button onClick={onClose} className="mt-4 w-full text-center px-4 py-3 bg-[var(--color-primary)] text-[var(--color-text-inverted)] rounded-lg font-bold">
                Got it!
              </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default IOSInstallSheet;