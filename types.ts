

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
  dob: { day: string; month: string; year: string; calendar: 'gregorian' | 'hijri' } | null;
  extraInfo: string;
  enableSound: boolean;
  enableHaptics: boolean;
  onboardingComplete: boolean;
  enableGoogleSearch: boolean;
  appLanguage: 'en' | 'ar';
  translationLanguage: string;
}
