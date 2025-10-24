import { GoogleGenAI, Modality } from "@google/genai";

const API_KEY = process.env.API_KEY;

export const isTtsServiceConfigured = (): boolean => !!API_KEY;

export const getSpeech = async (text: string, voiceName: string, lang: 'en' | 'ar'): Promise<string> => {
    if (!isTtsServiceConfigured()) {
        throw new Error("TTS service is not configured.");
    }

    const prompt = lang === 'ar' 
        ? `اقرأ النص التالي بصوت واضح وجذاب: ${text}`
        : `Read the following text in a clear, engaging, and articulate voice: ${text}`;
    
    const ai = new GoogleGenAI({ apiKey: API_KEY! });

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: prompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voiceName },
                    },
                },
            },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

        if (!base64Audio) {
            throw new Error("No audio data received from TTS service.");
        }
        
        return base64Audio;

    } catch (error) {
        console.error("Error fetching speech from Gemini TTS service:", error);
        throw error;
    }
};