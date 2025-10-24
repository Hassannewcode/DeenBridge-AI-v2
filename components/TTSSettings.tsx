import React from 'react';
import { useLocale } from '../contexts/LocaleContext';
import type { UserProfile } from '../types';
import { CheckIcon } from './icons';

interface TTSSettingsProps {
  settings: UserProfile['ttsSettings'];
  onChange: (newSettings: UserProfile['ttsSettings']) => void;
}

const voiceOptions = [
    { value: 'Charon', label: 'Charon (M)', group: 'Gemini', description: 'A strong, deep, and authoritative male voice.', recommended: true, pitch: 1.15 },
    { value: 'Puck', label: 'Puck (M)', group: 'Gemini', description: 'A clear, friendly, and professional male voice.', recommended: false, pitch: 1.1 },
    { value: 'Kore', label: 'Kore (F)', group: 'Gemini', description: 'A smooth, gentle, and calming female voice.', recommended: true, pitch: 0.9 },
    { value: 'Zephyr', label: 'Zephyr (F)', group: 'Gemini', description: 'A warm, friendly, and slightly sassy female voice.', recommended: false, pitch: 1.0 },
    { value: 'native', label: 'Native Browser Voice', group: 'System', description: 'Uses your device\'s built-in voice. Quality may vary.', recommended: false, pitch: 1.0 }
];

const TTSSettings: React.FC<TTSSettingsProps> = ({ settings, onChange }) => {
  const { t } = useLocale();

  const handleVoiceChange = (voice: typeof voiceOptions[0]) => {
    onChange({ 
      ...settings, 
      voice: voice.value,
      pitch: voice.pitch // Automatically set recommended pitch
    });
  };

  const handleSettingChange = (field: keyof UserProfile['ttsSettings'], value: string | number) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[var(--color-primary)]">Text-to-Speech</h3>
      
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">Voice</label>
        <div className="grid grid-cols-1 gap-2">
            {voiceOptions.map(option => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => handleVoiceChange(option)}
                    className={`relative text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                        settings.voice === option.value
                        ? 'border-[var(--color-accent)] ring-2 ring-[var(--color-accent)] bg-[var(--color-card-quran-bg)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                    }`}
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-[var(--color-text-primary)]">{option.label}</p>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-1">{option.description}</p>
                        </div>
                        {settings.voice === option.value && <CheckIcon className="w-5 h-5 text-[var(--color-accent)] flex-shrink-0 ms-2" />}
                    </div>
                    {option.recommended && (
                        <div className="absolute -top-2 right-2 text-xs font-bold bg-[var(--color-accent)] text-white px-2 py-0.5 rounded-full shadow">
                            Recommended
                        </div>
                    )}
                </button>
            ))}
        </div>
      </div>

      <div>
        <label htmlFor="tts-rate" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          Speed <span className="text-xs font-mono">({Number(settings.rate).toFixed(1)}x)</span>
        </label>
        <input
          id="tts-rate"
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          value={settings.rate}
          onChange={(e) => handleSettingChange('rate', parseFloat(e.target.value))}
          className="w-full h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
        />
      </div>

      <div>
        <label htmlFor="tts-pitch" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
          Pitch <span className="text-xs font-mono">({Number(settings.pitch).toFixed(1)}x)</span>
        </label>
        <input
          id="tts-pitch"
          type="range"
          min="0.5"
          max="2"
          step="0.05"
          value={settings.pitch}
          onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
          className="w-full h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
        />
      </div>

    </div>
  );
};

export default TTSSettings;