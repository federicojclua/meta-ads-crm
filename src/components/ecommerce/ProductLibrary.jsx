import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, ArrowRight, Package } from 'lucide-react';
import { Button } from '../ui/Button';
import { formatNumber } from '../../lib/utils';

/**
 * Product Library: Memoria Histórica de Productos Analizados y Validados.
 */
export function ProductLibrary({ productsList = [] }) {
  const navigate = useNavigate();

  return (
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
        <span className="text-xs font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
          {productsList.length} Productos Guardados
        </span>
      </div>

      {productsList.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-brand-border text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto text-slate-400">
            <Package className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            No hay productos en la biblioteca aún. Analizá un producto en "Product Intelligence" o seleccioná uno en el "Radar" para guardarlo acá.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {productsList.map((prod) => (
            <div
              key={prod.id || prod.productName}
              className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-3 text-xs"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    prod.status === 'validated_winner'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-violet-100 text-violet-800 border-violet-200'
                  }`}
                >
                  {prod.status || 'ANALYZED'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(prod.sourceType || 'DROPSHIPPING').toUpperCase()}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-brand-text-primary text-sm">{prod.productName}</h3>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  {prod.category} · {prod.market}
                </span>
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
      )}
    </div>
  );
}
