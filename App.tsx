import React, { useEffect, lazy, Suspense } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Denomination, UserProfile } from './types';
import DenominationSelector from './components/DenominationSelector';
import ChatView from './components/ChatView';
import OnboardingFlow from './components/OnboardingFlow';
import { LocaleProvider } from './contexts/LocaleContext';
import { useDevice } from './contexts/DeviceContext';
import A11yAnnouncer from './components/A11yAnnouncer';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import OfflineBanner from './components/OfflineBanner';

const SettingsModal = lazy(() => import('./components/SettingsModal'));

const defaultProfile: UserProfile = {
  name: '',
  dob: null,
  extraInfo: '',
  enableSound: true,
  enableHaptics: true,
  onboardingComplete: false,
  enableGoogleSearch: true,
  appLanguage: 'en',
  translationLanguage: 'English',
  arabicFont: 'uthmanic',
  liveChatMode: 'toggle', // Set toggle as default
  ttsSettings: {
    voice: 'Fenrir', // Default to Fenrir, a high-quality male voice from Gemini.
    pitch: 0.8,
    rate: 1,
  },
};

const App: React.FC = () => {
  const [denomination, setDenomination] = useLocalStorage<Denomination | null>('deenbridge-denomination', null);
  const [profile, setProfile] = useLocalStorage<UserProfile>('deenbridge-profile', defaultProfile);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const { isMobile } = useDevice();
  const isOnline = useOnlineStatus();
  
  const handleOnboardingComplete = (data: { name: string, dob: { day: string; month: string; year: string; calendar: 'gregorian' | 'hijri' } | null, extraInfo: string, denomination: Denomination }) => {
    setProfile(prev => ({
      ...prev,
      name: data.name,
      dob: data.dob,
      extraInfo: data.extraInfo,
      onboardingComplete: true
    }));
    setDenomination(data.denomination);
  };

  const handleResetDenomination = () => {
    setDenomination(null);
  };
  
  useEffect(() => {
    document.documentElement.setAttribute('data-arabic-font', profile.arabicFont || 'uthmanic');
  }, [profile.arabicFont]);

  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('is-mobile');
    } else {
      document.body.classList.remove('is-mobile');
    }
  }, [isMobile]);


  return (
    <LocaleProvider profile={profile} setProfile={setProfile}>
      <main className="flex-1 flex w-full font-sans min-h-0">
        {!isOnline && <OfflineBanner />}
        {!profile.onboardingComplete ? (
          <OnboardingFlow onComplete={handleOnboardingComplete} />
        ) : denomination ? (
          <>
            <ChatView 
              denomination={denomination} 
              onOpenSettings={() => setIsSettingsOpen(true)}
              profile={profile} 
            />
            <Suspense fallback={null}>
              <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                profile={profile}
                setProfile={setProfile}
                onResetDenomination={handleResetDenomination}
              />
            </Suspense>
          </>
        ) : (
          <DenominationSelector onSelect={setDenomination} />
        )}
      </main>
      <A11yAnnouncer />
    </LocaleProvider>
  );
};

export default App;