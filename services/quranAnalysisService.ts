import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import type { QuranAnalysisResult } from '../types';

// The API key is sourced from environment variables.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    throw new Error("API_KEY is not set. Please add your API key to environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    topic_summary: {
      type: Type.STRING,
      description: "A concise summary of what the Quran says about the topic.",
    },
    statistical_summary: {
      type: Type.STRING,
      description: "A statistical overview, like 'The concept of [topic] is mentioned X times across Y different surahs.' Be factual and brief.",
    },
    relevant_verses: {
      type: Type.ARRAY,
      description: "A list of up to 10 of the most relevant Quranic verses about the topic.",
      items: {
        type: Type.OBJECT,
        properties: {
          surah_name: { type: Type.STRING, description: "The English name of the Surah (e.g., Al-Baqarah)." },
          surah_number: { type: Type.INTEGER, description: "The number of the Surah (e.g., 2)." },
          verse_number: { type: Type.INTEGER, description: "The number of the verse (e.g., 155)." },
          arabic_text: { type: Type.STRING, description: "The original, untranslated Arabic script of the verse." },
        },
        required: ["surah_name", "surah_number", "verse_number", "arabic_text"],
      },
    },
  },
  required: ["topic_summary", "statistical_summary", "relevant_verses"],
};


export const analyzeQuranTopic = async (topic: string): Promise<QuranAnalysisResult> => {
  const prompt = `You are an expert Quranic scholar and data analyst. The user wants to understand what the Quran says about a specific topic.

  Topic: "${topic}"

  Your task is to analyze the entire Quran and provide a structured JSON response.
  1.  **topic_summary**: Write a clear, concise summary of the Quran's teachings on this topic.
  2.  **statistical_summary**: Provide a brief statistical analysis. For example, "The concept of patience is mentioned over 100 times in the Quran across numerous surahs." Be factual.
  3.  **relevant_verses**: Find and list up to 10 of the most relevant and direct verses related to the topic. For each verse, provide the Surah name (English), Surah number, verse number, and the full original Arabic text. DO NOT include any English translation or transliteration in the arabic_text field.

  Respond ONLY with the JSON object that adheres to the provided schema.`;

  try {
    const result: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: analysisSchema,
        },
    });

    const jsonText = result.text.trim();
    return JSON.parse(jsonText);
  } catch (error) {
      console.error("Error analyzing Quran topic:", error);
      throw new Error("Failed to analyze the topic. The AI service may be unavailable or the topic too complex. Please try again later.");
  }
};
