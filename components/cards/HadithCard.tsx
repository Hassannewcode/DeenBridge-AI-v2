import React from 'react';
import type { ScripturalResult } from '../../types';
import { BookIcon, ShieldCheckIcon } from '../icons';
import { useTranslation } from '../../hooks/useTranslation';

const translationLanguages = ['English', 'Urdu', 'Indonesian'];

const HadithCard: React.FC<{ result: ScripturalResult, index: number, isTrusted: boolean }> = ({ result, index, isTrusted }) => {
    const { translation, transliteration, isLoading, handleTranslate, handleTransliterate } = useTranslation(result.text, 'hadith');

    return (
        <div key={`hadith-${index}`} className="mt-2 p-3 rounded-lg bg-[var(--color-card-bg)] border border-[var(--color-border)] shadow-sm">
            <blockquote className="text-[var(--color-text-secondary)] italic border-l-4 border-[var(--color-border)] pl-3 mb-2">
                "{result.text}"
            </blockquote>
            <div className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border)]">
                <div className="w-5 h-5 flex-shrink-0 text-[var(--color-text-subtle)] mt-0.5"><BookIcon /></div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-[var(--color-text-primary)]">{result.source.title}</p>
                        {isTrusted && (
                            <span className="flex items-center gap-1 text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full" title="This source is from a pre-vetted, trusted collection.">
                                <ShieldCheckIcon className="w-3 h-3" />
                                Trusted
                            </span>
                        )}
                    </div>
                    <p className="text-xs">{result.source.reference}</p>
                    {result.source.author && result.source.author !== 'N/A' && <p className="text-xs italic">- {result.source.author}</p>}
                </div>
            </div>

            <div className="mt-3 pt-2 border-t border-[color:rgb(from_var(--color-border)_r_g_b_/_50%)]">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[var(--color-text-subtle)] mr-1">Translate:</span>
                    {translationLanguages.map(lang => (
                        <button 
                          key={lang}
                          onClick={() => handleTranslate(lang)} 
                          disabled={!!isLoading && isLoading !== lang} 
                          className={`text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-wait px-2 py-0.5 rounded
                            ${translation?.lang === lang 
                                ? 'text-[var(--color-primary)] bg-[color:rgb(from_var(--color-primary)_r_g_b_/_10%)]' 
                                : 'text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] hover:bg-[color:rgb(from_var(--color-border)_r_g_b_/_50%)]'}`
                          }
                        >
                          {isLoading === lang ? '...' : lang}
                        </button>
                    ))}
                    <span className="text-[var(--color-text-subtle)]">|</span>
                    <button onClick={handleTransliterate} disabled={!!isLoading && isLoading !== 'transliterate'} className="text-xs font-semibold text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors disabled:opacity-50 disabled:cursor-wait">
                        {isLoading === 'transliterate' ? '...' : transliteration ? 'Hide Transliteration' : 'Transliterate'}
                    </button>
                </div>
                {translation && (
                    <div className="mt-2 p-2 bg-[var(--color-card-quran-bg)] rounded text-sm text-[var(--color-text-secondary)] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                        <p className="font-semibold text-[var(--color-text-primary)]">{translation.lang} Translation:</p>
                        <p className="italic">"{translation.text}"</p>
                    </div>
                )}
                {transliteration && (
                    <div className="mt-2 p-2 bg-[var(--color-card-quran-bg)] rounded text-sm text-[var(--color-text-secondary)] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                        <p className="font-semibold text-[var(--color-text-primary)]">Transliteration:</p>
                        <p className="italic">{transliteration}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HadithCard;