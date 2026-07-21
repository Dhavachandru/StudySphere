import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page render error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 text-xl">!</div>
          <p className="font-medium text-slate-700 dark:text-white/80">This page couldn't render</p>
          <p className="text-sm text-rose-600 dark:text-rose-300 max-w-md">{this.state.error.message}</p>
          <button
            onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="text-sm font-medium text-indigo-500 hover:underline"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
