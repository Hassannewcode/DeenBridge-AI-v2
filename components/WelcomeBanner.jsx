import React from 'react';

const WelcomeBanner = () => (
  <div 
    className="p-4 mb-8 text-center bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_60%)] backdrop-blur-md rounded-xl border border-[var(--color-border)] animate-fade-in-up" 
    style={{ animationDelay: '200ms' }}
  >
    <p className="text-sm text-[var(--color-text-secondary)] font-semibold">
      Disclaimer: DeenBridge is a research tool and does not provide religious rulings (fatwas). Please consult a qualified scholar for definitive guidance.
    </p>
  </div>
);

export default WelcomeBanner;
