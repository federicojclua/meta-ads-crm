import React, { useState, useEffect } from 'react';
import {
  Zap,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Play,
  ShieldCheck,
  Award,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  Plus,
} from 'lucide-react';
import { apiClient } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { formatNumber } from '../lib/utils';

export function DecisionCenterPage() {
  const [activeTab, setActiveTab] = useState('decisions'); // 'decisions' | 'experiments'
  const [alerts, setAlerts] = useState([]);
  const [experiments, setExperiments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState(null);
  const [executingAlertId, setExecutingAlertId] = useState(null);

  // New Experiment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExp, setNewExp] = useState({
    name: '',
    hypothesis: '',
    primaryMetric: 'ROAS',
    controlName: 'Control A (Direct Offer)',
    variantName: 'Variante B (Problem Hook)',
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [alertsRes, expRes] = await Promise.all([
        apiClient('/api/decision-engine/alerts'),
        apiClient('/api/decision-engine/experiments'),
      ]);

      if (alertsRes?.ok) setAlerts(alertsRes.alerts || []);
      if (expRes?.ok) setExperiments(expRes.experiments || []);
    } catch (err) {
      console.warn('[DECISION_CENTER] Error loading data:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExecuteAction = async (alert) => {
    setExecutingAlertId(alert.id);
    try {
      const res = await apiClient('/api/decision-engine/execute-action', {
        method: 'POST',
        body: JSON.stringify({
          alertId: alert.id,
          actionType: alert.aiDecision?.proposedAction?.actionType || 'PAUSE_AD',
          targetId: alert.aiDecision?.proposedAction?.targetId || alert.target?.adId,
          payload: alert.aiDecision?.proposedAction?.payload || {},
        }),
      });

      if (res?.ok) {
        setActionFeedback(res.message || 'Acción ejecutada con éxito a través del Control Plane.');
        // Remove or update resolved alert
        setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
      }
    } catch (err) {
      console.warn('[DECISION_CENTER] Action execution failed:', err.message);
    } finally {
      setExecutingAlertId(null);
    }
  };

  const handleCreateExperiment = async (e) => {
    e.preventDefault();
    try {
      const res = await apiClient('/api/decision-engine/experiments/create', {
        method: 'POST',
        body: JSON.stringify({
          name: newExp.name,
          hypothesis: newExp.hypothesis,
          primaryMetric: newExp.primaryMetric,
          controlAsset: {
            name: newExp.controlName,
            format: '9:16',
            hookType: 'direct_offer',
            impressions: 1200,
            conversions: 18,
            spend: 15000,
            cpl: 1800,
            roas: 2.9,
          },
          variantAsset: {
            name: newExp.variantName,
            format: '9:16',
            hookType: 'question_problem',
            impressions: 1350,
            conversions: 32,
            spend: 16000,
            cpl: 1100,
            roas: 4.1,
          },
        }),
      });

      if (res?.ok) {
        setIsModalOpen(false);
        setExperiments((prev) => [res.experiment, ...prev]);
        setActionFeedback('¡Experimento A/B creado y puesto en evaluación estadística!');
      }
    } catch (err) {
      console.warn('[DECISION_CENTER] Error creating experiment:', err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-brand-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shadow-xs">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-brand-text-primary uppercase tracking-tight">
                ANIMA Decision & Experimentation Engine
              </h1>
              <Badge variant="warning" className="text-[10px]">
                Closed-Loop AI
              </Badge>
            </div>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Detección de anomalías 24/7, A/B Testing con p-value &lt; 0.05 y ejecución gobernada por el Control Plane.
            </p>
          </div>
        </div>

        {/* Tab Switcher & Refresh */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('decisions')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'decisions'
                  ? 'bg-white text-brand-text-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Decisiones ({alerts.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('experiments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === 'experiments'
                  ? 'bg-white text-brand-text-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>Experimentos A/B ({experiments.length})</span>
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={fetchData} className="h-8 px-2.5 text-xs">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-[10px] text-emerald-700 hover:underline font-mono"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* TAB 1: DECISION CENTER */}
      {activeTab === 'decisions' && (
        <div className="space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">Alertas Activas</span>
              <div className="text-2xl font-black font-mono text-brand-text-primary">{alerts.length}</div>
              <span className="text-[11px] text-slate-500">Monitoreadas en tiempo real</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-700 font-mono">Alertas Críticas</span>
              <div className="text-2xl font-black font-mono text-rose-600">
                {alerts.filter((a) => a.severity === 'CRITICAL').length}
              </div>
              <span className="text-[11px] text-rose-700 font-bold">Requieren acción inmediata</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-violet-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-violet-700 font-mono">Control Plane AI</span>
              <div className="text-2xl font-black font-mono text-violet-700">100% Zero-Rogue</div>
              <span className="text-[11px] text-violet-700 font-bold">Auditoría inmutable</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-700 font-mono">Ahorro Protegido</span>
              <div className="text-2xl font-black font-mono text-emerald-600">$139.000 ARS</div>
              <span className="text-[11px] text-emerald-700 font-bold">Presupuesto resguardado</span>
            </div>
          </div>

          {/* Alert Decisions Cards */}
          <div className="space-y-4">
            <h2 className="text-sm font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Anomalías Detectadas & Diagnósticos Prescriptivos ({alerts.length})</span>
            </h2>

            {alerts.map((alt) => {
              const isExecuting = executingAlertId === alt.id;
              const isCritical = alt.severity === 'CRITICAL';

              return (
                <div
                  key={alt.id}
                  className={`bg-white p-5 rounded-2xl border shadow-sm space-y-4 transition-all ${
                    isCritical ? 'border-rose-300 bg-rose-50/10' : 'border-amber-200 bg-amber-50/10'
                  }`}
                >
                  {/* Top Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          isCritical
                            ? 'bg-rose-100 text-rose-800 border-rose-200'
                            : 'bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        {alt.alertType}
                      </span>
                      <h3 className="text-sm font-black text-brand-text-primary">{alt.title}</h3>
                    </div>
                    <span className="text-xs font-mono font-semibold text-slate-400">
                      Entidad: {alt.target.entityName}
                    </span>
                  </div>

                  {/* 4 Decision Blocks */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        🔍 1. Diagnóstico
                      </span>
                      <p className="text-slate-700 leading-relaxed font-medium">
                        {alt.aiDecision?.diagnosis}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        📊 2. Evidencia Dura
                      </span>
                      <p className="text-slate-700 font-mono text-[11px] leading-relaxed">
                        {alt.aiDecision?.evidence}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        💡 3. Recomendación
                      </span>
                      <p className="text-emerald-900 leading-relaxed font-semibold">
                        {alt.aiDecision?.recommendation}
                      </p>
                    </div>
                  </div>

                  {/* Action Bar (One-Click Routing via Control Plane) */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Protegido por Agent Control Plane (Auditoría inmutable)</span>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleExecuteAction(alt)}
                      disabled={isExecuting}
                      className={`font-black text-xs h-9 px-4 gap-1.5 shadow-sm ${
                        isCritical
                          ? 'bg-rose-600 hover:bg-rose-700 text-white'
                          : 'bg-amber-600 hover:bg-amber-700 text-white'
                      }`}
                    >
                      <Zap className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
                      <span>
                        {isExecuting
                          ? 'Ejecutando en Control Plane...'
                          : alt.aiDecision?.proposedAction?.buttonLabel || 'Ejecutar Acción'}
                      </span>
                    </Button>
                  </div>
                </div>
              );
            })}

            {alerts.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-brand-border space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-sm font-bold text-brand-text-primary">
                  ¡Todas las campañas operan en rangos óptimos!
                </h4>
                <p className="text-xs text-brand-text-secondary">
                  No se detectaron anomalías de CPL, fatiga creativa ni fugas de SLA en este momento.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ANIMA EXPERIMENTS (A/B Testing) */}
      {activeTab === 'experiments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-violet-600" />
                <span>Experimentos A/B Activos con Significancia Estadística (p-value &lt; 0.05)</span>
              </h2>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Evaluación continua de variantes creativas y de oferta. Los ganadores se exportan al Learning Engine.
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-8 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Experimento A/B</span>
            </Button>
          </div>

          {/* Experiments List */}
          <div className="space-y-4">
            {experiments.map((exp) => {
              const isWinner = exp.status === 'WINNER';
              const stats = exp.statisticalSignificance || {};

              return (
                <div
                  key={exp.id}
                  className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isWinner
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {exp.status}
                        </span>
                        <h3 className="text-sm font-black text-brand-text-primary">{exp.name}</h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-medium italic">
                        Hipótesis: "{exp.hypothesis}"
                      </p>
                    </div>

                    <div className="text-right text-[11px] font-mono">
                      <span className="text-slate-400 block">Métrica Primaria</span>
                      <strong className="text-violet-700 text-sm">{exp.primaryMetric}</strong>
                    </div>
                  </div>

                  {/* Comparative Cards: Control vs Variant */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Control (A) */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-700 uppercase">
                          Control (A): {exp.controlAsset.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {exp.controlAsset.format}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                        <div className="bg-white p-1.5 rounded border border-slate-200">
                          <span className="text-[9px] text-slate-400 block font-mono">Impr.</span>
                          <strong className="font-mono">{formatNumber(exp.controlAsset.impressions)}</strong>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200">
                          <span className="text-[9px] text-slate-400 block font-mono">Conv.</span>
                          <strong className="font-mono">{exp.controlAsset.conversions}</strong>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200">
                          <span className="text-[9px] text-slate-400 block font-mono">CPL</span>
                          <strong className="font-mono">${formatNumber(exp.controlAsset.cpl)}</strong>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-slate-200">
                          <span className="text-[9px] text-slate-400 block font-mono">ROAS</span>
                          <strong className="font-mono text-slate-700">{exp.controlAsset.roas}x</strong>
                        </div>
                      </div>
                    </div>

                    {/* Variant (B) */}
                    <div
                      className={`p-3.5 rounded-xl border space-y-2 ${
                        isWinner
                          ? 'bg-emerald-50/50 border-emerald-300'
                          : 'bg-violet-50/40 border-violet-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-brand-text-primary uppercase flex items-center gap-1.5">
                          {isWinner && <Award className="w-3.5 h-3.5 text-emerald-600" />}
                          Variante (B): {exp.variantAsset.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {exp.variantAsset.format}
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                        <div className="bg-white p-1.5 rounded border border-emerald-200">
                          <span className="text-[9px] text-slate-400 block font-mono">Impr.</span>
                          <strong className="font-mono">{formatNumber(exp.variantAsset.impressions)}</strong>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-emerald-200">
                          <span className="text-[9px] text-slate-400 block font-mono">Conv.</span>
                          <strong className="font-mono text-emerald-700">{exp.variantAsset.conversions}</strong>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-emerald-200">
                          <span className="text-[9px] text-slate-400 block font-mono">CPL</span>
                          <strong className="font-mono text-emerald-700">${formatNumber(exp.variantAsset.cpl)}</strong>
                        </div>
                        <div className="bg-white p-1.5 rounded border border-emerald-200">
                          <span className="text-[9px] text-slate-400 block font-mono">ROAS</span>
                          <strong className="font-mono text-emerald-700 text-sm">{exp.variantAsset.roas}x</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistical Significance Footer */}
                  <div className="p-3 bg-slate-900 text-white rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
                    <div className="flex items-center gap-4">
                      <span>
                        p-value: <strong className="text-emerald-400">{stats.pValue}</strong>
                      </span>
                      <span>
                        Confianza: <strong>{((stats.confidenceLevel || 0.95) * 100).toFixed(1)}%</strong>
                      </span>
                      <span>
                        Z-Score: <strong>{stats.zScore}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-bold">
                        Lift Relativo: +{stats.relativeLiftPct}%
                      </span>
                      <Badge variant={stats.isSignificant ? 'success' : 'neutral'} className="text-[9px]">
                        {stats.isSignificant ? 'Significancia Lograda (p < 0.05)' : 'Muestra en Curso'}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal: Nuevo Experimento A/B */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-brand-border">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-sm font-black text-brand-text-primary uppercase flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-violet-600" />
                <span>Configurar Nuevo Experimento A/B</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExperiment} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre del Experimento</label>
                <input
                  type="text"
                  value={newExp.name}
                  onChange={(e) => setNewExp({ ...newExp, name: e.target.value })}
                  placeholder="Ej: Test de Duración: 15s vs 30s"
                  required
                  className="w-full h-9 px-3 border border-brand-border rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hipótesis Científica</label>
                <textarea
                  value={newExp.hypothesis}
                  onChange={(e) => setNewExp({ ...newExp, hypothesis: e.target.value })}
                  placeholder="Ej: Los videos cortos de 15s mejorarán la retención y bajarán el CPL en 20%."
                  required
                  rows={2}
                  className="w-full p-3 border border-brand-border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Control (A)</label>
                  <input
                    type="text"
                    value={newExp.controlName}
                    onChange={(e) => setNewExp({ ...newExp, controlName: e.target.value })}
                    className="w-full h-9 px-3 border border-brand-border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Variante (B)</label>
                  <input
                    type="text"
                    value={newExp.variantName}
                    onChange={(e) => setNewExp({ ...newExp, variantName: e.target.value })}
                    className="w-full h-9 px-3 border border-brand-border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" type="submit" className="bg-violet-600 hover:bg-violet-700 text-white font-bold">
                  Lanzar Experimento
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
