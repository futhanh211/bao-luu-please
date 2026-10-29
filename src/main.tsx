import React, { Component, ErrorInfo, ReactNode } from 'react';
import ReactDOM from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/m4-kit.css';
import './styles/m4.css';
import './styles/m4-principal.css';
import './styles/m5-control.css';
import './styles/m5.css';
import './styles/m5-report.css';
import './styles/m5-report-steps.css';
import './styles/m6-ai.css';
import './styles/m7-asis.css';
import './styles/m8-polish.css';
import './styles/portal-result.css';
import App from './App';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: 24,
            color: 'var(--paper)',
            backgroundColor: 'var(--desk-900)',
            fontFamily: 'var(--font-paper)',
            textAlign: 'center',
          }}
        >
          <h2 style={{ color: 'var(--stamp-red)', fontSize: 24, marginBottom: 12 }}>
            ⚠️ ĐÃ XẢY RA LỖI GIAO DIỆN
          </h2>
          <p style={{ maxWidth: 600, color: 'var(--paper-dim)', marginBottom: 20 }}>
            {this.state.error?.message || 'Lỗi không xác định.'}
          </p>
          <button
            onClick={() => {
              window.location.href = '/';
            }}
            style={{
              padding: '10px 24px',
              backgroundColor: 'var(--amber)',
              color: 'var(--ink)',
              fontWeight: 'bold',
              borderRadius: 2,
              cursor: 'var(--cursor-pointer)',
            }}
          >
            ← Tải lại trang chính
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
