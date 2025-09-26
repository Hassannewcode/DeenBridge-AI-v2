
import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useEnhancedSpeech } from '../hooks/useEnhancedSpeech';

interface SpeechContextType {
  speak: (messageId: string, text: string, lang: 'en' | 'ar') => void;
  cancel: () => void;
  speakingMessageId: string | null;
  isSupported: boolean;
}

const SpeechContext = createContext<SpeechContextType | undefined>(undefined);

export const SpeechProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  
  const handleSpeechEnd = useCallback(() => {
    setSpeakingMessageId(null);
  }, []);

  const { speak: enhancedSpeak, cancel: enhancedCancel, isSupported } = useEnhancedSpeech();

  const speak = useCallback((messageId: string, text: string, lang: 'en' | 'ar') => {
    if (!isSupported) return;
    setSpeakingMessageId(messageId);
    enhancedSpeak(text, lang, handleSpeechEnd);
  }, [isSupported, enhancedSpeak, handleSpeechEnd]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    enhancedCancel();
    // The onEnd callback in the hook will handle resetting speakingMessageId
  }, [isSupported, enhancedCancel]);
  
  const value = useMemo(() => ({
      speak,
      cancel,
      speakingMessageId,
      isSupported
  }), [speak, cancel, speakingMessageId, isSupported]);

  return (
    <SpeechContext.Provider value={value}>
      {children}
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
