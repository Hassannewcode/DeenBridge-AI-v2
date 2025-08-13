
import React from 'react';
import { Denomination } from '../types';
import { SunniIcon, ShiaIcon } from './icons';
import WelcomeBanner from './WelcomeBanner.jsx';

const SelectorCard: React.FC<{ onSelect: () => void, children: React.ReactNode }> = ({ onSelect, children }) => (
  <div 
    onClick={onSelect}
    className="group relative bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_60%)] backdrop-blur-md rounded-xl shadow-lg hover:shadow-xl hover:shadow-[color:rgb(from_var(--color-accent)_r_g_b_/_20%)] transition-all duration-300 ease-in-out transform hover:-translate-y-2 cursor-pointer animate-fade-in-up"
  >
    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="p-8 text-center flex flex-col items-center">
      {children}
    </div>
  </div>
);

const DenominationSelector: React.FC<{ onSelect: (denomination: Denomination) => void }> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-4">
      <div className="w-full max-w-4xl">
        <header className="mb-12 animate-fade-in-up text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-[var(--color-text-primary)]">
            Welcome to <span className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] bg-clip-text text-transparent">DeenBridge</span>
          </h1>
          <p className="mt-4 text-lg text-[var(--color-text-secondary)] max-w-2xl mx-auto">
            A digital librarian for Islamic knowledge. Please select a school of thought to begin your research.
          </p>
        </header>

        <WelcomeBanner />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <SelectorCard onSelect={() => onSelect(Denomination.Sunni)}>
            <SunniIcon />
            <h2 className="text-4xl font-bold text-[var(--color-text-primary)]">Sunni</h2>
            <p className="mt-2 text-[var(--color-text-subtle)]">
              Access knowledge from sources aligned with the Sunni tradition, including the Kutub al-Sittah and major schools of Fiqh.
            </p>
          </SelectorCard>

          <SelectorCard onSelect={() => onSelect(Denomination.Shia)}>
            <ShiaIcon />
            <h2 className="text-4xl font-bold text-[var(--color-text-primary)]">Shia</h2>
            <p className="mt-2 text-[var(--color-text-subtle)]">
              Access knowledge from sources aligned with the Shia tradition, including Al-Kafi and rulings from prominent Maraji'.
            </p>
          </SelectorCard>
        </div>

        <footer className="mt-16 text-center text-xs text-[var(--color-text-subtle)] animate-fade-in-up" style={{ animationDelay: '600ms' }}>
          <p>This selection can be changed later through the settings menu.</p>
        </footer>
      </div>
    </div>
  );
};

export default DenominationSelector;
