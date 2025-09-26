import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { startChat, sendMessageStream, parseMarkdownResponse, generateTitle } from '../services/geminiService';
import type { Message, UserProfile, WebSource, GroundingChunk, ChatSession } from '../types';
import { Denomination, MessageSender } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';
import { SettingsIcon, DeenBridgeLogoIcon, MenuIcon, PlusIcon, MessageSquareIcon, TrashIcon, PencilIcon, ArchiveIcon, UnarchiveIcon, PinIcon, PinFilledIcon } from './icons';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import MessageBubble from './MessageBubble';
import Toast from './Toast';
import { SpeechProvider } from '../contexts/SpeechContext';
import type { Chat, GenerateContentResponse } from '@google/genai';
import LanguageSwitcher from './LanguageSwitcher';
import { useLocale } from '../contexts/LocaleContext';
import QuranReader from './QuranReader';

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
  const [isArchivedOpen, setIsArchivedOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { t, locale } = useLocale();
  
  // --- Voice Input State ---
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const draftBeforeRecordingRef = useRef('');

  // --- Toast State ---
  const [toastInfo, setToastInfo] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const { activeChats, archivedChats, pinnedChats } = useMemo(() => {
    const sortedChats = [...chats].sort((a, b) => b.createdAt - a.createdAt);
    return {
      activeChats: sortedChats.filter(c => !c.isArchived && !c.isPinned),
      archivedChats: sortedChats.filter(c => c.isArchived),
      pinnedChats: sortedChats.filter(c => c.isPinned && !c.isArchived),
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
      isArchived: false,
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChatId);
    setIsSidebarOpen(false);
  }, [setChats, setActiveChatId]);
  
  useEffect(() => {
    const unarchivedChats = chats.filter(c => !c.isArchived);
    if (unarchivedChats.length === 0) {
      handleNewChat();
    } else if (!activeChatId || !unarchivedChats.find(c => c.id === activeChatId)) {
      setActiveChatId(unarchivedChats[0]?.id || null);
    }
  }, [chats, activeChatId, setActiveChatId, handleNewChat]);

  useEffect(() => {
    if (activeChat) {
      const chatInstance = startChat(denomination, activeChat.messages, profile);
      setChat(chatInstance);
    }
  }, [activeChatId, chats, denomination, profile]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);
  
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

  const handleToggleRecording = useCallback(() => {
    if (!isSpeechSupported || !recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false); // Make UI responsive immediately
    } else {
      draftBeforeRecordingRef.current = activeChat?.draft ? activeChat.draft + ' ' : '';
      handleInputChange(draftBeforeRecordingRef.current);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Speech recognition failed to start:", e);
        setIsRecording(false); // Ensure state is correct if start fails
      }
    }
  }, [isSpeechSupported, isRecording, activeChat?.draft, handleInputChange]);


  // --- Voice Input Logic ---
  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = profile.appLanguage === 'ar' ? 'ar-SA' : 'en-US';

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }
        handleInputChange(draftBeforeRecordingRef.current + finalTranscript + interimTranscript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        let message = "An unknown voice input error occurred.";
        switch (event.error) {
            case 'not-allowed':
            case 'service-not-allowed':
                message = "Microphone access denied. Please allow microphone access in your browser settings.";
                break;
            case 'no-speech':
                message = "No speech was detected. Please try again.";
                break;
            case 'network':
                message = "A network error occurred during speech recognition. Please check your connection.";
                break;
            case 'aborted':
                // This is a user-initiated stop, not an error.
                return;
        }
        setToastInfo({ message, type: 'error' });
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    } else {
        console.warn("Speech Recognition not supported by this browser.");
        setIsSpeechSupported(false);
    }
  }, [handleInputChange, profile.appLanguage]);
  
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
    if (isRecording) {
      handleToggleRecording(); // Stop recording, let user press send again
      return;
    }
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
            const nextActiveChat = chats.filter(c => !c.isArchived).find(c => c.id !== chatIdToDelete);
            setActiveChatId(nextActiveChat?.id || null);
            if (!nextActiveChat) {
              setTimeout(handleNewChat, 0);
            }
        }
        return remainingChats;
    });
  };
  
  const handleArchiveChat = (e: React.MouseEvent, chatIdToArchive: string) => {
    e.stopPropagation();
    setChats(prev => prev.map(c => c.id === chatIdToArchive ? { ...c, isArchived: true } : c));
    if (activeChatId === chatIdToArchive) {
      const nextActiveChat = chats.filter(c => !c.isArchived).find(c => c.id !== chatIdToArchive);
      setActiveChatId(nextActiveChat?.id || null);
      if (!nextActiveChat) {
        setTimeout(handleNewChat, 0);
      }
    }
  };

  const handleUnarchiveChat = (e: React.MouseEvent, chatIdToUnarchive: string) => {
    e.stopPropagation();
    setChats(prev => prev.map(c => c.id === chatIdToUnarchive ? { ...c, isArchived: false } : c));
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

  const ChatItem: React.FC<{session: ChatSession, isArchived: boolean}> = ({ session, isArchived }) => (
    <a key={session.id} onClick={() => handleSelectChat(session.id)} className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${activeChatId === session.id ? 'bg-[var(--color-border)] text-[var(--color-text-primary)]' : 'hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_50%)]'}`}>
        <MessageSquareIcon className="w-5 h-5 flex-shrink-0" />
        {editingChatId === session.id ? (
        <form onSubmit={(e) => { e.preventDefault(); handleSaveTitle(session.id); }} className="flex-1">
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
        <span onDoubleClick={(e) => handleStartEditing(e, session)} className="flex-1 truncate text-sm font-medium">{session.title}</span>
        )}
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ms-2 shrink-0">
        {!isArchived && (
            <button
                onClick={(e) => handleTogglePinChat(e, session.id)}
                className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_80%)]"
                aria-label={session.isPinned ? t('unpinChat') : t('pinChat')}
            >
                {session.isPinned ? <PinFilledIcon className="w-4 h-4 text-[var(--color-accent)]" /> : <PinIcon className="w-4 h-4" />}
            </button>
        )}
        {editingChatId !== session.id && (
                <button
                    onClick={(e) => handleStartEditing(e, session)}
                    className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_80%)]"
                    aria-label={t('renameChat')}
                >
                    <PencilIcon className="w-4 h-4" />
                </button>
            )}
        {isArchived ? (
            <button
                onClick={(e) => handleUnarchiveChat(e, session.id)}
                className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_80%)]"
                aria-label="Unarchive Chat"
            >
                <UnarchiveIcon className="w-4 h-4" />
            </button>
        ) : (
            <button
                onClick={(e) => handleArchiveChat(e, session.id)}
                className="p-2 text-[var(--color-text-subtle)] hover:text-[var(--color-text-primary)] rounded-full hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_80%)]"
                aria-label="Archive Chat"
            >
                <ArchiveIcon className="w-4 h-4" />
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

  return (
    <SpeechProvider>
      <div className="flex h-screen w-screen bg-transparent overflow-hidden">
          {isQuranReaderOpen && <QuranReader isOpen={isQuranReaderOpen} onClose={() => setIsQuranReaderOpen(false)} profile={profile} setToastInfo={setToastInfo} />}
          {/* Backdrop for mobile sidebar */}
          <div onClick={() => setIsSidebarOpen(false)} className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-20 md:hidden transition-opacity duration-300 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

          <aside className={`absolute md:static top-0 start-0 h-full w-64 md:w-72 bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_70%)] backdrop-blur-xl border-e border-[var(--color-border)] flex flex-col z-30 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : sidebarHiddenClass} md:translate-x-0`}>
              <div className="p-2 border-b border-[var(--color-border)]">
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
                    <ChatItem key={session.id} session={session} isArchived={false} />
                  ))}
                  {pinnedChats.length > 0 && activeChats.length > 0 && <div className="py-2"><div className="border-t border-[var(--color-border)]"></div></div>}
                  {activeChats.map(session => (
                    <ChatItem key={session.id} session={session} isArchived={false} />
                  ))}
              </nav>

              {archivedChats.length > 0 && (
                <div className="p-2 border-t border-[var(--color-border)]">
                    <button onClick={() => setIsArchivedOpen(!isArchivedOpen)} className="w-full text-left px-3 py-2 text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                        Archived ({archivedChats.length})
                    </button>
                    {isArchivedOpen && (
                        <div className="mt-1 space-y-1">
                            {archivedChats.map(session => (
                                <ChatItem key={session.id} session={session} isArchived={true} />
                            ))}
                        </div>
                    )}
                </div>
              )}
          </aside>

          <div className={`flex flex-col flex-1 h-screen relative main-panel-transition ${isSidebarOpen ? 'md:rounded-none md:translate-x-0' : ''}`}>
              <header className="flex items-center justify-between p-4 bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_60%)] backdrop-blur-md shadow-sm border-b border-[var(--color-border)] z-10 flex-shrink-0 rtl:flex-row-reverse">
                  <div className="flex items-center gap-3">
                      <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ms-2 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors active:scale-90 md:hidden" aria-label="Open chat history">
                          <MenuIcon />
                      </button>
                      <div className="w-10 h-10 sm:w-12 sm:h-12 p-1 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-full flex items-center justify-center shadow-inner text-white">
                          <DeenBridgeLogoIcon />
                      </div>
                      <div>
                          <h1 className="text-lg sm:text-xl font-bold text-[var(--color-text-primary)]">DeenBridge</h1>
                          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">{getTraditionText()}</p>
                      </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsQuranReaderOpen(true)} className="p-3 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors active:scale-90" aria-label="Read Quran">
                        <img src="/Quran-svg.png" alt="Read Quran" className="h-6 w-6" />
                    </button>
                    <LanguageSwitcher />
                    <button onClick={onOpenSettings} className="p-3 rounded-full text-[var(--color-text-primary)] hover:bg-[var(--color-border)] transition-colors active:scale-90" aria-label="Open settings">
                        <SettingsIcon />
                    </button>
                  </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col space-y-6">
                  {!activeChat || activeChat.messages.length === 0 ? (
                  <EmptyState denomination={denomination} onQuery={handleQueryFromHint} />
                  ) : (
                  activeChat.messages.map((message) => (
                      <MessageBubble key={message.id} message={message} denomination={denomination} profile={profile} />
                  ))
                  )}
                  <div ref={messagesEndRef} />
              </div>
              
              <MessageInput 
                  input={activeChat?.draft || ''}
                  setInput={handleInputChange}
                  handleSubmit={handleSubmit}
                  isLoading={isLoading}
                  isRecording={isRecording}
                  onToggleRecording={handleToggleRecording}
                  isSpeechSupported={isSpeechSupported}
                  file={activeChat?.draftFile || null}
                  onFileChange={handleFileChange}
                  onRemoveFile={handleRemoveFile}
              />
          </div>
          {toastInfo && <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo(null)} />}
      </div>
    </SpeechProvider>
  );
};

export default ChatView;