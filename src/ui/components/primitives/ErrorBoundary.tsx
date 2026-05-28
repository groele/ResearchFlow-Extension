import React from 'react';
import { t } from '../../../i18n';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center p-6">
          <div className="h-12 w-12 rounded-full bg-error-950 flex items-center justify-center mb-4">
            <span className="text-error-400 text-lg">!</span>
          </div>
          <h3 className="text-sm font-semibold text-slate-200 mb-1">{t('error.somethingWrong')}</h3>
          <p className="text-xs text-slate-500 mb-4 max-w-md">{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-500 transition"
          >
            {t('error.tryAgain')}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
