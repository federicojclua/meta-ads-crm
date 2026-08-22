import { Settings } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../hooks/useAuth';

export function SettingsPage() {
  const { userProfile } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Configuración del Sistema
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            Preferencias de cuenta, tablas de conversión de moneda y seguridad.
          </p>
        </div>
        <Badge variant="primary" className="text-xs py-1 px-2.5">
          {userProfile?.role}
        </Badge>
      </div>

      <div className="bg-white p-6 border border-brand-border rounded-lg shadow-subtle mb-6">
        <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider mb-4">
          Perfil Autenticado
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-[#F7F6F2] border border-brand-border rounded">
            <span className="text-brand-text-secondary block font-semibold mb-1">Correo Electrónico:</span>
            <span className="font-mono text-brand-text-primary">{userProfile?.email}</span>
          </div>
          <div className="p-3 bg-[#F7F6F2] border border-brand-border rounded">
            <span className="text-brand-text-secondary block font-semibold mb-1">Rol en MongoDB:</span>
            <span className="font-mono font-bold text-brand-primary">{userProfile?.role}</span>
          </div>
        </div>
      </div>

      <EmptyState
        icon={Settings}
        title="Opciones Avanzadas"
        description="Las opciones avanzadas de multi-moneda, integraciones y webhooks se activarán a medida que avancen las etapas."
      />
    </div>
  );
}
