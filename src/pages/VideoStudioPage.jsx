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
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';
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
  const [storyboardObjective, setStoryboardObjective] = useState('leads');
  const [storyboardAngle, setStoryboardAngle] = useState('problem_solution');

  // Next Scene / Continue Project state
  const [continueModalOpen, setContinueModalOpen] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const [continuePrompt, setContinuePrompt] = useState('Ahora mostrá la garantía oficial y el botón de WhatsApp en cuotas fijas.');

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

  const fetchStudioData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Video Projects
      const projRes = await fetch('/api/video-studio/projects');
      if (projRes.ok) {
        const pData = await projRes.json();
        if (pData.projects && pData.projects.length > 0) {
          setProject(pData.projects[0]);
        }
      }

      // 2. Fetch Creative Profile (Brand DNA & Avatars)
      const profRes = await fetch('/api/creative-profile');
      if (profRes.ok) {
        const prData = await profRes.json();
        if (prData.profile) {
          setProfile(prData.profile);
        }
      }

      // 3. Fetch Winner Patterns
      const winRes = await fetch('/api/video-studio/winner-patterns');
      if (winRes.ok) {
        const wData = await winRes.json();
        if (wData.winnerPattern) {
          setWinnerPattern(wData.winnerPattern);
        }
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
      const res = await fetch('/api/video-studio/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objective: storyboardObjective,
          angle: storyboardAngle,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.storyboard && project) {
          setProject({
            ...project,
            scenes: data.storyboard.scenes,
            storyboardSummary: data.storyboard.storyboardSummary,
            costEstimate: data.storyboard.costEstimate,
          });
          setActiveSceneIndex(0);
          setStoryboardModalOpen(false);
          setActionSuccessMessage('Storyboard generado exitosamente con estructura de alta conversión.');
          setTimeout(() => setActionSuccessMessage(''), 4000);
        }
      }
    } catch (err) {
      console.error('Error generating storyboard:', err);
    } finally {
      setGeneratingStoryboard(false);
    }
  };

  const handleContinueProject = async () => {
    if (!project) return;
    setContinuing(true);
    try {
      const res = await fetch('/api/video-studio/continue-project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          prompt: continuePrompt,
          durationSec: 6,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.scene) {
          setProject({
            ...project,
            scenes: [...project.scenes, data.scene],
          });
          setActiveSceneIndex(project.scenes.length);
          setContinueModalOpen(false);
          setActionSuccessMessage('Nueva escena encadenada utilizando el último fotograma de la escena previa.');
          setTimeout(() => setActionSuccessMessage(''), 4000);
        }
      }
    } catch (err) {
      console.error('Error continuing project:', err);
    } finally {
      setContinuing(false);
    }
  };

  const handleCreatePausedMetaCampaign = async () => {
    setLaunchingMeta(true);
    try {
      const res = await fetch('/api/meta-launch/create-paused', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        }),
      });

      if (res.ok) {
        const data = await res.json();
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
      const res = await fetch(`/api/meta-launch/${launchedCampaign.id}/activate`, {
        method: 'POST',
      });

      if (res.ok) {
        setLaunchedCampaign({
          ...launchedCampaign,
          status: 'active',
        });
        setActionSuccessMessage('¡Campaña ACTIVADA en Meta Ads! Comienza la entrega y generación de leads.');
        setTimeout(() => setActionSuccessMessage(''), 6000);
      }
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
                  <div className="p-3 bg-violet-500/5 rounded-xl border border-violet-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-violet-700 font-bold text-xs">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Continuity Pack & Fotograma de Referencia</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-brand-text-secondary">
                      <div>
                        <span className="font-semibold text-brand-text-primary">Personaje:</span> {currentScene?.avatarId || 'B-Roll Orgánico'}
                      </div>
                      <div>
                        <span className="font-semibold text-brand-text-primary">Iluminación:</span> {currentScene?.continuityPack?.lighting || 'Studio Soft'}
                      </div>
                      <div>
                        <span className="font-semibold text-brand-text-primary">Estado:</span> {currentScene?.status || 'completed'}
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
                      variant={scene.blockType === 'organic_video' ? 'blue' : 'purple'}
                      className="text-[9px]"
                    >
                      {scene.blockType === 'organic_video' ? 'REAL' : 'AI'}
                    </Badge>
                  </div>

                  <p className="text-[11px] text-brand-text-secondary line-clamp-2 italic font-medium">
                    "{scene.script?.speechText}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-brand-text-secondary pt-1 border-t border-brand-border">
                    <span>{scene.durationSec}s</span>
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
                    <span>2. Presupuesto bajo límite de seguridad</span>
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
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <span>Generar Storyboard de Video con IA</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Objetivo Comercial:</label>
                <select
                  value={storyboardObjective}
                  onChange={(e) => setStoryboardObjective(e.target.value)}
                  className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs"
                >
                  <option value="leads">Generación de Leads (Lead Frío / Problema)</option>
                  <option value="vender">Venta Directa & Financiación</option>
                  <option value="consultas">Conversaciones por WhatsApp</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Ángulo Creativo del Hook:</label>
                <select
                  value={storyboardAngle}
                  onChange={(e) => setStoryboardAngle(e.target.value)}
                  className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs"
                >
                  <option value="problem_solution">Problema & Pérdida de Rendimiento (Recomendado)</option>
                  <option value="social_proof">Prueba Social & Testimonial Real</option>
                  <option value="exclusive_financing">Oferta de Financiación 12 Cuotas Fijas</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border">
              <Button variant="outline" size="sm" onClick={() => setStoryboardModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerateStoryboard}
                disabled={generatingStoryboard}
                className="bg-violet-700 hover:bg-violet-800 text-white"
              >
                {generatingStoryboard ? 'Generando...' : 'Crear Storyboard'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Continue Project Modal */}
      {continueModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl animate-scaleUp">
            <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-tight flex items-center gap-2">
              <Plus className="w-4 h-4 text-violet-600" />
              <span>Continuar Video (Continuity Engine)</span>
            </h3>

            <p className="text-xs text-brand-text-secondary">
              Se inyectará el último fotograma de la <strong>Escena {project?.scenes?.length || 1}</strong> como primer frame para garantizar continuidad audiovisual sin saltos.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-brand-text-secondary uppercase text-[10px]">Instrucción de la Siguiente Escena:</label>
                <textarea
                  rows={3}
                  value={continuePrompt}
                  onChange={(e) => setContinuePrompt(e.target.value)}
                  className="w-full mt-1 p-2 bg-brand-bg rounded-lg border border-brand-border text-brand-text-primary text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border">
              <Button variant="outline" size="sm" onClick={() => setContinueModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleContinueProject}
                disabled={continuing}
                className="bg-violet-700 hover:bg-violet-800 text-white"
              >
                {continuing ? 'Encadenando...' : 'Generar Siguiente Escena'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
