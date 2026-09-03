import React, { useState, useEffect } from 'react';
import {
  Film,
  Video,
  Clapperboard,
  Mic,
  UserCheck,
  Sparkles,
  Play,
  Pause,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  TrendingDown,
  Layers,
  Coins,
  RefreshCw,
  Eye,
  Sliders,
  ExternalLink,
  ChevronRight,
  Radio,
  Lock,
  Building2,
  Scissors,
  HelpCircle,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { BLOCK_TYPE_LABELS } from '../../models/VideoProject.js';
import { MODEL_TIERS } from '../../models/AIUsage.js';

export function VideoStudioPage() {
  const { userProfile } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [profile, setProfile] = useState(null);
  const [winnerPattern, setWinnerPattern] = useState(null);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Storyboard Wizard state
  const [storyboardModalOpen, setStoryboardModalOpen] = useState(false);
  const [generatingStoryboard, setGeneratingStoryboard] = useState(false);
  const [storyboardObjective, setStoryboardObjective] = useState('consultas'); // 'consultas' = Conversaciones por WhatsApp
  const [storyboardAngle, setStoryboardAngle] = useState('fee_attack');
  const [storyboardClientName, setStoryboardClientName] = useState('Grupo Novati');
  const [storyboardPrompt, setStoryboardPrompt] = useState(
    'Quiero un video para e-commerce promocionando cobrar más barato con el número de comercio de Fiserv y te hacemos la web. El ángulo es mostrar los costos reales y bajos de una terminal común, atacando directamente los costos inflados que cobran los agregadores como Tienda Nube o Mercado Pago. Tono profesional pero directo.'
  );
  const [storyboardHook, setStoryboardHook] = useState(
    '¿Tenés un e-commerce y seguís regalando hasta un 7% de cada venta en comisiones a Mercado Pago o Tienda Nube?'
  );
  const [storyboardCompetitor, setStoryboardCompetitor] = useState(
    'Costos inflados de agregadores (Tienda Nube o Mercado Pago 6% a 7%) vs terminal común Fiserv'
  );
  const [storyboardOffer, setStoryboardOffer] = useState(
    'Te hacemos la web + cobrá con número de comercio Fiserv a costos reales y bajos'
  );
  const [storyboardTone, setStoryboardTone] = useState('Profesional pero directo');
  const [storyboardCta, setStoryboardCta] = useState('Hablar por WhatsApp con un asesor');
  const [storyboardEnvironment, setStoryboardEnvironment] = useState('fintech_modern_office');

  // Next Scene / Continue Project state (Continuity Engine & B-Roll)
  const [continueModalOpen, setContinueModalOpen] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [continueBlockType, setContinueBlockType] = useState('ai_avatar');
  const [continueTransition, setContinueTransition] = useState('cut');
  const [continuePrompt, setContinuePrompt] = useState(
    'Cobrar directo con Fiserv te deja el costo real de una terminal común sin intermediarios.'
  );
  const [continueVisualPrompt, setContinueVisualPrompt] = useState(
    'Mismo presentador en la misma oficina fintech moderna, contacto visual y plano medio continuo sin saltos.'
  );
  const [continueOnScreenText, setContinueOnScreenText] = useState('COSTOS REALES FISERV 📉');
  const [continueCtaText, setContinueCtaText] = useState('');
  const [continueEnvironment, setContinueEnvironment] = useState('fintech_modern_office');

  // Meta Ads Launch Wizard state
  const [metaWizardStep, setMetaWizardStep] = useState(1);
  const [metaDailyBudget, setMetaDailyBudget] = useState(25000);
  const [metaLocation, setMetaLocation] = useState('Argentina (Tucumán y NOA)');
  const [metaLeadFormQuestion, setMetaLeadFormQuestion] = useState('¿Qué producto o equipo te interesa financiar?');
  const [preflightPassed, setPreflightPassed] = useState(true);
  const [launchingMeta, setLaunchingMeta] = useState(false);
  const [launchedCampaign, setLaunchedCampaign] = useState(null);
  const [activating, setActivating] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  const loadNovatiPreset = () => {
    setStoryboardClientName('Grupo Novati');
    setStoryboardObjective('consultas');
    setStoryboardAngle('fee_attack');
    setStoryboardPrompt(
      'Quiero un video para e-commerce promocionando cobrar más barato con el número de comercio de Fiserv y te hacemos la web. El ángulo es mostrar los costos reales y bajos de una terminal común, atacando directamente los costos inflados que cobran los agregadores como Tienda Nube o Mercado Pago. Tono profesional pero directo.'
    );
    setStoryboardHook(
      '¿Tenés un e-commerce y seguís regalando hasta un 7% de cada venta en comisiones a Mercado Pago o Tienda Nube?'
    );
    setStoryboardCompetitor('Costos inflados de agregadores (Tienda Nube o Mercado Pago 6% a 7%) vs terminal común Fiserv');
    setStoryboardOffer('Te hacemos la web + cobrá con número de comercio Fiserv a costos reales y bajos');
    setStoryboardTone('Profesional pero directo');
    setStoryboardCta('Hablar por WhatsApp con un asesor');
    setStoryboardEnvironment('fintech_modern_office');
  };

  const fetchStudioData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Video Projects
      try {
        const pData = await apiClient('/api/video-studio/projects');
        if (pData?.projects && pData.projects.length > 0) {
          setProject(pData.projects[0]);
        }
      } catch (projErr) {
        console.warn('Could not load video projects:', projErr.message);
      }

      // 2. Fetch Creative Profile (Brand DNA & Avatars)
      try {
        const prData = await apiClient('/api/creative-profile');
        if (prData?.profile) {
          setProfile(prData.profile);
        }
      } catch (profErr) {
        console.warn('Could not load creative profile:', profErr.message);
      }

      // 3. Fetch Winner Patterns
      try {
        const wData = await apiClient('/api/video-studio/winner-patterns');
        if (wData?.winnerPattern) {
          setWinnerPattern(wData.winnerPattern);
        }
      } catch (winErr) {
        console.warn('Could not load winner patterns:', winErr.message);
      }
    } catch (err) {
      console.error('Error loading video studio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudioData();
  }, []);

  const handleGenerateStoryboard = async () => {
    setGeneratingStoryboard(true);
    try {
      const data = await apiClient.post('/api/video-studio/storyboard', {
        objective: storyboardObjective,
        angle: storyboardAngle,
        clientName: storyboardClientName,
        customPrompt: storyboardPrompt,
        customHook: storyboardHook,
        technicalBrief: {
          clientName: storyboardClientName,
          competitor: storyboardCompetitor,
          offer: storyboardOffer,
          tone: storyboardTone,
          cta: storyboardCta,
          environment: storyboardEnvironment,
        },
      });

      if (data?.storyboard) {
        const projectTitle = `Video Ad — ${storyboardClientName || profile?.brandIdentity?.commercialName || 'Cliente'} — Fiserv Direct`;
        setProject((prev) => ({
          ...(prev || {
            id: 'proj_new',
            title: projectTitle,
            objective: storyboardObjective,
            aspectRatio: '9:16',
            status: 'needs_review',
          }),
          title: projectTitle,
          scenes: data.storyboard.scenes || [],
          storyboardSummary: data.storyboard.storyboardSummary,
          costEstimate: data.storyboard.costEstimate,
        }));
        setActiveSceneIndex(0);
        setStoryboardModalOpen(false);
        setActionSuccessMessage(`Storyboard generado exitosamente para ${storyboardClientName} con gancho y continuidad.`);
        setTimeout(() => setActionSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error generating storyboard:', err);
      setActionSuccessMessage(`Error al generar storyboard: ${err.message || 'Verifique conexión'}`);
      setTimeout(() => setActionSuccessMessage(''), 5000);
    } finally {
      setGeneratingStoryboard(false);
    }
  };

  const handleContinueProject = async () => {
    if (!project) return;
    setContinuing(true);
    try {
      const data = await apiClient.post('/api/video-studio/continue-project', {
        projectId: project.id || project._id,
        prompt: continuePrompt,
        durationSec: 6,
        blockType: continueBlockType,
        transition: continueTransition,
        visualPrompt: continueVisualPrompt,
        onScreenText: continueOnScreenText,
        ctaText: continueCtaText,
        environment: continueEnvironment,
      });

      if (data?.scene) {
        setProject((prev) => ({
          ...prev,
          scenes: [...(prev?.scenes || []), data.scene],
        }));
        setActiveSceneIndex(project.scenes?.length || 0);
        setContinueModalOpen(false);
        setActionSuccessMessage('Nueva escena encadenada con continuidad de personaje, mismo ambiente y transición.');
        setTimeout(() => setActionSuccessMessage(''), 4000);
      }
    } catch (err) {
      console.error('Error continuing project:', err);
      setActionSuccessMessage(`Error al continuar video: ${err.message || 'Verifique conexión'}`);
      setTimeout(() => setActionSuccessMessage(''), 5000);
    } finally {
      setContinuing(false);
    }
  };

  const handleCreatePausedMetaCampaign = async () => {
    setLaunchingMeta(true);
    try {
      const data = await apiClient.post('/api/meta-launch/create-paused', {
        name: `Meta Lead Gen — ${profile?.brandIdentity?.commercialName || 'Cliente'} — Video V01`,
        businessObjective: 'leads',
        dailyBudget: metaDailyBudget,
        targeting: {
          location: metaLocation,
          ageMin: 25,
          ageMax: 55,
          advantagePlacements: true,
        },
        leadForm: {
          formName: 'Solicitud de Presupuesto & Financiación',
          customQuestion: metaLeadFormQuestion,
        },
      });

      if (data?.campaign) {
        setLaunchedCampaign(data.campaign);
        setMetaWizardStep(4); // Move to review & activation screen
        setActionSuccessMessage('¡Campaña creada exitosamente en Meta Ads en estado PAUSED!');
        setTimeout(() => setActionSuccessMessage(''), 5000);
      }
    } catch (err) {
      console.error('Error creating paused campaign:', err);
    } finally {
      setLaunchingMeta(false);
    }
  };

  const handleActivateMetaCampaign = async () => {
    if (!launchedCampaign) return;
    setActivating(true);
    try {
      await apiClient.post(`/api/meta-launch/${launchedCampaign.id}/activate`);
      setLaunchedCampaign((prev) => ({
        ...prev,
        status: 'active',
      }));
      setActionSuccessMessage('¡Campaña ACTIVADA en Meta Ads! Comienza la entrega y generación de leads.');
      setTimeout(() => setActionSuccessMessage(''), 6000);
    } catch (err) {
      console.error('Error activating campaign:', err);
    } finally {
      setActivating(false);
    }
  };

  const currentScene = project?.scenes?.[activeSceneIndex] || project?.scenes?.[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-700 flex items-center justify-center font-bold shadow-xs">
            <Clapperboard className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-brand-text-primary uppercase tracking-tight">
                AI Content & Lead Generation Studio
              </h1>
              <Badge variant="purple" className="text-[10px]">
                Veo 3.1 & Continuity Engine
              </Badge>
            </div>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Producción audiovisual para captación de leads: línea de tiempo híbrida (Orgánico + IA), avatares persistentes y lanzamiento a Meta Ads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStudioData}
            disabled={loading}
            className="text-xs h-8 px-2.5 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar</span>
          </Button>
          <Button
            variant="purple"
            size="sm"
            onClick={() => setActiveTab('meta_launch')}
            className="text-xs h-8 px-3 gap-1.5 bg-violet-700 hover:bg-violet-800 text-white shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Lanzar a Meta Ads</span>
          </Button>
        </div>
      </div>

      {/* Global Success Notification */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-brand-border text-xs font-semibold overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab('timeline')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'timeline'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>Mixed Media Timeline & Editor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('avatars_voices')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'avatars_voices'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Avatares & Perfiles de Voz</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('meta_launch')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'meta_launch'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Meta Ads Campaign Launch Engine</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('winner_costs')}
          className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'winner_costs'
              ? 'border-violet-600 text-violet-700 font-bold'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Lead Winner Mode & Control de Costos</span>
        </button>
      </div>

      {/* TAB 1: MIXED MEDIA TIMELINE & AUTO-EDITOR */}
      {activeTab === 'timeline' && (
        <div className="space-y-6">
          {/* Top Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-brand-surface rounded-xl border border-brand-border">
            <div>
              <h2 className="text-sm font-bold text-brand-text-primary flex items-center gap-2">
                <span>{project?.title || 'Video Ad Lead Gen'}</span>
                <Badge variant="blue" className="text-[10px]">
                  {project?.aspectRatio || '9:16 (Reels/Stories)'}
                </Badge>
                <Badge variant="green" className="text-[10px]">
                  {project?.status === 'needs_review' ? 'Listo para Revisión' : project?.status}
                </Badge>
              </h2>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Duración total: <strong className="text-brand-text-primary">{project?.scenes?.reduce((acc, s) => acc + (s.durationSec || 0), 0) || 24}s</strong> | Estructura Direct-Response ({project?.scenes?.length || 0} escenas)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStoryboardModalOpen(true)}
                className="text-xs h-8 px-3 gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                <span>Generar Storyboard con IA</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setContinueModalOpen(true)}
                className="text-xs h-8 px-3 gap-1.5 bg-violet-700 hover:bg-violet-800 text-white"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Continuar Video (+ Escena)</span>
              </Button>
            </div>
          </div>

          {/* Main Visual Workspace: Video Player + Scene Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: 9:16 Safe Zone Video Player (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="p-4 bg-brand-surface rounded-xl border border-brand-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                    Vista Previa (Safe Zones Reels)
                  </span>
                  <span className="text-[10px] text-brand-text-secondary">
                    Escena {activeSceneIndex + 1} de {project?.scenes?.length || 1}
                  </span>
                </div>

                {/* 9:16 Mockup Container */}
                <div className="relative mx-auto aspect-[9/16] max-h-[500px] w-full max-w-[280px] bg-slate-950 rounded-2xl overflow-hidden shadow-xl border-2 border-slate-800 flex flex-col justify-between">
                  {/* Background Mock Video or Last Frame */}
                  <img
                    src={currentScene?.continuityPack?.lastFrameUrl || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&auto=format&fit=crop&q=80'}
                    alt="Scene preview"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80"></div>

                  {/* Top Programmatic Overlay: Brand Logo */}
                  <div className="relative z-10 p-4 pt-6 flex items-center justify-between">
                    <div className="px-2 py-1 bg-black/60 backdrop-blur-md rounded border border-white/20 text-[10px] font-bold text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      <span>{profile?.brandIdentity?.commercialName || 'Anima Client'}</span>
                    </div>
                    <Badge variant="purple" className="text-[9px] bg-violet-900/80 text-violet-200 border-violet-500/40">
                      {currentScene?.blockType === 'organic_video' ? 'VIDEO REAL (B-Roll)' : 'AVATAR IA'}
                    </Badge>
                  </div>

                  {/* Center Safe Zone Bounding Box Indicator */}
                  <div className="relative z-10 mx-3 p-3 border border-dashed border-yellow-400/40 rounded-lg text-center space-y-1">
                    <span className="text-[9px] uppercase tracking-widest text-yellow-300 font-bold bg-black/50 px-1.5 py-0.5 rounded">
                      Zona Segura de Texto & Precios
                    </span>
                    <p className="text-xs font-black text-white drop-shadow-md leading-tight">
                      {currentScene?.script?.onScreenText || 'FINANCIACIÓN EN 12 CUOTAS FIJAS'}
                    </p>
                  </div>

                  {/* Bottom Programmatic Overlay: Call to Action & Subtitles */}
                  <div className="relative z-10 p-4 pb-6 space-y-2">
                    {/* Dynamic Captions */}
                    <div className="p-2 bg-black/70 backdrop-blur-md rounded-lg text-center border border-white/10">
                      <p className="text-[11px] text-white font-medium italic">
                        "{currentScene?.script?.speechText || '¿Tu computadora se queda trabada?'}"
                      </p>
                    </div>

                    {/* CTA Button */}
                    {currentScene?.script?.ctaText && (
                      <div className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 border border-emerald-400/50">
                        <Send className="w-3.5 h-3.5" />
                        <span>{currentScene.script.ctaText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Play Controls */}
                <div className="flex items-center justify-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSceneIndex(Math.max(0, activeSceneIndex - 1))}
                    disabled={activeSceneIndex === 0}
                    className="text-xs h-7 px-2"
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="text-xs h-7 px-3 gap-1 bg-violet-700 hover:bg-violet-800 text-white"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pausar' : 'Reproducir'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSceneIndex(Math.min((project?.scenes?.length || 1) - 1, activeSceneIndex + 1))}
                    disabled={activeSceneIndex === (project?.scenes?.length || 1) - 1}
                    className="text-xs h-7 px-2"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: Scene Detail Inspector & Continuity Pack (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 bg-brand-surface rounded-xl border border-brand-border space-y-4">
                <div className="flex items-center justify-between border-b border-brand-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">
                      {activeSceneIndex + 1}
                    </span>
                    <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-tight">
                      Escena {activeSceneIndex + 1}: {currentScene?.funnelRole?.toUpperCase()} ({currentScene?.durationSec || 5}s)
                    </h3>
                  </div>
                  <Badge variant={currentScene?.blockType === 'organic_video' ? 'blue' : 'purple'} className="text-[10px]">
                    {BLOCK_TYPE_LABELS[currentScene?.blockType] || currentScene?.blockType}
                  </Badge>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-brand-text-secondary uppercase">
                      Guion de Voz (Locución con IA o Grabación):
                    </label>
                    <p className="mt-1 p-2.5 bg-brand-bg rounded-lg text-brand-text-primary border border-brand-border leading-relaxed font-medium">
                      {currentScene?.script?.speechText}
                    </p>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-brand-text-secondary uppercase">
                      Prompt Visual & Dirección de Cámara:
                    </label>
                    <p className="mt-1 p-2 bg-brand-bg rounded-lg text-brand-text-secondary border border-brand-border font-mono text-[11px]">
                      {currentScene?.script?.visualPrompt}
                    </p>
                  </div>

                  {/* Continuity Pack Inspector */}
                  <div className="p-3.5 bg-violet-500/5 rounded-xl border border-violet-500/20 space-y-2">
                    <div className="flex items-center justify-between text-violet-700 dark:text-violet-300 font-bold text-xs">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" />
                        <span>Continuity Pack & Bloqueo de Secuencia</span>
                      </div>
                      <Badge variant="purple" className="text-[9px]">
                        {currentScene?.transition ? `Transición: ${currentScene.transition.toUpperCase()}` : 'Transición: CORTE DIRECTO'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-brand-text-secondary pt-1">
                      <div>
                        <span className="font-semibold text-brand-text-primary block">Personaje:</span>
                        <span>{currentScene?.continuityPack?.characterId || currentScene?.avatarId || 'Presentador Martina'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-brand-text-primary block">Ambiente:</span>
                        <span>{currentScene?.continuityPack?.environment === 'fintech_modern_office' ? 'Oficina Fintech' : currentScene?.continuityPack?.environment || 'Estudio Profesional'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-brand-text-primary block">Iluminación:</span>
                        <span>{currentScene?.continuityPack?.lighting || 'Studio Soft'}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-brand-text-primary block">Relleno/Bloque:</span>
                        <span className="text-violet-700 dark:text-violet-300 font-medium">
                          {currentScene?.blockType === 'b_roll_fill' ? 'B-Roll Orgánico' : currentScene?.blockType === 'ai_avatar' ? 'A-Roll Avatar' : currentScene?.blockType === 'cta_overlay' ? 'Placa CTA' : currentScene?.blockType}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Storyboard Funnel Breakdown */}
              <div className="p-4 bg-brand-surface rounded-xl border border-brand-border space-y-2">
                <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Estrategia de Funnel & Lead Gen</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 bg-brand-bg rounded-lg border border-brand-border">
                    <span className="text-[10px] text-brand-text-secondary font-bold uppercase">Ángulo del Hook:</span>
                    <p className="text-xs font-semibold text-brand-text-primary mt-0.5">
                      {project?.storyboardSummary?.hookAngle || 'Fricción y pérdida de tiempo'}
                    </p>
                  </div>
                  <div className="p-2.5 bg-brand-bg rounded-lg border border-brand-border">
                    <span className="text-[10px] text-brand-text-secondary font-bold uppercase">Meta de Rendimiento:</span>
                    <p className="text-xs font-semibold text-emerald-600 mt-0.5">
                      {project?.storyboardSummary?.cplOptimizationTarget || '-35% Costo por Lead'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Visual Timeline Bar (Mixed Media Tracks) */}
          <div className="p-4 bg-brand-surface rounded-xl border border-brand-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-violet-600" />
                <span className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                  Línea de Tiempo Mixta (Mixed Media Drag & Drop)
                </span>
              </div>
              <span className="text-xs text-brand-text-secondary font-medium">
                Pistas: Video + Avatar + Voz + Subtítulos + Overlays
              </span>
            </div>

            {/* Timeline Blocks */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {project?.scenes?.map((scene, idx) => (
                <div
                  key={scene.sceneId || idx}
                  onClick={() => setActiveSceneIndex(idx)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer space-y-2 ${
                    activeSceneIndex === idx
                      ? 'border-violet-600 bg-violet-500/10 shadow-md ring-2 ring-violet-500/20'
                      : 'border-brand-border bg-brand-bg hover:border-brand-border-strong'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-brand-text-primary">
                      {idx + 1}. {scene.funnelRole}
                    </span>
                    <Badge
                      variant={scene.blockType === 'b_roll_fill' ? 'yellow' : scene.blockType === 'organic_video' ? 'blue' : scene.blockType === 'cta_overlay' ? 'green' : 'purple'}
                      className="text-[9px]"
                    >
                      {scene.blockType === 'b_roll_fill' ? 'B-ROLL' : scene.blockType === 'cta_overlay' ? 'CTA' : scene.blockType === 'organic_video' ? 'REAL' : 'AVATAR'}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-brand-text-secondary line-clamp-2 italic font-medium">
                    "{scene.script?.speechText}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-brand-text-secondary pt-1 border-t border-brand-border">
                    <span>{scene.durationSec}s {scene.transition ? `• ${scene.transition}` : ''}</span>
                    <span className="text-emerald-600 font-bold">✓ Continuidad OK</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AVATARS & VOICE PROFILES */}
      {activeTab === 'avatars_voices' && (
        <div className="space-y-6">
          <div className="p-4 bg-brand-surface rounded-xl border border-brand-border">
            <h2 className="text-sm font-bold text-brand-text-primary uppercase tracking-tight flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-violet-600" />
              <span>Memoria de Avatares & Perfiles de Voz Persistentes</span>
            </h2>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Los avatares y voces configurados se inyectan automáticamente en cada proyecto para que la marca mantenga coherencia sin empezar de cero.
            </p>
          </div>

          {/* Avatars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profile?.avatarProfiles?.map((avatar) => (
              <div key={avatar.id} className="p-5 bg-brand-surface rounded-xl border border-brand-border space-y-4">
                <div className="flex items-start gap-4">
                  <img
                    src={avatar.referenceImages?.[0] || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80'}
                    alt={avatar.name}
                    className="w-20 h-20 rounded-xl object-cover border border-brand-border shadow-xs shrink-0"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-brand-text-primary">{avatar.name}</h3>
                      {avatar.isDefault && <Badge variant="purple" className="text-[9px]">Principal</Badge>}
                    </div>
                    <p className="text-xs text-brand-text-secondary font-medium">{avatar.role}</p>
                    <span className="inline-block text-[10px] px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-800 dark:text-violet-300 rounded font-mono">
                      AvatarID: {avatar.id}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1.5 text-xs">
                  <span className="text-[10px] font-bold text-brand-text-secondary uppercase">Reglas de Apariencia & Vestuario:</span>
                  <p className="text-brand-text-primary">{avatar.appearanceRules}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Voices Synthesizers */}
          <div className="p-5 bg-brand-surface rounded-xl border border-brand-border space-y-4">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <Mic className="w-4 h-4 text-violet-600" />
              <span>Sintetizadores de Voz Oficiales</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile?.voiceProfiles?.map((voice) => (
                <div key={voice.id} className="p-4 bg-brand-bg rounded-xl border border-brand-border space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-brand-text-primary">{voice.name}</h4>
                    <Badge variant="blue" className="text-[9px]">{voice.language}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs text-brand-text-secondary">
                    <span>Proveedor: {voice.provider}</span>
                    <span>Velocidad: {voice.speed}x</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: META ADS CAMPAIGN LAUNCH ENGINE */}
      {activeTab === 'meta_launch' && (
        <div className="space-y-6">
          <div className="p-5 bg-brand-surface rounded-xl border border-brand-border space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-brand-text-primary uppercase tracking-tight">
                    Meta Ads Campaign Launch Engine
                  </h2>
                  <p className="text-xs text-brand-text-secondary">
                    Orquestación segura: validación de 18 puntos y creación en estado <strong>PAUSED</strong> con presupuesto protegido.
                  </p>
                </div>
              </div>
              <Badge variant="green" className="text-xs font-bold">
                Conexión Meta ● Activa
              </Badge>
            </div>
          </div>

          {/* Launch Wizard Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Configuration Wizard (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-5 bg-brand-surface rounded-xl border border-brand-border space-y-4">
                <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                  Configuración de la Campaña de Leads
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-brand-text-secondary uppercase text-[11px]">
                      Cuenta Publicitaria Asignada:
                    </label>
                    <div className="mt-1 p-2.5 bg-brand-bg rounded-lg border border-brand-border font-medium text-brand-text-primary flex items-center justify-between">
                      <span>{profile?.brandIdentity?.commercialName || 'Anima Client'} (act_983748291)</span>
                      <Badge variant="blue" className="text-[10px]">ARS (Buenos Aires)</Badge>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-brand-text-secondary uppercase text-[11px]">
                      Presupuesto Diario Recomendado:
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <input
                        type="number"
                        value={metaDailyBudget}
                        onChange={(e) => setMetaDailyBudget(Number(e.target.value))}
                        className="w-full p-2.5 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs font-bold"
                      />
                      <span className="text-xs text-brand-text-secondary font-semibold shrink-0">ARS / día</span>
                    </div>
                    <span className="text-[10px] text-brand-text-secondary mt-1 block">
                      Límite de seguridad (Guardrail): Máximo $50.000 ARS/día.
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-brand-text-secondary uppercase text-[11px]">
                      Segmentación Geográfica (Geo-Targeting):
                    </label>
                    <input
                      type="text"
                      value={metaLocation}
                      onChange={(e) => setMetaLocation(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-brand-text-secondary uppercase text-[11px]">
                      Pregunta Personalizada en Formulario Instantáneo:
                    </label>
                    <input
                      type="text"
                      value={metaLeadFormQuestion}
                      onChange={(e) => setMetaLeadFormQuestion(e.target.value)}
                      className="w-full mt-1 p-2.5 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-brand-border">
                  <span className="text-xs text-brand-text-secondary">
                    Estado inicial tras creación: <strong className="text-amber-600 font-bold">PAUSED (Sin gasto)</strong>
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCreatePausedMetaCampaign}
                    disabled={launchingMeta}
                    className="text-xs h-8 px-4 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className={`w-3.5 h-3.5 ${launchingMeta ? 'animate-spin' : ''}`} />
                    <span>{launchingMeta ? 'Creando en Meta...' : 'Crear Campaña Pausada'}</span>
                  </Button>
                </div>
              </div>

              {/* Closed-Loop Attribution Dashboard (When campaign exists) */}
              {launchedCampaign && (
                <div className="p-5 bg-brand-surface rounded-xl border border-brand-border space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-brand-border pb-2">
                    <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Atribución a Ciclo Cerrado (ROAS & CRM Sales)</span>
                    </h3>
                    <Badge variant="blue" className="text-[10px]">Campaña Activa en Sync</Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className="p-2.5 bg-brand-bg rounded-lg border border-brand-border">
                      <span className="text-[10px] text-brand-text-secondary uppercase">Gasto Meta</span>
                      <p className="font-bold text-brand-text-primary mt-0.5">$124.500</p>
                    </div>
                    <div className="p-2.5 bg-brand-bg rounded-lg border border-brand-border">
                      <span className="text-[10px] text-brand-text-secondary uppercase">Leads Generados</span>
                      <p className="font-bold text-brand-text-primary mt-0.5">84 leads</p>
                    </div>
                    <div className="p-2.5 bg-brand-bg rounded-lg border border-brand-border">
                      <span className="text-[10px] text-brand-text-secondary uppercase">Ventas Cerradas</span>
                      <p className="font-bold text-emerald-600 mt-0.5">14 ventas</p>
                    </div>
                    <div className="p-2.5 bg-brand-bg rounded-lg border border-brand-border">
                      <span className="text-[10px] text-brand-text-secondary uppercase">ROAS Real</span>
                      <p className="font-black text-emerald-600 mt-0.5">146.1x</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: 18-Point Pre-Flight Validation Check (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 bg-brand-surface rounded-xl border border-brand-border space-y-3">
                <div className="flex items-center justify-between border-b border-brand-border pb-2">
                  <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Pre-Flight Check (18/18)</span>
                  </h3>
                  <Badge variant="green" className="text-[10px]">Listo para Crear</Badge>
                </div>

                <div className="space-y-1.5 text-[11px] max-h-[300px] overflow-y-auto pr-1">
                  <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>1. Token de Meta Ads verificado</span>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>2. Presupuesto bajo límite de seguridad ($50.000 max)</span>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>3. Formulario de Leads con 4 campos y privacidad</span>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>4. Ubicaciones Advantage+ optimizadas</span>
                  </div>
                  <div className="p-2 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>5. Permisos de ads_management confirmados</span>
                  </div>
                </div>

                {/* Activation Box after Paused Creation */}
                {launchedCampaign && (
                  <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        Campaña en Meta: {launchedCampaign.metaCampaignId}
                      </span>
                      <Badge variant={launchedCampaign.status === 'active' ? 'green' : 'yellow'} className="text-[10px]">
                        {launchedCampaign.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400">
                      La campaña se encuentra en pausa. Al confirmar la activación comenzará la subasta y generación de leads en tiempo real.
                    </p>
                    {launchedCampaign.status !== 'active' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleActivateMetaCampaign}
                        disabled={activating}
                        className="w-full text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{activating ? 'Activando...' : 'Confirmar & Activar Campaña'}</span>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WINNER INTELLIGENCE & COST CONTROL */}
      {activeTab === 'winner_costs' && (
        <div className="space-y-6">
          <div className="p-5 bg-brand-surface rounded-xl border border-brand-border space-y-2">
            <h2 className="text-sm font-bold text-brand-text-primary uppercase tracking-tight flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-emerald-600" />
              <span>Lead Winner Mode (Inteligencia de Performance)</span>
            </h2>
            <p className="text-xs text-brand-text-secondary">
              Análisis continuo de rendimiento publicitario para detectar qué patrones creativos reducen el Costo por Lead (CPL).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Winner Pattern Card */}
            <div className="p-5 bg-brand-surface rounded-xl border border-brand-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                  Patrón Ganador Detectado
                </span>
                <Badge variant="green" className="text-[10px]">
                  {winnerPattern?.cplReductionObserved || '-34.8% CPL'}
                </Badge>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-2.5 bg-brand-bg rounded-lg border border-brand-border">
                  <span className="text-[10px] text-brand-text-secondary font-bold uppercase">Mejor Hook:</span>
                  <p className="font-semibold text-brand-text-primary mt-0.5">{winnerPattern?.bestHookAngle}</p>
                </div>
                <div className="p-2.5 bg-brand-bg rounded-lg border border-brand-border">
                  <span className="text-[10px] text-brand-text-secondary font-bold uppercase">Presentador / Avatar:</span>
                  <p className="font-semibold text-brand-text-primary mt-0.5">{winnerPattern?.bestPresenter}</p>
                </div>
                <div className="p-2.5 bg-brand-bg rounded-lg border border-brand-border">
                  <span className="text-[10px] text-brand-text-secondary font-bold uppercase">Formato & Duración Óptima:</span>
                  <p className="font-semibold text-brand-text-primary mt-0.5">{winnerPattern?.bestPlacement} ({winnerPattern?.bestDurationSec})</p>
                </div>
              </div>
            </div>

            {/* AI Usage & Cost Observability */}
            <div className="p-5 bg-brand-surface rounded-xl border border-brand-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-violet-600" />
                  <span>Control de Créditos de IA (Tenant)</span>
                </span>
                <Badge variant="purple" className="text-[10px]">Veo 3.1 Lite</Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-brand-bg rounded-lg border border-brand-border space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span>Créditos Consumidos</span>
                    <span>45 / 2,000</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-violet-600 h-full w-[2.25%]"></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="p-2 bg-brand-bg rounded border border-brand-border">
                    <span className="text-brand-text-secondary block">Videos</span>
                    <strong className="text-brand-text-primary">4 generados</strong>
                  </div>
                  <div className="p-2 bg-brand-bg rounded border border-brand-border">
                    <span className="text-brand-text-secondary block">Voces</span>
                    <strong className="text-brand-text-primary">8 clips</strong>
                  </div>
                  <div className="p-2 bg-brand-bg rounded border border-brand-border">
                    <span className="text-brand-text-secondary block">Costo Est.</span>
                    <strong className="text-emerald-600">$3.40 USD</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Storyboard Modal */}
      {storyboardModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-scaleUp max-h-[92vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-border pb-3">
              <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600" />
                <span>Generar Storyboard de Video con IA (Direct-Response)</span>
              </h3>
              <button
                type="button"
                onClick={loadNovatiPreset}
                className="px-2.5 py-1 text-[11px] font-bold bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 rounded-lg hover:bg-violet-200 dark:hover:bg-violet-800/50 border border-violet-300 dark:border-violet-700 flex items-center gap-1.5 transition-all shadow-xs cursor-pointer self-start sm:self-auto"
                title="Cargar parámetros de Grupo Novati, Fiserv y WhatsApp"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Cargar Preset: Grupo Novati (Fiserv vs MP)</span>
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Row 1: Company Name & Commercial Objective */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px] flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-violet-600" />
                    <span>Empresa / Cliente:</span>
                  </label>
                  <input
                    type="text"
                    value={storyboardClientName}
                    onChange={(e) => setStoryboardClientName(e.target.value)}
                    placeholder="Ej: Grupo Novati"
                    className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs font-semibold focus:outline-hidden focus:border-violet-600"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px] flex items-center gap-1">
                    <Send className="w-3 h-3 text-violet-600" />
                    <span>Objetivo Comercial del Video:</span>
                  </label>
                  <select
                    value={storyboardObjective}
                    onChange={(e) => setStoryboardObjective(e.target.value)}
                    className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs focus:outline-hidden focus:border-violet-600"
                  >
                    <option value="consultas">Conversaciones por WhatsApp (Venta E-Commerce & Asesoramiento)</option>
                    <option value="leads">Generación de Leads (Lead Frío / Problema)</option>
                    <option value="vender">Venta Directa & Financiación</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Commercial Brief & Prompt */}
              <div>
                <label className="font-bold text-brand-text-secondary uppercase text-[10px] flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-violet-600" />
                  <span>Prompt / Brief Comercial Completo:</span>
                </label>
                <textarea
                  rows={3}
                  value={storyboardPrompt}
                  onChange={(e) => setStoryboardPrompt(e.target.value)}
                  placeholder="Describí qué querés promocionar, qué fricción atacar y qué propuesta hacer..."
                  className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs leading-relaxed focus:outline-hidden focus:border-violet-600"
                />
              </div>

              {/* Row 3: Hook Angle & Hook Text */}
              <div className="p-3 bg-violet-500/5 rounded-xl border border-violet-500/20 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-violet-900 dark:text-violet-300 uppercase text-[10px]">
                      Ángulo Creativo del Gancho (Hook):
                    </label>
                    <select
                      value={storyboardAngle}
                      onChange={(e) => setStoryboardAngle(e.target.value)}
                      className="w-full mt-1 p-2 bg-brand-surface rounded-lg border border-brand-border text-brand-text-primary text-xs font-semibold focus:outline-hidden focus:border-violet-600"
                    >
                      <option value="fee_attack">Ataque a Comisiones Ocultas / Agregadores (Recomendado)</option>
                      <option value="custom">Hook Personalizado (Escribir mi propio texto)</option>
                      <option value="problem_solution">Problema & Pérdida de Rendimiento</option>
                      <option value="social_proof">Prueba Social & Testimonial Real</option>
                      <option value="exclusive_financing">Oferta de Financiación 12 Cuotas Fijas</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-violet-900 dark:text-violet-300 uppercase text-[10px]">
                      Ambiente & Continuidad Escénica:
                    </label>
                    <select
                      value={storyboardEnvironment}
                      onChange={(e) => setStoryboardEnvironment(e.target.value)}
                      className="w-full mt-1 p-2 bg-brand-surface rounded-lg border border-brand-border text-brand-text-primary text-xs focus:outline-hidden focus:border-violet-600"
                    >
                      <option value="fintech_modern_office">Oficina Fintech Ejecutiva & Moderna (Recomendado)</option>
                      <option value="tech_studio">Estudio Tecnológico Neutro (Minimalista)</option>
                      <option value="store_retail">Mostrador Comercial / Punto de Venta</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-violet-900 dark:text-violet-300 uppercase text-[10px]">
                    Texto Exacto del Gancho (Primeros 3 Segundos):
                  </label>
                  <textarea
                    rows={2}
                    value={storyboardHook}
                    onChange={(e) => setStoryboardHook(e.target.value)}
                    placeholder="Escribí la primera frase impactante para retener el scroll..."
                    className="w-full mt-1 p-2 bg-brand-surface rounded-lg border border-brand-border text-brand-text-primary text-xs font-semibold focus:outline-hidden focus:border-violet-600 leading-snug"
                  />
                </div>
              </div>

              {/* Row 4: Technical Guided Questions */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-brand-text-secondary uppercase tracking-wider flex items-center gap-1">
                  <HelpCircle className="w-3 h-3 text-brand-text-secondary" />
                  <span>Cuestionario Técnico Guiado (Direct-Response Briefing):</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-semibold text-brand-text-secondary">Fricción o Competidor a Atacar:</label>
                    <input
                      type="text"
                      value={storyboardCompetitor}
                      onChange={(e) => setStoryboardCompetitor(e.target.value)}
                      className="w-full mt-0.5 p-1.5 bg-brand-bg rounded border border-brand-border text-brand-text-primary text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-brand-text-secondary">Propuesta de Valor & Solución:</label>
                    <input
                      type="text"
                      value={storyboardOffer}
                      onChange={(e) => setStoryboardOffer(e.target.value)}
                      className="w-full mt-0.5 p-1.5 bg-brand-bg rounded border border-brand-border text-brand-text-primary text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-brand-text-secondary">Tono de Comunicación:</label>
                    <input
                      type="text"
                      value={storyboardTone}
                      onChange={(e) => setStoryboardTone(e.target.value)}
                      className="w-full mt-0.5 p-1.5 bg-brand-bg rounded border border-brand-border text-brand-text-primary text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-brand-text-secondary">Llamado a la Acción (CTA WhatsApp):</label>
                    <input
                      type="text"
                      value={storyboardCta}
                      onChange={(e) => setStoryboardCta(e.target.value)}
                      className="w-full mt-0.5 p-1.5 bg-brand-bg rounded border border-brand-border text-brand-text-primary text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
              <Button variant="outline" size="sm" onClick={() => setStoryboardModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateStoryboard}
                disabled={generatingStoryboard}
                className="bg-violet-700 hover:bg-violet-800 text-white font-bold px-4"
              >
                {generatingStoryboard ? 'Generando Storyboard...' : 'Crear Storyboard con IA'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Project Modal */}
      {continueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl animate-scaleUp max-h-[92vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-tight flex items-center gap-2 border-b border-brand-border pb-3">
              <Plus className="w-4 h-4 text-violet-600" />
              <span>Continuar Video (Continuity Engine — Sin Saltos)</span>
            </h3>

            {/* Continuity Guarantee Badge */}
            <div className="p-3 bg-violet-500/10 rounded-xl border border-violet-500/20 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 text-violet-800 dark:text-violet-300 font-bold text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span>Bloqueo de Continuidad Audiovisual Activo</span>
              </div>
              <p className="text-[11px] text-brand-text-secondary leading-relaxed">
                Se inyectará el último fotograma de la <strong>Escena {project?.scenes?.length || 1}</strong> como primer frame. Mismo personaje, mismo vestuario, misma oficina e iluminación uniforme.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              {/* Row 1: Scene Type & Transition */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">
                    Tipo de Escena / Relleno (B-Roll vs A-Roll):
                  </label>
                  <select
                    value={continueBlockType}
                    onChange={(e) => setContinueBlockType(e.target.value)}
                    className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs focus:outline-hidden focus:border-violet-600"
                  >
                    <option value="ai_avatar">Avatar / Presentador hablando (A-Roll)</option>
                    <option value="b_roll_fill">B-Roll / Relleno Orgánico (Pantalla / Terminal Fiserv)</option>
                    <option value="product_demo">Demostración de Tienda Web (Navegación e-commerce)</option>
                    <option value="comparison_graphic">Placa Gráfica de Costos (Comparativa)</option>
                    <option value="cta_overlay">Placa Final con Botón de WhatsApp (CTA)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px] flex items-center gap-1">
                    <Scissors className="w-3 h-3 text-violet-600" />
                    <span>Transición Audiovisual:</span>
                  </label>
                  <select
                    value={continueTransition}
                    onChange={(e) => setContinueTransition(e.target.value)}
                    className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs focus:outline-hidden focus:border-violet-600"
                  >
                    <option value="cut">Corte Directo (Hard Cut — Estándar Direct-Response)</option>
                    <option value="smooth_push_in">Zoom Suave / Push In (Foco dramático)</option>
                    <option value="whip_pan">Whip Pan (Barrido dinámico a los lados)</option>
                    <option value="cross_dissolve">Disolución Cruzada (Suave)</option>
                    <option value="match_cut">Match Cut (Coincidencia visual de encuadre)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Speech Script */}
              <div>
                <label className="font-bold text-brand-text-secondary uppercase text-[10px]">
                  Guion de Voz / Locución (Qué dice en esta escena):
                </label>
                <textarea
                  rows={2}
                  value={continuePrompt}
                  onChange={(e) => setContinuePrompt(e.target.value)}
                  placeholder="Escribí el diálogo exacto que dirá el presentador o la locución..."
                  className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs font-medium focus:outline-hidden focus:border-violet-600"
                />
              </div>

              {/* Row 3: Visual Prompt */}
              <div>
                <label className="font-bold text-brand-text-secondary uppercase text-[10px]">
                  Prompt Visual & Dirección de Cámara (Qué se muestra en escena):
                </label>
                <textarea
                  rows={2}
                  value={continueVisualPrompt}
                  onChange={(e) => setContinueVisualPrompt(e.target.value)}
                  placeholder="Instrucción de cámara, plano y acción visual en el mismo ambiente..."
                  className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs text-brand-text-secondary font-mono text-[11px] focus:outline-hidden focus:border-violet-600"
                />
              </div>

              {/* Row 4: On-Screen Text & CTA Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">
                    Texto en Pantalla (Zona Segura):
                  </label>
                  <input
                    type="text"
                    value={continueOnScreenText}
                    onChange={(e) => setContinueOnScreenText(e.target.value)}
                    placeholder="Ej: COSTOS REALES FISERV 📉"
                    className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-text-secondary uppercase text-[10px]">
                    Botón CTA (Opcional):
                  </label>
                  <input
                    type="text"
                    value={continueCtaText}
                    onChange={(e) => setContinueCtaText(e.target.value)}
                    placeholder="Ej: CONSULTAR POR WHATSAPP"
                    className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
              <Button variant="outline" size="sm" onClick={() => setContinueModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleContinueProject}
                disabled={continuing}
                className="bg-violet-700 hover:bg-violet-800 text-white font-bold px-4"
              >
                {continuing ? 'Encadenando Escena...' : 'Generar Siguiente Escena'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
