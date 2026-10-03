import { Component, type ErrorInfo, type ReactNode } from 'react';
import { downloadBlob } from '../lib/download';
import { persistence } from '../store/persistence';

interface State {
  error: Error | null;
}

/** Last line of defence: never lose user data to a rendering bug. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled UI error', error, info.componentStack);
  }

  private backup = () => {
    const blob = new Blob([JSON.stringify(persistence.rawDump(), null, 2)], { type: 'application/json' });
    downloadBlob(blob, `resume-creator-recovery-${Date.now()}.json`);
  };

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 p-6">
        <h1 className="text-[22px] font-semibold">Something went wrong</h1>
        <p className="text-[14px] text-muted">
          The app hit an unexpected error. Your résumés are still saved in this browser. Download a copy before reloading if you want to be safe.
        </p>
        <pre className="max-h-40 overflow-auto rounded-lg bg-surface-2 p-3 text-[12px] text-muted">{this.state.error.message}</pre>
        <div className="flex gap-2">
          <button type="button" onClick={this.backup} className="h-9 rounded-lg border border-line-strong px-3.5 text-sm font-medium hover:bg-surface-2">
            Download data
          </button>
          <button type="button" onClick={() => window.location.assign('/')} className="h-9 rounded-lg bg-brand px-3.5 text-sm font-medium text-brand-fg">
            Reload app
          </button>
        </div>
      </main>
    );
  }
}
