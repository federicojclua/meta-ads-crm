import { ShieldCheck, Database, Key, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/ui/Badge';
import { ROLE_LABELS } from '../lib/constants';

export function DashboardPage() {
  const { userProfile } = useAuth();

  const metrics = [
    { label: 'Inversión Activa', value: '$0,00', change: 'Sin campañas activas' },
    { label: 'Leads Capturados', value: '0', change: 'Pipeline inicial' },
    { label: 'Ingresos Cobrados', value: '$0,00', change: 'Sin cobros registrados' },
    { label: 'ROAS Global', value: '0.00x', change: 'Requiere datos de Meta y Ventas' },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Title & Context */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Panel de Inteligencia Comercial
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            Bienvenido, <span className="font-semibold text-brand-text-primary">{userProfile?.displayName || userProfile?.email}</span>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="primary" className="text-xs py-1 px-2.5">
            {ROLE_LABELS[userProfile?.role] || userProfile?.role}
          </Badge>
          <Badge variant="success" className="text-xs py-1 px-2.5">
            Etapa 1 &middot; Activa
          </Badge>
        </div>
      </div>

      {/* KPI Cards / Empty State Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((item) => (
          <div
            key={item.label}
            className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between"
          >
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-text-secondary">
                {item.label}
              </span>
              <div className="text-2xl font-extrabold text-brand-text-primary mt-2 font-mono">
                {item.value}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-brand-border/60 text-[11px] text-brand-text-secondary">
              {item.change}
            </div>
          </div>
        ))}
      </div>

      {/* Stage 1 Foundation Card */}
      <div className="bg-white border border-brand-border rounded-lg p-6 shadow-subtle">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-md bg-brand-primary text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-brand-text-primary">
              Infraestructura Base Conectada con Éxito
            </h2>
            <p className="text-xs text-brand-text-secondary">
              Autenticación Firebase, MongoDB Atlas y Netlify Functions operando correctamente.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-[#F7F6F2] border border-brand-border rounded-md text-xs">
            <div className="flex items-center gap-2 font-bold text-brand-text-primary mb-1">
              <Key className="w-4 h-4 text-brand-primary" />
              <span>Firebase Auth & Tokens</span>
            </div>
            <p className="text-brand-text-secondary leading-relaxed">
              Sesión gestionada mediante token JWT con ciclo de vida verificado y refresco automático.
            </p>
          </div>

          <div className="p-4 bg-[#F7F6F2] border border-brand-border rounded-md text-xs">
            <div className="flex items-center gap-2 font-bold text-brand-text-primary mb-1">
              <Database className="w-4 h-4 text-brand-primary" />
              <span>MongoDB Atlas (`anima_mkt_crm`)</span>
            </div>
            <p className="text-brand-text-secondary leading-relaxed">
              Fuente autoritativa de roles y usuarios. Bootstrap del Super Administrador completado.
            </p>
          </div>

          <div className="p-4 bg-[#F7F6F2] border border-brand-border rounded-md text-xs">
            <div className="flex items-center gap-2 font-bold text-brand-text-primary mb-1">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span>Próximo Paso: Etapa 2</span>
            </div>
            <p className="text-brand-text-secondary leading-relaxed">
              Gestión multi-empresa de clientes, asignación de vendedores e invitaciones por correo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
