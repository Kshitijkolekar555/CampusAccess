import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CampusAccess ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '360px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}>
          <div style={{
            maxWidth: '540px',
            width: '100%',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '32px 28px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}>
              <AlertTriangle size={24} />
            </div>

            <h2 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#0f172a',
              margin: '0 0 8px',
              letterSpacing: '-0.01em',
            }}>
              {this.props.fallbackTitle || 'Unable to Load Component'}
            </h2>

            <p style={{
              fontSize: '13.5px',
              color: '#64748b',
              lineHeight: 1.6,
              margin: '0 0 24px',
            }}>
              {this.props.fallbackMessage ||
                'An unexpected rendering issue occurred. Your session and account data are intact. You can try refreshing the view or returning to your dashboard.'}
            </p>

            {this.state.error && (
              <details style={{
                textAlign: 'left',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                marginBottom: '24px',
                fontSize: '12px',
                color: '#475569',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#334155' }}>
                  Technical Details
                </summary>
                <pre style={{
                  marginTop: '8px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: '#dc2626',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <RefreshCw size={14} /> Try Again
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
              >
                <Home size={14} /> Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
