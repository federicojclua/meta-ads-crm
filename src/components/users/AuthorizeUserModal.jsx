import { useState, useEffect } from 'react';
import { Copy, Check, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';

export function AuthorizeUserModal({
  isOpen,
  onClose,
  onAuthorize,
  clients = [],
  currentUserRole = 'admin',
  isLoading = false,
}) {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: 'client',
    clientId: '',
  });
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        displayName: '',
        email: '',
        role: 'client',
        clientId: clients.length > 0 ? clients[0]._id : '',
      });
      setError(null);
      setSuccessData(null);
      setCopied(false);
    }
  }, [isOpen, clients]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Ingrese una dirección de correo electrónico válida.');
      return;
    }

    if (['client', 'salesperson'].includes(formData.role) && !formData.clientId) {
      setError('Debe seleccionar una empresa para roles de cliente o vendedor.');
      return;
    }

    const payload = {
      displayName: formData.displayName.trim() || formData.email.split('@')[0],
      email: formData.email.trim(),
      role: formData.role,
      clientId: ['client', 'salesperson'].includes(formData.role) ? formData.clientId : null,
    };

    try {
      const res = await onAuthorize(payload);
      setSuccessData(res);
    } catch (err) {
      setError(err.message || 'Error al autorizar el usuario.');
    }
  };

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}/login`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={successData ? 'Usuario Preautorizado Exitosamente' : 'Preautorizar Nuevo Usuario'}
      description={
        successData
          ? 'El usuario ha sido registrado en la base de datos y podrá ingresar directamente con Google.'
          : 'Registre el correo y rol. El perfil se vinculará de forma atómica en su primer ingreso con Google.'
      }
    >
      {successData ? (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-brand-accent/5 border border-brand-accent/20 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-brand-accent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-brand-text-primary">
                {successData.user?.displayName || successData.user?.email}
              </p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Correo autorizado: <span className="font-mono text-brand-text-primary">{successData.user?.email}</span>
              </p>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Rol: <span className="font-semibold text-brand-text-primary uppercase">{successData.user?.role}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-brand-text-primary">
              Enlace de Acceso para el Usuario
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/login`}
                className="w-full h-10 px-3 rounded-lg border border-brand-border bg-brand-bg text-xs font-mono text-brand-text-primary focus:outline-hidden"
              />
              <Button type="button" variant="secondary" onClick={handleCopyLink} className="shrink-0 gap-1.5 text-xs">
                {copied ? <Check className="w-4 h-4 text-brand-accent" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
            </div>
            <p className="text-[11px] text-brand-text-secondary">
              Comparta este enlace con el usuario. Al iniciar sesión con su cuenta de Google ({successData.user?.email}), el acceso se activará automáticamente.
            </p>
          </div>

          <div className="pt-3 border-t border-brand-border flex justify-end">
            <Button type="button" variant="primary" onClick={onClose}>
              Finalizar
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}

          <Input
            label="Nombre y Apellido (Opcional)"
            placeholder="Ej: Laura Gómez"
            value={formData.displayName}
            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
          />

          <Input
            label="Correo Electrónico (Cuenta Google) *"
            type="email"
            placeholder="usuario@empresa.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-brand-text-primary mb-1">
              Rol del Usuario *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-brand-border bg-brand-surface text-sm text-brand-text-primary focus:outline-hidden focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent"
            >
              <option value="client">CLIENTE (Acceso exclusivo a su empresa)</option>
              <option value="salesperson">VENDEDOR (Operativo de empresa)</option>
              <option value="admin">ADMINISTRADOR (Gestión general)</option>
              {currentUserRole === 'super_admin' && (
                <option value="super_admin">SUPER ADMINISTRADOR (Acceso total)</option>
              )}
            </select>
          </div>

          {['client', 'salesperson'].includes(formData.role) && (
            <div>
              <label className="block text-xs font-semibold text-brand-text-primary mb-1">
                Empresa Asignada *
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                required
                className="w-full h-10 px-3 rounded-lg border border-brand-border bg-brand-surface text-sm text-brand-text-primary focus:outline-hidden focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent"
              >
                <option value="">Seleccione una empresa...</option>
                {clients
                  .filter((c) => c.status === 'active')
                  .map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-brand-border">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" isLoading={isLoading}>
              Preautorizar Usuario
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
