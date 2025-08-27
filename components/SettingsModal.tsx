import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../types';
import { AlertIcon, CheckIcon, CloseIcon } from './icons';
import Toast from './Toast';
import ThemeSwitcher from './ThemeSwitcher';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onResetDenomination: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, setProfile, onResetDenomination }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isNameValid = localProfile.name.trim().length > 2;

  useEffect(() => {
    if (isOpen) {
      setLocalProfile(profile);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!isNameValid) return;
    setProfile(localProfile);
    setToastMessage("Settings saved successfully!");
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(onClose, 300);
  };

  const handleDenominationChange = () => {
    onResetDenomination();
    onClose();
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setLocalProfile(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else if (name === 'age') {
      const parsedValue = parseInt(value, 10);
      setLocalProfile(prev => ({ ...prev, [name]: isNaN(parsedValue) ? null : parsedValue }));
    } else {
      setLocalProfile(prev => ({ ...prev, [name]: value }));
    }
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300"
        onClick={onClose}
        style={{ opacity: isOpen ? 1 : 0 }}
      ></div>
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <div 
          className={`relative w-full max-w-md rounded-2xl shadow-2xl modal-bg-pattern flex flex-col max-h-[90vh]
            ${isOpen ? 'animate-elastic-slide-up' : 'opacity-0'}`}
        >
          {/* Header */}
          <header className="p-6 pb-4 flex-shrink-0 flex items-center justify-between">
            <h2 id="settings-title" className="text-3xl font-bold text-[var(--color-text-primary)]">Settings</h2>
            <button onClick={onClose} className="p-2 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90">
              <CloseIcon />
            </button>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 px-6 pb-2 overflow-y-auto">
            <div className="space-y-6">
              <ThemeSwitcher />
              
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--color-primary)]">Profile</h3>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Display Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={localProfile.name}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_80%)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)]
                        ${isNameValid ? 'border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]' : 'border-red-400 focus:ring-red-500 focus:border-red-500'}`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      {isNameValid ? <CheckIcon className="text-emerald-500"/> : <AlertIcon className="text-red-500"/>}
                    </div>
                  </div>
                  {!isNameValid && <p className="text-xs text-red-600 mt-1">Name must be at least 3 characters.</p>}
                </div>
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Age (Optional)</label>
                  <input
                      type="number"
                      id="age"
                      name="age"
                      value={localProfile.age || ''}
                      onChange={handleInputChange}
                      placeholder="e.g., 25"
                      className="w-full px-3 py-2 bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_80%)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                    />
                </div>
                 <div>
                  <label htmlFor="extraInfo" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Additional Context (Optional)</label>
                  <textarea
                      id="extraInfo"
                      name="extraInfo"
                      rows={3}
                      value={localProfile.extraInfo}
                      onChange={handleInputChange}
                      placeholder="e.g., I am a new Muslim."
                      className="w-full px-3 py-2 bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_80%)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                    />
                </div>
              </div>
  
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--color-primary)]">Preferences</h3>
                <div className="flex items-center justify-between bg-[var(--color-card-quran-bg)] p-3 rounded-lg">
                  <label htmlFor="enableGoogleSearch" className="font-medium text-[var(--color-text-secondary)]">Enable Internet Search</label>
                  <input id="enableGoogleSearch" name="enableGoogleSearch" type="checkbox" checked={localProfile.enableGoogleSearch} onChange={handleInputChange} className="h-5 w-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-accent)]"/>
                </div>
                <div className="flex items-center justify-between bg-[var(--color-card-quran-bg)] p-3 rounded-lg">
                  <label htmlFor="enableSound" className="font-medium text-[var(--color-text-secondary)]">Enable Sound Effects</label>
                  <input id="enableSound" name="enableSound" type="checkbox" checked={localProfile.enableSound} onChange={handleInputChange} className="h-5 w-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-accent)]"/>
                </div>
                 <div className="flex items-center justify-between bg-[var(--color-card-quran-bg)] p-3 rounded-lg">
                  <label htmlFor="enableHaptics" className="font-medium text-[var(--color-text-secondary)]">Enable Haptic Feedback</label>
                  <input id="enableHaptics" name="enableHaptics" type="checkbox" checked={localProfile.enableHaptics} onChange={handleInputChange} className="h-5 w-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-accent)]"/>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 pt-4 flex-shrink-0">
            <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
               <button onClick={handleDenominationChange} className="w-full text-center px-4 py-2.5 bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_50%)] rounded-lg transition-colors font-semibold active:scale-95">
                Change School of Thought
              </button>
              <button onClick={handleSave} disabled={!isNameValid} className="w-full text-center px-4 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-inverted)] rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-[color:rgb(from_var(--color-primary)_r_g_b_/_30%)] transition-all transform hover:scale-105 active:scale-95 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:scale-100 disabled:shadow-none">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
      {toastMessage && <Toast message={toastMessage} type="success" onClose={() => setToastMessage(null)} />}
    </>
  );
};

export default SettingsModal;
