import { Hadith } from '../types';

const API_BASE_URL = 'https://hadeethenc.com/api/v1/hadeeths/search/?language=en&s=';

export const searchHadiths = async (query: string): Promise<Hadith[]> => {
  if (!query.trim()) {
    return [];
  }
  try {
    const response = await fetch(`${API_BASE_URL}${encodeURIComponent(query)}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `API call failed with status ${response.status}`);
    }
    const data = await response.json();
    
    // Transform API response to our Hadith type
    if (data && data.data) {
        return data.data.map((item: any) => ({
          id: item.id,
          title: item.translations?.en?.title || 'Untitled Hadith',
          arabic: item.hadeeth,
          english: item.translations?.en?.hadeeth || 'No translation available.',
          attribution: item.translations?.en?.attribution || 'No attribution available.',
        }));
    }
    return [];
  } catch (error) {
    console.error("Error fetching Hadith data:", error);
    throw error; // Re-throw to be handled by the component
  }
};
