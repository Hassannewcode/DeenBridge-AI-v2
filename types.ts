// Add global type for Google Identity Services client
declare global {
  interface Window {
    google: any; 
  }
}

// Fix: Moved Ayah, Surah, and QuranBookmark interfaces here to centralize types.
export interface Ayah {
    number: number;
    text: string;
}

export interface Surah {
    number: number;
    name: string;
    ayahs: Ayah[];
}

export interface QuranBookmark {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  createdAt: number;
}

export enum Denomination {
  Sunni = 'Sunni',
  Shia = 'Shia',
  Sufi = 'Sufi',
  Ibadi = 'Ibadi',
}

export interface Source {
  title: string;
  reference: string;
  author: string;
}

export interface ScripturalResult {
  text: string;
  source: Source;
}

export interface WebSource {
  title: string;
  url: string;
  snippet?: string;
}

export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  }
}

export interface GeminiResponse {
  corePoint?: string;
  summary: string;
  scripturalResults: ScripturalResult[];
  webResults: WebSource[];
  groundingChunks?: GroundingChunk[];
}

export enum MessageSender {
  User = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  sender: MessageSender;
  text?: string;
  file?: {
    data: string; // base64 encoded string
    mimeType: string;
    name: string;
  };
  response?: GeminiResponse;
  rawResponseText?: string;
  isStreaming?: boolean;
  createdAt?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  draft?: string;
  draftFile?: {
    data: string; // base64 encoded string
    mimeType: string;
    name: string;
  } | null;
  isPinned?: boolean;
}

export interface UserProfile {
  name: string;
  email: string | null;
  avatar: string | null;
  dob: { day: string; month: string; year: string; calendar: 'gregorian' | 'hijri' } | null;
  extraInfo: string;
  enableSound: boolean;
  enableHaptics: boolean;
  onboardingComplete: boolean;
  enableGoogleSearch: boolean;
  appLanguage: 'en' | 'ar';
  translationLanguage: string;
  quranFont: 'amiri' | 'lateef' | 'noto' | 'uthmanic' | 'cairo' | 'tajawal' | 'elmessiri' | 'ibm' | 'readex';
  uiFont: 'inter' | 'amiri' | 'native';
  arabicDialect: 'msa' | 'egyptian' | 'hijazi' | 'levantine' | 'gulf' | 'iraqi' | 'maghrebi';
  liveChatMode: 'toggle' | 'holdToTalk';
  ttsSettings: {
    voice: string; // 'native' or Gemini voice names like 'Zephyr'
    pitch: number;
    rate: number;
  };
  uiScale: number; // Percentage value for UI/text scaling
  quranReaderLayout: 'split' | 'stacked'; // Layout choice for the Quran reader
}

// For Quranic Analysis Service
export interface QuranAnalysisVerse {
  surah_name: string;
  surah_number: number;
  verse_number: number;
  arabic_text: string;
}

export interface QuranAnalysisResult {
  topic_summary: string;
  statistical_summary: string;
  relevant_verses: QuranAnalysisVerse[];
}