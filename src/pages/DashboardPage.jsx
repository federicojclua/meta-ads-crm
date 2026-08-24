import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  DollarSign,
  TrendingUp,
  Award,
  Sparkles,
  ShieldCheck,
  RotateCcw,
  ExternalLink,
  Megaphone,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { apiClient, ApiError } from '../lib/api';
import { ROLE_LABELS, CURRENT_STAGE } from '../lib/constants';

export function DashboardPage() {
  const navigate = useNavigate();
  const { userProfile, firebaseUser, loading: authLoading } = useAuth();
  const isGlobal = ['super_admin', 'admin'].includes(userProfile?.role);

  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeRequestSeq = useRef(0);

  // Fetch clients for global users
  const fetchClients = useCallback(async () => {
    if (!isGlobal || authLoading || !firebaseUser) return;
    try {
      const data = await apiClient.get('/api/clients');
      setClients(data.clients || []);
    } catch (err) {
      console.warn('[DASHBOARD] Error fetching clients:', err.message);
    }
  }, [isGlobal, authLoading, firebaseUser]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Fetch dashboard stats with race-condition prevention
  const fetchStats = useCallback(async () => {
    if (authLoading || !firebaseUser) return;
    const requestSeq = ++activeRequestSeq.current;

    setIsLoading(true);
    setError(null);
    setStats(null);

    try {
      const q = selectedClientId ? `?clientId=${encodeURIComponent(selectedClientId)}` : '';
      const data = await apiClient.get(`/api/dashboard/stats${q}`);

      // If user changed dropdown before response finished, ignore stale response
      if (requestSeq !== activeRequestSeq.current) return;

      setStats(data);
      setError(null); // Clean previous errors on successful request
    } catch (err) {
      if (requestSeq !== activeRequestSeq.current) return;

      console.error('[DASHBOARD] Error fetching stats:', err);
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setError({ type: 'forbidden', message: 'No tenés permisos para visualizar las estadísticas de esta empresa.' });
        } else if (err.status === 404) {
          setError({ type: 'not_found', message: 'La empresa seleccionada no existe o está inactiva.' });
        } else if (err.status >= 500) {
          setError({ type: 'server_error', message: 'El servicio de analíticas no está disponible temporalmente.' });
        } else {
          setError({ type: 'error', message: err.message });
        }
      } else {
        setError({ type: 'network_error', message: 'Error de red al consultar el panel. Verifique su conexión.' });
      }
      setStats(null);
    } finally {
      if (requestSeq === activeRequestSeq.current) {
        setIsLoading(false);
      }
    }
  }, [selectedClientId, authLoading, firebaseUser]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const kpis = stats?.kpis;
  const salespeople = stats?.salespeoplePerformance || [];

  return (
    <div className="space-y-6">
      {/* Header with Title & Context */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Panel de Control & Rendimiento Comercial
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            Bienvenido, <span className="font-semibold text-brand-text-primary">{userProfile?.displayName || userProfile?.email}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isGlobal && clients.length > 0 && (
            <div className="flex items-center gap-1.5">
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="h-8 px-2 text-xs rounded border border-brand-border bg-white text-brand-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="">Todas las Empresas</option>
                {clients.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>

              {selectedClientId && (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/app/leads?clientId=${encodeURIComponent(selectedClientId)}`)}
                    className="h-8 text-xs gap-1 py-0 px-2.5 font-medium border-brand-border hover:border-brand-primary"
                    title="Abrir pipeline de prospectos de esta empresa"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Abrir Pipeline</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/app/campaigns?clientId=${encodeURIComponent(selectedClientId)}`)}
                    className="h-8 text-xs gap-1 py-0 px-2.5 font-medium border-brand-border hover:border-brand-primary"
                    title="Abrir campañas de Meta Ads de esta empresa"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>Abrir Campañas</span>
                  </Button>
                </>
              )}
            </div>
          )}

          <Badge variant="primary" className="text-xs py-1 px-2.5">
            {ROLE_LABELS[userProfile?.role] || userProfile?.role}
          </Badge>
          <Badge variant="success" className="text-xs py-1 px-2.5">
            {CURRENT_STAGE.LABEL}
          </Badge>
        </div>
      </div>

      {/* Error State Banner */}
      {error && (
        <Alert variant="error" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{error.message}</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchStats}
            className="text-xs gap-1 py-1 ml-4"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </Button>
        </Alert>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Leads Activos */}
        <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                Leads en Pipeline
              </span>
              <Users className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="text-2xl font-extrabold text-brand-text-primary mt-2 font-mono">
              {isLoading ? '...' : error ? '-' : (kpis?.totalLeadsCount ?? 0)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-brand-border/60 text-[11px] text-brand-text-secondary flex justify-between">
            <span>Ganados: <strong>{isLoading ? '...' : error ? '-' : (kpis?.wonLeadsCount ?? 0)}</strong></span>
            <span>Tasa Conv.: <strong>{isLoading ? '...' : error ? '-' : (kpis?.hasConversionData ? `${kpis.conversionRate}%` : 'Sin datos')}</strong></span>
          </div>
        </div>

        {/* KPI 2: Ingresos Cobrados */}
        <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                Ingresos Cobrados
              </span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-2 font-mono">
              {isLoading ? '...' : error ? '-' : `$${kpis?.totalCollectedFormatted || '0,00'}`}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-brand-border/60 text-[11px] text-brand-text-secondary">
            {isLoading ? (
              'Cargando monedas...'
            ) : error ? (
              'Error al cargar cobros'
            ) : kpis?.revenueByCurrency && Object.keys(kpis.revenueByCurrency).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(kpis.revenueByCurrency).map(([curr, val]) => (
                  <span key={curr} className="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-brand-border/40 text-[11px]">
                    {curr}: ${val.collectedFormatted}
                  </span>
                ))}
              </div>
            ) : (
              'Sin cobros registrados'
            )}
          </div>
        </div>

        {/* KPI 3: Inversión Meta Ads */}
        <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                Inversión Meta Ads
              </span>
              <Megaphone className="w-4 h-4 text-blue-600" />
            </div>
            <div className={`text-2xl font-extrabold mt-2 font-mono ${kpis?.metaMetrics?.hasMetaIntegration ? 'text-blue-700' : 'text-gray-400 italic text-xl font-bold'}`}>
              {isLoading ? '...' : error ? '-' : kpis?.metaMetrics?.hasMetaIntegration ? `$${kpis.metaMetrics.adSpendFormatted}` : 'Sin datos de Meta'}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-brand-border/60 text-[11px] text-brand-text-secondary flex justify-between">
            <span>CPL: <strong>{kpis?.metaMetrics?.cplFormatted ? `$${kpis.metaMetrics.cplFormatted}` : '—'}</strong></span>
            <span>CPA: <strong>{kpis?.metaMetrics?.cpaFormatted ? `$${kpis.metaMetrics.cpaFormatted}` : '—'}</strong></span>
          </div>
        </div>

        {/* KPI 4: ROAS sobre Cobros */}
        <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                ROAS sobre Cobros
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className={`text-2xl font-extrabold mt-2 font-mono ${kpis?.metaMetrics?.hasRoas ? 'text-emerald-700' : 'text-gray-400 italic text-xl font-bold'}`}>
              {isLoading ? '...' : error ? '-' : kpis?.metaMetrics?.hasRoas ? kpis.metaMetrics.roasFormatted : 'Sin datos de Meta'}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-brand-border/60 text-[11px] text-brand-text-secondary">
            {kpis?.metaMetrics?.hasRoas ? 'Calculado sobre ingresos cobrados' : 'Requiere inversión e ingresos'}
          </div>
        </div>
      </div>

      {/* Commercial Breakdown & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Breakdown */}
        <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle space-y-4">
          <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-primary" />
            <span>Distribución del Pipeline</span>
          </h3>

          {isLoading ? (
            <p className="text-xs text-brand-text-secondary italic py-4">Cargando distribución...</p>
          ) : error ? (
            <p className="text-xs text-rose-600 italic py-4">No se pudo cargar el desglose.</p>
          ) : (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-blue-50/70 border border-blue-100">
                <span className="font-semibold text-blue-900">1. Nuevos</span>
                <span className="font-mono font-bold text-blue-950">{kpis?.pipelineBreakdown?.new || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-amber-50/70 border border-amber-100">
                <span className="font-semibold text-amber-900">2. Contactados</span>
                <span className="font-mono font-bold text-amber-950">{kpis?.pipelineBreakdown?.contacted || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-purple-50/70 border border-purple-100">
                <span className="font-semibold text-purple-900">3. Calificados</span>
                <span className="font-mono font-bold text-purple-950">{kpis?.pipelineBreakdown?.qualified || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-emerald-50/70 border border-emerald-100">
                <span className="font-semibold text-emerald-900">4. Ganados / Cerrados</span>
                <span className="font-mono font-bold text-emerald-950">{kpis?.pipelineBreakdown?.won || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-rose-50/70 border border-rose-100">
                <span className="font-semibold text-rose-900">5. Perdidos</span>
                <span className="font-mono font-bold text-rose-950">{kpis?.pipelineBreakdown?.lost || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Salespeople Ranking */}
        <div className="lg:col-span-2 bg-white border border-brand-border rounded-lg p-5 shadow-subtle space-y-4">
          <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-primary" />
            <span>Rendimiento por Vendedor</span>
          </h3>

          {isLoading ? (
            <p className="text-xs text-brand-text-secondary italic py-4">Cargando vendedores...</p>
          ) : error ? (
            <p className="text-xs text-rose-600 italic py-4">No se pudo cargar el rendimiento por vendedor.</p>
          ) : salespeople.length === 0 ? (
            <p className="text-xs text-brand-text-secondary italic py-4">
              Sin datos de vendedores para mostrar en este filtro.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F7F6F2] border-b border-brand-border text-[11px] font-bold text-brand-text-secondary uppercase">
                  <tr>
                    <th className="p-2">Vendedor</th>
                    <th className="p-2 text-center">Leads Asignados</th>
                    <th className="p-2 text-center">Ganados</th>
                    <th className="p-2 text-center">Ventas</th>
                    <th className="p-2 text-center">Tasa Conv.</th>
                    <th className="p-2 text-right">Cobrado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {salespeople.map((sp) => (
                    <tr key={sp.id} className="hover:bg-gray-50/60">
                      <td className="p-2 font-semibold text-brand-text-primary">
                        <div className="flex items-center flex-wrap gap-1.5">
                          <span>{sp.displayName || sp.email}</span>
                          {isGlobal && sp.companyName && (
                            <span className="text-[10px] text-gray-500 font-normal">
                              ({sp.companyName})
                            </span>
                          )}
                          {sp.isPendingActivation && (
                            <span className="text-[10px] px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded font-normal">
                              Pendiente activación
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-center font-mono">{sp.leadsCount}</td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-700">{sp.wonLeadsCount}</td>
                      <td className="p-2 text-center font-mono">{sp.salesCount ?? 0}</td>
                      <td className="p-2 text-center font-mono">
                        {sp.hasConversionData ? `${sp.conversionRate}%` : 'Sin datos'}
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-brand-text-primary">
                        {sp.revenueByCurrency && Object.keys(sp.revenueByCurrency).length > 1 ? (
                          <div className="text-[11px] space-y-0.5">
                            {Object.entries(sp.revenueByCurrency).map(([curr, v]) => (
                              <div key={curr}>
                                {curr}: ${v.collectedFormatted}
                              </div>
                            ))}
                          </div>
                        ) : (
                          `$${sp.collectedFormatted}`
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Stage 3 Status Banner */}
      <div className="bg-white border border-brand-border rounded-lg p-6 shadow-subtle">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-md bg-brand-primary text-white flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-brand-text-primary">
              {CURRENT_STAGE.NAME} ({CURRENT_STAGE.LABEL})
            </h2>
            <p className="text-xs text-brand-text-secondary">
              {CURRENT_STAGE.DESCRIPTION}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 bg-[#F7F6F2] border border-brand-border rounded-md">
            <div className="flex items-center gap-2 font-bold text-brand-text-primary mb-1">
              <Users className="w-4 h-4 text-brand-primary" />
              <span>Pipeline & Asignaciones</span>
            </div>
            <p className="text-brand-text-secondary leading-relaxed">
              Tablero Kanban con 5 etapas comerciales, reasignación controlada e importación masiva CSV.
            </p>
          </div>

          <div className="p-4 bg-[#F7F6F2] border border-brand-border rounded-md">
            <div className="flex items-center gap-2 font-bold text-brand-text-primary mb-1">
              <DollarSign className="w-4 h-4 text-brand-primary" />
              <span>Ventas & Cobros en Centavos</span>
            </div>
            <p className="text-brand-text-secondary leading-relaxed">
              Control de montos cobrados parciales y totales por divisa con validación de límites.
            </p>
          </div>

          <div className="p-4 bg-[#F7F6F2] border border-brand-border rounded-md">
            <div className="flex items-center gap-2 font-bold text-brand-text-primary mb-1">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span>Próximo Paso: Etapa 4</span>
            </div>
            <p className="text-brand-text-secondary leading-relaxed">
              {CURRENT_STAGE.NEXT_STAGE_NAME}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
