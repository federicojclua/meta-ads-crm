import { ServerOff, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export function ServiceUnavailablePage() {
  const { logout, refreshProfile, authError } = useAuth();

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-8 border border-brand-border rounded-lg shadow-card text-center">
        <div className="w-12 h-12 rounded-full bg-[#F4C430]/15 text-[#946800] border border-[#F4C430]/30 flex items-center justify-center mx-auto mb-4">
          <ServerOff className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-brand-text-primary tracking-tight mb-2">
          Servicio No Disponible
        </h2>

        <p className="text-xs text-brand-text-secondary mb-6 leading-relaxed">
          {authError || 'El servicio de verificación de autenticación no está disponible en este momento. Intenta nuevamente en unos instantes.'}
        </p>

        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={() => refreshProfile()}
            className="w-full justify-center text-sm py-2.5"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar Conexión
          </Button>

          <Button
            variant="primary"
            onClick={logout}
            className="w-full justify-center text-sm py-2.5"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  );
}
