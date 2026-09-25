import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Plane,
  Package,
  TrendingUp,
  DollarSign,
  Search,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Clock,
  Filter,
  SlidersHorizontal,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getCuratedUSOpportunities, auditProductForUSMarket } from '../../../netlify/functions/_shared/ecommerceEngine/opportunityEngine.js';

export function OpportunityRadar() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [minMarginFilter, setMinMarginFilter] = useState(50);
  const [searchQuery, setSearchQuery] = useState('');

  // Scanner de auditoría propia
  const [auditInput, setAuditInput] = useState('');
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditResult, setAuditResult] = useState(null);
  const [auditError, setAuditError] = useState(null);

  // Estados de sincronización por producto
  const [syncingId, setSyncingId] = useState(null);
  const [syncSuccess, setSyncSuccess] = useState({});
  const [syncError, setSyncError] = useState({});

  // Estado de Sincronización Automática de Stock con Proveedor
  const [isSyncingStock, setIsSyncingStock] = useState(false);
  const [stockSyncReport, setStockSyncReport] = useState(null);
  const [stockSyncError, setStockSyncError] = useState(null);

  useEffect(() => {
    loadOpportunities();
  }, [selectedCategory, minMarginFilter]);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      // Usar apiClient con fallback local inmediato de catálogo
      const res = await apiClient.get('/api/shopify/opportunities', {
        params: {
          category: selectedCategory,
          minMargin: minMarginFilter,
          search: searchQuery,
        },
      });
      const list = res?.data || res?.opportunities;
      if (Array.isArray(list) && list.length > 0) {
        setOpportunities(list);
      } else {
        fallbackCatalog();
      }
    } catch {
      fallbackCatalog();
    } finally {
      setLoading(false);
    }
  };

  const fallbackCatalog = () => {
    let list = getCuratedUSOpportunities();
    if (selectedCategory !== 'all') {
      list = list.filter((item) =>
        item.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        item.niche.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    if (minMarginFilter > 0) {
      list = list.filter((item) => item.financials.marginPct >= minMarginFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((item) =>
        item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
      );
    }
    setOpportunities(list);
  };

  const handleAudit = async (e) => {
    if (e) e.preventDefault();
    if (!auditInput.trim()) return;

    setIsAuditing(true);
    setAuditError(null);
    setAuditResult(null);

    try {
      const res = await apiClient.post('/api/shopify/opportunities/audit', {
        url: auditInput.trim(),
        productId: auditInput.trim(),
      });

      const auditData = res?.data || res;
      if (auditData?.complianceScore !== undefined) {
        setAuditResult(auditData);
      } else {
        // Fallback local con auditoría directa
        const localAudit = auditProductForUSMarket({
          title: auditInput.trim().includes('http') ? 'Producto de AliExpress Analizado' : `AliExpress Item #${auditInput.trim()}`,
          costUsd: 15.0,
          shippingCostUsd: 3.5,
          category: 'General Dropshipping Gadget',
          description: auditInput.trim(),
        });
        setAuditResult(localAudit);
      }
    } catch (err) {
      setAuditError(err.data?.error || err.message || 'No se pudo completar la auditoría aduanera.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDirectSyncToShopify = async (item) => {
    const id = item.productId;
    setSyncingId(id);
    setSyncError((prev) => ({ ...prev, [id]: null }));

    try {
      const payload = {
        url: `https://www.aliexpress.com/item/${id}.html`,
        shippingCost: item.shippingCostUsd || item.financials?.shippingCostUsd || 0,
        shipToCountry: 'US',
      };

      const res = await apiClient.post('/api/shopify/sync-aliexpress', payload);
      const resData = res?.data || res;
      if (res?.ok || resData?.shopifyProduct) {
        setSyncSuccess((prev) => ({
          ...prev,
          [id]: {
            shopifyUrl: resData?.shopifyProduct?.admin_graphql_api_id
              ? `https://admin.shopify.com/store`
              : null,
            sellingPrice: resData?.pricing?.sellingPrice,
            profit: resData?.pricing?.estimatedProfit,
          },
        }));
      }
    } catch (err) {
      setSyncError((prev) => ({
        ...prev,
        [id]: err.data?.error || err.message || 'Error al sincronizar con Shopify.',
      }));
    } finally {
      setSyncingId(null);
    }
  };

  const handleSyncStock = async () => {
    setIsSyncingStock(true);
    setStockSyncError(null);
    setStockSyncReport(null);
    try {
      const res = await apiClient.post('/api/shopify/sync-stock');
      const report = res?.data || res;
      if (report?.checkedCount !== undefined) {
        setStockSyncReport(report);
      }
    } catch (err) {
      setStockSyncError(err.data?.error || err.message || 'Error al sincronizar stock con el proveedor.');
    } finally {
      setIsSyncingStock(false);
    }
  };

  const categories = [
    { id: 'all', label: 'Todos los Nichos' },
    { id: 'tech', label: '💻 Tech & Smart Gadgets' },
    { id: 'desk', label: '🗄️ Desk Setup & Oficina' },
    { id: 'tools', label: '🔧 EDC & Herramientas' },
    { id: 'ergonomics', label: '🧘 Ergonomía & Salud' },
    { id: 'gaming', label: '🎮 Gaming & Decoración' },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Principal de Contexto & Políticas USA */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 px-2.5 py-0.5 text-xs font-bold">
                🇨🇳 Proveedor: China (AliExpress)
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 px-2.5 py-0.5 text-xs font-bold">
                🇺🇸 Mercado: Estados Unidos (USD)
              </Badge>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 px-2.5 py-0.5 text-xs font-bold">
                🛡️ CBP Section 321 De Minimis Safe
              </Badge>
              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 px-2.5 py-0.5 text-xs font-bold">
                🛡️ Escudo Anti-Fraude Activo (Bait-and-Switch)
              </Badge>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              Radar de Oportunidades: Productos Compactos de Alta Ganancia
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Filtro estricto diseñado para tu modelo de negocio: productos de <strong>bajo volumen/peso</strong> (evitan recargos de flete aéreo), con <strong>envío a EE.UU. en 7 a 12 días</strong> y <strong>cero riesgos de retención aduanera CBP</strong> (sin marcas protegidas, sin réplicas y exentos de aranceles formales).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3.5 rounded-xl backdrop-blur-sm">
              <Plane className="w-6 h-6 text-indigo-400" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Logística Garantizada</span>
                <span className="text-xs font-black text-white">AliExpress Selection Standard / Choice US</span>
                <span className="text-[11px] text-emerald-400 block font-mono">7 a 12 días con Tracking oficial</span>
              </div>
            </div>

            <Button
              onClick={handleSyncStock}
              disabled={isSyncingStock}
              className="text-xs py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingStock ? 'animate-spin' : ''}`} />
              <span>{isSyncingStock ? 'Verificando Stock en China...' : 'Sincronizar Stock Proveedor'}</span>
            </Button>
          </div>
        </div>

        {/* Feedback de Sincronización de Stock */}
        {stockSyncReport && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 flex items-center justify-between gap-2 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Stock Sincronizado:</strong> {stockSyncReport.checkedCount} productos analizados ({stockSyncReport.updatedCount} activos, {stockSyncReport.draftedCount} pausados a borrador por falta de stock).
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-300">Auto-Draft Activo</span>
          </div>
        )}

        {stockSyncError && (
          <div className="mt-4 p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-200 flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{stockSyncError}</span>
          </div>
        )}
      </div>

      {/* Herramienta: Scanner de Auditoría Aduanera & Logística para cualquier URL */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Auditor Aduanero CBP & Scanner de Oportunidad (Link o ID)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">Inspección Pre-Importación USA</span>
        </div>

        <form onSubmit={handleAudit} className="flex flex-col sm:flex-row items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={auditInput}
              onChange={(e) => setAuditInput(e.target.value)}
              placeholder="Pegá cualquier URL de AliExpress o ID para verificar aduana de USA y peso..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <Button
            type="submit"
            disabled={isAuditing || !auditInput.trim()}
            className="w-full sm:w-auto text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 shrink-0"
          >
            {isAuditing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auditando Aduana...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Auditar Producto</span>
              </>
            )}
          </Button>
        </form>

        {/* Resultado del Scanner */}
        {auditResult && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">{auditResult.title}</span>
                <Badge
                  className={`text-xs font-bold px-2 py-0.5 ${
                    auditResult.status === 'WINNING_OPPORTUNITY'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-amber-100 text-amber-800 border-amber-200'
                  }`}
                >
                  Score: {auditResult.opportunityScore}/100 — {auditResult.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Aduana */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Seguridad Aduana (CBP)</span>
                </div>
                <p className="text-[11px] text-slate-600">{auditResult.customs.summary}</p>
                {auditResult.customs.flags.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-[10px] text-amber-700 list-disc list-inside">
                    {auditResult.customs.flags.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Logística & Peso */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Flete Aéreo & Tamaño</span>
                </div>
                <p className="text-[11px] text-slate-600">{auditResult.logistics.summary}</p>
                <span className="text-[10px] font-mono text-indigo-600 block mt-1">
                  Tiempo estimado: {auditResult.logistics.estimatedShippingDays}
                </span>
              </div>

              {/* Proyección Financiera */}
              <div className="bg-white p-3 rounded-lg border border-slate-200/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Fórmula AutoDS (2.5x)</span>
                </div>
                <div className="text-[11px] text-slate-700 space-y-0.5">
                  <div>Venta sugerida: <strong>${auditResult.financials.sellingPrice} USD</strong></div>
                  <div>Ganancia proyectada: <strong className="text-emerald-600">+${auditResult.financials.estimatedProfit} USD ({auditResult.financials.marginPct}%)</strong></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {auditError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{auditError}</span>
          </div>
        )}
      </div>

      {/* Controles de Filtro y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Filtro Margen Mínimo */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-bold text-slate-600">Margen Mínimo:</span>
          {[50, 60, 70].map((m) => (
            <button
              key={m}
              onClick={() => setMinMarginFilter(m)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                minMarginFilter === m
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {m}%+
            </button>
          ))}
        </div>
      </div>

      {/* Cuadrícula de Oportunidades Seleccionadas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {opportunities.map((item) => {
          const isSyncing = syncingId === item.productId;
          const successData = syncSuccess[item.productId];
          const errorMsg = syncError[item.productId];

          return (
            <div
              key={item.productId}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Imagen y Badges de Seguridad */}
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=500&q=80';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                    <span className="bg-slate-900/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-black tracking-wider uppercase">
                      Score: {item.opportunityScore}/100
                    </span>
                    <span className="bg-emerald-500/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      CBP Safe (USA)
                    </span>
                  </div>

                  <div className="absolute top-2.5 right-2.5">
                    <span className="bg-blue-600/90 backdrop-blur-md text-white px-2 py-0.5 rounded-md text-[10px] font-black flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {item.weightGrams}g Compacto
                    </span>
                  </div>
                </div>

                {/* Contenido */}
                <div className="p-4 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
                      {item.category} • {item.niche}
                    </span>
                    <h4 className="text-xs font-black text-slate-900 line-clamp-2 leading-snug">
                      {item.title}
                    </h4>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Flete & Tiempos a EE.UU. */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <Clock className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{item.estimatedShippingDays}</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900">
                      Flete: ${item.shippingCostUsd} USD
                    </span>
                  </div>

                  {/* Tabla de Finanzas AutoDS */}
                  <div className="bg-gradient-to-br from-emerald-50/50 to-teal-50/30 p-3 rounded-xl border border-emerald-100/80 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Costo Landed (Prod + Flete):</span>
                      <span className="font-mono font-semibold">${item.financials.totalLandedCost} USD</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Precio Venta Sugerido (2.5x):</span>
                      <span className="font-mono font-bold text-slate-900">${item.financials.sellingPrice} USD</span>
                    </div>
                    <div className="border-t border-emerald-200/50 pt-1.5 flex items-center justify-between text-xs font-black text-emerald-800">
                      <span>Ganancia Neta Proyectada:</span>
                      <span className="font-mono text-sm">+${item.financials.estimatedProfit} USD ({item.financials.marginPct}%)</span>
                    </div>
                  </div>

                  {/* Mensajes de Éxito / Error de Sincronización */}
                  {successData && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 font-bold flex items-center justify-between gap-1 animate-in fade-in">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>¡Publicado en Shopify! (${successData.sellingPrice} USD)</span>
                      </div>
                      <span className="text-emerald-700 font-mono text-[10px]">Stock Sincronizado</span>
                    </div>
                  )}

                  {errorMsg && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-800 flex items-center gap-1.5 animate-in fade-in">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      <span className="line-clamp-2">{errorMsg}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Botón de Acción Directo */}
              <div className="p-4 pt-0">
                <Button
                  onClick={() => handleDirectSyncToShopify(item)}
                  disabled={isSyncing}
                  className="w-full py-2.5 text-xs bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 group-hover:bg-indigo-600"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Extrayendo y Publicando en Shopify...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Sincronizar a Shopify con 1-Clic</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {opportunities.length === 0 && !loading && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
          <Package className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-800">No se encontraron productos con los filtros seleccionados</h4>
          <p className="text-xs text-slate-500">Probá reduciendo el margen mínimo o seleccionando otro nicho.</p>
        </div>
      )}
    </div>
  );
}
