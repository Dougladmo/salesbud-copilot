import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-surface p-8">
          <div className="bg-white border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
            <span className="text-4xl block mb-4">⚠️</span>
            <h2 className="text-lg font-bold text-navy mb-2">Algo deu errado</h2>
            <p className="text-sm text-text-muted mb-4">
              {this.state.error?.message || 'Erro inesperado na aplicação.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="bg-navy-dark text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent transition-all duration-200 cursor-pointer"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
