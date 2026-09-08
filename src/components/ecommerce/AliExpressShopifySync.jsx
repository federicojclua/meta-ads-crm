import React, { useState } from 'react';
import {
  ShoppingBag,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Zap,
  TrendingUp,
  Tag,
  DollarSign,
  Layers,
  Image as ImageIcon,
  Copy,
  Check,
} from 'lucide-react';
import { apiClient } from '../../lib/api';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

/**
 * Función auxiliar para detectar y extraer ID de producto de AliExpress
 */
function extractProductId(input) {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (/^\d{8,25}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/\/item\/(\d+)\.html/i) || trimmed.match(/[?&](?:productId|id|itemId)=(\d+)/i) || trimmed.match(/(\d{10,20})/);
  return match ? match[1] : '';
}

export function AliExpressShopifySync() {
  const [productInput, setProductInput] = useState('');
  const [shippingCost, setShippingCost] = useState('0');
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [loadingStep, setLoadingStep] = useState(1);
  const [errorMessage, setErrorMessage] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const detectedId = extractProductId(productInput);

  const handleSync = async (e) => {
    if (e) e.preventDefault();

    if (!productInput.trim()) {
      setStatus('error');
      setErrorMessage('Por favor ingrese un enlace o ID numérico de producto de AliExpress.');
      return;
    }

    setStatus('loading');
    setLoadingStep(1);
    setErrorMessage(null);
    setResultData(null);

    // Simular avance visual de los pasos del ETL mientras la petición corre en segundo plano
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => (prev < 3 ? prev + 1 : prev));
    }, 1200);

    try {
      const response = await apiClient('/api/shopify/sync-aliexpress', {
        method: 'POST',
        body: JSON.stringify({
          productId: detectedId || productInput.trim(),
          shippingCost: parseFloat(shippingCost) || 0,
        }),
      });

      if (response && response.ok) {
        setStatus('success');
        setResultData(response.data);
      } else {
        setStatus('error');
        setErrorMessage(response?.error || 'Error inesperado al sincronizar con Shopify.');
      }
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err.message ||
        'Error de comunicación con el backend. Verifique las credenciales de AliExpress y Shopify en el archivo .env.'
      );
    } finally {
      clearInterval(stepInterval);
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setProductInput('');
    setErrorMessage(null);
    setResultData(null);
  };

  const copyAdminUrl = (url) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Presentación del Módulo ETL */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-lg border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-radial from-violet-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400 font-black text-xs">
                AliExpress Dropshipping API
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 font-black text-xs">
                Shopify Admin 2024-01
              </span>
              <Badge variant="purple" className="text-[10px] bg-purple-500/30 text-purple-200 border-purple-400/30">
                AutoDS Core Engine
              </Badge>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              Sincronizador Directo AliExpress a Shopify
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Extracción automatizada con firma criptográfica <strong>HMAC-SHA256</strong>, normalización heurística de títulos,
              fórmula de venta con multiplicador <strong>2.5x</strong> y precio tachado con <strong>+20% de descuento simulado</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl p-3 backdrop-blur-xs">
            <div className="text-right">
              <div className="text-[11px] text-slate-400 font-medium">Margen Proyectado</div>
              <div className="text-base font-black text-emerald-400">~60.0% Bruto</div>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Formulario de Sincronización */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
        <form onSubmit={(e) => { e.preventDefault(); handleSync(e); }} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enlace o ID de Producto en AliExpress
            </label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Ejemplo: https://es.aliexpress.com/item/1005006321458921.html o simplemente 1005006321458921"
                value={productInput}
                onChange={(e) => setProductInput(e.target.value)}
                disabled={status === 'loading'}
                className="w-full h-11 pl-4 pr-32 text-sm bg-slate-50/80 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
              />
              {detectedId && (
                <div className="absolute right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ID: {detectedId}</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Pegue la URL completa del producto o el ID numérico de 16 dígitos extraído de AliExpress.
            </p>
          </div>

          {/* Parámetros de Negocio (Markup y Envío) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
                <span>Multiplicador de Venta</span>
                <Badge variant="blue" className="text-[10px]">AutoDS Regla</Badge>
              </div>
              <div className="text-lg font-black text-slate-900">2.5x <span className="text-xs font-normal text-slate-500">del costo total</span></div>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
              <div className="flex items-center justify-between text-xs text-slate-600 font-semibold mb-1">
                <span>Descuento Tachado</span>
                <Badge variant="purple" className="text-[10px]">Compare At</Badge>
              </div>
              <div className="text-lg font-black text-purple-700">+20% <span className="text-xs font-normal text-slate-500">sobre precio venta</span></div>
            </div>

            <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Costo Envío Estimado a EE. UU. (USD)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  disabled={status === 'loading'}
                  className="w-full h-8 pl-6 pr-3 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* Botón de Acción Principal */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setProductInput('1005006321458921')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold hover:underline"
              >
                Cargar ID de Ejemplo
              </button>
            </div>

            <Button
              type="button"
              variant="primary"
              onClick={handleSync}
              disabled={status === 'loading' || !productInput.trim()}
              className="h-11 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all"
            >
              {status === 'loading' ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sincronizando...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2 text-amber-300 fill-amber-300" />
                  Sincronizar Producto en Shopify
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Estado: Proceso de Carga (Loading Steps) */}
        {status === 'loading' && (
          <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                Ejecutando Flujo ETL Serverless (Netlify Function)
              </span>
              <span className="text-xs font-mono font-bold text-indigo-700">Paso {loadingStep} de 3</span>
            </div>

            <div className="space-y-2">
              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2.5 transition-all ${loadingStep >= 1 ? 'bg-white text-indigo-950 font-bold shadow-xs' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${loadingStep > 1 ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
                  {loadingStep > 1 ? '✓' : '1'}
                </div>
                <span>Extracción: Consultando AliExpress Dropshipping API con firma HMAC-SHA256</span>
              </div>

              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2.5 transition-all ${loadingStep >= 2 ? 'bg-white text-indigo-950 font-bold shadow-xs' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${loadingStep > 2 ? 'bg-emerald-500 text-white' : loadingStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  {loadingStep > 2 ? '✓' : '2'}
                </div>
                <span>Transformación: Limpieza de título, cálculo de venta (2.5x) y compare_at_price (+20%)</span>
              </div>

              <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2.5 transition-all ${loadingStep >= 3 ? 'bg-white text-indigo-950 font-bold shadow-xs' : 'text-slate-400'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${loadingStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  3
                </div>
                <span>Carga: Publicando en Shopify Admin API 2024-01 (/products.json)</span>
              </div>
            </div>
          </div>
        )}

        {/* Estado: Error */}
        {status === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2 animate-in fade-in">
            <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>Fallo en la Sincronización de Dropshipping</span>
            </div>
            <p className="text-xs text-red-700 leading-relaxed pl-6">
              {errorMessage}
            </p>
            <div className="pl-6 pt-1 flex items-center gap-3">
              <button
                type="button"
                onClick={handleSync}
                className="text-xs font-bold text-red-800 hover:text-red-950 underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Reintentar
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}

        {/* Estado: Éxito (Success Card) */}
        {status === 'success' && resultData && (
          <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-5 animate-in zoom-in-95">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-200/80 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-emerald-950 uppercase tracking-tight">
                      ¡Producto Publicado Exitosamente en Shopify!
                    </h3>
                    <Badge variant="green" className="text-[10px]">2024-01 Live</Badge>
                  </div>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    ID Shopify: <span className="font-mono font-bold">{resultData.shopifyProduct?.id}</span> · AliExpress ID: <span className="font-mono font-bold">{resultData.aliExpress?.productId}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {resultData.shopifyProduct?.adminUrl && (
                  <a
                    href={resultData.shopifyProduct.adminUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
                  >
                    <span>Ver en Shopify Admin</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <Button variant="outline" size="sm" onClick={handleReset} className="h-8 text-xs bg-white">
                  Sincronizar Otro
                </Button>
              </div>
            </div>

            {/* Ficha del Producto y Desglose Financiero */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Información y Título Limpio */}
              <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-emerald-100 space-y-3 shadow-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Título Limpio en Shopify
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">
                    {resultData.shopifyProduct?.title}
                  </h4>
                </div>

                {resultData.aliExpress?.originalTitle && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-600 block mb-0.5">Título Original de AliExpress:</span>
                    <span className="line-clamp-2">{resultData.aliExpress.originalTitle}</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                    <span>{resultData.aliExpress?.imagesCount || 1} imágenes mapeadas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>Stock: {resultData.aliExpress?.inventory || 100} un.</span>
                  </div>
                </div>
              </div>

              {/* Métricas de Precios & Rentabilidad */}
              <div className="bg-white p-4 rounded-xl border border-emerald-100 space-y-3 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Estructura Financiera (AutoDS)
                </span>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Costo AliExpress:</span>
                    <span className="font-mono font-bold text-slate-700">${resultData.pricing?.originalPrice?.toFixed(2)} USD</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Precio Venta (2.5x):</span>
                    <span className="font-mono font-bold text-indigo-600 text-sm">${resultData.pricing?.sellingPrice} USD</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Precio Tachado (+20%):</span>
                    <span className="font-mono font-bold text-slate-400 line-through">${resultData.pricing?.compareAtPrice} USD</span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-950">Ganancia Estimada:</span>
                    <span className="font-mono font-black text-emerald-600 text-sm">
                      +${resultData.pricing?.estimatedProfit?.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
