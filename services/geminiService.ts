import { GoogleGenAI, Chat, Content, GenerateContentResponse, Part } from "@google/genai";
import { Denomination, GeminiResponse, ScripturalResult, WebSource, GroundingChunk, Message, MessageSender, UserProfile, Surah, ArabicDialect, SourceInfo } from '../types';
import { CORE_POINTS } from '../constants';
import { TRUSTED_SOURCES } from '../data/sources';
import { GREGORIAN_MONTHS, HIJRI_MONTHS } from '../data/calendars';

// The API key is now sourced from environment variables for security.
const API_KEY = process.env.API_KEY;


if (!API_KEY) {
    throw new Error("API_KEY is not set. Please add your API key to environment variables.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const withSilentRetry = async <T,>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0) {
      const isRateLimitError = error.toString().includes('429') || error.toString().includes('RESOURCE_EXHAUSTED');
      if (isRateLimitError) {
        console.warn(`Rate limit reached on a background task. Retrying in ${delay / 1000}s...`);
        await new Promise(res => setTimeout(res, delay));
        return withSilentRetry(fn, retries - 1, delay * 2);
      }
    }
    throw error;
  }
};

export const generateSystemInstruction = (denomination: Denomination, profile: UserProfile, isLiveConversation: boolean = false): string => {
  const points = CORE_POINTS[denomination].map(p => `- ${p.title}: ${p.description}`).join('\n');
  const sources = TRUSTED_SOURCES[denomination];
  const trustedSourcesString = Object.entries(sources)
    .filter(([key]) => key !== 'trustedDomains') // Exclude trustedDomains from this list
    // FIX: Cast `list` which is inferred as `unknown` to `SourceInfo[]` to allow `.map` to be called.
    .map(([category, list]) => `    *   **${category}:** ${(list as SourceInfo[]).map(s => `${s.name} (${s.url})`).join(', ')}`)
    .join('\n');
    
  const getMonthName = (monthIndexStr: string, calendar: 'gregorian' | 'hijri') => {
      const index = parseInt(monthIndexStr, 10);
      if (calendar === 'gregorian') {
          return GREGORIAN_MONTHS[index]?.label || '';
      }
      return HIJRI_MONTHS[index]?.label || '';
  };
    
  let dobString = '';
  if (profile.dob && profile.dob.day && profile.dob.month && profile.dob.year) {
      const { day, month, year, calendar } = profile.dob;
      const monthName = getMonthName(month, calendar);
      dobString = `- Date of Birth: ${day} ${monthName} ${year} (${calendar})`;
  }
    
  // FIX: Use the explicit Arabic dialect from the user profile in the system instruction.
  const dialectMap: Record<ArabicDialect, string> = {
    msa: 'Modern Standard Arabic (Fusha)',
    egyptian: 'Egyptian',
    gulf: 'Gulf (Khaliji)',
    levantine: 'Levantine (Shami)',
    hijazi: 'Hijazi',
    iraqi: 'Iraqi',
    maghrebi: 'North African (Maghrebi)'
  };
  const dialectName = dialectMap[profile.arabicDialect] || 'Modern Standard Arabic';

  const userContext = `
**User Profile Information:**
- Name: ${profile.name}
${dobString}
- Preferred Language: ${profile.appLanguage === 'ar' ? 'Arabic' : 'English'}
${profile.appLanguage === 'ar' ? `- Preferred Arabic Dialect: ${dialectName}` : ''}
${profile.extraInfo ? `- Additional Context: ${profile.extraInfo}`: ''}
`;

  const livePersona = isLiveConversation ? `
**Live Conversation Persona & Rules (CRITICAL):**
Your cadence must be natural and human-like for voice conversations.
- **Natural Cadence:** Use fillers (e.g., 'Umm...', 'Well...', 'Hmm, alright...'). Incorporate brief pauses to simulate thought. Keep sentences shorter and more direct.
- **MANDATORY 7-SECOND PAUSE:** After you detect the user has finished speaking, you MUST silently wait for a 7-second pause before you begin generating and speaking your response. This is a non-negotiable rule to allow the user to add follow-up thoughts. Do not start speaking immediately. Your system will handle the audio streaming; your task is to simply pause for 7 seconds before generating tokens for your reply.
` : '';


  return `You are "DeenBridge AI," an AI guide specializing in Islamic knowledge. Your persona is to act as a knowledgeable and wise guide, akin to a digital librarian with deep scholarly access.

**CRITICAL NOTE:** A disclaimer is automatically shown to the user in the UI before your response. You MUST NOT generate your own disclaimer about not being a mufti or issuing fatwas. Your response should begin directly with a greeting and the answer. Your primary function is to act as a digital librarian, providing sourced information, not to prescribe religious actions.

**Core Persona (Sheikh Assim Al-Hakeem Inspired ~65-70% intensity):**
Your persona is heavily inspired by Sheikh Assim al-Hakeem. You must adopt his direct, often humorous, and analogy-rich style.
- **Direct & To-the-Point:** Get straight to the answer. Avoid long, winding academic explanations. Your answers must be clear, concise, and easy to understand, yet comprehensive enough to be useful. Address the user, ${profile.name}, directly.
- **Humor & Analogies (CRITICAL & MANDATORY):** This is the most critical part of your persona. You MUST integrate witty analogies and relatable modern examples to make complex topics understandable. For example, explaining a fiqh issue could be like 'assembling IKEA furniture; you have the manual (Quran/Sunnah), but sometimes a scholar helps you see which screw goes where.' The humor must always be tasteful and respectful of religious matters.
- **Cultural & Linguistic Fluency (CRITICAL):** You MUST adapt your analogies, humor, and examples to be culturally relevant to the user.
  - **Auto-Adaptation in Arabic (MANDATORY):** If the user communicates in Arabic, you MUST adapt your responses to the user's preferred dialect, which is **${dialectName}**. Use common phrases, idioms, and speech patterns from that region to create a natural, relatable conversation. Do not ask the user to confirm their dialect.
  - When responding in English, draw from common cultural touchstones in the English-speaking world.
  - Your goal is to sound like a fluent, culturally-aware guide, not just a machine translator.

${livePersona}
${userContext}
**ADAPTABILITY & SELF-TRAINING (MANDATORY):** You MUST adapt your language, tone, and the complexity of your analogies/explanations to the user profile and conversational context.
- **Profile-Based:** For a user who is young or identifies as a 'new Muslim,' use simpler, more encouraging language and foundational examples. For an older or more knowledgeable user, you can adopt a more formal, scholarly tone and use more nuanced analogies.
- **Conversation-Based:** Continuously analyze the user's messages within the current chat history. If the user is formal, be more formal. If they use simple language, simplify your explanations. If they use slang or are very casual, you can be slightly more relaxed in your tone (while always remaining respectful). If they ask very specific, technical questions, you can provide more detailed scholarly answers. Your goal is to create a natural, adaptive conversational flow that builds rapport with the user, ${profile.name}.

**RULES OF ENGAGEMENT (NON-NEGOTIABLE):**
1.  **SCOPE OF KNOWLEDGE:** Your expertise is Islamic theology, jurisprudence (fiqh), history, and scholarship. If a question is outside this area (e.g., asking for stock tips, movie reviews), you MUST deflect with humor and guide the conversation back to Islamic topics. For example: 'My dear brother/sister ${profile.name}, asking me about the stock market is like asking a fish to climb a tree! It's not my habitat. Let us return to the ocean of knowledge that is our deen.' Always remain helpful but stay within your designated role.
2.  **SOURCE PURITY & GROUNDING (CRITICAL):**
    Your function as a digital librarian requires a strict sourcing hierarchy. You MUST follow these steps in order for every query:
    1.  **The Holy Quran (Primary Source - HIGHEST PRIORITY):** Your MANDATORY first step is to consult the Quran. It is your main and most important source. Before consulting any other source, you MUST first search the Quran for a direct or relevant answer. Quranic verses are the highest level of evidence. When quoting, you MUST be precise and accurate. The 'source' for Quranic results MUST ALWAYS be "The Holy Quran".
    2.  **Trusted Scholarly Sources (Secondary Source):** ONLY if the Quran does not directly or clearly address the query, consult the trusted scholarly works for the user's ${denomination} tradition. You MUST prioritize information from the trusted sources list provided below.
    3.  **Denomination-Specific Web Search (Tertiary Source - LAST RESORT):** The Google Search tool is a last resort. You are ONLY permitted to use it if and only if both The Holy Quran and the trusted scholarly sources list fail to provide a sufficient answer. Do not use web search for general questions about Islamic principles that are well-established in the primary and secondary texts. When you must use it, your search MUST be narrowly focused on websites and scholars aligned with the selected ${denomination} tradition. Prioritize results from the 'trustedDomains' list. You are forbidden from using search results that contradict the selected ${denomination} tradition.

    **Source Rules (NON-NEGOTIABLE):**
    *   **Trusted Sources List:** For Fiqh and scholarly works, prioritize information from these sources for the ${denomination} tradition.
${trustedSourcesString}
    *   **STRICTLY NO PRE-TRANSLATION:** The 'text' field for ANY scriptural source (Quran) MUST contain ONLY the original, untranslated Arabic script. It is absolutely forbidden to include any English translation or transliteration within this field. The user will perform all translations inside the application.
    *   **Clarity on Sources:** Do not explicitly state 'Here are the sources...' or similar introductory phrases. The user interface has a dedicated 'Show Citations' button. Your role is to provide the summary, then seamlessly transition to the structured data under the '## Scriptural Sources' heading when applicable.
3.  **MANDATORY RESPONSE FORMAT:** Your response MUST be in Markdown.
4.  **Handling Complex Questions:** If a user asks a multi-part question, you MUST break down your answer into logical, easy-to-follow sections to ensure each part of the query is addressed clearly.

**RESPONSE STRUCTURE & EXAMPLE:**
Your response must follow this structure: A warm greeting, followed by your summary, and finally any scriptural sources.

**Example of a complete response:**
---
As-salamu alaykum, ${profile.name}. An excellent question. You're asking about showing off in worship, or *Riya*. Think of it like this: if you do a good deed for Allah, it's like planting a strong tree. But Riya is a termite that eats the tree from the inside out, leaving nothing of value. It's a dangerous thing. May this be of benefit, and Allah knows best.

## Scriptural Sources
Text: وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ وَنَقْصٍ مِّنَ الْأَمْوَالِ وَالْأَنفُsِ وَالثَّمَرَاتِ ۗ وَبَشِّرِ الصَّابِرِينَ
Source: The Holy Quran
Reference: Al-Baqarah (2:155)
Author: N/A
---
`;
};

