
// NOTE: This file facilitates the integration of a high-quality, server-side Text-to-Speech (TTS) engine,
// as requested. To make this feature functional, you must deploy the serverless function described in
// the prompt and replace the placeholder URL below with your actual function's endpoint URL.
// It is highly recommended to store this URL in an environment variable for security and flexibility.

// For example, in your deployment environment (like Vercel or Netlify), set an environment variable:
// TTS_FUNCTION_URL = "https://your-region-your-project.cloudfunctions.net/your-function-name"

const CLOUD_FUNCTION_URL = process.env.TTS_FUNCTION_URL || "YOUR_CLOUD_FUNCTION_URL_HERE"; 

/**
 * Checks if the TTS service has been configured with a valid URL.
 * The "Read Aloud" button will be disabled if this returns false.
 * @returns {boolean} True if the URL is not the placeholder, false otherwise.
 */
export const isTtsServiceConfigured = (): boolean => CLOUD_FUNCTION_URL !== "YOUR_CLOUD_FUNCTION_URL_HERE";

/**
 * Fetches synthesized speech audio from the cloud function.
 * @param {string} text The text to synthesize.
 * @param {'en' | 'ar'} lang The language of the text.
 * @returns {Promise<string>} A Promise that resolves with a base64 encoded string of the MP3 audio data.
 */
export const getSpeech = async (text: string, lang: 'en' | 'ar'): Promise<string> => {
    if (!isTtsServiceConfigured()) {
        console.error("Text-to-Speech service is not configured. Please set the cloud function URL.");
        throw new Error("TTS service is not configured.");
    }

    const languageCode = lang === 'ar' ? 'ar-XA' : 'en-US';

    try {
        const response = await fetch(CLOUD_FUNCTION_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: text,
                language_code: languageCode
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("TTS service error response:", errorBody);
            throw new Error(`TTS service failed with status ${response.status}.`);
        }

        // IMPORTANT: Your backend function should return the audio content as a raw base64 encoded string in the response body.
        const audioBase64 = await response.text();
        return audioBase64;

    } catch (error) {
        console.error("Error fetching speech from cloud function:", error);
        throw error;
    }
};
