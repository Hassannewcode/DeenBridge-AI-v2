
import React, { useState, useEffect } from 'react';
import type { Message, Denomination } from '../types';
import { MessageSender } from '../types';
import { DeenBridgeAIIcon, CitationIcon, FileIcon } from './icons';
import WebSourceCard from './cards/WebSourceCard';
import QuranVerseCard from './cards/QuranVerseCard';
import HadithCard from './cards/HadithCard';
import SkeletonLoader from './SkeletonLoader';
import { useClickOutside } from '../hooks/useClickOutside';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { TRUSTED_SOURCES } from '../data/sources';

const isTrustedSource = (sourceTitle: string, denomination: Denomination): boolean => {
    const allTrusted = Object.values(TRUSTED_SOURCES[denomination]).flat().filter(item => typeof item === 'object') as {name: string, url: string}[];
    return allTrusted.some(trusted => sourceTitle.includes(trusted.name));
};

const isTrustedWebSource = (url: string, denomination: Denomination): boolean => {
    try {
        const domain = new URL(url).hostname.replace(/^www\./, '');
        const trustedDomains = TRUSTED_SOURCES[denomination].trustedDomains as string[];
        return trustedDomains.some(trustedDomain => domain === trustedDomain);
    } catch (e) {
        console.error("Invalid URL:", url, e);
        return false;
    }
};


const BlinkingCursor = () => (
    <span className="inline-block w-[2px] h-5 bg-[var(--color-text-primary)] align-bottom ml-1 typing-cursor" />
);

const MessageBubble: React.FC<{ message: Message, denomination: Denomination }> = ({ message, denomination }) => {
  const isUser = message.sender === MessageSender.User;
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useClickOutside(() => setIsDropdownOpen(false));

  const [elapsedTime, setElapsedTime] = useState('0.0s');
  const res = message.response;

  const displayedSummary = useTypingAnimation(res?.summary, message.isStreaming);

  useEffect(() => {
    if (message.isStreaming && message.createdAt) {
      const timer = setInterval(() => {
        const seconds = (Date.now() - message.createdAt!) / 1000;
        setElapsedTime(seconds.toFixed(1) + 's');
      }, 100);

      return () => clearInterval(timer);
    }
  }, [message.isStreaming, message.createdAt]);

  const bubbleClasses = isUser
    ? 'bg-gradient-to-br from-[var(--color-user-message-bg-start)] to-[var(--color-user-message-bg-end)] rounded-t-2xl rounded-bl-2xl shadow-lg'
    : 'bg-[var(--color-card-bg)] rounded-t-2xl rounded-br-2xl shadow-md border border-[var(--color-border)]';
  
  const isPlaceholder = message.isStreaming && (!res || !res.summary || res.summary === "...");

  const hasScripturalResults = res?.scripturalResults?.length > 0;
  const hasWebResults = res?.webResults?.length > 0;
  const hasAnyResults = hasScripturalResults || hasWebResults;

  return (
    <div className={`w-full flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-end gap-3 animate-fade-in-up max-w-full md:max-w-3xl`}>
        {!isUser && (
            <div className={`w-8 h-8 md:w-10 md:h-10 p-1.5 rounded-full flex-shrink-0 shadow-sm overflow-hidden text-[var(--color-text-primary)] bg-[var(--color-card-quran-bg)] border border-[var(--color-border)]`}>
                <DeenBridgeAIIcon />
            </div>
        )}
       <div className={`p-4 ${bubbleClasses}`}>
        {isUser ? (
          <div className="flex flex-col gap-2">
            {message.file && (
              <div className="mb-2">
                {message.file.mimeType.startsWith('image/') ? (
                  <img 
                    src={`data:${message.file.mimeType};base64,${message.file.data}`}
                    alt={message.file.name || 'User upload'}
                    className="max-w-xs max-h-64 rounded-lg object-contain"
                  />
                ) : (
                  <div className="p-3 bg-black/20 rounded-lg flex items-center gap-3 max-w-xs">
                    <FileIcon className="w-8 h-8 text-white/70 flex-shrink-0" />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold truncate user-message-text-color">{message.file.name}</p>
                        <p className="text-xs text-white/70">{message.file.mimeType}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {message.text && <p className="user-message-text-color">{message.text}</p>}
          </div>
        ) : (
            <div className="relative">
                { isPlaceholder ? (
                    <SkeletonLoader />
                ) : (
                    <p className={`whitespace-pre-wrap text-[var(--color-text-secondary)]`}>
                        {displayedSummary}
                        {message.isStreaming && !isPlaceholder && <BlinkingCursor />}
                    </p>
                )}
                
                {message.isStreaming && (
                    <div className="text-xs text-right text-[var(--color-text-subtle)] pt-2 mt-3 border-t border-[color:rgb(from_var(--color-border)_r_g_b_/_50%)]">
                        {isPlaceholder ? 'Thinking...' : 'Generating...'} {elapsedTime}
                    </div>
                )}

                {!message.isStreaming && hasAnyResults && (
                    <div className="mt-4 pt-2 border-t border-[color:rgb(from_var(--color-border)_r_g_b_/_50%)]" ref={dropdownRef}>
                        <button onClick={() => setIsDropdownOpen(prev => !prev)} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors">
                            <CitationIcon />
                            {isDropdownOpen ? 'Hide Citations' : 'Show Citations'}
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute left-0 top-full mt-2 w-full max-w-full bg-[var(--color-modal-bg)] border border-[color:rgb(from_var(--color-border)_r_g_b_/_60%)] rounded-xl shadow-lg z-10 p-4 max-h-72 overflow-y-auto animate-fade-in-up">
                                {hasScripturalResults && (
                                    <div className="mb-3">
                                        <h4 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">Scriptural Sources</h4>
                                        {res.scripturalResults.map((result, index) => {
                                            const isTrusted = result.source.title !== "The Holy Quran" && isTrustedSource(result.source.title, denomination);
                                            if (result.source.title === "The Holy Quran") {
                                                return <QuranVerseCard key={`s-${index}`} result={result} index={index} />;
                                            } else {
                                                return <HadithCard key={`s-${index}`} result={result} index={index} isTrusted={isTrusted} />;
                                            }
                                        })}
                                    </div>
                                )}
                                {hasWebResults && (
                                    <div>
                                        <h4 className="font-bold text-sm text-[var(--color-text-primary)] mb-1">Web Sources</h4>
                                         {res.webResults.map((result, index) => {
                                            const isTrusted = isTrustedWebSource(result.url, denomination);
                                            return (
                                                <div key={`w-${index}`} className="mt-2">
                                                    <WebSourceCard source={result} isTrusted={isTrusted} />
                                                </div>
                                            )
                                         })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
       </div>
    </div>
    </div>
  );
};

export default MessageBubble;
