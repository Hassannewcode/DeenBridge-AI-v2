import React, { useState, useRef, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import { startChat, sendMessageStream, parseMarkdownResponse, generateTitle } from '../services/geminiService';
import type { Message, UserProfile, WebSource, GroundingChunk, ChatSession } from '../types';
import { Denomination, MessageSender } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { SettingsIcon, DeenBridgeLogoIcon, MenuIcon, PlusIcon, MessageSquareIcon, TrashIcon, PencilIcon, PinIcon, PinFilledIcon, LoadingSpinner, QuranAnalysisIcon, QuranIcon } from './icons';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import MessageBubble from './MessageBubble';
import Toast from './Toast';
import { SpeechProvider } from '../contexts/SpeechContext';
import type { Chat, GenerateContentResponse } from '@google/genai';
import { GoogleGenAI } from '@google/genai';
import LanguageSwitcher from './LanguageSwitcher';
import { useLocale } from '../contexts/LocaleContext';
import ScrollToBottomButton from './ScrollToBottomButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const QuranReader = lazy(() => import('./QuranReader'));
const QuranSearch = lazy(() => import('./QuranSearch'));
const LiveConversationModal = lazy(() => import('./LiveConversationModal'));


// --- Audio Utility ---
const playNotificationSound = () => {
    try {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(659.25, context.currentTime); // E5
        gainNode.gain.setValueAtTime(0.08, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.5);
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.5);
    } catch (e) {
        console.warn("Could not play notification sound.", e);
    }
};


