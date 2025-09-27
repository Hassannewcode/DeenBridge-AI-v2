import React, { useEffect, useState } from 'react';
import { AlertIcon, CheckIcon, CloseIcon } from './icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true); // Animate in
    const timer = setTimeout(() => {
      handleClose();
    }, 4000); // Auto-dismiss after 4 seconds

    return () => clearTimeout(timer);
  }, [message]);

  const handleClose = () => {
    setVisible(false);
    // Allow time for fade-out animation before calling parent onClose
    setTimeout(onClose, 300);
  };

  const isSuccess = type === 'success';
  const Icon = isSuccess ? CheckIcon : AlertIcon;

  return (
    <div 
      role="alert"
      aria-live="assertive"
      className={`fixed bottom-5 right-5 md:bottom-10 md:right-10 z-50 flex items-center w-full max-w-xs p-4 space-x-4 rounded-xl shadow-2xl transition-all duration-300 ease-in-out
        ${isSuccess ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'}
        ${visible ? 'transform translate-y-0 opacity-100' : 'transform translate-y-4 opacity-0'}`}
    >
      <div className={`inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg 
        ${isSuccess ? 'bg-emerald-700' : 'bg-red-700'}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-sm font-medium">{message}</div>
      <button 
        type="button" 
        className="p-1 -m-1 rounded-md hover:bg-black/20 focus:outline-none focus:ring-2 focus:ring-white" 
        onClick={handleClose}
        aria-label="Dismiss"
      >
        <CloseIcon className="w-5 h-5"/>
      </button>
    </div>
  );
};

export default Toast;