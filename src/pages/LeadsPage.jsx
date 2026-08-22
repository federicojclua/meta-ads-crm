import { Users } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

export function LeadsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Leads & Pipeline Comercial
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            Tablero Kanban, registro de ventas y seguimiento de ingresos cobrados.
          </p>
        </div>
        <Badge variant="warning" className="text-xs py-1 px-2.5">
          Programado para Etapa 3
        </Badge>
      </div>

      <EmptyState
        icon={Users}
        title="Pipeline en Preparación"
        description="El flujo de captura de prospectos, importación CSV y seguimiento comercial se implementará en la Etapa 3."
      />
    </div>
  );
}
