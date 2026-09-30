// ============================================================
// BUSINESS BHARAT — Error Boundary
// Catches JavaScript errors anywhere in child component tree.
// ============================================================

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false, error: null };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ERROR BOUNDARY] Caught error:', error);
    console.error('[ERROR BOUNDARY] Component stack:', errorInfo.componentStack);
  }

  private resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <this.props.fallback error={this.state.error!} resetErrorBoundary={this.resetErrorBoundary} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0D0916' }}>
          <div className="bg-bg-elevated border border-border-subtle rounded-2xl p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 rounded-full bg-danger/20 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={32} className="text-danger" />
            </div>
            <h2 className="font-display font-bold text-text-primary text-xl mb-2">
              Something went wrong
            </h2>
            <p className="text-text-secondary text-sm mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <pre className="text-left text-xs bg-bg-base rounded-lg p-3 mb-4 overflow-auto max-h-40 text-text-muted">
              {this.state.error?.message ?? 'Unknown error'}
              {this.state.error?.stack && `\n\n${this.state.error.stack}`}
            </pre>
            <div className="flex gap-3 justify-center">
              <Button variant="primary" size="lg" icon={RefreshCw} onClick={this.resetErrorBoundary}>
                Try Again
              </Button>
              <Button variant="ghost" size="lg" icon={Home} onClick={() => window.location.href = '/'}>
                Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }>
): React.FC<P> {
  return function WrappedComponent(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}