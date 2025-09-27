import React, { useEffect, lazy, Suspense } from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Denomination, UserProfile } from './types';
import DenominationSelector from './components/DenominationSelector';
import ChatView from './components/ChatView';
import OnboardingFlow from './components/OnboardingFlow';
import { LocaleProvider } from './contexts/LocaleContext';

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
  arabicFont: 'amiri',
};

const App: React.FC = () => {
  const [denomination, setDenomination] = useLocalStorage<Denomination | null>('deenbridge-denomination', null);
  const [profile, setProfile] = useLocalStorage<UserProfile>('deenbridge-profile', defaultProfile);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  
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
    document.documentElement.setAttribute('data-arabic-font', profile.arabicFont || 'amiri');
  }, [profile.arabicFont]);


  return (
    <LocaleProvider profile={profile} setProfile={setProfile}>
      <main className="h-screen w-screen font-sans">
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
    </LocaleProvider>
  );
};

export default App;