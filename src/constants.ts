import { Denomination } from './types';

export const CORE_POINTS = {
  [Denomination.Sunni]: [
    {
      title: "Quranic and Hadith Search",
      description: "Search for Quranic verses and Hadith, with explanations from renowned scholars.",
    },
    {
      title: "Fiqh (Jurisprudence) Rulings",
      description: "Find rulings from the Hanafi, Maliki, Shafi'i, and Hanbali schools of law.",
    },
    {
      title: "Scholar and Source Directory",
      description: "Learn about key scholars like Imam Al-Ghazali and their major works.",
    },
    {
      title: "Prayer and Worship Guidance",
      description: "Get step-by-step guidance on acts of worship from authentic fiqh literature.",
    },
    {
      title: "Ethical and Moral Guidance",
      description: "Explore ethical questions with answers sourced from the Quran and Sunnah.",
    },
  ],
  [Denomination.Shia]: [
    {
      title: "Quranic and Hadith Search",
      description: "Search for Quranic verses and Hadith, with commentary from Shia sources like Tafsir al-Mizan.",
    },
    {
      title: "Fiqh (Jurisprudence) Rulings",
      description: "Access rulings from prominent Maraji' al-Taqlid like Ayatollah Sistani.",
    },
    {
      title: "Scholar and Source Directory",
      description: "Learn about key scholars like Shaykh al-Mufid and Allamah al-Hilli.",
    },
    {
      title: "Prayer and Worship Guidance",
      description: "Get step-by-step guidance on worship based on the Risalah Amaliyah.",
    },
    {
      title: "Ethical and Moral Guidance",
      description: "Explore ethical questions with answers sourced from the Quran and Al-Kafi.",
    },
  ],
  [Denomination.Sufi]: [
    {
      title: "Spiritual Purification (Tazkiah)",
      description: "Find guidance on the spiritual journey from masters like Imam Al-Ghazali and Rumi.",
    },
    {
      title: "Remembrance of God (Dhikr)",
      description: "Explore the practices and significance of Dhikr from the Quran and Sufi traditions.",
    },
    {
      title: "Sufi Saints and Scholars",
      description: "Learn about influential figures like Ibn Arabi, Rumi, and Abdul Qadir Jilani.",
    },
    {
      title: "Ethical and Metaphysical Philosophy",
      description: "Ask questions on ethics, the nature of the self, and the relationship with God.",
    },
    {
      title: "Poetry and Parables",
      description: "Discover spiritual insights from the poetic works of masters like Rumi and Hafez.",
    },
  ],
  [Denomination.Ibadi]: [
    {
      title: "Quranic and Hadith Search",
      description: "Search Quranic text and Hadith from collections like Musnad of Imam Al-Rabi'.",
    },
    {
      title: "Fiqh (Jurisprudence) Rulings",
      description: "Find rulings from the Ibadi school based on the works of its foundational scholars.",
    },
    {
      title: "Ibadi History and Principles",
      description: "Learn about the history of the Ibadi movement and its core principles.",
    },
    {
      title: "Community and Governance",
      description: "Explore Ibadi perspectives on social justice, community, and leadership.",
    },
    {
      title: "Theological Distinctions",
      description: "Understand the specific theological standpoints of Ibadi Islam.",
    },
  ],
};