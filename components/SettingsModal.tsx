import React, { useState, useEffect, useRef } from 'react';
import type { UserProfile } from '../types';
import { AlertIcon, CheckIcon, CloseIcon, GoogleIcon } from './icons';
import ThemeSwitcher from './ThemeSwitcher';
import DobInput from './DobInput';
import LanguageSwitcher from './LanguageSwitcher';
import { useLocale } from '../contexts/LocaleContext';
import ArabicFontSwitcher from './ArabicFontSwitcher';
import TTSSettings from './TTSSettings';
import { useFocusTrap } from '../lib/focus';
import { useA11y } from '../lib/a11y';
import { triggerHapticFeedback } from '../lib/haptics';
import { useDevice } from '../contexts/DeviceContext';
import InstallPWAButton from './InstallPWAButton';
import { useGoogleSignIn, GoogleProfile } from '../hooks/useGoogleSignIn';
import UIFontSwitcher from './UIFontSwitcher';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onResetDenomination: () => void;
  isOnline: boolean;
  onOpenAbout: () => void;
  setToastInfo: (info: { message: string, type: 'success' | 'error' } | null) => void;
}

const Avatar: React.FC<{ src: string; alt: string }> = ({ src, alt }) => (
    <img src={src} alt={alt} className="w-12 h-12 rounded-full object-cover border-2 border-white/20 shadow-lg" />
);

