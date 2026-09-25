import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target,
  Sparkles,
  Zap,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Award,
  Layers,
  Flame,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../lib/api';

/**
 * Product Intelligence Engine (Dropshipping & Amazon KDP).
 * Análisis comercial, generación de ángulos, hooks y matriz de certezas.
 */
export function ProductIntelligence({ onProductSaved }) {
  const navigate = useNavigate();
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
  const [savedFeedback, setSavedFeedback] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
            productName:
              productInputs.productName ||
              (productMode === 'kdp'
                ? analyzedProduct.kdpData?.suggestedTitle
                : 'Producto Analizado'),
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
        setSavedFeedback('¡Producto y análisis guardados con éxito en la Product Library!');
        if (onProductSaved) onProductSaved(res.product);
        setTimeout(() => setSavedFeedback(null), 4000);
      }
    } catch (err) {
      console.warn('[SAVE_PRODUCT] Error:', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Feedback Banner */}
      {savedFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200 gap-2">
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

        <span className="text-[11px] font-mono text-slate-400 px-2">
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
                className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs"
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
                className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Categoría</label>
              <input
                type="text"
                value={productInputs.category}
                onChange={(e) => setProductInputs({ ...productInputs, category: e.target.value })}
                className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mercado Objetivo</label>
              <input
                type="text"
                value={productInputs.market}
                onChange={(e) => setProductInputs({ ...productInputs, market: e.target.value })}
                className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-bold text-slate-700 mb-1">P. Venta ($)</label>
                <input
                  type="number"
                  value={productInputs.salePrice}
                  onChange={(e) => setProductInputs({ ...productInputs, salePrice: Number(e.target.value) })}
                  className="w-full h-9 px-2 border border-brand-border rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Costo ($)</label>
                <input
                  type="number"
                  value={productInputs.cost}
                  onChange={(e) => setProductInputs({ ...productInputs, cost: Number(e.target.value) })}
                  className="w-full h-9 px-2 border border-brand-border rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Envío ($)</label>
                <input
                  type="number"
                  value={productInputs.shippingCost}
                  onChange={(e) => setProductInputs({ ...productInputs, shippingCost: Number(e.target.value) })}
                  className="w-full h-9 px-2 border border-brand-border rounded-lg font-mono text-xs"
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
                className="w-full p-2.5 border border-brand-border rounded-lg text-xs"
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
                className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Palabra Clave Principal</label>
              <input
                type="text"
                value={productInputs.mainKeyword}
                onChange={(e) => setProductInputs({ ...productInputs, mainKeyword: e.target.value })}
                className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Audiencia Objetivo</label>
              <input
                type="text"
                value={productInputs.audience}
                onChange={(e) => setProductInputs({ ...productInputs, audience: e.target.value })}
                className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Marketplace Amazon</label>
              <input
                type="text"
                value={productInputs.marketplace}
                onChange={(e) => setProductInputs({ ...productInputs, marketplace: e.target.value })}
                className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-bold text-slate-700 mb-1">Concepto / Contenido del Libro</label>
              <textarea
                rows={2}
                value={productInputs.concept}
                onChange={(e) => setProductInputs({ ...productInputs, concept: e.target.value })}
                className="w-full p-2.5 border border-brand-border rounded-lg text-xs"
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
                    {analyzedProduct.classification?.toUpperCase() || 'PRODUCTO'}
                  </span>
                  <h3 className="text-base font-black text-white">
                    {productMode === 'kdp'
                      ? analyzedProduct.kdpData?.suggestedTitle
                      : (productInputs.productName || 'Producto Analizado')}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Nivel de Confianza IA: {Math.round((analyzedProduct.scores?.confidenceScore || 0.85) * 100)}% | Versión: v{analyzedProduct.analysisVersion || '1.0'}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block">ANIMA Product Score</span>
                  <strong className="text-3xl font-black font-mono text-emerald-400">
                    {analyzedProduct.scores?.overallScore || 0}/100
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
              {Object.entries(analyzedProduct.scores?.subscores || {}).map(([key, val]) => (
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
  );
}
