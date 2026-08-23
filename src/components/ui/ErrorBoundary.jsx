import { Component } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      incidentId: null,
    };
  }

  static getDerivedStateFromError(error) {
    const incidentId = 'inc_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
    return {
      hasError: true,
      error,
      incidentId,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ERROR_BOUNDARY_CATCH]', {
      incidentId: this.state.incidentId,
      errorName: error?.name,
      errorMessage: error?.message,
      componentStack: errorInfo?.componentStack,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      incidentId: null,
    });
  };

  handleGoDashboard = () => {
    this.setState({
      hasError: false,
      error: null,
      incidentId: null,
    });
    window.location.href = '/app';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center bg-white border border-brand-border rounded-lg shadow-subtle my-6 max-w-2xl mx-auto">
          <div className="w-12 h-12 mb-4 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <AlertTriangle className="w-6 h-6" aria-hidden="true" />
          </div>

          <h2 className="text-lg md:text-xl font-extrabold text-brand-text-primary mb-2 tracking-tight">
            Ocurrió un error al cargar este módulo.
          </h2>

          <p className="text-xs md:text-sm text-brand-text-secondary max-w-md mb-4 leading-relaxed">
            Se produjo un error inesperado al renderizar la vista. Podés intentar recargar el módulo o regresar al panel de control.
          </p>

          {this.state.incidentId && (
            <div className="mb-6 px-3 py-1.5 bg-[#F7F6F2] border border-brand-border rounded text-[11px] font-mono text-brand-text-secondary">
              Identificador del incidente: <span className="font-bold text-brand-text-primary">{this.state.incidentId}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={this.handleReset}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={this.handleGoDashboard}
              className="text-xs gap-1.5"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Volver al Dashboard</span>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
