import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { parseQuranText } from '../utils/quranParser';
import type { Ayah as AyahType, Surah as SurahType } from '../utils/quranParser';
import { SURAH_INFO } from '../data/surah-info';
import { CloseIcon, BookmarkIcon, BookmarkFilledIcon } from './icons';
import { useTranslation } from '../hooks/useTranslation';
import TranslationMenu from './TranslationMenu';
import type { UserProfile } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import useLocalStorage from '../hooks/useLocalStorage';

// --- Types ---
interface QuranBookmark {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  createdAt: number;
}
interface QuranReaderProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  setToastInfo: (info: { message: string, type: 'success' | 'error' } | null) => void;
}

// --- Sub-Components ---

const AyahMarker: React.FC<{ number: number }> = React.memo(({ number }) => (
    <span className="qr-ayah-marker">
        <svg viewBox="0 0 100 100" className="qr-ayah-marker-shape" aria-hidden="true">
            <polygon points="50,5 65,35 90,50 65,65 50,90 35,65 10,50 35,35" fill="currentColor"/>
        </svg>
        <span className="qr-ayah-marker-text">
            {new Intl.NumberFormat('ar-EG-u-nu-arab').format(number)}
        </span>
    </span>
));

const SurahHeader: React.FC<{ info: typeof SURAH_INFO[0] }> = React.memo(({ info }) => (
    <div className="qr-surah-header">
        <h2 className="qr-surah-title-arabic">{info.name_arabic}</h2>
        <p className="qr-surah-title-english" dir="ltr">{info.name} &bull; {info.revelationType} &bull; {info.totalVerses} Verses</p>
    </div>
));

