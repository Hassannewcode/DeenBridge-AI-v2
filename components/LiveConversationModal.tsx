
import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Session, LiveServerMessage } from '@google/genai';
import { generateSystemInstruction } from '../services/geminiService';
import { createAudioBlob, decode, decodeAudioData } from '../utils/audioUtils';
import type { Denomination, UserProfile } from '../types';
import { CloseIcon, LoadingSpinner, PhoneIcon } from './icons';
import { useLocale } from '../contexts/LocaleContext';
import LiveVisualizer from './LiveVisualizer';

interface LiveConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  denomination: Denomination;
  onTurnComplete: (userText: string, aiText: string) => void;
}

const LiveConversationModal: React.FC<LiveConversationModalProps> = ({ isOpen, onClose, profile, denomination, onTurnComplete }) => {
  const { t } = useLocale();
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Use refs for resources that don't need to trigger re-renders
  const sessionRef = useRef<Session | null>(null);
  const isMicActiveRef = useRef(isMicActive); // Ref to get current state in callbacks
  const audioResources = useRef<{
    stream: MediaStream | null;
    inputContext: AudioContext | null;
    outputContext: AudioContext | null;
    source: MediaStreamAudioSourceNode | null;
    processor: ScriptProcessorNode | null;
    outputSources: Set<AudioBufferSourceNode>;
    nextStartTime: number;
  }>({ stream: null, inputContext: null, outputContext: null, source: null, processor: null, outputSources: new Set(), nextStartTime: 0 });
  const transcriptParts = useRef({ user: '', ai: '' });

  // Sync isMicActive state with a ref for use in audio processor callback
  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  const stopSession = useCallback(() => {
    sessionRef.current?.close();
    sessionRef.current = null;
    
    const { stream, processor, source, inputContext, outputContext, outputSources } = audioResources.current;
    stream?.getTracks().forEach(track => track.stop());
    processor?.disconnect();
    source?.disconnect();
    
    outputSources.forEach(s => { try { s.stop(); s.disconnect(); } catch (e) { console.warn("Error stopping audio source", e); } });
    outputSources.clear();

    if (inputContext?.state !== 'closed') inputContext?.close().catch(console.warn);
    if (outputContext?.state !== 'closed') outputContext?.close().catch(console.warn);

    // Reset refs and state
    audioResources.current = { stream: null, inputContext: null, outputContext: null, source: null, processor: null, outputSources: new Set(), nextStartTime: 0 };
    setStatus('idle');
    setUserTranscript('');
    setAiTranscript('');
    setIsMicActive(false);
  }, []);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);
  
  // Main effect to manage session lifecycle
  useEffect(() => {
    if (!isOpen) {
      stopSession();
      return;
    }

    let sessionPromise: Promise<Session> | null = null;

    const start = async () => {
      setStatus('connecting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const source = inputContext.createMediaStreamSource(stream);
        const processor = inputContext.createScriptProcessor(4096, 1, 1);

        audioResources.current = { stream, inputContext, outputContext, source, processor, outputSources: new Set(), nextStartTime: 0 };
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const systemInstruction = generateSystemInstruction(denomination, profile);
        
        sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: { systemInstruction, responseModalities: [Modality.AUDIO], inputAudioTranscription: {}, outputAudioTranscription: {} },
          callbacks: {
            onopen: async () => {
              // FIX: Use `await` to correctly resolve the session promise. The onopen callback is now async.
              sessionRef.current = sessionPromise ? await sessionPromise : null;
              setStatus('listening');
              if (profile.liveChatMode === 'toggle') {
                 setIsMicActive(true); // Auto-activate mic in toggle mode
              }

              processor.onaudioprocess = (e) => {
                if (isMicActiveRef.current) {
                  const inputData = e.inputBuffer.getChannelData(0);
                  const pcmBlob = createAudioBlob(inputData);
                  // FIX: Adhere to Gemini API guidelines by using the session promise directly to prevent stale closures.
                  sessionPromise?.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                  });
                }
              };
              source.connect(processor);
              processor.connect(inputContext.destination);
            },
            onmessage: async (message) => {
              if (message.serverContent?.inputTranscription) {
                transcriptParts.current.user += message.serverContent.inputTranscription.text;
                setUserTranscript(transcriptParts.current.user);
              }
              if (message.serverContent?.outputTranscription) {
                setStatus('speaking');
                transcriptParts.current.ai += message.serverContent.outputTranscription.text;
                setAiTranscript(transcriptParts.current.ai);
              }
              if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                const audioBase64 = message.serverContent.modelTurn.parts[0].inlineData.data;
                const outCtx = audioResources.current.outputContext!;
                if (outCtx.state === 'suspended') await outCtx.resume();
                
                const nextStartTime = Math.max(outCtx.currentTime, audioResources.current.nextStartTime);
                const audioBuffer = await decodeAudioData(decode(audioBase64), outCtx, 24000, 1);
                
                const audioSource = outCtx.createBufferSource();
                audioSource.buffer = audioBuffer;
                audioSource.connect(outCtx.destination);
                audioSource.start(nextStartTime);
                audioResources.current.nextStartTime = nextStartTime + audioBuffer.duration;
                
                const currentSources = audioResources.current.outputSources;
                currentSources.add(audioSource);
                audioSource.onended = () => {
                  currentSources.delete(audioSource);
                  if (currentSources.size === 0) {
                      setStatus('listening');
                  }
                };
              }
              if (message.serverContent?.turnComplete) {
                onTurnComplete(transcriptParts.current.user.trim(), transcriptParts.current.ai.trim());
                transcriptParts.current = { user: '', ai: '' };
                setUserTranscript('');
                setAiTranscript('');
                setStatus('listening');
              }
            },
            onerror: (e) => { console.error('Live session error:', e); setStatus('error'); },
            onclose: () => { setStatus('idle'); },
          },
        });
      } catch (err) {
        console.error("Failed to initialize session:", err);
        setStatus('error');
      }
    };

    start();

    return () => {
      stopSession();
    };
  }, [isOpen, denomination, profile, onTurnComplete, stopSession]);


  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userTranscript, aiTranscript]);

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
        case 'listening': return <div className="text-emerald-400">{isMicActive ? t('liveStatusListening') : 'Mic Off'}</div>;
        case 'speaking': return <div className="text-cyan-400">{t('liveStatusSpeaking')}</div>;
        case 'error': return <div className="text-red-400">{t('liveStatusError')}</div>;
        default: return <span>{t('liveStatusIdle')}</span>;
    }
  }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black z-50 flex flex-col animate-fade-in-up" onClick={handleClose}>
        <div className="w-full h-full max-w-4xl mx-auto flex-1 flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex-shrink-0 p-4 flex justify-between items-center text-white">
                <div className="text-sm font-semibold text-slate-300 w-32"><StatusIndicator /></div>
                <h2 className="text-xl font-bold">{t('liveConversationTitle')}</h2>
                <div className="w-32 flex justify-end">
                    <button onClick={handleClose} className="p-2 rounded-full text-slate-300 hover:bg-white/10">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto px-4 pb-96 min-h-0">
                <div className="text-white text-2xl leading-relaxed space-y-6">
                    {userTranscript && <p><strong className="text-slate-400 font-medium">{t('liveYou')}: </strong>{userTranscript}</p>}
                    {aiTranscript && <p><strong className="text-cyan-400 font-medium">{t('liveAI')}: </strong>{aiTranscript}</p>}
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
