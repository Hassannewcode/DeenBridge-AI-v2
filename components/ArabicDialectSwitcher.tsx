import React from 'react';
import type { UserProfile } from '../types';

type ArabicDialect = UserProfile['arabicDialect'];

interface ArabicDialectSwitcherProps {
  currentDialect: ArabicDialect;
  onDialectChange: (dialect: ArabicDialect) => void;
}

const dialectOptions: { value: ArabicDialect; label: string }[] = [
  { value: 'msa', label: 'Modern Standard (MSA)' },
  { value: 'egyptian', label: 'Egyptian' },
  { value: 'hijazi', label: 'Hijazi (West Arabian)' },
  { value: 'levantine', label: 'Levantine' },
];

const ArabicDialectSwitcher: React.FC<ArabicDialectSwitcherProps> = ({ currentDialect, onDialectChange }) => {
  return (
    <div>
      <label htmlFor="dialect-select" className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">AI Arabic Dialect</label>
      <select 
        id="dialect-select" 
        value={currentDialect} 
        onChange={e => onDialectChange(e.target.value as ArabicDialect)} 
        className="w-full px-3 py-2 bg-[var(--color-card-bg)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] custom-select"
      >
        {dialectOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ArabicDialectSwitcher;