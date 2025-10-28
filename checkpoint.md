# Checkpoint: Major Architectural Refactor & Branding Unification

This checkpoint marks a significant architectural refactor and a series of feature enhancements to improve maintainability, user experience, and stability. The entire frontend codebase has been reorganized into a more logical and scalable directory structure under `src/`, and the brand identity has been unified around a new, elegant mosque logo.

## 1. Project-wide Code Refactoring

The entire frontend codebase has been reorganized into a more logical and scalable directory structure under `src/`. This improves code organization, component discoverability, and maintainability.

The new structure is as follows:
-   `/src/components`: All React components, now categorized into subdirectories (`chat`, `common`, `onboarding`, `quran`, `settings`).
-   `/src/contexts`: All React Context providers.
-   `/src/hooks`: All custom React hooks.
-   `/src/services`: Modules for interacting with external APIs (Gemini, TTS).
-   `/src/data`: Static data, locales, and content.
-   `/src/lib`: General utility libraries (focus traps, haptics).
-   `/src/utils`: Specific utility functions (audio processing, parsers).

All import paths across the application have been updated to reflect these changes, resolving previous module resolution errors and improving build stability.

## 2. Branding & UI Unification

-   **New Mosque Logo:** The previous "bridge" logo has been completely replaced across the entire application with a new, elegant mosque design. This includes the main PWA icon, the monochrome icon for notifications, the animated splash screen, and all instances of the logo within the app UI.
-   **UI Shape Consistency:** Inconsistent container shapes for the logo (circles, sharp squares) have been standardized to a modern, soft-cornered rounded square (`rounded-2xl`). This creates a cohesive "squircle" aesthetic that matches the main app icon and enhances the overall professional look.
-   **Redesigned Splash Screen:** The animated splash screen has been updated to use the new mosque logo, with a vertical layout to match user-provided designs for a cleaner launch experience.

## 3. Feature Enhancements & Bug Fixes

-   **Google Account Linking:** Users can now link their Google Account in Settings to sync their name and avatar, streamlining the profile setup process.
-   **PWA Installability:** A dedicated "Install App" button has been added to the settings menu. It is context-aware, showing an install prompt on compatible browsers and providing user-friendly instructions for iOS.
-   **Arabic Dialect Selection:** A new setting allows users to choose a preferred Arabic dialect, which instructs the AI to adapt its tone and vocabulary for more natural conversations in Arabic.
-   **UI Font Customization:** Added a setting to switch between Default (Inter), Serif (Amiri), and System UI fonts for personalized readability.
-   **Stability & Bug Fixes:**
    -   A critical bug in the `ErrorBoundary` was fixed to ensure correct state initialization and prevent app crashes.
    -   Numerous minor bugs, including missing component imports (`ChevronDownIcon`, `CopyIcon`, etc.), incorrect type definitions, and flawed hook dependencies were resolved during the refactoring process.
