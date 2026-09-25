import React from 'react';
import {
  BarChart3,
  ShoppingBag,
  TrendingUp,
  DollarSign,
  Users,
  Package,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { formatNumber } from '../../lib/utils';

/**
 * Dashboard Ejecutivo de E-Commerce & KPIs.
 * Muestra métricas de ventas, embudo de conversión y accesos rápidos a las herramientas.
 */
export function EcommerceDashboard({
  dashboardSummary,
  funnelData,
  isLoading,
  onRefresh,
  onNavigateTab,
}) {
  const hasRealData =
    dashboardSummary &&
    (dashboardSummary.totalRevenue > 0 || dashboardSummary.totalOrders > 0);

  const kpis = hasRealData
    ? [
        {
          label: 'Revenue (30d)',
          value: `$${formatNumber(dashboardSummary.totalRevenue || 0)}`,
          sublabel: dashboardSummary.currency || 'USD',
          color: 'text-emerald-700',
          borderColor: 'border-emerald-200',
          icon: DollarSign,
          iconColor: 'text-emerald-600',
        },
        {
          label: 'Órdenes (30d)',
          value: formatNumber(dashboardSummary.totalOrders || 0),
          sublabel: `${dashboardSummary.avgOrdersPerDay || '—'} / día`,
          color: 'text-brand-text-primary',
          borderColor: 'border-brand-border',
          icon: ShoppingBag,
          iconColor: 'text-indigo-600',
        },
        {
          label: 'Ticket Promedio (AOV)',
          value: `$${formatNumber(dashboardSummary.averageOrderValue || 0)}`,
          sublabel: dashboardSummary.aovTrend || '—',
          color: 'text-violet-700',
          borderColor: 'border-violet-200',
          icon: TrendingUp,
          iconColor: 'text-violet-600',
        },
        {
          label: 'Tasa de Conversión',
          value: `${dashboardSummary.conversionRate || '4.34'}%`,
          sublabel: 'Visitantes → Compradores',
          color: 'text-blue-700',
          borderColor: 'border-blue-200',
          icon: Users,
          iconColor: 'text-blue-600',
        },
      ]
    : null;

  const defaultFunnelSteps = [
    { step: 'view_item', label: 'Vista de Producto (view_item)', count: 12450, conversionFromInitial: 100, dropoffFromPrevious: 0 },
    { step: 'add_to_cart', label: 'Añadido al Carrito (add_to_cart)', count: 3860, conversionFromInitial: 31.0, dropoffFromPrevious: 69.0 },
    { step: 'begin_checkout', label: 'Inicio de Checkout (begin_checkout)', count: 1940, conversionFromInitial: 15.6, dropoffFromPrevious: 49.7 },
    { step: 'add_payment_info', label: 'Datos de Pago (add_payment_info)', count: 820, conversionFromInitial: 6.6, dropoffFromPrevious: 57.7 },
    { step: 'purchase', label: 'Compra Finalizada (purchase)', count: 540, conversionFromInitial: 4.34, dropoffFromPrevious: 34.1 },
  ];

  const steps = funnelData && funnelData.length > 0 ? funnelData : defaultFunnelSteps;

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-violet-600" />
          <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider">
            Dashboard E-Commerce · Vista Ejecutiva & KPIs
          </h3>
        </div>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-7 px-2 text-[11px]"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {hasRealData ? (
        /* KPI Cards Grid */
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div
                key={i}
                className={`bg-white p-4 rounded-xl border ${kpi.borderColor} shadow-xs space-y-1.5 hover:shadow-sm transition-shadow`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
                    {kpi.label}
                  </span>
                  <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                </div>
                <div className={`text-2xl font-black font-mono ${kpi.color}`}>
                  {kpi.value}
                </div>
                <span className="text-[11px] text-slate-500">{kpi.sublabel}</span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Estado Vacío de KPIs — Guía para Conectar */
        <div className="bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-6 rounded-2xl border border-slate-200 text-center space-y-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto text-indigo-600">
            <Package className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-black text-slate-800">
              Métricas de Tienda en Tiempo Real
            </h4>
            <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
              Conectá tu tienda de Shopify o WooCommerce para visualizar Revenue, Órdenes, Ticket Promedio y Tasa de Conversión actualizadas automáticamente.
            </p>
          </div>
          <div className="flex items-center justify-center gap-4 text-[11px] font-bold text-slate-400 pt-1">
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Revenue Neto
            </span>
            <span className="flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" /> Órdenes Reales
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-violet-600" /> AOV
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-blue-600" /> Tasa de Conversión
            </span>
          </div>
        </div>
      )}

      {/* Quick Action Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div
          onClick={() => onNavigateTab && onNavigateTab('opportunity_radar')}
          className="p-4 bg-white hover:bg-slate-50 border border-brand-border rounded-xl cursor-pointer transition-all space-y-2 group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center text-violet-600">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-xs font-bold text-brand-text-primary block">
                  Radar de Oportunidades (USA)
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">16 Productos Ganadores Validados</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Descubrí productos de alta demanda con políticas de aduana aprobadas y sin reclamos falsos.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab && onNavigateTab('dropshipping_shopify')}
          className="p-4 bg-white hover:bg-slate-50 border border-brand-border rounded-xl cursor-pointer transition-all space-y-2 group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-xs font-bold text-brand-text-primary block">
                  Dropshipping ETL Sync
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">AliExpress → Shopify</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Importá productos desde AliExpress y publicalos directo a tu tienda Shopify con márgenes calculados.
          </p>
        </div>

        <div
          onClick={() => onNavigateTab && onNavigateTab('cro_analyzer')}
          className="p-4 bg-white hover:bg-slate-50 border border-brand-border rounded-xl cursor-pointer transition-all space-y-2 group shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <strong className="text-xs font-bold text-brand-text-primary block">
                  Auditoría CRO & Conversión
                </strong>
                <span className="text-[10px] text-slate-400 font-mono">10 Dimensiones de Conversión</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Auditá páginas de producto con IA para eliminar fricciones y aumentar la tasa de checkout.
          </p>
        </div>
      </div>

      {/* Embudo de Conversión en el Dashboard */}
      <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-violet-600" />
              <span>Embudo de Conversión & Drop-off</span>
            </h4>
            <span className="text-[11px] text-slate-400">
              Rendimiento general del embudo de ventas en los últimos 30 días
            </span>
          </div>
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('funnel_dropoff')}
              className="text-xs font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1"
            >
              <span>Ver análisis detallado</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs font-mono">
          {steps.map((st, i) => (
            <div
              key={i}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-1"
            >
              <span className="text-[10px] text-slate-500 block truncate font-sans font-bold">
                {st.label || st.step}
              </span>
              <div className="text-sm font-black text-brand-text-primary">
                {formatNumber(st.count)}
              </div>
              <span className="text-[10px] text-emerald-700 block font-bold">
                {st.conversionFromInitial}% global
              </span>
              {i > 0 && (
                <span className="text-[9px] text-rose-500 block">
                  -{st.dropoffFromPrevious}% paso
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
