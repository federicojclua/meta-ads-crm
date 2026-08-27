import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Instagram,
  Facebook,
  UploadCloud,
  Link2,
  Trash2,
  TrendingUp,
  Award,
  Calendar,
  Layers,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  FileDown,
  Info,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
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

export function SocialAnalyzerPage() {
  const { userProfile, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();

  const isGlobal = ['super_admin', 'admin'].includes(userProfile?.role);
  const clientScope = userProfile?.clientId || null;

  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(clientScope || '');
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [latestAnalysis, setLatestAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modals
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);

  // Form states
  const [connectForm, setConnectForm] = useState({
    platform: 'instagram',
    accountUsername: '',
    accountName: '',
    biography: '',
    website: '',
    followersCount: '',
    followsCount: '',
  });

  const [uploadText, setUploadText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchSocialData = async (overrideClientId = null) => {
    if (authLoading || !userProfile) return;
    const targetId = overrideClientId !== null ? overrideClientId : (isGlobal ? selectedClientId : clientScope);

    setIsLoading(true);
    setError(null);
    try {
      const url = targetId ? `/api/social/sources?clientId=${encodeURIComponent(targetId)}` : '/api/social/sources';
      const res = await apiClient(url);

      if (res?.ok && Array.isArray(res.sources)) {
        setSources(res.sources);
        const activeSource = res.sources.length > 0 ? res.sources[0] : null;
        setSelectedSource(activeSource);

        if (activeSource) {
          fetchAnalysisHistory(activeSource.id || activeSource._id);
        } else {
          setLatestAnalysis(null);
          setAnalysisHistory([]);
        }
        setError(null);
      } else {
        setSources([]);
        setSelectedSource(null);
        setLatestAnalysis(null);
      }
    } catch (err) {
      console.error('[SOCIAL] Error loading social data:', err);
      if (userProfile && err.status !== 404) {
        setError(err.message || 'Error al cargar fuentes sociales.');
      }
      setSources([]);
      setSelectedSource(null);
      setLatestAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Fetch clients for global admins
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
              fetchSocialData(defaultId);
            } else {
              setSources([]);
              setSelectedSource(null);
              setLatestAnalysis(null);
              setIsLoading(false);
            }
          } else {
            setSources([]);
            setSelectedSource(null);
            setLatestAnalysis(null);
            setIsLoading(false);
          }
        })
        .catch((err) => {
          console.warn('[SOCIAL] Error loading clients:', err.message);
          setIsLoading(false);
        });
    } else if (clientScope) {
      setSelectedClientId(clientScope);
      fetchSocialData(clientScope);
    } else {
      setSources([]);
      setSelectedSource(null);
      setLatestAnalysis(null);
      setIsLoading(false);
    }
  }, [authLoading, userProfile, isGlobal, clientScope]);

  const fetchAnalysisHistory = async (sourceId) => {
    if (!sourceId) return;
    try {
      const res = await apiClient(`/api/social/analyze/history?sourceId=${encodeURIComponent(sourceId)}`);
      if (res?.ok && Array.isArray(res.analyses)) {
        setAnalysisHistory(res.analyses);
        setLatestAnalysis(res.analyses.length > 0 ? res.analyses[0] : null);
      }
    } catch (err) {
      console.warn('[SOCIAL] Error loading analyses:', err.message);
    }
  };

  // Connect profile handler
  const handleConnectSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const targetId = isGlobal ? selectedClientId : clientScope;
      const payload = {
        ...connectForm,
        clientId: targetId,
        sourceType: 'manual',
        followersCount: parseInt(connectForm.followersCount, 10) || 0,
        followsCount: parseInt(connectForm.followsCount, 10) || 0,
      };

      const res = await apiClient('/api/social/sources', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res?.ok) {
        setIsConnectModalOpen(false);
        setSuccessMessage('Perfil social vinculado exitosamente.');
        setConnectForm({
          platform: 'instagram',
          accountUsername: '',
          accountName: '',
          biography: '',
          website: '',
          followersCount: '',
          followsCount: '',
        });
        fetchSocialData();
      }
    } catch (err) {
      setError(err.message || 'Error al vincular el perfil social.');
    }
  };

  // Upload posts batch handler
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSource) return;
    setIsUploading(true);
    setError(null);

    try {
      let parsedPosts = [];
      const trimmed = uploadText.trim();

      if (trimmed.startsWith('[')) {
        // JSON parsing
        parsedPosts = JSON.parse(trimmed);
      } else {
        // CSV parsing fallback (simple CSV with headers: date, caption, format, likes, comments, shares, saves, reach, impressions)
        const lines = trimmed.split('\n').filter(Boolean);
        if (lines.length > 1) {
          const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const postObj = {};
            headers.forEach((h, idx) => {
              postObj[h] = values[idx]?.trim() || '';
            });
            parsedPosts.push(postObj);
          }
        }
      }

      if (!Array.isArray(parsedPosts) || parsedPosts.length === 0) {
        throw new Error('No se detectaron publicaciones válidas en el formato ingresado.');
      }

      const res = await apiClient('/api/social/snapshot', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: selectedSource.id,
          posts: parsedPosts,
          ingestionType: 'manual_upload',
        }),
      });

      if (res?.ok) {
        setIsUploadModalOpen(false);
        setUploadText('');
        setSuccessMessage(`Se han importado ${res.postsCount} publicaciones correctamente.`);
        fetchSocialData();
      }
    } catch (err) {
      setError(err.message || 'Error procesando el lote de publicaciones.');
    } finally {
      setIsUploading(false);
    }
  };

  // Run AI Diagnostic
  const handleRunDiagnostic = async () => {
    if (!selectedSource) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      const res = await apiClient('/api/social/analyze', {
        method: 'POST',
        body: JSON.stringify({
          sourceId: selectedSource.id,
        }),
      });

      if (res?.ok && res.analysis) {
        setLatestAnalysis(res.analysis);
        setSuccessMessage('Diagnóstico estratégico de IA generado exitosamente.');
        fetchAnalysisHistory(selectedSource.id);
      }
    } catch (err) {
      setError(err.message || 'Error al ejecutar el diagnóstico de IA.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Disconnect profile handler
  const handleDisconnect = async () => {
    if (!selectedSource) return;
    try {
      const res = await apiClient(`/api/social/sources/${selectedSource.id}`, {
        method: 'DELETE',
      });
      if (res?.ok) {
        setIsDisconnectModalOpen(false);
        setSuccessMessage('Perfil desconectado y datos purgados correctamente.');
        fetchSocialData();
      }
    } catch (err) {
      setError(err.message || 'Error al desconectar el perfil.');
    }
  };

  const deterministicMetrics = latestAnalysis?.deterministicMetrics || {};
  const aiReport = latestAnalysis?.aiReport || null;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-brand-text-primary flex items-center gap-2">
            <Sparkles className="w-7 h-7 text-brand-primary" />
            {t('socialAnalyzer.title')}
          </h1>
          <p className="text-sm text-brand-text-secondary mt-1">
            {t('socialAnalyzer.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Company Selector for global admins */}
          {isGlobal && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold uppercase text-brand-text-secondary">
                {t('socialAnalyzer.companyLabel')}
              </span>
              <select
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  fetchSocialData(e.target.value);
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
            {t('socialAnalyzer.connectProfile')}
          </Button>

          {selectedSource && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(true)}
              className="flex items-center gap-1.5"
            >
              <UploadCloud className="w-4 h-4 text-brand-primary" />
              {t('socialAnalyzer.importData')}
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
              {isAnalyzing ? t('socialAnalyzer.runningAi') : (latestAnalysis ? t('socialAnalyzer.reRunAiDiagnostic') : t('socialAnalyzer.runAiDiagnostic'))}
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

      {/* Content Body */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-brand-border">
          <RefreshCw className="w-6 h-6 animate-spin text-brand-primary mx-auto mb-2" />
          <p className="text-xs font-bold text-brand-text-secondary">Cargando analizador social...</p>
        </div>
      ) : sources.length === 0 ? (
        <EmptyState
          icon={Instagram}
          title={t('socialAnalyzer.noProfileTitle')}
          description={t('socialAnalyzer.noProfileDesc')}
          actionLabel={t('socialAnalyzer.connectProfile')}
          onAction={() => setIsConnectModalOpen(true)}
        />
      ) : (
        <div className="space-y-6">
          {/* Active Profile Card */}
          {selectedSource && (
            <div className="bg-white rounded-xl border border-brand-border p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shrink-0 flex items-center justify-center">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
                    {selectedSource.platform === 'facebook' ? (
                      <Facebook className="w-7 h-7 text-blue-600" />
                    ) : (
                      <Instagram className="w-7 h-7 text-pink-600" />
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-brand-text-primary">
                      @{selectedSource.accountUsername}
                    </h2>
                    <Badge variant="primary" className="text-[10px] uppercase">
                      {selectedSource.platform}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {selectedSource.sourceType === 'api_oauth'
                        ? t('socialAnalyzer.profileCard.sourceApi')
                        : t('socialAnalyzer.profileCard.sourceManual')}
                    </Badge>
                  </div>
                  <p className="text-xs text-brand-text-secondary mt-0.5 font-medium">
                    {selectedSource.accountName} {selectedSource.biography && `• "${selectedSource.biography.slice(0, 70)}..."`}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {t('socialAnalyzer.profileCard.lastUpdated')}: {selectedSource.lastSyncedAt ? formatDate(selectedSource.lastSyncedAt, 'America/Argentina/Buenos_Aires', language === 'es' ? 'es-AR' : 'en-US') : 'Sin sincronización'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-brand-border/60">
                <div className="text-center">
                  <span className="block text-base font-extrabold font-mono text-brand-text-primary">
                    {formatNumber(selectedSource.followersCount, language === 'es' ? 'es-AR' : 'en-US')}
                  </span>
                  <span className="text-[11px] text-brand-text-secondary font-medium">
                    {t('socialAnalyzer.profileCard.followers')}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-base font-extrabold font-mono text-brand-text-primary">
                    {formatNumber(selectedSource.followsCount, language === 'es' ? 'es-AR' : 'en-US')}
                  </span>
                  <span className="text-[11px] text-brand-text-secondary font-medium">
                    {t('socialAnalyzer.profileCard.following')}
                  </span>
                </div>
                <div className="text-center">
                  <span className="block text-base font-extrabold font-mono text-brand-text-primary">
                    {formatNumber(selectedSource.mediaCount || 0, language === 'es' ? 'es-AR' : 'en-US')}
                  </span>
                  <span className="text-[11px] text-brand-text-secondary font-medium">
                    {t('socialAnalyzer.profileCard.posts')}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDisconnectModalOpen(true)}
                  className="text-rose-600 hover:bg-rose-50 p-2"
                  title={t('socialAnalyzer.disconnect')}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* If no analysis exists yet */}
          {!latestAnalysis ? (
            <div className="p-8 text-center bg-white rounded-xl border border-brand-border space-y-3">
              <Zap className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-brand-text-primary">
                {t('socialAnalyzer.noSnapshotTitle')}
              </h3>
              <p className="text-xs text-brand-text-secondary max-w-md mx-auto">
                {t('socialAnalyzer.noSnapshotDesc')}
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <Button variant="primary" size="sm" onClick={() => setIsUploadModalOpen(true)}>
                  <UploadCloud className="w-4 h-4 mr-1.5" />
                  {t('socialAnalyzer.uploadPosts')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 1. DETERMINISTIC METRICS SECTION */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-text-secondary flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Métricas Deterministas Verificadas (Pre-IA)
                  </h3>
                  <span className="text-[11px] text-brand-text-secondary">
                    {deterministicMetrics.postsCount || 0} publicaciones analizadas en {deterministicMetrics.cadence?.coverageDays || 0} días
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Cadence */}
                  <div className="bg-white p-4 rounded-xl border border-brand-border shadow-subtle">
                    <span className="text-[11px] font-bold text-brand-text-secondary uppercase">
                      {t('socialAnalyzer.kpis.cadencePerWeek')}
                    </span>
                    <div className="text-2xl font-mono font-black text-brand-text-primary mt-1">
                      {deterministicMetrics.cadence?.postsPerWeek || 0}{' '}
                      <span className="text-xs font-normal text-brand-text-secondary">posts/sem</span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Promedio: {deterministicMetrics.cadence?.avgDaysBetweenPosts || 0} días entre posts
                    </p>
                  </div>

                  {/* Consistency Score */}
                  <div className="bg-white p-4 rounded-xl border border-brand-border shadow-subtle">
                    <span className="text-[11px] font-bold text-brand-text-secondary uppercase">
                      {t('socialAnalyzer.kpis.consistencyScore')}
                    </span>
                    <div className="text-2xl font-mono font-black text-emerald-700 mt-1">
                      {deterministicMetrics.consistencyScore || 0}/100
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Basado en regularidad de intervalos
                    </p>
                  </div>

                  {/* Engagement Rate */}
                  <div className="bg-white p-4 rounded-xl border border-brand-border shadow-subtle">
                    <span className="text-[11px] font-bold text-brand-text-secondary uppercase">
                      {t('socialAnalyzer.kpis.engagementRate')}
                    </span>
                    <div className="text-2xl font-mono font-black text-brand-primary mt-1">
                      {deterministicMetrics.rates?.engagementRateOverReach !== null
                        ? `${deterministicMetrics.rates.engagementRateOverReach}%`
                        : deterministicMetrics.rates?.engagementRateOverFollowers !== null
                        ? `${deterministicMetrics.rates.engagementRateOverFollowers}%`
                        : 'N/A'}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      {deterministicMetrics.rates?.engagementRateOverReach !== null
                        ? t('socialAnalyzer.kpis.erOverReach')
                        : t('socialAnalyzer.kpis.erOverFollowers')}
                    </p>
                  </div>

                  {/* Format Distribution */}
                  <div className="bg-white p-4 rounded-xl border border-brand-border shadow-subtle">
                    <span className="text-[11px] font-bold text-brand-text-secondary uppercase">
                      {t('socialAnalyzer.kpis.formatBreakdown')}
                    </span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden flex">
                        <div
                          style={{ width: `${deterministicMetrics.formatPercentages?.reel || 0}%` }}
                          className="bg-purple-500"
                          title={`Reels: ${deterministicMetrics.formatPercentages?.reel || 0}%`}
                        />
                        <div
                          style={{ width: `${deterministicMetrics.formatPercentages?.carousel || 0}%` }}
                          className="bg-blue-500"
                          title={`Carruseles: ${deterministicMetrics.formatPercentages?.carousel || 0}%`}
                        />
                        <div
                          style={{ width: `${deterministicMetrics.formatPercentages?.image || 0}%` }}
                          className="bg-emerald-500"
                          title={`Imágenes: ${deterministicMetrics.formatPercentages?.image || 0}%`}
                        />
                      </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1.5">
                      <span>Reels: {deterministicMetrics.formatPercentages?.reel || 0}%</span>
                      <span>Carruseles: {deterministicMetrics.formatPercentages?.carousel || 0}%</span>
                      <span>Fotos: {deterministicMetrics.formatPercentages?.image || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. AI EXECUTIVE DIAGNOSTIC REPORT */}
              {aiReport && (
                <div className="bg-gradient-to-b from-white to-gray-50/50 rounded-2xl border-2 border-brand-primary/20 p-6 shadow-card space-y-6">
                  {/* AI Header with Overall Score */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-brand-border">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-primary animate-pulse" />
                        <h2 className="text-lg font-extrabold text-brand-text-primary">
                          Diagnóstico Estratégico de Inteligencia Artificial
                        </h2>
                        <Badge variant="primary" className="text-[10px]">
                          {latestAnalysis.aiModel}
                        </Badge>
                      </div>
                      <p className="text-xs text-brand-text-secondary mt-1 max-w-2xl leading-relaxed">
                        {aiReport.executiveSummary}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 bg-brand-primary/5 px-4 py-2.5 rounded-xl border border-brand-primary/20 shrink-0">
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary block">
                          {t('socialAnalyzer.pillars.scoreLabel')}
                        </span>
                        <span className="text-xs font-bold text-brand-primary">
                          {aiReport.overallScore >= 80 ? 'Excelente' : aiReport.overallScore >= 65 ? 'Sólido' : 'Oportunidad de Mejora'}
                        </span>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-brand-primary text-white flex items-center justify-center text-xl font-black font-mono shadow-subtle">
                        {aiReport.overallScore}
                      </div>
                    </div>
                  </div>

                  {/* 5 Pillars Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {Object.entries(aiReport.pillars || {}).map(([key, p]) => (
                      <div key={key} className="bg-white p-3.5 rounded-xl border border-brand-border shadow-subtle flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-brand-text-primary">
                              {t(`socialAnalyzer.pillars.${key}`) || key}
                            </span>
                            <span className="text-xs font-mono font-extrabold text-brand-primary">
                              {p.score}/100
                            </span>
                          </div>
                          <p className="text-[10px] text-brand-text-secondary mt-1.5 leading-normal">
                            {p.assessment}
                          </p>
                        </div>
                        <div className="mt-3 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${p.score}%` }}
                            className={`h-full ${p.score >= 75 ? 'bg-emerald-500' : p.score >= 55 ? 'bg-amber-500' : 'bg-rose-500'}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Strategic Findings */}
                  {Array.isArray(aiReport.findings) && aiReport.findings.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-text-secondary flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-brand-primary" />
                        {t('socialAnalyzer.findingsTitle')}
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {aiReport.findings.map((f, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-brand-border shadow-subtle space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-brand-text-primary flex items-center gap-1.5">
                                {f.title}
                              </span>
                              <Badge
                                variant={f.priority === 'high' ? 'danger' : f.priority === 'medium' ? 'warning' : 'secondary'}
                                className="text-[9px] uppercase"
                              >
                                {f.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-brand-text-secondary leading-relaxed">
                              {f.description}
                            </p>
                            {f.evidence && (
                              <div className="text-[11px] bg-gray-50 px-2.5 py-1.5 rounded-lg border border-brand-border/60 text-brand-text-secondary font-mono">
                                <span className="font-bold text-brand-primary">{t('socialAnalyzer.evidenceLabel')}</span> {f.evidence}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 30-Day Action Plan */}
                  {Array.isArray(aiReport.actionPlan30Days) && aiReport.actionPlan30Days.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-extrabold uppercase tracking-wider text-brand-text-secondary flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        {t('socialAnalyzer.actionPlanTitle')}
                      </h3>

                      <div className="bg-white rounded-xl border border-brand-border shadow-subtle overflow-hidden">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-gray-50 border-b border-brand-border text-[11px] font-bold text-brand-text-secondary uppercase">
                              <th className="py-2.5 px-4">{t('socialAnalyzer.tableTh.phase')}</th>
                              <th className="py-2.5 px-4">{t('socialAnalyzer.tableTh.action')}</th>
                              <th className="py-2.5 px-4">{t('socialAnalyzer.tableTh.format')}</th>
                              <th className="py-2.5 px-4">{t('socialAnalyzer.tableTh.objective')}</th>
                              <th className="py-2.5 px-4">{t('socialAnalyzer.tableTh.impact')}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-brand-border">
                            {aiReport.actionPlan30Days.map((a, idx) => (
                              <tr key={idx} className="hover:bg-gray-50/50">
                                <td className="py-3 px-4 font-bold text-brand-text-primary whitespace-nowrap">
                                  {a.phase}
                                  <span className="block text-[10px] font-normal text-brand-text-secondary">{a.timing}</span>
                                </td>
                                <td className="py-3 px-4 text-brand-text-primary">{a.action}</td>
                                <td className="py-3 px-4 font-mono text-purple-700 font-semibold">{a.format}</td>
                                <td className="py-3 px-4 text-brand-text-secondary">{a.objective}</td>
                                <td className="py-3 px-4 text-emerald-700 font-semibold">{a.expectedImpact}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Risks & Limitations */}
                  {Array.isArray(aiReport.risksAndLimitations) && aiReport.risksAndLimitations.length > 0 && (
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
                      <span className="font-bold flex items-center gap-1.5 text-amber-800">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        {t('socialAnalyzer.risksTitle')}
                      </span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800/90">
                        {aiReport.risksAndLimitations.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Connect Social Profile */}
      <Modal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
        title={t('socialAnalyzer.modalConnect.title')}
      >
        <form onSubmit={handleConnectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">
              {t('socialAnalyzer.modalConnect.platform')}
            </label>
            <select
              value={connectForm.platform}
              onChange={(e) => setConnectForm({ ...connectForm, platform: e.target.value })}
              className="w-full text-xs bg-gray-50 border border-brand-border rounded-lg p-2 font-medium"
            >
              <option value="instagram">Instagram Business / Creator</option>
              <option value="facebook">Facebook Page Comercial</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">
              {t('socialAnalyzer.modalConnect.username')}
            </label>
            <input
              type="text"
              required
              placeholder="ej: animamkt"
              value={connectForm.accountUsername}
              onChange={(e) => setConnectForm({ ...connectForm, accountUsername: e.target.value })}
              className="w-full text-xs bg-gray-50 border border-brand-border rounded-lg p-2 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">
              {t('socialAnalyzer.modalConnect.accountName')}
            </label>
            <input
              type="text"
              placeholder="ej: Anima Marketing Digital"
              value={connectForm.accountName}
              onChange={(e) => setConnectForm({ ...connectForm, accountName: e.target.value })}
              className="w-full text-xs bg-gray-50 border border-brand-border rounded-lg p-2 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">
              {t('socialAnalyzer.modalConnect.biography')}
            </label>
            <textarea
              rows={2}
              placeholder="Texto de la biografía del perfil..."
              value={connectForm.biography}
              onChange={(e) => setConnectForm({ ...connectForm, biography: e.target.value })}
              className="w-full text-xs bg-gray-50 border border-brand-border rounded-lg p-2 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">
                {t('socialAnalyzer.modalConnect.followers')}
              </label>
              <input
                type="number"
                placeholder="10000"
                value={connectForm.followersCount}
                onChange={(e) => setConnectForm({ ...connectForm, followersCount: e.target.value })}
                className="w-full text-xs bg-gray-50 border border-brand-border rounded-lg p-2 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-brand-text-secondary uppercase mb-1">
                {t('socialAnalyzer.modalConnect.follows')}
              </label>
              <input
                type="number"
                placeholder="500"
                value={connectForm.followsCount}
                onChange={(e) => setConnectForm({ ...connectForm, followsCount: e.target.value })}
                className="w-full text-xs bg-gray-50 border border-brand-border rounded-lg p-2 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" type="button" onClick={() => setIsConnectModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {t('socialAnalyzer.modalConnect.save')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Upload Posts Batch (CSV/JSON) */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={t('socialAnalyzer.modalUpload.title')}
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <p className="text-xs text-brand-text-secondary">
            {t('socialAnalyzer.modalUpload.desc')}
          </p>

          <div>
            <textarea
              rows={8}
              required
              placeholder={t('socialAnalyzer.modalUpload.jsonPlaceholder')}
              value={uploadText}
              onChange={(e) => setUploadText(e.target.value)}
              className="w-full text-xs font-mono bg-gray-50 border border-brand-border rounded-lg p-2.5"
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => {
                const sample = JSON.stringify([
                  { timestamp: '2026-08-20T14:00:00Z', format: 'reel', caption: '¿Cómo escalar tus ventas con Meta Ads en 30 días?', likes: 240, comments: 38, shares: 19, saves: 85, reach: 4500 },
                  { timestamp: '2026-08-18T16:00:00Z', format: 'carousel', caption: '5 errores comunes en embudos de marketing digital', likes: 180, comments: 22, shares: 14, saves: 95, reach: 3800 },
                  { timestamp: '2026-08-15T11:30:00Z', format: 'image', caption: 'Nuevo caso de éxito: +350% de ROAS en eCommerce', likes: 110, comments: 9, shares: 5, saves: 20, reach: 2100 }
                ], null, 2);
                setUploadText(sample);
              }}
              className="text-xs text-brand-primary underline font-bold"
            >
              Cargar Ejemplo de Prueba
            </button>

            <div className="flex gap-2">
              <Button variant="secondary" size="sm" type="button" onClick={() => setIsUploadModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={isUploading}>
                {isUploading ? 'Procesando...' : t('socialAnalyzer.modalUpload.processUpload')}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Disconnect Confirmation */}
      <Modal
        isOpen={isDisconnectModalOpen}
        onClose={() => setIsDisconnectModalOpen(false)}
        title={t('socialAnalyzer.disconnect')}
      >
        <div className="space-y-4">
          <p className="text-xs text-brand-text-secondary leading-relaxed">
            {t('socialAnalyzer.confirmDisconnect')}
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setIsDisconnectModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" size="sm" onClick={handleDisconnect}>
              {t('socialAnalyzer.disconnect')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
export default SocialAnalyzerPage;
