import { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export function ClientModal({ isOpen, onClose, onSave, client = null, isLoading = false }) {
  const isEditing = Boolean(client);
  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    defaultCurrency: 'ARS',
    country: 'AR',
    timezone: 'America/Argentina/Tucuman',
    metaBusinessId: '',
    metaAdAccountIdsText: '',
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        legalName: client.legalName || '',
        defaultCurrency: client.defaultCurrency || 'ARS',
        country: client.country || 'AR',
        timezone: client.timezone || 'America/Argentina/Tucuman',
        metaBusinessId: client.metaBusinessId || '',
        metaAdAccountIdsText: Array.isArray(client.metaAdAccountIds)
          ? client.metaAdAccountIds.join(', ')
          : '',
      });
    } else {
      setFormData({
        name: '',
        legalName: '',
        defaultCurrency: 'ARS',
        country: 'AR',
        timezone: 'America/Argentina/Tucuman',
        metaBusinessId: '',
        metaAdAccountIdsText: '',
      });
    }
    setError(null);
  }, [client, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('El nombre comercial es obligatorio.');
      return;
    }

    const adAccountIds = formData.metaAdAccountIdsText
      .split(/[\n,]+/)
      .map((id) => id.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      legalName: formData.legalName.trim() || null,
      defaultCurrency: formData.defaultCurrency,
      country: formData.country.trim() || 'AR',
      timezone: formData.timezone.trim() || 'America/Argentina/Tucuman',
      metaBusinessId: formData.metaBusinessId.trim() || null,
      metaAdAccountIds: adAccountIds,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar la empresa.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Empresa / Cliente' : 'Nueva Empresa / Cliente'}
      description={
        isEditing
          ? 'Actualice los datos comerciales y de configuración de la cuenta.'
          : 'Registre una nueva empresa para habilitar el aislamiento multi-tenant y la vinculación publicitaria.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}

        <Input
          label="Nombre Comercial *"
          placeholder="Ej: Distribuidora Norte"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Input
          label="Razón Social (Opcional)"
          placeholder="Ej: Distribuidora Norte S.R.L."
          value={formData.legalName}
          onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1">
              Moneda Predeterminada
            </label>
            <select
              value={formData.defaultCurrency}
              onChange={(e) => setFormData({ ...formData, defaultCurrency: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-brand-border bg-brand-surface text-sm text-brand-text-primary focus:outline-hidden focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent"
            >
              <option value="ARS">ARS — Pesos Argentinos</option>
              <option value="USD">USD — Dólares Estadounidenses</option>
            </select>
          </div>

          <Input
            label="País"
            placeholder="AR"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
          />
        </div>

        <Input
          label="Zona Horaria"
          placeholder="America/Argentina/Tucuman"
          value={formData.timezone}
          onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
        />

        <div className="pt-2 border-t border-brand-border space-y-3">
          <p className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
            Identificadores de Meta Ads (Sin Secretos)
          </p>

          <Input
            label="Meta Business Manager ID (Opcional)"
            placeholder="Ej: 123456789012345"
            value={formData.metaBusinessId}
            onChange={(e) => setFormData({ ...formData, metaBusinessId: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1">
              Cuentas Publicitarias Meta (IDs separados por coma)
            </label>
            <textarea
              rows={2}
              placeholder="act_1020304050, act_9988776655"
              value={formData.metaAdAccountIdsText}
              onChange={(e) => setFormData({ ...formData, metaAdAccountIdsText: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-brand-border bg-brand-surface text-sm text-brand-text-primary focus:outline-hidden focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent resize-none font-mono text-xs"
            />
            <p className="text-[11px] text-brand-text-secondary mt-0.5">
              Ingrese solo los identificadores `act_XXX`. Nunca ingrese tokens ni contraseñas.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-brand-border">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {isEditing ? 'Guardar Cambios' : 'Crear Empresa'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
