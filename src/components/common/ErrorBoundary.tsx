import React from 'react';
import { getErrorDiagnosis } from '../../services/geminiService';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  aiDiagnosis: string | null;
  isDiagnosing: boolean;
}

class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      aiDiagnosis: null,
      isDiagnosing: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error, aiDiagnosis: null, isDiagnosing: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

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
          <div