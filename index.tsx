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