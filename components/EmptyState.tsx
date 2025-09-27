import React from 'react';
import { CORE_POINTS } from '../constants';
import { Denomination } from '../types';
import ExampleQueryCard from './ExampleQueryCard';
import { useLocale } from '../contexts/LocaleContext';
import { DeenBridgeLogoIcon } from './icons';

const EmptyState: React.FC<{ denomination: Denomination; onQuery: (query: string) => void }> = ({ denomination, onQuery }) => {
    const { t } = useLocale();
    const corePoints = CORE_POINTS[denomination];
    const exampleQueries = [
      `What does the Quran say about patience?`,
      `Can you explain ${corePoints[1].title.split(' ')[0]} in ${denomination} Islam?`,
      `Tell me about the scholar ${corePoints[2].description.split(' like ')[1].split(' and')[0].replace(',', '')}?`
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-4 md:p-8 animate-fade-in-up">
            <div className="w-24 h-24 p-4 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] rounded-full flex items-center justify-center shadow-lg text-white">
                <DeenBridgeLogoIcon />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-[var(--color-text-primary)]">{t('beginYourInquiry')}</h2>
            <p className="mt-2 text-[var(--color-text-secondary)] max-w-lg">
                {t('beginYourInquirySubtext').replace('{denomination}', denomination)}
            </p>
            <div className="w-full max-w-lg mt-8 space-y-3">
              <h3 className="text-sm font-bold text-[var(--color-text-subtle)] uppercase tracking-wider">{t('exampleQueries')}</h3>
              {exampleQueries.map((query, index) => (
                <ExampleQueryCard key={index} query={query} onQuery={onQuery} />
              ))}
            </div>
        </div>
    );
};

export default EmptyState;