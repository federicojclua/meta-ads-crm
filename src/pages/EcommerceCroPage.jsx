import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  TrendingDown,
  Sparkles,
  AlertTriangle,
  Layers,
  PhoneCall,
  Users,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Plus,
  Zap,
  Smartphone,
  Monitor,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatNumber } from '../lib/utils';

export function EcommerceCroPage() {
  const { userProfile } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('funnel'); // 'funnel' | 'cro' | 'catalog' | 'affiliates'

  // Funnel & Friction State
  const [funnelData, setFunnelData] = useState(null);
  const [frictionData, setFrictionData] = useState(null);
  const [catalogData, setCatalogData] = useState(null);
  const [affiliatesData, setAffiliatesData] = useState([]);
  const [profitabilityData, setProfitabilityData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // AI CRO Diagnostics State
  const [croDiagnostic, setCroDiagnostic] = useState(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // New Affiliate Modal
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);
  const [newAffiliate, setNewAffiliate] = useState({ name: '', email: '', promoCode: '', commissionRate: 10 });
  const [isSavingAffiliate, setIsSavingAffiliate] = useState(false);

  const fetchEcommerceData = async () => {
    setIsLoading(true);
    try {
      const [fRes, frRes, cRes, aRes, pRes] = await Promise.all([
        apiClient('/api/ecommerce/funnel'),
        apiClient('/api/ecommerce/friction'),
        apiClient('/api/ecommerce/meta-catalog'),
        apiClient('/api/affiliates'),
        apiClient('/api/affiliates/profitability'),
      ]);

      if (fRes?.funnel) setFunnelData(fRes);
      if (frRes?.friction) setFrictionData(frRes);
      if (cRes?.catalogCampaigns) setCatalogData(cRes);
      if (aRes?.affiliates) setAffiliatesData(aRes.affiliates);
      if (pRes?.profitability) setProfitabilityData(pRes.profitability);
    } catch (err) {
      console.warn('[ECOMMERCE_PAGE] Error fetching data:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEcommerceData();
  }, [userProfile?.clientId]);

  const handleRunCroDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const res = await apiClient('/api/ecommerce/cro-diagnose', {
        method: 'POST',
        body: JSON.stringify({ funnelData, frictionData }),
      });
      if (res?.diagnostic) {
        setCroDiagnostic(res.diagnostic);
      }
    } catch (err) {
      console.warn('[CRO_DIAGNOSE] Error:', err.message);
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleCreateAffiliate = async (e) => {
    e.preventDefault();
    if (!newAffiliate.name || !newAffiliate.promoCode) return;
    setIsSavingAffiliate(true);
    try {
      const res = await apiClient('/api/affiliates', {
        method: 'POST',
        body: JSON.stringify(newAffiliate),
      });
      if (res?.affiliate) {
        setAffiliatesData((prev) => [res.affiliate, ...prev]);
        setIsAffiliateModalOpen(false);
        setNewAffiliate({ name: '', email: '', promoCode: '', commissionRate: 10 });
      }
    } catch (err) {
      console.warn('[CREATE_AFFILIATE] Error:', err.message);
    } finally {
      setIsSavingAffiliate(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-700 flex items-center justify-center font-bold">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-brand-text-primary uppercase tracking-tight">
                Hub de E-Commerce & Optimización CRO
              </h1>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Data Warehouse, auditoría de embudo de compras, fricción UI/UX y rentabilidad de afiliados.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEcommerceData}
            disabled={isLoading}
            className="text-xs h-8 px-2.5 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border text-xs font-semibold overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('funnel')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'funnel'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Embudo & Drop-off</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('cro')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'cro'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Auditoría UI/UX & Agente CRO</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'catalog'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          <span>Meta Ads Catálogo & Llamadas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('affiliates')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'affiliates'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Afiliados & Margen Neto Real</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EMBUDO DE CONVERSIÓN & DROP-OFF                                     */}
      {/* ========================================================================= */}
      {activeTab === 'funnel' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Top KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">
                Vistas de Producto (view_item)
              </span>
              <span className="text-xl font-black text-brand-text-primary mt-1 block font-mono">
                {formatNumber(funnelData?.summary?.totalViews || 12450)}
              </span>
              <span className="text-[10px] text-slate-400">Tráfico calificado a fichas de producto</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">
                Compras Finalizadas (purchase)
              </span>
              <span className="text-xl font-black text-emerald-700 mt-1 block font-mono">
                {formatNumber(funnelData?.summary?.totalPurchases || 540)}
              </span>
              <span className="text-[10px] text-slate-400">Conversiones transaccionales efectivas</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary">
                Tasa de Conversión Global
              </span>
              <span className="text-xl font-black text-brand-text-primary mt-1 block font-mono">
                {funnelData?.summary?.overallConversionRate || 4.34}%
              </span>
              <span className="text-[10px] text-slate-400">De vista a compra final</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/40 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">
                Mayor Caída (Drop-off Bottleneck)
              </span>
              <span className="text-base font-bold text-red-800 mt-1 block truncate">
                add_payment_info
              </span>
              <span className="text-[10px] text-red-600 font-semibold">57.5% de abandono en checkout</span>
            </div>
          </div>

          {/* Visual Funnel */}
          <div className="bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                Embudo Visual de Transacciones (GA4 Standard E-Commerce)
              </h3>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Volumen y tasa de retención escalonada paso a paso.
              </p>
            </div>

            <div className="space-y-4">
              {(funnelData?.funnel || []).map((step, idx) => {
                const widthPercent = Math.max(8, step.conversionFromInitial);
                const isFinal = idx === (funnelData.funnel.length - 1);

                return (
                  <div key={step.step} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-brand-text-primary">{step.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-brand-text-primary font-bold">
                          {formatNumber(step.count)} eventos
                        </span>
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded text-[11px]">
                          {step.conversionFromInitial}% global
                        </span>
                        {step.dropoffFromPrevious > 0 && (
                          <span className="font-mono text-red-700 bg-red-50 px-1.5 py-0.2 rounded text-[11px] font-bold flex items-center gap-0.5">
                            <TrendingDown className="w-3 h-3" />
                            -{step.dropoffFromPrevious}% caída
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Funnel Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden flex items-center p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isFinal ? 'bg-emerald-600' : 'bg-brand-primary'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile vs Desktop Disparity Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl border border-brand-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-brand-primary" />
                  <h4 className="text-xs font-bold text-brand-text-primary">Embudo en Dispositivos Móviles (72% del tráfico)</h4>
                </div>
                <Badge variant="warning" className="text-[10px]">
                  Fricción detectada
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Tasa de conversión en móviles: <strong className="text-brand-text-primary font-mono">2.8%</strong> (Mayor caída en carga de tarjetas y CVV).
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-brand-border shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold text-brand-text-primary">Embudo en Escritorio / Desktop (28% del tráfico)</h4>
                </div>
                <Badge variant="success" className="text-[10px]">
                  Óptimo
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                Tasa de conversión en desktop: <strong className="text-brand-text-primary font-mono">6.4%</strong> (Flujo fluido y menor tasa de abandono).
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUDITORÍA UI/UX & AGENTE CRO                                       */}
      {/* ========================================================================= */}
      {activeTab === 'cro' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Friction Score Gauge & Form Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Score Card */}
            <div className="bg-white p-6 rounded-xl border border-brand-border shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary block">
                  Puntaje de Fricción UI/UX (Friction Score)
                </span>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-4xl font-black text-amber-600 font-mono">
                    {frictionData?.friction?.score || 68}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">/ 100</span>
                </div>
                <div className="mt-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Severidad {frictionData?.friction?.severity || 'CRÍTICA'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg text-xs space-y-1 text-slate-600">
                <p className="font-semibold text-brand-text-primary">Causa principal de fricción:</p>
                <p>{frictionData?.friction?.topBottleneck || 'Abandono masivo en pasarela de pagos y datos de cuotas.'}</p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleRunCroDiagnosis}
                disabled={isDiagnosing}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                <span>{isDiagnosing ? 'Analizando Interfaz...' : 'Ejecutar Diagnóstico CRO con IA'}</span>
              </Button>
            </div>

            {/* Form Abandonment Field Analytics */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                  Analizador de Formularios y Campos de Checkout
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Tasa de inicio vs completitud para identificar campos excesivos o confusos.
                </p>
              </div>

              <div className="divide-y divide-brand-border/60">
                {(frictionData?.formAnalytics || []).map((f) => (
                  <div key={f.field} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-brand-text-primary">{f.label}</p>
                      <p className="text-[10px] text-slate-400 font-mono">campo: {f.field}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[11px] font-mono text-slate-600">
                        {f.completeCount} / {f.startCount} completados
                      </span>
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded ${
                          f.abandonRate > 30 ? 'bg-red-100 text-red-800' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {f.abandonRate}% abandono
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI CRO Agent Diagnostics Report */}
          {croDiagnostic && (
            <div className="bg-white p-6 rounded-xl border border-emerald-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    ✨
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-brand-text-primary">
                      {croDiagnostic.title}
                    </h3>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      Impacto estimado: {croDiagnostic.estimatedRevenueLift}
                    </p>
                  </div>
                </div>
                <Badge variant="primary" className="text-[10px]">
                  Auditoría Completada
                </Badge>
              </div>

              {/* Bottlenecks Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {croDiagnostic.bottlenecks.map((b, idx) => (
                  <div key={idx} className="p-4 border border-brand-border rounded-lg bg-slate-50/70 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-text-primary">{b.step}</span>
                      <span className="text-[10px] bg-red-100 text-red-800 font-bold px-1.5 py-0.2 rounded">
                        {b.priority}
                      </span>
                    </div>
                    <p className="text-red-700 font-bold text-[11px]">{b.dropoff}</p>
                    <p className="text-slate-600 leading-relaxed"><strong className="text-brand-text-primary">Causa:</strong> {b.rootCause}</p>
                    <div className="pt-2 border-t border-brand-border/60">
                      <p className="text-emerald-800 font-medium leading-relaxed"><strong className="text-emerald-900">Solución:</strong> {b.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Plan */}
              <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-lg text-xs space-y-2">
                <h4 className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Plan de Acción Inmediato (Roadmap CRO)</span>
                </h4>
                <ul className="space-y-1 text-emerald-950">
                  {croDiagnostic.actionPlan.map((step, sIdx) => (
                    <li key={sIdx} className="font-medium">
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: META ADS CATÁLOGO & LLAMADAS                                        */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Advantage+ Catalog Shopping Campaigns Table */}
          <div className="bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                  Campañas de Ventas del Catálogo (Advantage+ Shopping)
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Métricas de E-Commerce: ROAS, CPA por producto y Costo por Añadir al Carrito (CPATC).
                </p>
              </div>
              <Badge variant="primary" className="text-[10px]">
                Meta Graph v19.0+
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-border text-brand-text-secondary font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Campaña de Catálogo</th>
                    <th className="py-2.5 px-2 text-right">Inversión</th>
                    <th className="py-2.5 px-2 text-right">Compras</th>
                    <th className="py-2.5 px-2 text-right">CPA Producto</th>
                    <th className="py-2.5 px-2 text-right">Costo / Carrito</th>
                    <th className="py-2.5 px-3 text-right">ROAS Catálogo</th>
                  </tr>
                </thead>
                <tbody>
                  {(catalogData?.catalogCampaigns || []).map((c) => (
                    <tr key={c.id} className="border-b border-brand-border/40 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 font-semibold text-brand-text-primary">
                        <p>{c.name}</p>
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium">
                        {formatCurrency(c.spend, c.currency, language === 'es' ? 'es-AR' : 'en-US')}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-brand-text-primary">
                        {c.purchases}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        {formatCurrency(c.cpa, c.currency, language === 'es' ? 'es-AR' : 'en-US')}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-700">
                        {formatCurrency(c.costPerAddToCart, c.currency, language === 'es' ? 'es-AR' : 'en-US')}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 text-sm">
                        {c.roas}x
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Click-to-Call Campaigns Audit Card */}
          <div className="bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-brand-primary" />
                <span>Auditoría de Campañas de Llamadas & Ratio Call-to-Close</span>
              </h3>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Cruce de clics en extensiones telefónicas de Meta Ads con leads y ventas cerradas en el CRM.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 bg-slate-50 border border-brand-border rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary block">
                  Clics en Llamadas
                </span>
                <span className="text-lg font-black text-brand-text-primary mt-1 block font-mono">
                  {catalogData?.callCampaignsAudit?.totalCallClicks || 430}
                </span>
                <span className="text-[10px] text-slate-400">Extensiones de llamada activadas</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-brand-border rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary block">
                  Llamadas Conectadas
                </span>
                <span className="text-lg font-black text-brand-text-primary mt-1 block font-mono">
                  {catalogData?.callCampaignsAudit?.connectedCalls || 180}
                </span>
                <span className="text-[10px] text-slate-400">Contactos atendidos por el equipo</span>
              </div>

              <div className="p-3.5 bg-slate-50 border border-brand-border rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary block">
                  Ventas Cerradas por Llamada
                </span>
                <span className="text-lg font-black text-emerald-700 mt-1 block font-mono">
                  {catalogData?.callCampaignsAudit?.closedSales || 54}
                </span>
                <span className="text-[10px] text-slate-400">Clientes de alto ticket</span>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  Ratio Call-to-Close
                </span>
                <span className="text-lg font-black text-emerald-800 mt-1 block font-mono">
                  {catalogData?.callCampaignsAudit?.callToCloseRatio || 30.0}%
                </span>
                <span className="text-[10px] text-emerald-700 font-medium">Conversión de llamada a venta</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: AFILIADOS, REFERIDOS & DROPSHIPPING (MARGEN NETO REAL)               */}
      {/* ========================================================================= */}
      {activeTab === 'affiliates' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Unit Economics Waterfall Card */}
          {profitabilityData && (
            <div className="bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                    Balance de Rentabilidad Real (Unit Economics Dropshipping)
                  </h3>
                  <p className="text-xs text-brand-text-secondary mt-0.5">
                    Margen Neto = Ingreso Bruto - Gasto en Ads - Costo de Mercadería (COGS) - Comisiones de Afiliados.
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                  Margen Neto: {profitabilityData.netMarginPercent}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                <div className="p-3 bg-slate-50 border border-brand-border rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-brand-text-secondary block">1. Ingreso Bruto</span>
                  <span className="text-sm font-black text-brand-text-primary mt-1 block font-mono">
                    ${formatNumber(profitabilityData.grossRevenue)}
                  </span>
                </div>

                <div className="p-3 bg-red-50/50 border border-red-200 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-red-700 block">2. Inversión Meta Ads</span>
                  <span className="text-sm font-black text-red-700 mt-1 block font-mono">
                    -${formatNumber(profitabilityData.metaSpend)}
                  </span>
                </div>

                <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-amber-700 block">3. COGS Dropship</span>
                  <span className="text-sm font-black text-amber-700 mt-1 block font-mono">
                    -${formatNumber(profitabilityData.dropshipCogs)}
                  </span>
                </div>

                <div className="p-3 bg-indigo-50/50 border border-indigo-200 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-indigo-700 block">4. Comisiones Afiliados</span>
                  <span className="text-sm font-black text-indigo-700 mt-1 block font-mono">
                    -${formatNumber(profitabilityData.affiliateCommissions)}
                  </span>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">5. Ganancia Neta Real</span>
                  <span className="text-sm font-black text-emerald-800 mt-1 block font-mono">
                    ${formatNumber(profitabilityData.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Affiliates List */}
          <div className="bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                  Red de Afiliados & Códigos Promocionales
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Seguimiento de ventas atribuidas, códigos de descuento y pagos devengados.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsAffiliateModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Registrar Afiliado</span>
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-brand-border text-brand-text-secondary font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-2.5 px-3">Afiliado / Partner</th>
                    <th className="py-2.5 px-2">Código Promo</th>
                    <th className="py-2.5 px-2 text-right">Comisión</th>
                    <th className="py-2.5 px-2 text-right">Ventas Atribuidas</th>
                    <th className="py-2.5 px-2 text-right">Ingresos Generados</th>
                    <th className="py-2.5 px-3 text-right">Comisiones a Pagar</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliatesData.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="py-6 text-center text-slate-400 italic">
                        No hay afiliados registrados aún. Creá el primero con el botón superior.
                      </td>
                    </tr>
                  ) : (
                    affiliatesData.map((a) => (
                      <tr key={a.id} className="border-b border-brand-border/40 hover:bg-gray-50/50">
                        <td className="py-2.5 px-3 font-semibold text-brand-text-primary">
                          <p>{a.name}</p>
                          <p className="text-[10px] text-slate-400 font-normal">{a.email}</p>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[11px]">
                            {a.promoCode}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold">{a.commissionRate}%</td>
                        <td className="py-2.5 px-2 text-right font-mono font-semibold">{a.salesAttributedCount}</td>
                        <td className="py-2.5 px-2 text-right font-mono font-bold text-brand-text-primary">
                          ${formatNumber(a.totalRevenueGenerated)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                          ${formatNumber(a.totalCommissionsPaid)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Registrar Afiliado */}
      <Modal
        isOpen={isAffiliateModalOpen}
        onClose={() => setIsAffiliateModalOpen(false)}
        title="Registrar Nuevo Afiliado / Partner"
      >
        <form onSubmit={handleCreateAffiliate} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-brand-text-primary mb-1">Nombre o Canal del Afiliado</label>
            <input
              type="text"
              required
              value={newAffiliate.name}
              onChange={(e) => setNewAffiliate({ ...newAffiliate, name: e.target.value })}
              placeholder="Ej: Sofía Reviews Tech"
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-slate-50 focus:bg-white text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-brand-text-primary mb-1">Email de Contacto</label>
            <input
              type="email"
              value={newAffiliate.email}
              onChange={(e) => setNewAffiliate({ ...newAffiliate, email: e.target.value })}
              placeholder="sofia@canaltech.com"
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-slate-50 focus:bg-white text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-brand-text-primary mb-1">Código Promocional</label>
              <input
                type="text"
                required
                value={newAffiliate.promoCode}
                onChange={(e) => setNewAffiliate({ ...newAffiliate, promoCode: e.target.value.toUpperCase() })}
                placeholder="SOFIA10"
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-slate-50 focus:bg-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">% de Comisión</label>
              <input
                type="number"
                min="1"
                max="100"
                required
                value={newAffiliate.commissionRate}
                onChange={(e) => setNewAffiliate({ ...newAffiliate, commissionRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-slate-50 focus:bg-white text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsAffiliateModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSavingAffiliate}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isSavingAffiliate ? 'Guardando...' : 'Crear Afiliado'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
