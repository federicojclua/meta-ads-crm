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
  AlertTriangle,
  LifeBuoy,
  Bot,
  Layers,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  PieChart,
  BarChart3,
  HelpCircle,
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
  const [isQuickstartOpen, setIsQuickstartOpen] = useState(true);

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

      {/* ========================================================================= */}
      {/* 1. BANDEJA OPERATIVA: "Lo que hay para hacer hoy"                         */}
      {/* ========================================================================= */}
      {!isLoading && !error && (
        <div className="bg-white border border-brand-border rounded-xl p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <h2 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-primary" />
                <span>Lo que hay para hacer hoy</span>
              </h2>
            </div>
            <span className="text-[11px] text-brand-text-secondary font-medium">
              Prioridades operativas inmediatas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Alerta 1: Leads sin contactar */}
            <div
              className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
                (kpis?.uncontactedLeadsCount || 0) > 0
                  ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-200'
                  : 'bg-slate-50 border-brand-border'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-950 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                    <span>Prospectos sin contactar</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-extrabold font-mono ${
                    (kpis?.uncontactedLeadsCount || 0) > 0 ? 'bg-rose-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {kpis?.uncontactedLeadsCount || 0}
                  </span>
                </div>
                <p className="text-[11px] text-rose-900 leading-snug">
                  {(kpis?.uncontactedLeadsCount || 0) > 0
                    ? 'Leads nuevos en espera de primer contacto comercial. Atendelos antes de que se enfríen.'
                    : 'Excelente: no hay prospectos pendientes de primer contacto.'}
                </p>
              </div>
              <div className="pt-3">
                <Button
                  size="sm"
                  variant={(kpis?.uncontactedLeadsCount || 0) > 0 ? 'danger' : 'secondary'}
                  onClick={() => navigate('/app/leads?uncontacted=true')}
                  className="w-full text-xs h-8 font-bold justify-center"
                >
                  {(kpis?.uncontactedLeadsCount || 0) > 0 ? 'Atender Leads en Rojo' : 'Ver Embudo de Leads'}
                </Button>
              </div>
            </div>

            {/* Alerta 2: Casos de Posventa y Soporte */}
            <div
              className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
                (kpis?.casesSummary?.open || 0) > 0
                  ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200'
                  : 'bg-slate-50 border-brand-border'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <LifeBuoy className="w-3.5 h-3.5 text-amber-700" />
                    <span>Casos de posventa abiertos</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-extrabold font-mono ${
                    (kpis?.casesSummary?.open || 0) > 0 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {kpis?.casesSummary?.open || 0}
                  </span>
                </div>
                <p className="text-[11px] text-amber-900 leading-snug">
                  {(kpis?.casesSummary?.open || 0) > 0
                    ? `${kpis.casesSummary.open} ticket(s) activos (${kpis.casesSummary.urgentOrHigh || 0} urgentes/altos). Soporte, reposición de rollos o liquidaciones.`
                    : 'No hay tickets de posventa abiertos en este momento.'}
                </p>
              </div>
              <div className="pt-3">
                <Button
                  size="sm"
                  variant={(kpis?.casesSummary?.open || 0) > 0 ? 'primary' : 'secondary'}
                  onClick={() => navigate('/app/cases')}
                  className="w-full text-xs h-8 font-bold justify-center"
                >
                  {(kpis?.casesSummary?.open || 0) > 0 ? 'Gestionar Casos de Posventa' : 'Ver Registro de Casos'}
                </Button>
              </div>
            </div>

            {/* Alerta 3: Consultas de "Lo que no supo" */}
            <div
              className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
                (kpis?.unansweredQueriesCount || 0) > 0
                  ? 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200'
                  : 'bg-slate-50 border-brand-border'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Dudas en 'Lo que no supo'</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-extrabold font-mono ${
                    (kpis?.unansweredQueriesCount || 0) > 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {kpis?.unansweredQueriesCount || 0}
                  </span>
                </div>
                <p className="text-[11px] text-indigo-900 leading-snug">
                  {(kpis?.unansweredQueriesCount || 0) > 0
                    ? 'Consultas reales que el bot derivó a personas. Enseñale la respuesta con 1 clic para que aprenda.'
                    : 'El asistente tiene todas sus dudas resueltas al 100%.'}
                </p>
              </div>
              <div className="pt-3">
                <Button
                  size="sm"
                  variant={(kpis?.unansweredQueriesCount || 0) > 0 ? 'primary' : 'secondary'}
                  onClick={() => navigate('/app/assistant')}
                  className="w-full text-xs h-8 font-bold justify-center"
                >
                  {(kpis?.unansweredQueriesCount || 0) > 0 ? 'Enseñar Respuestas' : 'Configurar Asistente IA'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. PRIMEROS PASOS PARA ARRANCAR (Checklist Onboarding Colapsable)         */}
      {/* ========================================================================= */}
      <div className="bg-[#F7F6F2] border border-brand-border rounded-xl p-4 shadow-subtle space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
              Primeros pasos para arrancar en Grupo Novati
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setIsQuickstartOpen(!isQuickstartOpen)}
            className="text-xs font-semibold text-brand-text-secondary hover:text-brand-text-primary flex items-center gap-1"
          >
            <span>{isQuickstartOpen ? 'Ocultar' : 'Ver primeros pasos'}</span>
            {isQuickstartOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {isQuickstartOpen && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs pt-1">
            <div
              onClick={() => navigate('/app/assistant')}
              className="p-3 bg-white rounded-lg border border-brand-border hover:border-brand-primary cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-text-primary">1. Asistente IA</span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">Paso 1</span>
              </div>
              <p className="text-[11px] text-brand-text-secondary">
                Configurá identidad, zona Tucumán y ofertas Monotributista y Reactivación.
              </p>
              <span className="text-[11px] text-brand-primary font-semibold flex items-center gap-1 pt-1">
                Abrir Asistente <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div
              onClick={() => navigate('/app/assistant')}
              className="p-3 bg-white rounded-lg border border-brand-border hover:border-brand-primary cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-text-primary">2. Simulador y FAQs</span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">Paso 2</span>
              </div>
              <p className="text-[11px] text-brand-text-secondary">
                Probá consultas en tiempo real y gestioná 'Lo que no supo'.
              </p>
              <span className="text-[11px] text-brand-primary font-semibold flex items-center gap-1 pt-1">
                Probar en vivo <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div
              onClick={() => navigate('/app/leads')}
              className="p-3 bg-white rounded-lg border border-brand-border hover:border-brand-primary cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-text-primary">3. Embudo Comercial</span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">Paso 3</span>
              </div>
              <p className="text-[11px] text-brand-text-secondary">
                Revisá el tablero Kanban, asigná vendedores y contactá los leads en rojo.
              </p>
              <span className="text-[11px] text-brand-primary font-semibold flex items-center gap-1 pt-1">
                Ver Embudo <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div
              onClick={() => navigate('/app/cases')}
              className="p-3 bg-white rounded-lg border border-brand-border hover:border-brand-primary cursor-pointer transition-all space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-brand-text-primary">4. Posventa y Casos</span>
                <span className="text-[10px] font-mono text-emerald-600 font-bold">Paso 4</span>
              </div>
              <p className="text-[11px] text-brand-text-secondary">
                Resolvé tickets de rollos, liquidaciones, fallas y bajas con trazabilidad.
              </p>
              <span className="text-[11px] text-brand-primary font-semibold flex items-center gap-1 pt-1">
                Ver Casos <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        )}
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
            <span>
              Sin contactar: <strong className="text-rose-700">{isLoading ? '...' : error ? '-' : (kpis?.uncontactedLeadsCount ?? 0)}</strong>
            </span>
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
      {/* ========================================================================= */}
      {/* 3. EMBUDO COMERCIAL VISUAL & MOTIVOS DE PÉRDIDA ("Por qué se pierden")     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Embudo Comercial Paso a Paso */}
        <div className="lg:col-span-2 bg-white border border-brand-border rounded-xl p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-brand-primary" />
              <span>Embudo Comercial de Conversión (Octubre 2026)</span>
            </h3>
            <span className="text-[11px] text-brand-text-secondary font-medium">
              Tasa de Cierre Global: <strong className="text-emerald-700 font-bold">{kpis?.hasConversionData ? `${kpis.conversionRate}%` : '—'}</strong>
            </span>
          </div>

          {isLoading ? (
            <p className="text-xs text-brand-text-secondary italic py-6 text-center">{t('dashboard.loadingDistribution')}</p>
          ) : error ? (
            <p className="text-xs text-rose-600 italic py-6 text-center">{t('dashboard.errorDistribution')}</p>
          ) : (
            <div className="space-y-4">
              {/* Stepped Funnel Horizontal Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {/* Paso 1: Nuevos */}
                <div className="p-3 rounded-lg border bg-blue-50/70 border-blue-200 space-y-1 relative">
                  <div className="flex justify-between items-center text-[10px] font-bold text-blue-900 uppercase">
                    <span>1. Nuevos</span>
                    <span>100%</span>
                  </div>
                  <div className="text-lg font-black text-blue-950 font-mono">
                    {kpis?.pipelineBreakdown?.new || 0}
                  </div>
                  <span className="text-[10px] text-blue-700 block truncate">
                    {kpis?.uncontactedLeadsCount > 0 ? `🔴 ${kpis.uncontactedLeadsCount} sin contactar` : 'Todos atendidos'}
                  </span>
                </div>

                {/* Paso 2: Contactados */}
                <div className="p-3 rounded-lg border bg-amber-50/70 border-amber-200 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-amber-900 uppercase">
                    <span>2. Contactados</span>
                    <span className="text-amber-800 font-semibold font-mono">
                      {kpis?.totalLeadsCount > 0
                        ? `${Math.round(((kpis.pipelineBreakdown.contacted + kpis.pipelineBreakdown.qualified + kpis.pipelineBreakdown.won) / kpis.totalLeadsCount) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="text-lg font-black text-amber-950 font-mono">
                    {kpis?.pipelineBreakdown?.contacted || 0}
                  </div>
                  <span className="text-[10px] text-amber-800 block truncate">
                    Conversación iniciada
                  </span>
                </div>

                {/* Paso 3: Calificados */}
                <div className="p-3 rounded-lg border bg-purple-50/70 border-purple-200 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-purple-900 uppercase">
                    <span>3. Calificados</span>
                    <span className="text-purple-800 font-semibold font-mono">
                      {kpis?.totalLeadsCount > 0
                        ? `${Math.round(((kpis.pipelineBreakdown.qualified + kpis.pipelineBreakdown.won) / kpis.totalLeadsCount) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                  <div className="text-lg font-black text-purple-950 font-mono">
                    {kpis?.pipelineBreakdown?.qualified || 0}
                  </div>
                  <span className="text-[10px] text-purple-800 block truncate">
                    Tiene monotributo/local
                  </span>
                </div>

                {/* Paso 4: Ganados / Cierres */}
                <div className="p-3 rounded-lg border bg-emerald-50/80 border-emerald-200 space-y-1">
                  <div className="flex justify-between items-center text-[10px] font-bold text-emerald-900 uppercase">
                    <span>4. Ganados</span>
                    <span className="text-emerald-800 font-bold font-mono">
                      {kpis?.hasConversionData ? `${kpis.conversionRate}%` : '0%'}
                    </span>
                  </div>
                  <div className="text-lg font-black text-emerald-950 font-mono">
                    {kpis?.pipelineBreakdown?.won || 0}
                  </div>
                  <span className="text-[10px] text-emerald-800 block truncate">
                    Terminal entregada / Cierre
                  </span>
                </div>
              </div>

              {/* Perdidos Summary Strip */}
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-lg flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                  <span className="font-bold text-rose-950">Prospectos Perdidos en el Embudo:</span>
                  <span className="font-mono font-extrabold text-rose-900">{kpis?.pipelineBreakdown?.lost || 0} leads</span>
                </div>
                <span className="text-[11px] text-rose-800 font-semibold font-mono">
                  {kpis?.totalLeadsCount > 0 ? `${Number(((kpis.pipelineBreakdown.lost / kpis.totalLeadsCount) * 100).toFixed(1))}% de fuga` : '0%'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Motivos de Pérdida: "Por qué se pierden" */}
        <div className="bg-white border border-brand-border rounded-xl p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-600" />
              <span>Por qué se pierden</span>
            </h3>
            <span className="text-[10px] text-brand-text-secondary uppercase font-bold">
              Motivos
            </span>
          </div>

          {isLoading ? (
            <p className="text-xs text-brand-text-secondary italic py-6 text-center">Cargando motivos...</p>
          ) : !kpis?.lostReasonsBreakdown || kpis.lostReasonsBreakdown.length === 0 ? (
            <div className="p-6 text-center text-xs text-brand-text-secondary bg-slate-50 rounded-lg border border-brand-border">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
              <p className="font-medium text-brand-text-primary">Sin prospectos perdidos</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No se registran motivos de fuga en este período.</p>
            </div>
          ) : (
            <div className="space-y-3 text-xs">
              {kpis.lostReasonsBreakdown.map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold text-brand-text-primary truncate max-w-[180px]" title={item.reason}>
                      {item.reason}
                    </span>
                    <span className="font-mono font-bold text-rose-800">
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, item.percentage)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. RENDIMIENTO POR CANAL / ANUNCIO & SALUD DE POSVENTA                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Desglose por Canal / Anuncio */}
        <div className="bg-white border border-brand-border rounded-xl p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-blue-600" />
              <span>Rendimiento por Canal / Anuncio</span>
            </h3>
            <span className="text-[11px] text-brand-text-secondary font-medium">
              Captación
            </span>
          </div>

          {!kpis?.leadsBySource || kpis.leadsBySource.length === 0 ? (
            <p className="text-xs text-brand-text-secondary italic py-6 text-center">
              No hay suficientes datos de canales en este período.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F7F6F2] border-b border-brand-border text-[11px] font-bold text-brand-text-secondary uppercase">
                  <tr>
                    <th className="p-2">Canal / Origen</th>
                    <th className="p-2 text-center">Prospectos</th>
                    <th className="p-2 text-center">Cierres Ganados</th>
                    <th className="p-2 text-right">Tasa Cierre</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border/60">
                  {kpis.leadsBySource.map((s, idx) => (
                    <tr key={idx} className="hover:bg-gray-50/60">
                      <td className="p-2 font-bold text-brand-text-primary uppercase font-mono text-[11px]">
                        {s.source === 'whatsapp' ? '🟢 WhatsApp Bot' : s.source === 'meta_ads' ? '🔵 Meta Ads' : s.source === 'csv' ? '📄 Importación CSV' : '✍️ Manual'}
                      </td>
                      <td className="p-2 text-center font-mono font-bold">{s.count}</td>
                      <td className="p-2 text-center font-mono text-emerald-700 font-bold">{s.wonCount}</td>
                      <td className="p-2 text-right font-mono font-extrabold text-brand-text-primary">
                        {s.conversionRate}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Salud de Posventa y Casos de Soporte */}
        <div className="bg-white border border-brand-border rounded-xl p-5 shadow-subtle space-y-4">
          <div className="flex items-center justify-between border-b border-brand-border pb-3">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-emerald-600" />
              <span>Salud de Posventa y Casos de Soporte</span>
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/app/cases')}
              className="text-xs h-7 px-2.5 gap-1"
            >
              <span>Ver Casos</span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-brand-border space-y-0.5 text-center">
              <span className="text-[10px] text-slate-500 uppercase font-bold">Total</span>
              <p className="font-extrabold text-brand-text-primary font-mono text-base">
                {kpis?.casesSummary?.total || 0}
              </p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 space-y-0.5 text-center">
              <span className="text-[10px] text-amber-800 uppercase font-bold">Abiertos</span>
              <p className="font-extrabold text-amber-950 font-mono text-base">
                {kpis?.casesSummary?.open || 0}
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-200 space-y-0.5 text-center">
              <span className="text-[10px] text-blue-800 uppercase font-bold">En Curso</span>
              <p className="font-extrabold text-blue-950 font-mono text-base">
                {kpis?.casesSummary?.inProgress || 0}
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 space-y-0.5 text-center">
              <span className="text-[10px] text-emerald-800 uppercase font-bold">Resueltos</span>
              <p className="font-extrabold text-emerald-950 font-mono text-base">
                {kpis?.casesSummary?.resolved || 0}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-brand-border/60">
            <span className="text-[10px] uppercase font-bold text-brand-text-secondary block mb-2">
              Distribución por Tipo de Ticket
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div className="p-2 rounded bg-slate-50 border border-brand-border/70">
                <span className="text-slate-500 block truncate">Soporte Técnico</span>
                <span className="font-bold font-mono text-brand-text-primary">{kpis?.casesSummary?.byType?.soporte_tecnico || 0}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-brand-border/70">
                <span className="text-slate-500 block truncate">Insumos / Rollos</span>
                <span className="font-bold font-mono text-brand-text-primary">{kpis?.casesSummary?.byType?.insumos_rollos || 0}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-brand-border/70">
                <span className="text-slate-500 block truncate">Cobros / Liquidac.</span>
                <span className="font-bold font-mono text-brand-text-primary">{kpis?.casesSummary?.byType?.cobros_liquidaciones || 0}</span>
              </div>
              <div className="p-2 rounded bg-slate-50 border border-brand-border/70">
                <span className="text-slate-500 block truncate">Bajas</span>
                <span className="font-bold font-mono text-brand-text-primary">{kpis?.casesSummary?.byType?.bajas || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DESEMPEÑO DEL EQUIPO COMERCIAL (Ranking de Vendedores)                 */}
      {/* ========================================================================= */}
      <div className="bg-white border border-brand-border rounded-xl p-5 shadow-subtle space-y-4">
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
                  <th className="p-2 text-center text-rose-700">🔴 Sin contactar</th>
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
                    <td className="p-2 text-center font-mono font-bold">
                      {(sp.uncontactedCount || 0) > 0 ? (
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px]">
                          {sp.uncontactedCount}
                        </span>
                      ) : (
                        <span className="text-slate-400">0</span>
                      )}
                    </td>
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
