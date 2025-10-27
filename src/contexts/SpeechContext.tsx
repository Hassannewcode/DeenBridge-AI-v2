import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useEnhancedSpeech } from '../hooks/useEnhancedSpeech';
import type { UserProfile } from '../types';
// FIX: Update import path for Toast component to match refactored structure.
import Toast from '../components/common/Toast';

interface SpeechContextType {
  speak: (messageId: string, text: string, lang: 'en' | 'ar', settings: UserProfile['ttsSettings']) => void;
  cancel: () => void;
  speakingMessageId: string | null;
  loadingMessageId: string | null;
  isLoading: boolean;
  isSupported: boolean;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export const SpeechProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const handleSpeechEnd = useCallback(() => {
    setSpeakingMessageId(null);
    setLoadingMessageId(null);
  }, []);

  const { speak: enhancedSpeak, cancel: enhancedCancel, isSupported, isLoading } = useEnhancedSpeech();

  const speak = useCallback((messageId: string, text: string, lang: 'en' | 'ar', settings: UserProfile['ttsSettings']) => {
    if (!isSupported) return;
    setSpeakingMessageId(messageId);
    setLoadingMessageId(messageId);
    setSpeechError(null);

    const handleError = (error: string) => {
        setSpeechError(error);
    };

    enhancedSpeak(text, lang, settings, handleSpeechEnd, handleError);
  }, [isSupported, enhancedSpeak, handleSpeechEnd]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    enhancedCancel();
    // The onEnd callback in the hook will handle resetting the state
  }, [isSupported, enhancedCancel]);
  
  const value = useMemo(() => ({
      speak,
      cancel,
      speakingMessageId,
      loadingMessageId,
      isLoading,
      isSupported
  }), [speak, cancel, speakingMessageId, loadingMessageId, isLoading, isSupported]);

  return (
    <SpeechContext.Provider value={value}>
      {children}
      {speechError && <Toast message={speechError} type="error" onClose={() => setSpeechError(null)} />}
    </SpeechContext.Provider>
  );
};

export const useSpeech = (): SpeechContextType => {
  const context = useContext(SpeechContext);
  if (context === undefined) {
    throw new Error('useSpeech must be used within a SpeechProvider');
  }
  return context;
};
