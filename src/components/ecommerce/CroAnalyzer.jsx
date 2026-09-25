import React, { useState } from 'react';
import {
  Search,
  Sparkles,
  Zap,
  FileText,
  Download,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../lib/api';

/**
 * Auditoría UI/UX & Agente de Optimización CRO.
 * Permite auditar una landing page en 10 dimensiones, ver fricciones y generar informe.
 */
export function CroAnalyzer({
  initialUrl = '',
  initialAudience = 'Tráfico Frío Meta Ads',
}) {
  const [croUrl, setCroUrl] = useState(initialUrl);
  const [croAudience, setCroAudience] = useState(initialAudience);
  const [croAudit, setCroAudit] = useState(null);
  const [legacyCroDiag, setLegacyCroDiag] = useState(null);
  const [isAuditingCro, setIsAuditingCro] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const handleAnalyzeCro = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsAuditingCro(true);
    try {
      const [res, diagRes] = await Promise.all([
        apiClient('/api/ecommerce/cro/analyze', {
          method: 'POST',
          body: JSON.stringify({
            url: croUrl || 'https://tienda-oficial.com.ar/producto',
            targetAudience: croAudience,
          }),
        }),
        apiClient('/api/ecommerce/cro-diagnose', {
          method: 'POST',
          body: JSON.stringify({}),
        }),
      ]);

      if (res?.ok && res.audit) {
        setCroAudit(res.audit);
      }
      if (diagRes?.ok && diagRes.diagnostic) {
        setLegacyCroDiag(diagRes.diagnostic);
      }
    } catch (err) {
      console.warn('[CRO_ANALYSIS] Error:', err.message);
    } finally {
      setIsAuditingCro(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Friction Banner */}
      <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">
            Puntaje de Fricción UI/UX
          </span>
          <div className="text-2xl font-black text-rose-600 mt-0.5">
            68 / 100 · Severidad CRÍTICA
          </div>
          <span className="text-xs text-slate-500">
            Abandono masivo en pasarela de pagos detectado
          </span>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={handleAnalyzeCro}
          disabled={isAuditingCro}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 px-4 gap-2"
        >
          <Sparkles className={`w-4 h-4 ${isAuditingCro ? 'animate-spin' : ''}`} />
          <span>{isAuditingCro ? 'Diagnosticando...' : 'Ejecutar Diagnóstico CRO con IA'}</span>
        </Button>
      </div>

      {/* Legacy Diagnostic Result if present */}
      {legacyCroDiag && (
        <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-3 text-xs animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <strong className="text-brand-text-primary text-sm">{legacyCroDiag.title}</strong>
            <Badge variant="danger">{legacyCroDiag.overallSeverity}</Badge>
          </div>
          <span className="text-emerald-700 font-bold block">{legacyCroDiag.estimatedRevenueLift}</span>
          <div className="space-y-2">
            {(legacyCroDiag.bottlenecks || []).map((b, i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <strong className="text-slate-800">{b.step}</strong>
                  <span className="text-rose-600 block text-[11px]">{b.dropoff} — {b.rootCause}</span>
                </div>
                <Badge variant="warning">{b.priority}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleAnalyzeCro} className="bg-white p-6 rounded-2xl border border-brand-border shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
            <Search className="w-4 h-4 text-violet-600" />
            <span>Auditoría CRO de Landing Page & Embudo de Conversión</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">10 Dimensiones de Conversión</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="md:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">URL de la Landing Page</label>
            <input
              type="url"
              value={croUrl}
              onChange={(e) => setCroUrl(e.target.value)}
              placeholder="https://tienda.com/landing-oferta"
              className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Audiencia / Origen de Tráfico</label>
            <input
              type="text"
              value={croAudience}
              onChange={(e) => setCroAudience(e.target.value)}
              className="w-full h-9 px-3 border border-brand-border rounded-lg text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={isAuditingCro}
            className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 px-5 gap-2"
          >
            <Sparkles className={`w-4 h-4 ${isAuditingCro ? 'animate-spin' : ''}`} />
            <span>{isAuditingCro ? 'Auditando Landing...' : 'Ejecutar Auditoría CRO Completa'}</span>
          </Button>
        </div>
      </form>

      {/* CRO Audit Results */}
      {croAudit && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] uppercase font-mono text-emerald-400 block font-bold">
                Puntuación CRO Global
              </span>
              <h3 className="text-2xl font-black font-mono text-white mt-1">
                {croAudit.croScore}/100 · Rendimiento Móvil
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {croAudit.executiveSummary}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPdfModalOpen(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs h-9 gap-2 shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>📄 Generar Informe PDF</span>
              </Button>
            </div>
          </div>

          {/* Quick Wins Matrix */}
          <div className="bg-emerald-50/50 border border-emerald-200 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span>Quick Wins (Alto Impacto / Bajo Esfuerzo de Implementación)</span>
              </span>
              <Badge variant="success" className="text-[9px]">
                {croAudit.quickWins?.length || 0} Oportunidades Inmediatas
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {(croAudit.quickWins || []).map((qw, i) => (
                <div key={i} className="bg-white p-3.5 rounded-xl border border-emerald-200/80 space-y-1.5 text-xs shadow-2xs">
                  <span className="text-[10px] font-black uppercase text-emerald-700 block font-mono">
                    {qw.label}
                  </span>
                  <p className="font-bold text-slate-800">{qw.recommendation}</p>
                  <span className="text-[10px] text-slate-500 block">Problema: {qw.problem}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 10 Dimensions Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider">
              Evaluación de las 10 Dimensiones de Conversión
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(croAudit.dimensions || []).map((dim, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border border-brand-border shadow-xs space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="font-black text-brand-text-primary">{dim.label}</span>
                    <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                      dim.score >= 8 ? 'bg-emerald-100 text-emerald-800' : dim.score >= 6 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      Score: {dim.score}/10
                    </span>
                  </div>
                  <p className="text-slate-700"><strong>Fricción:</strong> {dim.problem}</p>
                  <p className="text-emerald-900 font-semibold"><strong>Recomendación:</strong> {dim.recommendation}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>Prioridad: {dim.priority}</span>
                    <span>Impacto: {dim.impact} | Esfuerzo: {dim.effort}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PDF Report Modal */}
      {isPdfModalOpen && croAudit && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-xl border border-brand-border">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-600" />
                <h3 className="text-sm font-black text-brand-text-primary uppercase">
                  Informe Ejecutivo de Auditoría CRO
                </h3>
              </div>
              <button onClick={() => setIsPdfModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-3 font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span>ANIMA MKT CRM · E-Commerce Intelligence</span>
                <span>Fecha: {new Date().toLocaleDateString()}</span>
              </div>
              <div>
                <strong className="block text-slate-900">URL: {croAudit.url}</strong>
                <span>Puntuación CRO: {croAudit.croScore}/100</span>
              </div>
              <p className="text-slate-700 font-sans text-xs">{croAudit.executiveSummary}</p>
              <div>
                <strong className="block text-slate-900 uppercase">Top Quick Wins:</strong>
                <ul className="list-disc pl-4 space-y-1 font-sans text-[11px]">
                  {(croAudit.quickWins || []).map((q, i) => (
                    <li key={i}>{q.recommendation}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-2 border-t border-slate-200 text-right text-[10px] text-slate-400">
                ANIMA MKT CRM · Revenue Intelligence
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setIsPdfModalOpen(false)}>
                Cerrar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  window.print();
                  setIsPdfModalOpen(false);
                }}
                className="bg-violet-600 hover:bg-violet-700 text-white font-bold gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Imprimir / Guardar PDF</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
