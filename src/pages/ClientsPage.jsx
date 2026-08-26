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

export function ClientsPage() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const isGlobalAdmin = ['super_admin', 'admin'].includes(userProfile?.role);

  const [activeTab, setActiveTab] = useState('clients'); // 'clients' | 'users'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientForEdit, setSelectedClientForEdit] = useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState({
    isOpen: false,
    type: null, // 'deactivate_client' | 'reactivate_client' | 'suspend_user' | 'reactivate_user'
    target: null,
  });
  const [copiedLinkUserId, setCopiedLinkUserId] = useState(null);
  const [actionError, setActionError] = useState(null);

  // 1. Fetch Clients
  const {
    data: clientsData,
    isLoading: isLoadingClients,
    error: clientsError,
  } = useQuery({
    queryKey: ['clients', userProfile?._id],
    queryFn: () => apiClient('/api/clients'),
  });

  // 2. Fetch Users
  const {
    data: usersData,
    isLoading: isLoadingUsers,
    error: usersError,
  } = useQuery({
    queryKey: ['users', userProfile?._id],
    queryFn: () => apiClient('/api/users'),
    enabled: isGlobalAdmin || activeTab === 'users',
  });

  const clients = clientsData?.clients || [];
  const users = usersData?.users || [];

  // Mutations for Clients
  const createClientMutation = useMutation({
    mutationFn: (newClient) =>
      apiClient('/api/clients', {
        method: 'POST',
        body: JSON.stringify(newClient),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsClientModalOpen(false);
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: ({ id, data }) =>
      apiClient(`/api/clients/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsClientModalOpen(false);
      setSelectedClientForEdit(null);
    },
  });

  const toggleClientStatusMutation = useMutation({
    mutationFn: ({ id, action }) =>
      apiClient(`/api/clients/${id}/${action}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setConfirmationModal({ isOpen: false, type: null, target: null });
    },
    onError: (err) => {
      setActionError(err.message || 'Error al modificar el estado de la empresa.');
    },
  });

  // Mutations for Users
  const authorizeUserMutation = useMutation({
    mutationFn: (userData) =>
      apiClient('/api/users/authorize', {
        method: 'POST',
        body: JSON.stringify(userData),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: ({ id, action }) =>
      apiClient(`/api/users/${id}/${action}`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setConfirmationModal({ isOpen: false, type: null, target: null });
    },
    onError: (err) => {
      setActionError(err.message || 'Error al modificar el estado del usuario.');
    },
  });

  // Client filtering
  const filteredClients = clients.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name?.toLowerCase().includes(q) ||
      c.slug?.toLowerCase().includes(q) ||
      c.legalName?.toLowerCase().includes(q)
    );
  });

  // User filtering
  const filteredUsers = users.filter((u) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.displayName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const handleCopyAccessLink = (userId) => {
    const loginUrl = `${window.location.origin}/login`;
    navigator.clipboard.writeText(loginUrl);
    setCopiedLinkUserId(userId);
    setTimeout(() => setCopiedLinkUserId(null), 2500);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Gestión Multiempresa & Usuarios
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            Aislamiento estricto de clientes, vinculación de cuentas y preautorización de accesos.
          </p>
        </div>

        {isGlobalAdmin && (
          <div className="flex items-center gap-2">
            {activeTab === 'clients' ? (
              <Button
                variant="primary"
                onClick={() => {
                  setSelectedClientForEdit(null);
                  setIsClientModalOpen(true);
                }}
                className="gap-1.5 text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Nueva Empresa
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={() => setIsUserModalOpen(true)}
                className="gap-1.5 text-xs shadow-xs"
              >
                <Plus className="w-4 h-4" />
                Autorizar Usuario
              </Button>
            )}
          </div>
        )}
      </div>

      {actionError && <Alert type="error">{actionError}</Alert>}

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-brand-surface p-1 rounded-lg border border-brand-border self-start">
          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
              activeTab === 'clients'
                ? 'bg-brand-bg text-brand-text-primary shadow-xs'
                : 'text-brand-text-secondary hover:text-brand-text-primary'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Empresas ({clients.length})
          </button>

          {isGlobalAdmin && (
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeTab === 'users'
                  ? 'bg-brand-bg text-brand-text-primary shadow-xs'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <Users className="w-4 h-4" />
              Usuarios ({users.length})
            </button>
          )}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-brand-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'clients' ? 'Buscar empresa o slug...' : 'Buscar usuario o correo...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border border-brand-border bg-brand-surface text-xs text-brand-text-primary focus:outline-hidden focus:ring-2 focus:ring-brand-accent/20 focus:border-brand-accent"
          />
        </div>
      </div>

      {/* TAB 1: CLIENTS LIST */}
      {activeTab === 'clients' && (
        <div>
          {isLoadingClients ? (
            <div className="flex items-center justify-center py-16 text-xs text-brand-text-secondary">
              Cargando empresas...
            </div>
          ) : clientsError ? (
            <Alert type="error">
              {clientsError.message || 'Error al cargar las empresas desde el servidor.'}
            </Alert>
          ) : filteredClients.length === 0 ? (
            <EmptyState
              icon={Building2}
              title={searchQuery ? 'Sin Resultados' : 'Sin Empresas Registradas'}
              description={
                searchQuery
                  ? 'No se encontraron empresas que coincidan con la búsqueda.'
                  : 'Cree la primera empresa para habilitar el aislamiento multiempresa y la gestión de campañas.'
              }
              action={
                isGlobalAdmin && !searchQuery ? (
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSelectedClientForEdit(null);
                      setIsClientModalOpen(true);
                    }}
                    className="gap-1.5 text-xs mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Primera Empresa
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredClients.map((client) => {
                const isActive = client.status === 'active';
                return (
                  <div
                    key={client._id}
                    className={`bg-brand-surface rounded-xl border p-5 flex flex-col justify-between transition-all ${
                      isActive
                        ? 'border-brand-border hover:border-brand-accent/40 shadow-xs'
                        : 'border-brand-border/60 bg-brand-bg/40 opacity-75'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Title & Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h2 className="text-sm font-bold text-brand-text-primary">
                            {client.name}
                          </h2>
                          {client.legalName && (
                            <p className="text-xs text-brand-text-secondary">{client.legalName}</p>
                          )}
                        </div>
                        <Badge variant={isActive ? 'success' : 'neutral'} className="text-[11px] py-0.5 px-2">
                          {isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>

                      {/* Details */}
                      <div className="space-y-1 text-xs text-brand-text-secondary pt-1">
                        <div className="flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-brand-text-secondary/70 shrink-0" />
                          <span className="font-mono text-[11px] bg-brand-bg px-1.5 py-0.5 rounded-sm border border-brand-border/60">
                            {client.slug}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-brand-text-secondary/70 shrink-0" />
                          <span>
                            {client.country || 'AR'} • {client.defaultCurrency || 'ARS'}
                          </span>
                        </div>
                      </div>

                      {/* Meta Ad Accounts */}
                      {client.metaAdAccountIds && client.metaAdAccountIds.length > 0 && (
                        <div className="pt-2 border-t border-brand-border/60">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-brand-text-secondary mb-1">
                            Cuentas Meta Ads
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {client.metaAdAccountIds.map((accId) => (
                              <span
                                key={accId}
                                className="text-[10px] font-mono bg-brand-bg px-1.5 py-0.5 rounded-sm border border-brand-border text-brand-text-primary"
                              >
                                {accId}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    {isGlobalAdmin && (
                      <div className="flex items-center justify-end gap-1.5 pt-4 mt-3 border-t border-brand-border">
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
                          onClick={() =>
                            setConfirmationModal({
                              isOpen: true,
                              type: isActive ? 'deactivate_client' : 'reactivate_client',
                              target: client,
                            })
                          }
                          className={`h-8 px-2.5 text-xs gap-1 ${
                            isActive
                              ? 'text-brand-error hover:bg-brand-error/10'
                              : 'text-brand-accent hover:bg-brand-accent/10'
                          }`}
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

      {/* TAB 2: USERS LIST */}
      {activeTab === 'users' && isGlobalAdmin && (
        <div>
          {isLoadingUsers ? (
            <div className="flex items-center justify-center py-16 text-xs text-brand-text-secondary">
              Cargando usuarios...
            </div>
          ) : usersError ? (
            <Alert type="error">
              {usersError.message || 'Error al cargar los usuarios desde el servidor.'}
            </Alert>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={searchQuery ? 'Sin Resultados' : 'Sin Usuarios Autorizados'}
              description={
                searchQuery
                  ? 'No se encontraron usuarios que coincidan con la búsqueda.'
                  : 'Preautorice al primer usuario para permitir su ingreso seguro con Google.'
              }
              action={
                !searchQuery ? (
                  <Button
                    variant="primary"
                    onClick={() => setIsUserModalOpen(true)}
                    className="gap-1.5 text-xs mt-2"
                  >
                    <Plus className="w-4 h-4" />
                    Autorizar Primer Usuario
                  </Button>
                ) : null
              }
            />
          ) : (
            <div className="bg-brand-surface rounded-xl border border-brand-border overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-bg/60 border-b border-brand-border text-brand-text-secondary font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Usuario</th>
                      <th className="py-3 px-4">Rol</th>
                      <th className="py-3 px-4">Empresa Asignada</th>
                      <th className="py-3 px-4">Estado</th>
                      <th className="py-3 px-4">Google UID</th>
                      <th className="py-3 px-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {filteredUsers.map((user) => {
                      const clientName =
                        clients.find((c) => c._id === user.clientId)?.name ||
                        (user.clientId ? `ID: ${user.clientId}` : 'Acceso Global');
                      const isSelf = user.firebaseUid === userProfile?.firebaseUid;
                      const isTargetSuperAdmin = user.role === 'super_admin';
                      const canManageUser =
                        !isSelf && (userProfile?.role === 'super_admin' || !isTargetSuperAdmin);

                      let statusBadge = <Badge variant="success">Activo</Badge>;
                      if (user.status === 'suspended') {
                        statusBadge = <Badge variant="error">Suspendido</Badge>;
                      } else if (user.status === 'invited' || user.status === 'pending_invite') {
                        statusBadge = <Badge variant="warning">Pendiente Google</Badge>;
                      }

                      return (
                        <tr key={user._id} className="hover:bg-brand-bg/30 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-brand-text-primary">
                              {user.displayName || user.email}
                            </p>
                            <p className="text-[11px] text-brand-text-secondary font-mono">{user.email}</p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-brand-text-primary">
                              {formatRole(user.role)}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-brand-text-secondary">
                            {clientName}
                          </td>
                          <td className="py-3 px-4">{statusBadge}</td>
                          <td className="py-3 px-4">
                            {user.firebaseUid ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-brand-accent font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Vinculado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                                <Clock className="w-3.5 h-3.5" />
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="secondary"
                                onClick={() => handleCopyAccessLink(user._id)}
                                className="h-7 px-2 text-[11px] gap-1"
                                title="Copiar enlace de acceso /login"
                              >
                                {copiedLinkUserId === user._id ? (
                                  <Check className="w-3 h-3 text-brand-accent" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                                {copiedLinkUserId === user._id ? 'Copiado' : 'Enlace'}
                              </Button>

                              {canManageUser && (
                                <Button
                                  variant="secondary"
                                  onClick={() =>
                                    setConfirmationModal({
                                      isOpen: true,
                                      type: user.status === 'suspended' ? 'reactivate_user' : 'suspend_user',
                                      target: user,
                                    })
                                  }
                                  className={`h-7 px-2 text-[11px] gap-1 ${
                                    user.status === 'suspended'
                                      ? 'text-brand-accent hover:bg-brand-accent/10'
                                      : 'text-brand-error hover:bg-brand-error/10'
                                  }`}
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
        </div>
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
            await updateClientMutation.mutateAsync({
              id: selectedClientForEdit._id,
              data: payload,
            });
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
                <p>
                  Al desactivar a <strong>{confirmationModal.target?.name}</strong>, todos los usuarios
                  asignados a esta empresa verán bloqueado su acceso al CRM de forma inmediata.
                </p>
              )}
              {confirmationModal.type === 'reactivate_client' && (
                <p>
                  Al reactivar a <strong>{confirmationModal.target?.name}</strong>, sus usuarios autorizados
                  recuperarán el acceso habitual al CRM.
                </p>
              )}
              {confirmationModal.type === 'suspend_user' && (
                <p>
                  Al suspender a <strong>{confirmationModal.target?.email}</strong>, su sesión será
                  invalidada y no podrá ingresar al CRM hasta que sea reactivado.
                </p>
              )}
              {confirmationModal.type === 'reactivate_user' && (
                <p>
                  Al reactivar a <strong>{confirmationModal.target?.email}</strong>, podrá volver a
                  ingresar mediante autenticación con Google.
                </p>
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
