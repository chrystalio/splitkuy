// components/ErrorBoundary.tsx
'use client';

import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches any render-time throw inside the bill tree and offers a recovery
 * action (clear localStorage + reload). Without this, a single bad number
 * anywhere in the calculator would white-screen the entire app.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[SplitKuy] Caught render error:', error, info.componentStack);
  }

  reset = () => {
    try {
      localStorage.removeItem('splitkuy_bill_v1');
    } catch {
      // localStorage may be unavailable — proceed with reload anyway
    }
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto max-w-lg px-5 py-12">
        <h1 className="mb-2 text-[22px] font-bold text-slate-900 dark:text-slate-100">
          SplitKuy
        </h1>
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 dark:border-red-800 dark:bg-red-950">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300">
            Something broke while loading the bill.
          </p>
          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
            {this.state.error.message}
          </p>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          Your saved bill will be cleared and a fresh one loaded.
        </p>
        <Button onClick={this.reset} className="mt-4 w-full">
          Reset and reload
        </Button>
      </div>
    );
  }
}
