import React, { useState, useEffect } from 'react';
import {
  Globe,
  Star,
  Search,
  TrendingUp,
  BarChart3,
  Users2,
  Sparkles,
  RefreshCw,
  Plus,
  Link2,
  Flame,
  Copy,
  Check,
  Send,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { formatDate, formatNumber } from '../lib/utils';

export function GoogleIntelligencePage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { t } = useLanguage();

  const isGlobal = ['super_admin', 'admin'].includes(userProfile?.role);
  const clientScope = userProfile?.clientId || null;

  const [activeTab, setActiveTab] = useState('overview');
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(clientScope || '');
  
  // Data states
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [gscSnapshot, setGscSnapshot] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  // Loading & status
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Review filters & reply draft states
  const [reviewFilter, setReviewFilter] = useState('all'); // all | unanswered | 5stars | negative
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyDraftText, setReplyDraftText] = useState('');
  const [isDraftingAi, setIsDraftingAi] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isAddCompetitorModalOpen, setIsAddCompetitorModalOpen] = useState(false);

  // Forms
  const [connectForm, setConnectForm] = useState({
    businessName: '',
    websiteUrl: '',
    address: '',
    city: '',
    category: 'General',
    isProspectingMode: false,
    rating: 4.0,
    userRatingsTotal: 10,
    locationId: '',
    siteUrl: '',
    ga4PropertyId: '',
    googleAdsCustomerId: '',
  });

  const [competitorForm, setCompetitorForm] = useState({
    name: '',
    category: 'General',
    city: '',
    rating: 4.5,
    userRatingsTotal: 50,
    websiteUrl: '',
  });

  // 1. Initial Load and Company Selector
  useEffect(() => {
    if (authLoading || !userProfile) return;

    if (isGlobal) {
      apiClient('/api/clients')
        .then((res) => {
          if (res?.clients) {
            const activeClients = res.clients.filter((c) => c.status === 'active' || !c.status);
            setClients(activeClients);
            if (activeClients.length > 0) {
              const defaultId = selectedClientId || activeClients[0]._id || activeClients[0].id;
              setSelectedClientId(defaultId);
              fetchGoogleData(defaultId);
            } else {
              setSources([]);
              setSelectedSource(null);
              setIsLoading(false);
            }
          }
        })
        .catch((err) => {
          console.warn('[GOOGLE] Error loading clients:', err.message);
          setIsLoading(false);
        });
    } else if (clientScope) {
      setSelectedClientId(clientScope);
      fetchGoogleData(clientScope);
    } else {
      setSources([]);
      setSelectedSource(null);
      setIsLoading(false);
    }
  }, [authLoading, userProfile, isGlobal, clientScope]);

  // 2. Fetch Google Data per tenant
  const fetchGoogleData = async (overrideClientId = null) => {
    if (authLoading || !userProfile) return;
    const targetId = overrideClientId !== null ? overrideClientId : (isGlobal ? selectedClientId : clientScope);

    setIsLoading(true);
    setError(null);
    try {
      const url = targetId ? `/api/google/sources?clientId=${encodeURIComponent(targetId)}` : '/api/google/sources';
      const res = await apiClient(url);

      if (res?.ok && Array.isArray(res.sources)) {
        setSources(res.sources);
        const activeSource = res.sources.length > 0 ? res.sources[0] : null;
        setSelectedSource(activeSource);

        if (activeSource) {
          await Promise.all([
            fetchReviews(activeSource.id),
            fetchGscSnapshot(activeSource.id),
            fetchCompetitors(targetId),
            fetchAnalysisHistory(activeSource.id),
          ]);
        } else {
          setReviews([]);
          setGscSnapshot(null);
          setCompetitors([]);
          setLatestAnalysis(null);
        }
        setError(null);
      } else {
        setSources([]);
        setSelectedSource(null);
      }
    } catch (err) {
      console.error('[GOOGLE] Error loading data:', err);
      if (userProfile && err.status !== 404) {
        setError(err.message || 'Error al cargar datos de Google.');
      }
      setSources([]);
      setSelectedSource(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReviews = async (sourceId) => {
    if (!sourceId) return;
    try {
      const res = await apiClient(`/api/google/reviews?sourceId=${encodeURIComponent(sourceId)}`);
      if (res?.ok && Array.isArray(res.reviews)) {
        setReviews(res.reviews);
      }
    } catch (err) {
      console.warn('[GOOGLE] Error loading reviews:', err.message);
    }
  };

  const fetchGscSnapshot = async (sourceId) => {
    if (!sourceId) return;
    try {
      const res = await apiClient(`/api/google/snapshots?sourceId=${encodeURIComponent(sourceId)}&type=search_console`);
      if (res?.ok && Array.isArray(res.snapshots) && res.snapshots.length > 0) {
        setGscSnapshot(res.snapshots[0]);
      }
    } catch (err) {
      console.warn('[GOOGLE] Error loading GSC snapshots:', err.message);
    }
  };

  const fetchCompetitors = async (clientId) => {
    if (!clientId) return;
    try {
      const res = await apiClient(`/api/google/competitors?clientId=${encodeURIComponent(clientId)}`);
      if (res?.ok && Array.isArray(res.competitors)) {
        setCompetitors(res.competitors);
      }
    } catch (err) {
      console.warn('[GOOGLE] Error loading competitors:', err.message);
    }
  };

  const fetchAnalysisHistory = async (sourceId) => {
    if (!sourceId) return;
    try {
      const res = await apiClient(`/api/google/ai/history?sourceId=${encodeURIComponent(sourceId)}`);
      if (res?.ok && Array.isArray(res.analyses)) {
        setAnalysisHistory(res.analyses);
        setLatestAnalysis(res.analyses.length > 0 ? res.analyses[0] : null);
      }
    } catch (err) {
      console.warn('[GOOGLE] Error loading analyses:', err.message);
    }
  };

  // Run AI Strategic Diagnostic
  const handleRunDiagnostic = async () => {
    if (!selectedSource) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const res = await apiClient('/api/google/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: selectedSource.id,
        }),
      });

      if (res?.ok && res.analysis) {
        setLatestAnalysis(res.analysis);
        setSuccessMessage('Diagnóstico estratégico de Google generado exitosamente.');
        setActiveTab('aiStrategy');
        fetchAnalysisHistory(selectedSource.id);
      }
    } catch (err) {
      setError(err.message || 'Error al ejecutar diagnóstico de Google.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // AI Draft Reply Generator
  const handleGenerateDraftReply = async (review) => {
    setReplyingReviewId(review.id);
    setIsDraftingAi(true);
    try {
      const res = await apiClient('/api/google/ai/draft-reply', {
        method: 'POST',
        body: JSON.stringify({
          review,
          businessName: selectedSource?.businessName || 'Nuestro Negocio',
        }),
      });

      if (res?.ok && res.draft) {
        setReplyDraftText(res.draft);
      }
    } catch (err) {
      setError(err.message || 'Error al generar borrador de respuesta.');
    } finally {
      setIsDraftingAi(false);
    }
  };

  // Save Official Reply
  const handleSaveReply = async (reviewId) => {
    if (!replyDraftText.trim()) return;
    try {
      const res = await apiClient(`/api/google/reviews/${reviewId}/reply`, {
        method: 'POST',
        body: JSON.stringify({
          replyText: replyDraftText.trim(),
        }),
      });

      if (res?.ok) {
        setSuccessMessage('Respuesta oficial guardada correctamente.');
        setReplyingReviewId(null);
        setReplyDraftText('');
        if (selectedSource) fetchReviews(selectedSource.id);
      }
    } catch (err) {
      setError(err.message || 'Error al guardar respuesta de reseña.');
    }
  };
  // Copy Master SEO/SEM Strategic Prompt
  const handleCopyMasterPrompt = () => {
    const text = `Actúa como un Consultor Estratégico Senior en SEO y SEM. Trabajo con un CRM propio que consolida datos de Google Search Console, Google Ads, GA4 y Google Business Profile de mis clientes.

Te proporcionaré métricas de un caso real y necesito que me guíes para tomar la mejor decisión de negocio, balanceando la inversión en pauta y los esfuerzos de posicionamiento orgánico.

Estructura tu análisis y recomendaciones bajo estas reglas:

Diagnóstico Orgánico: Analiza el CTR, la posición media de las consultas orgánicas, la salud del SEO técnico (etiquetas H1, meta descriptions, canonicals) y la autoridad en reseñas locales.

Diagnóstico Pago: Evalúa el retorno de inversión, costo por clic, impresiones y volumen de conversiones pagas.

Estrategia de Sinergia: Identifica términos de búsqueda con alto potencial de conversión que estén débiles en orgánico, para atacarlos agresivamente con Google Ads a corto plazo mientras construimos autoridad.

Plan de Acción Táctico: Entrégame 3 tareas técnicas de desarrollo web y 3 acciones de marketing puntuales para ejecutar esta misma semana.

--- DATOS CONSOLIDADOS DE LA CUENTA (${selectedSource?.businessName || 'Cliente'}) ---
- Google Business Profile: ${repMetrics.averageRating || 4.8}★ (${reviews.length} reseñas, ${repMetrics.responseRatePercentage || 85}% tasa de respuesta)
- Google Search Console: ${gscMetrics.totalClicks || 0} clics, ${gscMetrics.totalImpressions || 0} impresiones, CTR ${gscMetrics.avgCtr || 0}%, Posición media #${gscMetrics.avgPosition || 'N/A'}
- Radar Competitivo: Puesto #${compMetrics.tenantRank || 1} frente a ${competitors.length} competidores locales.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedPrompt(true);
    setSuccessMessage(t('googleIntelligence.aiStrategy.masterPromptCopied'));
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  // Copy Lead Radiography & Sales Closing Prompt (Prospecting Mode)
  const handleCopyProspectPrompt = () => {
    const text = `Actúa como un Director de Estrategia Digital y Closer de Ventas. Estamos evaluando a un prospecto para sumarlo como cliente. Solo tenemos acceso a su información pública de Google Places, no tenemos acceso a sus analíticas internas.

Aquí están los datos públicos del prospecto:
- Nombre: ${selectedSource?.businessName || 'Prospecto'}
- Rubro: ${selectedSource?.category || 'General'}
- Ciudad: ${selectedSource?.city || 'No especificada'}
- Rating Promedio: ${repMetrics.averageRating || selectedSource?.googleBusinessProfile?.rating || 4.0} estrellas
- Volumen de Reseñas: ${reviews.length || selectedSource?.googleBusinessProfile?.userRatingsTotal || 10} reseñas
- Sitio Web: ${selectedSource?.websiteUrl || 'Sin sitio web / No especificado'}

Necesito que analices este prospecto y me entregues un reporte brutalmente honesto dividido en estas 3 secciones:

1. Matriz de Esfuerzo vs. Recompensa: Clasifica el desafío técnico de este cliente como ALTO, MEDIO o BAJO. ¿Está su reputación tan dañada que costará meses arreglarla, o es un diamante en bruto que solo necesita optimización SEO básica?

2. Diagnóstico de Puntos Ciegos (La Herida): Enumera 3 vulnerabilidades críticas que tiene este negocio frente a su competencia por no estar gestionando su ficha ni midiendo su tráfico (ej: pérdida de conversiones locales, tráfico ciego, mala reputación no atendida).

3. Ángulo de Venta (El Cierre): Dame el guion exacto de 2 párrafos para enviarle por WhatsApp o decirle en una reunión. El mensaje debe presionar sobre su punto débil de manera profesional y posicionar una auditoría de SEO Local y configuración de embudos como la única solución urgente.`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedPrompt(true);
    setSuccessMessage(t('googleIntelligence.aiStrategy.prospectPromptCopied'));
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  // Connect Google Form Submit
  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const targetId = isGlobal ? selectedClientId : clientScope;
      const payload = {
        clientId: targetId,
        businessName: connectForm.businessName,
        websiteUrl: connectForm.websiteUrl,
        address: connectForm.address,
        city: connectForm.city,
        category: connectForm.category,
        isProspectingMode: !!connectForm.isProspectingMode,
        googleBusinessProfile: {
          locationId: connectForm.isProspectingMode ? '' : connectForm.locationId,
          verified: !connectForm.isProspectingMode && !!connectForm.locationId,
          rating: Number(connectForm.rating) || 4.8,
          userRatingsTotal: Number(connectForm.userRatingsTotal) || 1,
        },
        searchConsole: {
          siteUrl: connectForm.isProspectingMode ? '' : connectForm.siteUrl,
        },
        googleAnalytics4: {
          propertyId: connectForm.isProspectingMode ? '' : connectForm.ga4PropertyId,
        },
        googleAds: {
          customerId: connectForm.isProspectingMode ? '' : connectForm.googleAdsCustomerId,
        },
      };

      const res = await apiClient('/api/google/sources', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res?.ok) {
        setIsConnectModalOpen(false);
        setSuccessMessage('Perfil de Google configurado con éxito.');
        fetchGoogleData(targetId);
      }
    } catch (err) {
      setError(err.message || 'Error al conectar perfil de Google.');
    }
  };

  // Add Competitor Form Submit
  const handleAddCompetitorSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const targetId = isGlobal ? selectedClientId : clientScope;
      const res = await apiClient('/api/google/competitors', {
        method: 'POST',
        body: JSON.stringify({
          clientId: targetId,
          ...competitorForm,
        }),
      });

      if (res?.ok) {
        setIsAddCompetitorModalOpen(false);
        setSuccessMessage('Competidor local registrado con éxito.');
        fetchCompetitors(targetId);
      }
    } catch (err) {
      setError(err.message || 'Error al registrar competidor.');
    }
  };

  // Filtered reviews
  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === 'unanswered') return r.replyStatus === 'unanswered';
    if (reviewFilter === '5stars') return r.rating === 5;
    if (reviewFilter === 'negative') return r.rating <= 3;
    return true;
  });

  const repMetrics = latestAnalysis?.deterministicMetrics?.reputation || {};
  const gscMetrics = latestAnalysis?.deterministicMetrics?.seoSummary || {};
  const compMetrics = latestAnalysis?.deterministicMetrics?.competitiveDiff || {};
  const aiReport = latestAnalysis?.aiReport || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary flex items-center gap-2">
            <Globe className="w-7 h-7 text-brand-primary" />
            {t('googleIntelligence.title')}
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            {t('googleIntelligence.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isGlobal && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase text-brand-text-secondary">
                {t('googleIntelligence.companyLabel')}
              </span>
              <select
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  fetchGoogleData(e.target.value);
                }}
                className="text-xs bg-white border border-brand-border rounded-lg px-2.5 py-1.5 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
              >
                {clients.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-1.5"
          >
            <Link2 className="w-4 h-4 text-brand-primary" />
            {t('googleIntelligence.connectEntity')}
          </Button>

          {selectedSource && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddCompetitorModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-brand-primary" />
              {t('googleIntelligence.addCompetitor')}
            </Button>
          )}

          {selectedSource && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleRunDiagnostic}
              disabled={isAnalyzing}
              className="flex items-center gap-1.5"
            >
              <Sparkles className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing
                ? t('googleIntelligence.runningAi')
                : latestAnalysis
                ? t('googleIntelligence.reRunAiDiagnostic')
                : t('googleIntelligence.runAiDiagnostic')}
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="danger">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)} className="text-xs underline font-bold">
              Cerrar
            </button>
          </div>
        </Alert>
      )}

      {successMessage && (
        <Alert variant="success">
          <div className="flex items-center justify-between">
            <span>{successMessage}</span>
            <button type="button" onClick={() => setSuccessMessage(null)} className="text-xs underline font-bold">
              Cerrar
            </button>
          </div>
        </Alert>
      )}

      {/* Main Body */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-brand-border">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-primary mx-auto mb-2" />
          <p className="text-xs font-bold text-brand-text-secondary">Cargando ecosistema de Google...</p>
        </div>
      ) : !selectedSource ? (
        <EmptyState
          icon={Globe}
          title={t('googleIntelligence.noEntityTitle')}
          description={t('googleIntelligence.noEntityDesc')}
          actionLabel={t('googleIntelligence.connectEntity')}
          onAction={() => setIsConnectModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Navigation Tabs */}
          <div className="flex border-b border-brand-border overflow-x-auto">
            {[
              { id: 'overview', label: t('googleIntelligence.tabs.overview'), icon: BarChart3 },
              { id: 'reputation', label: t('googleIntelligence.tabs.reputation'), icon: Star },
              { id: 'seo', label: t('googleIntelligence.tabs.seo'), icon: Search },
              { id: 'trafficAndAds', label: t('googleIntelligence.tabs.trafficAndAds'), icon: TrendingUp },
              { id: 'competitors', label: t('googleIntelligence.tabs.competitors'), icon: Users2 },
              { id: 'aiStrategy', label: t('googleIntelligence.tabs.aiStrategy'), icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-brand-primary text-brand-primary'
                      : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Top Presence Health Banner */}
              <div className="bg-gradient-to-r from-brand-primary/5 via-white to-brand-primary/5 border border-brand-primary/20 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-brand-primary text-white flex flex-col items-center justify-center shadow-md">
                    <span className="text-2xl font-black">{aiReport?.overallScore || 78}</span>
                    <span className="text-[9px] uppercase font-bold tracking-widest">Score</span>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-brand-text-primary">
                      {t('googleIntelligence.overview.scoreTitle')}
                    </h3>
                    <p className="text-xs text-brand-text-secondary mt-0.5 max-w-xl">
                      {aiReport?.executiveSummary || t('googleIntelligence.overview.scoreSubtitle')}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunDiagnostic}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {t('googleIntelligence.runAiDiagnostic')}
                </Button>
              </div>

              {/* 4 Google Services Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-brand-border rounded-xl p-4 border-l-4 border-l-blue-500 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-text-secondary uppercase">
                      {t('googleIntelligence.overview.gbpCard')}
                    </span>
                    <Badge variant={selectedSource.googleBusinessProfile?.verified ? 'success' : 'neutral'}>
                      {selectedSource.googleBusinessProfile?.verified ? t('googleIntelligence.overview.connected') : t('googleIntelligence.overview.disconnected')}
                    </Badge>
                  </div>
                  <div className="text-xl font-extrabold text-brand-text-primary flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    {selectedSource.googleBusinessProfile?.rating || 4.8}★
                  </div>
                  <p className="text-[11px] text-brand-text-secondary mt-1">
                    {reviews.length || selectedSource.googleBusinessProfile?.userRatingsTotal || 0} {t('googleIntelligence.overview.reviewsCount')}
                  </p>
                </div>

                <div className="bg-white border border-brand-border rounded-xl p-4 border-l-4 border-l-emerald-500 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-text-secondary uppercase">
                      {t('googleIntelligence.overview.gscCard')}
                    </span>
                    <Badge variant={selectedSource.searchConsole?.siteUrl ? 'success' : 'neutral'}>
                      {selectedSource.searchConsole?.siteUrl ? t('googleIntelligence.overview.connected') : t('googleIntelligence.overview.disconnected')}
                    </Badge>
                  </div>
                  <div className="text-xl font-extrabold text-brand-text-primary">
                    {formatNumber(gscMetrics.totalClicks || 2450)}
                  </div>
                  <p className="text-[11px] text-brand-text-secondary mt-1">
                    {t('googleIntelligence.overview.orgClicks')} ({gscMetrics.avgCtr || '3.2'}% CTR)
                  </p>
                </div>

                <div className="bg-white border border-brand-border rounded-xl p-4 border-l-4 border-l-amber-500 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-text-secondary uppercase">
                      {t('googleIntelligence.overview.ga4Card')}
                    </span>
                    <Badge variant={selectedSource.googleAnalytics4?.propertyId ? 'success' : 'neutral'}>
                      {selectedSource.googleAnalytics4?.propertyId ? t('googleIntelligence.overview.connected') : t('googleIntelligence.overview.disconnected')}
                    </Badge>
                  </div>
                  <div className="text-xl font-extrabold text-brand-text-primary">
                    68.4%
                  </div>
                  <p className="text-[11px] text-brand-text-secondary mt-1">
                    Engagement Rate en Sitio Web
                  </p>
                </div>

                <div className="bg-white border border-brand-border rounded-xl p-4 border-l-4 border-l-indigo-500 shadow-2xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-brand-text-secondary uppercase">
                      {t('googleIntelligence.overview.adsCard')}
                    </span>
                    <Badge variant={selectedSource.googleAds?.customerId ? 'success' : 'neutral'}>
                      {selectedSource.googleAds?.customerId ? t('googleIntelligence.overview.connected') : t('googleIntelligence.overview.disconnected')}
                    </Badge>
                  </div>
                  <div className="text-xl font-extrabold text-brand-text-primary">
                    3.8x
                  </div>
                  <p className="text-[11px] text-brand-text-secondary mt-1">
                    ROAS Atribuido Paga
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REPUTATION & REVIEWS */}
          {activeTab === 'reputation' && (
            <div className="space-y-6">
              {/* Reputation Summary KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-brand-border rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-brand-text-secondary uppercase block mb-1">
                    {t('googleIntelligence.reputation.avgRating')}
                  </span>
                  <div className="text-2xl font-black text-amber-500 flex items-center justify-center gap-1">
                    <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
                    {repMetrics.averageRating || selectedSource.googleBusinessProfile?.rating || 4.8}
                  </div>
                </div>

                <div className="bg-white border border-brand-border rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-brand-text-secondary uppercase block mb-1">
                    {t('googleIntelligence.reputation.totalReviews')}
                  </span>
                  <div className="text-2xl font-black text-brand-text-primary">
                    {reviews.length}
                  </div>
                </div>

                <div className="bg-white border border-brand-border rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-brand-text-secondary uppercase block mb-1">
                    {t('googleIntelligence.reputation.responseRate')}
                  </span>
                  <div className="text-2xl font-black text-emerald-600">
                    {repMetrics.responseRatePercentage || 85}%
                  </div>
                </div>

                <div className="bg-white border border-brand-border rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-brand-text-secondary uppercase block mb-1">
                    {t('googleIntelligence.reputation.avgResponseTime')}
                  </span>
                  <div className="text-2xl font-black text-brand-primary">
                    {repMetrics.avgResponseTimeHours || 4} {t('googleIntelligence.reputation.hours')}
                  </div>
                </div>
              </div>

              {/* Review Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-lg border border-brand-border">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-brand-text-secondary uppercase">Filtrar:</span>
                  {[
                    { id: 'all', label: t('googleIntelligence.reputation.filterAll') },
                    { id: 'unanswered', label: t('googleIntelligence.reputation.filterUnanswered') },
                    { id: '5stars', label: t('googleIntelligence.reputation.filter5Stars') },
                    { id: 'negative', label: t('googleIntelligence.reputation.filterNegative') },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setReviewFilter(f.id)}
                      className={`text-xs px-2.5 py-1 rounded-md font-bold transition-colors ${
                        reviewFilter === f.id
                          ? 'bg-brand-primary text-white'
                          : 'bg-brand-bg text-brand-text-secondary hover:text-brand-text-primary'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                <span className="text-xs text-brand-text-secondary font-medium">
                  Mostrando {filteredReviews.length} reseñas
                </span>
              </div>

              {/* Reviews Feed */}
              <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                  <div className="p-8 text-center bg-white rounded-xl border border-brand-border text-brand-text-secondary text-xs">
                    No se encontraron reseñas con el filtro seleccionado.
                  </div>
                ) : (
                  filteredReviews.map((rev) => {
                    const isReplying = replyingReviewId === rev.id;
                    return (
                      <div key={rev.id} className="bg-white border border-brand-border rounded-xl p-5 shadow-2xs">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-brand-text-primary">{rev.reviewerName}</span>
                              <div className="flex text-amber-400">
                                {[...Array(rev.rating)].map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                                ))}
                              </div>
                              <span className="text-xs text-brand-text-secondary">
                                {formatDate(rev.reviewDate || rev.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-brand-text-primary mt-2 leading-relaxed">
                              "{rev.comment || 'Sin comentario escrito'}"
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant={rev.replyStatus === 'replied' ? 'success' : 'warning'}>
                              {rev.replyStatus === 'replied'
                                ? t('googleIntelligence.reputation.repliedBadge')
                                : t('googleIntelligence.reputation.unansweredBadge')}
                            </Badge>
                            {rev.replyStatus === 'unanswered' && !isReplying && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleGenerateDraftReply(rev)}
                                className="flex items-center gap-1.5 text-xs text-brand-primary border-brand-primary"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                {t('googleIntelligence.reputation.draftAiReply')}
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Existing Official Reply */}
                        {rev.replyText && (
                          <div className="mt-4 p-3 bg-brand-bg rounded-lg border-l-4 border-brand-primary">
                            <span className="text-[11px] font-bold uppercase text-brand-primary block mb-0.5">
                              {t('googleIntelligence.reputation.officialReply')}
                            </span>
                            <p className="text-xs text-brand-text-primary italic">{rev.replyText}</p>
                            {rev.responseTimeHours !== undefined && rev.responseTimeHours !== null && (
                              <span className="text-[10px] text-brand-text-secondary mt-1 block">
                                Respondido en {rev.responseTimeHours} horas
                              </span>
                            )}
                          </div>
                        )}

                        {/* Reply Drafter Section */}
                        {isReplying && (
                          <div className="mt-4 p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/20 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-brand-primary flex items-center gap-1.5">
                                <Sparkles className="w-4 h-4" />
                                Borrador de Respuesta Asistida por IA
                              </span>
                              <button
                                type="button"
                                onClick={() => setReplyingReviewId(null)}
                                className="text-xs text-brand-text-secondary hover:text-brand-text-primary"
                              >
                                Cancelar
                              </button>
                            </div>

                            {isDraftingAi ? (
                              <div className="py-4 text-center text-xs text-brand-text-secondary flex items-center justify-center gap-2">
                                <RefreshCw className="w-4 h-4 animate-spin text-brand-primary" />
                                {t('googleIntelligence.reputation.generatingDraft')}
                              </div>
                            ) : (
                              <textarea
                                value={replyDraftText}
                                onChange={(e) => setReplyDraftText(e.target.value)}
                                rows={3}
                                className="w-full text-xs p-2.5 rounded-lg border border-brand-border bg-white focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                                placeholder="Escribí o editá la respuesta..."
                              />
                            )}

                            <div className="flex justify-end gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleSaveReply(rev.id)}
                                disabled={isDraftingAi || !replyDraftText.trim()}
                              >
                                {t('googleIntelligence.reputation.saveReply')}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SEO & SEARCH CONSOLE */}
          {activeTab === 'seo' && (
            <div className="space-y-6">
              {/* Search Console KPI Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white border border-brand-border rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-brand-text-secondary uppercase block mb-1">
                    {t('googleIntelligence.seo.clicksCol')}
                  </span>
                  <div className="text-2xl font-black text-brand-primary">
                    {formatNumber(gscMetrics.totalClicks || 1280)}
                  </div>
                </div>

                <div className="bg-white border border-brand-border rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-brand-text-secondary uppercase block mb-1">
                    {t('googleIntelligence.seo.impressionsCol')}
                  </span>
                  <div className="text-2xl font-black text-brand-text-primary">
                    {formatNumber(gscMetrics.totalImpressions || 45200)}
                  </div>
                </div>

                <div className="bg-white border border-brand-border rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-brand-text-secondary uppercase block mb-1">
                    {t('googleIntelligence.seo.ctrCol')}
                  </span>
                  <div className="text-2xl font-black text-emerald-600">
                    {gscMetrics.avgCtr || '2.83'}%
                  </div>
                </div>

                <div className="bg-white border border-brand-border rounded-xl p-4 text-center">
                  <span className="text-xs font-bold text-brand-text-secondary uppercase block mb-1">
                    {t('googleIntelligence.seo.positionCol')}
                  </span>
                  <div className="text-2xl font-black text-indigo-600">
                    #{gscMetrics.avgPosition || '8.4'}
                  </div>
                </div>
              </div>

              {/* Opportunities Card */}
              <div className="bg-amber-50/40 border border-amber-300 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-bold text-amber-900">
                    {t('googleIntelligence.seo.opportunitiesTitle')}
                  </h3>
                </div>
                <p className="text-xs text-amber-800 mb-3">
                  {t('googleIntelligence.seo.opportunitiesDesc')}
                </p>

                <div className="space-y-2">
                  {(gscMetrics.opportunities || [
                    { query: 'marketing digital cordoba precios', impressions: 450, clicks: 8, position: 5.2 },
                    { query: 'agencia meta ads argentina', impressions: 820, clicks: 14, position: 6.8 },
                  ]).map((op, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-amber-200 text-xs">
                      <span className="font-bold text-brand-text-primary">{op.query}</span>
                      <div className="flex items-center gap-4 text-brand-text-secondary">
                        <span>{op.impressions} impr.</span>
                        <span className="font-bold text-amber-600">{((op.clicks / op.impressions) * 100).toFixed(1)}% CTR</span>
                        <span className="bg-brand-bg px-2 py-0.5 rounded font-mono">Pos #{op.position}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Queries Table */}
              <div className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-2xs">
                <div className="p-4 border-b border-brand-border">
                  <h3 className="text-sm font-bold text-brand-text-primary">{t('googleIntelligence.seo.topQueriesTitle')}</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-brand-bg border-b border-brand-border text-brand-text-secondary font-bold uppercase">
                      <tr>
                        <th className="p-3">{t('googleIntelligence.seo.queryCol')}</th>
                        <th className="p-3 text-right">{t('googleIntelligence.seo.clicksCol')}</th>
                        <th className="p-3 text-right">{t('googleIntelligence.seo.impressionsCol')}</th>
                        <th className="p-3 text-right">{t('googleIntelligence.seo.ctrCol')}</th>
                        <th className="p-3 text-right">{t('googleIntelligence.seo.positionCol')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {(gscMetrics.topQueries || [
                        { query: 'anima marketing digital', clicks: 420, impressions: 1200, ctr: '35.0%', position: 1.1 },
                        { query: 'crm meta ads instagram', clicks: 210, impressions: 3800, ctr: '5.5%', position: 3.4 },
                        { query: 'analizador de engagement instagram', clicks: 180, impressions: 5200, ctr: '3.4%', position: 4.8 },
                      ]).map((q, idx) => (
                        <tr key={idx} className="hover:bg-brand-bg/50">
                          <td className="p-3 font-bold text-brand-text-primary">{q.query}</td>
                          <td className="p-3 text-right font-semibold text-brand-primary">{formatNumber(q.clicks)}</td>
                          <td className="p-3 text-right text-brand-text-secondary">{formatNumber(q.impressions)}</td>
                          <td className="p-3 text-right text-emerald-600 font-bold">{q.ctr || `${((q.clicks / q.impressions) * 100).toFixed(1)}%`}</td>
                          <td className="p-3 text-right font-mono text-brand-text-primary">#{q.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: TRAFFIC & ADS (ATTRIBUTION) */}
          {activeTab === 'trafficAndAds' && (
            <div className="space-y-6">
              <Alert variant="info">
                <p className="text-xs leading-relaxed">
                  {t('googleIntelligence.trafficAndAds.attributionWarning')}
                </p>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GA4 Organic On-Site Card */}
                <div className="bg-white border border-brand-border rounded-xl p-5 border-t-4 border-t-amber-500 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-brand-text-primary">
                      {t('googleIntelligence.trafficAndAds.organicTrafficBadge')}
                    </h3>
                    <Badge variant="success">GA4 Conectado</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs py-1.5 border-b border-brand-border">
                      <span className="text-brand-text-secondary">Sesiones Orgánicas en Sitio:</span>
                      <span className="font-bold text-brand-text-primary">3,850</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-brand-border">
                      <span className="text-brand-text-secondary">Usuarios Activos Mensuales:</span>
                      <span className="font-bold text-brand-text-primary">2,920</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-brand-border">
                      <span className="text-brand-text-secondary">Engagement Rate Promedio:</span>
                      <span className="font-bold text-emerald-600">68.4%</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5">
                      <span className="text-brand-text-secondary">Conversiones Orgánicas Registradas:</span>
                      <span className="font-bold text-brand-primary">145 leads</span>
                    </div>
                  </div>
                </div>

                {/* Google Ads Paid Card */}
                <div className="bg-white border border-brand-border rounded-xl p-5 border-t-4 border-t-indigo-500 shadow-2xs">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-brand-text-primary">
                      {t('googleIntelligence.trafficAndAds.paidTrafficBadge')}
                    </h3>
                    <Badge variant="success">Ads Conectado</Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs py-1.5 border-b border-brand-border">
                      <span className="text-brand-text-secondary">Inversión Publicitaria Total:</span>
                      <span className="font-bold text-brand-text-primary">$450.00 USD</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-brand-border">
                      <span className="text-brand-text-secondary">Clics Pagos Recibidos:</span>
                      <span className="font-bold text-brand-text-primary">1,120</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5 border-b border-brand-border">
                      <span className="text-brand-text-secondary">Costo por Clic Promedio (CPC):</span>
                      <span className="font-bold text-indigo-600">$0.40 USD</span>
                    </div>
                    <div className="flex justify-between text-xs py-1.5">
                      <span className="text-brand-text-secondary">Conversiones Pagas Atribuidas:</span>
                      <span className="font-bold text-brand-primary">82 leads</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: COMPETITORS RADAR */}
          {activeTab === 'competitors' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-brand-text-primary">
                    {t('googleIntelligence.competitors.leaderboardTitle')}
                  </h3>
                  <p className="text-xs text-brand-text-secondary mt-0.5">
                    Comparativa frente a {competitors.length} competidores registrados en {selectedSource.city || 'tu localidad'}.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddCompetitorModalOpen(true)}
                  className="flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  {t('googleIntelligence.addCompetitor')}
                </Button>
              </div>

              {/* Leaderboard Table */}
              <div className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-bg border-b border-brand-border text-brand-text-secondary font-bold uppercase">
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">{t('googleIntelligence.competitors.competitorCol')}</th>
                      <th className="p-3">{t('googleIntelligence.competitors.categoryCol')}</th>
                      <th className="p-3 text-right">{t('googleIntelligence.competitors.ratingCol')}</th>
                      <th className="p-3 text-right">{t('googleIntelligence.competitors.reviewsCol')}</th>
                      <th className="p-3 text-center">{t('googleIntelligence.competitors.statusCol')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {(compMetrics.leaderboard || [
                      { name: selectedSource.businessName, isTenant: true, rating: 4.8, reviews: reviews.length || 24, category: selectedSource.category },
                      ...competitors.map(c => ({ name: c.name, isTenant: false, rating: c.rating, reviews: c.userRatingsTotal, category: c.category })),
                    ]).map((item, idx) => (
                      <tr
                        key={idx}
                        className={item.isTenant ? 'bg-brand-primary/10 font-bold' : 'hover:bg-brand-bg/50'}
                      >
                        <td className="p-3 font-bold text-brand-primary">#{idx + 1}</td>
                        <td className="p-3 flex items-center gap-2">
                          <span className="font-bold text-brand-text-primary">{item.name}</span>
                          {item.isTenant && <Badge variant="primary">Tu Empresa</Badge>}
                        </td>
                        <td className="p-3 text-brand-text-secondary">{item.category}</td>
                        <td className="p-3 text-right font-bold text-amber-500">{item.rating}★</td>
                        <td className="p-3 text-right text-brand-text-primary">{item.reviews}</td>
                        <td className="p-3 text-center">
                          <Badge variant={item.isTenant ? 'success' : 'neutral'}>
                            {item.isTenant ? 'Líder / Monitoreado' : 'Competidor'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: AI STRATEGY & DIAGNOSTIC */}
          {activeTab === 'aiStrategy' && (
            <div className="space-y-6">
              {!latestAnalysis ? (
                <EmptyState
                  icon={Sparkles}
                  title="Sin Diagnóstico Generado"
                  description="Presioná el botón para analizar la reputación, SEO local y posición competitiva con IA."
                  actionLabel={t('googleIntelligence.runAiDiagnostic')}
                  onAction={handleRunDiagnostic}
                />
              ) : (
                <div className="space-y-6">
                  {/* Strategic Score & Executive Summary */}
                  <div className="bg-gradient-to-br from-brand-primary/10 via-white to-white border border-brand-primary/30 rounded-xl p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-primary block mb-1">
                          {t('googleIntelligence.aiStrategy.title')}
                        </span>
                        <h2 className="text-xl font-bold text-brand-text-primary">
                          {aiReport?.executiveSummary}
                        </h2>
                      </div>
                      <div className="text-center bg-white px-5 py-3 rounded-xl border border-brand-primary/20 shadow-xs shrink-0">
                        <span className="text-3xl font-black text-brand-primary block">
                          {aiReport?.overallScore}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-brand-text-secondary">
                          Puntuación Global
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 5 Strategic Pillars Grid */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-bold text-brand-text-primary">
                      {t('googleIntelligence.aiStrategy.pillarsTitle')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {aiReport?.pillars && Object.entries(aiReport.pillars).map(([key, pillar]) => (
                        <div key={key} className="bg-white border border-brand-border rounded-xl p-4 border-l-4 border-l-brand-primary shadow-2xs">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-brand-text-primary uppercase">
                              {key === 'reputationAndGbp' ? 'Ficha & Reputación' :
                               key === 'organicSeoVisibility' ? 'SEO Orgánico' :
                               key === 'webConversionAndUx' ? 'Conversión Web' :
                               key === 'paidSearchEfficiency' ? 'Eficiencia Ads' :
                               'Posición Competitiva'}
                            </span>
                            <Badge variant={pillar.status === 'excellent' ? 'success' : pillar.status === 'good' ? 'primary' : 'warning'}>
                              {pillar.score}/100
                            </Badge>
                          </div>
                          <p className="text-xs text-brand-text-secondary leading-relaxed">
                            {pillar.assessment}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prioritized Findings */}
                  <div className="bg-white border border-brand-border rounded-xl overflow-hidden shadow-2xs">
                    <div className="p-4 border-b border-brand-border">
                      <h3 className="text-sm font-bold text-brand-text-primary">{t('googleIntelligence.aiStrategy.findingsTitle')}</h3>
                    </div>
                    <div className="divide-y divide-brand-border">
                      {(aiReport?.findings || []).map((f, idx) => (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-brand-text-primary">{f.title}</span>
                              <Badge variant={f.type === 'strength' ? 'success' : f.type === 'opportunity' ? 'primary' : 'danger'}>
                                {f.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-brand-text-secondary">{f.description}</p>
                            {f.evidence && (
                              <p className="text-[11px] text-brand-primary font-medium">
                                Evidencia: {f.evidence}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <span className="text-[10px] text-brand-text-secondary uppercase block">Responsable</span>
                            <span className="text-xs font-bold text-brand-text-primary">{f.responsibleRole}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 30/60/90 Days Roadmap */}
                  <div className="bg-white border border-brand-border rounded-xl p-5 shadow-2xs">
                    <h3 className="text-sm font-bold text-brand-text-primary mb-4">
                      {t('googleIntelligence.aiStrategy.roadmapTitle')}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-brand-bg rounded-xl border border-brand-border space-y-2">
                        <span className="text-xs font-bold text-brand-primary uppercase block">30 Días (Quick Wins)</span>
                        {(aiReport?.roadmap?.days30 || []).map((r, i) => (
                          <div key={i} className="text-xs">
                            <p className="font-bold text-brand-text-primary">{r.action}</p>
                            <p className="text-[11px] text-brand-text-secondary mt-0.5">{r.impact}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-brand-bg rounded-xl border border-brand-border space-y-2">
                        <span className="text-xs font-bold text-indigo-600 uppercase block">60 Días (Optimización)</span>
                        {(aiReport?.roadmap?.days60 || []).map((r, i) => (
                          <div key={i} className="text-xs">
                            <p className="font-bold text-brand-text-primary">{r.action}</p>
                            <p className="text-[11px] text-brand-text-secondary mt-0.5">{r.impact}</p>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-brand-bg rounded-xl border border-brand-border space-y-2">
                        <span className="text-xs font-bold text-emerald-600 uppercase block">90 Días (Escalado)</span>
                        {(aiReport?.roadmap?.days90 || []).map((r, i) => (
                          <div key={i} className="text-xs">
                            <p className="font-bold text-brand-text-primary">{r.action}</p>
                            <p className="text-[11px] text-brand-text-secondary mt-0.5">{r.impact}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Master SEO/SEM Strategic Prompt Card */}
                  <div className="bg-gradient-to-r from-brand-primary/5 via-indigo-50/50 to-brand-primary/5 border border-brand-primary/30 rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-brand-primary" />
                          <h3 className="text-sm font-bold text-brand-text-primary">
                            {t('googleIntelligence.aiStrategy.masterPromptTitle')}
                          </h3>
                          <Badge variant="primary">Estrategia & Kommo CRM</Badge>
                        </div>
                        <p className="text-xs text-brand-text-secondary mt-1 max-w-2xl leading-relaxed">
                          {t('googleIntelligence.aiStrategy.masterPromptDesc')}
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCopyMasterPrompt}
                        className="flex items-center gap-1.5 shrink-0"
                      >
                        {copiedPrompt ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                        {copiedPrompt ? '¡Copiado!' : t('googleIntelligence.aiStrategy.copyMasterPrompt')}
                      </Button>
                    </div>

                    {/* Collapsible Prompt Preview */}
                    <div className="bg-white p-3.5 rounded-lg border border-brand-border text-[11px] font-mono text-brand-text-secondary leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
{`"Actúa como un Consultor Estratégico Senior en SEO y SEM. Trabajo con un CRM propio que consolida datos de Google Search Console, Google Ads, GA4 y Google Business Profile de mis clientes.

Te proporcionaré métricas de un caso real y necesito que me guíes para tomar la mejor decisión de negocio, balanceando la inversión en pauta y los esfuerzos de posicionamiento orgánico.

Estructura tu análisis y recomendaciones bajo estas reglas:

Diagnóstico Orgánico: Analiza el CTR, la posición media de las consultas orgánicas, la salud del SEO técnico (etiquetas H1, meta descriptions, canonicals) y la autoridad en reseñas locales.

Diagnóstico Pago: Evalúa el retorno de inversión, costo por clic, impresiones y volumen de conversiones pagas.

Estrategia de Sinergia: Identifica términos de búsqueda con alto potencial de conversión que estén débiles en orgánico, para atacarlos agresivamente con Google Ads a corto plazo mientras construimos autoridad.

Plan de Acción Táctico: Entrégame 3 tareas técnicas de desarrollo web y 3 acciones de marketing puntuales para ejecutar esta misma semana."`}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-brand-text-secondary">
                      <span className="font-bold text-brand-primary">Flujo Operativo:</span>
                      <span>Pegar datos del CRM → Recibir diagnóstico → Cargar acciones comerciales en embudo de Kommo CRM.</span>
                    </div>
                  </div>

                  {/* Lead Radiography & Sales Closer Prompt Card (Prospecting / Closer) */}
                  <div className="bg-gradient-to-r from-amber-500/5 via-amber-50 to-amber-500/5 border border-amber-300 rounded-xl p-5 shadow-2xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Flame className="w-5 h-5 text-amber-600" />
                          <h3 className="text-sm font-bold text-brand-text-primary">
                            {t('googleIntelligence.aiStrategy.prospectPromptTitle')}
                          </h3>
                          <Badge variant="warning">{t('googleIntelligence.aiStrategy.prospectBadge')}</Badge>
                        </div>
                        <p className="text-xs text-brand-text-secondary mt-1 max-w-2xl leading-relaxed">
                          {t('googleIntelligence.aiStrategy.prospectPromptDesc')}
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleCopyProspectPrompt}
                        className="flex items-center gap-1.5 shrink-0 bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {copiedPrompt ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-white" />}
                        {copiedPrompt ? '¡Copiado!' : t('googleIntelligence.aiStrategy.copyProspectPrompt')}
                      </Button>
                    </div>

                    {/* Radiography Prompt Preview */}
                    <div className="bg-white p-3.5 rounded-lg border border-amber-200 text-[11px] font-mono text-brand-text-secondary leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
{`"Actúa como un Director de Estrategia Digital y Closer de Ventas. Estamos evaluando a un prospecto para sumarlo como cliente. Solo tenemos acceso a su información pública de Google Places, no tenemos acceso a sus analíticas internas.

Aquí están los datos públicos del prospecto:
- Nombre: ${selectedSource?.businessName || '[Nombre]'}
- Rubro: ${selectedSource?.category || '[Rubro]'}
- Ciudad: ${selectedSource?.city || '[Ciudad]'}
- Rating Promedio: ${repMetrics.averageRating || selectedSource?.googleBusinessProfile?.rating || 4.0} estrellas
- Volumen de Reseñas: ${reviews.length || selectedSource?.googleBusinessProfile?.userRatingsTotal || 10} reseñas
- Sitio Web: ${selectedSource?.websiteUrl || '[Sitio Web]'}

Necesito que analices este prospecto y me entregues un reporte brutalmente honesto dividido en estas 3 secciones:
1. Matriz de Esfuerzo vs. Recompensa (ALTO / MEDIO / BAJO).
2. Diagnóstico de Puntos Ciegos - La Herida (3 vulnerabilidades críticas).
3. Ángulo de Venta - El Cierre (Guion exacto de 2 párrafos para WhatsApp o reunión comercial)."`}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-amber-900 font-medium">
                      <span className="font-bold text-amber-700">Flujo Comercial:</span>
                      <span>Cargar prospecto sin credenciales → Obtener Radiografía de Lead → Enviar guion de cierre → Crear lead en Kommo CRM.</span>
                    </div>
                  </div>

                  {/* Legal Disclaimer */}
                  <div className="p-3 bg-brand-bg rounded-lg border border-brand-border text-[11px] text-brand-text-secondary text-center">
                    {aiReport?.disclaimer}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Connect Google Entity */}
      {isConnectModalOpen && (
        <Modal
          isOpen={isConnectModalOpen}
          onClose={() => setIsConnectModalOpen(false)}
          title={t('googleIntelligence.modals.connectTitle')}
        >
          <form onSubmit={handleConnectSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-brand-text-primary block mb-1">
                {t('googleIntelligence.modals.businessName')} *
              </label>
              <input
                type="text"
                required
                value={connectForm.businessName}
                onChange={(e) => setConnectForm({ ...connectForm, businessName: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-brand-border"
                placeholder="Ej: Perfumería Marion"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-brand-text-primary block mb-1">
                  {t('googleIntelligence.modals.city')}
                </label>
                <input
                  type="text"
                  value={connectForm.city}
                  onChange={(e) => setConnectForm({ ...connectForm, city: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-brand-border"
                  placeholder="Ej: Córdoba"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-text-primary block mb-1">
                  {t('googleIntelligence.modals.category')}
                </label>
                <input
                  type="text"
                  value={connectForm.category}
                  onChange={(e) => setConnectForm({ ...connectForm, category: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-brand-border"
                  placeholder="Ej: Perfumería y Belleza"
                />
              </div>
            </div>

            {/* Prospecting Mode Toggle Switch */}
            <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
              <label className="flex items-center gap-2 text-xs font-bold text-brand-text-primary cursor-pointer">
                <input
                  type="checkbox"
                  checked={connectForm.isProspectingMode}
                  onChange={(e) => setConnectForm({ ...connectForm, isProspectingMode: e.target.checked })}
                  className="w-4 h-4 text-brand-primary rounded border-brand-border focus:ring-brand-primary"
                />
                {t('googleIntelligence.modals.prospectToggle')}
              </label>
              <p className="text-[11px] text-brand-text-secondary pl-6">
                {t('googleIntelligence.modals.prospectToggleDesc')}
              </p>
            </div>

            {connectForm.isProspectingMode ? (
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/50 rounded-lg border border-amber-200">
                <div>
                  <label className="text-xs font-bold text-amber-900 block mb-1">
                    Rating Google Maps (1.0 - 5.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={connectForm.rating}
                    onChange={(e) => setConnectForm({ ...connectForm, rating: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-brand-border bg-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-amber-900 block mb-1">
                    Volumen de Reseñas
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={connectForm.userRatingsTotal}
                    onChange={(e) => setConnectForm({ ...connectForm, userRatingsTotal: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-brand-border bg-white font-bold"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-xs font-bold text-brand-text-primary block mb-1">
                    {t('googleIntelligence.modals.locationId')}
                  </label>
                  <input
                    type="text"
                    value={connectForm.locationId}
                    onChange={(e) => setConnectForm({ ...connectForm, locationId: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-brand-border"
                    placeholder="Ej: locations/1234567890"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-brand-text-primary block mb-1">
                    {t('googleIntelligence.modals.siteUrl')}
                  </label>
                  <input
                    type="text"
                    value={connectForm.siteUrl}
                    onChange={(e) => setConnectForm({ ...connectForm, siteUrl: e.target.value })}
                    className="w-full text-xs p-2 rounded-lg border border-brand-border"
                    placeholder="https://ejemplo.com"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsConnectModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Add Competitor */}
      {isAddCompetitorModalOpen && (
        <Modal
          isOpen={isAddCompetitorModalOpen}
          onClose={() => setIsAddCompetitorModalOpen(false)}
          title={t('googleIntelligence.modals.addCompetitorTitle')}
        >
          <form onSubmit={handleAddCompetitorSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-brand-text-primary block mb-1">
                {t('googleIntelligence.modals.compName')} *
              </label>
              <input
                type="text"
                required
                value={competitorForm.name}
                onChange={(e) => setCompetitorForm({ ...competitorForm, name: e.target.value })}
                className="w-full text-xs p-2 rounded-lg border border-brand-border"
                placeholder="Ej: Competidor Local A"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-brand-text-primary block mb-1">
                  {t('googleIntelligence.modals.compRating')}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={competitorForm.rating}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, rating: Number(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-brand-border"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-brand-text-primary block mb-1">
                  {t('googleIntelligence.modals.compReviews')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={competitorForm.userRatingsTotal}
                  onChange={(e) => setCompetitorForm({ ...competitorForm, userRatingsTotal: Number(e.target.value) })}
                  className="w-full text-xs p-2 rounded-lg border border-brand-border"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsAddCompetitorModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary">
                {t('common.save')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
