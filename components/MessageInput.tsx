
import React, { useRef } from 'react';
import { MinaretArrowIcon, LoadingSpinner, MicrophoneIcon, PaperclipIcon, CloseIcon, FileIcon } from './icons';

interface MessageInputProps {
  input: string;
  setInput: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isRecording: boolean;
  onToggleRecording: () => void;
  isSpeechSupported: boolean;
  file: { name: string; mimeType: string; data: string } | null;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
    input, setInput, handleSubmit, isLoading, 
    isRecording, onToggleRecording, isSpeechSupported,
    file, onFileChange, onRemoveFile
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleAttachClick = () => {
        fileInputRef.current?.click();
    };

    const hasContent = input.trim() || file;

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
                  className="absolute -top-2 -right-2 w-6 h-6 bg-slate-600/80 text-white rounded-full flex items-center justify-center backdrop-blur-sm"
                  aria-label="Remove file"
              >
                  <CloseIcon className="w-4 h-4" />
              </button>
          </div>
      )}
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={file ? "Describe the file or ask a question..." : isRecording ? "Listening..." : "Ask a question..."}
          className={`w-full text-[var(--color-text-primary)] pl-12 pr-28 py-4 bg-[var(--color-card-bg)] border border-[var(--color-border)] rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] transition-colors input-focus-glow placeholder:text-[var(--color-text-subtle)]`}
          disabled={isLoading}
          aria-label="Chat input"
        />
        
        <input 
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
        />

        <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
                type="button"
                onClick={handleAttachClick}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors text-[var(--color-text-subtle)] hover:bg-[var(--color-border)]"
                disabled={isLoading}
                aria-label="Attach file"
            >
                <PaperclipIcon />
            </button>
        </div>

        <div className="absolute right-16 top-1/2 -translate-y-1/2 flex items-center">
            <button
                type="button"
                onClick={onToggleRecording}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                    ${isRecording ? 'bg-red-500/20 text-red-500 animate-pulse-opacity' : 'text-[var(--color-text-subtle)] hover:bg-[var(--color-border)]'}
                    ${!isSpeechSupported ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                disabled={isLoading || !isSpeechSupported}
                aria-label={isRecording ? "Stop recording" : "Start recording"}
                title={isSpeechSupported ? (isRecording ? "Stop recording" : "Start recording") : "Voice input is not supported by your browser."}
            >
                <MicrophoneIcon className="w-5 h-5" />
            </button>
        </div>


        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full text-[var(--color-text-inverted)] flex items-center justify-center shadow-lg hover:shadow-xl hover:from-[var(--color-accent)] hover:to-[var(--color-accent-hover)] disabled:from-slate-400 disabled:to-slate-400 disabled:cursor-not-allowed transition-all transform hover:scale-110 active:scale-95 disabled:scale-100 disabled:shadow-none"
          disabled={isLoading || !hasContent || isRecording}
          aria-label={isLoading ? "Sending..." : "Send message"}
        >
          {isLoading ? <LoadingSpinner /> : <MinaretArrowIcon />}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;