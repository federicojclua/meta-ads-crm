import { useState } from 'react';
import { X, RefreshCw, Layers } from 'lucide-react';
import { Button } from '../ui/Button';
import { Alert } from '../ui/Alert';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../lib/api';

export function MetaAssetManagerModal({
  isOpen,
  onClose,
  clients = [],
  adAccounts = [],
  dataSources = [],
  onAssetUpdated,
}) {
  const [activeTab, setActiveTab] = useState('assign'); // 'assign', 'manual', 'discover'
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedAdAccountId, setSelectedAdAccountId] = useState('');
  const [selectedDatasetIds, setSelectedDatasetIds] = useState([]);
  const [isExclusiveAccount, setIsExclusiveAccount] = useState(false);
  const [assignmentReason, setAssignmentReason] = useState('Asignación comercial inicial.');
  
  // Manual form state
  const [manualType, setManualType] = useState('ad_account');
  const [manualId, setManualId] = useState('');
  const [manualName, setManualName] = useState('');
  const [manualCurrency, setManualCurrency] = useState('ARS');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!selectedClientId) {
      setError('Debe seleccionar una empresa cliente.');
      return;
    }
    if (!selectedAdAccountId) {
      setError('Debe seleccionar una cuenta publicitaria.');
      return;
    }
    if (!assignmentReason.trim()) {
      setError('Debe ingresar un motivo para la asignación.');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/api/meta/assign', {
        clientId: selectedClientId,
        adAccountId: selectedAdAccountId,
        allowedDatasetIds: selectedDatasetIds,
        isExclusiveAccount,
        assignmentReason: assignmentReason.trim(),
      });

      setSuccessMessage('Asignación publicitaria registrada exitosamente.');
      if (onAssetUpdated) onAssetUpdated();
    } catch (err) {
      setError(err.message || 'Error al registrar la asignación.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAdd = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!manualId.trim() || !manualName.trim()) {
      setError('El identificador y el nombre son obligatorios.');
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/api/meta/assets/manual', {
        type: manualType,
        id: manualId.trim(),
        name: manualName.trim(),
        currency: manualCurrency,
      });

      setSuccessMessage(`${manualType === 'ad_account' ? 'Cuenta publicitaria' : 'Fuente de datos'} registrada exitosamente.`);
      setManualId('');
      setManualName('');
      if (onAssetUpdated) onAssetUpdated();
    } catch (err) {
      setError(err.message || 'Error al registrar el activo manualmente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDiscover = async () => {
    setError('');
    setSuccessMessage('');
    try {
      setIsLoading(true);
      const res = await apiClient.post('/api/meta/discover', {});
      setSuccessMessage(res.message || 'Descubrimiento completado exitosamente.');
      if (onAssetUpdated) onAssetUpdated();
    } catch (err) {
      setError(err.message || 'Error durante el descubrimiento de activos.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDatasetSelection = (dsId) => {
    if (selectedDatasetIds.includes(dsId)) {
      setSelectedDatasetIds(selectedDatasetIds.filter((id) => id !== dsId));
    } else {
      setSelectedDatasetIds([...selectedDatasetIds, dsId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-text-primary/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-xl shadow-card border border-brand-border w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-5 border-b border-brand-border bg-gray-50/50">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-brand-primary" />
            <div>
              <h2 className="text-base font-bold text-brand-text-primary">
                Administrador de Activos Meta Ads
              </h2>
              <p className="text-xs text-brand-text-secondary">
                Asignación explícita de cuentas publicitarias y datasets a empresas cliente.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-brand-text-secondary hover:text-brand-text-primary hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-brand-border bg-gray-50/30 px-5 pt-3 gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setActiveTab('assign'); setError(''); setSuccessMessage(''); }}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === 'assign'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            Asignar a Empresa
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('manual'); setError(''); setSuccessMessage(''); }}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === 'manual'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            Carga Manual de IDs
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('discover'); setError(''); setSuccessMessage(''); }}
            className={`pb-2.5 border-b-2 transition ${
              activeTab === 'discover'
                ? 'border-brand-primary text-brand-primary'
                : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            Descubrimiento Automático
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <Alert variant="danger">{error}</Alert>}
          {successMessage && <Alert variant="success">{successMessage}</Alert>}

          {/* TAB 1: ASSIGN */}
          {activeTab === 'assign' && (
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                  Empresa Cliente <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full text-xs bg-white border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                  required
                >
                  <option value="">Seleccionar empresa...</option>
                  {clients.map((c) => (
                    <option key={c.id || c._id} value={c.id || c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                  Cuenta Publicitaria <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedAdAccountId}
                  onChange={(e) => setSelectedAdAccountId(e.target.value)}
                  className="w-full text-xs bg-white border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                  required
                >
                  <option value="">Seleccionar cuenta...</option>
                  {adAccounts.map((a) => (
                    <option key={a.adAccountId} value={a.adAccountId}>
                      {a.name} ({a.adAccountId}) - {a.currency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                  Píxeles / Datasets Asociados a esta Empresa
                </label>
                <div className="border border-brand-border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 bg-gray-50/50">
                  {dataSources.length === 0 ? (
                    <p className="text-xs text-brand-text-secondary italic">
                      No hay datasets registrados. Puede cargarlos en la pestaña &apos;Carga Manual&apos;.
                    </p>
                  ) : (
                    dataSources.map((ds) => (
                      <label key={ds.metaDatasetId} className="flex items-center gap-2 text-xs text-brand-text-primary cursor-pointer hover:bg-gray-100 p-1.5 rounded">
                        <input
                          type="checkbox"
                          checked={selectedDatasetIds.includes(ds.metaDatasetId)}
                          onChange={() => toggleDatasetSelection(ds.metaDatasetId)}
                          className="rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                        />
                        <span className="font-semibold">{ds.name}</span>
                        <span className="font-mono text-[11px] text-brand-text-secondary">({ds.metaDatasetId})</span>
                        {ds.assignedClientId && (
                          <Badge variant="warning" className="ml-auto text-[10px]">
                            Asignado
                          </Badge>
                        )}
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="exclusiveAcc"
                  checked={isExclusiveAccount}
                  onChange={(e) => setIsExclusiveAccount(e.target.checked)}
                  className="rounded border-brand-border text-brand-primary focus:ring-brand-primary"
                />
                <label htmlFor="exclusiveAcc" className="text-xs text-brand-text-primary font-medium cursor-pointer">
                  Cuenta Exclusiva (Toda la cuenta pertenece únicamente a este cliente)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                  Motivo de Asignación / Auditoría <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={assignmentReason}
                  onChange={(e) => setAssignmentReason(e.target.value)}
                  placeholder="Ej: Asignación comercial de cuenta y píxel iniciales"
                  className="w-full text-xs bg-white border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? 'Guardando...' : 'Guardar Asignación'}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: MANUAL ADD */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                  Tipo de Activo
                </label>
                <select
                  value={manualType}
                  onChange={(e) => setManualType(e.target.value)}
                  className="w-full text-xs bg-white border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary"
                >
                  <option value="ad_account">Cuenta Publicitaria (Ad Account)</option>
                  <option value="dataset">Dataset / Píxel (Data Source)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                  Identificador de Meta (ID) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualId}
                  onChange={(e) => setManualId(e.target.value)}
                  placeholder={manualType === 'ad_account' ? 'act_1234567890' : '987654321012345'}
                  className="w-full text-xs font-mono bg-white border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                  Nombre Descriptivo <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Ej: Perfumería Marion - Cuenta Principal"
                  className="w-full text-xs bg-white border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary"
                  required
                />
              </div>

              {manualType === 'ad_account' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                    Moneda
                  </label>
                  <select
                    value={manualCurrency}
                    onChange={(e) => setManualCurrency(e.target.value)}
                    className="w-full text-xs bg-white border border-brand-border rounded-lg px-3 py-2 text-brand-text-primary"
                  >
                    <option value="ARS">ARS - Pesos Argentinos</option>
                    <option value="USD">USD - Dólares Estadounidenses</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-border">
                <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
                  Cerrar
                </Button>
                <Button type="submit" variant="primary" disabled={isLoading}>
                  {isLoading ? 'Registrando...' : 'Registrar Activo'}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 3: DISCOVER */}
          {activeTab === 'discover' && (
            <div className="space-y-4 text-center py-4">
              <div className="w-12 h-12 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto">
                <RefreshCw className={`w-6 h-6 ${isLoading ? 'animate-spin' : ''}`} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary">
                  Descubrimiento Automático desde Meta Portfolio
                </h3>
                <p className="text-xs text-brand-text-secondary max-w-md mx-auto mt-1">
                  Consulta los edges oficiales de Graph API v26.0 asignados al System User para registrar automáticamente las cuentas publicitarias y datasets disponibles.
                </p>
              </div>

              <div className="pt-3">
                <Button type="button" variant="primary" onClick={handleDiscover} disabled={isLoading}>
                  {isLoading ? 'Consultando Graph API...' : 'Iniciar Descubrimiento'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
