import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Calculator,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  X,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export function OfferEnginePanel({ product = null, onClose = () => {}, onOfferActivated = () => {} }) {
  if (!product) return null;

  const [costStructure, setCostStructure] = useState({
    cogs: product.costStructure?.cogs || Math.round(product.price * 0.55),
    gatewayFeePercent: product.costStructure?.gatewayFeePercent || 3.5,
    shippingCost: product.costStructure?.shippingCost || 8500,
    estimatedCpa: product.costStructure?.estimatedCpa || 32000,
    otherUnitCosts: product.costStructure?.otherUnitCosts || 0,
    targetMinMarginPercent: product.costStructure?.targetMinMarginPercent || 15,
  });

  const [profitBreakdown, setProfitBreakdown] = useState(null);
  const [isCalculatingProfit, setIsCalculatingProfit] = useState(false);
  const [architecture, setArchitecture] = useState(null);
  const [isGeneratingOffers, setIsGeneratingOffers] = useState(false);
  const [activeOfferId, setActiveOfferId] = useState(product.activeOffer?.offerId || 'offer_b');
  const [successBanner, setSuccessBanner] = useState(null);

  // 1. Live Profit Calculation
  const calculateProfit = async () => {
    setIsCalculatingProfit(true);
    try {
      const res = await apiClient('/api/offers/calculate-profit', {
        method: 'POST',
        body: JSON.stringify({
          price: product.price,
          costStructure,
        }),
      });
      if (res?.profit) {
        setProfitBreakdown(res.profit);
      }
    } catch (err) {
      console.warn('[OFFER_PANEL] Error calculating profit:', err.message);
    } finally {
      setIsCalculatingProfit(false);
    }
  };

  useEffect(() => {
    calculateProfit();
  }, [costStructure, product.price]);

  // 2. Fetch or Generate Offers
  const handleGenerateOffers = async () => {
    setIsGeneratingOffers(true);
    setSuccessBanner(null);
    try {
      const res = await apiClient('/api/offers/generate', {
        method: 'POST',
        body: JSON.stringify({
          product,
          costStructure,
        }),
      });
      if (res?.architecture) {
        setArchitecture(res.architecture);
        if (res.architecture.activeOfferId) {
          setActiveOfferId(res.architecture.activeOfferId);
        }
      }
    } catch (err) {
      console.warn('[OFFER_PANEL] Error generating offers:', err.message);
    } finally {
      setIsGeneratingOffers(false);
    }
  };

  // 3. Activate Offer
  const handleActivateOffer = async (offerId) => {
    try {
      const res = await apiClient('/api/offers/activate', {
        method: 'POST',
        body: JSON.stringify({
          productId: product.id || product._id,
          offerId,
        }),
      });
      if (res?.ok) {
        setActiveOfferId(offerId);
        setSuccessBanner('¡Oferta activada e inyectada exitosamente al Creative Studio!');
        onOfferActivated(offerId);
      }
    } catch (err) {
      console.warn('[OFFER_PANEL] Error activating offer:', err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
      <div className="bg-white border border-brand-border rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-brand-border flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center border border-violet-200">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-brand-text-primary uppercase tracking-wider">
                Offer Engine & E-Commerce True Profit
              </h2>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Producto: <span className="font-bold text-slate-800">{product.name}</span> (${product.price?.toLocaleString()} ARS)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {successBanner && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Section 1: Cost Structure Inputs & True Profit Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cost Structure Form */}
            <div className="lg:col-span-1 bg-slate-50 p-5 rounded-xl border border-brand-border space-y-3.5">
              <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-slate-600" />
                <span>Estructura de Costos Unitarios</span>
              </h3>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">COGS / Costo Producto ($)</label>
                <input
                  type="number"
                  value={costStructure.cogs}
                  onChange={(e) => setCostStructure({ ...costStructure, cogs: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pasarela Pago (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={costStructure.gatewayFeePercent}
                    onChange={(e) => setCostStructure({ ...costStructure, gatewayFeePercent: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Envío Logístico ($)</label>
                  <input
                    type="number"
                    value={costStructure.shippingCost}
                    onChange={(e) => setCostStructure({ ...costStructure, shippingCost: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">CPA Estimado Meta ($)</label>
                  <input
                    type="number"
                    value={costStructure.estimatedCpa}
                    onChange={(e) => setCostStructure({ ...costStructure, estimatedCpa: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Margen Mínimo (%)</label>
                  <input
                    type="number"
                    value={costStructure.targetMinMarginPercent}
                    onChange={(e) => setCostStructure({ ...costStructure, targetMinMarginPercent: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 bg-white border border-brand-border rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* True Profit Dashboard Card */}
            <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-xl border border-indigo-800/40 shadow-lg flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-widest flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Desglose de True Profit (Aritmética Determinista)</span>
                  </span>
                  {profitBreakdown && (
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${
                        profitBreakdown.healthStatus === 'HEALTHY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : profitBreakdown.healthStatus === 'MODERATE'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                      }`}
                    >
                      {profitBreakdown.healthStatus}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Precio de Venta</span>
                    <span className="text-lg font-black font-mono text-white">${product.price?.toLocaleString()}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Costo Total Unitario</span>
                    <span className="text-lg font-black font-mono text-rose-300">
                      ${profitBreakdown?.totalUnitCost?.toLocaleString() || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">True Profit ($)</span>
                    <span className="text-xl font-black font-mono text-emerald-400">
                      ${profitBreakdown?.trueProfitAmount?.toLocaleString() || '-'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block font-mono">Margen Neto Real</span>
                    <span className="text-xl font-black font-mono text-emerald-300">
                      {profitBreakdown?.trueProfitMarginPct}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-indigo-900/60 flex items-center justify-between text-xs">
                <span className="text-slate-300">
                  Descuento Máximo Seguro: <span className="font-bold text-amber-300">{profitBreakdown?.maxDiscountAllowedPct}%</span> (${profitBreakdown?.maxDiscountAmount?.toLocaleString()})
                </span>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGenerateOffers}
                  disabled={isGeneratingOffers}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold gap-2 text-xs h-9 px-4"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingOffers ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingOffers ? 'Orquestando Ofertas...' : 'Generar 3 Ofertas Estratégicas (A/B/C)'}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Section 2: 3 Strategic Offer Architectures (A/B/C) */}
          {architecture && (
            <div className="space-y-4 animate-in fade-in">
              <h3 className="text-sm font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-600" />
                <span>Arquitecturas de Ofertas Persuasivas</span>
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {architecture.offers.map((offer) => {
                  const isActive = offer.id === activeOfferId;
                  return (
                    <div
                      key={offer.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between space-y-4 transition-all relative ${
                        isActive
                          ? 'border-violet-600 bg-violet-50/50 shadow-md ring-2 ring-violet-500/20'
                          : 'border-brand-border bg-white hover:border-slate-300 shadow-xs'
                      }`}
                    >
                      {offer.isRecommended && (
                        <span className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs">
                          ⭐ RECOMENDADA POR MARGEN
                        </span>
                      )}

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                            {offer.type}
                          </span>
                          <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded">
                            Margen: {offer.projectedMarginPct}%
                          </span>
                        </div>

                        <h4 className="text-sm font-black text-brand-text-primary leading-tight">{offer.name}</h4>
                        <p className="text-xs font-semibold text-violet-900 bg-violet-100/50 p-2 rounded-lg">
                          "{offer.headline}"
                        </p>

                        {/* Value Add-ons */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide block">
                            Bonos de Valor Agregado:
                          </span>
                          <ul className="space-y-1">
                            {offer.valueAddons.map((addon, i) => (
                              <li key={i} className="text-[11px] text-slate-700 flex items-start gap-1.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span>{addon}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Urgency & Guarantees */}
                        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] space-y-1">
                          <p className="text-amber-900 font-medium">⚡ {offer.urgencyScarcity}</p>
                          <p className="text-slate-700">🛡️ {offer.riskReversal}</p>
                          <p className="text-slate-700 font-bold">💳 {offer.paymentTerms}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-brand-border flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-mono">True Profit Est.</span>
                          <span className="text-sm font-black font-mono text-emerald-600">
                            ${offer.projectedTrueProfit.toLocaleString()}
                          </span>
                        </div>

                        <Button
                          variant={isActive ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => handleActivateOffer(offer.id)}
                          className={`text-xs h-8 px-3 font-bold ${
                            isActive ? 'bg-violet-600 text-white' : 'border-violet-300 text-violet-800'
                          }`}
                        >
                          {isActive ? '✓ Oferta Activa' : 'Activar Oferta'}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
