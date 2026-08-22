import { Building2 } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

export function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Empresas & Clientes
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            Gestión multi-tenant y configuración de cuentas publicitarias.
          </p>
        </div>
        <Badge variant="warning" className="text-xs py-1 px-2.5">
          Programado para Etapa 2
        </Badge>
      </div>

      <EmptyState
        icon={Building2}
        title="Sin Clientes Registrados"
        description="El módulo de creación de empresas, vinculación de cuentas y asignación de usuarios se implementará en la Etapa 2."
      />
    </div>
  );
}
