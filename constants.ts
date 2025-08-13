
import { Denomination } from './types';

export const CORE_POINTS = {
  [Denomination.Sunni]: [
    {
      title: "Quranic and Hadith Search",
      description: "Retrieves text and commentaries (tafsir) from sources like Tafsir al-Tabari, Ibn Kathir, and Hadith collections like Sahih al-Bukhari, Sahih Muslim, etc.",
    },
    {
      title: "Fiqh (Jurisprudence) Rulings",
      description: "Provides existing rulings from Hanafi, Maliki, Shafi'i, and Hanbali schools, from works like Al-Hidayah and Al-Muwatta.",
    },
    {
      title: "Scholar and Source Directory",
      description: "A directory of scholars like Imam Al-Ghazali and Ibn Taymiyyah, and their works.",
    },
    {
      title: "Prayer and Worship Guidance",
      description: "Step-by-step guidance on worship from authentic fiqh literature like 'Fiqh al-Sunnah'.",
    },
    {
      title: "Ethical and Moral Guidance",
      description: "Addresses ethical questions by retrieving texts from the Quran, Kutub al-Sittah, and scholarly works.",
    },
  ],
  [Denomination.Shia]: [
    {
      title: "Quranic and Hadith Search",
      description: "Retrieves text and commentaries (tafsir) from sources like Tafsir al-Mizan, and Hadith collections like Al-Kafi and Tahdhib al-Ahkam.",
    },
    {
      title: "Fiqh (Jurisprudence) Rulings",
      description: "Provides existing rulings from Maraji' al-Taqlid like Ayatollah Sistani and Ayatollah Khamenei.",
    },
    {
      title: "Scholar and Source Directory",
      description: "A directory of scholars like Shaykh al-Mufid and Allamah al-Hilli, and their works.",
    },
    {
      title: "Prayer and Worship Guidance",
      description: "Step-by-step guidance on worship based on the Risalah Amaliyah of a selected Marja'.",
    },
    {
      title: "Ethical and Moral Guidance",
      description: "Addresses ethical questions by retrieving texts from the Quran, Al-Kafi, and scholarly works.",
    },
  ],
};
