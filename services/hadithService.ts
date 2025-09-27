import type { ScripturalResult } from '../types';
import { parseQuranText } from '../utils/quranParser';
import { SURAH_INFO } from '../data/surah-info';

// This service now performs a local search on the Quran text.

// We parse the text once on module load for efficiency.
const quranData = parseQuranText();

// Interface for search results, compatible with the reader component
export interface Hadith {
  id: string;
  title: string;
  arabic: string;
  english: string;
  attribution: string;
}


// Basic diacritic removal for Arabic search to improve matching
const normalizeArabic = (text: string) => {
  return text
    .replace(/[\u064B-\u0652]/g, "") // Remove harakat (vowels, etc.)
    .replace(/أ|إ|آ/g, "ا") // Normalize alef variants
    .replace(/ى/g, "ي")       // Normalize yaa variants
    .replace(/ؤ/g, "و")       // Normalize waw with hamza
    .replace(/ئ/g, "ي");      // Normalize yaa with hamza
};

export const searchHadiths = async (query: string): Promise<Hadith[]> => {
  if (!query.trim()) {
    return [];
  }
  
  const normalizedQuery = normalizeArabic(query);
  const results: Hadith[] = [];

  quranData.forEach(surah => {
      surah.ayahs.forEach(ayah => {
          if (normalizeArabic(ayah.text).includes(normalizedQuery)) {
              const surahInfo = SURAH_INFO.find(s => s.number === surah.number);
              results.push({
                  id: `${surah.number}:${ayah.number}`,
                  title: `${surahInfo?.name || `Surah ${surah.number}`} (${surah.number}:${ayah.number})`,
                  arabic: ayah.text,
                  english: '', // English is not searched locally; UI can offer translation
                  attribution: `The Holy Qur'an, ${surahInfo?.name_arabic}`,
              });
          }
      });
  });

  return results;
};
