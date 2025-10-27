import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from '../contexts/ThemeContext';
import { DeviceProvider } from '../contexts/DeviceContext';
import registerServiceWorker from './registerServiceWorker';
import ErrorBoundary from '../components/ErrorBoundary';
import { A11yProvider } from '../contexts/A11yContext';
import { PWAInstallProvider } from '../contexts/PWAInstallContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <DeviceProvider>
          <A11yProvider>
            <PWAInstallProvider>
              <App />
            </PWAInstallProvider>
          </A11yProvider>
        </DeviceProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

registerServiceWorker();