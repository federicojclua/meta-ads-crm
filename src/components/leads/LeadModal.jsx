import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Alert } from '../ui/Alert';
import { LEAD_STAGES, LEAD_STAGE_LABELS } from '../../lib/constants';

export function LeadModal({
  isOpen,
  onClose,
  onSave,
  lead = null,
  salespeople = [],
  clients = [],
  isGlobal = false,
  userRole = 'client',
  isLoading = false,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [stage, setStage] = useState('new');
  const [assignedToUserId, setAssignedToUserId] = useState('');
  const [clientId, setClientId] = useState('');
  const [valueEstimate, setValueEstimate] = useState('');
  const [currency, setCurrency] = useState('ARS');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (lead) {
      setName(lead.name || '');
      setEmail(lead.email || '');
      setPhone(lead.phone || '');
      setStage(lead.stage || 'new');
      setAssignedToUserId(lead.assignedToUserId || '');
      setClientId(lead.clientId || '');
      setValueEstimate(lead.valueEstimateMinor ? (lead.valueEstimateMinor / 100).toString() : '');
      setCurrency(lead.currency || 'ARS');
      setNotes(lead.notes || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setStage('new');
      setAssignedToUserId('');
      setClientId('');
      setValueEstimate('');
      setCurrency('ARS');
      setNotes('');
    }
    setErrorMessage('');
  }, [lead, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (isGlobal && !lead && !clientId) {
      setErrorMessage('Debe seleccionar la empresa a la que pertenece el prospecto.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('El nombre del prospecto es obligatorio.');
      return;
    }

    if (!email.trim() && !phone.trim()) {
      setErrorMessage('Debe ingresar al menos un correo electrónico o teléfono de contacto.');
      return;
    }

    let valueEstimateMinor = 0;
    if (valueEstimate) {
      const parsed = parseFloat(valueEstimate.replace(',', '.'));
      if (isNaN(parsed) || parsed < 0) {
        setErrorMessage('El valor estimado debe ser un número positivo.');
        return;
      }
      valueEstimateMinor = Math.round(parsed * 100);
    }

    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      stage,
      notes: notes.trim() || null,
      valueEstimateMinor,
      currency,
      ...(isGlobal && !lead ? { clientId } : {}),
      ...(userRole !== 'salesperson' ? { assignedToUserId: assignedToUserId || null } : {}),
    };

    try {
      await onSave(payload, lead?.id);
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Error al guardar el prospecto.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead ? 'Editar Prospecto' : 'Nuevo Prospecto Comercial'}
      description="Completá la información del contacto y asignación en el pipeline."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="error">
            {errorMessage}
          </Alert>
        )}

        {isGlobal && !lead && (
          <div>
            <label htmlFor="lead-modal-client-select" className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
              Empresa / Cliente *
            </label>
            <select
              id="lead-modal-client-select"
              aria-label="Empresa / Cliente"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-brand-border bg-white text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              required
            >
              <option value="">Seleccionar empresa</option>
              {clients.map((c) => {
                const cId = c.id || c._id;
                return (
                  <option key={cId} value={cId}>
                    {c.name}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <Input
          label="Nombre Completo *"
          placeholder="Ej: Juan Pérez / Distribuidora SRL"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Correo Electrónico"
            type="email"
            placeholder="contacto@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Teléfono / WhatsApp"
            placeholder="+54 9 11 1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
              Etapa Comercial *
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-brand-border bg-white text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              {LEAD_STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {LEAD_STAGE_LABELS[stg]}
                </option>
              ))}
            </select>
          </div>

          {userRole !== 'salesperson' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                Vendedor Asignado
              </label>
              <select
                value={assignedToUserId}
                onChange={(e) => setAssignedToUserId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-brand-border bg-white text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
              >
                <option value="">-- Sin asignar --</option>
                {salespeople.map((sp) => {
                  const spId = sp.id || sp._id;
                  return (
                    <option key={spId} value={spId}>
                      {sp.displayName || sp.email}{sp.status === 'invited' ? ' (Pendiente de activación)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Valor Estimado"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={valueEstimate}
            onChange={(e) => setValueEstimate(e.target.value)}
          />

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
              Moneda
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-brand-border bg-white text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            >
              <option value="ARS">ARS (Pesos Argentinos)</option>
              <option value="USD">USD (Dólares)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
            Notas Iniciales / Requerimientos
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Detalles sobre la oportunidad o necesidad del cliente..."
            className="w-full p-3 rounded-md border border-brand-border bg-white text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-brand-border">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {lead ? 'Actualizar Prospecto' : 'Crear Prospecto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
