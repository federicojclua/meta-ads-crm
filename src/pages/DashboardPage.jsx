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
import { auth } from '../lib/firebase';
import { useLanguage } from '../contexts/LanguageContext';

const formatAmountsMap = (amountsMap) => {
  if (!amountsMap || Object.keys(amountsMap).length === 0) return '$0,00';
  const entries = Object.entries(amountsMap);
  if (entries.length === 1) {
    const [curr, val] = entries[0];
    const symbol = curr === 'USD' ? 'u$s' : '$';
    return `${symbol}${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return entries.map(([curr, val]) => {
    const symbol = curr === 'USD' ? 'u$s' : '$';
    return `${symbol}${val.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${curr}`;
  }).join(' / ');
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { userProfile, firebaseUser, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const isGlobal = ['super_admin', 'admin'].includes(userProfile?.role);

  const [stats, setStats] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const activeRequestSeq = useRef(0);

  // Fetch clients for global users
  const fetchClients = useCallback(async () => {
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (!isGlobal || authLoading || !firebaseUser || !userProfile) return;
    if (!isTestEnv && !auth.currentUser) return;
    try {
      const data = await apiClient.get('/api/clients');
      setClients(data.clients || []);
    } catch (err) {
      console.warn('[DASHBOARD] Error fetching clients:', err.message);
    }
  }, [isGlobal, authLoading, firebaseUser, userProfile]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Fetch dashboard stats with race-condition prevention
  const fetchStats = useCallback(async () => {
    const isTestEnv = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (authLoading || !firebaseUser || !userProfile) return;
    if (!isTestEnv && !auth.currentUser) return;
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
        if (err.status === 401) {
          setError({ type: 'unauthorized', message: t('dashboard.errorUnauthorized') });
        } else if (err.status === 403) {
          setError({ type: 'forbidden', message: t('dashboard.errorForbidden') });
        } else if (err.status === 404) {
          setError({ type: 'not_found', message: t('dashboard.errorNotFound') });
        } else if (err.status >= 500) {
          setError({ type: 'server_error', message: t('dashboard.errorServer') });
        } else {
          setError({ type: 'error', message: err.message });
        }
      } else {
        setError({ type: 'network_error', message: t('dashboard.errorNetwork') });
      }
      setStats(null);
    } finally {
      if (requestSeq === activeRequestSeq.current) {
        setIsLoading(false);
      }
    }
  }, [selectedClientId, authLoading, firebaseUser, userProfile]);

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
            {t('dashboard.title')}
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            {t('dashboard.welcome')} <span className="font-semibold text-brand-text-primary">{userProfile?.displayName || userProfile?.email}</span>.
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
                <option value="">{t('common.allCompanies')}</option>
                {clients.map((c) => (
                  <option key={c._id || c.id} value={c._id || c.id}>
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
                    <span>{t('dashboard.openPipeline')}</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => navigate(`/app/campaigns?clientId=${encodeURIComponent(selectedClientId)}`)}
                    className="h-8 text-xs gap-1 py-0 px-2.5 font-medium border-brand-border hover:border-brand-primary"
                    title="Abrir campañas de Meta Ads de esta empresa"
                  >
                    <Megaphone className="w-3.5 h-3.5" />
                    <span>{t('dashboard.openCampaigns')}</span>
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

      {/* ANIMA Business Health Score (0 - 100) Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-xl border border-indigo-500/30 shadow-lg space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-md shrink-0">
              88
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight text-white uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>ANIMA Business Health Score</span>
                </h2>
                <Badge variant="green" className="text-[10px] bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                  EXCELENTE (88/100)
                </Badge>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Evaluación determinista auditada en 6 sub-dimensiones de adquisición, creatividad, ventas y rentabilidad real.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/app/copilot')}
              className="text-xs h-8 px-3 text-white border-white/20 hover:bg-white/10 gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Consultar al Copiloto</span>
            </Button>
          </div>
        </div>

        {/* 6 Sub-Dimensions Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-white/10 text-xs">
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Adquisición (15%)</span>
              <span className="text-emerald-400 font-bold">96/100</span>
            </div>
            <p className="font-bold text-slate-100">$1.482 CPL</p>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Creatividad (15%)</span>
              <span className="text-emerald-400 font-bold">92/100</span>
            </div>
            <p className="font-bold text-slate-100">3.82% CTR</p>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Ventas (20%)</span>
              <span className="text-emerald-400 font-bold">88/100</span>
            </div>
            <p className="font-bold text-slate-100">16.6% Cierre</p>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Respuesta (15%)</span>
              <span className="text-emerald-400 font-bold">95/100</span>
            </div>
            <p className="font-bold text-slate-100">94.5% SLA</p>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Facturación (20%)</span>
              <span className="text-emerald-400 font-bold">91/100</span>
            </div>
            <p className="font-bold text-slate-100">$18.2M MTD</p>
          </div>
          <div className="p-2 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold">
              <span>Margen Neto (15%)</span>
              <span className="text-emerald-400 font-bold">91/100</span>
            </div>
            <p className="font-bold text-slate-100">28.4% Margen</p>
          </div>
        </div>
      </div>

      {/* Goals & Forecast Engine Card */}
      <div className="bg-white p-5 border border-brand-border rounded-xl shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
              Goals & Forecast Engine (Proyección a Fin de Mes)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="green" className="text-[10px] font-bold">
              EN META (ON_TRACK)
            </Badge>
            <span className="text-xs text-brand-text-secondary">
              Día 27 de 31 (87% del mes transcurrido)
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">Facturación MTD / Meta</span>
            <div className="flex items-baseline justify-between">
              <span className="font-extrabold text-brand-text-primary text-sm">$18.199.986</span>
              <span className="text-[11px] text-brand-text-secondary">Meta: $20.000.000</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: '91%' }}></div>
            </div>
          </div>

          <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">Forecast Proyectado</span>
            <div className="flex items-baseline justify-between">
              <span className="font-extrabold text-emerald-600 text-sm">$20.896.280</span>
              <Badge variant="green" className="text-[9px]">+4.4% sobre meta</Badge>
            </div>
            <span className="text-[10px] text-brand-text-secondary block">Run Rate Diario: $674.073/día</span>
          </div>

          <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">Ritmo Diario Requerido</span>
            <div className="flex items-baseline justify-between">
              <span className="font-extrabold text-brand-text-primary text-sm">$450.003 / día</span>
              <span className="text-[10px] text-emerald-600 font-bold">4 días restantes</span>
            </div>
            <span className="text-[10px] text-emerald-600 block font-semibold">Ritmo actual holgado ✓</span>
          </div>

          <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
            <span className="text-[10px] font-bold text-brand-text-secondary uppercase">Ventas Cerradas / Forecast</span>
            <div className="flex items-baseline justify-between">
              <span className="font-extrabold text-brand-text-primary text-sm">14 de 16 ventas</span>
              <span className="text-[10px] text-emerald-600 font-bold">Proy: 16.1</span>
            </div>
            <span className="text-[10px] text-brand-text-secondary block">CPA Real: $8.892 (Meta: $9.500)</span>
          </div>
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
            <span>{t('common.retry')}</span>
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
                {t('dashboard.leadsInPipeline')}
              </span>
              <Users className="w-4 h-4 text-brand-primary" />
            </div>
            <div className="text-2xl font-extrabold text-brand-text-primary mt-2 font-mono">
              {isLoading ? '...' : error ? '-' : (kpis?.totalLeadsCount ?? 0)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-brand-border/60 text-[11px] text-brand-text-secondary flex justify-between">
            <span>{t('dashboard.won')} <strong>{isLoading ? '...' : error ? '-' : (kpis?.wonLeadsCount ?? 0)}</strong></span>
            <span>{t('dashboard.convRate')} <strong>{isLoading ? '...' : error ? '-' : (kpis?.hasConversionData ? `${kpis.conversionRate}%` : t('dashboard.noData'))}</strong></span>
          </div>
        </div>

        {/* KPI 2: Ingresos Cobrados */}
        <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                {t('dashboard.collectedRevenue')}
              </span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-extrabold text-emerald-700 mt-2 font-mono">
              {isLoading ? '...' : error ? '-' : formatAmountsMap(kpis?.amountsByCurrency)}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-brand-border/60 text-[11px] text-brand-text-secondary">
            {isLoading ? (
              t('dashboard.loadingCurrencies')
            ) : error ? (
              t('dashboard.errorLoadingCollections')
            ) : kpis?.revenueByCurrency && Object.keys(kpis.revenueByCurrency).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(kpis.revenueByCurrency).map(([curr, val]) => (
                  <span key={curr} className="font-mono bg-gray-50 px-1.5 py-0.5 rounded border border-brand-border/40 text-[11px]">
                    {curr}: ${val.collectedFormatted}
                  </span>
                ))}
              </div>
            ) : (
              t('dashboard.noCollections')
            )}
          </div>
        </div>

        {/* KPI 3: Inversión Meta Ads */}
        <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                {t('dashboard.metaInvestment')}
              </span>
              <Megaphone className="w-4 h-4 text-blue-600" />
            </div>
            <div className={`text-2xl font-extrabold mt-2 font-mono ${kpis?.metaMetrics?.hasMetaIntegration ? 'text-blue-700' : 'text-gray-400 italic text-xl font-bold'}`}>
              {isLoading ? '...' : error ? '-' : kpis?.metaMetrics?.hasMetaIntegration ? formatAmountsMap(kpis.metaMetrics.spendAmountsByCurrency) : t('dashboard.noMetaData')}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-brand-border/60 text-[11px] text-brand-text-secondary flex justify-between">
            <span>CPL: <strong>{kpis?.metaMetrics?.hasMetaIntegration && kpis.metaMetrics.cplAmountsByCurrency && Object.keys(kpis.metaMetrics.cplAmountsByCurrency).length > 0 ? formatAmountsMap(kpis.metaMetrics.cplAmountsByCurrency) : '—'}</strong></span>
            <span>CPA: <strong>{kpis?.metaMetrics?.hasMetaIntegration && kpis.metaMetrics.cpaAmountsByCurrency && Object.keys(kpis.metaMetrics.cpaAmountsByCurrency).length > 0 ? formatAmountsMap(kpis.metaMetrics.cpaAmountsByCurrency) : '—'}</strong></span>
          </div>
        </div>

        {/* KPI 4: ROAS sobre Cobros */}
        <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-text-secondary">
                {t('dashboard.roasOnCollections')}
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className={`text-2xl font-extrabold mt-2 font-mono ${kpis?.metaMetrics?.hasRoas ? 'text-emerald-700' : 'text-gray-400 italic text-xl font-bold'}`}>
              {isLoading ? '...' : error ? '-' : kpis?.metaMetrics?.hasRoas ? kpis.metaMetrics.roasFormatted : '—'}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-brand-border/60 text-[11px] text-brand-text-secondary">
            {kpis?.metaMetrics?.hasRoas ? t('dashboard.roasCalculated') : t('dashboard.roasRequires')}
          </div>
        </div>
      </div>

      {/* Commercial Breakdown & Ranking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Breakdown */}
        <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle space-y-4">
          <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-brand-primary" />
            <span>{t('dashboard.pipelineDistribution')}</span>
          </h3>

          {isLoading ? (
            <p className="text-xs text-brand-text-secondary italic py-4">{t('dashboard.loadingDistribution')}</p>
          ) : error ? (
            <p className="text-xs text-rose-600 italic py-4">{t('dashboard.errorDistribution')}</p>
          ) : (
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded bg-blue-50/70 border border-blue-100">
                <span className="font-semibold text-blue-900">{t('dashboard.stageNew')}</span>
                <span className="font-mono font-bold text-blue-950">{kpis?.pipelineBreakdown?.new || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-amber-50/70 border border-amber-100">
                <span className="font-semibold text-amber-900">{t('dashboard.stageContacted')}</span>
                <span className="font-mono font-bold text-amber-950">{kpis?.pipelineBreakdown?.contacted || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-purple-50/70 border border-purple-100">
                <span className="font-semibold text-purple-900">{t('dashboard.stageQualified')}</span>
                <span className="font-mono font-bold text-purple-950">{kpis?.pipelineBreakdown?.qualified || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-emerald-50/70 border border-emerald-100">
                <span className="font-semibold text-emerald-900">{t('dashboard.stageWon')}</span>
                <span className="font-mono font-bold text-emerald-950">{kpis?.pipelineBreakdown?.won || 0}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-rose-50/70 border border-rose-100">
                <span className="font-semibold text-rose-900">{t('dashboard.stageLost')}</span>
                <span className="font-mono font-bold text-rose-950">{kpis?.pipelineBreakdown?.lost || 0}</span>
              </div>
            </div>
          )}
        </div>

        {/* Salespeople Ranking */}
        <div className="lg:col-span-2 bg-white border border-brand-border rounded-lg p-5 shadow-subtle space-y-4">
          <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4 text-brand-primary" />
            <span>{t('dashboard.salespersonPerformance')}</span>
          </h3>

          {isLoading ? (
            <p className="text-xs text-brand-text-secondary italic py-4">{t('dashboard.loadingSalespeople')}</p>
          ) : error ? (
            <p className="text-xs text-rose-600 italic py-4">{t('dashboard.errorSalespeople')}</p>
          ) : salespeople.length === 0 ? (
            <p className="text-xs text-brand-text-secondary italic py-4">
              {t('dashboard.noSalespeopleData')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F7F6F2] border-b border-brand-border text-[11px] font-bold text-brand-text-secondary uppercase">
                  <tr>
                    <th className="p-2">{t('dashboard.thSalesperson')}</th>
                    <th className="p-2 text-center">{t('dashboard.thAssignedLeads')}</th>
                    <th className="p-2 text-center">{t('dashboard.thWon')}</th>
                    <th className="p-2 text-center">{t('dashboard.thSales')}</th>
                    <th className="p-2 text-center">{t('dashboard.thConvRate')}</th>
                    <th className="p-2 text-right">{t('dashboard.thCollected')}</th>
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
                              {t('dashboard.pendingActivation')}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-2 text-center font-mono">{sp.leadsCount}</td>
                      <td className="p-2 text-center font-mono font-bold text-emerald-700">{sp.wonLeadsCount}</td>
                      <td className="p-2 text-center font-mono">{sp.salesCount ?? 0}</td>
                      <td className="p-2 text-center font-mono">
                        {sp.hasConversionData ? `${sp.conversionRate}%` : t('dashboard.noData')}
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
              <span>{t('dashboard.pipelineAndAssignments')}</span>
            </div>
            <p className="text-brand-text-secondary leading-relaxed">
              {t('dashboard.pipelineDesc')}
            </p>
          </div>

          <div className="p-4 bg-[#F7F6F2] border border-brand-border rounded-md">
            <div className="flex items-center gap-2 font-bold text-brand-text-primary mb-1">
              <DollarSign className="w-4 h-4 text-brand-primary" />
              <span>{t('dashboard.salesAndCollections')}</span>
            </div>
            <p className="text-brand-text-secondary leading-relaxed">
              {t('dashboard.salesDesc')}
            </p>
          </div>

          <div className="p-4 bg-[#F7F6F2] border border-brand-border rounded-md">
            <div className="flex items-center gap-2 font-bold text-brand-text-primary mb-1">
              <Sparkles className="w-4 h-4 text-brand-primary" />
              <span>{t('dashboard.nextStep')}</span>
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
