import { quranText } from '../data/quran';

// FIX: Export the Ayah interface to make it accessible to other modules.
export interface Ayah {
    number: number;
    text: string;
}

// FIX: Export the Surah interface to make it accessible to other modules.
export interface Surah {
    number: number;
    name: string;
    ayahs: Ayah[];
}

export const SURAH_NAMES = [
  "Al-Fatihah", "Al-Baqarah", "Aal-E-Imran", "An-Nisa", "Al-Ma'idah", "Al-An'am", "Al-A'raf", "Al-Anfal", "At-Tawbah",
  "Yunus", "Hud", "Yusuf", "Ar-Ra'd", "Ibrahim", "Al-Hijr", "An-Nahl", "Al-Isra", "Al-Kahf", "Maryam", "Taha",
  "Al-Anbiya", "Al-Hajj", "Al-Mu'minun", "An-Nur", "Al-Furqan", "Ash-Shu'ara", "An-Naml", "Al-Qasas", "Al-Ankabut",
  "Ar-Rum", "Luqman", "As-Sajdah", "Al-Ahzab", "Saba", "Fatir", "Ya-Sin", "As-Saffat", "Sad", "Az-Zumar", "Ghafir",
  "Fussilat", "Ash-Shura", "Az-Zukhruf", "Ad-Dukhan", "Al-Jathiyah", "Al-Ahqaf", "Muhammad", "Al-Fath", "Al-Hujurat",
  "Qaf", "Adh-Dhariyat", "At-Tur", "An-Najm", "Al-Qamar", "Ar-Rahman", "Al-Waqi'ah", "Al-Hadid", "Al-Mujadila",
  "Al-Hashr", "Al-Mumtahanah", "As-Saff", "Al-Jumu'ah", "Al-Munafiqun", "At-Taghabun", "At-Talaq", "At-Tahrim",
  "Al-Mulk", "Al-Qalam", "Al-Haqqah", "Al-Ma'arij", "Nuh", "Al-Jinn", "Al-Muzzammil", "Al-Muddaththir", "Al-Qiyamah",
  "Al-Insan", "Al-Mursalat", "An-Naba", "An-Nazi'at", "Abasa", "At-Takwir", "Al-Infitar", "Al-Mutaffifin",
  "Al-Inshiqaq", "Al-Buruj", "At-Tariq", "Al-A'la", "Al-Ghashiyah", "Al-Fajr", "Al-Balad", "Ash-Shams", "Al-Lail",
  "Ad-Duha", "Ash-Sharh", "At-Tin", "Al-Alaq", "Al-Qadr", "Al-Bayyinah", "Az-Zalzalah", "Al-Adiyat", "Al-Qari'ah",
  "At-Takathur", "Al-Asr", "Al-Humazah", "Al-Fil", "Quraysh", "Al-Ma'un", "Al-Kawthar", "Al-Kafirun", "An-Nasr",
  "Al-Masad", "Al-Ikhlas", "Al-Falaq", "An-Nas"
];


export const parseQuranText = (): Surah[] => {
    const lines = quranText.trim().split('\n');
    const surahs: Surah[] = [];
    let currentSurah: Surah | null = null;

    for (const line of lines) {
        if (!line || line.startsWith('#') || line.trim().length === 0) continue; // Skip comments and empty lines

        const parts = line.split('|');
        if (parts.length === 3) {
            const surahNum = parseInt(parts[0], 10);
            const ayahNum = parseInt(parts[1], 10);
            const text = parts[2].trim();

            if (!currentSurah || currentSurah.number !== surahNum) {
                if (currentSurah) {
                    surahs.push(currentSurah);
                }
                currentSurah = {
                    number: surahNum,
                    name: SURAH_NAMES[surahNum - 1] || `Surah ${surahNum}`,
                    ayahs: [],
                };
            }
            currentSurah.ayahs.push({ number: ayahNum, text });
        }
    }
    if (currentSurah) {
        surahs.push(currentSurah);
    }
    return surahs;
};