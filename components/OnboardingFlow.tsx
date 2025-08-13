
import React, { useState } from 'react';
import { Denomination } from '../types';
import { SunniIcon, ShiaIcon } from './icons';

interface OnboardingFlowProps {
  onComplete: (data: { name: string, age: number | null, extraInfo: string, denomination: Denomination }) => void;
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


const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [extraInfo, setExtraInfo] = useState('');
  const [denomination, setDenomination] = useState<Denomination | null>(null);

  const handleNext = () => setStep(prev => Math.min(prev + 1, 4));
  const handleBack = () => setStep(prev => Math.max(prev - 1, 1));
  
  const handleDenominationSelect = (den: Denomination) => {
    setDenomination(den);
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 4) {
      if (name && denomination) {
        onComplete({
          name,
          age: age ? parseInt(age, 10) : null,
          extraInfo,
          denomination,
        });
      }
    } else {
      handleNext();
    }
  };

  const NextButton = ({ disabled = false, children }: { disabled?: boolean, children: React.ReactNode }) => (
    <button type="submit" disabled={disabled} className="w-full text-center px-4 py-3 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] text-[var(--color-text-inverted)] rounded-lg font-bold text-lg hover:shadow-xl hover:shadow-[color:rgb(from_var(--color-primary)_r_g_b_/_30%)] transition-all transform hover:scale-105 active:scale-95 disabled:from-slate-400 disabled:to-slate-500 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none">
      {children}
    </button>
  );

  const BackButton = () => (
    <button type="button" onClick={handleBack} className="w-full text-center px-4 py-2.5 bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_50%)] rounded-lg transition-colors font-semibold active:scale-95">
      Back
    </button>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-4 overflow-hidden">
        <header className="mb-12 text-center animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-bold text-[var(--color-text-primary)]">
            Welcome to <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">DeenBridge</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            Your personal digital librarian for Islamic knowledge.
          </p>
        </header>
        
        <div className="w-full max-w-2xl">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${(step - 1) * 100}%)` }}
          >
            {/* Step 1: Name */}
            <div className="w-full flex-shrink-0 px-4 flex flex-col items-center">
              <form onSubmit={handleFormSubmit} className="w-full max-w-md space-y-6">
                <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">What should we call you?</h2>
                <div>
                    <label htmlFor="name" className="sr-only">Name</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name..."
                        className="w-full text-center text-lg px-4 py-3 bg-transparent border-b-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-[var(--color-text-primary)]"
                        autoFocus
                        required
                    />
                </div>
                <NextButton disabled={!name.trim()}>Next</NextButton>
              </form>
            </div>

            {/* Step 2: Age */}
            <div className="w-full flex-shrink-0 px-4 flex flex-col items-center">
              <form onSubmit={handleFormSubmit} className="w-full max-w-md space-y-6">
                  <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Nice to meet you, {name}!</h2>
                  <p className="text-[var(--color-text-secondary)]">If you're comfortable, please share your age. This helps in tailoring explanations appropriately.</p>
                  <div>
                      <label htmlFor="age" className="sr-only">Age</label>
                      <input
                          type="number"
                          id="age"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          placeholder="Enter your age (optional)..."
                          className="w-full text-center text-lg px-4 py-3 bg-transparent border-b-2 border-[var(--color-border)] focus:outline-none focus:border-[var(--color-accent)] transition-colors text-[var(--color-text-primary)]"
                      />
                  </div>
                  <div className="space-y-3">
                    <NextButton>Next</NextButton>
                    <BackButton />
                  </div>
              </form>
            </div>

            {/* Step 3: Denomination */}
            <div className="w-full flex-shrink-0 px-4 flex flex-col items-center">
              <form onSubmit={handleFormSubmit} className="w-full max-w-2xl space-y-6">
                  <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Select a School of Thought</h2>
                  <p className="text-[var(--color-text-secondary)]">This will help focus your research on relevant sources.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <SelectorCard onSelect={() => handleDenominationSelect(Denomination.Sunni)} isSelected={denomination === Denomination.Sunni}>
                          <SunniIcon />
                          <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Sunni</h2>
                      </SelectorCard>
                      <SelectorCard onSelect={() => handleDenominationSelect(Denomination.Shia)} isSelected={denomination === Denomination.Shia}>
                          <ShiaIcon />
                          <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Shia</h2>
                      </SelectorCard>
                  </div>
                  <div className="space-y-3 max-w-md mx-auto">
                    <NextButton disabled={!denomination}>Next</NextButton>
                    <BackButton />
                  </div>
              </form>
            </div>

            {/* Step 4: Extra Info */}
            <div className="w-full flex-shrink-0 px-4 flex flex-col items-center">
              <form onSubmit={handleFormSubmit} className="w-full max-w-md space-y-6">
                  <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">One last thing...</h2>
                  <p className="text-[var(--color-text-secondary)]">Is there anything else DeenBridge should know to personalize your experience? (e.g., "I am a new Muslim", "I am studying Islamic history")</p>
                  <div>
                      <label htmlFor="extraInfo" className="sr-only">Additional Context</label>
                      <textarea
                          id="extraInfo"
                          value={extraInfo}
                          onChange={(e) => setExtraInfo(e.target.value)}
                          rows={4}
                          placeholder="Optional context..."
                          className="w-full text-lg px-4 py-3 bg-[var(--color-card-bg)] border-2 border-[var(--color-border)] rounded-lg focus:outline-none focus:border-[var(--color-accent)] transition-colors text-[var(--color-text-primary)]"
                      />
                  </div>
                  <div className="space-y-3">
                    <NextButton>Finish Setup</NextButton>
                    <BackButton />
                  </div>
              </form>
            </div>
          </div>
        </div>
    </div>
  );
};

export default OnboardingFlow;
