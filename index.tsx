import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { DeviceProvider } from './contexts/DeviceContext';
import registerServiceWorker from './registerServiceWorker';
import ErrorBoundary from './components/ErrorBoundary';
import { A11yProvider } from './contexts/A11yContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Dynamically create and inject the web app manifest to make the app installable
const injectManifest = () => {
    // Prevent re-injecting if HMR or other scripts cause re-execution
    if (document.querySelector("link[rel='manifest']")) {
        return;
    }

    const iconSvgTemplate = (size: number) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="24" height="24" rx="4" fill="#1a3a6b"/><g stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17h20"/><path d="M4 17c0-4.4 3.6-8 8-8s8 3.6 8 8"/><path d="M12 5l1.5 3L15 9l-1.5 1.5L12 12l-1.5-1.5L9 9l1.5-1.5L12 5z" fill="none"/></g></svg>`;

    const icon192 = `data:image/svg+xml;base64,${btoa(iconSvgTemplate(192))}`;
    const icon512 = `data:image/svg+xml;base64,${btoa(iconSvgTemplate(512))}`;

    const manifest = {
      "name": "DeenBridge",
      "short_name": "DeenBridge",
      "description": "An AI-powered Islamic reference application that provides verifiable information from pre-vetted sources. DeenBridge acts as a sophisticated digital librarian, not a religious authority, ensuring all information is traceable to its original scholarly context.",
      "start_url": ".",
      "display": "standalone",
      "background_color": "#f8f5f0",
      "theme_color": "#1a3a6b",
      "prefer_related_applications": false,
      "icons": [
        { "src": icon192, "sizes": "192x192", "type": "image/svg+xml" },
        { "src": icon512, "sizes": "512x512", "type": "image/svg+xml", "purpose": "any maskable" }
      ],
      "shortcuts": [
        {
          "name": "New Chat",
          "short_name": "New",
          "description": "Start a new chat session",
          "url": "/?action=new-chat",
          "icons": [{ "src": icon192, "sizes": "192x192" }]
        },
        {
          "name": "Read Quran",
          "short_name": "Quran",
          "description": "Open the Quran reader",
          "url": "/?action=read-quran",
          "icons": [{ "src": icon192, "sizes": "192x192" }]
        }
      ]
    };

    const manifestString = JSON.stringify(manifest);
    const blob = new Blob([manifestString], { type: 'application/json' });
    const manifestURL = URL.createObjectURL(blob);
    
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestURL;
    document.head.appendChild(link);
};

injectManifest();

// --- Mobile Viewport Height Fix ---
// This ensures the app's height is correct even when mobile browser UI (like the keyboard) appears.
const setAppHeight = () => {
    document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
};
window.addEventListener('resize', setAppHeight);
setAppHeight(); // Set initial height


const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <DeviceProvider>
          <A11yProvider>
            <App />
          </A11yProvider>
        </DeviceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

registerServiceWorker();