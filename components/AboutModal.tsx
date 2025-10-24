import React, { useRef } from 'react';
import ReactDOM from 'react-dom';
import { CloseIcon } from './icons';
import { useFocusTrap } from '../lib/focus';
import MarkdownRenderer from './MarkdownRenderer';
import { aboutContent } from '../data/about';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  if (!isOpen) return null;

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
        aria-labelledby="about-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div 
          ref={modalRef}
          className={`relative w-full max-w-2xl rounded-2xl shadow-2xl modal-bg-pattern flex flex-col max-h-[90vh]
            ${isOpen ? 'animate-elastic-slide-up' : 'opacity-0'}`}
        >
          {/* Header */}
          <header className="p-6 pb-4 flex-shrink-0 flex items-center justify-between">
            <h2 id="about-title" className="text-3xl font-bold text-[var(--color-text-primary)]">About DeenBridge</h2>
            <button onClick={onClose} className="p-2 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90">
              <CloseIcon />
            </button>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 px-6 pb-6 overflow-y-auto">
            <MarkdownRenderer content={aboutContent} />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default AboutModal;
