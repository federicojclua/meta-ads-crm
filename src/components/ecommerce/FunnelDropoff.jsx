import React from 'react';
import { BarChart3, TrendingDown, ArrowDownRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatNumber } from '../../lib/utils';

/**
 * Visualización del Embudo de E-Commerce & Análisis de Fricción / Drop-off.
 */
export function FunnelDropoff({ funnelData }) {
  const defaultSteps = [
    { step: 'view_item', label: 'Vista de Producto (view_item)', count: 12450, conversionFromInitial: 100, dropoffFromPrevious: 0 },
    { step: 'add_to_cart', label: 'Añadido al Carrito (add_to_cart)', count: 3860, conversionFromInitial: 31.0, dropoffFromPrevious: 69.0 },
    { step: 'begin_checkout', label: 'Inicio de Checkout (begin_checkout)', count: 1940, conversionFromInitial: 15.6, dropoffFromPrevious: 49.7 },
    { step: 'add_payment_info', label: 'Datos de Pago (add_payment_info)', count: 820, conversionFromInitial: 6.6, dropoffFromPrevious: 57.7 },
    { step: 'purchase', label: 'Compra Finalizada (purchase)', count: 540, conversionFromInitial: 4.34, dropoffFromPrevious: 34.1 },
  ];

  const steps = funnelData && funnelData.length > 0 ? funnelData : defaultSteps;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-2">
          <div>
            <h3 className="text-sm font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-600" />
              <span>Visualización del Embudo de E-Commerce & Drop-off</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Análisis de caída entre pasos críticos del proceso de compra para identificar fugas de conversión.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            5 Fases del Embudo
          </span>
        </div>

        <div className="space-y-3">
          {steps.map((st, i) => {
            const isFirst = i === 0;
            const isLast = i === steps.length - 1;
            const hasSevereDrop = st.dropoffFromPrevious > 50;

            return (
              <div
                key={i}
                className="p-4 bg-slate-50 hover:bg-slate-100/70 transition-colors rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                    isLast 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <strong className="text-brand-text-primary block text-sm font-bold">
                      {st.label || st.step}
                    </strong>
                    <span className="text-slate-500 font-mono text-[11px]">
                      {formatNumber(st.count)} eventos registrados
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 font-mono text-right shrink-0">
                  <div className="w-24">
                    <span className="text-[10px] text-slate-400 block uppercase">Conv. Global</span>
                    <strong className="text-emerald-700 text-sm font-black">
                      {st.conversionFromInitial}%
                    </strong>
                  </div>
                  {!isFirst && (
                    <div className="w-24">
                      <span className="text-[10px] text-slate-400 block uppercase">Caída de Paso</span>
                      <strong className={`text-sm font-black flex items-center justify-end gap-0.5 ${
                        hasSevereDrop ? 'text-rose-600' : 'text-amber-600'
                      }`}>
                        <ArrowDownRight className="w-3.5 h-3.5" />
                        -{st.dropoffFromPrevious}%
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Diagnostic Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-900 block font-bold">Mayor Punto de Fuga: Carrito → Checkout</strong>
              <p className="text-rose-700 text-[11px] mt-0.5">
                El 69% de usuarios abandona tras agregar productos al carrito. Se recomienda añadir envío gratis visible o botón de compra directa 1-clic.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-emerald-900 block font-bold">Checkout → Compra: Tasa Estable</strong>
              <p className="text-emerald-700 text-[11px] mt-0.5">
                La conversión final de checkout a compra finalizada (4.34% global) se mantiene por encima del promedio de la industria (2.5% - 3.5%).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