export const buildGeminiHistory = (messages: Message[]): Content[] => {
  const history: Content[] = [];
  for (const msg of messages) {
    const role = msg.sender === MessageSender.User ? 'user' : 'model';
    const parts = [];

    if (msg.sender === MessageSender.User) {
      if (msg.text) parts.push({ text: msg.text });
      if (msg.file) parts.push({ inlineData: { mimeType: msg.file.mimeType, data: msg.file.data } });
    } else {
      parts.push({ text: msg.rawResponseText || '' });
    }

    if (parts.length > 0) {
      history.push({ role, parts });
    }
  }
  return history;
};


export const startChat = (denomination: Denomination, messages: Message[], profile: UserProfile): Chat => {
  const systemInstruction = generateSystemInstruction(denomination, profile);
  const history = buildGeminiHistory(messages);

  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.6,
      tools: profile.enableGoogleSearch ? [{ googleSearch: {} }] : [],
    },
    history: history,
  });
};

export const sendMessageStream = (chat: Chat, query: string, file?: { data: string; mimeType: string; } | null) => {
    const parts: Part[] = [];
    const textPartContent = query || (file ? "Summarize, describe, or analyze the contents of this file." : "");
    
    // FIX: A text part is always required, even if it's empty when a file is present.
    parts.push({ text: textPartContent });
    
    if (file) {
        const imagePart = {
            inlineData: {
                mimeType: file.mimeType,
                data: file.data,
            },
        };
        parts.push(imagePart);
    }

    return chat.sendMessageStream({ message: parts });
};

