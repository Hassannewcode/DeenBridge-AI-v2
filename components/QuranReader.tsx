import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { parseQuranText } from '../utils/quranParser';
import { SURAH_INFO } from '../data/surah-info';
import { CloseIcon, BookmarkIcon, BookmarkFilledIcon } from './icons';
import { useTranslation } from '../hooks/useTranslation';
import TranslationMenu from './TranslationMenu';
import type { UserProfile } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import useLocalStorage from '../hooks/useLocalStorage';

interface QuranBookmark {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  createdAt: number;
}


interface AyahComponentProps {
  ayah: { number: number; text: string };
  profile: UserProfile;
  surahInfo: typeof SURAH_INFO[0] | undefined;
  setToastInfo: (info: { message: string, type: 'success' | 'error' } | null) => void;
  isBookmarked: boolean;
  onToggleBookmark: (ayahNumber: number) => void;
}

const AyahComponent: React.FC<AyahComponentProps> = ({ ayah, profile, surahInfo, setToastInfo, isBookmarked, onToggleBookmark }) => {
    const { 
        translation, 
        transliteration, 
        isLoading, 
        translate, 
        transliterate,
        hideTranslation,
        hideTransliteration,
    } = useTranslation(ayah.text);
    const { t } = useLocale();

    const handleCopy = () => {
        if (!surahInfo) return;
        const citation = `${surahInfo.name} ${surahInfo.number}:${ayah.number}`;
        let textToCopy = `"${ayah.text}"\n\n`;
        if (translation) {
            textToCopy += `${translation.lang} Translation: "${translation.text}"\n\n`;
        }
        if (transliteration) {
            textToCopy += `Transliteration: "${transliteration}"\n\n`;
        }
        textToCopy += `- The Holy Qur'an, ${citation}`;

        navigator.clipboard.writeText(textToCopy).then(() => {
            setToastInfo({ message: t('copiedToClipboard'), type: 'success' });
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    };

    const handleShare = async () => {
        if (!surahInfo || !navigator.share) return;
        const citation = `${surahInfo.name} ${surahInfo.number}:${ayah.number}`;
        let textToShare = `"${ayah.text}"\n\n`;
        if (translation) {
            textToShare += `${translation.lang} Translation: "${translation.text}"\n\n`;
        }
        if (transliteration) {
            textToShare += `Transliteration: "${transliteration}"\n\n`;
        }
        textToShare += `- The Holy Qur'an, ${citation}`;

        try {
            await navigator.share({
                title: `Qur'an Verse: ${citation}`,
                text: textToShare,
            });
        } catch (error) {
            console.error('Error sharing:', error);
        }
    };

    return (
        <div id={`ayah-${surahInfo?.number}-${ayah.number}`} className="ayah-container border-b border-[var(--color-card-quran-border)] last:border-b-0">
            <div className="flex flex-row-reverse items-start gap-x-2 py-2">
                <div className="flex-grow">
                    <p className="font-amiri text-right leading-relaxed">
                        {ayah.text.split(' ').map((word, index) => (
                            <span key={index} className="ayah-word">{word}</span>
                        ))}
                         <span className="ayah-number">
                            {new Intl.NumberFormat('ar-EG-u-nu-arab').format(ayah.number)}
                        </span>
                    </p>
                </div>
                <div className="flex-shrink-0 flex flex-col items-center gap-2 pt-3">
                    <button 
                        onClick={() => onToggleBookmark(ayah.number)}
                        className="p-1.5 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-accent)] transition-colors"
                        aria-label={isBookmarked ? t('removeBookmark') : t('addBookmark')}
                    >
                        {isBookmarked ? <BookmarkFilledIcon className="w-5 h-5 text-[var(--color-accent)]" /> : <BookmarkIcon className="w-5 h-5" />}
                    </button>
                    <TranslationMenu
                        isLoading={isLoading}
                        translation={translation}
                        transliteration={transliteration}
                        onTranslate={translate}
                        onTransliterate={transliterate}
                        onHideTranslation={hideTranslation}
                        onHideTransliteration={hideTransliteration}
                        onCopy={handleCopy}
                        onShare={handleShare}
                    />
                </div>
            </div>
            {(isLoading || translation || transliteration) && (
              <div dir="ltr" className="pb-2 ps-12">
                  {isLoading && <div className="mt-2 p-3 bg-[var(--color-card-bg)] rounded text-sm text-center text-[var(--color-text-subtle)]">{t('loading')}...</div>}
                  {translation && (
                      <div className="mt-2 p-3 bg-[var(--color-card-bg)] rounded-lg text-sm text-[var(--color-text-secondary)] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                          <p className="font-semibold text-[var(--color-text-primary)]">{translation.lang} Translation:</p>
                          <p className="italic mt-1">"{translation.text}"</p>
                      </div>
                  )}
                  {transliteration && (
                      <div className="mt-2 p-3 bg-[var(--color-card-bg)] rounded-lg text-sm text-[var(--color-text-secondary)] animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
                          <p className="font-semibold text-[var(--color-text-primary)]">Transliteration:</p>
                          <p className="italic mt-1">{transliteration}</p>
                      </div>
                  )}
              </div>
            )}
        </div>
    );
};


interface QuranReaderProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  setToastInfo: (info: { message: string, type: 'success' | 'error' } | null) => void;
}

const QuranReader: React.FC<QuranReaderProps> = ({ isOpen, onClose, profile, setToastInfo }) => {
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [activeTab, setActiveTab] = useState<'surahs' | 'bookmarks'>('surahs');
  const [bookmarks, setBookmarks] = useLocalStorage<QuranBookmark[]>('deenbridge-quran-bookmarks', []);
  const quranData = useMemo(() => parseQuranText(), []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);
  
  useEffect(() => {
    if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
    }
  }, [selectedSurah]);

  const handleSurahChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSurah(Number(event.target.value));
  };

  const surah = quranData.find(s => s.number === selectedSurah);
  const surahInfo = SURAH_INFO.find(s => s.number === selectedSurah);
  
  const handleToggleBookmark = (ayahNumber: number) => {
    if (!surahInfo) return;
    const existingIndex = bookmarks.findIndex(b => b.surahNumber === selectedSurah && b.ayahNumber === ayahNumber);
    if (existingIndex > -1) {
        setBookmarks(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
        const newBookmark: QuranBookmark = {
            surahNumber: selectedSurah,
            ayahNumber,
            surahName: surahInfo.name,
            createdAt: Date.now()
        };
        setBookmarks(prev => [...prev, newBookmark].sort((a,b) => a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber));
    }
  };

  const jumpToBookmark = (bookmark: QuranBookmark) => {
      setActiveTab('surahs');
      setSelectedSurah(bookmark.surahNumber);
      setTimeout(() => {
          const element = document.getElementById(`ayah-${bookmark.surahNumber}-${bookmark.ayahNumber}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in-up"
      style={{ animationDuration: '0.3s' }}
      onClick={onClose}
    >
      <div
        className="quran-reader-modal"
        onClick={e => e.stopPropagation()}
      >
        <aside className="quran-reader-nav flex flex-col">
          <header className="p-4 border-b border-[var(--color-border)] flex-shrink-0 flex items-center justify-between">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">The Holy Qur'an</h1>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90 lg:hidden">
              <CloseIcon />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto">
             <div className="border-b border-[var(--color-border)]">
                <div className="grid grid-cols-2">
                    <button onClick={() => setActiveTab('surahs')} className={`p-4 font-semibold ${activeTab === 'surahs' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-subtle)]'}`}>Surahs</button>
                    <button onClick={() => setActiveTab('bookmarks')} className={`p-4 font-semibold ${activeTab === 'bookmarks' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-subtle)]'}`}>{t('bookmarks')}</button>
                </div>
            </div>
            {activeTab === 'surahs' && (
                <div className="p-4">
                    <label htmlFor="surah-select" className="text-sm font-semibold text-[var(--color-text-secondary)]">Select Surah</label>
                    <select
                    id="surah-select"
                    value={selectedSurah}
                    onChange={handleSurahChange}
                    className="mt-2 w-full px-4 py-2.5 text-base bg-[var(--color-card-bg)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] custom-select"
                    >
                    {SURAH_INFO.map((info) => (
                        <option key={info.number} value={info.number}>
                        {info.number}. {info.name} - {info.name_arabic}
                        </option>
                    ))}
                    </select>
                    {surahInfo && (
                        <div className="mt-4 p-3 bg-[var(--color-card-quran-bg)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] space-y-1">
                            <div className="flex justify-between"><strong>English Name:</strong> <span>{surahInfo.name}</span></div>
                            <div className="flex justify-between"><strong>Meaning:</strong> <span>{surahInfo.name}</span></div>
                            <div className="flex justify-between"><strong>Revelation:</strong> <span>{surahInfo.revelationType}</span></div>
                            <div className="flex justify-between"><strong>Verses:</strong> <span>{surahInfo.totalVerses}</span></div>
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'bookmarks' && (
                 <div className="p-4 space-y-2">
                    {bookmarks.length === 0 ? <p className="text-center text-sm text-[var(--color-text-subtle)] mt-4">{t('noBookmarks')}</p> :
                    bookmarks.map(bookmark => (
                        <button key={`${bookmark.surahNumber}-${bookmark.ayahNumber}`} onClick={() => jumpToBookmark(bookmark)} className="w-full text-left p-2 rounded-lg hover:bg-[var(--color-border)]">
                            <p className="font-semibold text-[var(--color-text-primary)]">{bookmark.surahName}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">Verse {bookmark.ayahNumber}</p>
                        </button>
                    ))
                    }
                </div>
            )}
          </div>
           <footer className="p-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-subtle)] hidden lg:block">
            Text from Tanzil Project
          </footer>
        </aside>

        <main ref={scrollContainerRef} className="quran-reader-main">
            <div className="absolute inset-0 pointer-events-none quran-page-border"></div>
            <div className="p-4 sm:p-6 md:p-8" dir="rtl">
              {surah && surahInfo && (
                <div className="surah-header">
                  <div className="surah-title-container">
                    <div className="surah-title-decorator"></div>
                    <div className="surah-title-info">
                        <h2 className="surah-title-arabic">{surahInfo.name_arabic}</h2>
                        <p className="surah-title-english" dir="ltr">{surahInfo.name} &bull; {surahInfo.revelationType} &bull; {surahInfo.totalVerses} Verses</p>
                    </div>
                    <div className="surah-title-decorator"></div>
                  </div>
                </div>
              )}

              {selectedSurah !== 1 && selectedSurah !== 9 && (
                <p className="basmalah">بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ</p>
              )}

              {surah && surah.ayahs.map(ayah => (
                 <AyahComponent 
                    key={ayah.number} 
                    ayah={ayah} 
                    profile={profile} 
                    surahInfo={surahInfo} 
                    setToastInfo={setToastInfo}
                    isBookmarked={bookmarks.some(b => b.surahNumber === selectedSurah && b.ayahNumber === ayah.number)}
                    onToggleBookmark={handleToggleBookmark}
                 />
              ))}
            </div>
        </main>
      </div>
    </div>,
    document.body
  );
};

export default QuranReader;