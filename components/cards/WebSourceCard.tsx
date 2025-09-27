import React from 'react';
import type { WebSource } from '../../types';
import { GlobeIcon, ShieldCheckIcon, AlertIcon } from '../icons';
import { useLocale } from '../../contexts/LocaleContext';

const WebSourceCard: React.FC<{ source: WebSource; isTrusted: boolean }> = ({ source, isTrusted }) => {
    const { t } = useLocale();

    return (
        <a href={source.url} target="_blank" rel="noopener noreferrer" className="block mt-3 p-3 bg-[var(--color-card-bg)] hover:bg-[var(--color-card-quran-bg)] border border-[var(--color-border)] rounded-lg hover:border-[var(--color-accent)] transition-all duration-200 shadow-sm hover:shadow-md">
            <div className="flex items-center gap-2">
                <GlobeIcon />
                <p className="font-semibold text-[var(--color-primary)] flex-1 truncate">{source.title}</p>
                {isTrusted ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full flex-shrink-0" title={t('trustedSourceTooltip')}>
                        <ShieldCheckIcon className="w-3 h-3" />
                        {t('trustedSource')}
                    </span>
                ) : (
                    <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full flex-shrink-0" title={t('unverifiedSourceTooltip')}>
                        <AlertIcon className="w-3 h-3" />
                        {t('unverifiedSource')}
                    </span>
                )}
            </div>
            {source.snippet && <p className="text-sm text-[var(--color-text-secondary)] mt-1 italic">"{source.snippet}"</p>}
            <p className="text-xs text-[var(--color-text-subtle)] mt-2 truncate">{source.url}</p>
        </a>
    );
};

export default WebSourceCard;