import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { parseQuranText } from '../utils/quranParser';
import type { Ayah as AyahType, Surah as SurahType } from '../types';
import { SURAH_INFO } from '../data/surah-info';
import { CloseIcon, InfoIcon } from './icons';
import type { UserProfile, QuranBookmark } from '../types';
import { useLocale } from '../contexts/LocaleContext';
import useLocalStorage from '../hooks/useLocalStorage';
import QuranInfoPanel from './QuranInfoPanel';
import SurahInfoPanel from './SurahInfoPanel';
import { useFocusTrap } from '../lib/focus';

// --- Sub-Components ---

const AyahMarker: React.FC<{ number: number }> = React.memo(({ number }) => (
    <span className="qr-ayah-marker">
        <svg viewBox="0 0 100 100" className="qr-ayah-marker-shape" aria-hidden="true">
             <path d="M73.2,8.2l18.6,18.6v46.4l-18.6,18.6H26.8L8.2,73.2V26.8L26.8,8.2H73.2z" fill="currentColor"/>
        </svg>
        <span className="qr-ayah-marker-text">
            {new Intl.NumberFormat('ar-EG-u-nu-arab').format(number)}
        </span>
    </span>
));

const SurahHeader: React.FC<{ info: typeof SURAH_INFO[0], onInfoClick: () => void }> = React.memo(({ info, onInfoClick }) => (
    <div className="qr-surah-header">
        <h2 className="qr-surah-title-arabic">{info.name_arabic}</h2>
        <div className="flex items-center justify-center gap-2 mt-2">
            <p className="qr-surah-title-english" dir="ltr">{info.name} &bull; {info.revelationType} &bull; {info.totalVerses} Verses</p>
             <button onClick={onInfoClick} className="text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors">
                <InfoIcon />
             </button>
        </div>
    </div>
));

const Ayah: React.FC<{
    ayah: AyahType;
    surahNumber: number;
    onClick: () => void;
    isSelected: boolean;
}> = ({ ayah, surahNumber, onClick, isSelected }) => {
    return (
        <span 
            id={`ayah-${surahNumber}-${ayah.number}`} 
            className={`qr-ayah group ${isSelected ? 'selected' : ''}`}
            style={{display: 'inline', cursor: 'pointer'}}
            onClick={onClick}
        >
            <span className="qr-ayah-text">
                {ayah.text}
                <AyahMarker number={ayah.number} />
            </span>
        </span>
    );
};


