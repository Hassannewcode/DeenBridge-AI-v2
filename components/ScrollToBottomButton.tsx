import React from 'react';
import { ChevronDownIcon } from './icons';

interface ScrollToBottomButtonProps {
  onClick: () => void;
  visible: boolean;
}

const ScrollToBottomButton: React.FC<ScrollToBottomButtonProps> = ({ onClick, visible }) => {
  return (
    <button
      onClick={onClick}
      className={`absolute bottom-24 end-4 sm:end-6 z-10 w-10 h-10 bg-slate-800/60 backdrop-blur-md text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ease-in-out hover:bg-slate-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--color-bg)] focus:ring-[var(--color-accent)] transform hover:scale-110 active:scale-95
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}
      aria-label="Scroll to bottom"
    >
      <ChevronDownIcon className="w-5 h-5" />
    </button>
  );
};

export default ScrollToBottomButton;