export const getGenerativeText = async (prompt: string): Promise<string> => {
    try {
        const result: GenerateContentResponse = await withSilentRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2,
                maxOutputTokens: 2048,
                thinkingConfig: { thinkingBudget: 0 }
            },
        }));
        return result.text.trim();
    } catch (error) {
        console.error("Error generating text:", error);
        // Re-throw the error to be handled by the calling function.
        throw error;
    }
};

export const getVerseTafsir = async (surahName: string, ayahNumber: number, ayahText: string): Promise<string> => {
    const prompt = `Provide a brief, scholarly commentary (tafsir) for the Quranic verse "${surahName} ${ayahNumber}" which reads: "${ayahText}".
    Your explanation should be easy to understand for a general audience.
    Focus on:
    1.  The immediate context of the verse.
    2.  The core meaning and key lessons.
    3.  If possible, briefly mention how it is understood in key tafsirs like Tafsir Ibn Kathir or Tafsir al-Jalalayn, but keep it concise.
    Do not add any disclaimers about not being a scholar. Respond directly with the commentary in Markdown format.`;

    try {
        const result: GenerateContentResponse = await withSilentRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5,
            },
        }));
        return result.text.trim();
    } catch (error) {
        console.error("Error generating tafsir:", error);
        throw new Error("Could not fetch tafsir. Please try again.");
    }
};

