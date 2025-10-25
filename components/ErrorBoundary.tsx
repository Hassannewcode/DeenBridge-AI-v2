import React from 'react';
import { getErrorDiagnosis } from '../services/geminiService';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  aiDiagnosis: string | null;
  isDiagnosing: boolean;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  // FIX: Replaced constructor with class property for state initialization to resolve `this` context issues.
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    aiDiagnosis: null,
    isDiagnosing: false,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, aiDiagnosis: null, isDiagnosing: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }
  
  // FIX: Converted to an arrow function to automatically bind `this`.
  handleDiagnose = async () => {
    if (!this.state.error) return;
    this.setState({ isDiagnosing: true, aiDiagnosis: null });
    try {
        const diagnosis = await getErrorDiagnosis(this.state.error);
        this.setState({ aiDiagnosis: diagnosis, isDiagnosing: false });
    } catch (e) {
        this.setState({ aiDiagnosis: "Sorry, the AI diagnosis service could not be reached. Please check your internet connection. You can still try reloading the page or performing a 'Hot Restart' to fetch the latest code.", isDiagnosing: false });
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
          height: 'var(--app-height, 100vh)',
          fontFamily: 'sans-serif',
          backgroundColor: 'var(--color-bg, #f8f5f0)',
          color: 'var(--color-text-primary, #1a3a6b)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Something went wrong.</h1>
          <p style={{ marginBottom: '2rem', maxWidth: '500px', color: 'var(--color-text-secondary, #475569)' }}>
            An unexpected error occurred. We're sorry for the inconvenience. Please try one of the recovery options below.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '1rem' }}>
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
              onClick={() => window.location.reload()}
              title="Reloads the app and clears the cache to get the latest code, without affecting your saved data."
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                color: 'white',
                backgroundColor: '#f59e0b',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Hot Restart
            </button>
             <button
              onClick={this.handleDiagnose}
              disabled={this.state.isDiagnosing}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                color: 'white',
                backgroundColor: '#0ea5e9',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                opacity: this.state.isDiagnosing ? 0.7 : 1,
              }}
            >
              {this.state.isDiagnosing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
              {this.state.isDiagnosing ? 'Analyzing...' : 'Diagnose with AI'}
            </button>
          </div>
          
          {(this.state.isDiagnosing || this.state.aiDiagnosis) && (
            <div style={{
                marginTop: '2rem',
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: 'var(--color-card-bg, #ffffff)',
                border: '1px solid var(--color-border, #e2e8f0)',
                maxWidth: '600px',
                width: '100%',
                textAlign: 'left'
            }}>
                <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>AI Diagnosis</h3>
                {this.state.isDiagnosing ? (
                    <p style={{color: 'var(--color-text-secondary, #475569)'}}>Please wait while the AI analyzes the error...</p>
                ) : (
                    <p style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary, #475569)', fontSize: '0.9rem' }}>{this.state.aiDiagnosis}</p>
                )}
            </div>
          )}

          <details style={{ marginTop: '2.5rem', background: 'var(--color-border, #e2e8f0)', padding: '1rem', borderRadius: '8px', maxWidth: '600px', width: '100%', textAlign: 'left' }}>
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
