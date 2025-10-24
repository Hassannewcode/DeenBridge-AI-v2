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
    voice: 'Charon', // Default to Charon, a strong male voice from Gemini.
    pitch: 1.15,     // Set default pitch for Charon.
    rate: 1,
  },
  uiScale: 100, // Default UI scale is 100%
  quranReaderLayout: 'split', // Default layout is 'split'
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
    // On first launch, set a device-specific default UI scale.
    // We check for a flag to ensure this only runs once ever for a user.
    const scaleInitialized = localStorage.getItem('deenbridge-scale-initialized');
    if (!scaleInitialized) {
        if (!isMobile) {
            // It's a desktop device on first launch, set scale to 95%
            setProfile(p => ({ ...p, uiScale: 95 }));
        }
        // For mobile, it remains at the default of 100%.
        localStorage.setItem('deenbridge-scale-initialized', 'true');
    }
  }, [isMobile, setProfile]);

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

  useEffect(() => {
    const getBaseFontSize = () => {
      // These values match the CSS in index.html
      if (typeof window !== 'undefined') {
        if (window.innerWidth <= 480) return 14;
        if (window.innerWidth <= 768) return 15;
      }
      return 16;
    }
    
    const applyScale = () => {
      const baseSize = getBaseFontSize();
      // Apply user's scale preference. Default is 100%.
      document.documentElement.style.fontSize = `${((profile.uiScale || 100) / 100) * baseSize}px`;
    }
    
    applyScale(); // Apply on initial load and when profile changes

    window.addEventListener('resize', applyScale);
    return () => window.removeEventListener('resize', applyScale);
  }, [profile.uiScale]);


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
              isMobile={isMobile}
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