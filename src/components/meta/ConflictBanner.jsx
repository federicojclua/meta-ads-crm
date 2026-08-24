import { AlertTriangle, ChevronRight } from 'lucide-react';

export function ConflictBanner({ conflicts = [], onResolveClick }) {
  if (!conflicts || conflicts.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 shadow-subtle">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">
              Atención: Se detectaron {conflicts.length} conflicto(s) de asignación publicitaria
            </h3>
            <p className="text-xs text-amber-700 mt-1">
              Existen campañas con conjuntos de anuncios asignados a diferentes empresas (Campañas Mixtas) o fuentes de datos compartidas. Para evitar fuga de información, la visualización total ha sido restringida a los clientes afectados.
            </p>
            <ul className="mt-2 space-y-1 text-xs text-amber-800 font-mono">
              {conflicts.slice(0, 3).map((c, idx) => (
                <li key={c.id || idx} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <strong>[{c.conflictCode}]</strong> {c.entityType} ID: {c.entityId} — {c.details}
                </li>
              ))}
              {conflicts.length > 3 && (
                <li className="text-[11px] text-amber-600 italic">
                  + {conflicts.length - 3} conflicto(s) adicional(es)...
                </li>
              )}
            </ul>
          </div>
        </div>
        {onResolveClick && (
          <button
            type="button"
            onClick={onResolveClick}
            className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-200/70 hover:bg-amber-200 px-3 py-1.5 rounded border border-amber-400 transition"
          >
            Administrar Activos
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
