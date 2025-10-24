import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { GoogleGenAI, Modality } from '@google/genai';
import type { Session, LiveServerMessage } from '@google/genai';
import { generateSystemInstruction } from '../services/geminiService';
import { createAudioBlob, decode, decodeAudioData } from '../utils/audioUtils';
import type { Denomination, UserProfile, Message } from '../types';
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
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const [isMicActive, setIsMicActive] = useState(false);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  const isMicActiveRef = useRef(isMicActive); 
  useEffect(() => {
    isMicActiveRef.current = isMicActive;
  }, [isMicActive]);

  useFocusTrap(modalRef, isOpen);
  
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userTranscript, aiTranscript]);

  useEffect(() => {
    if (!isOpen) return;

    let session: Session | null = null;
    let audioResources: {
        stream: MediaStream | null;
        inputContext: AudioContext | null;
        outputContext: AudioContext | null;
        source: MediaStreamAudioSourceNode | null;
        processor: ScriptProcessorNode | null;
        outputSources: Set<AudioBufferSourceNode>;
        nextStartTime: number;
    } = { stream: null, inputContext: null, outputContext: null, source: null, processor: null, outputSources: new Set(), nextStartTime: 0 };
    
    let isCancelled = false;

    const startSession = async () => {
      setStatus('connecting');
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isCancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        const inputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        const source = inputContext.createMediaStreamSource(stream);
        const processor = inputContext.createScriptProcessor(4096, 1, 1);

        audioResources = { stream, inputContext, outputContext, source, processor, outputSources: new Set(), nextStartTime: 0 };
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
        const systemInstruction = generateSystemInstruction(denomination, profile, true); // Use live conversation prompt
        
        const transcriptParts = { user: '', ai: '' };

        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            systemInstruction, 
            responseModalities: [Modality.AUDIO], 
            inputAudioTranscription: {}, 
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: profile.ttsSettings.voice === 'native' ? 'Zephyr' : profile.ttsSettings.voice } },
            },
          },
          callbacks: {
            onopen: () => {
              if (isCancelled) return;
              setStatus('listening');
              if (profile.liveChatMode === 'toggle') {
                 setIsMicActive(true);
              }

              processor.onaudioprocess = (e) => {
                if (isMicActiveRef.current) {
                  const inputData = e.inputBuffer.getChannelData(0);
                  const pcmBlob = createAudioBlob(inputData);
                  sessionPromise.then((session) => {
                    session.sendRealtimeInput({ media: pcmBlob });
                  });
                }
              };
              source.connect(processor);
              processor.connect(inputContext.destination);
            },
            onmessage: async (message) => {
              if (isCancelled) return;
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
                const outCtx = audioResources.outputContext!;
                if (outCtx.state === 'suspended') await outCtx.resume();
                
                audioResources.nextStartTime = Math.max(outCtx.currentTime, audioResources.nextStartTime);
                const audioBuffer = await decodeAudioData(decode(audioBase64), outCtx, 24000, 1);
                
                if (isCancelled) return;

                const audioSource = outCtx.createBufferSource();
                audioSource.buffer = audioBuffer;
                audioSource.connect(outCtx.destination);
                audioSource.start(audioResources.nextStartTime);
                audioResources.nextStartTime += audioBuffer.duration;
                
                const currentSources = audioResources.outputSources;
                currentSources.add(audioSource);
                audioSource.onended = () => {
                  currentSources.delete(audioSource);
                  if (currentSources.size === 0 && !isCancelled) {
                      setStatus('listening');
                  }
                };
              }
              if (message.serverContent?.turnComplete) {
                onTurnComplete(transcriptParts.user.trim(), transcriptParts.ai.trim());
                transcriptParts.user = '';
                transcriptParts.ai = '';
                setUserTranscript('');
                setAiTranscript('');
                if (!isCancelled) setStatus('listening');
              }
            },
            onerror: (e) => { console.error('Live session error:', e); if (!isCancelled) setStatus('error'); },
            onclose: () => { if (!isCancelled) setStatus('idle'); },
          },
        });
        
        session = await sessionPromise;

      } catch (err) {
        console.error("Failed to initialize session:", err);
        if (!isCancelled) setStatus('error');
      }
    };

    startSession();

    return () => { 
      isCancelled = true;
      session?.close();
      
      const { stream, processor, source, inputContext, outputContext, outputSources } = audioResources;
      stream?.getTracks().forEach(track => track.stop());
      
      if(processor) processor.disconnect();
      if(source) source.disconnect();
      
      outputSources.forEach(s => { 
        try { 
          s.onended = null;
          s.stop(); 
          s.disconnect(); 
        } catch (e) { console.warn("Error force-stopping audio source", e); } 
      });
      outputSources.clear();

      if (inputContext?.state !== 'closed') inputContext?.close().catch(console.warn);
      if (outputContext?.state !== 'closed') outputContext?.close().catch(console.warn);
    };
  }, [isOpen, denomination, profile, onTurnComplete, messages]);


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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-black z-50 flex flex-col animate-fade-in-up" onClick={onClose}>
        <div ref={modalRef} className="w-full h-full max-w-4xl mx-auto flex-1 flex flex-col" onClick={e => e.stopPropagation()}>
            <header className="flex-shrink-0 p-4 flex justify-between items-center text-white">
                <div className="text-sm font-semibold text-slate-300 w-32"><StatusIndicator /></div>
                <h2 className="text-xl font-bold">{t('liveConversationTitle')}</h2>
                <div className="w-32 flex justify-end">
                    <button onClick={onClose} className="p-2 rounded-full text-slate-300 hover:bg-white/10">
                        <CloseIcon className="w-6 h-6"/>
                    </button>
                </div>
            </header>
            
            <div className="flex-1 overflow-y-auto px-4 pb-96 min-h-0">
                <div className="text-white text-lg sm:text-2xl leading-relaxed space-y-6">
                    {userTranscript && <p><strong className="text-slate-400 font-medium">{t('liveYou')}: </strong>{userTranscript}</p>}
                    {aiTranscript && <p><strong className="text-cyan-400 font-medium">{t('liveAI')}: </strong>{aiTranscript}</p>}
                </div>
                <div ref={transcriptEndRef} />
            </div>

            <footer className="absolute bottom-0 left-0 right-0 h-96 flex flex-col items-center justify-end p-4 sm:p-8 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <button {...interactionHandlers} className="pointer-events-auto rounded-full focus:outline-none focus:ring-4 focus:ring-slate-500" aria-label={profile.liveChatMode === 'toggle' ? 'Toggle Microphone' : 'Hold to Talk'}>
                    <LiveVisualizer status={status} isMicActive={isMicActive} />
                </button>
                <button onClick={onClose} className="mt-8 px-8 py-3 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 transition-colors pointer-events-auto flex items-center gap-2">
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