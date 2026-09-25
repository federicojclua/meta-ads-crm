import React from 'react';
import { Zap, Send, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';

/**
 * Reglas de Automatización de Retención y Cola de Eventos de WhatsApp.
 */
export function AutomationRules({
  retentionRules = [],
  retentionEvents = [],
  onDispatchRetention,
  isDispatching = false,
}) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 gap-3">
          <div>
            <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Reglas de Retención Configurables & Seguridad de WhatsApp</span>
            </h3>
            <p className="text-xs text-brand-text-secondary mt-0.5">
              Protección anti-spam: Intervalo mínimo de 7 días y verificación de consentimiento.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={onDispatchRetention}
            disabled={isDispatching}
            className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs h-8 gap-1.5 shadow-sm"
          >
            <Send className={`w-3.5 h-3.5 ${isDispatching ? 'animate-spin' : ''}`} />
            <span>{isDispatching ? 'Despachando...' : '🚀 Despachar Automatizaciones'}</span>
          </Button>
        </div>

        {retentionRules.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">
            No hay reglas de retención activas configuradas.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {retentionRules.map((rule) => (
              <div key={rule.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-brand-text-primary">{rule.name}</strong>
                  <Badge variant="warning" className="text-[9px]">
                    +{rule.delayDays} Días
                  </Badge>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Plantilla: <code className="text-violet-700 font-mono">{rule.whatsappTemplateId}</code>
                </p>
                <p className="text-slate-700 italic text-[11px]">"{rule.messageBody}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Retention Events Queue */}
      <div className="bg-white p-5 rounded-2xl border border-brand-border shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-brand-text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Cola de Eventos Programados ({retentionEvents.length})</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">Próximos despachos automáticos</span>
        </div>

        {retentionEvents.length === 0 ? (
          <div className="p-4 text-center text-slate-400 text-xs">
            No hay eventos programados en cola.
          </div>
        ) : (
          <div className="space-y-2">
            {retentionEvents.map((evt) => (
              <div
                key={evt.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-brand-text-primary">{evt.customerName}</strong>
                    <span className="text-[10px] text-slate-400 font-mono">({evt.customerPhone})</span>
                    <Badge
                      variant={
                        evt.status === 'SENT'
                          ? 'success'
                          : evt.status === 'BLOCKED'
                          ? 'danger'
                          : 'neutral'
                      }
                      className="text-[9px]"
                    >
                      {evt.status}
                    </Badge>
                  </div>
                  <span className="text-[11px] text-slate-500 mt-0.5 block">
                    {evt.ruleName} · {evt.productName}
                  </span>
                </div>

                <span className="text-[10px] font-mono text-slate-400">
                  {new Date(evt.scheduledFor).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
