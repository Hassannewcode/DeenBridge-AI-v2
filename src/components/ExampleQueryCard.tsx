import React from 'react';
import { BookIcon } from './icons';

interface ExampleQueryCardProps {
  query: string;
  onQuery: (query: string) => void;
}

const ExampleQueryCard: React.FC<ExampleQueryCardProps> = ({ query, onQuery }) => {
  return (
    <button
      onClick={() => onQuery(query)}
      className="w-full text-left p-4 bg-[color:rgb(from_var(--color-card-bg)_r_g_b_/_70%)] backdrop-blur-sm rounded-lg shadow-sm hover:shadow-lg hover:bg-[var(--color-card-bg)] transition-all duration-200 ease-in-out group transform hover:-translate-y-1 border border-transparent hover:border-[color:rgb(from_var(--color-accent)_r_g_b_/_50%)]"
    >
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 flex-shrink-0 text-[var(--color-text-subtle)] group-hover:text-[var(--color-primary)] transition-colors">
          <BookIcon />
        </div>
        <p className="text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] font-medium">
          {query}
        </p>
      </div>
    </button>
  );
};

export default ExampleQueryCard;