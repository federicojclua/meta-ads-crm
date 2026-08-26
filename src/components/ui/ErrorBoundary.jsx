import React from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught rendering crash:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#F7F6F2] flex items-center justify-center p-6">
          <div className="bg-white border border-brand-border rounded-lg shadow-subtle p-8 max-w-md w-full text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-brand-primary">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-lg font-black text-brand-text-primary uppercase tracking-wider">
                Ocurrió un error al cargar este módulo.
              </h1>
              <p className="text-xs text-brand-text-secondary leading-relaxed">
                Identificador del incidente: INC-{(Math.random() * 100000).toFixed(0)}
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-gray-50 border border-brand-border rounded text-[11px] font-mono text-brand-primary text-left break-all max-h-32 overflow-y-auto select-all">
                {this.state.error.toString()}
              </div>
            )}

            <div className="pt-2 space-y-2">
              <Button
                variant="primary"
                onClick={this.handleReset}
                className="w-full justify-center gap-2 text-xs"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reintentar</span>
              </Button>
              <Button
                variant="secondary"
                onClick={() => { window.location.href = '/app'; }}
                className="w-full justify-center text-xs bg-gray-100 hover:bg-gray-200 text-brand-text-primary border border-brand-border"
              >
                Volver al Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
