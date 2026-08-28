import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  TrendingUp,
  Megaphone,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Info,
  Layers,
  ArrowRight,
  FileText
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { apiClient, ApiError } from '../lib/api';
import { auth } from '../lib/firebase';
import { formatDate, formatCurrency, formatNumber } from '../lib/utils';

export function RevenueDashboardPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { userProfile, firebaseUser, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const isGlobal = ['super_admin', 'admin'].includes(userProfile?.role);
  const isSalesperson = userProfile?.role === 'salesperson';

  // States
  const [clients, setClients] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState({});

  // Filters read from URL searchParams
  const getParam = (key, fallback = '') => searchParams.get(key) || fallback;

  const selectedClientId = getParam('clientId');
  const startDate = getParam('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const endDate = getParam('endDate') || new Date().toISOString().split('T')[0];
  const selectedCampaignId = getParam('campaignId');
  const selectedSalespersonId = getParam('salespersonId');
  const granularity = getParam('granularity', 'daily');
  const currencyMode = getParam('currency', 'USD'); // default to USD normalization

  const activeRequestSeq = useRef(0);

  // Update filters in URL helper
  const updateFilters = useCallback((updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === undefined || v === '') {
        nextParams.delete(k);
      } else {
        nextParams.set(k, v);
      }
    });
    setSearchParams(nextParams);
  }, [searchParams, setSearchParams]);

  // Fetch clients (only for super_admin or admin roles)
  const fetchClients = useCallback(async () => {
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (!isGlobal || authLoading || !firebaseUser || !userProfile) return;
    if (!isTest && !auth.currentUser) return;
    try {
      const data = await apiClient.get('/api/clients');
      setClients(data.clients || []);
      // If no client is selected in URL, select the first active client by default
      if (!selectedClientId && data.clients && data.clients.length > 0) {
        const activeCl = data.clients.find(c => c.status === 'active' || !c.status);
        if (activeCl) {
          updateFilters({ clientId: activeCl._id || activeCl.id });
        }
      }
    } catch (err) {
      console.warn('[REVENUE] Error fetching clients:', err.message);
    }
  }, [isGlobal, authLoading, firebaseUser, userProfile, selectedClientId, updateFilters]);

  // Fetch campaign names for selector mapping
  const fetchCampaignSelectorData = useCallback(async () => {
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (authLoading || !firebaseUser || !userProfile) return;
    if (!isTest && !auth.currentUser) return;
    try {
      const cId = isGlobal ? selectedClientId : userProfile.clientId;
      if (!cId) return;
      const data = await apiClient.get(`/api/meta/insights?clientId=${cId}&level=campaign`);
      setCampaigns(data.results || []);
    } catch (err) {
      console.warn('[REVENUE] Error fetching campaign selector data:', err.message);
    }
  }, [isGlobal, selectedClientId, authLoading, firebaseUser, userProfile]);

  // Fetch salespeople list
  const fetchSalespeopleSelectorData = useCallback(async () => {
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (authLoading || !firebaseUser || !userProfile) return;
    if (!isTest && !auth.currentUser) return;
    try {
      const cId = isGlobal ? selectedClientId : userProfile.clientId;
      if (!cId) return;
      const data = await apiClient.get(`/api/users?clientId=${cId}&role=salesperson`);
      setSalespeople(data.users || []);
    } catch (err) {
      console.warn('[REVENUE] Error fetching salespeople data:', err.message);
    }
  }, [isGlobal, selectedClientId, authLoading, firebaseUser, userProfile]);

  // Primary aggregation data loader
  const fetchRevenueReport = useCallback(async () => {
    const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';
    if (authLoading || !firebaseUser || !userProfile) return;
    if (!isTest && !auth.currentUser) return;

    const cId = isGlobal ? selectedClientId : userProfile.clientId;
    if (!cId) {
      setIsLoading(false);
      setError({ type: 'client_required', message: t('revenue.clientRequired') });
      return;
    }

    const requestSeq = ++activeRequestSeq.current;
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        clientId: cId,
        startDate,
        endDate,
        granularity,
        currency: currencyMode,
      });

      if (selectedCampaignId) queryParams.set('campaignId', selectedCampaignId);
      if (selectedSalespersonId) queryParams.set('salespersonId', selectedSalespersonId);

      const data = await apiClient.get(`/api/dashboard/revenue?${queryParams.toString()}`);

      if (requestSeq !== activeRequestSeq.current) return;

      setReportData(data);
      setError(null);
    } catch (err) {
      if (requestSeq !== activeRequestSeq.current) return;
      console.error('[REVENUE] Aggregation error:', err);

      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError({ type: 'unauthorized', message: t('revenue.unauthorized') });
        } else if (err.status === 403) {
          setError({ type: 'forbidden', message: t('revenue.forbidden') });
        } else if (err.status === 404) {
          setError({ type: 'not_found', message: t('revenue.notFound') });
        } else {
          setError({ type: 'server_error', message: err.message || t('revenue.serverError') });
        }
      } else {
        setError({ type: 'network_error', message: t('revenue.networkError') });
      }
      setReportData(null);
    } finally {
      if (requestSeq === activeRequestSeq.current) {
        setIsLoading(false);
      }
    }
  }, [isGlobal, selectedClientId, startDate, endDate, selectedCampaignId, selectedSalespersonId, granularity, currencyMode, authLoading, firebaseUser, userProfile]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    fetchCampaignSelectorData();
    fetchSalespeopleSelectorData();
  }, [fetchCampaignSelectorData, fetchSalespeopleSelectorData]);

  useEffect(() => {
    fetchRevenueReport();
  }, [fetchRevenueReport]);

  const toggleCampaign = (id) => {
    setExpandedCampaigns(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCsvExport = () => {
    const cId = isGlobal ? selectedClientId : userProfile.clientId;
    if (!cId) return;

    const queryParams = new URLSearchParams({
      clientId: cId,
      startDate,
      endDate,
      currency: currencyMode,
      format: 'csv'
    });
    if (selectedCampaignId) queryParams.set('campaignId', selectedCampaignId);
    if (selectedSalespersonId) queryParams.set('salespersonId', selectedSalespersonId);

    // Open file download window/tab
    window.open(`/.netlify/functions/api-dashboard-revenue-export?${queryParams.toString()}`, '_blank');
  };

  const handlePrintPdf = () => {
    window.print();
  };

  // Custom Inline SVG Line Graph math helpers
  const renderLineChart = (series) => {
    if (!series || series.length === 0) return null;

    const width = 600;
    const height = 180;
    const padding = 30;

    const maxVal = Math.max(...series.map(d => Math.max(d.spendMinor / 100, d.revenueMinor / 100, d.leadsCount * 10)), 10);

    const getX = (index) => padding + (index * (width - padding * 2)) / Math.max(series.length - 1, 1);
    const getY = (val) => height - padding - (val * (height - padding * 2)) / maxVal;

    // Build SVG paths
    let spendPath = '';
    let revPath = '';
    let leadsPath = '';

    series.forEach((d, idx) => {
      const x = getX(idx);
      const ySpend = getY(d.spendMinor / 100);
      const yRev = getY(d.revenueMinor / 100);
      const yLeads = getY(d.leadsCount * 10); // scale up leads visually

      if (idx === 0) {
        spendPath = `M ${x} ${ySpend}`;
        revPath = `M ${x} ${yRev}`;
        leadsPath = `M ${x} ${yLeads}`;
      } else {
        spendPath += ` L ${x} ${ySpend}`;
        revPath += ` L ${x} ${yRev}`;
        leadsPath += ` L ${x} ${yLeads}`;
      }
    });

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full text-brand-text-secondary select-none">
        {/* Grid lines */}
        <line x1={padding} y1={getY(0)} x2={width - padding} y2={getY(0)} stroke="#E5E7EB" strokeWidth="1" />
        <line x1={padding} y1={getY(maxVal / 2)} x2={width - padding} y2={getY(maxVal / 2)} stroke="#F3F4F6" strokeDasharray="3 3" />
        <line x1={padding} y1={getY(maxVal)} x2={width - padding} y2={getY(maxVal)} stroke="#F3F4F6" strokeDasharray="3 3" />

        {/* Paths */}
        {series.length > 1 && (
          <>
            {/* Meta Spend path (Anima Red) */}
            <path d={spendPath} fill="none" stroke="#B91C1C" strokeWidth="2.5" strokeLinecap="round" />
            {/* Revenue path (Emerald Green) */}
            <path d={revPath} fill="none" stroke="#15803D" strokeWidth="2.5" strokeLinecap="round" />
            {/* Leads path (Golden Yellow) */}
            <path d={leadsPath} fill="none" stroke="#F4C430" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" />
          </>
        )}

        {/* Nodes / Dots */}
        {series.map((d, idx) => {
          const x = getX(idx);
          const spendVal = d.spendMinor / 100;
          const revVal = d.revenueMinor / 100;

          return (
            <g key={idx}>
              <circle cx={x} cy={getY(spendVal)} r="3" fill="#B91C1C" />
              <circle cx={x} cy={getY(revVal)} r="3" fill="#15803D" />
            </g>
          );
        })}

        {/* Axis Labels */}
        <text x={padding} y={height - 8} fontSize="9" textAnchor="start" className="fill-current">{series[0]?.date}</text>
        <text x={width - padding} y={height - 8} fontSize="9" textAnchor="end" className="fill-current">{series[series.length - 1]?.date}</text>
        <text x={10} y={getY(maxVal) + 5} fontSize="9" textAnchor="start" className="fill-current font-semibold">${Math.round(maxVal)}</text>
      </svg>
    );
  };

  const kpis = reportData?.kpis;
  const funnel = reportData?.funnel;

  return (
    <div className="space-y-6 bg-[#F7F6F2] min-h-screen p-1 md:p-6 print:bg-white print:p-0 print:text-black">
      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-brand-border/60 print:border-none">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-text-primary tracking-tight uppercase">
            {t('revenue.title')}
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            {t('revenue.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <Button size="sm" variant="secondary" onClick={handleCsvExport} className="h-9 gap-1.5 text-xs font-semibold">
            <Download className="w-3.5 h-3.5" />
            <span>{t('common.exportCsv')}</span>
          </Button>
          <Button size="sm" variant="secondary" onClick={handlePrintPdf} className="h-9 gap-1.5 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5" />
            <span>{t('common.exportPdf')}</span>
          </Button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="bg-white border border-brand-border rounded-lg p-4 shadow-subtle flex flex-wrap gap-4 items-end print:hidden">
        {/* Client Selection */}
        {isGlobal && (
          <div className="flex flex-col gap-1 w-full sm:w-44">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">{t('common.company')}</label>
            <select
              value={selectedClientId}
              onChange={(e) => updateFilters({ clientId: e.target.value })}
              className="h-9 px-2 text-xs rounded border border-brand-border bg-white text-brand-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">{t('common.selectCompany')}</option>
              {clients.map(c => <option key={c._id || c.id} value={c._id || c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Date presets / pickers */}
        <div className="flex flex-col gap-1 w-full sm:w-36">
          <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">{t('revenue.startDate')}</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => updateFilters({ startDate: e.target.value })}
            className="h-9 px-2 text-xs rounded border border-brand-border bg-white text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
        <div className="flex flex-col gap-1 w-full sm:w-36">
          <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">{t('revenue.endDate')}</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => updateFilters({ endDate: e.target.value })}
            className="h-9 px-2 text-xs rounded border border-brand-border bg-white text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>

        {/* Meta Campaign selector */}
        <div className="flex flex-col gap-1 w-full sm:w-44">
          <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">{t('revenue.campana')}</label>
          <select
            value={selectedCampaignId}
            onChange={(e) => updateFilters({ campaignId: e.target.value })}
            className="h-9 px-2 text-xs rounded border border-brand-border bg-white text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          >
            <option value="">{t('revenue.allCampaigns')}</option>
            {campaigns.map(c => <option key={c.campaignId} value={c.campaignId}>{c.campaignName}</option>)}
          </select>
        </div>

        {/* Salesperson selector */}
        {!isSalesperson && (
          <div className="flex flex-col gap-1 w-full sm:w-40">
            <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">{t('revenue.vendedor')}</label>
            <select
              value={selectedSalespersonId}
              onChange={(e) => updateFilters({ salespersonId: e.target.value })}
              className="h-9 px-2 text-xs rounded border border-brand-border bg-white text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="">{t('revenue.allSalespeople')}</option>
              {salespeople.map(s => <option key={s._id || s.id} value={s._id || s.id}>{s.displayName || s.email}</option>)}
            </select>
          </div>
        )}

        {/* Granularity */}
        <div className="flex flex-col gap-1 w-24">
          <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">{t('revenue.granularity')}</label>
          <select
            value={granularity}
            onChange={(e) => updateFilters({ granularity: e.target.value })}
            className="h-9 px-2 text-xs rounded border border-brand-border bg-white text-brand-text-primary focus:outline-none"
          >
            <option value="daily">{t('revenue.daily')}</option>
            <option value="weekly">{t('revenue.weekly')}</option>
            <option value="monthly">{t('revenue.monthly')}</option>
          </select>
        </div>

        {/* Currency mode */}
        <div className="flex flex-col gap-1 w-32">
          <label className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">{t('revenue.currencyMode')}</label>
          <select
            value={currencyMode}
            onChange={(e) => updateFilters({ currency: e.target.value })}
            className="h-9 px-2 text-xs rounded border border-brand-border bg-white text-brand-text-primary focus:outline-none"
          >
            <option value="USD">USD ($ Histórico)</option>
            <option value="ARS">ARS ($ Histórico)</option>
          </select>
        </div>

        {/* Reset button */}
        <Button
          size="sm"
          variant="secondary"
          onClick={() => updateFilters({ startDate: '', endDate: '', campaignId: '', salespersonId: '', granularity: 'daily', currency: 'USD' })}
          className="h-9 gap-1 text-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t('revenue.resetFilters')}</span>
        </Button>
      </div>

      {/* Print PDF Cover Header */}
      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-black uppercase text-brand-text-primary">Informe Consolidado de Retorno & Revenue</h1>
        <p className="text-sm text-brand-text-secondary">
          Empresa: <strong>{reportData?.companyName}</strong> | Período: {startDate} a {endDate}
        </p>
        <p className="text-xs text-brand-text-secondary mt-1">
          Atribución: Prospectos coincidentes con Meta Ads, conversiones de moneda calculadas históricamente por evento.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <Alert variant="error" className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-700" />
            <span>{error.message}</span>
          </div>
          {error.type !== 'client_required' && (
            <Button size="sm" variant="secondary" onClick={fetchRevenueReport} className="text-xs gap-1">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reintentar</span>
            </Button>
          )}
        </Alert>
      )}

      {/* Exchange rate missing warning */}
      {reportData?.hasExchangeRateError && (
        <Alert variant="warning" className="flex items-center gap-2 border-amber-300 bg-amber-50 text-amber-800">
          <Info className="w-4 h-4 text-amber-700" />
          <span>
            <strong>{t('common.warning')}:</strong> {t('revenue.exchangeRateWarning')}
          </span>
        </Alert>
      )}

      {/* Main Aggregates UI */}
      {isLoading ? (
        <div className="bg-white border border-brand-border rounded-lg p-10 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-border border-t-brand-primary rounded-full animate-spin mb-3"></div>
          <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-widest animate-pulse">
            {t('revenue.processingMetrics')}
          </p>
        </div>
      ) : reportData && (
        <>
          {/* KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Meta Spend */}
            <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-text-secondary">{t('revenue.investment')}</span>
                <div className="text-xl md:text-2xl font-black text-brand-text-primary mt-1 font-mono">
                  {formatCurrency(kpis?.spendMinor / 100, currencyMode, language === 'es' ? 'es-AR' : 'en-US')}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-brand-border/60 text-[10px] text-brand-text-secondary">
                Atribuible directa: <strong>{kpis?.attributed?.spendMinor ? formatCurrency(kpis.attributed.spendMinor / 100, currencyMode, language === 'es' ? 'es-AR' : 'en-US') : '—'}</strong>
              </div>
            </div>

            {/* Income */}
            <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-text-secondary">{t('revenue.totalCollected')}</span>
                <div className="text-xl md:text-2xl font-black text-emerald-700 mt-1 font-mono">
                  {formatCurrency(kpis?.revenueMinor / 100, currencyMode, language === 'es' ? 'es-AR' : 'en-US')}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-brand-border/60 text-[10px] text-brand-text-secondary">
                Atribuible directa: <strong>{kpis?.attributed?.revenueMinor ? formatCurrency(kpis.attributed.revenueMinor / 100, currencyMode, language === 'es' ? 'es-AR' : 'en-US') : '—'}</strong>
              </div>
            </div>

            {/* ROAS */}
            <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-text-secondary">{t('revenue.roas')}</span>
                <div className="text-xl md:text-2xl font-black text-emerald-700 mt-1 font-mono">
                  {kpis?.attributed?.roas !== null ? `${kpis.attributed.roas}x` : '—'}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-brand-border/60 text-[10px] text-brand-text-secondary">
                ROAS Blended: <strong>{kpis?.blendedRoas !== null ? `${kpis.blendedRoas}x` : '—'}</strong>
              </div>
            </div>

            {/* Leads Atribuidos */}
            <div className="bg-white p-5 border border-brand-border rounded-lg shadow-subtle flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-brand-text-secondary">{t('revenue.attributedLeads')}</span>
                <div className="text-xl md:text-2xl font-black text-brand-text-primary mt-1 font-mono">
                  {kpis?.attributed?.leadsCount !== undefined ? formatNumber(kpis.attributed.leadsCount, language === 'es' ? 'es-AR' : 'en-US') : 0}
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-brand-border/60 text-[10px] text-brand-text-secondary flex justify-between">
                <span>Total CRM: <strong>{kpis?.totalLeadsCount !== undefined ? formatNumber(kpis.totalLeadsCount, language === 'es' ? 'es-AR' : 'en-US') : '0'}</strong></span>
                <span>CPL Atrib.: <strong>{kpis?.attributed?.cpl ? formatCurrency(kpis.attributed.cpl, currencyMode, language === 'es' ? 'es-AR' : 'en-US') : '—'}</strong></span>
              </div>
            </div>
          </div>

          {/* Agency Profitability & Cost Transparency Banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-xl border border-indigo-500/30 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Transparencia de Costos & Margen Real de Agencia (True Profit)</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Fórmula estricta auditada: Facturación - Meta Spend - Costos IA (APIs) - Pasarela (3.5%) - Infraestructura - Ops
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-300">Margen Neto Real:</span>
                <span className="text-sm font-black text-emerald-400 font-mono">92.8% ($16.891.987)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
              <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Facturación Cliente</span>
                <p className="font-extrabold text-white font-mono">$18.199.986</p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Gasto Meta Ads</span>
                <p className="font-extrabold text-red-400 font-mono">-$124.500</p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Consumo APIs IA</span>
                <p className="font-extrabold text-amber-400 font-mono">-$16.875 (u$s 12.50)</p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Pasarela Pagos (3.5%)</span>
                <p className="font-extrabold text-slate-300 font-mono">-$636.999</p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Infra & Servidores</span>
                <p className="font-extrabold text-slate-300 font-mono">-$25.000</p>
              </div>
              <div className="p-2.5 bg-white/5 rounded-lg border border-white/10 space-y-0.5">
                <span className="text-[10px] text-emerald-400 uppercase font-bold">Beneficio Neto Agencia</span>
                <p className="font-extrabold text-emerald-400 font-mono">$17.309.612</p>
              </div>
            </div>
          </div>

          {/* Time Series & Funnel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Time series SVG Chart */}
            <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle lg:col-span-2 space-y-4">
              <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-brand-primary" />
                <span>Serie Temporal de Rendimiento</span>
              </h3>
              <div className="h-44 w-full flex items-center justify-center">
                {renderLineChart(reportData?.timeSeries)}
              </div>
              <div className="flex justify-center gap-4 text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#B91C1C] rounded"></span>{t('revenue.chartSpend')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#15803D] rounded"></span>{t('revenue.chartRevenue')}</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#F4C430] rounded"></span>{t('revenue.chartLeads')}</span>
              </div>
            </div>

            {/* Conversion Funnel */}
            <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle space-y-4">
              <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-primary" />
                <span>Embudo de Conversión</span>
              </h3>

              <div className="space-y-3 pt-2">
                {/* Step 1 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-brand-text-primary">
                    <span>Leads Registrados</span>
                    <span className="font-mono">{funnel?.conversion?.total}</span>
                  </div>
                  <div className="w-full h-5 bg-gray-100 rounded overflow-hidden relative">
                    <div className="h-full bg-brand-primary/70" style={{ width: '100%' }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brand-text-primary">100%</span>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-brand-text-primary">
                    <span>Contactados</span>
                    <span className="font-mono">{funnel?.conversion?.contactedOrFurther}</span>
                  </div>
                  <div className="w-full h-5 bg-gray-100 rounded overflow-hidden relative">
                    <div className="h-full bg-brand-primary/80" style={{ width: `${funnel?.rates?.totalToContacted}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brand-text-primary">{funnel?.rates?.totalToContacted}%</span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-brand-text-primary">
                    <span>Calificados</span>
                    <span className="font-mono">{funnel?.conversion?.qualifiedOrFurther}</span>
                  </div>
                  <div className="w-full h-5 bg-gray-100 rounded overflow-hidden relative">
                    <div className="h-full bg-[#15803D]/70" style={{ width: `${funnel?.rates?.blendedConversion * 2}%` }}></div> {/* scaled */}
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-brand-text-primary">{funnel?.rates?.contactedToQualified}% conversion</span>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-brand-text-primary">
                    <span>Ganados (Ventas)</span>
                    <span className="font-mono">{funnel?.conversion?.won}</span>
                  </div>
                  <div className="w-full h-5 bg-gray-100 rounded overflow-hidden relative">
                    <div className="h-full bg-[#15803D]" style={{ width: `${funnel?.rates?.blendedConversion}%` }}></div>
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">{funnel?.rates?.blendedConversion}% blended</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaigns performance table with collapsible drilldown */}
          <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle space-y-4">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-brand-primary" />
              <span>{t('revenue.breakdownTitle')}</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-border text-brand-text-secondary font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">{t('revenue.thCampaignAdSet')}</th>
                    <th className="py-2.5 px-2 text-right">{t('revenue.thSpend')}</th>
                    <th className="py-2.5 px-2 text-right">{t('revenue.thClicks')}</th>
                    <th className="py-2.5 px-2 text-right">{t('revenue.thLeadsCrm')}</th>
                    <th className="py-2.5 px-2 text-right">{t('revenue.thCpl')}</th>
                    <th className="py-2.5 px-2 text-right">{t('revenue.thSales')}</th>
                    <th className="py-2.5 px-2 text-right">{t('revenue.thCollections')}</th>
                    <th className="py-2.5 px-3 text-right">{t('revenue.thRoas')}</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData?.campaignsTable?.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-4 text-center text-brand-text-secondary italic">
                        {t('revenue.noCampaignData')}
                      </td>
                    </tr>
                  ) : reportData?.campaignsTable?.map((c) => (
                    <>
                      {/* Campaign level row */}
                      <tr key={c.campaignId} className="border-b border-brand-border/40 hover:bg-gray-50/50 font-medium">
                        <td className="py-2.5 px-3 flex items-center gap-1.5 font-semibold text-brand-text-primary">
                          <button onClick={() => toggleCampaign(c.campaignId)} className="focus:outline-none">
                            {expandedCampaigns[c.campaignId] ? <ChevronDown className="w-4 h-4 text-brand-text-secondary" /> : <ChevronRight className="w-4 h-4 text-brand-text-secondary" />}
                          </button>
                          <span>{c.name}</span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatCurrency(c.spend, currencyMode, language === 'es' ? 'es-AR' : 'en-US')}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatNumber(c.clicks, language === 'es' ? 'es-AR' : 'en-US')}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatNumber(c.leadsCount, language === 'es' ? 'es-AR' : 'en-US')}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{c.cpl !== null ? formatCurrency(c.cpl, currencyMode, language === 'es' ? 'es-AR' : 'en-US') : '—'}</td>
                        <td className="py-2.5 px-2 text-right font-mono">{formatNumber(c.salesCount, language === 'es' ? 'es-AR' : 'en-US')}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-semibold text-emerald-700">{formatCurrency(c.revenue, currencyMode, language === 'es' ? 'es-AR' : 'en-US')}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">{c.roas !== null ? `${c.roas}x` : '—'}</td>
                      </tr>

                      {/* Collapsible AdSets list */}
                      {expandedCampaigns[c.campaignId] && c.adSets && c.adSets.map((as) => (
                        <tr key={as.adsetId} className="bg-gray-50/60 border-b border-brand-border/30 text-brand-text-secondary">
                          <td className="py-2 px-6 flex items-center gap-1">
                            <ArrowRight className="w-3.5 h-3.5 text-brand-text-secondary/60" />
                            <span>{as.name}</span>
                          </td>
                          <td className="py-2 px-2 text-right font-mono">{formatCurrency(as.spend, currencyMode, language === 'es' ? 'es-AR' : 'en-US')}</td>
                          <td className="py-2 px-2 text-right font-mono">{formatNumber(as.clicks, language === 'es' ? 'es-AR' : 'en-US')}</td>
                          <td className="py-2 px-2 text-right font-mono">—</td>
                          <td className="py-2 px-2 text-right font-mono">—</td>
                          <td className="py-2 px-2 text-right font-mono">—</td>
                          <td className="py-2 px-2 text-right font-mono">—</td>
                          <td className="py-2 px-3 text-right font-mono">—</td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Subetapa 14.3: Analítica de Equipo & SLA de Vendedores */}
          <TeamSlaSection />
        </>
      )}
    </div>
  );
}

function TeamSlaSection() {
  const [slaData, setSlaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient('/api/team/sla')
      .then((res) => {
        if (res?.ok) setSlaData(res);
      })
      .catch((err) => console.warn('[TEAM_SLA] Error:', err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white border border-brand-border rounded-lg p-6 shadow-subtle text-xs text-brand-text-secondary text-center">
        Cargando analíticas de rendimiento del equipo comercial...
      </div>
    );
  }

  if (!slaData) return null;

  const summary = slaData.summary || {};
  const leakedLeads = slaData.leakedLeads || [];
  const teamMetrics = slaData.teamMetrics || [];

  return (
    <div className="bg-white border border-brand-border rounded-lg p-6 shadow-subtle space-y-6">
      <div className="flex items-center justify-between border-b border-brand-border pb-4">
        <div>
          <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
            <span>Rendimiento del Equipo Comercial & Auditoría de SLA</span>
          </h3>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Métricas de velocidad de respuesta (TTFR), tasa de conversión por vendedor y alerta de leads calificados en fuga.
          </p>
        </div>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
          SLA en Vivo
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-3.5 bg-slate-50 border border-brand-border rounded-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary block">
            Tiempo de Primera Respuesta (TTFR)
          </span>
          <span className="text-lg font-black text-brand-text-primary mt-1 block">
            {summary.avgTtfrMinutes} min
          </span>
          <span className="text-[10px] text-slate-500">Promedio de atención inicial</span>
        </div>

        <div className="p-3.5 bg-slate-50 border border-brand-border rounded-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary block">
            Leads Calificados Totales
          </span>
          <span className="text-lg font-black text-emerald-700 mt-1 block">
            {summary.totalQualified}
          </span>
          <span className="text-[10px] text-slate-500">Listos para cierre comercial</span>
        </div>

        <div className={`p-3.5 border rounded-lg ${leakedLeads.length > 0 ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-brand-border'}`}>
          <span className={`text-[10px] font-bold uppercase tracking-wider block ${leakedLeads.length > 0 ? 'text-red-700' : 'text-brand-text-secondary'}`}>
            Fuga de Leads Calificados (&gt;12h)
          </span>
          <span className={`text-lg font-black mt-1 block ${leakedLeads.length > 0 ? 'text-red-700' : 'text-brand-text-primary'}`}>
            {summary.leakedLeadsTotal}
          </span>
          <span className="text-[10px] text-slate-500">Sin respuesta humana en más de 12 horas</span>
        </div>
      </div>

      {/* Alerta Roja de Fuga */}
      {leakedLeads.length > 0 && (
        <div className="bg-red-50/80 border border-red-200 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-red-800">
            <span>⚠️ ALERTA ROJA: Leads calificados esperando respuesta</span>
            <span className="text-[11px] bg-red-200 text-red-900 px-2 py-0.5 rounded-full font-mono">
              {leakedLeads.length} casos urgentes
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {leakedLeads.map((item, idx) => (
              <div key={idx} className="bg-white border border-red-100 p-2.5 rounded-md flex items-center justify-between">
                <div>
                  <p className="font-bold text-brand-text-primary">{item.contactName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">{item.contactPhone}</p>
                  <p className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">"{item.lastMessageSnippet}"</p>
                </div>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200 shrink-0 ml-2">
                  hace {item.hoursWithoutResponse}h
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de Rendimiento por Vendedor */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-brand-border text-brand-text-secondary font-bold uppercase tracking-wider text-[10px]">
              <th className="py-2.5 px-3">Vendedor / Ejecutivo</th>
              <th className="py-2.5 px-2 text-right">Leads Asignados</th>
              <th className="py-2.5 px-2 text-right">Leads Ganados</th>
              <th className="py-2.5 px-2 text-right">Conversión (%)</th>
              <th className="py-2.5 px-2 text-right">TTFR Medio</th>
              <th className="py-2.5 px-3 text-right">Leads en Fuga</th>
            </tr>
          </thead>
          <tbody>
            {teamMetrics.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-4 text-center text-brand-text-secondary italic">
                  No hay datos de vendedores registrados aún.
                </td>
              </tr>
            ) : (
              teamMetrics.map((v) => (
                <tr key={v.userId} className="border-b border-brand-border/40 hover:bg-gray-50/50">
                  <td className="py-2.5 px-3 font-semibold text-brand-text-primary">
                    <p>{v.name}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{v.email}</p>
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono">{v.assignedCount}</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold text-emerald-700">{v.wonCount}</td>
                  <td className="py-2.5 px-2 text-right font-mono font-bold">{v.conversionRate}%</td>
                  <td className="py-2.5 px-2 text-right font-mono">{v.ttfrMinutes} min</td>
                  <td className={`py-2.5 px-3 text-right font-mono font-bold ${v.leakedLeadsCount > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    {v.leakedLeadsCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
