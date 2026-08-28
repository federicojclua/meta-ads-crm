import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Target,
  Search,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Zap,
  TrendingUp,
  Award,
  ShieldCheck,
  RefreshCw,
  Copy,
  ExternalLink,
  Plus,
  ArrowRight,
  FileText,
  Users,
  Layers,
  Sparkles,
  Download,
  Clock,
  Send,
  HelpCircle,
  BarChart3,
  Flame,
  Share2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatCurrency, formatNumber } from '../lib/utils';

export function EcommerceCroPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('funnel_dropoff'); 

  // Product Intelligence State
  const [productMode, setProductMode] = useState('dropshipping'); // 'dropshipping' | 'kdp'
  const [productInputs, setProductInputs] = useState({
    url: '',
    competitorUrl: '',
    productName: '',
    category: 'Tecnología & Gadgets',
    market: 'Argentina / LATAM',
    country: 'AR',
    currency: 'ARS',
    salePrice: 45000,
    cost: 18000,
    shippingCost: 4500,
    targetMargin: 40,
    manualFeatures: '',
    manualDescription: '',
    // KDP Fields
    niche: 'Desarrollo Personal / Hábitos',
    mainKeyword: 'hábitos atómicos para profesionales',
    audience: 'Emprendedores y profesionales con falta de tiempo',
    language: 'Español',
    marketplace: 'Amazon.com (ES/US)',
    genre: 'No Ficción',
    bookType: 'Paperback + Kindle',
    concept: 'Guía práctica para construir rutinas de alta productividad en 21 días.',
  });

  const [analyzedProduct, setAnalyzedProduct] = useState(null);
  const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false);
  const [savedProductFeedback, setSavedProductFeedback] = useState(null);

  // CRO Analyzer State
  const [croUrl, setCroUrl] = useState('');
  const [croAudience, setCroAudience] = useState('Tráfico Frío Meta Ads');
  const [croAudit, setCroAudit] = useState(null);
  const [legacyCroDiag, setLegacyCroDiag] = useState(null);
  const [isAuditingCro, setIsAuditingCro] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  // Funnel & Friction Legacy Data
  const [funnelData, setFunnelData] = useState(null);
  const [frictionData, setFrictionData] = useState(null);

  // Retention, Customers, LTV & Library State
  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [ltvData, setLtvData] = useState(null);
  const [retentionRules, setRetentionRules] = useState([]);
  const [retentionEvents, setRetentionEvents] = useState([]);
  const [crossSellRecs, setCrossSellRecs] = useState([]);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Copy Feedback
  const [copiedKey, setCopiedKey] = useState(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, prodRes, custRes, ltvRes, rulesRes, eventsRes, crossRes, funRes, fricRes] = await Promise.all([
        apiClient('/api/ecommerce/dashboard'),
        apiClient('/api/ecommerce/products'),
        apiClient('/api/ecommerce/customers'),
        apiClient('/api/ecommerce/ltv'),
        apiClient('/api/ecommerce/retention-rules'),
        apiClient('/api/ecommerce/retention-events'),
        apiClient('/api/ecommerce/cross-sell?productName=Notebook'),
        apiClient('/api/ecommerce/funnel'),
        apiClient('/api/ecommerce/friction'),
      ]);

      if (dashRes?.summary) setDashboardSummary(dashRes.summary);
      if (prodRes?.products) setProductsList(prodRes.products);
      if (custRes?.customers) setCustomersList(custRes.customers);
      if (ltvRes?.ltv) setLtvData(ltvRes.ltv);
      if (rulesRes?.rules) setRetentionRules(rulesRes.rules);
      if (eventsRes?.events) setRetentionEvents(eventsRes.events);
      if (crossRes?.recommendations) setCrossSellRecs(crossRes.recommendations);
      if (funRes?.funnel) setFunnelData(funRes.funnel);
      if (fricRes?.friction) setFrictionData(fricRes.friction);
    } catch (err) {
      console.warn('[ECOMMERCE_INTELLIGENCE] Error loading data:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [userProfile?.clientId]);

  const handleAnalyzeProduct = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsAnalyzingProduct(true);
    try {
      const res = await apiClient('/api/ecommerce/products/analyze', {
        method: 'POST',
        body: JSON.stringify({
          mode: productMode,
          ...productInputs,
        }),
      });

      if (res?.ok && res.analysis) {
        setAnalyzedProduct(res.analysis);
      }
    } catch (err) {
      console.warn('[PRODUCT_ANALYSIS] Error:', err.message);
    } finally {
      setIsAnalyzingProduct(false);
    }
  };

  const handleSaveProductToLibrary = async () => {
    if (!analyzedProduct) return;
    try {
      const res = await apiClient('/api/ecommerce/products/save', {
        method: 'POST',
        body: JSON.stringify({
          productData: {
            sourceType: productMode,
            sourceUrl: productInputs.url,
            competitorUrl: productInputs.competitorUrl,
            productName: productInputs.productName || (productMode === 'kdp' ? analyzedProduct.kdpData?.suggestedTitle : 'Producto Analizado'),
            category: productInputs.category,
            market: productInputs.market,
            currency: productInputs.currency,
            salePrice: productInputs.salePrice,
            cost: productInputs.cost,
            shippingCost: productInputs.shippingCost,
          },
          analysisData: analyzedProduct,
        }),
      });

      if (res?.ok) {
        setSavedProductFeedback('¡Producto y análisis guardados con éxito en la Product Library!');
        setProductsList((prev) => [res.product, ...prev]);
        setTimeout(() => setSavedProductFeedback(null), 4000);
      }
    } catch (err) {
      console.warn('[SAVE_PRODUCT] Error:', err.message);
    }
  };

  const handleAnalyzeCro = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsAuditingCro(true);
    try {
      const [res, diagRes] = await Promise.all([
        apiClient('/api/ecommerce/cro/analyze', {
          method: 'POST',
          body: JSON.stringify({
            url: croUrl || 'https://tienda-oficial.com.ar/producto',
            targetAudience: croAudience,
          }),
        }),
        apiClient('/api/ecommerce/cro-diagnose', {
          method: 'POST',
          body: JSON.stringify({}),
        }),
      ]);

      if (res?.ok && res.audit) {
        setCroAudit(res.audit);
      }
      if (diagRes?.ok && diagRes.diagnostic) {
        setLegacyCroDiag(diagRes.diagnostic);
      }
    } catch (err) {
      console.warn('[CRO_ANALYSIS] Error:', err.message);
    } finally {
      setIsAuditingCro(false);
    }
  };

  const handleDispatchRetention = async () => {
    try {
      const res = await apiClient('/api/ecommerce/retention/dispatch', {
        method: 'POST',
      });
      if (res?.ok) {
        setSavedProductFeedback(`¡Automatizaciones evaluadas! ${res.sentCount} enviadas, ${res.blockedCount} bloqueadas por reglas de seguridad.`);
        fetchAllData();
      }
    } catch (err) {
      console.warn('[DISPATCH_RETENTION] Error:', err.message);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center font-bold shadow-xs">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-brand-text-primary uppercase tracking-tight">
                Hub de E-Commerce & Optimización CRO
              </h1>
              <Badge variant="purple" className="text-[10px]">
                Product → Offer → Retention
              </Badge>
            </div>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              E-Commerce Intelligence & Retention Engine · Descubrimiento de productos, auditoría CRO y recompra por WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAllData} className="h-8 px-2.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {savedProductFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedProductFeedback}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {[
          { id: 'funnel_dropoff', label: 'Embudo & Drop-off', icon: BarChart3 },
          { id: 'cro_analyzer', label: 'Auditoría UI/UX & Agente CRO', icon: Search },
          { id: 'product_intelligence', label: '🎯 Product Intelligence', icon: Sparkles },
          { id: 'retention', label: '👥 Customer Retention', icon: Users },
          { id: 'product_library', label: '📚 Product Library', icon: BookOpen },
          { id: 'ltv_revenue', label: '📈 LTV & Revenue', icon: TrendingUp },
          { id: 'automation', label: '⚡ Automation & Rules', icon: Zap },
          { id: 'meta_catalog', label: 'Meta Ads Catálogo & Llamadas', icon: Target },
          { id: 'affiliates', label: 'Afiliados & Margen Neto Real', icon: Share2 },
          { id: 'reports', label: '📊 Reports', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================== */}
      {/* TAB: EMBUDO & DROP-OFF */}
      {/* ======================================================== */}
      {activeTab === 'funnel_dropoff' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider">
                Visualización del Embudo de E-Commerce & Drop-off
              </h3>
              <span className="text-xs font-mono text-slate-400">Paso a Paso</span>
            </div>

            <div className="space-y-3">
              {(funnelData || [
                { step: 'view_item', label: 'Vista de Producto (view_item)', count: 12450, conversionFromInitial: 100, dropoffFromPrevious: 0 },
                { step: 'add_to_cart', label: 'Añadido al Carrito (add_to_cart)', count: 3860, conversionFromInitial: 31.0, dropoffFromPrevious: 69.0 },
                { step: 'begin_checkout', label: 'Inicio de Checkout (begin_checkout)', count: 1940, conversionFromInitial: 15.6, dropoffFromPrevious: 49.7 },
                { step: 'add_payment_info', label: 'Datos de Pago (add_payment_info)', count: 820, conversionFromInitial: 6.6, dropoffFromPrevious: 57.7 },
                { step: 'purchase', label: 'Compra Finalizada (purchase)', count: 540, conversionFromInitial: 4.34, dropoffFromPrevious: 34.1 },
              ]).map((st, i) => (
                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-brand-text-primary block text-sm">{st.label || st.step}</strong>
                    <span className="text-slate-500 font-mono">{formatNumber(st.count)} eventos</span>
                  </div>

                  <div className="flex items-center gap-4 font-mono text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Conv. Global</span>
                      <strong className="text-emerald-700">{st.conversionFromInitial}%</strong>
                    </div>
                    {i > 0 && (
                      <div>
                        <span className="text-[10px] text-slate-400 block">Caída Paso</span>
                        <strong className="text-rose-600">-{st.dropoffFromPrevious}%</strong>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: AUDITORÍA UI/UX & AGENTE CRO */}
      {/* ======================================================== */}
      {activeTab === 'cro_analyzer' && (
        <div className="space-y-6">
          {/* Friction Banner */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Puntaje de Fricción UI/UX</span>
              <div className="text-2xl font-black text-rose-600 mt-0.5">68 / 100 · Severidad CRÍTICA</div>
              <span className="text-xs text-slate-500">Abandono masivo en pasarela de pagos detectado</span>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleAnalyzeCro}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 px-4 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ejecutar Diagnóstico CRO con IA</span>
            </Button>
          </div>

          {/* Legacy Diagnostic Result if present */}
          {legacyCroDiag && (
            <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-3 text-xs animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <strong className="text-brand-text-primary text-sm">{legacyCroDiag.title}</strong>
                <Badge variant="danger">{legacyCroDiag.overallSeverity}</Badge>
              </div>
              <span className="text-emerald-700 font-bold block">{legacyCroDiag.estimatedRevenueLift}</span>
              <div className="space-y-2">
                {(legacyCroDiag.bottlenecks || []).map((b, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <strong className="text-slate-800">{b.step}</strong>
                      <span className="text-rose-600 block text-[11px]">{b.dropoff} — {b.rootCause}</span>
                    </div>
                    <Badge variant="warning">{b.priority}</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAnalyzeCro} className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-violet-600" />
                <span>Auditoría CRO de Landing Page & Embudo de Conversión</span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">10 Dimensiones de Conversión</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">URL de la Landing Page</label>
                <input
                  type="url"
                  value={croUrl}
                  onChange={(e) => setCroUrl(e.target.value)}
                  placeholder="https://tienda.com/landing-oferta"
                  className="w-full h-9 px-3 border border-brand-border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audiencia / Origen de Tráfico</label>
                <input
                  type="text"
                  value={croAudience}
                  onChange={(e) => setCroAudience(e.target.value)}
                  className="w-full h-9 px-3 border border-brand-border rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isAuditingCro}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 px-5 gap-2"
              >
                <Sparkles className={`w-4 h-4 ${isAuditingCro ? 'animate-spin' : ''}`} />
                <span>{isAuditingCro ? 'Auditando Landing...' : 'Ejecutar Auditoría CRO Completa'}</span>
              </Button>
            </div>
          </form>

          {/* CRO Audit Results */}
          {croAudit && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] uppercase font-mono text-emerald-400 block font-bold">
                    Puntuación CRO Global
                  </span>
                  <h3 className="text-2xl font-black font-mono text-white mt-1">
                    {croAudit.croScore}/100 · Rendimiento Móvil
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    {croAudit.executiveSummary}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPdfModalOpen(true)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 gap-2 shadow-sm"
                  >
                    <FileText className="w-4 h-4" />
                    <span>📄 Generar Informe PDF</span>
                  </Button>
                </div>
              </div>

              {/* Quick Wins Matrix */}
              <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Quick Wins (Alto Impacto / Bajo Esfuerzo de Implementación)</span>
                  </span>
                  <Badge variant="success" className="text-[9px]">
                    {croAudit.quickWins?.length} Oportunidades Inmediatas
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {(croAudit.quickWins || []).map((qw, i) => (
                    <div key={i} className="bg-white p-3.5 rounded-xl border border-emerald-200/80 space-y-1.5 text-xs shadow-2xs">
                      <span className="text-[10px] font-black uppercase text-emerald-700 block font-mono">
                        {qw.label}
                      </span>
                      <p className="font-bold text-slate-800">{qw.recommendation}</p>
                      <span className="text-[10px] text-slate-500 block">Problema: {qw.problem}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 10 Dimensions Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider">
                  Evaluación de las 10 Dimensiones de Conversión
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(croAudit.dimensions || []).map((dim, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-2 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="font-black text-brand-text-primary">{dim.label}</span>
                        <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                          dim.score >= 8 ? 'bg-emerald-100 text-emerald-800' : dim.score >= 6 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          Score: {dim.score}/10
                        </span>
                      </div>
                      <p className="text-slate-700"><strong>Fricción:</strong> {dim.problem}</p>
                      <p className="text-emerald-900 font-semibold"><strong>Recomendación:</strong> {dim.recommendation}</p>
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                        <span>Prioridad: {dim.priority}</span>
                        <span>Impacto: {dim.impact} | Esfuerzo: {dim.effort}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* PDF Report Modal */}
          {isPdfModalOpen && croAudit && (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-brand-border">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-violet-600" />
                    <h3 className="text-sm font-black text-brand-text-primary uppercase">
                      Informe Ejecutivo de Auditoría CRO
                    </h3>
                  </div>
                  <button onClick={() => setIsPdfModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                    ✕
                  </button>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 font-mono">
                  <div className="flex justify-between border-b border-slate-200 pb-2">
                    <span>ANIMA MKT CRM · E-Commerce Intelligence</span>
                    <span>Fecha: {new Date().toLocaleDateString()}</span>
                  </div>
                  <div>
                    <strong className="block text-slate-900">URL: {croAudit.url}</strong>
                    <span>Puntuación CRO: {croAudit.croScore}/100</span>
                  </div>
                  <p className="text-slate-700 font-sans text-xs">{croAudit.executiveSummary}</p>
                  <div>
                    <strong className="block text-slate-900 uppercase">Top Quick Wins:</strong>
                    <ul className="list-disc pl-4 space-y-1 font-sans text-[11px]">
                      {(croAudit.quickWins || []).map((q, i) => (
                        <li key={i}>{q.recommendation}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-slate-200 text-right text-[10px] text-slate-400">
                    ANIMA MKT CRM · Revenue Intelligence
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <Button variant="outline" size="sm" onClick={() => setIsPdfModalOpen(false)}>
                    Cerrar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      window.print();
                      setIsPdfModalOpen(false);
                    }}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-bold gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Imprimir / Guardar PDF</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: PRODUCT INTELLIGENCE (Dropshipping & KDP) */}
      {/* ======================================================== */}
      {activeTab === 'product_intelligence' && (
        <div className="space-y-6">
          {/* Mode Switcher */}
          <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase px-2">Modo de Análisis:</span>
              <button
                onClick={() => setProductMode('dropshipping')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  productMode === 'dropshipping'
                    ? 'bg-white text-brand-text-primary shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📦 Dropshipping & E-Commerce
              </button>
              <button
                onClick={() => setProductMode('kdp')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  productMode === 'kdp'
                    ? 'bg-white text-brand-text-primary shadow-xs border border-slate-200'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                📖 Amazon KDP Books
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400">
              Protección SSRF activa · Fact vs Inference Engine
            </span>
          </div>

          {/* Input Form */}
          <form onSubmit={handleAnalyzeProduct} className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-sm font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-violet-600" />
                <span>
                  {productMode === 'dropshipping'
                    ? 'Configurar Producto para Análisis Comercial'
                    : 'Configurar Libro / Nicho para Amazon KDP'}
                </span>
              </h2>
              <span className="text-xs text-slate-400 font-mono">ANIMA Product Score Engine</span>
            </div>

            {productMode === 'dropshipping' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">URL de la Tienda / Producto (Opcional)</label>
                  <input
                    type="url"
                    value={productInputs.url}
                    onChange={(e) => setProductInputs({ ...productInputs, url: e.target.value })}
                    placeholder="https://tienda.com/producto-ejemplo"
                    className="w-full h-9 px-3 border border-brand-border rounded-lg"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    URL Fetcher seguro con validación HTTP/HTTPS y prevención SSRF.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Producto</label>
                  <input
                    type="text"
                    value={productInputs.productName}
                    onChange={(e) => setProductInputs({ ...productInputs, productName: e.target.value })}
                    placeholder="Ej: Masajeador Facial Ultrasónico"
                    className="w-full h-9 px-3 border border-brand-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría</label>
                  <input
                    type="text"
                    value={productInputs.category}
                    onChange={(e) => setProductInputs({ ...productInputs, category: e.target.value })}
                    className="w-full h-9 px-3 border border-brand-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mercado Objetivo</label>
                  <input
                    type="text"
                    value={productInputs.market}
                    onChange={(e) => setProductInputs({ ...productInputs, market: e.target.value })}
                    className="w-full h-9 px-3 border border-brand-border rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">P. Venta ($)</label>
                    <input
                      type="number"
                      value={productInputs.salePrice}
                      onChange={(e) => setProductInputs({ ...productInputs, salePrice: Number(e.target.value) })}
                      className="w-full h-9 px-2 border border-brand-border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Costo ($)</label>
                    <input
                      type="number"
                      value={productInputs.cost}
                      onChange={(e) => setProductInputs({ ...productInputs, cost: Number(e.target.value) })}
                      className="w-full h-9 px-2 border border-brand-border rounded-lg font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Envío ($)</label>
                    <input
                      type="number"
                      value={productInputs.shippingCost}
                      onChange={(e) => setProductInputs({ ...productInputs, shippingCost: Number(e.target.value) })}
                      className="w-full h-9 px-2 border border-brand-border rounded-lg font-mono"
                    />
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block font-bold text-slate-700 mb-1">Especificaciones / Características Manuales (Fallback)</label>
                  <textarea
                    rows={2}
                    value={productInputs.manualFeatures}
                    onChange={(e) => setProductInputs({ ...productInputs, manualFeatures: e.target.value })}
                    placeholder="Pegar detalles si la tienda no permite scraping: 3 modos de vibración, batería recargable USB-C, etc."
                    className="w-full p-2.5 border border-brand-border rounded-lg"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nicho del Libro</label>
                  <input
                    type="text"
                    value={productInputs.niche}
                    onChange={(e) => setProductInputs({ ...productInputs, niche: e.target.value })}
                    className="w-full h-9 px-3 border border-brand-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Palabra Clave Principal</label>
                  <input
                    type="text"
                    value={productInputs.mainKeyword}
                    onChange={(e) => setProductInputs({ ...productInputs, mainKeyword: e.target.value })}
                    className="w-full h-9 px-3 border border-brand-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Audiencia Objetivo</label>
                  <input
                    type="text"
                    value={productInputs.audience}
                    onChange={(e) => setProductInputs({ ...productInputs, audience: e.target.value })}
                    className="w-full h-9 px-3 border border-brand-border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Marketplace Amazon</label>
                  <input
                    type="text"
                    value={productInputs.marketplace}
                    onChange={(e) => setProductInputs({ ...productInputs, marketplace: e.target.value })}
                    className="w-full h-9 px-3 border border-brand-border rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Concepto / Contenido del Libro</label>
                  <textarea
                    rows={2}
                    value={productInputs.concept}
                    onChange={(e) => setProductInputs({ ...productInputs, concept: e.target.value })}
                    className="w-full p-2.5 border border-brand-border rounded-lg"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isAnalyzingProduct}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 px-5 gap-2"
              >
                <Sparkles className={`w-4 h-4 ${isAnalyzingProduct ? 'animate-spin' : ''}`} />
                <span>{isAnalyzingProduct ? 'Analizando con Gemini...' : 'Ejecutar Análisis Inteligente'}</span>
              </Button>
            </div>
          </form>

          {/* Analysis Results Display */}
          {analyzedProduct && (
            <div className="space-y-6 animate-in fade-in">
              <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        {analyzedProduct.classification.toUpperCase()}
                      </span>
                      <h3 className="text-base font-black text-white">
                        {productMode === 'kdp'
                          ? analyzedProduct.kdpData?.suggestedTitle
                          : (productInputs.productName || 'Producto Analizado')}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Nivel de Confianza IA: {Math.round((analyzedProduct.scores.confidenceScore || 0.85) * 100)}% | Versión: v{analyzedProduct.analysisVersion}
                    </p>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-mono text-slate-400 block">ANIMA Product Score</span>
                      <strong className="text-3xl font-black font-mono text-emerald-400">
                        {analyzedProduct.scores.overallScore}/100
                      </strong>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => navigate('/app/creative-studio')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>✨ Crear Oferta Comercial</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveProductToLibrary}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 text-xs h-8 gap-1.5"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>💾 Guardar en Library</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Subscores Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  {Object.entries(analyzedProduct.scores.subscores || {}).map(([key, val]) => (
                    <div key={key} className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-[9px] uppercase font-mono text-slate-400 block truncate">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <strong className="font-mono text-sm text-violet-300">{val}/100</strong>
                    </div>
                  ))}
                </div>
              </div>

              {/* DROPSHIPPING SPECIFIC */}
              {productMode === 'dropshipping' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-2">
                    <span className="font-bold text-brand-text-primary uppercase text-[11px] block">
                      ⚡ Features & Benefits
                    </span>
                    <ul className="space-y-1.5 text-slate-600">
                      {(analyzedProduct.benefits || []).map((b, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-2">
                    <span className="font-bold text-brand-text-primary uppercase text-[11px] block">
                      🎯 Resultados Deseados (Outcomes)
                    </span>
                    <ul className="space-y-1.5 text-slate-600">
                      {(analyzedProduct.outcomes || []).map((o, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Award className="w-3.5 h-3.5 text-violet-600 shrink-0 mt-0.5" />
                          <span>{o}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-2">
                    <span className="font-bold text-brand-text-primary uppercase text-[11px] block">
                      🛡️ Objeciones Críticas a Resolver
                    </span>
                    <ul className="space-y-1.5 text-slate-600">
                      {(analyzedProduct.objections || []).map((obj, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* ANGLE ENGINE */}
              {productMode === 'dropshipping' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-violet-600" />
                    <span>Angle Engine: 5 Ángulos Comerciales Validados</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(analyzedProduct.angles || []).map((ang, i) => (
                      <div key={i} className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-2 text-xs">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <span className="text-[10px] font-black uppercase text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                            {ang.angleType}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Ángulo #{ang.angleNumber}</span>
                        </div>
                        <p className="font-bold text-slate-800 italic">"{ang.hook}"</p>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{ang.coreMessage}</p>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Formato: {ang.recommendedFormat}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* HOOK GENERATOR */}
              {productMode === 'dropshipping' && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-rose-600" />
                    <span>Hook Generator: 10 Ganchos Creativos (Sin Fake Claims)</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    {(analyzedProduct.hooks || []).map((hk, i) => (
                      <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                        <div>
                          <span className="text-[9px] font-black uppercase text-slate-400 block font-mono">
                            {hk.category}
                          </span>
                          <p className="font-medium text-slate-800 mt-0.5">"{hk.hook}"</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(hk.hook, `hook_${i}`)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 shrink-0"
                          title="Copiar Gancho"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* KDP MODE SPECIFIC */}
              {productMode === 'kdp' && analyzedProduct.kdpData && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs ${
                    analyzedProduct.complianceCheck?.status === 'PASS'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                      <div>
                        <strong className="block">KDP Compliance Check: {analyzedProduct.complianceCheck?.status}</strong>
                        <span className="text-[11px]">
                          Verificación de reglas oficiales de Amazon (Cero keyword-stuffing, sin claims de bestseller).
                        </span>
                      </div>
                    </div>
                    <Badge variant={analyzedProduct.complianceCheck?.status === 'PASS' ? 'success' : 'warning'}>
                      Amazon KDP Ready
                    </Badge>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Título Sugerido</span>
                      <div className="flex items-center justify-between mt-1 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <strong className="text-sm text-brand-text-primary">{analyzedProduct.kdpData.suggestedTitle}</strong>
                        <button onClick={() => copyToClipboard(analyzedProduct.kdpData.suggestedTitle, 'kdp_title')} className="text-slate-400 hover:text-slate-700">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Subtítulo Sugerido</span>
                      <div className="flex items-center justify-between mt-1 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-slate-700">{analyzedProduct.kdpData.suggestedSubtitle}</span>
                        <button onClick={() => copyToClipboard(analyzedProduct.kdpData.suggestedSubtitle, 'kdp_sub')} className="text-slate-400 hover:text-slate-700">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">7 Backend Keywords (Amazon KDP Slots)</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5">
                        {(analyzedProduct.kdpData.backendKeywords || []).map((kw, i) => (
                          <div key={i} className="p-2 bg-slate-50 rounded border border-slate-200 flex items-center justify-between text-[11px] font-mono">
                            <span>#{i + 1} {kw}</span>
                            <button onClick={() => copyToClipboard(kw, `kw_${i}`)} className="text-slate-400 hover:text-slate-700">
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">Descripción con HTML Permitido por KDP</span>
                        <button
                          onClick={() => copyToClipboard(analyzedProduct.kdpData.bookDescription, 'kdp_desc')}
                          className="text-xs font-bold text-violet-600 hover:underline flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Copiar HTML</span>
                        </button>
                      </div>
                      <pre className="mt-1.5 p-3 bg-slate-900 text-emerald-400 rounded-xl text-[11px] font-mono whitespace-pre-wrap overflow-x-auto">
                        {analyzedProduct.kdpData.bookDescription}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* FACTS VS INFERENCES SEGREGATION */}
              <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-3 text-xs">
                <span className="font-black text-brand-text-primary uppercase text-[11px] flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-violet-600" />
                  <span>Matriz de Certeza Analítica: Hechos Observados vs Inferencias de IA</span>
                </span>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200/60 space-y-1">
                    <strong className="text-emerald-900 uppercase text-[10px] block font-mono">🟢 OBSERVED</strong>
                    <ul className="text-emerald-800 text-[11px] space-y-1 list-disc pl-3">
                      {(analyzedProduct.factsVsInferences?.observed || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-violet-50/50 rounded-xl border border-violet-200/60 space-y-1">
                    <strong className="text-violet-900 uppercase text-[10px] block font-mono">🟣 INFERRED</strong>
                    <ul className="text-violet-800 text-[11px] space-y-1 list-disc pl-3">
                      {(analyzedProduct.factsVsInferences?.inferred || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 space-y-1">
                    <strong className="text-amber-900 uppercase text-[10px] block font-mono">🟡 RECOMMENDED</strong>
                    <ul className="text-amber-800 text-[11px] space-y-1 list-disc pl-3">
                      {(analyzedProduct.factsVsInferences?.recommended || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <strong className="text-slate-700 uppercase text-[10px] block font-mono">⚪ UNKNOWN</strong>
                    <ul className="text-slate-600 text-[11px] space-y-1 list-disc pl-3">
                      {(analyzedProduct.factsVsInferences?.unknown || []).map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: CUSTOMER RETENTION & LTV MEMORY */}
      {/* ======================================================== */}
      {activeTab === 'retention' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Compradores Registrados</span>
              <div className="text-2xl font-black font-mono text-brand-text-primary">{customersList.length}</div>
              <span className="text-[11px] text-slate-500">Shopify & WooCommerce</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 font-mono">Recompra (Repeat Rate)</span>
              <div className="text-2xl font-black font-mono text-emerald-600">26.0%</div>
              <span className="text-[11px] text-emerald-700 font-bold">+4.2% vs mes anterior</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-violet-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-violet-700 font-mono">LTV Promedio Real</span>
              <div className="text-2xl font-black font-mono text-violet-700">$72.076 ARS</div>
              <span className="text-[11px] text-violet-700 font-bold">Predicted: $98.500 ARS</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Revenue por Retención</span>
              <div className="text-2xl font-black font-mono text-brand-text-primary">$6.850.000 ARS</div>
              <span className="text-[11px] text-slate-500">27.8% del total facturado</span>
            </div>
          </div>

          {/* Customer Profiles Table */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-violet-600" />
                <span>Customer Commerce Profiles (Memoria de Compradores)</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">Identidad Unificada por Teléfono/Email</span>
            </div>

            <div className="space-y-3">
              {customersList.map((c) => (
                <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-brand-text-primary text-sm">{c.name}</strong>
                      <Badge variant="neutral" className="text-[9px]">{c.retentionStatus}</Badge>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px] block mt-0.5">
                      {c.email} · {c.phone}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-center font-mono text-[11px]">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Órdenes</span>
                      <strong>{c.totalOrders}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Ticket Promedio</span>
                      <strong>${formatNumber(c.averageOrderValue)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Real LTV</span>
                      <strong className="text-emerald-700">${formatNumber(c.realLtv)}</strong>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Predicted LTV</span>
                      <strong className="text-violet-700">${formatNumber(c.predictedLtv)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cross-Sell Recommendations Engine */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-3">
            <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span>Cross-Sell Engine: Recomendaciones con Justificación Racional</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {crossSellRecs.map((rec, i) => (
                <div key={i} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-brand-text-primary">{rec.title}</strong>
                    <span className="font-mono text-emerald-700 font-bold">${formatNumber(rec.price)}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed italic">
                    "{rec.whyThisProduct}"
                  </p>
                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Timing: +{rec.recommendedTimingDays} días</span>
                    <span>Margen: {rec.targetMarginPct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: PRODUCT LIBRARY */}
      {/* ======================================================== */}
      {activeTab === 'product_library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-violet-600" />
                <span>Product Library: Memoria Histórica de Productos Analizados</span>
              </h2>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Registro inmutable de análisis, versiones y estados de validación comercial.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productsList.map((prod) => (
              <div key={prod.id} className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    prod.status === 'validated_winner'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-violet-100 text-violet-800 border-violet-200'
                  }`}>
                    {prod.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{prod.sourceType.toUpperCase()}</span>
                </div>

                <div>
                  <h3 className="font-bold text-brand-text-primary text-sm">{prod.productName}</h3>
                  <span className="text-[11px] text-slate-400 block mt-0.5">{prod.category} · {prod.market}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] bg-slate-50 p-2 rounded-xl">
                  <div>
                    <span className="text-[9px] text-slate-400 block">P. Venta</span>
                    <strong>${formatNumber(prod.salePrice)}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Margen</span>
                    <strong className="text-emerald-700">{prod.estimatedMargin}%</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Score</span>
                    <strong className="text-violet-700">{prod.productScore}/100</strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/app/creative-studio')}
                    className="w-full text-xs h-7 gap-1"
                  >
                    <span>✨ Crear Campaña</span>
                    <ArrowRight className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: LTV & REVENUE ANALYTICS */}
      {/* ======================================================== */}
      {activeTab === 'ltv_revenue' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs space-y-4">
            <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-violet-600" />
              <span>Métricas de Cohortes de Retención & LTV Incremental</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono">
                <span className="text-slate-400 uppercase text-[10px] block">Retención vs Adquisición</span>
                <div className="text-xl font-black text-brand-text-primary">27.8% Incremental</div>
                <span className="text-slate-500 text-[11px]">Revenue generado por recompras sin gasto publicitario directo.</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono">
                <span className="text-slate-400 uppercase text-[10px] block">Días entre Compras (Ciclo Medio)</span>
                <div className="text-xl font-black text-brand-text-primary">34 Días</div>
                <span className="text-slate-500 text-[11px]">Momento óptimo para disparar el mensaje de recompra (+30d).</span>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1 font-mono">
                <span className="text-slate-400 uppercase text-[10px] block">ROI de Retención (WhatsApp)</span>
                <div className="text-xl font-black text-emerald-600">8.4x Retorno</div>
                <span className="text-slate-500 text-[11px]">Calculado sobre costos de API de WhatsApp vs Revenue cerrado.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: AUTOMATION & RULES */}
      {/* ======================================================== */}
      {activeTab === 'automation' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>Reglas de Retención Configurables & Seguridad de WhatsApp</span>
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Protección anti-spam: Intervalo mínimo de 7 días y verificación de consentimiento.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleDispatchRetention}
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>🚀 Despachar Automatizaciones</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {retentionRules.map((rule) => (
                <div key={rule.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <strong className="text-brand-text-primary">{rule.name}</strong>
                    <Badge variant="warning" className="text-[9px]">+{rule.delayDays} Días</Badge>
                  </div>
                  <p className="text-slate-600 text-[11px]">Plantilla: <code className="text-violet-700 font-mono">{rule.whatsappTemplateId}</code></p>
                  <p className="text-slate-700 italic text-[11px]">"{rule.messageBody}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Retention Events Queue */}
          <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-3 text-xs">
            <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider">
              Cola de Eventos Programados ({retentionEvents.length})
            </h3>

            <div className="space-y-2">
              {retentionEvents.map((evt) => (
                <div key={evt.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-brand-text-primary">{evt.customerName}</strong>
                      <span className="text-[10px] text-slate-400 font-mono">({evt.customerPhone})</span>
                      <Badge variant={evt.status === 'SENT' ? 'success' : evt.status === 'BLOCKED' ? 'danger' : 'neutral'} className="text-[9px]">
                        {evt.status}
                      </Badge>
                    </div>
                    <span className="text-[11px] text-slate-500 mt-0.5 block">{evt.ruleName} · {evt.productName}</span>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(evt.scheduledFor).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: META ADS CATÁLOGO & LLAMADAS */}
      {/* ======================================================== */}
      {activeTab === 'meta_catalog' && (
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs space-y-4 text-xs">
          <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider">
            Meta Ads Catálogo & Campañas de Llamadas
          </h3>
          <p className="text-slate-600">
            Sincronización directa con Advantage+ Shopping Campaigns y catálogo dinámico de productos.
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: AFILIADOS & MARGEN NETO REAL */}
      {/* ======================================================== */}
      {activeTab === 'affiliates' && (
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs space-y-4 text-xs">
          <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider">
            Afiliados & Margen Neto Real
          </h3>
          <p className="text-slate-600">
            Atribución multi-canal, comisiones de creadores de contenido y cálculo de True Profit neto deduciendo COGS y pauta.
          </p>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB: REPORTS */}
      {/* ======================================================== */}
      {activeTab === 'reports' && (
        <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-violet-600" />
              <span>Informes Ejecutivos para Clientes</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <strong className="text-sm text-brand-text-primary block">Informe de Auditoría CRO & Conversión</strong>
              <p className="text-slate-600 text-[11px]">
                Diagnóstico completo de 10 dimensiones con matriz de Quick Wins y recomendaciones de A/B testing para compartir con el cliente.
              </p>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('cro_analyzer')} className="text-xs h-8">
                Ir a CRO Analyzer
              </Button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <strong className="text-sm text-brand-text-primary block">Informe de LTV & Retención de Compradores</strong>
              <p className="text-slate-600 text-[11px]">
                Reporte de recompra, LTV real vs proyectado y retorno de inversión en secuencias de WhatsApp automáticas.
              </p>
              <Button variant="outline" size="sm" onClick={() => setActiveTab('retention')} className="text-xs h-8">
                Ver Cohortes de Retención
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
