
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Session, LiveServerMessage } from '@google/genai';
import { generateSystemInstruction } from '../services/geminiService';
import { createAudioBlob, decode, decodeAudioData } from '../utils/audioUtils';
import type { Denomination, UserProfile, Message } from '../types';
// FIX: Import PhoneIcon
import { CloseIcon, LoadingSpinner, PhoneIcon } from './icons';
import { useLocale } from '../contexts/LocaleContext';
import LiveVisualizer from './LiveVisualizer';
import { useFocusTrap } from '../lib/focus';

interface LiveConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  denomination: Denomination;
  onTurnComplete: (userText: string, aiText: string) => void;
  messages: Message[];
}

const LiveConversationModal: React.FC<LiveConversationModalProps> = ({ isOpen, onClose, profile, denomination, onTurnComplete, messages }) => {
  const { t } = useLocale();
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error' | 'reconnecting'>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const isMicActiveRef = useRef(isMicActive); 
  const sessionRef = useRef<Session | null>(null);
  const audioResourcesRef = useRef<any>(null);
  const isCancelledRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const startSessionRef = useRef<(() => Promise<void>) | null>(null);


  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  useFocusTrap(modalRef, isOpen);
  
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userTranscript, aiTranscript]);

  const cleanup = useCallback(() => {
    isCancelledRef.current = true;
    console.log('Live session: Cleaning up resources.');

    if (sessionRef.current) {
        try {
            sessionRef.current.close();
            console.log('Live session: Session closed.');
        } catch (e) {
            console.warn('Live session: Error closing session:', e);
        }
        sessionRef.current = null;
    }

    const res = audioResourcesRef.current;
    if (res) {
        res.stream?.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        console.log('Live session: Microphone stream stopped.');

        if (res.processor) res.processor.disconnect();
        if (res.source) res.source.disconnect();
        
        res.outputSources?.forEach((s: AudioBufferSourceNode) => {
            try {
                s.onended = null;
                s.stop();
                s.disconnect();
            } catch (e) {}
        });
        res.outputSources.clear();
        console.log('Live session: Output audio sources stopped.');

        if (res.inputContext?.state !== 'closed') res.inputContext.close().catch((e: any) => console.warn('Input context close error:', e));
        if (res.outputContext?.state !== 'closed') res.outputContext.close().catch((e: any) => console.warn('Output context close error:', e));
        console.log('Live session: Audio contexts closed.');
    }
    audioResourcesRef.current = null;
    setIsMicActive(false);
  }, []);

  const handleClose = useCallback(() => {
    if (userTranscript.trim() || aiTranscript.trim()) {
        onTurnComplete(userTranscript.trim(), aiTranscript.trim());
    }
    cleanup();
    onClose();
// FIX: Removed erroneous 'on' from the useCallback dependency array.
  }, [cleanup, onClose, onTurnComplete, userTranscript, aiTranscript]);

  const handleReconnect = useCallback(() => {
    if (isCancelledRef.current) return;
    
    reconnectAttemptsRef.current += 1;
    if (reconnectAttemptsRef.current > 3) {
      console.error("Reconnection failed after multiple attempts.");
      setStatus('error');
      return;
    }

    const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
    setStatus('reconnecting');

    setTimeout(() => {
        if (!isCancelledRef.current && startSessionRef.current) {
            console.log(`Attempting to reconnect... (Attempt ${reconnectAttemptsRef.current})`);
            cleanup();
            isCancelledRef.current = false; // Reset cancellation flag for the new attempt
            startSessionRef.current();
        }
    }, delay);
  }, [cleanup]);


  useEffect(() => {
    if (!isOpen) return;

    isCancelledRef.current = false;
    reconnectAttemptsRef.current = 0;

    const startSession = async () => {
      setStatus('connecting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCancelledRef.current) { stream.getTracks().forEach(track => track.stop()); return; }

        const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const source = inputContext.createMediaStreamSource(stream);
        const processor = inputContext.createScriptProcessor(4096, 1, 1);

        audioResourcesRef.current = { stream, inputContext, outputContext, source, processor, outputSources: new Set(), nextStartTime: 0 };
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const systemInstruction = generateSystemInstruction(denomination, profile, true);
        
        const transcriptParts = { user: '', ai: '' };

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            systemInstruction, 
            responseModalities: [Modality.AUDIO], 
            inputAudioTranscription: {}, 
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: profile.ttsSettings.voice === 'native' ? 'Charon' : profile.ttsSettings.voice } },
            },
          },
          callbacks: {
            onopen: () => {
              if (isCancelledRef.current) return;
              reconnectAttemptsRef.current = 0;
              setStatus('listening');
              if (profile.liveChatMode === 'toggle') setIsMicActive(true);

              processor.onaudioprocess = (e) => {
                if (isMicActiveRef.current) {
                  const inputData = e.inputBuffer.getChannelData(0);
                  const pcmBlob = createAudioBlob(inputData);
                  sessionPromise.then((session) => session.sendRealtimeInput({ media: pcmBlob }));
                }
              };
              source.connect(processor);
              processor.connect(inputContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
              if (isCancelledRef.current) return;
              const audioRes = audioResourcesRef.current;
              if (!audioRes) return;

              if (message.serverContent?.interrupted) {
                audioRes.outputSources.forEach((source: AudioBufferSourceNode) => {
                    try { source.onended = null; source.stop(); source.disconnect(); } catch (e) {}
                });
                audioRes.outputSources.clear();
                audioRes.nextStartTime = 0;
                setStatus('listening');
              }

              if (message.serverContent?.inputTranscription) {
                transcriptParts.user += message.serverContent.inputTranscription.text;
                setUserTranscript(transcriptParts.user);
              }
              if (message.serverContent?.outputTranscription) {
                setStatus('speaking');
                transcriptParts.ai += message.serverContent.outputTranscription.text;
                setAiTranscript(transcriptParts.ai);
              }
              if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                const audioBase64 = message.serverContent.modelTurn.parts[0].inlineData.data;
                const outCtx = audioRes.outputContext!;
                if (outCtx.state === 'suspended') await outCtx.resume();
                
                audioRes.nextStartTime = Math.max(outCtx.currentTime, audioRes.nextStartTime);
                const audioBuffer = await decodeAudioData(decode(audioBase64), outCtx, 24000, 1);
                
                if (isCancelledRef.current) return;

                const audioSource = outCtx.createBufferSource();
                audioSource.buffer = audioBuffer;
                audioSource.connect(outCtx.destination);
                audioSource.start(audioRes.nextStartTime);
                audioRes.nextStartTime += audioBuffer.duration;
                
                audioRes.outputSources.add(audioSource);
                audioSource.onended = () => {
                  audioRes.outputSources.delete(audioSource);
                  if (audioRes.outputSources.size === 0 && !isCancelledRef.current) setStatus('listening');
                };
              }
              if (message.serverContent?.turnComplete) {
                if (transcriptParts.user.trim() || transcriptParts.ai.trim()) {
                    onTurnComplete(transcriptParts.user.trim(), transcriptParts.ai.trim());
                }
                transcriptParts.user = '';
                transcriptParts.ai = '';
                setUserTranscript('');
                setAiTranscript('');
                if (!isCancelledRef.current) setStatus('listening');
              }
            },
            onerror: (e) => { console.error('Live session error:', e); if (!isCancelledRef.current) handleReconnect(); },
            onclose: (e) => { 
                console.log('Live session closed. Code:', e.code, 'Reason:', e.reason);
                if (!isCancelledRef.current && e.code !== 1000) handleReconnect();
            },
          },
        });
        
        sessionRef.current = await sessionPromise;

      } catch (err) {
        console.error("Failed to initialize session:", err);
        if (!isCancelledRef.current) handleReconnect();
      }
    };
    
    startSessionRef.current = startSession;
    startSession();

    return () => { 
      cleanup();
    };
  }, [isOpen, denomination, profile, onTurnComplete, messages, cleanup, handleReconnect]);


  const handleToggleMic = () => setIsMicActive(prev => !prev);
  const handleMicDown = () => setIsMicActive(true);
  const handleMicUp = () => setIsMicActive(false);

  const interactionHandlers = profile.liveChatMode === 'toggle'
    ? { onClick: handleToggleMic }
    : {
        onMouseDown: handleMicDown, onMouseUp: handleMicUp, onMouseLeave: handleMicUp,
        onTouchStart: handleMicDown, onTouchEnd: handleMicUp
      };

  const StatusIndicator = () => {
    switch (status) {
        case 'connecting': return <div className="flex items-center gap-2"><LoadingSpinner className="w-4 h-4" /> <span>{t('liveStatusConnecting')}</span></div>;
        case 'reconnecting': return <div className="flex items-center gap-2 text-amber-400"><LoadingSpinner className="w-4 h-4" /> <span>Reconnecting...</span></div>;
        case 'listening': return <div className="text-emerald-400">{isMicActive ? t('liveStatusListening') : 'Mic Off'}</div>;
        case 'speaking': return <div className="text-cyan-400">{t('liveStatusSpeaking')}</div>;
        case 'error': return <div className="text-red-400">{t('liveStatusError')}</div>;
        default: return <span>{t('liveStatusIdle')}</span>;
    }
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black z-50 flex flex-col animate-fade-in-up" onClick={handleClose}>
        <div ref={modalRef} className="w-full h-full max-w-4xl mx-auto flex-1 flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex-shrink-0 p-4 flex justify-between items-center text-white">
                <div className="text-sm font-semibold text-slate-300 w-32"><StatusIndicator /></div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {t('liveConversationTitle')}
                  <span className="text-xs font-semibold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full align-middle">Beta</span>
                </h2>
                <div className="w-32 flex justify-end">
                    <button onClick={handleClose} className="p-2 rounded-full text-slate-300 hover:bg-white/10">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto px-4 pb-96 min-h-0">
                <div className="text-white text-lg sm:text-2xl leading-relaxed space-y-6">
                    {userTranscript && (
                      <div className="animate-fade-in-up">
                          <strong className="text-slate-400 font-medium">{t('liveYou')}: </strong>
                          <span>{userTranscript}</span>
                      </div>
                    )}
                    {aiTranscript && (
                        <div className="animate-fade-in-up">
                            <strong className="text-cyan-400 font-medium">{t('liveAI')}: </strong>
                            <span>{aiTranscript}</span>
                        </div>
                    )}
                </div>
                <div ref={transcriptEndRef} />
            </div>

            <footer className="absolute bottom-0 left-0 right-0 h-96 flex flex-col items-center justify-end p-4 sm:p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <button {...interactionHandlers} className="pointer-events-auto rounded-full focus:outline-none focus:ring-4 focus:ring-slate-500" aria-label={profile.liveChatMode === 'toggle' ? 'Toggle Microphone' : 'Hold to Talk'}>
                    <LiveVisualizer status={status} isMicActive={isMicActive} />
                </button>
                <button onClick={handleClose} className="mt-8 px-8 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors pointer-events-auto flex items-center gap-2">
                    <PhoneIcon hangUp={true} className="w-5 h-5"/>
                    <span>{t('liveEndSession')}</span>
                </button>
            </footer>
        </div>
    </div>,
    document.body
  );
};

export default LiveConversationModal;
