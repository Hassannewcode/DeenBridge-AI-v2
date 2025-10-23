import React from 'react';
import { MicrophoneIcon } from './icons';

interface LiveVisualizerProps {
  status: 'idle' | 'connecting' | 'listening' | 'speaking' | 'error';
  isMicActive: boolean;
}

const LiveVisualizer: React.FC<LiveVisualizerProps> = ({ status, isMicActive }) => {
  const isSpeaking = status === 'speaking';
  const isListening = isMicActive && !isSpeaking;

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      {/* Speaking Waves */}
      {isSpeaking && (
        <>
          <div className="absolute w-full h-full rounded-full bg-cyan-500/50 animate-[wave_2s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}></div>
          <div className="absolute w-full h-full rounded-full bg-cyan-500/50 animate-[wave_2s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute w-full h-full rounded-full bg-cyan-500/50 animate-[wave_2s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}></div>
        </>
      )}

      {/* Listening Pulse */}
      {isListening && (
        <>
          <div className="absolute w-full h-full rounded-full bg-emerald-500/30 animate-[pulse-ring_2s_ease-in-out_infinite]"></div>
          <div className="absolute w-1/2 h-1/2 rounded-full bg-emerald-500/50 animate-[pulse-dot_2s_ease-in-out_infinite]"></div>
        </>
      )}

      {/* Central Icon */}
      <div className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-colors duration-300 z-10 
        ${isListening ? 'bg-emerald-500' : isSpeaking ? 'bg-cyan-500' : 'bg-slate-600'}`}>
        <MicrophoneIcon className="w-10 h-10 text-white" />
      </div>
    </div>
  );
};

export default LiveVisualizer;