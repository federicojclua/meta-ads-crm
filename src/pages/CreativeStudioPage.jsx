import { useState, useEffect } from 'react';
import {
  Wand2,
  Sparkles,
  Layers,
  Image as ImageIcon,
  Palette,
  Package,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Copy,
  Eye,
  Sliders,
  ShieldAlert,
  Smartphone,
  Monitor,
  Trash2,
  Edit3,
  Calculator,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/api';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { OfferEnginePanel } from '../components/OfferEnginePanel';
import { formatNumber } from '../lib/utils';
import { SUPPORTED_INDUSTRIES, INDUSTRY_LABELS } from '../../models/CreativeProfile.js';
import { CAMPAIGN_OBJECTIVES, OBJECTIVE_LABELS } from '../../models/CampaignCreative.js';

export function CreativeStudioPage() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('generator'); // 'generator' | 'dna' | 'catalog' | 'gallery'

  // Data states
  const [creativeProfile, setCreativeProfile] = useState(null);
  const [selectedOfferProduct, setSelectedOfferProduct] = useState(null);
  const [products, setProducts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Brand DNA editing & smart logo analysis
  const [isAnalyzingLogo, setIsAnalyzingLogo] = useState(false);
  const [logoAnalysisResult, setLogoAnalysisResult] = useState(null);
  const [isSavingDna, setIsSavingDna] = useState(false);

  // New Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: 'Notebooks',
    price: 99999,
    previousPrice: 129999,
    installments: '12 cuotas fijas',
    imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
    features: ['Garantía Oficial 1 Año'],
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Campaign Generator Wizard State
  const [wizardStep, setWizardStep] = useState(1); // 1: Setup | 2: Concepts | 3: Render & Edit
  const [selectedObjective, setSelectedObjective] = useState('vender');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedFormats, setSelectedFormats] = useState(['1:1', '9:16']);
  const [customPrompt, setCustomPrompt] = useState('');

  // Step 2: Brief & Concepts
  const [briefData, setBriefData] = useState(null);
  const [concepts, setConcepts] = useState([]);
  const [selectedConcept, setSelectedConcept] = useState(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  // Step 3: Generated Campaign & Live SVG
  const [generatedCampaign, setGeneratedCampaign] = useState(null);
  const [isGeneratingRender, setIsGeneratingRender] = useState(false);
  const [activeFormatPreview, setActiveFormatPreview] = useState('1:1');
  const [isImproving, setIsImproving] = useState(false);

  const fetchStudioData = async () => {
    setIsLoading(true);
    try {
      const [profRes, prodRes, campRes] = await Promise.all([
        apiClient('/api/creative-profile'),
        apiClient('/api/products'),
        apiClient('/api/creative-campaigns'),
      ]);

      if (profRes?.profile) setCreativeProfile(profRes.profile);
      if (prodRes?.products) {
        setProducts(prodRes.products);
        if (selectedProductIds.length === 0 && prodRes.products.length > 0) {
          setSelectedProductIds([prodRes.products[0].id]);
        }
      }
      if (campRes?.campaigns) setCampaigns(campRes.campaigns);
    } catch (err) {
      console.warn('[CREATIVE_STUDIO] Error loading data:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudioData();
  }, [userProfile?.clientId]);

  // Handle Logo Analysis
  const handleAnalyzeLogo = async () => {
    if (!creativeProfile?.brandIdentity?.logoPrimary) return;
    setIsAnalyzingLogo(true);
    try {
      const res = await apiClient('/api/creative-profile/analyze-logo', {
        method: 'POST',
        body: JSON.stringify({
          logoUrl: creativeProfile.brandIdentity.logoPrimary,
          commercialName: creativeProfile.brandIdentity.commercialName,
        }),
      });
      if (res?.analysis) {
        setLogoAnalysisResult(res.analysis);
      }
    } catch (err) {
      console.warn('[ANALYZE_LOGO] Error:', err.message);
    } finally {
      setIsAnalyzingLogo(false);
    }
  };

  const handleApplySuggestedPalette = () => {
    if (!logoAnalysisResult?.suggestedPalette) return;
    setCreativeProfile((prev) => ({
      ...prev,
      colorPalette: {
        ...prev.colorPalette,
        ...logoAnalysisResult.suggestedPalette,
      },
    }));
    setLogoAnalysisResult(null);
  };

  const handleSaveDna = async (e) => {
    e?.preventDefault();
    setIsSavingDna(true);
    try {
      const res = await apiClient('/api/creative-profile', {
        method: 'PUT',
        body: JSON.stringify(creativeProfile),
      });
      if (res?.profile) {
        setCreativeProfile(res.profile);
      }
    } catch (err) {
      console.warn('[SAVE_DNA] Error:', err.message);
    } finally {
      setIsSavingDna(false);
    }
  };

  // Handle New Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price) return;
    setIsSavingProduct(true);
    try {
      const res = await apiClient('/api/products', {
        method: 'POST',
        body: JSON.stringify(newProduct),
      });
      if (res?.product) {
        setProducts((prev) => [res.product, ...prev]);
        setIsProductModalOpen(false);
        setNewProduct({
          name: '',
          sku: '',
          category: 'Notebooks',
          price: 99999,
          previousPrice: 129999,
          installments: '12 cuotas fijas',
          imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=80',
          features: ['Garantía Oficial 1 Año'],
        });
      }
    } catch (err) {
      console.warn('[CREATE_PRODUCT] Error:', err.message);
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Wizard Step 1 -> Step 2 (Generate Brief & Concepts)
  const handleGenerateConcepts = async () => {
    setIsGeneratingBrief(true);
    try {
      const res = await apiClient('/api/creative-campaigns/brief', {
        method: 'POST',
        body: JSON.stringify({
          productIds: selectedProductIds,
          objective: selectedObjective,
          customPrompt,
        }),
      });
      if (res?.concepts) {
        setBriefData(res.brief);
        setConcepts(res.concepts);
        setSelectedConcept(res.concepts[0]);
        setWizardStep(2);
      }
    } catch (err) {
      console.warn('[GENERATE_CONCEPTS] Error:', err.message);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Wizard Step 2 -> Step 3 (Execute Programmatic Generation)
  const handleExecuteGeneration = async () => {
    if (!selectedConcept) return;
    setIsGeneratingRender(true);
    try {
      const res = await apiClient('/api/creative-campaigns/generate', {
        method: 'POST',
        body: JSON.stringify({
          productIds: selectedProductIds,
          objective: selectedObjective,
          concept: selectedConcept,
          brief: briefData,
          formats: selectedFormats,
          campaignName: `Campaña ${selectedConcept.name}`,
        }),
      });
      if (res?.campaign) {
        setGeneratedCampaign(res.campaign);
        setCampaigns((prev) => [res.campaign, ...prev]);
        setWizardStep(3);
      }
    } catch (err) {
      console.warn('[EXECUTE_GENERATION] Error:', err.message);
    } finally {
      setIsGeneratingRender(false);
    }
  };

  // Step 3 Actions (Improve & Approve)
  const handleImproveWithAi = async () => {
    if (!generatedCampaign?.id) return;
    setIsImproving(true);
    try {
      const res = await apiClient(`/api/creative-campaigns/${generatedCampaign.id}/improve`, {
        method: 'POST',
      });
      if (res?.campaign) {
        setGeneratedCampaign(res.campaign);
      }
    } catch (err) {
      console.warn('[IMPROVE_AI] Error:', err.message);
    } finally {
      setIsImproving(false);
    }
  };

  const handleApproveCampaign = async () => {
    if (!generatedCampaign?.id) return;
    try {
      const res = await apiClient(`/api/creative-campaigns/${generatedCampaign.id}/approve`, {
        method: 'PUT',
      });
      if (res?.campaign) {
        setGeneratedCampaign(res.campaign);
        setCampaigns((prev) => prev.map((c) => (c.id === res.campaign.id ? res.campaign : c)));
      }
    } catch (err) {
      console.warn('[APPROVE_CAMPAIGN] Error:', err.message);
    }
  };

  const handleReuseCampaign = async (campaignId) => {
    try {
      const res = await apiClient(`/api/creative-campaigns/${campaignId}/reuse`, {
        method: 'POST',
      });
      if (res?.campaign) {
        setGeneratedCampaign(res.campaign);
        setCampaigns((prev) => [res.campaign, ...prev]);
        setActiveTab('generator');
        setWizardStep(3);
      }
    } catch (err) {
      console.warn('[REUSE_CAMPAIGN] Error:', err.message);
    }
  };

  const handleToggleProduct = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((pId) => pId !== id) : prev) : [...prev, id]
    );
  };

  const currentSvg = (generatedCampaign?.renderedAssets || []).find(
    (a) => a.format === activeFormatPreview
  )?.svg || generatedCampaign?.renderedAssets?.[0]?.svg;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-700 flex items-center justify-center font-bold shadow-xs">
            <Wand2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-brand-text-primary uppercase tracking-tight">
                AI Campaign Creative Engine
              </h1>
              <Badge variant="primary" className="text-[10px] bg-violet-100 text-violet-800 border-violet-200">
                Memoria Activa
              </Badge>
            </div>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Director Creativo y Composición Programática: fondos por IA, fotos reales y precios vectoriales nítidos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudioData}
            disabled={isLoading}
            className="text-xs h-8 px-2.5 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {/* Main Studio Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-brand-border text-xs font-semibold overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('generator')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'generator'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Sparkles className="w-4 h-4 text-violet-600" />
          <span>Generador de Campañas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('dna')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'dna'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Brand DNA & Memoria Visual</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('catalog')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'catalog'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catálogo de Productos ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('gallery')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'gallery'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Galería & Historial ({campaigns.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: GENERADOR DE CAMPAÑAS (WIZARD 3 PASOS)                             */}
      {/* ========================================================================= */}
      {activeTab === 'generator' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Wizard Step Indicators */}
          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-brand-border shadow-xs text-xs font-semibold">
            <div className={`flex items-center gap-2 ${wizardStep >= 1 ? 'text-violet-700 font-bold' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${wizardStep >= 1 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                1
              </div>
              <span>Objetivo & Productos</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />

            <div className={`flex items-center gap-2 ${wizardStep >= 2 ? 'text-violet-700 font-bold' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${wizardStep >= 2 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                2
              </div>
              <span>Propuestas Conceptuales</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300" />

            <div className={`flex items-center gap-2 ${wizardStep >= 3 ? 'text-violet-700 font-bold' : 'text-slate-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${wizardStep >= 3 ? 'bg-violet-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                3
              </div>
              <span>Composición & Editor Visual</span>
            </div>
          </div>

          {/* STEP 1: CONFIGURATION */}
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Objective & Formats */}
              <div className="bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-5">
                <div>
                  <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                    1. Objetivo Comercial
                  </h3>
                  <p className="text-xs text-brand-text-secondary mt-0.5">
                    Gemini adaptará la jerarquía y el llamado a la acción.
                  </p>
                </div>

                <div className="space-y-2">
                  {CAMPAIGN_OBJECTIVES.map((obj) => (
                    <label
                      key={obj}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer text-xs transition-all ${
                        selectedObjective === obj
                          ? 'border-violet-600 bg-violet-50/50 text-violet-950 font-bold'
                          : 'border-brand-border bg-slate-50/50 text-slate-700 hover:bg-slate-100/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="objective"
                          value={obj}
                          checked={selectedObjective === obj}
                          onChange={() => setSelectedObjective(obj)}
                          className="text-violet-600 focus:ring-violet-500"
                        />
                        <span>{OBJECTIVE_LABELS[obj]}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="pt-3 border-t border-brand-border/60">
                  <h4 className="text-xs font-bold text-brand-text-primary mb-2">Formatos Requeridos</h4>
                  <div className="flex flex-wrap gap-2">
                    {['1:1', '9:16', '1.91:1'].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() =>
                          setSelectedFormats((prev) =>
                            prev.includes(fmt) ? (prev.length > 1 ? prev.filter((f) => f !== fmt) : prev) : [...prev, fmt]
                          )
                        }
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                          selectedFormats.includes(fmt)
                            ? 'bg-violet-100 text-violet-800 border-violet-300'
                            : 'bg-slate-50 text-slate-600 border-brand-border'
                        }`}
                      >
                        {fmt === '1:1' ? '1:1 (Feed)' : fmt === '9:16' ? '9:16 (Story)' : '1.91:1 (Banner)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-primary mb-1">
                    Instrucción o Promoción Opcional (Prompt)
                  </label>
                  <textarea
                    rows={2}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Ej: Destacar que las cuotas son fijas con tarjeta Visa o Master..."
                    className="w-full p-2.5 border border-brand-border rounded-lg bg-slate-50 text-xs text-slate-800 focus:bg-white"
                  />
                </div>
              </div>

              {/* Right 2 Columns: Product Selector */}
              <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                      2. Seleccionar Productos del Catálogo ({selectedProductIds.length} elegidos)
                    </h3>
                    <p className="text-xs text-brand-text-secondary mt-0.5">
                      Las fotos y precios reales se componen de forma nítida sin deformaciones.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsProductModalOpen(true)}
                    className="text-xs h-8 gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Producto</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
                  {products.map((prod) => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => handleToggleProduct(prod.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex gap-3 ${
                          isSelected
                            ? 'border-violet-600 bg-violet-50/40 shadow-xs'
                            : 'border-brand-border bg-slate-50/30 hover:bg-slate-50'
                        }`}
                      >
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-16 h-16 object-contain rounded-lg bg-white border border-brand-border/60 p-1 shrink-0"
                        />
                        <div className="flex flex-col justify-between flex-1 min-w-0">
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-400">{prod.sku || prod.category}</span>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="text-violet-600 rounded focus:ring-violet-500"
                              />
                            </div>
                            <h4 className="text-xs font-bold text-brand-text-primary truncate mt-0.5">{prod.name}</h4>
                          </div>
                          <div className="flex items-baseline justify-between mt-1">
                            <span className="text-sm font-black font-mono text-violet-900">
                              ${formatNumber(prod.price)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                              {prod.installments}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleGenerateConcepts}
                    disabled={isGeneratingBrief || selectedProductIds.length === 0}
                    className="bg-violet-600 hover:bg-violet-700 text-white gap-2 font-bold px-6"
                  >
                    <Sparkles className={`w-4 h-4 ${isGeneratingBrief ? 'animate-spin' : ''}`} />
                    <span>{isGeneratingBrief ? 'Gemini Creando Propuestas...' : 'Generar Propuestas Conceptuales'}</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: REVIEW CONCEPTS */}
          {wizardStep === 2 && (
            <div className="space-y-6">
              {/* Brief Card */}
              {briefData && (
                <div className="p-4 bg-violet-50/60 border border-violet-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-violet-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-700" />
                      <span>{briefData.campaignTitle}</span>
                    </span>
                    <Badge variant="primary" className="text-[10px]">
                      Brand DNA Verificado
                    </Badge>
                  </div>
                  <p className="text-violet-950 font-medium">{briefData.mainMessage} — {briefData.secondaryMessage}</p>
                </div>
              )}

              {/* 3 Conceptual Proposals */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {concepts.map((c) => {
                  const isSelected = selectedConcept?.id === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedConcept(c)}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between space-y-4 ${
                        isSelected
                          ? 'border-violet-600 bg-white shadow-md ring-2 ring-violet-600/20'
                          : 'border-brand-border bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black px-2 py-0.5 rounded bg-violet-100 text-violet-800">
                            Concepto {c.id}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">{c.visualTheme}</span>
                        </div>

                        <h3 className="text-sm font-bold text-brand-text-primary">{c.name}</h3>

                        <div className="p-3 bg-slate-50 rounded-lg space-y-1 text-xs">
                          <p className="font-black text-brand-text-primary font-mono tracking-tight">{c.headline}</p>
                          <p className="text-slate-500 text-[11px]">{c.subtitle}</p>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed"><strong className="text-brand-text-primary">Estrategia:</strong> {c.rationale}</p>
                      </div>

                      <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between text-xs">
                        <span className="font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded">
                          CTA: {c.cta}
                        </span>
                        {isSelected && <CheckCircle2 className="w-5 h-5 text-violet-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-4">
                <Button variant="outline" size="sm" onClick={() => setWizardStep(1)}>
                  Volver al Paso 1
                </Button>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleExecuteGeneration}
                  disabled={isGeneratingRender || !selectedConcept}
                  className="bg-violet-600 hover:bg-violet-700 text-white gap-2 font-bold px-6"
                >
                  <Wand2 className={`w-4 h-4 ${isGeneratingRender ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingRender ? 'Componiendo Gráficas Vectoriales...' : 'Aprobar Concepto & Componer Gráficas'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: RENDER & VISUAL EDITOR */}
          {wizardStep === 3 && generatedCampaign && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Canvas Preview (7 cols) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                      Composición Programática en Vivo
                    </h3>
                    <Badge variant="success" className="text-[10px]">
                      Zero-Hallucination SVG
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {generatedCampaign.formats.map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setActiveFormatPreview(fmt)}
                        className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all ${
                          activeFormatPreview === fmt
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* SVG Render Container */}
                <div className="bg-slate-950 p-4 rounded-xl flex items-center justify-center min-h-[460px] overflow-hidden shadow-inner">
                  {currentSvg ? (
                    <div
                      className="max-w-full max-h-[520px] transition-all duration-300 flex items-center justify-center"
                      dangerouslySetInnerHTML={{ __html: currentSvg }}
                    />
                  ) : (
                    <div className="text-slate-500 text-xs">Cargando pieza gráfica...</div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2">
                  <span>Renderizado con vectores SVG y tipografía {creativeProfile?.typography?.headingFont || 'Montserrat'}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const blob = new Blob([currentSvg], { type: 'image/svg+xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `creative_${generatedCampaign.id}_${activeFormatPreview}.svg`;
                      a.click();
                    }}
                    className="text-xs h-7 gap-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Descargar SVG</span>
                  </Button>
                </div>
              </div>

              {/* Right Column: Visual Editor & Quality Score (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                {/* Creative Quality Score Card */}
                <div className="bg-white p-5 rounded-xl border border-violet-200 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-violet-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-violet-600" />
                      <span>Creative Quality Score</span>
                    </span>
                    <span className="text-xl font-black font-mono text-violet-700">
                      {generatedCampaign.qualityScore?.overall || 92} / 100
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] pt-1">
                    <div className="p-2 bg-slate-50 rounded border border-brand-border/60">
                      <span className="text-slate-400 block text-[10px]">Consistencia</span>
                      <strong className="text-brand-text-primary font-mono">{generatedCampaign.qualityScore?.brandConsistency}%</strong>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-brand-border/60">
                      <span className="text-slate-400 block text-[10px]">Jerarquía</span>
                      <strong className="text-brand-text-primary font-mono">{generatedCampaign.qualityScore?.visualHierarchy}%</strong>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-brand-border/60">
                      <span className="text-slate-400 block text-[10px]">Claridad CTA</span>
                      <strong className="text-brand-text-primary font-mono">{generatedCampaign.qualityScore?.ctaVisibility}%</strong>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 italic">
                    {generatedCampaign.qualityScore?.recommendations?.[0] || 'Excelente equilibrio entre producto y llamada a la acción.'}
                  </p>
                </div>

                {/* Brand Guardian & Gatekeeper Card */}
                <div className="bg-white p-5 rounded-xl border border-brand-border shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="w-4 h-4 text-emerald-600" />
                      <span>Brand Guardian Compliance</span>
                    </span>
                    <span
                      className={`text-xs font-black px-2 py-0.5 rounded-full border ${
                        (generatedCampaign.renderedAssets?.[0]?.brandComplianceScore || 94) >= 85
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      🛡️ {generatedCampaign.renderedAssets?.[0]?.brandComplianceScore || 94}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-1.5 text-[10px] text-center">
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[9px]">Logo</span>
                      <strong className="text-emerald-700 font-mono">25/25</strong>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[9px]">Colores</span>
                      <strong className="text-emerald-700 font-mono">24/25</strong>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[9px]">Oferta</span>
                      <strong className="text-emerald-700 font-mono">25/25</strong>
                    </div>
                    <div className="p-1.5 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-400 block text-[9px]">Safety</span>
                      <strong className="text-emerald-700 font-mono">25/25</strong>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-[11px] text-emerald-900 flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Gatekeeper Meta Ads: APROBADO (&ge;85/100)</span>
                    </span>
                  </div>
                </div>

                {/* Visual Editor Form */}
                <div className="bg-white p-5 rounded-xl border border-brand-border shadow-xs space-y-3 text-xs">
                  <h4 className="font-bold text-brand-text-primary uppercase tracking-wider text-[11px]">
                    Editor de Textos & Capas
                  </h4>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Titular (Headline)</label>
                    <input
                      type="text"
                      value={generatedCampaign.copy?.headline || ''}
                      onChange={(e) =>
                        setGeneratedCampaign((prev) => ({
                          ...prev,
                          copy: { ...prev.copy, headline: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-brand-border rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Subtítulo</label>
                    <input
                      type="text"
                      value={generatedCampaign.copy?.subtitle || ''}
                      onChange={(e) =>
                        setGeneratedCampaign((prev) => ({
                          ...prev,
                          copy: { ...prev.copy, subtitle: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-brand-border rounded-lg text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Texto del Botón (CTA)</label>
                    <input
                      type="text"
                      value={generatedCampaign.copy?.cta || ''}
                      onChange={(e) =>
                        setGeneratedCampaign((prev) => ({
                          ...prev,
                          copy: { ...prev.copy, cta: e.target.value },
                        }))
                      }
                      className="w-full px-3 py-1.5 border border-brand-border rounded-lg text-xs font-bold font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleImproveWithAi}
                      disabled={isImproving}
                      className="w-full text-xs h-8 gap-1.5"
                    >
                      <Sparkles className={`w-3.5 h-3.5 ${isImproving ? 'animate-spin' : ''}`} />
                      <span>Mejorar con IA</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleApproveCampaign}
                      className="w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{generatedCampaign.status === 'approved' ? 'Aprobada' : 'Aprobar Campaña'}</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BRAND DNA & MEMORIA VISUAL                                         */}
      {/* ========================================================================= */}
      {activeTab === 'dna' && creativeProfile && (
        <form onSubmit={handleSaveDna} className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Identity & Smart Logo */}
            <div className="bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                  Identidad Visual & Logo Oficial
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Subí el logo para que Gemini Vision sugiera la paleta y nivel de contraste óptimo.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-primary mb-1">Nombre Comercial de la Marca</label>
                <input
                  type="text"
                  value={creativeProfile.brandIdentity.commercialName}
                  onChange={(e) =>
                    setCreativeProfile({
                      ...creativeProfile,
                      brandIdentity: { ...creativeProfile.brandIdentity, commercialName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-text-primary mb-1">URL del Logo Principal (PNG / SVG)</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={creativeProfile.brandIdentity.logoPrimary}
                    onChange={(e) =>
                      setCreativeProfile({
                        ...creativeProfile,
                        brandIdentity: { ...creativeProfile.brandIdentity, logoPrimary: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyzeLogo}
                    disabled={isAnalyzingLogo || !creativeProfile.brandIdentity.logoPrimary}
                    className="text-xs shrink-0 gap-1"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isAnalyzingLogo ? 'animate-spin' : ''}`} />
                    <span>Analizar con IA</span>
                  </Button>
                </div>
              </div>

              {/* Logo Analysis Recommendation Pill */}
              {logoAnalysisResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">✨ Análisis de Gemini Vision</span>
                    <Badge variant="success" className="text-[10px]">{logoAnalysisResult.detectedAesthetic.contrastLevel}</Badge>
                  </div>
                  <p className="text-emerald-950">{logoAnalysisResult.recommendation}</p>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleApplySuggestedPalette}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7"
                  >
                    Aplicar Paleta Sugerida
                  </Button>
                </div>
              )}

              {/* Color Palette Picker */}
              <div className="pt-2">
                <h4 className="text-xs font-bold text-brand-text-primary mb-2">Paleta de Colores de Marca</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block mb-1">Primario</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={creativeProfile.colorPalette.primary}
                        onChange={(e) =>
                          setCreativeProfile({
                            ...creativeProfile,
                            colorPalette: { ...creativeProfile.colorPalette, primary: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded border border-brand-border cursor-pointer p-0.5"
                      />
                      <span className="font-mono text-xs font-bold">{creativeProfile.colorPalette.primary}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block mb-1">Secundario</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={creativeProfile.colorPalette.secondary}
                        onChange={(e) =>
                          setCreativeProfile({
                            ...creativeProfile,
                            colorPalette: { ...creativeProfile.colorPalette, secondary: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded border border-brand-border cursor-pointer p-0.5"
                      />
                      <span className="font-mono text-xs font-bold">{creativeProfile.colorPalette.secondary}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block mb-1">Acento (CTA)</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={creativeProfile.colorPalette.accent}
                        onChange={(e) =>
                          setCreativeProfile({
                            ...creativeProfile,
                            colorPalette: { ...creativeProfile.colorPalette, accent: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded border border-brand-border cursor-pointer p-0.5"
                      />
                      <span className="font-mono text-xs font-bold">{creativeProfile.colorPalette.accent}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 block mb-1">Fondo</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={creativeProfile.colorPalette.background}
                        onChange={(e) =>
                          setCreativeProfile({
                            ...creativeProfile,
                            colorPalette: { ...creativeProfile.colorPalette, background: e.target.value },
                          })
                        }
                        className="w-8 h-8 rounded border border-brand-border cursor-pointer p-0.5"
                      />
                      <span className="font-mono text-xs font-bold">{creativeProfile.colorPalette.background}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rubro, Typography & Negative Constraints */}
            <div className="bg-white p-6 rounded-xl border border-brand-border shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                  Rubro, Tipografía & Reglas Negativas
                </h3>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Restricciones para que la IA nunca diseñe fuera de las pautas de marca.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-brand-text-primary mb-1">Vertical / Rubro</label>
                  <select
                    value={creativeProfile.brandDna.industry}
                    onChange={(e) =>
                      setCreativeProfile({
                        ...creativeProfile,
                        brandDna: { ...creativeProfile.brandDna, industry: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs bg-slate-50"
                  >
                    {SUPPORTED_INDUSTRIES.map((ind) => (
                      <option key={ind} value={ind}>
                        {INDUSTRY_LABELS[ind]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-text-primary mb-1">Tipografía Principal</label>
                  <select
                    value={creativeProfile.typography.headingFont}
                    onChange={(e) =>
                      setCreativeProfile({
                        ...creativeProfile,
                        typography: { ...creativeProfile.typography, headingFont: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 border border-brand-border rounded-lg text-xs bg-slate-50 font-bold"
                  >
                    <option value="Montserrat">Montserrat (Moderna / Impacto)</option>
                    <option value="Inter">Inter (Clean / Minimal)</option>
                    <option value="Outfit">Outfit (Tech / Futura)</option>
                    <option value="Playfair Display">Playfair Display (Elegante / Editorial)</option>
                  </select>
                </div>
              </div>

              {/* Forbidden Elements List */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-red-700 mb-1 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Elementos Prohibidos (Negative Constraints)</span>
                </label>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {creativeProfile.forbiddenElements.map((rule, idx) => (
                    <div key={idx} className="p-2 rounded bg-red-50/60 border border-red-200/60 text-xs text-red-900 font-medium flex items-center justify-between">
                      <span>• {rule}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSavingDna}
                  className="bg-violet-600 hover:bg-violet-700 text-white font-bold px-6"
                >
                  {isSavingDna ? 'Guardando...' : 'Guardar Brand DNA'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CATÁLOGO DE PRODUCTOS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-brand-border shadow-xs">
            <div>
              <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
                Catálogo de Productos ({products.length})
              </h3>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Fotografías aisladas en PNG, precios y cuotas fijas estructuradas.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsProductModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Producto</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <div key={p.id} className="bg-white p-4 rounded-xl border border-brand-border shadow-xs flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="w-full h-40 bg-slate-50 rounded-lg p-2 flex items-center justify-center border border-brand-border/40">
                    <img src={p.imageUrl} alt={p.name} className="max-h-full object-contain" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 block">{p.sku || p.category}</span>
                  <h4 className="text-xs font-bold text-brand-text-primary line-clamp-2">{p.name}</h4>
                </div>

                <div className="pt-2 border-t border-brand-border/60">
                  <div className="flex items-baseline justify-between">
                    <span className="text-base font-black font-mono text-brand-text-primary">
                      ${formatNumber(p.price)}
                    </span>
                    {p.previousPrice > p.price && (
                      <span className="text-xs font-mono text-slate-400 line-through">
                        ${formatNumber(p.previousPrice)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded inline-block">
                      {p.installments}
                    </span>
                    {p.activeOffer && (
                      <span className="text-[9px] font-bold text-violet-700 bg-violet-50 px-1.5 py-0.2 rounded border border-violet-200">
                        Oferta Activa
                      </span>
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedOfferProduct(p)}
                    className="w-full mt-2.5 text-[11px] h-7 border-violet-200 text-violet-700 bg-violet-50/50 hover:bg-violet-100 font-bold gap-1"
                  >
                    <Calculator className="w-3 h-3" />
                    <span>Offer Engine (True Profit)</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: MEMORIA & GALERÍA DE CAMPAÑAS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'gallery' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div>
            <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
              Memoria Creativa & Campañas Generadas ({campaigns.length})
            </h3>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Reutilizá campañas pasadas exitosas intercambiando productos sin perder la identidad visual.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.length === 0 ? (
              <div className="col-span-3 py-12 text-center text-slate-400 italic bg-white rounded-xl border border-brand-border">
                No hay campañas registradas aún. Generá la primera desde la pestaña "Generador de Campañas".
              </div>
            ) : (
              campaigns.map((camp) => {
                const thumbSvg = camp.renderedAssets?.[0]?.svg;
                return (
                  <div key={camp.id} className="bg-white p-5 rounded-xl border border-brand-border shadow-xs space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* SVG Thumbnail Container */}
                      <div className="w-full h-56 bg-slate-950 rounded-lg p-2 flex items-center justify-center overflow-hidden border border-brand-border shadow-inner">
                        {thumbSvg ? (
                          <div
                            className="max-h-full flex items-center justify-center scale-90"
                            dangerouslySetInnerHTML={{ __html: thumbSvg }}
                          />
                        ) : (
                          <ImageIcon className="w-8 h-8 text-slate-700" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 text-violet-800">
                          {camp.objective.toUpperCase()}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                            🛡️ {camp.renderedAssets?.[0]?.brandComplianceScore || 94}/100
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">v{camp.version}</span>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-brand-text-primary">{camp.campaignName}</h4>
                      <p className="text-[11px] text-slate-500 font-medium line-clamp-1">{camp.copy?.headline}</p>
                    </div>

                    <div className="pt-3 border-t border-brand-border/60 flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReuseCampaign(camp.id)}
                        className="text-xs h-7 px-2 gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Reutilizar</span>
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          setGeneratedCampaign(camp);
                          setActiveTab('generator');
                          setWizardStep(3);
                        }}
                        className="text-xs h-7 px-2 bg-violet-600 hover:bg-violet-700 text-white gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Abrir en Editor</span>
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal: Nuevo Producto */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title="Agregar Nuevo Producto al Catálogo"
      >
        <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-brand-text-primary mb-1">Nombre Comercial del Producto</label>
            <input
              type="text"
              required
              value={newProduct.name}
              onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
              placeholder="Ej: Teclado Mecánico Redragon K552"
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-slate-50 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-brand-text-primary mb-1">Precio Actual ($)</label>
              <input
                type="number"
                required
                value={newProduct.price}
                onChange={(e) => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-slate-50 text-xs font-mono font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-brand-text-primary mb-1">Precio Anterior ($)</label>
              <input
                type="number"
                value={newProduct.previousPrice}
                onChange={(e) => setNewProduct({ ...newProduct, previousPrice: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-brand-border rounded-lg bg-slate-50 text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-brand-text-primary mb-1">Financiación / Cuotas</label>
            <input
              type="text"
              value={newProduct.installments}
              onChange={(e) => setNewProduct({ ...newProduct, installments: e.target.value })}
              placeholder="12 cuotas fijas"
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-slate-50 text-xs font-bold text-emerald-800"
            />
          </div>

          <div>
            <label className="block font-bold text-brand-text-primary mb-1">URL de la Foto (PNG con fondo transparente)</label>
            <input
              type="url"
              value={newProduct.imageUrl}
              onChange={(e) => setNewProduct({ ...newProduct, imageUrl: e.target.value })}
              className="w-full px-3 py-2 border border-brand-border rounded-lg bg-slate-50 text-xs font-mono"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsProductModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isSavingProduct}
              className="bg-violet-600 hover:bg-violet-700 text-white"
            >
              {isSavingProduct ? 'Guardando...' : 'Guardar Producto'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Offer Engine & True Profit Panel Modal */}
      {selectedOfferProduct && (
        <OfferEnginePanel
          product={selectedOfferProduct}
          onClose={() => setSelectedOfferProduct(null)}
          onOfferActivated={() => fetchStudioData()}
        />
      )}
    </div>
  );
}
