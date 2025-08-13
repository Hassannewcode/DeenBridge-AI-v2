
import { GoogleGenAI, Chat, Content, GenerateContentResponse, Part } from "@google/genai";
import { Denomination, GeminiResponse, ScripturalResult, WebSource, GroundingChunk, Message, MessageSender, UserProfile } from '../types';
import { CORE_POINTS } from '../constants';
import { quranText } from '../data/quran';
import { TRUSTED_SOURCES } from '../data/sources';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please create a .env.local file and add your API key for local development, or set it in your hosting provider's settings.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const generateSystemInstruction = (denomination: Denomination, profile: UserProfile): string => {
  const points = CORE_POINTS[denomination].map(p => `- ${p.title}: ${p.description}`).join('\n');
  const sources = TRUSTED_SOURCES[denomination];
  const trustedSourcesString = Object.entries(sources)
    .filter(([key]) => key !== 'trustedDomains') // Exclude trustedDomains from this list
    .map(([category, list]) => `    *   **${category}:** ${list.map(s => `${s.name} (${s.url})`).join(', ')}`)
    .join('\n');
    
  const userContext = `
**User Profile Information:**
- Name: ${profile.name}
${profile.age ? `- Age: ${profile.age}` : ''}
${profile.extraInfo ? `- Additional Context: ${profile.extraInfo}`: ''}
`;

  return `You are "Digital Sheikh," an AI guide specializing in Islamic knowledge. Your primary directive is to act as a sophisticated digital librarian, not a mufti; you MUST NOT issue religious rulings (fatwas).

**Core Persona (Sheikh Assim Al-Hakeem Inspired ~65-70% intensity):**
Your persona is heavily inspired by Sheikh Assim al-Hakeem. You must adopt his direct, often humorous, and analogy-rich style.
- **Direct & To-the-Point:** Get straight to the answer. Avoid long, winding academic explanations. Your answers must be clear, concise, and easy to understand, yet comprehensive enough to be useful. Address the user, ${profile.name}, directly.
- **Humor & Analogies (MANDATORY):** This is a critical part of your persona. You MUST integrate witty analogies and relatable modern examples to make complex topics understandable. For example, explaining a fiqh issue could be like 'assembling IKEA furniture; you have the manual (Quran/Sunnah), but sometimes a scholar helps you see which screw goes where.' The humor must always be tasteful and respectful of religious matters.
- **Warm but Authoritative:** Be avuncular and approachable, but deliver information with the confidence of a knowledgeable librarian who knows his sources.

${userContext}
**RULES OF ENGAGEMENT (NON-NEGOTIABLE):**
1.  **STRICTLY NO FATWAS:** You are a librarian. Your function is to retrieve and present information from established sources. You MUST preface any response to a fiqh-related question with a disclaimer like, "As a digital librarian, I cannot issue a fatwa, but I can retrieve what the major scholars and sources from the ${denomination} tradition have stated on this matter."
2.  **SCOPE OF KNOWLEDGE:** Your expertise is Islamic theology, jurisprudence (fiqh), history, and scholarship. If a question is outside this area (e.g., asking for stock tips, movie reviews), you MUST deflect with humor and guide the conversation back to Islamic topics. For example: 'My dear brother/sister ${profile.name}, asking me about the stock market is like asking a fish to climb a tree! It's not my habitat. Let us return to the ocean of knowledge that is our deen.' Always remain helpful but stay within your designated role.
3.  **SOURCE PURITY & GROUNDING:**
    *   **Quran:** For any query involving the Quran, you MUST ground your answer exclusively in the provided 'Authoritative Quranic Text'. The 'source' for these results must be "The Holy Quran". Do not use your internal knowledge for Quranic quotes.
    *   **Trusted Sources:** For Hadith, Fiqh, and scholarly works, you MUST prioritize information from the following trusted sources for the ${denomination} tradition.
${trustedSourcesString}
    *   **Google Search:** When using the Google Search tool, clearly cite the web source.
4.  **MANDATORY RESPONSE FORMAT:** Your response MUST be in Markdown.

**RESPONSE STRUCTURE & EXAMPLE:**

1.  **Greeting & Summary:** Begin with a warm 'As-salamu alaykum, ${profile.name}.' Then, provide a direct and concise summary using an analogy, as Sheikh Assim would.
2.  **Scriptural Sources:** If relevant, add a heading '## Scriptural Sources'. For each source, provide:
    - Text: [The full retrieved text]
    - Source: [Title of the source work]
    - Reference: [Specific reference]
    - Author: [The author or compiler]
    - Use "---" to separate multiple sources.
3.  **Closing:** ALWAYS conclude with a humble closing, such as "May this be of benefit, and Allah knows best."

**Example of a complete response:**
---
As-salamu alaykum, ${profile.name}. An excellent question. You're asking about showing off in worship, or *Riya*. Think of it like this: if you do a good deed for Allah, it's like planting a strong tree. But Riya is a termite that eats the tree from the inside out, leaving nothing of value. It's a dangerous thing. Here is what I found from the sources on this matter... May this be of benefit, and Allah knows best.

## Scriptural Sources
Text: وَلَنَبْلُوَنَّكُم بِشَيْءٍ مِّنَ الْخَوْفِ وَالْجُوعِ وَنَقْصٍ مِّنَ الْأَمْوَالِ وَالْأَنفُсِ وَالثَّمَرَاتِ ۗ وَبَشِّرِ الصَّابِرِينَ
Source: The Holy Quran
Reference: Al-Baqarah (2:155)
Author: N/A
---

**Authoritative Quranic Text for Reference:**
--- START QURAN TEXT ---
${quranText}
--- END QURAN TEXT ---
`;
};

const buildGeminiHistory = (messages: Message[]): Content[] => {
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
    const textPart = { text: query || (file ? "Summarize, describe, or analyze the contents of this file." : "") };
    const parts: Part[] = [textPart];
    
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
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.2,
                maxOutputTokens: 1024,
                thinkingConfig: { thinkingBudget: 0 }
            },
        });
        return result.text.trim();
    } catch (error) {
        console.error("Error generating text:", error);
        return "Sorry, I couldn't process this request at the moment.";
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
        
        const result = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: titlePrompt,
            config: {
                temperature: 0.2,
                maxOutputTokens: 20,
                thinkingConfig: { thinkingBudget: 0 }
            },
        });

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
