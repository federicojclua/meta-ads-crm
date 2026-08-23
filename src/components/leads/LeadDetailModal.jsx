import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Send,
  PlusCircle,
  Archive,
  RotateCcw,
  CheckCircle2,
  Tag,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../lib/api';
import {
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_COLORS,
  SALE_STATUS_LABELS,
  SALE_STATUS_COLORS,
  ACTIVITY_TYPE_LABELS,
} from '../../lib/constants';

export function LeadDetailModal({
  isOpen,
  onClose,
  lead,
  onStageChange,
  onAssignChange,
  onArchive,
  onReactivate,
  onOpenSaleModal,
  salespeople = [],
  userRole,
}) {
  const isSalesperson = userRole === 'salesperson';
  const canManageAssignment = !isSalesperson;

  const [activities, setActivities] = useState([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [isPromptingLost, setIsPromptingLost] = useState(false);
  const [lostReasonInput, setLostReasonInput] = useState('');

  const fetchActivities = useCallback(async () => {
    if (!lead?.id) return;
    setIsLoadingActivities(true);
    try {
      const data = await apiClient(`/api/leads/${lead.id}/activities`);
      setActivities(data?.activities || []);
    } catch (err) {
      console.warn('[LEAD_DETAIL] Error al cargar actividades:', err.message);
    } finally {
      setIsLoadingActivities(false);
    }
  }, [lead?.id]);

  useEffect(() => {
    if (isOpen && lead?.id) {
      fetchActivities();
      setNewNote('');
      setActionMessage('');
      setIsPromptingLost(false);
      setLostReasonInput('');
    }
  }, [isOpen, lead?.id, fetchActivities]);

  if (!lead) return null;

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsSubmittingNote(true);
    try {
      await apiClient(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        body: JSON.stringify({ note: newNote.trim() }),
      });
      setNewNote('');
      await fetchActivities();
    } catch (err) {
      console.warn('[LEAD_DETAIL] Error al agregar nota:', err.message);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleQuickStage = async (nextStage) => {
    if (nextStage === lead.stage) return;
    if (nextStage === 'lost') {
      setIsPromptingLost(true);
      return;
    }
    try {
      await onStageChange(lead.id, nextStage);
      await fetchActivities();
      setActionMessage(`Etapa actualizada a ${LEAD_STAGE_LABELS[nextStage]}.`);
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.warn('Error al cambiar etapa:', err);
    }
  };

  const handleConfirmLost = async (e) => {
    e.preventDefault();
    const reason = lostReasonInput.trim();
    if (!reason) return;

    try {
      await onStageChange(lead.id, 'lost', reason);
      setIsPromptingLost(false);
      setLostReasonInput('');
      await fetchActivities();
      setActionMessage('Etapa actualizada a Perdido.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.warn('Error al marcar perdido:', err);
    }
  };

  const handleSalespersonChange = async (e) => {
    const newSpId = e.target.value;
    try {
      await onAssignChange(lead.id, newSpId || null);
      await fetchActivities();
      setActionMessage('Vendedor asignado actualizado.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      console.warn('Error al asignar vendedor:', err);
    }
  };

  const stageColor = LEAD_STAGE_COLORS[lead.stage] || LEAD_STAGE_COLORS.new;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead.name}
      description={`Prospecto registrado el ${lead.acquiredAt ? new Date(lead.acquiredAt).toLocaleDateString('es-AR') : '-'}`}
      className="max-w-4xl"
    >
      <div className="space-y-5">
        {actionMessage && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Stage Bar & Action Toolbar */}
        <div className="p-4 bg-[#F7F6F2] border border-brand-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-brand-text-secondary">Etapa Actual:</span>
            <span className={`px-2.5 py-1 rounded text-xs font-bold ${stageColor.badge}`}>
              {LEAD_STAGE_LABELS[lead.stage]}
            </span>
            {lead.status === 'archived' && (
              <Badge variant="warning" className="text-xs">Archivado</Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-brand-text-secondary mr-1">Cambiar a:</span>
            {LEAD_STAGES.map((stg) => (
              <button
                key={stg}
                type="button"
                disabled={stg === lead.stage}
                onClick={() => handleQuickStage(stg)}
                className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                  stg === lead.stage
                    ? 'bg-brand-primary text-white border-brand-primary font-bold cursor-default'
                    : 'bg-white text-brand-text-primary border-brand-border hover:bg-gray-100 font-medium'
                }`}
              >
                {LEAD_STAGE_LABELS[stg]}
              </button>
            ))}

            <Button
              size="sm"
              variant="primary"
              onClick={() => onOpenSaleModal(lead)}
              className="text-xs gap-1.5 ml-2"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Registrar Venta</span>
            </Button>
          </div>
        </div>

        {/* Lost Reason Prompt Box */}
        {isPromptingLost && (
          <form onSubmit={handleConfirmLost} className="p-4 bg-rose-50 border border-rose-200 rounded-lg space-y-3">
            <div className="text-xs font-bold text-rose-900">
              Indique el motivo obligatorio para marcar este prospecto como Perdido:
            </div>
            <input
              type="text"
              required
              maxLength={500}
              placeholder="Ej: Precio fuera de presupuesto, eligió competencia..."
              value={lostReasonInput}
              onChange={(e) => setLostReasonInput(e.target.value)}
              className="w-full h-9 px-3 text-xs rounded border border-rose-300 bg-white text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="secondary" type="button" onClick={() => setIsPromptingLost(false)}>
                Cancelar
              </Button>
              <Button size="sm" variant="danger" type="submit" disabled={!lostReasonInput.trim()}>
                Confirmar Pérdida
              </Button>
            </div>
          </form>
        )}

        {/* Lead Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-brand-border rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-brand-primary" />
              <span>Datos de Contacto</span>
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2 text-brand-text-secondary">
                <Mail className="w-3.5 h-3.5 text-brand-primary" />
                <span className="font-mono text-brand-text-primary">{lead.email || 'No registrado'}</span>
              </div>
              <div className="flex items-center gap-2 text-brand-text-secondary">
                <Phone className="w-3.5 h-3.5 text-brand-primary" />
                <span className="font-mono text-brand-text-primary">{lead.phone || 'No registrado'}</span>
              </div>
              <div className="flex items-center gap-2 text-brand-text-secondary">
                <Tag className="w-3.5 h-3.5 text-brand-primary" />
                <span>Origen: <strong className="text-brand-text-primary uppercase">{lead.source}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-brand-text-secondary">
                <DollarSign className="w-3.5 h-3.5 text-brand-primary" />
                <span>
                  Valor Estimado:{' '}
                  <strong className="text-brand-text-primary font-mono">
                    ${((lead.valueEstimateMinor || 0) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })} {lead.currency}
                  </strong>
                </span>
              </div>
              {lead.lostReason && (
                <div className="p-2 bg-rose-50 border border-rose-100 rounded text-rose-800 text-[11px]">
                  <strong>Motivo de pérdida:</strong> {lead.lostReason}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-white border border-brand-border rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-primary" />
              <span>Asignación & Estado</span>
            </h4>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-brand-text-secondary font-semibold mb-1">
                  Vendedor Asignado:
                </label>
                {canManageAssignment ? (
                  <select
                    value={lead.assignedToUserId || ''}
                    onChange={handleSalespersonChange}
                    className="w-full h-8 px-2 rounded border border-brand-border bg-white text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  >
                    <option value="">-- Sin asignar --</option>
                    {salespeople.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.displayName || sp.email}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-1.5 bg-gray-50 rounded border border-brand-border font-medium">
                    {lead.assignedToUser?.displayName || 'Sin asignar'}
                  </div>
                )}
              </div>

              {!isSalesperson && (
                <div className="pt-2 border-t border-brand-border/60 flex items-center gap-2">
                  {lead.status === 'active' ? (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onArchive(lead.id)}
                      className="text-xs gap-1 py-1"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Archivar Prospecto</span>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => onReactivate(lead.id)}
                      className="text-xs gap-1 py-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reactivar Prospecto</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Associated Sales Section */}
        {lead.sales && lead.sales.length > 0 && (
          <div className="p-4 bg-white border border-brand-border rounded-lg space-y-3">
            <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Ventas Registradas ({lead.sales.length})</span>
            </h4>
            <div className="space-y-2">
              {lead.sales.map((sale) => (
                <div
                  key={sale.id}
                  className="p-3 rounded border border-brand-border bg-gray-50 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-brand-text-primary font-mono">
                      ${sale.amountFormatted} {sale.currency}
                    </div>
                    <div className="text-[11px] text-brand-text-secondary">
                      Cobrado: <strong className="font-mono text-emerald-700">${sale.collectedAmountFormatted}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${SALE_STATUS_COLORS[sale.status]}`}>
                      {SALE_STATUS_LABELS[sale.status]}
                    </span>

                    {!isSalesperson && sale.status !== 'collected' && sale.status !== 'cancelled' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onOpenSaleModal(lead, sale)}
                        className="text-xs py-1 px-2"
                      >
                        Registrar Cobro
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commercial Notes and Activity Timeline */}
        <div className="p-4 bg-white border border-brand-border rounded-lg space-y-4">
          <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
            Historial de Actividades & Notas Comerciales
          </h4>

          {/* Note Input */}
          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              placeholder="Escribí una nota comercial sobre este prospecto (máx 2000 caracteres)..."
              value={newNote}
              maxLength={2000}
              onChange={(e) => setNewNote(e.target.value)}
              className="flex-1 h-9 px-3 text-xs rounded border border-brand-border bg-white text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            />
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={!newNote.trim()}
              isLoading={isSubmittingNote}
              className="text-xs gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Guardar</span>
            </Button>
          </form>

          {/* Timeline */}
          {isLoadingActivities ? (
            <div className="text-center py-6 text-xs text-brand-text-secondary">
              Cargando historial...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-6 text-xs text-brand-text-secondary italic">
              Sin actividades registradas todavía.
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-2.5 rounded bg-gray-50 border border-brand-border/60 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-brand-text-primary">
                      {ACTIVITY_TYPE_LABELS[act.type] || act.type}
                    </span>
                    <span className="text-gray-500 font-mono">
                      {act.createdAt ? new Date(act.createdAt).toLocaleString('es-AR') : '-'}
                    </span>
                  </div>
                  <p className="text-brand-text-secondary text-xs">{act.description}</p>
                  <div className="text-[10px] text-gray-500">
                    Por: <span className="font-medium text-brand-text-primary">{act.performedByName || 'Sistema'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-3 border-t border-brand-border">
          <Button variant="secondary" onClick={onClose}>
            Cerrar Ficha
          </Button>
        </div>
      </div>
    </Modal>
  );
}
