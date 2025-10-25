import React, { useState, useEffect, useCallback } from 'react';
import { Denomination } from '../types';
import { SunniIcon, ShiaIcon, SufiIcon, IbadiIcon, GoogleIcon } from './icons';
import AgeDisclaimerModal from './AgeDisclaimerModal';
import { useLocale } from '../contexts/LocaleContext';
import LanguageSwitcher from './LanguageSwitcher';
import DobInput from './DobInput';
import { useGoogleSignIn, GoogleProfile } from '../hooks/useGoogleSignIn';

interface OnboardingFlowProps {
  onComplete: (data: { name: string; dob: { day: string; month: string; year: string; calendar: 'gregorian' | 'hijri' } | null; extraInfo: string; denomination: Denomination; email: string | null; avatar: string | null; }) => void;
  setToastInfo: (info: { message: string, type: 'success' | 'error' } | null) => void;
}

const SelectorCard: React.FC<{ onSelect: () => void, children: React.ReactNode, isSelected: boolean }> = ({ onSelect, children, isSelected }) => (
  <div 
    onClick={onSelect}
    className={`group relative bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_60%)] backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl hover:shadow-[color:rgb(from_var(--color-accent)_r_g_b_/_20%)] transition-all duration-300 ease-in-out transform hover:-translate-y-2 cursor-pointer
    ${isSelected ? 'border-2 border-[var(--color-accent)] ring-2 ring-offset-2 ring-offset-[var(--color-bg)] ring-[var(--color-accent)]' : 'border border-[var(--color-border)]'}`}
  >
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="p-8 text-center flex flex-col items-center">
      {children}
    </div>
  </div>
);


