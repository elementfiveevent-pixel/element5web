import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

import { logError } from '@/services/errorLoggingService';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    // Log error to console in development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Log error to database for monitoring
    logError({
      errorType: 'react_error_boundary',
      errorMessage: error.message,
      errorStack: error.stack,
      pageRoute: window.location.pathname,
      componentName: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      metadata: {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      },
    });

    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    // FORCE RELOAD: Clearing state isn't enough for critical failures (e.g. OOM, infinite loops)
    window.location.reload();
  };

  handleGoHome = () => {
    // FORCE NAVIGATION: Router might be broken
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI - USING NATIVE ELEMENTS ONLY
      // z-[9999] ensures it sits on top of everything
      // pointer-events-auto ensures it receives clicks even if an overlay captured them
      return (
        <div
          className="fixed inset-0 z-[9999] bg-white dark:bg-zinc-900 flex items-center justify-center p-6 w-full h-full overflow-y-auto"
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }}
        >
          <div className="max-w-md w-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 rounded-xl p-8 shadow-xl">
            <div className="text-center space-y-6">
              <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>

              <div className="space-y-4">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 m-0">
                  Something went wrong
                </h1>
                <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  We're sorry, but an unexpected error occurred. We've been notified and are looking into it.
                </p>
              </div>

              {this.props.showDetails && this.state.error && (
                <details className="text-left bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4 text-xs overflow-hidden mt-6">
                  <summary className="cursor-pointer text-zinc-500 dark:text-zinc-400 font-medium select-none focus:outline-none focus:ring-2 focus:ring-zinc-400 rounded">
                    Error details
                  </summary>
                  <pre className="mt-3 overflow-auto text-red-600 dark:text-red-400 whitespace-pre-wrap font-mono text-[10px] leading-tight max-h-[200px]">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6 w-full">
                {/* Mobile optimization: Min-height 48px for touch targets */}
                <button
                  onClick={this.handleRetry}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-bold text-sm tracking-wide shadow-[4px_4px_0px_#e4e4e7] dark:shadow-[4px_4px_0px_#27272a] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all outline-none focus:ring-2 focus:ring-zinc-400"
                  type="button"
                >
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </span>
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl border-2 border-yellow-400 bg-yellow-400 text-zinc-900 font-bold text-sm tracking-wide shadow-[4px_4px_0px_#ca8a04] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all outline-none focus:ring-2 focus:ring-yellow-600"
                  type="button"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Home className="w-4 h-4" />
                    Go Home
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Minimal inline error boundary for small sections
interface InlineErrorBoundaryState {
  hasError: boolean;
}

export class InlineErrorBoundary extends Component<{ children: ReactNode; fallbackMessage?: string }, InlineErrorBoundaryState> {
  constructor(props: { children: ReactNode; fallbackMessage?: string }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): InlineErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('InlineErrorBoundary caught:', error, errorInfo);

    // Log error to database
    logError({
      errorType: 'react_inline_error',
      errorMessage: error.message,
      errorStack: error.stack,
      pageRoute: window.location.pathname,
      componentName: errorInfo.componentStack?.split('\n')[1]?.trim() || 'Unknown',
      metadata: {
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 text-center text-muted-foreground text-sm">
          {this.props.fallbackMessage || 'Failed to load this section'}
        </div>
      );
    }
    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallbackMessage?: string
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <InlineErrorBoundary fallbackMessage={fallbackMessage}>
        <WrappedComponent {...props} />
      </InlineErrorBoundary>
    );
  };
}
