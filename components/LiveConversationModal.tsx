import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { GoogleGenAI, Modality } from '@google/genai';
import type { LiveSession, LiveServerMessage } from '@google/genai';
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

const LiveConversationModal: React.FC<LiveConversationModalProps> = ({
  isOpen,
  onClose,
  profile,
  denomination,
  onTurnComplete,
}) => {
  const { t } = useLocale();
  const [sessionPromise, setSessionPromise] = useState<Promise<LiveSession> | null>(null);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'listening' | 'speaking' | 'error'>('idle');
  const [userTranscript, setUserTranscript] = useState('');
  const [aiTranscript, setAiTranscript] = useState('');
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const audioResources = useRef<{
    stream: MediaStream | null;
    inputContext: AudioContext | null;
    outputContext: AudioContext | null;
    source: MediaStreamAudioSourceNode | null;
    processor: ScriptProcessorNode | null;
    outputSources: Set<AudioBufferSourceNode>;
    nextStartTime: number;
  }>({ stream: null, inputContext: null, outputContext: null, source: null, processor: null, outputSources: new Set(), nextStartTime: 0 });

  const stopSession = useCallback(() => {
    sessionPromise?.then(session => {
      try { session.close(); } catch (e) { console.warn("Session already closed or failed to close."); }
    });
    audioResources.current.stream?.getTracks().forEach(track => track.stop());
    audioResources.current.processor?.disconnect();
    audioResources.current.source?.disconnect();
    if (audioResources.current.inputContext?.state !== 'closed') audioResources.current.inputContext?.close().catch(()=>{});
    if (audioResources.current.outputContext?.state !== 'closed') audioResources.current.outputContext?.close().catch(()=>{});
    audioResources.current.outputSources.forEach(s => { try { s.stop(); } catch(e){} });

    audioResources.current = { stream: null, inputContext: null, outputContext: null, source: null, processor: null, outputSources: new Set(), nextStartTime: 0 };
    setSessionPromise(null);
    setStatus('idle');
    setUserTranscript('');
    setAiTranscript('');
  }, [sessionPromise]);

  const handleClose = useCallback(() => {
    stopSession();
    onClose();
  }, [stopSession, onClose]);

  const startSession = useCallback(async () => {
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
      
      let currentInput = '';
      let currentOutput = '';

      const newSessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          systemInstruction,
          responseModalities: [Modality.AUDIO],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
        callbacks: {
          onopen: () => {
            setStatus('listening');
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createAudioBlob(inputData);
              newSessionPromise.then(session => session?.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(processor);
            processor.connect(inputContext.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
                const { text, isFinal } = message.serverContent.inputTranscription;
                if(isFinal) {
                    currentInput += text + ' ';
                    setUserTranscript(currentInput);
                } else {
                    setUserTranscript(currentInput + text);
                }
            }
            if (message.serverContent?.outputTranscription) {
                const { text } = message.serverContent.outputTranscription;
                setStatus('speaking');
                currentOutput += text;
                setAiTranscript(currentOutput);
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
                audioResources.current.outputSources.add(audioSource);
                audioSource.onended = () => {
                    audioResources.current.outputSources.delete(audioSource);
                };
            }
            if (message.serverContent?.turnComplete) {
                onTurnComplete(currentInput.trim(), currentOutput.trim());
                currentInput = '';
                currentOutput = '';
                setUserTranscript('');
                setAiTranscript('');
                setStatus('listening');
            }
          },
          onerror: (e) => {
            console.error('Live session error:', e);
            setStatus('error');
          },
          onclose: () => {
             // Let the main effect cleanup handle state update to avoid race conditions.
          },
        },
      });

      setSessionPromise(newSessionPromise);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setStatus('error');
    }
  }, [denomination, profile, onTurnComplete]);

  useEffect(() => {
    if (isOpen) {
      startSession();
    }
    return () => {
      stopSession();
    };
  }, [isOpen, startSession, stopSession]);


  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [userTranscript, aiTranscript]);

  const StatusIndicator = () => {
    switch (status) {
        case 'connecting': return <div className="flex items-center gap-2"><LoadingSpinner className="w-4 h-4" /> <span>{t('liveStatusConnecting')}</span></div>;
        case 'listening': return <div className="text-emerald-400">{t('liveStatusListening')}</div>;
        case 'speaking': return <div className="text-cyan-400">{t('liveStatusSpeaking')}</div>;
        case 'error': return <div className="text-red-400">{t('liveStatusError')}</div>;
        default: return <span>{t('liveStatusIdle')}</span>;
    }
  }

  if (!isOpen) return null;

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
                <div className="pointer-events-auto">
                    <LiveVisualizer status={status} />
                </div>
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