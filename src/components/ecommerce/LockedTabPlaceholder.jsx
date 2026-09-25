import React from 'react';
import { Lock, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '../ui/Badge';

/**
 * Placeholder para funcionalidades en desarrollo marcadas como "Próximamente" con ícono de candado.
 */
export function LockedTabPlaceholder({ title, description, plannedFeatures = [], version = 'v2.4' }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-brand-border shadow-xs text-center max-w-2xl mx-auto space-y-6">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-500 shadow-inner">
        <Lock className="w-6 h-6 text-slate-600" />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-center gap-2">
          <h3 className="text-base font-black text-brand-text-primary uppercase tracking-tight">
            {title}
          </h3>
          <Badge variant="neutral" className="text-[10px] gap-1 font-mono">
            <Clock className="w-3 h-3" />
            <span>Próximamente · {version}</span>
          </Badge>
        </div>
        <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {plannedFeatures.length > 0 && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 font-mono block">
            Funcionalidades en desarrollo:
          </span>
          <ul className="space-y-1.5 text-xs text-slate-700">
            {plannedFeatures.map((feat, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="pt-2 text-[11px] text-slate-400 font-mono">
        Módulo programado para el siguiente release de sincronización profunda con Meta Marketing API.
      </div>
    </div>
  );
}
