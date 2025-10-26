# Checkpoint: Major Refactor & Feature Polish

This checkpoint marks a significant architectural refactor and a series of feature enhancements to improve maintainability, user experience, and stability.

## 1. Project Structure Refactoring

The entire frontend codebase has been reorganized into a more logical and scalable directory structure under `src/`. This improves code organization, component discoverability, and maintainability.

The new structure is as follows:
-   `/src/components`: All React components, now categorized into subdirectories (`chat`, `common`, `onboarding`, `quran`, `settings`).
-   `/src/contexts`: All React Context providers.
-   `/src/hooks`: All custom React hooks.
-   `/src/services`: Modules for interacting with external APIs (Gemini, TTS).
-   `/src/data`: Static data, locales, and content.
-   `/src/lib`: General utility libraries (focus traps, haptics).
-   `/src/utils`: Specific utility functions (audio processing, parsers).

All import paths across the application have been updated to reflect these changes.

## 2. Feature Enhancements

### Live Conversation
-   **Full Gemini Live API Integration:** Re-engineered to use the Gemini Live API for real-time, low-latency voice conversations.
-   **Live Transcription:** A real-time transcript is now displayed in the modal.
-   **User-Configurable Mic Modes:** Added "Toggle" and "Hold-to-Talk" options in Settings.
-   **Dynamic Visualizer:** The UI now provides intuitive visual feedback for connecting, listening, and speaking states.

### PWA & Offline Support
-   **Robust Service Worker:** Fixed the service worker registration path to ensure PWA functionality (installability, offline access) works reliably across different environments.
-   **iOS Install Instructions:** Added a user-friendly instruction sheet for installing the PWA on iOS devices.
-   **"Install App" Button:** The button to install the PWA is now context-aware and shown on both desktop and iOS where applicable.

### Settings & Personalization
-   **Google Account Linking:** Users can now link their Google Account in Settings to sync their name and avatar.
-   **Arabic Dialect Selection:** A new setting allows users to choose a preferred Arabic dialect, which instructs the AI to adapt its tone and vocabulary for more natural conversations in Arabic.
-   **UI Font Customization:** Added a setting to switch between Default (Inter), Serif (Amiri), and System UI fonts.

## 3. Bug Fixes & Stability
-   **Error Handling:** Improved the Error Boundary component for better stability.
-   **Component Structure:** Corrected various import paths and component hierarchies that were causing issues.
-   **Code Cleanup:** Removed several unused or empty placeholder files.
