import React from 'react';
import { useLocale } from '../contexts/LocaleContext';
import type { UserProfile } from '../types';

interface TTSSettingsProps {
  settings: UserProfile['ttsSettings'];
  onChange: (newSettings: UserProfile['ttsSettings']) => void;
}

const voices = [
    { value: 'Zephyr', label: 'Zephyr (Male - Default)', group: 'Gemini' },
    { value: 'Fenrir', label: 'Fenrir (Male)', group: 'Gemini' },
    { value: 'Charon', label: 'Charon (Male)', group: 'Gemini' },
    { value: 'Puck', label: 'Puck (Female)', group: 'Gemini' },
    { value: 'Kore', label: 'Kore (Female)', group: 'Gemini' },
    { value: 'native', label: 'Native Browser Voice', group: 'System' },
];

const TTSSettings: React.FC<TTSSettingsProps> = ({ settings, onChange }) => {
  const { t } = useLocale();

  const handleSettingChange = (field: keyof UserProfile['ttsSettings'], value: string | number) => {
    onChange({ ...settings, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-[var(--color-primary)]">Text-to-Speech</h3>
      
      <div>
        <label htmlFor="tts-voice" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Voice</label>
        <select
          id="tts-voice"
          value={settings.voice}
          onChange={(e) => handleSettingChange('voice', e.target.value)}
          className="w-full px-3 py-2 bg-[var(--color-card-bg)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] custom-select"
        >
          <optgroup label="Gemini High-Quality Voices">
            {voices.filter(v => v.group === 'Gemini').map(voice => (
                <option key={voice.value} value={voice.value}>{voice.label}</option>
            ))}
          </optgroup>
          <optgroup label="System Fallback">
             {voices.filter(v => v.group === 'System').map(voice => (
                <option key={voice.value} value={voice.value}>{voice.label}</option>
            ))}
          </optgroup>
        </select>
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
          step="0.1"
          value={settings.pitch}
          onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
          className="w-full h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
        />
      </div>

    </div>
  );
};

export default TTSSettings;