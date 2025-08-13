import React from 'react';
import useLocalStorage from './hooks/useLocalStorage';
import { Denomination, UserProfile } from './types';
import DenominationSelector from './components/DenominationSelector';
import ChatView from './components/ChatView';
import SettingsModal from './components/SettingsModal';
import OnboardingFlow from './components/OnboardingFlow';

const defaultProfile: UserProfile = {
  name: '',
  age: null,
  extraInfo: '',
  enableSound: true,
  enableHaptics: true,
  onboardingComplete: false,
  enableGoogleSearch: true,
};

const App: React.FC = () => {
  const [denomination, setDenomination] = useLocalStorage<Denomination | null>('deenbridge-denomination', null);
  const [profile, setProfile] = useLocalStorage<UserProfile>('deenbridge-profile', defaultProfile);
  const [isSettingsOpen, setIsSettingsOpen] = React.useState(false);
  
  const handleOnboardingComplete = (data: { name: string, age: number | null, extraInfo: string, denomination: Denomination }) => {
    setProfile(prev => ({
      ...prev,
      name: data.name,
      age: data.age,
      extraInfo: data.extraInfo,
      onboardingComplete: true
    }));
    setDenomination(data.denomination);
  };

  const handleResetDenomination = () => {
    setDenomination(null);
  };

  return (
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
          <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            profile={profile}
            setProfile={setProfile}
            onResetDenomination={handleResetDenomination}
          />
        </>
      ) : (
        <DenominationSelector onSelect={setDenomination} />
      )}
    </main>
  );
};

export default App;