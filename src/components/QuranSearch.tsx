import React, { useState, useEffect, useRef, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { analyzeQuranTopic } from '../services/quranAnalysisService';
import type { QuranAnalysisResult, ScripturalResult, UserProfile } from '../types';
import { CloseIcon, LoadingSpinner } from './icons';
import { useLocale } from '../contexts/LocaleContext';
import QuranVerseCard from './cards/QuranVerseCard';
import MarkdownRenderer from './MarkdownRenderer';

interface QuranSearchProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

const VERSE_BATCH_SIZE = 10;

const QuranSearch: React.FC<QuranSearchProps> = ({ isOpen, onClose, profile }) => {
  const [query, setQuery] = useState('');
  const [analysisResult, setAnalysisResult] = useState<QuranAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);
  const [visibleVerseCount, setVisibleVerseCount] = useState(VERSE_BATCH_SIZE);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLocale();

  const loadingMessages = useMemo(() => [
    t('quranAnalysisLoading1'),
    t('quranAnalysisLoading2'),
    t('quranAnalysisLoading3'),
    t('quranAnalysisLoading4'),
    t('quranAnalysisLoading5'),
  ], [t]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    let messageInterval: number | undefined;
    let timeInterval: number | undefined;

    if (isLoading) {
      let messageIndex = 0;
      setLoadingMessage(loadingMessages[0]);
      messageInterval = window.setInterval(() => {
          messageIndex = (messageIndex