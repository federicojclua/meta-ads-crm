import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Target,
  Search,
  BookOpen,
  CheckCircle2,
  Zap,
  TrendingUp,
  RefreshCw,
  FileText,
  Users,
  Sparkles,
  BarChart3,
  Share2,
  Lock,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EcommerceDashboard } from '../components/ecommerce/EcommerceDashboard';
import { OpportunityRadar } from '../components/ecommerce/OpportunityRadar';
import { AliExpressShopifySync } from '../components/ecommerce/AliExpressShopifySync';
import { FunnelDropoff } from '../components/ecommerce/FunnelDropoff';
import { CroAnalyzer } from '../components/ecommerce/CroAnalyzer';
import { ProductIntelligence } from '../components/ecommerce/ProductIntelligence';
import { CustomerRetention } from '../components/ecommerce/CustomerRetention';
import { ProductLibrary } from '../components/ecommerce/ProductLibrary';
import { AutomationRules } from '../components/ecommerce/AutomationRules';
import { LockedTabPlaceholder } from '../components/ecommerce/LockedTabPlaceholder';

export function EcommerceCroPage() {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Shared Data State
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [funnelData, setFunnelData] = useState(null);
  const [productsList, setProductsList] = useState([]);
  const [customersList, setCustomersList] = useState([]);
  const [ltvData, setLtvData] = useState(null);
  const [retentionRules, setRetentionRules] = useState([]);
  const [retentionEvents, setRetentionEvents] = useState([]);
  const [crossSellRecs, setCrossSellRecs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDispatching, setIsDispatching] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [dashRes, prodRes, custRes, ltvRes, rulesRes, eventsRes, crossRes, funRes] =
        await Promise.all([
          apiClient('/api/ecommerce/dashboard'),
          apiClient('/api/ecommerce/products'),
          apiClient('/api/ecommerce/customers'),
          apiClient('/api/ecommerce/ltv'),
          apiClient('/api/ecommerce/retention-rules'),
          apiClient('/api/ecommerce/retention-events'),
          apiClient('/api/ecommerce/cross-sell?productName=Notebook'),
          apiClient('/api/ecommerce/funnel'),
        ]);

      if (dashRes?.summary) setDashboardSummary(dashRes.summary);
      if (prodRes?.products) setProductsList(prodRes.products);
      if (custRes?.customers) setCustomersList(custRes.customers);
      if (ltvRes?.ltv) setLtvData(ltvRes.ltv);
      if (rulesRes?.rules) setRetentionRules(rulesRes.rules);
      if (eventsRes?.events) setRetentionEvents(eventsRes.events);
      if (crossRes?.recommendations) setCrossSellRecs(crossRes.recommendations);
      if (funRes?.funnel) setFunnelData(funRes.funnel);
    } catch (err) {
      console.warn('[ECOMMERCE_INTELLIGENCE] Error loading data:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [userProfile?.clientId]);

  const handleDispatchRetention = async () => {
    setIsDispatching(true);
    try {
      const res = await apiClient('/api/ecommerce/retention/dispatch', {
        method: 'POST',
      });
      if (res?.ok) {
        setNotification(
          `¡Automatizaciones evaluadas! ${res.sentCount} enviadas, ${res.blockedCount} bloqueadas por reglas de seguridad.`
        );
        fetchAllData();
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err) {
      console.warn('[DISPATCH_RETENTION] Error:', err.message);
    } finally {
      setIsDispatching(false);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard KPIs', icon: BarChart3, category: 'core' },
    { id: 'opportunity_radar', label: '🎯 Radar Oportunidades (USA)', icon: Sparkles, category: 'discovery' },
    { id: 'dropshipping_shopify', label: '🛍️ Dropshipping (AliExpress → Shopify)', icon: ShoppingBag, category: 'discovery' },
    { id: 'funnel_dropoff', label: 'Embudo & Drop-off', icon: BarChart3, category: 'cro' },
    { id: 'cro_analyzer', label: 'Auditoría UI/UX & Agente CRO', icon: Search, category: 'cro' },
    { id: 'product_intelligence', label: '🎯 Product Intelligence', icon: Sparkles, category: 'intelligence' },
    { id: 'retention', label: '👥 Customer Retention', icon: Users, category: 'retention' },
    { id: 'product_library', label: '📚 Product Library', icon: BookOpen, category: 'intelligence' },
    { id: 'automation', label: '⚡ Automation & Rules', icon: Zap, category: 'retention' },
    { id: 'meta_catalog', label: 'Meta Ads Catálogo & Llamadas', icon: Target, isLocked: true },
    { id: 'affiliates', label: 'Afiliados & Margen Neto Real', icon: Share2, isLocked: true },
    { id: 'reports', label: '📊 Reports', icon: FileText, category: 'reports' },
  ];

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

      {/* Global Notification Banner */}
      {notification && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Modern Tabs Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-200 no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {tab.isLocked ? (
                <Lock className="w-3 h-3 text-amber-500" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              <span>{tab.label}</span>
              {tab.isLocked && (
                <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded font-mono font-medium">
                  Pronto
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content Display */}
      {activeTab === 'dashboard' && (
        <EcommerceDashboard
          dashboardSummary={dashboardSummary}
          funnelData={funnelData}
          isLoading={isLoading}
          onRefresh={fetchAllData}
          onNavigateTab={setActiveTab}
        />
      )}

      {activeTab === 'opportunity_radar' && <OpportunityRadar />}

      {activeTab === 'dropshipping_shopify' && <AliExpressShopifySync />}

      {activeTab === 'funnel_dropoff' && <FunnelDropoff funnelData={funnelData} />}

      {activeTab === 'cro_analyzer' && <CroAnalyzer />}

      {activeTab === 'product_intelligence' && (
        <ProductIntelligence
          onProductSaved={(newProd) => setProductsList((prev) => [newProd, ...prev])}
        />
      )}

      {activeTab === 'retention' && (
        <CustomerRetention
          customersList={customersList}
          crossSellRecs={crossSellRecs}
          ltvData={ltvData}
        />
      )}

      {activeTab === 'product_library' && <ProductLibrary productsList={productsList} />}

      {activeTab === 'automation' && (
        <AutomationRules
          retentionRules={retentionRules}
          retentionEvents={retentionEvents}
          onDispatchRetention={handleDispatchRetention}
          isDispatching={isDispatching}
        />
      )}

      {activeTab === 'meta_catalog' && (
        <LockedTabPlaceholder
          title="Meta Ads Catálogo & Llamadas"
          description="Sincronización directa con Advantage+ Shopping Campaigns y catálogo dinámico de productos desde tu e-commerce."
          plannedFeatures={[
            'Sincronización automática de feeds XML/CSV con Meta Commerce Manager',
            'Generación de conjuntos de anuncios dinámicos por categorías de producto',
            'Campañas de llamada directa para cierre de ventas de alto valor por WhatsApp',
            'Atribución de conversión offline mediante Conversions API (CAPI)',
          ]}
          version="v2.4"
        />
      )}

      {activeTab === 'affiliates' && (
        <LockedTabPlaceholder
          title="Afiliados & Margen Neto Real"
          description="Atribución multi-canal, comisiones de creadores de contenido y cálculo de True Profit neto deduciendo COGS y pauta publicitaria."
          plannedFeatures={[
            'Tracking de cupones de descuento y enlaces UTM por influencer',
            'Liquidación automática de comisiones y reporte de rentabilidad neta',
            'Cálculo de margen de contribución real restando costo de producto y Meta Ads',
            'Portal de afiliados con acceso restringido para creadores',
          ]}
          version="v2.4"
        />
      )}

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
              <strong className="text-sm text-brand-text-primary block">
                Informe de Auditoría CRO & Conversión
              </strong>
              <p className="text-slate-600 text-[11px]">
                Diagnóstico completo de 10 dimensiones con matriz de Quick Wins y recomendaciones de A/B testing para compartir con el cliente.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('cro_analyzer')}
                className="text-xs h-8"
              >
                Ir a CRO Analyzer
              </Button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <strong className="text-sm text-brand-text-primary block">
                Informe de LTV & Retención de Compradores
              </strong>
              <p className="text-slate-600 text-[11px]">
                Reporte de recompra, LTV real vs proyectado y retorno de inversión en secuencias de WhatsApp automáticas.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('retention')}
                className="text-xs h-8"
              >
                Ver Cohortes de Retención
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