// --- Main Reader Component ---
const QuranReader: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  setToastInfo: (info: { message: string, type: 'success' | 'error' } | null) => void;
}> = ({ isOpen, onClose, profile, setToastInfo }) => {
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [activeTab, setActiveTab] = useState<'surahs' | 'bookmarks'>('surahs');
  const [bookmarks, setBookmarks] = useLocalStorage<QuranBookmark[]>('deenbridge-quran-bookmarks', []);
  const [selectedAyah, setSelectedAyah] = useState<{ surahNumber: number, ayahNumber: number } | null>(null);
  const [isSurahInfoOpen, setIsSurahInfoOpen] = useState(false);
  
  const quranData = useMemo(() => parseQuranText(), []);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const { t } = useLocale();
  
  useFocusTrap(modalRef, isOpen);

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
    setSelectedAyah(null);
    setIsSurahInfoOpen(false);
  }, [selectedSurah]);

  const handleAyahClick = (surahNum: number, ayahNum: number) => {
    setIsSurahInfoOpen(false);
    setSelectedAyah({ surahNumber: surahNum, ayahNumber: ayahNum });
  };
  
  const handleOpenSurahInfo = () => {
      setSelectedAyah(null);
      setIsSurahInfoOpen(true);
  };

  const handleClosePanels = () => {
    setSelectedAyah(null);
    setIsSurahInfoOpen(false);
  };
  
  const surah = quranData.find(s => s.number === selectedSurah);
  const surahInfo = SURAH_INFO.find(s => s.number === selectedSurah);
  
  const handleToggleBookmark = (surahNum: number, ayahNum: number) => {
    const sInfo = SURAH_INFO.find(s => s.number === surahNum);
    if (!sInfo) return;
    const isBookmarked = bookmarks.some(b => b.surahNumber === surahNum && b.ayahNumber === ayahNum);
    if (isBookmarked) {
        setBookmarks(prev => prev.filter(b => !(b.surahNumber === surahNum && b.ayahNumber === ayahNum)));
        setToastInfo({ message: t('removeBookmark'), type: 'error' });
    } else {
        const newBookmark: QuranBookmark = {
            surahNumber: surahNum, ayahNumber: ayahNum, surahName: sInfo.name, createdAt: Date.now()
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
          handleAyahClick(bookmark.surahNumber, bookmark.ayahNumber);
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

  const isPanelOpen = selectedAyah || isSurahInfoOpen;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in-up"
      style={{ animationDuration: '0.3s' }}
      onClick={onClose}
    >
      <div ref={modalRef} className="quran-reader-modal" onClick={e => e.stopPropagation()}>
        {/* Backdrop for side panels on mobile */}
        {isPanelOpen && <div onClick={handleClosePanels} className="absolute inset-0 bg-black/40 z-50 transition-opacity lg:hidden" aria-hidden="true" />}
        <aside className="quran-reader-nav flex flex-col">
          <header className="p-2 lg:p-4 border-b border-[var(--color-border)] flex-shrink-0 flex items-center justify-between">
            <h1 className="text-lg lg:text-xl font-bold text-[var(--color-text-primary)]">The Holy Qur'an</h1>
            <button onClick={onClose} className="p-2 -mr-2 rounded-full text-[var(--color-text-subtle)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] transition-colors active:scale-90">
              <CloseIcon />
            </button>
          </header>
          <div className="flex-1 overflow-y-auto">
             <div className="border-b border-[var(--color-border)]">
                <div className="grid grid-cols-2">
                    <button onClick={() => setActiveTab('surahs')} className={`p-3 lg:p-4 font-semibold ${activeTab === 'surahs' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-subtle)]'}`}>Surahs</button>
                    <button onClick={() => setActiveTab('bookmarks')} className={`p-3 lg:p-4 font-semibold ${activeTab === 'bookmarks' ? 'text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]' : 'text-[var(--color-text-subtle)]'}`}>{t('bookmarks')}</button>
                </div>
            </div>
            {activeTab === 'surahs' && (
                <div className="p-2 lg:p-4">
                    <label htmlFor="surah-select" className="text-sm font-semibold text-[var(--color-text-secondary)]">Select Surah</label>
                    <select id="surah-select" value={selectedSurah} onChange={e => setSelectedSurah(Number(e.target.value))} className="mt-1 lg:mt-2 w-full px-3 py-2 lg:py-2.5 text-base bg-[var(--color-card-bg)] border rounded-lg focus:outline-none focus:ring-2 transition-all text-[var(--color-text-primary)] border-[var(--color-border)] focus:ring-[var(--color-accent)] focus:border-[var(--color-accent)] custom-select">
                        {SURAH_INFO.map((info) => (<option key={info.number} value={info.number}>{info.number}. {info.name} - {info.name_arabic}</option>))}
                    </select>
                </div>
            )}
            {activeTab === 'bookmarks' && (
                 <div className="p-2 lg:p-4 space-y-1">
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
        <main ref={scrollContainerRef} className={`quran-reader-main ${isPanelOpen ? 'panel-open' : ''}`}>
            <div className="qr-page-container">
                <div className="qr-page">
                    {surahInfo && <SurahHeader info={surahInfo} onInfoClick={handleOpenSurahInfo} />}
                    {showBasmalah && (
                      <div className="qr-basmalah">
                          <img src="https://raw.githubusercontent.com/Hassannewcode/My-Image-library/refs/heads/main/DeenBridge/render_graphic-Arabic.png" alt="Bismillah-ir-Rahman-ir-Rahim" style={{ maxHeight: '80px', objectFit: 'contain' }} />
                      </div>
                    )}
                    <div className="qr-text-container">
                        {surah && surahAyahs.map(ayah => (
                            <Ayah 
                                key={ayah.number} 
                                ayah={ayah}
                                surahNumber={surahInfo!.number}
                                onClick={() => handleAyahClick(surah.number, ayah.number)}
                                isSelected={selectedAyah?.surahNumber === surah.number && selectedAyah.ayahNumber === ayah.number}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </main>
        {selectedAyah && surah && (
             <QuranInfoPanel
                surah={surah}
                ayah={surah.ayahs.find(a => a.number === selectedAyah.ayahNumber)!}
                profile={profile}
                onClose={handleClosePanels}
                bookmarks={bookmarks}
                onToggleBookmark={handleToggleBookmark}
             />
        )}
        {isSurahInfoOpen && surah && surahInfo && (
            <SurahInfoPanel 
                surah={surah}
                surahInfo={surahInfo}
                onClose={handleClosePanels}
            />
        )}
      </div>
    </div>,
    document.body
  );
};

export default QuranReader;