const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, setToastInfo }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [dob, setDob] = useState<{ day: string; month: string; year: string; calendar: 'gregorian' | 'hijri' } | null>(null);
  const [extraInfo, setExtraInfo] = useState('');
  const [denomination, setDenomination] = useState<Denomination | null>(null);
  const [showMoreDenominations, setShowMoreDenominations] = useState(false);
  const [showAgeDisclaimer, setShowAgeDisclaimer] = useState(false);
  const [hasShownAgeDisclaimer, setHasShownAgeDisclaimer] = useState(false);
  const { t, locale } = useLocale();

  const handleNext = useCallback(() => setStep(prev => Math.min(prev + 1, 4)), []);
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));

  const handleGoogleSuccess = useCallback((profile: GoogleProfile) => {
    setName(profile.name || '');
    setEmail(profile.email || null);
    setAvatar(profile.picture || null);
    // After getting info, automatically move to the next step
    if (step === 1) {
      if (!hasShownAgeDisclaimer) {
        setShowAgeDisclaimer(true);
        setHasShownAgeDisclaimer(true);
      }
      handleNext();
    }
  }, [handleNext, step, hasShownAgeDisclaimer]);

  const { signIn, isReady: isGoogleReady } = useGoogleSignIn(handleGoogleSuccess, setToastInfo);


  useEffect(() => {
    document.body.setAttribute('data-step', String(step));
  }, [step]);
  
  const handleDenominationSelect = (den: Denomination) => {
    setDenomination(den);
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!hasShownAgeDisclaimer) {
        setTimeout(() => { 
          setShowAgeDisclaimer(true);
          setHasShownAgeDisclaimer(true);
        }, 500);
      }
      handleNext(); 
      return;
    }
    if (step === 4) {
      if (name && denomination) {
        const finalDob = (dob && dob.year) ? {
            ...dob,
            day: dob.day || '',
            month: dob.month || '',
        } : null;
        onComplete({ name, dob: finalDob, extraInfo, denomination, email, avatar });
      }
      return;
    }
    
    handleNext();
  };
  
  const handleAcceptDisclaimer = () => {
    setShowAgeDisclaimer(false);
  };
  
  const handleDobChange = (newDob: { day: string; month: string; year: string; calendar: 'gregorian' | 'hijri' }) => {
      setDob(newDob);
  };

  const isRtl = locale === 'ar';
  const transformValue = (isRtl ? (step - 1) : -(step - 1)) * 100;

  const NextButton: React.FC<{ disabled?: boolean; children: React.ReactNode; }> = ({ disabled = false, children }) => (
    <button type="submit" disabled={disabled} className="w-full text-center px-4 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-inverted)] rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-[color:rgb(from_var(--color-primary)_r_g_b_/_30%)] transition-all transform hover:scale-105 active:scale-95 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none">
      {children}
    </button>
  );

  const BackButton: React.FC<{children: React.ReactNode}> = ({children}) => (
    <button type="button" onClick={handleBack} className="w-full text-center px-4 py-2.5 bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_50%)] rounded-lg transition-colors font-semibold active:scale-95">
      {children}
    </button>
  );

  return (
    <div className="h-full w-full flex flex-col">
        <div className="absolute top-4 end-4 z-10 p-4">
            <LanguageSwitcher />
        </div>
        {showAgeDisclaimer && <AgeDisclaimerModal onAccept={handleAcceptDisclaimer} />}
        <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col items-center justify-center min-h-full">
                <header className="mb-12 text-center animate-fade-in-up">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-[var(--color-text-primary)]">
                    {t('welcomeTo')} <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">DeenBridge</span>
                </h1>
                <p className="mt-4 text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
                    {t('digitalLibrarian')}
                </p>
                </header>
                
                <div className="w-full max-w-2xl overflow-hidden">
                <div
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(${transformValue}%)` }}
                >
                    {/* Step 1: Name */}
                    <div className="w-full flex-shrink-0 px-4 flex flex-col items-center">
                    <form onSubmit={handleFormSubmit} className="w-full max-w-md space-y-6">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{t('whatShouldWeCallYou')}</h2>
                        <div>
                            <label htmlFor="name" className="sr-only">Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('enterYourName')}
                                className="w-full text-center text-base sm:text-lg px-4 py-3 bg-transparent border-b-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-[var(--color-text-primary)]"
                                autoFocus
                                required
                            />
                        </div>
                        <div className="space-y-4">
                            <NextButton disabled={!name.trim()}>{t('next')}</NextButton>
                            {isGoogleReady && (
                                <>
                                    <div className="relative flex py-2 items-center">
                                        <div className="flex-grow border-t border-[var(--color-border)]"></div>
                                        <span className="flex-shrink mx-4 text-xs text-[var(--color-text-subtle)] uppercase">Or</span>
                                        <div className="flex-grow border-t border-[var(--color-border)]"></div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={signIn}
                                        className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-[var(--color-card-bg)] border-2 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-text-primary)] rounded-lg transition-colors font-semibold active:scale-95"
                                    >
                                        <GoogleIcon />
                                        Sign in with Google
                                    </button>
                                </>
                            )}
                        </div>
                    </form>
                    </div>

                    {/* Step 2: Date of Birth */}
                    <div className="w-full flex-shrink-0 px-4 flex flex-col items-center">
                        <form onSubmit={handleFormSubmit} className="w-full max-w-lg space-y-6 text-center">
                            <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{t('onboardingDobTitle').replace('{name}', name)}</h2>
                            <p className="text-sm text-[var(--color-accent)] -mt-4">{t('dobOptional')}</p>
                            <DobInput value={dob} onChange={handleDobChange} />
                            <div className="space-y-3 max-w-md mx-auto pt-4">
                                <NextButton>{t('next')}</NextButton>
                                <BackButton>{t('back')}</BackButton>
                            </div>
                        </form>
                    </div>

                    {/* Step 3: Denomination */}
                    <div className="w-full flex-shrink-0 px-4 flex flex-col items-center">
                    <form onSubmit={handleFormSubmit} className="w-full max-w-2xl space-y-6 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{t('selectSchoolOfThought')}</h2>
                        <p className="text-[var(--color-text-secondary)]">{t('schoolOfThoughtDescription')}</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <SelectorCard onSelect={() => handleDenominationSelect(Denomination.Sunni)} isSelected={denomination === Denomination.Sunni}>
                                <SunniIcon className="h-16 w-16 sm:h-20 sm:w-20 mb-4 text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors duration-300"/>
                                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{t('sunni')}</h2>
                            </SelectorCard>
                            <SelectorCard onSelect={() => handleDenominationSelect(Denomination.Shia)} isSelected={denomination === Denomination.Shia}>
                                <ShiaIcon className="h-16 w-16 sm:h-20 sm:w-20 mb-4 text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors duration-300"/>
                                <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{t('shia')}</h2>
                            </SelectorCard>
                        </div>

                        <div className="text-center">
                            <button type="button" onClick={() => setShowMoreDenominations(!showMoreDenominations)} className="text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] font-semibold transition-colors">
                            {showMoreDenominations ? t('showLessOptions') : t('showMoreOptions')}
                            </button>
                        </div>

                        {showMoreDenominations && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in-up">
                                <SelectorCard onSelect={() => handleDenominationSelect(Denomination.Sufi)} isSelected={denomination === Denomination.Sufi}>
                                    <SufiIcon className="h-16 w-16 sm:h-20 sm:w-20 mb-4 text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors duration-300"/>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{t('sufism')}</h2>
                                </SelectorCard>
                                <SelectorCard onSelect={() => handleDenominationSelect(Denomination.Ibadi)} isSelected={denomination === Denomination.Ibadi}>
                                    <IbadiIcon className="h-16 w-16 sm:h-20 sm:w-20 mb-4 text-[var(--color-primary)] group-hover:text-[var(--color-accent)] transition-colors duration-300"/>
                                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{t('ibadi')}</h2>
                                </SelectorCard>
                            </div>
                        )}

                        <div className="space-y-3 max-w-md mx-auto">
                            <NextButton disabled={!denomination}>{t('next')}</NextButton>
                            <BackButton>{t('back')}</BackButton>
                        </div>
                    </form>
                    </div>

                    {/* Step 4: Extra Info */}
                    <div className="w-full flex-shrink-0 px-4 flex flex-col items-center">
                    <form onSubmit={handleFormSubmit} className="w-full max-w-md space-y-6 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text-primary)]">{t('oneLastThing')}</h2>
                        <p className="text-[var(--color-text-secondary)]">{t('additionalContextPrompt')}</p>
                         <p className="text-sm text-[var(--color-accent)] -mt-4">{t('canBeSkipped')}</p>
                        <div>
                            <label htmlFor="extraInfo" className="sr-only">{t('additionalContext')}</label>
                            <textarea
                                id="extraInfo"
                                value={extraInfo}
                                onChange={(e) => setExtraInfo(e.target.value)}
                                rows={4}
                                placeholder={t('contextPlaceholderOnboarding')}
                                className="w-full text-lg px-4 py-3 bg-[var(--color-card-bg)] border-2 border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] transition-colors text-[var(--color-text-primary)]"
                            />
                        </div>
                        <div className="space-y-3">
                            <NextButton>{t('finishSetup')}</NextButton>
                            <BackButton>{t('back')}</BackButton>
                        </div>
                    </form>
                    </div>
                </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default OnboardingFlow;