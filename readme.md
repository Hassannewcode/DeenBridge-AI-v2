# DeenBridge - Your AI Islamic Digital Librarian

![DeenBridge Banner](https://raw.githubusercontent.com/Hassannewcode/DeenBridge-AI-v2/refs/heads/main/Images/Banner%20Image%20DeenBridge%20(1).png)

**DeenBridge** is an AI-powered Islamic reference application designed to act as a sophisticated digital librarian, not a religious authority. It provides users with verifiable information from pre-vetted, trusted sources within both the Sunni and Shia traditions. With a unique persona-driven AI, customizable themes, and robust PWA support, DeenBridge offers a modern, secure, and personalized research experience.


Webpage: https://deen-bridge-ai-v2.vercel.app/

---

## About The Project

DeenBridge was built to address the need for a reliable, source-driven tool for Islamic inquiry. Unlike general-purpose chatbots, its core mandate is to ground every answer in established, verifiable texts, ensuring all information is traceable to its original scholarly context.

**Key Principles:**

*   **Librarian, Not Mufti:** The AI is explicitly programmed to provide information and summarize scholarly views, but never to issue religious rulings (fatwas). It consistently directs users to consult qualified scholars for personal guidance.
*   **Source Purity:** All scriptural results (Quran & Hadith) are provided in their original Arabic, with on-demand translation and transliteration, preserving the integrity of the source text.
*   **User-Centric Design:** From the onboarding flow that personalizes the AI's tone to the multiple color themes, the experience is designed to be welcoming, accessible, and intuitive.
*   **Privacy First:** DeenBridge operates entirely on the frontend. No user data, profile information, or chat history is ever sent to a backend server. All data is stored securely in the user's local browser storage.

---

## Features

*   **Dual Denomination Support:** Users can select either the Sunni or Shia school of thought to tailor the AI's knowledge base to the most relevant sources.
*   **Persona-Driven AI:** The AI guide is inspired by the direct, humorous, and analogy-rich style of Sheikh Assim al-Hakeem, making complex topics more approachable.
*   **Verifiable Sources:** Every response is grounded in a curated list of trusted Hadith collections, Tafsir, and Fiqh literature. Web search results are clearly marked as trusted or unverified.
*   **On-the-fly Translation & Transliteration:** Scriptural texts can be translated into over 100 languages or transliterated with a single click.
*   **Installable PWA:** DeenBridge is a fully-featured Progressive Web App, installable on desktop and mobile devices for a native-app feel and offline access.
*   **Customizable Themes:** Choose from four beautiful themes (Light, Dark, Majlis, Madinah) to suit your preference.
*   **Personalized Experience:** An onboarding flow captures user details (name, age, context) to tailor the AI's communication style.
*   **Multimedia & Voice Input:** Supports file uploads (images, documents) and includes a voice-to-text feature for hands-free queries.
*   **Secure & Private:** 100% client-side application. Your data stays with you.

---

## Tech Stack

This project is built with a modern, no-build-step frontend stack:

*   **Framework:** [React](https://reactjs.org/) (with Hooks) & [TypeScript](https://www.typescriptlang.org/)
*   **AI Engine:** [Google Gemini API (`gemini-2.5-flash`)](https://ai.google.dev/) via the `@google/genai` SDK
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/) (via CDN)
*   **Modules:** Dynamically imported via [esm.sh](https://esm.sh/)
*   **Markdown:** [Marked](https://marked.js.org/) for parsing and [DOMPurify](https://github.com/cure53/DOMPurify) for security.

---

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

You need a modern web browser that supports ES Modules (e.g., Chrome, Firefox, Edge, Safari).

### Environment Variables

The application requires a Google Gemini API key to function. This key **must** be provided as an environment variable.

1.  Obtain an API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Set the environment variable `API_KEY` in your environment. For a local server, you can do this using a `.env` file.

   Example for a local environment using a `.env` file (requires a server that can load it):
   ```
   API_KEY="YOUR_GEMINI_API_KEY_HERE"
   ```

**Important:** The application code directly uses `process.env.API_KEY`. It is designed this way assuming your environment handles the injection of this variable.

### Running Locally

Since there is no build process, you just need to serve the files from the project's root directory.

1.  Clone the repository:
    ```sh
    git clone https://github.com/your-username/deenbridge.git
    cd deenbridge
    ```
2.  Serve the directory using a simple local server. A great option is the `serve` package:
    ```sh
    npx serve
    ```
3.  Open your browser and navigate to the local URL provided by the server (e.g., `http://localhost:3000`).

---
## Disclaimer

DeenBridge is an AI-powered research and reference tool. It is **not** a qualified Islamic scholar or a replacement for one. It does **not** issue religious rulings (fatwas). For personal religious guidance, it is essential to consult with a qualified local scholar.

---

## License

Distributed under the MIT License. See `LICENSE` for more information.

---

## Acknowledgements

*   **Tanzil Project** for the meticulously verified Quranic text.
*   **Sunnah.com**, **Al-Islam.org**, and other invaluable online resources for Islamic knowledge.
*   The creators of the various open-source libraries that made this project possible.