const LayoutPreview: React.FC<{ layout: 'split' | 'stacked', isMobile: boolean }> = ({ layout, isMobile }) => {
    const commonContent = (
        <div className="flex-1 bg-[var(--color-bg)] p-1.5 space-y-1.5">
            <div className="h-2 w-3/4 mx-auto bg-[var(--color-border)] rounded-sm opacity-50"></div>
            <div className="h-1 w-full bg-[var(--color-border)] rounded-sm"></div>
            <div className="h-1 w-5/6 bg-[var(--color-border)] rounded-sm"></div>
            <div className="h-1 w-full bg-[var(--color-border)] rounded-sm"></div>
        </div>
    );

    if (layout === 'split' && !isMobile) {
        return (
            <div className="w-full h-20 border border-[var(--color-border)] rounded-md flex overflow-hidden bg-[var(--color-card-bg)]">
                <div className="w-1/3 bg-[var(--color-card-quran-bg)] border-r border-[var(--color-border)] p-1.5 space-y-2">
                    {/* Mimics a header and a list item */}
                    <div className="h-2 w-3/4 bg-[var(--color-border)] rounded-sm opacity-50"></div>
                    <div className="h-1.5 w-full bg-[var(--color-border)] rounded-sm"></div>
                    <div className="h-1.5 w-full bg-[var(--color-border)] rounded-sm"></div>
                    <div className="h-1.5 w-full bg-[var(--color-border)] rounded-sm"></div>
                </div>
                {commonContent}
            </div>
        );
    }
    
    // Stacked layout (and split layout on mobile) look the same in preview
    return (
        <div className="w-full h-20 border border-[var(--color-border)] rounded-md flex flex-col overflow-hidden bg-[var(--color-card-bg)]">
            <div className="h-6 bg-[var(--color-card-quran-bg)] border-b border-[var(--color-border)] flex items-center justify-between p-1.5">
                 {/* Mimics a title and some icons */}
                <div className="h-2 w-1/3 bg-[var(--color-border)] rounded-sm opacity-50"></div>
                <div className="flex gap-1">
                    <div className="h-3 w-3 rounded-full bg-[var(--color-border)] opacity-50"></div>
                    <div className="h-3 w-3 rounded-full bg-[var(--color-border)] opacity-50"></div>
                </div>
            </div>
            {commonContent}
        </div>
    );
};


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, profile, setProfile, onResetDenomination, isOnline, onOpenAbout, setToastInfo }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const isNameValid = localProfile.name.trim().length > 2;
  const { t } = useLocale();
  const modalRef = useRef<HTMLDivElement>(null);
  const { announce } = useA11y();
  const { isMobile } = useDevice();


  useFocusTrap(modalRef, isOpen);

  const handleGoogleLinkSuccess = (gProfile: GoogleProfile) => {
    setLocalProfile(prev => ({
        ...prev,
        // Don't override an existing name unless it's empty
        name: prev.name.trim() === '' ? gProfile.name : prev.name,
        email: gProfile.email,
        avatar: gProfile.picture,
    }));
    setToastInfo({ message: 'Google Account linked successfully!', type: 'success' });
    announce('Google Account linked successfully!');
  };
  
  const { signIn: linkWithGoogle, isReady: isGoogleReady } = useGoogleSignIn(handleGoogleLinkSuccess, setToastInfo);
  
  const handleUnlink = () => {
      setLocalProfile(prev => ({
          ...prev,
          email: null,
          avatar: null,
      }));
      setToastInfo({ message: 'Google Account unlinked.', type: 'success' });
      announce('Google Account unlinked.');
  };

  useEffect(() => {
    if (isOpen) {
      setLocalProfile(profile);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;
  
  const handleDobChange = (newDob: { day: string; month: string; year: string; calendar: 'gregorian' | 'hijri' }) => {
      setLocalProfile(prev => ({ ...prev, dob: newDob }));
  };

  const clearDob = () => {
    setLocalProfile(prev => ({ ...prev, dob: null }));
  }
  
  const handleOpenAbout = () => {
    onClose(); // Close settings modal
    setTimeout(onOpenAbout, 300); // Open about modal after animation
  };

  const handleSave = () => {
    if (!isNameValid) return;

    let profileToSave = { ...localProfile };

    // If DOB object exists but the year is empty, treat it as cleared.
    if (profileToSave.dob && !profileToSave.dob.year) {
        profileToSave.dob = null;
    } else if (profileToSave.dob) {
        // Ensure month and day are empty strings if not provided, not undefined/null
        profileToSave.dob = {
            ...profileToSave.dob,
            day: profileToSave.dob.day || '',
            month: profileToSave.dob.month || '',
        }
    }

    setProfile(profileToSave);
    const message = t('settingsSaved');
    setToastInfo({ message: message, type: 'success' });
    announce(message);
    triggerHapticFeedback(profile, 'success');
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
          ref={modalRef}
          className={`relative w-full max-w-md rounded-2xl shadow-2xl modal-bg-pattern flex flex-col max-h-[90vh]
            ${isOpen ? 'animate-elastic-slide-up' : 'opacity-0'}`}
        >
          {/* Header */}
          <header className="p-6 pb-4 flex-shrink-0 flex items-center justify-between rtl:flex-row-reverse">
            <h2 id="settings-title" className="text-3xl font-bold text-[var(--color-text-primary)]">{t('settingsTitle')}</h2>
            <div className="flex items-center gap-2">
                <LanguageSwitcher/>
                <button onClick={onClose} className="p-2 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90">
                  <CloseIcon />
                </button>
            </div>
          </header>

          {/* Scrollable Content */}
          <div className="flex-1 px-6 pb-2 overflow-y-auto">
            <div className="space-y-6">
              <ThemeSwitcher />
              
              <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[var(--color-primary)]">Accessibility</h3>
                  <div>
                      <label htmlFor="ui-scale" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                          UI & Text Scale <span className="text-xs font-mono">({localProfile.uiScale}%)</span>
                      </label>
                      <input
                          id="ui-scale"
                          type="range"
                          min="80"
                          max="150"
                          step="5"
                          value={localProfile.uiScale}
                          onChange={(e) => setLocalProfile(p => ({...p, uiScale: parseInt(e.target.value, 10)}))}
                          className="w-full h-2 bg-[var(--color-border)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                      />
                  </div>
              </div>
              
              <UIFontSwitcher 
                  currentFont={localProfile.uiFont} 
                  onFontChange={(font) => setLocalProfile(prev => ({ ...prev, uiFont: font }))}
              />
              
              <ArabicFontSwitcher 
                  currentFont={localProfile.quranFont} 
                  onFontChange={(font) => setLocalProfile(prev => ({ ...prev, quranFont: font }))}
              />
              
              <TTSSettings
                settings={localProfile.ttsSettings}
                onChange={(newTtsSettings) => setLocalProfile(prev => ({ ...prev, ttsSettings: newTtsSettings }))}
              />

              <div className="space-y-4">
                  <h3 className="text-lg font-bold text-[var(--color-primary)]">Quran Reader Layout</h3>
                  <div className="grid grid-cols-2 gap-3">
                      {(['split', 'stacked'] as const).map(layout => (
                          <button key={layout} type="button" onClick={() => setLocalProfile(p => ({...p, quranReaderLayout: layout}))} className={`p-2 rounded-lg border-2 transition-all ${localProfile.quranReaderLayout === layout ? 'border-[var(--color-accent)] ring-2 ring-offset-2 ring-offset-[var(--color-card-bg)] ring-[var(--color-accent)]' : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'}`}>
                              <LayoutPreview layout={layout} isMobile={isMobile} />
                              <span className="block mt-2 text-sm font-medium text-[var(--color-text-secondary)] capitalize">{layout === 'split' ? 'Split View' : 'Stacked View'}</span>
                          </button>
                      ))}
                  </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--color-primary)]">{t('liveChatModeTitle')}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] -mt-3">{t('liveChatModeDescription')}</p>
                <div className="flex w-full bg-[var(--color-card-quran-bg)] p-1 rounded-lg border border-[var(--color-border)]">
                    <button
                    type="button"
                    onClick={() => setLocalProfile(prev => ({ ...prev, liveChatMode: 'toggle' }))}
                    className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${localProfile.liveChatMode === 'toggle' ? 'bg-[var(--color-card-bg)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-subtle)]'}`}
                    >
                    {t('liveChatModeToggle')}
                    </button>
                    <button
                    type="button"
                    onClick={() => setLocalProfile(prev => ({ ...prev, liveChatMode: 'holdToTalk' }))}
                    className={`w-1/2 p-2 rounded-md text-sm font-semibold transition-colors ${localProfile.liveChatMode === 'holdToTalk' ? 'bg-[var(--color-card-bg)] text-[var(--color-text-primary)] shadow-sm' : 'text-[var(--color-text-subtle)]'}`}
                    >
                    {t('liveChatModeHold')}
                    </button>
                </div>
              </div>


              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--color-primary)]">{t('profile')}</h3>

                {localProfile.email ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 p-3 bg-[var(--color-card-quran-bg)] rounded-lg">
                            {localProfile.avatar && <Avatar src={localProfile.avatar} alt={localProfile.name} />}
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-lg text-[var(--color-text-primary)] truncate">{localProfile.name}</p>
                                <p className="text-sm text-[var(--color-text-subtle)] truncate">{localProfile.email}</p>
                            </div>
                        </div>
                        <button type="button" onClick={handleUnlink} className="w-full text-center px-4 py-2.5 bg-red-500/10 border-2 border-red-500/20 text-red-500 hover:bg-red-500/20 hover:border-red-500/40 rounded-lg transition-colors font-semibold active:scale-95">
                            Unlink Google Account
                        </button>
                    </div>
                ) : (
                    <>
                        <div>
                        <label htmlFor="name" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t('displayName')}</label>
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
                            <div className="absolute inset-y-0 end-0 pe-3 flex items-center pointer-events-none">
                            {isNameValid ? <CheckIcon className="text-emerald-500"/> : <AlertIcon className="text-red-500"/>}
                            </div>
                        </div>
                        {!isNameValid && <p className="text-xs text-red-600 mt-1">{t('nameRequired')}</p>}
                        </div>
                        {isGoogleReady && (
                            <button
                                type="button"
                                onClick={linkWithGoogle}
                                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[var(--color-card-quran-bg)] border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors font-semibold active:scale-95"
                            >
                                <GoogleIcon />
                                Link Google Account
                            </button>
                        )}
                    </>
                )}

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">{t('provideYourDOB')}</label>
                  <DobInput value={localProfile.dob} onChange={handleDobChange} onClear={clearDob} />
                </div>
                 <div>
                  <label htmlFor="extraInfo" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{t('additionalContext')}</label>
                  <textarea
                      id="extraInfo"
                      name="extraInfo"
                      rows={3}
                      value={localProfile.extraInfo}
                      onChange={handleInputChange}
                      placeholder={t('contextPlaceholder')}
                      className="w-full px-3 py-2 bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_80%)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)]"
                    />
                </div>
              </div>
  
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-[var(--color-primary)]">{t('preferences')}</h3>
                <div className="flex items-center justify-between bg-[var(--color-card-quran-bg)] p-3 rounded-lg">
                  <label htmlFor="enableGoogleSearch" className="font-medium text-[var(--color-text-secondary)]">{t('enableInternetSearch')}</label>
                  <input id="enableGoogleSearch" name="enableGoogleSearch" type="checkbox" checked={localProfile.enableGoogleSearch} onChange={handleInputChange} className="h-5 w-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-accent)]"/>
                </div>
                <div className="flex items-center justify-between bg-[var(--color-card-quran-bg)] p-3 rounded-lg">
                  <label htmlFor="enableSound" className="font-medium text-[var(--color-text-secondary)]">{t('enableSoundEffects')}</label>
                  <input id="enableSound" name="enableSound" type="checkbox" checked={localProfile.enableSound} onChange={handleInputChange} className="h-5 w-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-accent)]"/>
                </div>
                 <div className="flex items-center justify-between bg-[var(--color-card-quran-bg)] p-3 rounded-lg">
                  <label htmlFor="enableHapticFeedback" className="font-medium text-[var(--color-text-secondary)]">{t('enableHapticFeedback')}</label>
                  <input id="enableHaptics" name="enableHaptics" type="checkbox" checked={localProfile.enableHaptics} onChange={handleInputChange} className="h-5 w-5 rounded text-[var(--color-primary)] focus:ring-[var(--color-accent)]"/>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="p-6 pt-4 flex-shrink-0">
            <div className="pt-4 border-t border-[var(--color-border)] space-y-3">
               <InstallPWAButton />
               <button type="button" onClick={handleOpenAbout} className="w-full text-center px-4 py-2.5 bg-transparent border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors font-semibold active:scale-95">
                About DeenBridge
              </button>
               <button type="button" onClick={handleDenominationChange} className="w-full text-center px-4 py-2.5 bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_50%)] rounded-lg transition-colors font-semibold active:scale-95">
                {t('changeSchoolOfThought')}
              </button>
              <button onClick={handleSave} disabled={!isNameValid} className="w-full text-center px-4 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-inverted)] rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-[color:rgb(from_var(--color-primary)_r_g_b_/_30%)] transition-all transform hover:scale-105 active:scale-95 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 disabled:scale-100 disabled:shadow-none">
                {t('saveChanges')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SettingsModal;