import { useLocation } from 'react-router-dom';
import { ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';

export function UnauthorizedPage() {
  const { firebaseUser, logout, refreshProfile } = useAuth();
  const location = useLocation();
  const errorMessage = location.state?.error || 'Tu cuenta de Firebase no tiene un perfil activo ni autorizado en Anima MKT CRM.';

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-8 border border-brand-border rounded-lg shadow-card text-center">
        <div className="w-12 h-12 rounded-full bg-[#B91C1C]/10 text-brand-primary border border-brand-primary/20 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-brand-text-primary tracking-tight mb-2">
          Acceso No Autorizado (403)
        </h2>

        <div className="p-3.5 bg-[#F7F6F2] border border-brand-border rounded-md text-xs text-brand-text-primary mb-5 text-left leading-relaxed">
          <p className="font-semibold text-brand-primary mb-1">Identidad confirmada:</p>
          <p className="font-mono text-[11px] break-all">{firebaseUser?.email || 'Sin usuario activo'}</p>
        </div>

        <p className="text-xs text-brand-text-secondary mb-6 leading-relaxed">
          {errorMessage}
          <span className="block mt-2">
            La creación de cuentas es estrictamente restringida. Contacta al <strong>Super Administrador</strong> de la agencia para que te asigne un rol y empresas autorizadas.
          </span>
        </p>

        <div className="space-y-3">
          <Button
            variant="secondary"
            onClick={() => refreshProfile()}
            className="w-full justify-center text-sm py-2.5"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reintentar Autorización
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