const ChatView: React.FC<{ denomination: Denomination; onOpenSettings: () => void, profile: UserProfile }> = ({ denomination, onOpenSettings, profile }) => {
  const [chats, setChats] = useLocalStorage<ChatSession[]>(`deenbridge-chats-${denomination}`, []);
  const [activeChatId, setActiveChatId] = useLocalStorage<string | null>(`deenbridge-active-chat-${denomination}`, null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isQuranReaderOpen, setIsQuranReaderOpen] = useState(false);
  const [isQuranSearchOpen, setIsQuranSearchOpen] = useState(false);
  const [isLiveModeOpen, setIsLiveModeOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useLocale();

  // NEW Speech-to-text logic
  const {
    transcript,
    isListening,
    startListening,
    stopListening,
    isSupported: isSpeechRecognitionSupported
  } = useSpeechRecognition({ lang: locale });
  const initialDraftRef = useRef('');

  // --- Toast State ---
  const [toastInfo, setToastInfo] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const { activeChats, pinnedChats } = useMemo(() => {
    const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);
    return {
      activeChats: sortedChats.filter(c => !c.isPinned),
      pinnedChats: sortedChats.filter(c => c.isPinned),
    };
  }, [chats]);
  
  const activeChat = chats.find(c => c.id === activeChatId);
  const sidebarHiddenClass = locale === 'ar' ? 'translate-x-full' : '-translate-x-full';

  const handleNewChat = useCallback(() => {
    const newChatId = Date.now().toString();
    const newChat: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      draft: '',
      draftFile: null,
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setIsSidebarOpen(false);
  }, [setChats, setActiveChatId]);
  
 useEffect(() => {
    if (chats.length === 0) {
        handleNewChat();
    } else if (!activeChatId || !chats.find(c => c.id === activeChatId)) {
        // If current active chat is deleted or invalid, switch to the most recent one.
        const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);
        setActiveChatId(sortedChats[0]?.id || null);
    }
}, [chats, activeChatId, setActiveChatId, handleNewChat]);


  useEffect(() => {
    if (activeChat) {
      const chatInstance = startChat(denomination, activeChat.messages, profile);
      setChat(chatInstance);
    }
  }, [activeChatId, chats, denomination, profile]);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeChat?.messages.length]);
  
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
        const { scrollTop, scrollHeight, clientHeight } = container;
        const isScrolledUp = scrollHeight - scrollTop - clientHeight > clientHeight / 2;
        setShowScrollButton(isScrolledUp);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const handleInputChange = useCallback((value: string) => {
    if (!activeChatId) return;
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === activeChatId ? { ...c, draft: value } : c
      )
    );
  }, [activeChatId, setChats]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeChatId) {
      if(file.size > 2 * 1024 * 1024) { // 2MB limit
          alert("File is too large. Please select a file smaller than 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setChats(prevChats => 
          prevChats.map(c => 
            c.id === activeChatId ? { ...c, draftFile: { data: base64String, mimeType: file.type, name: file.name } } : c
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    if (!activeChatId) return;
    setChats(prevChats => 
      prevChats.map(c => 
        c.id === activeChatId ? { ...c, draftFile: null } : c
      )
    );
  };
  
  const handleStartLiveConversation = useCallback(() => {
    if (isLoading) return;
    setIsLiveModeOpen(true);
  }, [isLoading]);

  const handleTurnComplete = useCallback((userText: string, aiText: string) => {
      if (!activeChatId || (!userText.trim() && !aiText.trim())) return;

      const userMessage: Message = {
          id: Date.now().toString(),
          sender: MessageSender.User,
          text: userText,
          createdAt: Date.now(),
      };
      
      const parsedData = parseMarkdownResponse(aiText);
      const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: MessageSender.AI,
          response: parsedData,
          rawResponseText: aiText,
          createdAt: Date.now() + 1,
      };
      
      setChats(prevChats => prevChats.map(c => 
        c.id === activeChatId ? { ...c, messages: [...c.messages, userMessage, aiMessage] } : c
      ));

      if (profile.enableSound) playNotificationSound();

  }, [activeChatId, setChats, profile.enableSound]);

  const handleToggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      if (activeChat) {
        initialDraftRef.current = activeChat.draft || '';
      }
      startListening();
    }
  }, [isListening, startListening, stopListening, activeChat]);

  useEffect(() => {
    if (isListening) {
      const newText = initialDraftRef.current ? `${initialDraftRef.current} ${transcript}`.trim() : transcript;
      handleInputChange(newText);
    }
  }, [transcript, isListening, handleInputChange]);
  
  const handleSendMessage = async (query: string) => {
    if ((!query.trim() && !activeChat?.draftFile) || !chat || isLoading || !activeChatId || !activeChat) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: MessageSender.User,
      text: query,
      file: activeChat.draftFile ? { data: activeChat.draftFile.data, mimeType: activeChat.draftFile.mimeType, name: activeChat.draftFile.name } : undefined,
      createdAt: Date.now(),
    };
    
    const isNewChat = activeChat.messages.length === 0;

    setIsLoading(true);
    
    const aiMessageId = (Date.now() + 1).toString();
    const placeholderAiMessage: Message = {
        id: aiMessageId,
        sender: MessageSender.AI,
        isStreaming: true,
        response: { summary: "...", scripturalResults: [], webResults: [] },
        createdAt: Date.now(),
    };

    setChats(prevChats => prevChats.map(c => 
      c.id === activeChatId ? { ...c, messages: [...c.messages, userMessage, placeholderAiMessage], draft: '', draftFile: null } : c
    ));
    
    if (profile.enableHaptics && navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    const withRetry = async <T,>(fn: () => Promise<T>, retries = 2, delay = 2000): Promise<T> => {
      try {
        return await fn();
      } catch (error: any) {
        if (retries > 0) {
          const isRateLimitError = error.toString().includes('429') || error.toString().includes('RESOURCE_EXHAUSTED');
    
          if (isRateLimitError) {
            setToastInfo({ message: `Service is busy. Retrying in ${delay / 1000}s... (${retries} left)`, type: 'error' });
            await new Promise(res => setTimeout(res, delay));
            return withRetry(fn, retries - 1, delay * 2);
          }
        }
        throw error;
      }
    };

    try {
        const stream: AsyncGenerator<GenerateContentResponse> = await withRetry(() => sendMessageStream(chat, query, activeChat.draftFile));
        let fullTextResponse = "";
        const allGroundingChunks: GroundingChunk[] = [];

        for await (const chunk of stream) {
            fullTextResponse += chunk.text;
            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                allGroundingChunks.push(...chunk.candidates[0].groundingMetadata.groundingChunks);
            }
             setChats(currentChats => currentChats.map(c => {
                if (c.id === activeChatId) {
                    return { ...c, messages: c.messages.map(msg => 
                        msg.id === aiMessageId ? { ...msg, response: { ...msg.response!, summary: fullTextResponse } } : msg
                    )};
                }
                return c;
            }));
        }

        const uniqueUris = new Set<string>();
        const groundingChunks = allGroundingChunks.filter(chunk => {
            if (chunk.web?.uri && !uniqueUris.has(chunk.web.uri)) {
                uniqueUris.add(chunk.web.uri);
                return true;
            }
            return false;
        });
        
        const webResults: WebSource[] = (groundingChunks || [])
            .filter(chunk => chunk.web && chunk.web.uri && chunk.web.title)
            .map(chunk => ({ title: chunk.web!.title!, url: chunk.web!.uri!, snippet: "" }));

        let parsedData = parseMarkdownResponse(fullTextResponse);
        parsedData.webResults = webResults;
        parsedData.groundingChunks = groundingChunks;
        
        const finalResponse: Message = { id: aiMessageId, sender: MessageSender.AI, response: parsedData, rawResponseText: fullTextResponse, isStreaming: false, createdAt: placeholderAiMessage.createdAt };

        setChats(currentChats => currentChats.map(c => {
          if (c.id === activeChatId) {
            return { ...c, messages: c.messages.map(msg => msg.id === aiMessageId ? finalResponse : msg) };
          }
          return c;
        }));

        if (isNewChat) {
            const summaryForTitle = parsedData?.summary || fullTextResponse;
            generateTitle(query, summaryForTitle).then(newTitle => {
                setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, title: newTitle } : c));
            });
        }
        
        if (profile.enableSound) playNotificationSound();

    } catch (error: any) {
        console.error("Error during streaming:", error);

        let errorMessage = "An error occurred. Please check your connection or API key and ensure it is configured correctly.";
        const errorString = error.toString();
        const isRateLimitError = errorString.includes('429') || errorString.includes('RESOURCE_EXHAUSTED');

        if (isRateLimitError) {
            errorMessage = "You've exceeded the request limit. Please wait a moment before trying again, or check your API plan & billing details.";
        }
        
        setToastInfo({ message: errorMessage, type: 'error' });

        const errorResponse: Message = { 
            id: aiMessageId, 
            sender: MessageSender.AI, 
            response: { summary: errorMessage, scripturalResults: [], webResults: [] }, 
            isStreaming: false,
            createdAt: placeholderAiMessage.createdAt
        };

        setChats(currentChats => currentChats.map(c => {
            if (c.id === activeChatId) {
                return { ...c, messages: c.messages.map(msg => msg.id === aiMessageId ? errorResponse : msg) };
            }
            return c;
        }));
    } finally {
        setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSendMessage(activeChat?.draft || '');
  };
  
  const handleQueryFromHint = (query: string) => {
    handleSendMessage(query);
  }

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setIsSidebarOpen(false);
  };
  
  const handleDeleteChat = (e: React.MouseEvent, chatIdToDelete: string) => {
    e.stopPropagation();
    setChats(prev => {
        const remainingChats = prev.filter(c => c.id !== chatIdToDelete);
        if (activeChatId === chatIdToDelete) {
            const sortedRemaining = [...remainingChats].sort((a, b) => b.createdAt - a.createdAt);
            setActiveChatId(sortedRemaining[0]?.id || null);
            if (remainingChats.length === 0) {
              setTimeout(handleNewChat, 0);
            }
        }
        return remainingChats;
    });
  };
  
  const handleTogglePinChat = (e: React.MouseEvent, chatIdToPin: string) => {
    e.stopPropagation();
    setChats(prev => prev.map(c => c.id === chatIdToPin ? { ...c, isPinned: !c.isPinned } : c));
  };


  const handleStartEditing = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingChatId(session.id);
    setEditingTitle(session.title);
  };

  const handleSaveTitle = (chatId: string) => {
    if (editingTitle.trim()) {
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: editingTitle.trim() } : c));
    }
    setEditingChatId(null);
    setEditingTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent, chatId: string) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        handleSaveTitle(chatId);
    } else if (e.key === 'Escape') {
        setEditingChatId(null);
        setEditingTitle('');
    }
  };
  
  const getTraditionText = () => {
    switch(denomination) {
        case Denomination.Sunni: return t('sunniTradition');
        case Denomination.Shia: return t('shiaTradition');
        default: return `${denomination} Tradition`;
    }
  }

  const ChatItem: React.FC<{session: ChatSession}> = ({ session }) => (
    <a key={session.id} onClick={() => handleSelectChat(session.id)} className={`group relative flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors overflow-hidden ${activeChatId === session.id ? 'bg-[var(--color-border)] text-[var(--color-text-primary)]' : 'hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_50%)]'}`}>
        <MessageSquareIcon className="w-5 h-5 flex-shrink-0" />
        {editingChatId === session.id ? (
            <form onSubmit={(e) => { e.preventDefault(); handleSaveTitle(session.id); }} className="flex-1 min-w-0">
                <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={() => handleSaveTitle(session.id)}
                    onKeyDown={(e) => handleKeyDown(e, session.id)}
                    className="w-full bg-transparent focus:bg-[var(--color-card-bg)] text-sm font-medium p-1 -m-1 rounded focus:outline-none ring-1 ring-[var(--color-accent)] text-[var(--color-text-primary)]"
                    autoFocus
                />
            </form>
        ) : (
            <span onDoubleClick={(e) => handleStartEditing(e, session)} className="flex-1 whitespace-nowrap overflow-hidden text-sm font-medium transition-all duration-200 group-hover:mr-24 fade-out-edge">{session.title}</span>
        )}
        <div className="absolute top-1/2 right-3 -translate-y-1/2 flex items-center opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
            <button
                onClick={(e) => handleTogglePinChat(e, session.id)}
                className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_80%)]"
                aria-label={session.isPinned ? t('unpinChat') : t('pinChat')}
            >
                {session.isPinned ? <PinFilledIcon className="w-4 h-4 text-[var(--color-accent)]" /> : <PinIcon className="w-4 h-4" />}
            </button>
            {editingChatId !== session.id && (
                <button
                    onClick={(e) => handleStartEditing(e, session)}
                    className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_80%)]"
                    aria-label={t('renameChat')}
                >
                    <PencilIcon className="w-4 h-4" />
                </button>
            )}
            <button
                onClick={(e) => handleDeleteChat(e, session.id)}
                className="p-2 text-[var(--color-text-subtle)] hover:text-red-500 rounded-full hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_80%)]"
                aria-label={t('deleteChat')}
            >
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
    </a>
  );

  const SuspenseLoader: React.FC = () => (
      <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
  );

  return (
    <SpeechProvider>
      <div className="flex h-full w-full overflow-hidden">
          <Suspense fallback={<SuspenseLoader />}>
            {isQuranReaderOpen && <QuranReader isOpen={isQuranReaderOpen} onClose={() => setIsQuranReaderOpen(false)} profile={profile} setToastInfo={setToastInfo} />}
            {isQuranSearchOpen && <QuranSearch isOpen={isQuranSearchOpen} onClose={() => setIsQuranSearchOpen(false)} profile={profile} />}
            {isLiveModeOpen && 
                <LiveConversationModal 
                    isOpen={isLiveModeOpen} 
                    onClose={() => setIsLiveModeOpen(false)}
                    profile={profile}
                    denomination={denomination}
                    onTurnComplete={handleTurnComplete}
                />
            }
          </Suspense>

          {/* Backdrop for mobile sidebar */}
          <div onClick={() => setIsSidebarOpen(false)} className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

          <aside className={`absolute md:static top-0 start-0 h-full w-64 md:w-72 bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_70%)] backdrop-blur-xl border-e border-[var(--color-border)] flex flex-col z-30 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : sidebarHiddenClass} md:translate-x-0 flex-shrink-0`}>
              <div className="p-2 border-b border-[var(--color-border)] flex-shrink-0">
                  <button onClick={handleNewChat} className="flex items-center justify-center gap-2 w-full p-3 rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-border)] font-semibold transition-colors active:scale-95">
                      <PlusIcon />
                      {t('newChat')}
                  </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                  {pinnedChats.length > 0 && (
                    <div className="px-3 pt-2 pb-1 text-xs font-bold text-[var(--color-text-subtle)] uppercase tracking-wider">{t('pinned')}</div>
                  )}
                  {pinnedChats.map(session => (
                    <ChatItem key={session.id} session={session} />
                  ))}
                  {pinnedChats.length > 0 && activeChats.length > 0 && <div className="py-2"><div className="border-t border-[var(--color-border)]"></div></div>}
                  {activeChats.map(session => (
                    <ChatItem key={session.id} session={session} />
                  ))}
              </nav>

          </aside>

          <div className="flex flex-col flex-1 relative overflow-hidden">
              <header className="flex-shrink-0 flex items-center justify-between p-2 sm:p-4 bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_60%)] backdrop-blur-md shadow-sm border-b border-[var(--color-border)] z-10 rtl:flex-row-reverse">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ms-2 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors active:scale-90 md:hidden" aria-label="Open chat history">
                          <MenuIcon />
                      </button>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 p-1 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-full flex items-center justify-center shadow-inner text-white">
                          <DeenBridgeLogoIcon />
                      </div>
                      <div>
                          <h1 className="text-base sm:text-xl font-bold text-[var(--color-text-primary)]">DeenBridge</h1>
                          <p className="text-xs text-[var(--color-text-secondary)]">{getTraditionText()}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                    <button onClick={() => setIsQuranSearchOpen(true)} className="p-2 sm:p-3 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors active:scale-90" aria-label={t('quranSearchTitle')}>
                        <QuranAnalysisIcon />
                    </button>
                    <button onClick={() => setIsQuranReaderOpen(true)} className="p-2 sm:p-3 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors active:scale-90" aria-label="Read Quran">
                        <QuranIcon className="h-6 w-6" />
                    </button>
                    <LanguageSwitcher />
                    <button onClick={onOpenSettings} className="p-2 sm:p-3 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors active:scale-90" aria-label="Open settings">
                        <SettingsIcon />
                    </button>
                  </div>
              </header>

              <div className="flex-1 relative min-h-0">
                <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto p-4 md:p-6 flex flex-col space-y-6">
                    {!activeChat || activeChat.messages.length === 0 ? (
                    <EmptyState denomination={denomination} onQuery={handleQueryFromHint} />
                    ) : (
                    activeChat.messages.map((message) => (
                        <MessageBubble key={message.id} message={message} denomination={denomination} profile={profile} />
                    ))
                    )}
                    <div ref={messagesEndRef} />
                </div>
                 <ScrollToBottomButton onClick={() => scrollToBottom('smooth')} visible={showScrollButton} />
              </div>

              <div className="flex-shrink-0">
                <MessageInput 
                    input={activeChat?.draft || ''}
                    setInput={handleInputChange}
                    handleSubmit={handleSubmit}
                    isLoading={isLoading}
                    onStartLiveConversation={handleStartLiveConversation}
                    isSpeechRecognitionSupported={isSpeechRecognitionSupported}
                    isListening={isListening}
                    onToggleListening={handleToggleListening}
                    file={activeChat?.draftFile || null}
                    onFileChange={handleFileChange}
                    onRemoveFile={handleRemoveFile}
                />
              </div>
          </div>
          {toastInfo && <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo(null)} />}
      </div>
    </SpeechProvider>
  );
};

export default ChatView;