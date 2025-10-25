import React, { useRef, useEffect } from 'react';
import { MinaretArrowIcon, LoadingSpinner, MicrophoneIcon, PaperclipIcon, CloseIcon, FileIcon, PhoneIcon } from './icons';
import { useLocale } from '../contexts/LocaleContext';

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  onStartLiveConversation: () => void;
  file: { name: string; mimeType: string; data: string } | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
    input, setInput, handleSubmit, isLoading, 
    onStartLiveConversation,
    file, onFileChange, onRemoveFile
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const { t } = useLocale();

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const hasContent = input.trim() || file;
    
    const placeholderText = file 
        ? t('inputPlaceholderWithFile')
        : t('inputPlaceholder');

    // Auto-resize textarea based on content
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height to allow shrinking
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [input]);
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Programmatically find and submit the form
            e.currentTarget.closest('form')?.requestSubmit();
        }
    };

  return (
    <div className="p-4 bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_50%)] backdrop-blur-md border-t border-[var(--color-border)]">
      {file && (
          <div className="relative mb-2 p-2 bg-[var(--color-card-quran-bg)] border border-[var(--color-border)] rounded-lg inline-flex items-center gap-3 animate-fade-in-up max-w-full">
              {file.mimeType.startsWith('image/') ? (
                  <img 
                      src={`data:${file.mimeType};base64,${file.data}`} 
                      alt={file.name} 
                      className="h-14 w-14 object-cover rounded"
                  />
              ) : (
                  <div className="h-14 w-14 flex items-center justify-center bg-[var(--color-border)] rounded">
                      <FileIcon className="h-8 w-8 text-[var(--color-text-subtle)]" />
                  </div>
              )}
              <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{file.name}</p>
                  <p className="text-xs text-[var(--color-text-subtle)]">{file.mimeType}</p>
              </div>
              <button
                  onClick={onRemoveFile}
                  className="absolute -top-2.5 -end-2.5 w-7 h-7 bg-slate-600/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-slate-700/90"
                  aria-label="Remove file"
              >
                  <CloseIcon className="w-4 h-4" />
              </button>
          </div>
      )}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholderText}
          className={`w-full text-[var(--color-text-primary)] ps-20 pe-16 sm:ps-28 sm:pe-20 py-3 sm:py-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-3xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-all placeholder:text-[var(--color-text-subtle)] resize-none overflow-y-auto leading-normal whitespace-pre-wrap`}
          style={{ maxHeight: '140px' }} // Approx. 5 lines
          disabled={isLoading}
          aria-label="Chat input"
        />
        
        <input 
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
            accept="image/*,application/pdf,text/plain"
        />

        {/* Left-side Icons */}
        <div className="absolute start-2 sm:start-3 top-1/2 -translate-y-1/2 flex items-center gap-1 sm:gap-2">
            <button
                type="button"
                onClick={handleAttachClick}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors text-[var(--color-text-subtle)] hover:bg-[var(--color-border)]"
                disabled={isLoading}
                aria-label="Attach file"
            >
                <PaperclipIcon />
            </button>
             <button
                type="button"
                onClick={onStartLiveConversation}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-colors text-[var(--color-text-subtle)] hover:bg-[var(--color-border)]"
                disabled={isLoading}
                aria-label={t('liveConversationTitle')}
                title={t('liveConversationTitle')}
            >
                <PhoneIcon className="w-5 h-5" />
            </button>
        </div>

        {/* Right-side Icons */}
        <div className="absolute end-1 sm:end-2 top-1/2 -translate-y-1/2 flex items-center">
            <button
              type="submit"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-inverted)] flex items-center justify-center shadow-lg hover:shadow-xl hover:from-[var(--color-accent)] hover:to-[var(--color-accent-hover)] disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all transform hover:scale-110 active:scale-95 disabled:scale-100 disabled:shadow-none"
              disabled={isLoading || !hasContent}
              aria-label={isLoading ? "Sending..." : "Send message"}
            >
              {isLoading ? <LoadingSpinner /> : <MinaretArrowIcon />}
            </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;