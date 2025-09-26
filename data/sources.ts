

import { Denomination } from '../types';

interface SourceInfo {
    name: string;
    url: string;
}

interface TrustedSourceCollection {
    [category: string]: SourceInfo[] | string[];
    trustedDomains: string[];
}

interface TrustedSources {
    [Denomination.Sunni]: TrustedSourceCollection;
    [Denomination.Shia]: TrustedSourceCollection;
    [Denomination.Sufi]: TrustedSourceCollection;
    [Denomination.Ibadi]: TrustedSourceCollection;
}

export const TRUSTED_SOURCES: TrustedSources = {
  [Denomination.Sunni]: {
    'Hadith Collections': [
      { name: 'Sahih al-Bukhari', url: 'https://sunnah.com/bukhari' },
      { name: 'Sahih Muslim', url: 'https://sunnah.com/muslim' },
      { name: 'Sunan an-Nasa\'i', url: 'https://sunnah.com/nasai' },
      { name: 'Sunan Abi Dawood', url: 'https://sunnah.com/abudawud' },
      { name: 'Jami` at-Tirmidhi', url: 'https://sunnah.com/tirmidhi' },
      { name: 'Sunan Ibn Majah', url: 'https://sunnah.com/ibnmajah' },
      { name: 'Muwatta Imam Malik', url: 'https://sunnah.com/malik' },
    ],
    'Tafsir (Quranic Exegesis)': [
      { name: 'Tafsir al-Tabari', url: 'https://www.altafsir.com/Tafasir.asp?tMadhNo=1&tTafsirNo=1&tSoraNo=1&tAyahNo=1&tDisplay=yes&LanguageID=2' },
      { name: 'Tafsir Ibn Kathir', url: 'https://www.altafsir.com/Tafasir.asp?tMadhNo=1&tTafsirNo=7&tSoraNo=1&tAyahNo=1&tDisplay=yes&LanguageID=2' },
      { name: 'Tafsir al-Qurtubi', url: 'https://www.altafsir.com/Tafasir.asp?tMadhNo=1&tTafsirNo=5&tSoraNo=1&tAyahNo=1&tDisplay=yes&LanguageID=2' },
      { name: 'Tafsir al-Jalalayn', url: 'https://www.altafsir.com/Tafasir.asp?tMadhNo=2&tTafsirNo=8&tSoraNo=1&tAyahNo=1&tDisplay=yes&LanguageID=2' },
    ],
    'Fiqh (Jurisprudence)': [
      { name: 'Al-Hidayah (Hanafi)', url: 'https://archive.org/details/alhidayahfi-sharh-bidayat-al-mubtadi' },
      { name: 'Al-Muwatta (Maliki)', url: 'https://sunnah.com/malik' },
      { name: 'Al-Umm (Shafi\'i)', url: 'https://archive.org/details/waq1959/01_1959' },
      { name: 'Al-Mughni (Hanbali)', url: 'https://archive.org/details/al-mughni-ibn-qudamah' },
    ],
    'Major Scholars': [
      { name: 'Imam Abu Hanifa', url: 'https://en.wikipedia.org/wiki/Abu_Hanifa' },
      { name: 'Imam Malik ibn Anas', url: 'https://en.wikipedia.org/wiki/Malik_ibn_Anas' },
      { name: 'Imam al-Shafi\'i', url: 'https://en.wikipedia.org/wiki/Al-Shafi%27i' },
      { name: 'Imam Ahmad ibn Hanbal', url: 'https://en.wikipedia.org/wiki/Ahmad_ibn_Hanbal' },
      { name: 'Imam Al-Ghazali', url: 'https://en.wikipedia.org/wiki/Al-Ghazali' },
      { name: 'Ibn Taymiyyah', url: 'https://en.wikipedia.org/wiki/Ibn_Taymiyyah' },
      { name: 'Imam al-Nawawi', url: 'https://en.wikipedia.org/wiki/Al-Nawawi' },
    ],
    'trustedDomains': [
      'sunnah.com',
      'altafsir.com',
      'archive.org',
      'en.wikipedia.org'
    ]
  },
  [Denomination.Shia]: {
    'Hadith Collections': [
      { name: 'Al-Kafi', url: 'https://thaqalayn.net/book/1' },
      { name: 'Tahdhib al-Ahkam', url: 'https://thaqalayn.net/book/6' },
      { name: 'Al-Istibsar', url: 'https://thaqalayn.net/book/7' },
      { name: 'Man La Yahduruhu al-Faqih', url: 'https://thaqalayn.net/book/2' },
      { name: 'Nahj al-Balagha', url: 'https://www.al-islam.org/nahjul-balagha-part-1-sermons' },
    ],
    'Tafsir (Quranic Exegesis)': [
      { name: 'Tafsir al-Mizan', url: 'https://www.al-islam.org/al-mizan-exegesis-quran-sayyid-muhammad-husayn-tabatabai' },
      { name: 'Tafsir al-Qummi', url: 'https://en.wikipedia.org/wiki/Tafsir_Qomi' },
      { name: 'Tafsir al-Ayyashi', url: 'https://en.wikipedia.org/wiki/Tafsir_Ayyashi' },
    ],
    'Fiqh (Jurisprudence) / Maraji': [
      { name: 'Ayatollah Sistani', url: 'https://www.sistani.org/' },
      { name: 'Ayatollah Khamenei', url: 'https://www.leader.ir/en' },
      { name: 'Ayatollah Khomeini', url: 'https://en.wikipedia.org/wiki/Ruhollah_Khomeini' },
      { name: 'The Risalah Amaliyah of a selected Marja\'', url: 'https://www.al-islam.org/islamic-laws-ayatullah-ali-al-husayni-al-sistani' },
    ],
    'Major Scholars': [
      { name: 'Shaykh al-Kulayni', url: 'https://en.wikipedia.org/wiki/Muhammad_ibn_Ya%27qub_al-Kulayni' },
      { name: 'Shaykh al-Saduq', url: 'https://en.wikipedia.org/wiki/Ibn_Babawayh' },
      { name: 'Shaykh al-Mufid', url: 'https://en.wikipedia.org/wiki/Al-Shaykh_Al-Mufid' },
      { name: 'Allamah al-Hilli', url: 'https://en.wikipedia.org/wiki/Al-Hilli' },
      { name: 'Allamah Majlisi', url: 'https://en.wikipedia.org/wiki/Allamah_Majlesi' },
    ],
    'trustedDomains': [
      'thaqalayn.net',
      'al-islam.org',
      'sistani.org',
      'leader.ir',
      'en.wikipedia.org'
    ]
  },
  [Denomination.Sufi]: {
    'Primary Texts': [
      { name: "Ihya Ulum al-Din (The Revival of the Religious Sciences)", url: "https://archive.org/details/ihya-ulum-al-din" },
      { name: "The Mathnawi of Rumi", url: "https://www.gutenberg.org/ebooks/39836" },
      { name: "Fusus al-Hikam (The Bezels of Wisdom)", url: "https://en.wikipedia.org/wiki/The_Bezels_of_Wisdom" },
    ],
    'Major Figures': [
       { name: 'Imam Al-Ghazali', url: 'https://en.wikipedia.org/wiki/Al-Ghazali' },
       { name: 'Jalal al-Din Rumi', url: 'https://en.wikipedia.org/wiki/Rumi' },
       { name: 'Ibn Arabi', url: 'https://en.wikipedia.org/wiki/Ibn_Arabi' },
       { name: 'Abdul Qadir Jilani', url: 'https://en.wikipedia.org/wiki/Abdul_Qadir_Jilani' },
    ],
    'trustedDomains': [
        'archive.org', 'gutenberg.org', 'en.wikipedia.org', 'sunnah.com', 'al-islam.org'
    ]
  },
  [Denomination.Ibadi]: {
    'Primary Texts': [
        { name: "Musnad of Imam Al-Rabi' bin Habib", url: "https://en.wikipedia.org/wiki/Musnad_al-Rabi_ibn_Habib" },
        { name: "Jami Sahih", url: "https://en.wikipedia.org/wiki/Musnad_al-Rabi_ibn_Habib" },
    ],
    'Major Figures': [
        { name: 'Jabir ibn Zayd', url: 'https://en.wikipedia.org/wiki/Jabir_ibn_Zayd' },
        { name: "Al-Rabi' bin Habib al-Farahidi", url: "https://en.wikipedia.org/wiki/Al-Rabi_ibn_Habib_al-Farahidi" },
        { name: "Ahmad bin Hamad al-Khalili", url: "https://en.wikipedia.org/wiki/Ahmed_bin_Hamad_al-Khalili"}
    ],
    'trustedDomains': [
        'en.wikipedia.org', 'archive.org'
    ]
  }
};
