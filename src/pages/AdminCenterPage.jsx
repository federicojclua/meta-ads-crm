import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Edit2,
  Power,
  Copy,
  Check,
  Globe,
  Tag,
  ShieldCheck,
  TrendingUp,
  Activity,
  History,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { apiClient } from '../lib/api';
import { formatRole } from '../lib/utils';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { ClientModal } from '../components/clients/ClientModal';
import { AuthorizeUserModal } from '../components/users/AuthorizeUserModal';
import { Modal } from '../components/ui/Modal';

export function AdminCenterPage() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const isSuperAdmin = userProfile?.role === 'super_admin';
  const isGlobalAdmin = ['super_admin', 'admin'].includes(userProfile?.role);

  // Administration Tabs
  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'users' | 'meta_assets' | 'meta_sync' | 'exchange_rates' | 'audit_logs'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Forms
  const [selectedClientForEdit, setSelectedClientForEdit] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [copiedInviteUrl, setCopiedInviteUrl] = useState(null);
  const [generatedInviteUrl, setGeneratedInviteUrl] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Change status confirmation modal
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: null,
    target: null,
  });

  const [actionError, setActionError] = useState(null);

  // Sync log pagination
  const [syncLogPage, setSyncLogPage] = useState(1);

  // 1. Fetch Clients
  const { data: clientsData, isLoading: isLoadingClients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => apiClient('/api/clients'),
  });

  // 2. Fetch Users
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient('/api/users'),
    enabled: isGlobalAdmin,
  });

  // 3. Fetch Exchange Rates
  const { data: exchangeRatesData, isLoading: isLoadingRates } = useQuery({
    queryKey: ['exchangeRates'],
    queryFn: () => apiClient('/api/exchange-rates'),
    enabled: isGlobalAdmin,
  });

  // 4. Fetch Meta Status
  const { data: metaStatus, isLoading: isLoadingMetaStatus } = useQuery({
    queryKey: ['metaStatus'],
    queryFn: () => apiClient('/api/meta/status'),
    enabled: isGlobalAdmin,
  });

  // 5. Fetch Meta Assets & Scopes
  const { data: metaAssetsData } = useQuery({
    queryKey: ['metaAssets'],
    queryFn: () => apiClient('/api/meta/assets'),
    enabled: isGlobalAdmin,
  });

  // 6. Fetch Meta Sync Logs
  const { data: syncLogsData, isLoading: isLoadingSyncLogs } = useQuery({
    queryKey: ['syncLogs', syncLogPage],
    queryFn: () => apiClient(`/api/meta/sync?page=${syncLogPage}&limit=5`),
    enabled: isGlobalAdmin,
  });

  // 7. Fetch Audit Logs
  const { data: auditLogsData, isLoading: isLoadingAuditLogs } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => apiClient('/api/audit-logs'), // Super Admin utility
    enabled: isSuperAdmin && activeTab === 'audit_logs',
  });

  const clients = clientsData?.clients || [];
  const users = usersData?.users || [];
  const rates = exchangeRatesData?.exchangeRates || [];
  const syncLogs = syncLogsData?.logs || [];
  const clientMetaScopes = metaAssetsData?.scopes || [];

  // Clients Mutators
  const createClientMutation = useMutation({
    mutationFn: (newClient) => apiClient('/api/clients', { method: 'POST', body: JSON.stringify(newClient) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsClientModalOpen(false);
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient(`/api/clients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsClientModalOpen(false);
      setSelectedClientForEdit(null);
    },
  });

  const toggleClientStatusMutation = useMutation({
    mutationFn: ({ id, action }) => apiClient(`/api/clients/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setConfirmationModal({ isOpen: false, type: null, target: null });
    },
    onError: (err) => setActionError(err.message),
  });

  // Users Mutators
  const authorizeUserMutation = useMutation({
    mutationFn: (userData) => apiClient('/api/users/authorize', { method: 'POST', body: JSON.stringify(userData) }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Retrieve the generated one-time invite token link
      if (data.inviteLink || data.loginUrl) {
        const fullInviteUrl = `${window.location.origin}${data.inviteLink || data.loginUrl}`;
        setGeneratedInviteUrl(fullInviteUrl);
        setShowInviteModal(true);
      }
      setIsUserModalOpen(false);
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, action }) => apiClient(`/api/users/${id}/${action}`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setConfirmationModal({ isOpen: false, type: null, target: null });
    },
    onError: (err) => setActionError(err.message),
  });

  // Exchange Rates Mutators
  const createExchangeRateMutation = useMutation({
    mutationFn: (newRate) => apiClient('/api/exchange-rates', { method: 'POST', body: JSON.stringify(newRate) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] });
    },
    onError: (err) => setActionError(err.message),
  });

  const deleteExchangeRateMutation = useMutation({
    mutationFn: (id) => apiClient(`/api/exchange-rates/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRates'] });
    },
    onError: (err) => setActionError(err.message),
  });

  // Sync Trigger Mutator
  const triggerManualSyncMutation = useMutation({
    mutationFn: (payload) => apiClient('/api/meta/sync', { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['syncLogs'] });
      setActionError(null);
    },
    onError: (err) => setActionError(err.message),
  });

  // Assets Scoping Mutator

  const registerManualAssetMutation = useMutation({
    mutationFn: (asset) => apiClient('/api/meta/assets/manual', { method: 'POST', body: JSON.stringify(asset) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['metaAssets'] });
    },
    onError: (err) => setActionError(err.message),
  });

  // Filter computations
  const filteredClients = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.slug?.toLowerCase().includes(q);
  });

  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.role?.toLowerCase().includes(q);
  });

  const handleCopyInviteUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedInviteUrl(true);
    setTimeout(() => setCopiedInviteUrl(false), 2000);
  };

  const handleExecuteConfirmation = async () => {
    setActionError(null);
    const { type, target } = confirmationModal;
    if (!target) return;

    if (type === 'deactivate_client') {
      await toggleClientStatusMutation.mutateAsync({ id: target._id, action: 'deactivate' });
    } else if (type === 'reactivate_client') {
      await toggleClientStatusMutation.mutateAsync({ id: target._id, action: 'reactivate' });
    } else if (type === 'suspend_user') {
      await toggleUserStatusMutation.mutateAsync({ id: target._id, action: 'suspend' });
    } else if (type === 'reactivate_user') {
      await toggleUserStatusMutation.mutateAsync({ id: target._id, action: 'reactivate' });
    }
  };

  return (
    <div className="space-y-6 bg-[#F7F6F2] min-h-screen p-1 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-text-primary tracking-tight uppercase flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-brand-primary" />
            <span>Centro de Control Administrativo</span>
          </h1>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Gestión global de empresas, usuarios, divisas, y sincronización operativa multi-tenant.
          </p>
        </div>

        {isGlobalAdmin && activeTab === 'clients' && (
          <Button
            variant="primary"
            onClick={() => {
              setSelectedClientForEdit(null);
              setIsClientModalOpen(true);
            }}
            className="gap-1.5 text-xs shadow-subtle font-bold"
          >
            <Plus className="w-4 h-4" />
            Nueva Empresa
          </Button>
        )}

        {isGlobalAdmin && activeTab === 'users' && (
          <Button
            variant="primary"
            onClick={() => setIsUserModalOpen(true)}
            className="gap-1.5 text-xs shadow-subtle font-bold"
          >
            <Plus className="w-4 h-4" />
            Autorizar Usuario
          </Button>
        )}
      </div>

      {actionError && (
        <Alert variant="error" className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-700" />
          <span>{actionError}</span>
        </Alert>
      )}

      {/* Tabs navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-brand-border/60 pb-1">
        {[
          { id: 'clients', label: 'Empresas', icon: Building2 },
          { id: 'users', label: 'Usuarios & Invitaciones', icon: Users },
          { id: 'meta_assets', label: 'Activos Meta & Scopes', icon: Tag, globalOnly: true },
          { id: 'meta_sync', label: 'Salud & Sync Meta', icon: Activity, globalOnly: true },
          { id: 'exchange_rates', label: 'Tasas de Cambio', icon: TrendingUp, globalOnly: true },
          { id: 'audit_logs', label: 'Logs de Auditoría', icon: History, superAdminOnly: true },
        ].map((tab) => {
          if (tab.globalOnly && !isGlobalAdmin) return null;
          if (tab.superAdminOnly && !isSuperAdmin) return null;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchQuery('');
                setActionError(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-md transition-colors border-b-2 ${
                isActive
                  ? 'border-brand-primary text-brand-primary bg-white'
                  : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Filter Bar (for tabular views) */}
      {['clients', 'users'].includes(activeTab) && (
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-brand-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'clients' ? 'Buscar empresa o slug...' : 'Buscar usuario o correo...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded border border-brand-border bg-white text-xs text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          />
        </div>
      )}

      {/* TAB 1: CLIENTS */}
      {activeTab === 'clients' && (
        <div className="space-y-4">
          {isLoadingClients ? (
            <div className="bg-white p-12 text-center text-xs text-brand-text-secondary">Cargando empresas...</div>
          ) : filteredClients.length === 0 ? (
            <EmptyState icon={Building2} title="Sin Resultados" description="No se encontraron empresas registradas." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => {
                const isActive = client.status === 'active';
                return (
                  <div key={client._id} className={`bg-white rounded-lg border p-5 flex flex-col justify-between shadow-subtle ${isActive ? 'border-brand-border' : 'border-brand-border/40 opacity-70 bg-gray-55/30'}`}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-bold text-brand-text-primary">{client.name}</h2>
                          {client.legalName && <p className="text-xs text-brand-text-secondary">{client.legalName}</p>}
                        </div>
                        <Badge variant={isActive ? 'success' : 'neutral'} className="text-[10px] py-0.5 px-2">
                          {isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      <div className="space-y-1 text-xs text-brand-text-secondary pt-1">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 shrink-0" />
                          <span className="font-mono text-[10px] bg-[#F7F6F2] px-1.5 py-0.5 rounded border border-brand-border/60">
                            {client.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <span>{client.country || 'AR'} • {client.defaultCurrency || 'ARS'}</span>
                        </div>
                      </div>
                    </div>

                    {isGlobalAdmin && (
                      <div className="flex items-center justify-end gap-1.5 pt-4 mt-3 border-t border-brand-border/60">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setSelectedClientForEdit(client);
                            setIsClientModalOpen(true);
                          }}
                          className="h-8 px-2.5 text-xs gap-1"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Editar
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setConfirmationModal({ isOpen: true, type: isActive ? 'deactivate_client' : 'reactivate_client', target: client })}
                          className={`h-8 px-2.5 text-xs gap-1 ${isActive ? 'text-rose-700 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'}`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          {isActive ? 'Desactivar' : 'Reactivar'}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: USERS */}
      {activeTab === 'users' && isGlobalAdmin && (
        <div className="bg-white border border-brand-border rounded-lg overflow-hidden shadow-subtle">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F6F2]/80 border-b border-brand-border text-brand-text-secondary font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Usuario</th>
                  <th className="py-3 px-4">Rol</th>
                  <th className="py-3 px-4">Empresa Asignada</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Google UID</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/60">
                {filteredUsers.map((user) => {
                  const clientName = clients.find((c) => c._id === user.clientId)?.name || (user.clientId ? `ID: ${user.clientId}` : 'Acceso Global');
                  const isSelf = user.firebaseUid === userProfile?.firebaseUid;
                  const isTargetSuperAdmin = user.role === 'super_admin';
                  const canManageUser = !isSelf && (userProfile?.role === 'super_admin' || !isTargetSuperAdmin);

                  let statusBadge = <Badge variant="success">Activo</Badge>;
                  if (user.status === 'suspended') {
                    statusBadge = <Badge variant="error">Suspendido</Badge>;
                  } else if (user.status === 'invited') {
                    statusBadge = <Badge variant="warning">Pendiente Invitación</Badge>;
                  }

                  return (
                    <tr key={user._id} className="hover:bg-[#F7F6F2]/30">
                      <td className="py-3 px-4">
                        <p className="font-bold text-brand-text-primary">{user.displayName || user.email}</p>
                        <p className="text-[10px] text-brand-text-secondary font-mono">{user.email}</p>
                      </td>
                      <td className="py-3 px-4 font-semibold text-brand-text-primary">{formatRole(user.role)}</td>
                      <td className="py-3 px-4 text-brand-text-secondary">{clientName}</td>
                      <td className="py-3 px-4">{statusBadge}</td>
                      <td className="py-3 px-4">
                        {user.firebaseUid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Vinculado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-bold">
                            <Clock className="w-3.5 h-3.5" /> Pendiente
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManageUser && (
                            <Button
                              variant="secondary"
                              onClick={() => setConfirmationModal({ isOpen: true, type: user.status === 'suspended' ? 'reactivate_user' : 'suspend_user', target: user })}
                              className={`h-7 px-2 text-[11px] gap-1 ${user.status === 'suspended' ? 'text-emerald-700 hover:bg-emerald-50' : 'text-rose-700 hover:bg-rose-50'}`}
                            >
                              <Power className="w-3 h-3" />
                              {user.status === 'suspended' ? 'Reactivar' : 'Suspender'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: META ASSETS */}
      {activeTab === 'meta_assets' && isGlobalAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Scopes list */}
          <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-4 h-4 text-brand-primary" />
              <span>Asignaciones de Activos (Scopes)</span>
            </h3>

            {/* List clientMetaScopes */}
            <div className="space-y-3">
              {clientMetaScopes.map(scope => {
                const clientName = clients.find(c => c._id === scope.clientId)?.name || 'Empresa Desconocida';
                return (
                  <div key={scope.id} className="p-4 border border-brand-border rounded-md bg-[#F7F6F2]/30 flex flex-col md:flex-row justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-brand-text-primary">{clientName}</strong>
                        <Badge variant="primary" className="text-[9px] uppercase">{scope.isExclusiveAccount ? 'Exclusivo' : 'Compartido'}</Badge>
                      </div>
                      <p className="text-[11px] text-brand-text-secondary mt-1">Cuenta: <span className="font-mono">{scope.adAccountId}</span></p>
                      <p className="text-[11px] text-brand-text-secondary">Datasets asignados: <span className="font-mono">{scope.allowedDatasetIds?.join(', ') || 'Ninguno'}</span></p>
                      <p className="text-[10px] text-gray-500 italic mt-1.5">Motivo: &quot;{scope.assignmentReason}&quot;</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Form manual registration / assignment */}
          <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle space-y-4">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-primary" />
              <span>Cargar Activo Manualmente</span>
            </h3>

            {/* Manual asset loading form */}
            <form onSubmit={async (e) => {
              e.preventDefault();
              setActionError(null);
              const data = new FormData(e.currentTarget);
              try {
                await registerManualAssetMutation.mutateAsync({
                  type: data.get('type'),
                  id: data.get('id'),
                  name: data.get('name'),
                  currency: data.get('currency'),
                  isExclusive: data.get('isExclusive') === 'true',
                });
                e.target.reset();
              } catch (err) {
                setActionError(err.message);
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-brand-text-primary">Tipo de Activo</label>
                <select name="type" className="w-full h-8 px-2 rounded border border-brand-border focus:outline-none">
                  <option value="ad_account">Cuenta Publicitaria (Ad Account)</option>
                  <option value="dataset">Dataset / Pixel</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-brand-text-primary">Meta ID</label>
                <input type="text" name="id" required className="w-full h-8 px-2 rounded border border-brand-border focus:outline-none" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-brand-text-primary">Nombre Descriptivo</label>
                <input type="text" name="name" required className="w-full h-8 px-2 rounded border border-brand-border focus:outline-none" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-brand-text-primary">Moneda (Sólo Cuentas)</label>
                <select name="currency" className="w-full h-8 px-2 rounded border border-brand-border focus:outline-none">
                  <option value="USD">USD</option>
                  <option value="ARS">ARS</option>
                </select>
              </div>
              <Button type="submit" variant="primary" size="sm" className="w-full text-xs">Cargar Activo</Button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: META HEALTH & SYNC */}
      {activeTab === 'meta_sync' && isGlobalAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health Status & Connection Details */}
          <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle space-y-4">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-primary" />
              <span>Estado de Conexión Meta Graph API</span>
            </h3>

            {isLoadingMetaStatus ? (
              <p className="text-xs text-brand-text-secondary">Consultando estado...</p>
            ) : metaStatus && (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#F7F6F2] rounded border border-brand-border flex items-center justify-between">
                  <span>Conexión Servidor:</span>
                  <Badge variant={metaStatus.configured ? 'success' : 'neutral'}>
                    {metaStatus.configured ? 'Configurado' : 'Sin Configurar'}
                  </Badge>
                </div>
                <p className="text-[10px] text-brand-text-secondary">Versión API Meta: <strong>{metaStatus.apiVersion}</strong></p>
                <p className="text-[10px] text-brand-text-secondary">User System Token: <strong>{metaStatus.hasSystemUserToken ? 'Disponible (Enmascarado)' : 'No configurado'}</strong></p>
                <p className="text-[10px] text-brand-text-secondary">Sync Manual Habilitado: <strong>{metaStatus.manualSyncEnabled ? 'Sí' : 'No'}</strong></p>

                {metaStatus.configured && isSuperAdmin && (
                  <div className="pt-2">
                    <Button
                      variant="primary"
                      onClick={() => triggerManualSyncMutation.mutate({ lookbackDays: 7 })}
                      isLoading={triggerManualSyncMutation.isPending}
                      className="w-full text-xs gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Sincronizar Últimos 7 Días</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sync Logs list paginated */}
          <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-brand-primary" />
              <span>Logs Históricos de Sincronización</span>
            </h3>

            {isLoadingSyncLogs ? (
              <p className="text-xs text-brand-text-secondary">Cargando historial...</p>
            ) : (
              <div className="space-y-3 text-xs">
                {syncLogs.length === 0 ? (
                  <p className="text-brand-text-secondary italic">No se registran logs de sincronización.</p>
                ) : syncLogs.map(log => (
                  <div key={log.id} className="p-3 border border-brand-border rounded bg-white flex flex-col md:flex-row justify-between md:items-center gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-brand-text-primary">{log.adAccountId === 'ALL' ? 'Sincronización Total (Cron)' : `Cuenta: ${log.adAccountId}`}</strong>
                        <Badge variant={log.status === 'success' ? 'success' : log.status === 'in_progress' ? 'warning' : 'error'}>
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-brand-text-secondary mt-1">Disparador: <strong>{log.trigger}</strong> | Filas actualizadas: <strong>{log.rowsUpserted}</strong></p>
                      {log.failureReason && <p className="text-[10px] text-rose-700 font-semibold mt-1">Error: {log.failureReason}</p>}
                    </div>
                    <span className="text-[10px] text-brand-text-secondary font-mono">{log.createdAt ? new Date(log.createdAt).toLocaleString('es-AR') : ''}</span>
                  </div>
                ))}

                {/* Pagination */}
                {syncLogsData?.pagination && (
                  <div className="flex justify-between items-center pt-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={syncLogPage === 1}
                      onClick={() => setSyncLogPage(prev => Math.max(1, prev - 1))}
                      className="text-xs"
                    >
                      Anterior
                    </Button>
                    <span className="text-[10px] text-brand-text-secondary font-bold">Página {syncLogPage} de {syncLogsData.pagination.pages}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={syncLogPage === syncLogsData.pagination.pages}
                      onClick={() => setSyncLogPage(prev => prev + 1)}
                      className="text-xs"
                    >
                      Siguiente
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: EXCHANGE RATES */}
      {activeTab === 'exchange_rates' && isGlobalAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active rates list */}
          <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle lg:col-span-2 space-y-4">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-primary" />
              <span>Listado Histórico de Tasas de Cambio (USD ➔ ARS)</span>
            </h3>

            {isLoadingRates ? (
              <p className="text-xs text-brand-text-secondary">Cargando tasas...</p>
            ) : rates.length === 0 ? (
              <p className="text-xs text-brand-text-secondary italic">Sin tasas registradas en el sistema.</p>
            ) : (
              <div className="overflow-x-auto text-xs">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border text-brand-text-secondary font-bold text-left uppercase tracking-wider text-[10px]">
                      <th className="pb-2">Par</th>
                      <th className="pb-2 text-right">Tasa</th>
                      <th className="pb-2">Vigente Desde</th>
                      <th className="pb-2">Vigente Hasta</th>
                      <th className="pb-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rates.map(rate => (
                      <tr key={rate.id} className="border-b border-brand-border/40 hover:bg-[#F7F6F2]/30">
                        <td className="py-2 font-bold text-brand-text-primary">{rate.baseCurrency} / {rate.quoteCurrency}</td>
                        <td className="py-2 text-right font-mono font-semibold text-emerald-800">${rate.quotePerBase.toFixed(2)}</td>
                        <td className="py-2 text-brand-text-secondary">{new Date(rate.validFrom).toLocaleDateString('es-AR')}</td>
                        <td className="py-2 text-brand-text-secondary">{rate.validTo ? new Date(rate.validTo).toLocaleDateString('es-AR') : <span className="font-bold text-emerald-700">Activo / Indefinido</span>}</td>
                        <td className="py-2 text-right">
                          {isSuperAdmin && (
                            <button
                              onClick={() => {
                                if (confirm('¿Desea eliminar de forma inmutable esta tasa de cambio?')) {
                                  deleteExchangeRateMutation.mutate(rate.id);
                                }
                              }}
                              className="text-rose-700 hover:text-rose-900"
                            >
                              <Trash2 className="w-4 h-4 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Add rates form */}
          <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle space-y-4">
            <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-primary" />
              <span>Cargar Nueva Cotización</span>
            </h3>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setActionError(null);
              const data = new FormData(e.currentTarget);
              try {
                await createExchangeRateMutation.mutateAsync({
                  baseCurrency: 'USD',
                  quoteCurrency: 'ARS',
                  quotePerBase: parseFloat(data.get('quotePerBase')),
                  rateType: 'official',
                  validFrom: data.get('validFrom'),
                  validTo: data.get('validTo') || null,
                });
                e.target.reset();
              } catch (err) {
                setActionError(err.message);
              }
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1 text-brand-text-primary">Tasa de Cambio (1 USD = x ARS)</label>
                <input type="number" name="quotePerBase" step="0.01" required className="w-full h-8 px-2 rounded border border-brand-border focus:outline-none" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-brand-text-primary">Vigente Desde</label>
                <input type="date" name="validFrom" required className="w-full h-8 px-2 rounded border border-brand-border focus:outline-none" />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-brand-text-primary">Vigente Hasta (Opcional)</label>
                <input type="date" name="validTo" className="w-full h-8 px-2 rounded border border-brand-border focus:outline-none" />
              </div>
              <Button type="submit" variant="primary" size="sm" className="w-full text-xs">Registrar Tasa</Button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {activeTab === 'audit_logs' && isSuperAdmin && (
        <div className="bg-white border border-brand-border rounded-lg p-5 shadow-subtle space-y-4">
          <h3 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-brand-primary" />
            <span>Registro de Auditoría de Cambios Sensibles</span>
          </h3>

          {isLoadingAuditLogs ? (
            <p className="text-xs text-brand-text-secondary">Cargando logs de auditoría...</p>
          ) : (
            <div className="overflow-x-auto text-xs">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-brand-border text-brand-text-secondary font-bold text-left uppercase tracking-wider text-[10px]">
                    <th className="pb-2">Acción</th>
                    <th className="pb-2">Actor ID</th>
                    <th className="pb-2">Fecha</th>
                    <th className="pb-2">Detalles</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogsData?.logs?.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="py-4 text-center text-brand-text-secondary italic">Sin registros de auditoría.</td>
                    </tr>
                  ) : auditLogsData?.logs?.map(log => (
                    <tr key={log.id} className="border-b border-brand-border/40 hover:bg-[#F7F6F2]/30">
                      <td className="py-2 font-bold text-brand-text-primary"><Badge variant="primary" className="text-[9px]">{log.action}</Badge></td>
                      <td className="py-2 text-brand-text-secondary font-mono text-[10px]">{log.performedByUserId}</td>
                      <td className="py-2 text-brand-text-secondary font-mono text-[10px]">{new Date(log.performedAt).toLocaleString('es-AR')}</td>
                      <td className="py-2 text-brand-text-secondary font-mono text-[10px]">{JSON.stringify(log.details)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Invitation Token Details Modal */}
      {showInviteModal && generatedInviteUrl && (
        <Modal isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Enlace de Invitación Generado">
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800">
              El usuario fue preautorizado exitosamente. Comparta este enlace seguro de un solo uso con el invitado para que complete el login.
            </div>
            <div className="p-3 bg-[#F7F6F2] rounded border border-brand-border/80 font-mono text-xs select-all break-all">
              {generatedInviteUrl}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => handleCopyInviteUrl(generatedInviteUrl)} className="gap-1.5 text-xs">
                {copiedInviteUrl ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedInviteUrl ? 'Copiado' : 'Copiar Enlace'}</span>
              </Button>
              <Button variant="primary" onClick={() => setShowInviteModal(false)} className="text-xs">Cerrar</Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal Creación / Edición de Cliente */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => {
          setIsClientModalOpen(false);
          setSelectedClientForEdit(null);
        }}
        client={selectedClientForEdit}
        isLoading={createClientMutation.isPending || updateClientMutation.isPending}
        onSave={async (payload) => {
          if (selectedClientForEdit) {
            await updateClientMutation.mutateAsync({ id: selectedClientForEdit._id, data: payload });
          } else {
            await createClientMutation.mutateAsync(payload);
          }
        }}
      />

      {/* Modal Preautorización de Usuario */}
      <AuthorizeUserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        clients={clients}
        currentUserRole={userProfile?.role}
        isLoading={authorizeUserMutation.isPending}
        onAuthorize={async (userData) => {
          return await authorizeUserMutation.mutateAsync(userData);
        }}
      />

      {/* Modal de Confirmación para Acciones Críticas */}
      <Modal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, type: null, target: null })}
        title={
          confirmationModal.type?.includes('deactivate')
            ? 'Confirmar Desactivación de Empresa'
            : confirmationModal.type?.includes('reactivate_client')
            ? 'Confirmar Reactivación de Empresa'
            : confirmationModal.type?.includes('suspend')
            ? 'Confirmar Suspensión de Usuario'
            : 'Confirmar Reactivación de Usuario'
        }
        description="Esta acción modificará el estado operativo en MongoDB Atlas."
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-brand-text-primary flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              {confirmationModal.type === 'deactivate_client' && (
                <p>Al desactivar a <strong>{confirmationModal.target?.name}</strong>, todos los usuarios asignados a esta empresa verán bloqueado su acceso al CRM de forma inmediata.</p>
              )}
              {confirmationModal.type === 'reactivate_client' && (
                <p>Al reactivar a <strong>{confirmationModal.target?.name}</strong>, sus usuarios autorizados recuperarán el acceso habitual al CRM.</p>
              )}
              {confirmationModal.type === 'suspend_user' && (
                <p>Al suspender a <strong>{confirmationModal.target?.email}</strong>, su sesión será invalidada y no podrá ingresar al CRM hasta que sea reactivado.</p>
              )}
              {confirmationModal.type === 'reactivate_user' && (
                <p>Al reactivar a <strong>{confirmationModal.target?.email}</strong>, podrá volver a ingresar mediante autenticación con Google.</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-brand-border">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConfirmationModal({ isOpen: false, type: null, target: null })}
              disabled={toggleClientStatusMutation.isPending || toggleUserStatusMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant={confirmationModal.type?.includes('suspend') || confirmationModal.type?.includes('deactivate') ? 'danger' : 'primary'}
              isLoading={toggleClientStatusMutation.isPending || toggleUserStatusMutation.isPending}
              onClick={handleExecuteConfirmation}
            >
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