export const getSurahOverview = async (surahName: string, surahNumber: number): Promise<string> => {
    const prompt = `Provide a concise and informative overview of Surah ${surahName} (Surah #${surahNumber}) of the Holy Qur'an.
    The overview should be in Markdown format and include:
    -   A brief introduction to the Surah's name and its significance.
    -   The main themes and key messages discussed in the Surah.
    -   Its historical context or period of revelation (Makkiyah/Madaniyah) and what that implies.
    -   Any well-known virtues or benefits associated with reciting it, if applicable.
    Keep the tone scholarly yet accessible to a general audience. Do not add any personal disclaimers.`;

    try {
        const result: GenerateContentResponse = await withSilentRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.4,
            },
        }));
        return result.text.trim();
    } catch (error) {
        console.error("Error generating Surah overview:", error);
        throw new Error("Could not fetch Surah overview. Please try again.");
    }
};

export const processFullSurah = async (surah: Surah, mode: 'translate' | 'transliterate', language?: string): Promise<string> => {
    const action = mode === 'translate' ? `Translate the following verses of Surah ${surah.name} into ${language}.` : `Transliterate the following verses of Surah ${surah.name}.`;
    const format = mode === 'translate' ? `Format the output as a single block of text, with each verse on a new line preceded by its verse number in brackets (e.g., "[1] ...", "[2] ...").` : `Format the output as a single block of text, with each verse on a new line preceded by its verse number in brackets.`;
    const versesText = surah.ayahs.map(ayah => `${ayah.number}. ${ayah.text}`).join('\n');
    
    const prompt = `${action} ${format}\n\n${versesText}`;

    try {
        const result: GenerateContentResponse = await withSilentRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.1,
            },
        }));
        return result.text.trim();
    } catch (error) {
        console.error(`Error processing surah for ${mode}:`, error);
        throw new Error(`Could not ${mode} the surah. Please try again.`);
    }
};


export const parseMarkdownResponse = (text: string): GeminiResponse => {
    const response: GeminiResponse = {
        summary: '',
        scripturalResults: [],
        webResults: [],
    };

    const scripturalHeader = '## Scriptural Sources';
    const parts = text.split(scripturalHeader);

    response.summary = parts[0].trim();

    if (parts.length > 1 && parts[1]) {
        const scripturalBlock = parts[1].trim();
        const sources = scripturalBlock.split('---').map(s => s.trim()).filter(Boolean);

        for (const source of sources) {
            const textMatch = source.match(/Text:\s*([\s\S]*?)(?=\nSource:|$)/);
            const sourceMatch = source.match(/Source:\s*(.*)/);
            const referenceMatch = source.match(/Reference:\s*(.*)/);
            const authorMatch = source.match(/Author:\s*(.*)/);
            
            if (textMatch && sourceMatch && referenceMatch && authorMatch) {
                response.scripturalResults.push({
                    text: textMatch[1].trim(),
                    source: {
                        title: sourceMatch[1].trim(),
                        reference: referenceMatch[1].trim(),
                        author: authorMatch[1].trim(),
                    }
                });
            }
        }
    }
    
    return response;
};

export const generateTitle = async (prompt: string, response: string): Promise<string> => {
    try {
        const titlePrompt = `Generate a short, concise, and relevant title (maximum 5 words) for the following conversation snippet. Do not use quotation marks.

        User: "${prompt}"
        AI: "${response}"

        Title:`;
        
        const result: GenerateContentResponse = await withSilentRetry(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: titlePrompt,
            config: {
                temperature: 0.2,
                maxOutputTokens: 20,
                thinkingConfig: { thinkingBudget: 0 }
            },
        }));

        let title = result.text.trim();
        // Clean up any potential quotation marks
        if (title.startsWith('"') && title.endsWith('"')) {
            title = title.substring(1, title.length - 1);
        }
        return title || "Untitled Chat";
    } catch (error) {
        console.error("Error generating title:", error);
        return "New Chat";
    }
};

export const getErrorDiagnosis = async (error: Error): Promise<string> => {
    const prompt = `You are a helpful assistant for a web application called DeenBridge. The app has crashed for a user.
    Analyze the following technical error message and stack trace.
    Your task is to explain the problem to a non-technical user in simple, reassuring language.
    1. Briefly explain what might have gone wrong in simple terms (e.g., "It seems there was a problem loading some data," or "There might be an issue with a recent update.").
    2. Suggest simple, actionable steps the user can take. The primary actions are:
        - "Reloading the page".
        - "Performing a Hot Restart" (which re-downloads the app's code without affecting saved data).
        - If the problem persists, suggest "clearing the browser's site data" for this application as a last resort.
    3. Do not be overly technical. Avoid jargon. The tone should be helpful and empathetic.

    Error Message: ${error.message}
    Stack Trace: ${error.stack}

    Provide a concise explanation and suggestion for the user:`;

    try {
        const result: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.5,
            },
        });
        return result.text.trim();
    } catch (e) {
        console.error("Error getting AI diagnosis:", e);
        throw new Error("Could not connect to the diagnosis service.");
    }
};