const Ayah: React.FC<{
    ayah: AyahType;
    surahNumber: number;
    profile: UserProfile;
    isBookmarked: boolean;
    onToggleBookmark: (ayahNumber: number) => void;
}> = ({ ayah, surahNumber, profile, isBookmarked, onToggleBookmark }) => {
    const { 
        translation, transliteration, isLoading, 
        translate, transliterate, hideTranslation, hideTransliteration
    } = useTranslation(ayah.text);
    const { t } = useLocale();

    const handleCopy = useCallback(() => {
        const citation = `${SURAH_INFO[surahNumber - 1].name} ${surahNumber}:${ayah.number}`;
        let textToCopy = `"${ayah.text}" (${citation})\n\n`;
        if (translation) {
            textToCopy += `${translation.lang} Translation: "${translation.text}"`;
        }
        navigator.clipboard.writeText(textToCopy).then(() => alert(t('copiedToClipboard')));
    }, [ayah, surahNumber, translation, t]);
    
    const handleShare = useCallback(async () => {
        if (!navigator.share) return;
        const citation = `${SURAH_INFO[surahNumber - 1].name} ${surahNumber}:${ayah.number}`;
        let textToShare = `"${ayah.text}" (${citation})\n\n`;
        if (translation) {
            textToShare += `${translation.lang} Translation: "${translation.text}"`;
        }
        await navigator.share({ title: `Qur'an ${citation}`, text: textToShare });
    }, [ayah, surahNumber, translation]);

    return (
        <div id={`ayah-${surahNumber}-${ayah.number}`} className="qr-ayah group">
            <div className="qr-ayah-controls">
                <button onClick={() => onToggleBookmark(ayah.number)} className="p-1.5 text-[var(--color-text-subtle)] hover:text-[var(--color-accent)]">
                    {isBookmarked ? <BookmarkFilledIcon className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
                </button>
            </div>
            <span className="qr-ayah-text">
                {ayah.text}
                <AyahMarker number={ayah.number} />
            </span>
             <div className="mt-2 text-right">
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
            {translation && (
                <div className="mt-2 p-2 bg-[var(--color-card-bg)] rounded text-sm text-[var(--color-text-secondary)] text-left" dir="ltr">
                    <p className="font-semibold text-[var(--color-text-primary)]">{translation.lang} Translation:</p>
                    <p className="italic">"{translation.text}"</p>
                </div>
            )}
            {transliteration && (
                <div className="mt-2 p-2 bg-[var(--color-card-bg)] rounded text-sm text-[var(--color-text-secondary)] text-left" dir="ltr">
                    <p className="font-semibold text-[var(--color-text-primary)]">Transliteration:</p>
                    <p className="italic">{transliteration}</p>
                </div>
            )}
        </div>
    );
};


// --- Main Reader Component ---
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
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto' };
  }, [isOpen]);
  
  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
  }, [selectedSurah]);

  const surah = quranData.find(s => s.number === selectedSurah);
  const surahInfo = SURAH_INFO.find(s => s.number === selectedSurah);
  
  const handleToggleBookmark = (ayahNumber: number) => {
    if (!surahInfo) return;
    const isBookmarked = bookmarks.some(b => b.surahNumber === selectedSurah && b.ayahNumber === ayahNumber);
    if (isBookmarked) {
        setBookmarks(prev => prev.filter(b => !(b.surahNumber === selectedSurah && b.ayahNumber === ayahNumber)));
        setToastInfo({ message: t('removeBookmark'), type: 'error' });
    } else {
        const newBookmark: QuranBookmark = {
            surahNumber: selectedSurah, ayahNumber, surahName: surahInfo.name, createdAt: Date.now()
        };
        setBookmarks(prev => [...prev, newBookmark].sort((a,b) => a.surahNumber - b.surahNumber || a.ayahNumber - b.ayahNumber));
        setToastInfo({ message: t('addBookmark'), type: 'success' });
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

  const BISMILLAH = "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ";
  const showBasmalah = selectedSurah !== 1 && selectedSurah !== 9;
  let surahAyahs = surah?.ayahs || [];
  if (selectedSurah !== 1 && surahAyahs[0]?.text.startsWith(BISMILLAH)) {
    const firstAyahText = surahAyahs[0].text.replace(BISMILLAH, '').trim();
    const modifiedAyahs = [...surahAyahs];
    modifiedAyahs[0] = { ...modifiedAyahs[0], text: firstAyahText };
    surahAyahs = modifiedAyahs.filter(a => a.text);
  }

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in-up"
      style={{ animationDuration: '0.3s' }}
      onClick={onClose}
    >
      <div className="qr-modal" onClick={e => e.stopPropagation()}>
        <aside className="qr-nav flex flex-col">
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
                    <select id="surah-select" value={selectedSurah} onChange={e => setSelectedSurah(Number(e.target.value))} className="mt-2 w-full px-4 py-2.5 text-base bg-[var(--color-card-bg)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] custom-select">
                        {SURAH_INFO.map((info) => (<option key={info.number} value={info.number}>{info.number}. {info.name} - {info.name_arabic}</option>))}
                    </select>
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
                    ))}
                </div>
            )}
          </div>
           <footer className="p-4 border-t border-[var(--color-border)] text-center text-xs text-[var(--color-text-subtle)] hidden lg:block">Text from Tanzil Project</footer>
        </aside>
        <main ref={scrollContainerRef} className="qr-main">
            <div className="qr-page">
                {surahInfo && <SurahHeader info={surahInfo} />}
                {showBasmalah && <p className="qr-basmalah font-amiri">{BISMILLAH}</p>}
                <div className="qr-text-container">
                    {surah && surahAyahs.map(ayah => (
                        <Ayah 
                            key={ayah.number} 
                            ayah={ayah}
                            surahNumber={surahInfo!.number}
                            profile={profile}
                            isBookmarked={bookmarks.some(b => b.surahNumber === selectedSurah && b.ayahNumber === ayah.number)}
                            onToggleBookmark={handleToggleBookmark}
                        />
                    ))}
                </div>
                <footer className="qr-page-number">
                    <div className="qr-page-number-decorator">{new Intl.NumberFormat('ar-EG-u-nu-arab').format(surahInfo?.page || 0)}</div>
                </footer>
            </div>
        </main>
      </div>
    </div>,
    document.body
  );
};

export default QuranReader;