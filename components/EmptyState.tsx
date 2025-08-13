
import React from 'react';
import { CORE_POINTS } from '../constants';
import type { Denomination } from '../types';
import { QuranIcon } from './icons';
import ExampleQueryCard from './ExampleQueryCard';


const EmptyState: React.FC<{ denomination: Denomination; onQuery: (query: string) => void }> = ({ denomination, onQuery }) => {
    const corePoints = CORE_POINTS[denomination];
    const exampleQueries = [
      `What does the Quran say about patience?`,
      `Explain the concept of ${corePoints[1].title.split(' ')[0]} in the ${denomination} tradition.`,
      `Who was the scholar ${corePoints[2].description.split(' like ')[1].split(' and')[0].replace(',', '')}?`
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8 animate-fade-in-up">
            <div className="w-24 h-24 text-[var(--color-primary)] opacity-10">
                <QuranIcon />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[var(--color-text-primary)]">Begin Your Inquiry</h2>
            <p className="mt-2 text-[var(--color-text-secondary)] max-w-lg">
                Ask a question about Islamic theology, history, or jurisprudence based on the <span className="font-bold">{denomination}</span> school of thought.
            </p>
            <div className="w-full max-w-lg mt-8 space-y-3">
              <h3 className="text-sm font-bold text-[var(--color-text-subtle)] uppercase tracking-wider">Example Queries</h3>
              {exampleQueries.map((query, index) => (
                <ExampleQueryCard key={index} query={query} onQuery={onQuery} />
              ))}
            </div>
        </div>
    );
};

export default EmptyState;