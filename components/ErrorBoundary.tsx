import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReset = () => {
    console.warn("Clearing local storage and reloading...");
    try {
      localStorage.clear();
      window.location.reload();
    } catch (e) {
      console.error("Failed to clear local storage:", e);
      alert("Could not reset application state. Please try clearing your browser cache manually.");
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          // FIX: Removed duplicate 'height' property from style object.
          height: 'var(--app-height, 100vh)',
          fontFamily: 'sans-serif',
          backgroundColor: 'var(--color-bg, #f8f5f0)',
          color: 'var(--color-text-primary, #1a3a6b)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong.</h1>
          <p style={{ marginBottom: '2rem', maxWidth: '400px', color: 'var(--color-text-secondary, #475569)' }}>An unexpected error occurred. You can try reloading the page or resetting the application to fix the issue.</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                color: 'white',
                backgroundColor: '#1a3a6b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                color: 'white',
                backgroundColor: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Reset App
            </button>
          </div>
          <details style={{ marginTop: '2.5rem', background: 'var(--color-border, #e2e8f0)', padding: '1rem', borderRadius: '8px', maxWidth: '90vw', textAlign: 'left' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>Error Details</summary>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: '200px', overflowY: 'auto', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--color-text-secondary, #475569)' }}>
              {this.state.error?.toString()}
              {"\n\n"}
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
