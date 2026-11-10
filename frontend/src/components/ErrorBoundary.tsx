/**
 * PURPOSE: Global React ErrorBoundary catching unhandled rendering crashes with diagnostic request ID
 * INPUT: children: ReactNode
 * RETURNS: ReactNode or fallback error UI
 * ERRORS: none
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  requestId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    requestId: null
  };

  public static getDerivedStateFromError(error: Error): State {
    const match = error.message.match(/req-[a-zA-Z0-9_-]+/);
    return { hasError: true, error, requestId: match ? match[0] : null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[UNCAUGHT UI CRASH]', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, requestId: null });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-200">
          <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 bg-rose-950/80 rounded-xl flex items-center justify-center mx-auto text-rose-400 mb-4 border border-rose-800">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Application Error Detected</h2>
            <p className="text-xs text-slate-400 mb-4">
              An unexpected error occurred while rendering this view. You can reload the application to restore operations.
            </p>
            {this.state.requestId && (
              <div className="mb-4 p-2 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-indigo-400">
                Request ID: {this.state.requestId}
              </div>
            )}
            <div className="mb-6 p-2.5 bg-rose-950/30 rounded border border-rose-900/40 text-[11px] text-rose-300 font-mono text-left break-all">
              {this.state.error?.message || 'Unknown render error'}
            </div>
            <button
              onClick={this.handleReset}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

