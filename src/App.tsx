import React, { useEffect, lazy, Suspense, useState } from 'react';
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
import Toast from './components/Toast';

const SettingsModal = lazy(() => import('./components/SettingsModal'));
const AboutModal = lazy(() => import('./components/AboutModal'));

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
  quranFont: 'uthmanic',
  uiFont: 'inter',
  liveChatMode: 'toggle',
  ttsSettings: {
    voice: 'Charon',
    pitch: 1.15,
    rate: 1,
  },
  uiScale: 100,
  quranReaderLayout: 'split',
  basmalahStyle: 'text',
  arabicDialect: 'msa',
  bismillahDisplay: 'seperate',
};

const App: React.FC = () => {
  const [denomination, setDenomination] = useLocalStorage<Denomination | null>('deenbridge-denomination', null);
  const [profile, setProfile] = useLocalStorage<UserProfile>('deenbridge-profile', defaultProfile);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  const [isAboutOpen, setIsAboutOpen] = React.useState(false);
  const { isMobile } = useDevice();
  const isOnline = useOnlineStatus();
  const [toastInfo, setToastInfo] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const handleOnboardingComplete = (data: { name: string; dob: { day: string; month: string; year: string; calendar: 'gregorian' | 'hijri' } | null; extraInfo: string; denomination: Denomination }) => {
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
    document.documentElement.setAttribute('data-quran-font', profile.quranFont || 'uthmanic');
    document.documentElement.setAttribute('data-ui-font', profile.uiFont || 'inter');
  }, [profile.quranFont, profile.uiFont]);

  useEffect(() => {
    if (isMobile) {
      document.body.classList.add('is-mobile');
    } else {
      document.body.classList.remove('is-mobile');
    }
  }, [isMobile]);

  useEffect(() => {
    const getBaseFontSize = () => {
      if (typeof window !== 'undefined') {
        if (window.innerWidth <= 480) return 14;
        if (window.innerWidth <= 768) return 15;
      }
      return 16;
    }
    
    const applyScale = () => {
      const baseSize = getBaseFontSize();
      document.documentElement.style.fontSize = `${((profile.uiScale || 100) / 100) * baseSize}px`;
    }
    
    applyScale();

    window.addEventListener('resize', applyScale);
    return () => window.removeEventListener('resize', applyScale);
  }, [profile.uiScale]);


  return (
    <LocaleProvider profile={profile} setProfile={setProfile}>
      {!isOnline && <OfflineBanner />}
      {toastInfo && <Toast message={toastInfo.message} type={toastInfo.type} onClose={() => setToastInfo(null)} />}
      <main className="flex-1 flex w-full font-sans min-h-0">
        {!profile.onboardingComplete ? (
          <OnboardingFlow onComplete={handleOnboardingComplete} setToastInfo={setToastInfo} />
        ) : denomination ? (
          <>
            <ChatView 
              denomination={denomination} 
              onOpenSettings={() => setIsSettingsOpen(true)}
              profile={profile}
              setToastInfo={setToastInfo}
            />
            <Suspense fallback={null}>
              <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                profile={profile}
                setProfile={setProfile}
                onResetDenomination={handleResetDenomination}
                isOnline={isOnline}
                onOpenAbout={() => setIsAboutOpen(true)}
                setToastInfo={setToastInfo}
              />
              <AboutModal 
                isOpen={isAboutOpen}
                onClose={() => setIsAboutOpen(false)}
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