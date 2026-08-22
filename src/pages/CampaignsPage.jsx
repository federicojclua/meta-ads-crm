import { Megaphone } from 'lucide-react';
import { EmptyState } from '../components/ui/EmptyState';
import { Badge } from '../components/ui/Badge';

export function CampaignsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Campañas Meta Ads
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            Sincronización de Marketing API, métricas de inversión y checkpoints.
          </p>
        </div>
        <Badge variant="warning" className="text-xs py-1 px-2.5">
          Programado para Etapa 4
        </Badge>
      </div>

      <EmptyState
        icon={Megaphone}
        title="Sin Cuentas Publicitarias Sincronizadas"
        description="La conexión y descarga de métricas aditivas con Meta Marketing API se habilitará en la Etapa 4."
      />
    </div>
  );
}
