import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Users,
  Plus,
  Upload,
  Search,
  Kanban,
  Table as TableIcon,
  Phone,
  Mail,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { LeadModal } from '../components/leads/LeadModal';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { SaleModal } from '../components/leads/SaleModal';
import { CsvImportModal } from '../components/leads/CsvImportModal';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate, formatCurrency, formatNumber } from '../lib/utils';
import { apiClient, ApiError } from '../lib/api';
import {
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_COLORS,
} from '../lib/constants';

export function LeadsPage() {
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get('clientId') || '';

  const { userProfile, firebaseUser, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const isGlobal = ['super_admin', 'admin'].includes(userProfile?.role);
  const isSalesperson = userProfile?.role === 'salesperson';

  // Data state
  const [leads, setLeads] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const activeClientId = isGlobal ? selectedClientId : userProfile?.clientId;
  const selectedClientDoc = clients.find(c => (c._id || c.id) === activeClientId);
  const tenantTimezone = selectedClientDoc?.timezone || 'America/Argentina/Buenos_Aires';

  // View state: 'kanban' | 'table'
  const [viewMode, setViewMode] = useState('kanban');

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedSalesperson, setSelectedSalesperson] = useState('all');
  const [statusFilter, setStatusFilter] = useState('active');

  // Modals state
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [editingLead, setEditingLead] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState(null);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedLeadForSale, setSelectedLeadForSale] = useState(null);
  const [selectedSaleForCollect, setSelectedSaleForCollect] = useState(null);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Fetch clients for all users (non-global gets their own client)
  const fetchClients = useCallback(async () => {
    if (authLoading || !firebaseUser) return;
    try {
      const data = await apiClient.get('/api/clients');
      const clientsList = data.clients || [];
      setClients(clientsList);
      if (clientsList.length > 0 && !selectedClientId) {
        if (initialClientId && clientsList.some((c) => (c.id || c._id) === initialClientId)) {
          setSelectedClientId(initialClientId);
        } else {
          setSelectedClientId(clientsList[0].id || clientsList[0]._id);
        }
      }
    } catch (err) {
      console.warn('[LEADS] Error fetching clients:', err.message);
    }
  }, [authLoading, firebaseUser, initialClientId, selectedClientId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Fetch salespeople for current scope
  const fetchSalespeople = useCallback(async () => {
    if (authLoading || !firebaseUser) return;
    try {
      const q = selectedClientId ? `?clientId=${encodeURIComponent(selectedClientId)}` : '';
      const data = await apiClient.get(`/api/users${q}`);
      const usersList = data.users || [];
      const eligibleSp = usersList.filter(
        (u) => u.role === 'salesperson' && ['active', 'invited'].includes(u.status)
      );
      setSalespeople(eligibleSp);
    } catch (err) {
      console.warn('[LEADS] Error fetching salespeople:', err.message);
    }
  }, [selectedClientId, authLoading, firebaseUser]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    if (authLoading || !firebaseUser) return;
    setIsLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams();
      if (selectedClientId && isGlobal) params.set('clientId', selectedClientId);
      if (selectedStage !== 'all') params.set('stage', selectedStage);
      if (selectedSalesperson !== 'all') params.set('assignedToUserId', selectedSalesperson);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('status', statusFilter);
      params.set('limit', '100');

      const data = await apiClient(`/api/leads?${params.toString()}`);
      setLeads(data.leads || []);
    } catch (err) {
      console.error('[LEADS] Error fetching leads:', err);
      if (err instanceof ApiError) {
        if (err.status === 403) {
          setFetchError('No tenés permisos para acceder a los prospectos de este cliente.');
        } else if (err.status >= 500) {
          setFetchError('El servidor de prospectos no está disponible temporalmente.');
        } else {
          setFetchError(err.message || 'Error al cargar prospectos.');
        }
      } else {
        setFetchError('Error de red al consultar prospectos. Verifique su conexión.');
      }
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedClientId, selectedStage, selectedSalesperson, searchQuery, statusFilter, isGlobal, authLoading, firebaseUser]);

  useEffect(() => {
    fetchSalespeople();
    fetchLeads();
  }, [fetchSalespeople, fetchLeads]);

  // Save or update lead
  const handleSaveLead = async (payload, leadId) => {
    setIsActionLoading(true);
    setFeedback(null);
    try {
      const url = leadId ? `/api/leads/${leadId}` : '/api/leads';
      const method = leadId ? 'PATCH' : 'POST';

      const data = await apiClient(url, {
        method,
        body: JSON.stringify(payload),
      });

      setFeedback({
        type: 'success',
        message: leadId ? 'Prospecto actualizado con éxito.' : 'Prospecto creado exitosamente.',
      });
      setIsLeadModalOpen(false);
      setEditingLead(null);
      await fetchLeads();
      return data.lead;
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al guardar el prospecto.',
      });
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Quick stage transition (Kanban & Detail)
  const handleStageChange = async (leadId, newStage, lostReason = null) => {
    try {
      await apiClient.post(`/api/leads/${leadId}/stage`, {
        stage: newStage,
        ...(lostReason ? { lostReason } : {}),
      });

      // Optimistic or refresh
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId
            ? {
                ...l,
                stage: newStage,
                lostReason: newStage === 'lost' ? lostReason : null,
              }
            : l
        )
      );

      if (selectedLeadForDetail && selectedLeadForDetail.id === leadId) {
        setSelectedLeadForDetail((prev) => ({
          ...prev,
          stage: newStage,
          lostReason: newStage === 'lost' ? lostReason : null,
        }));
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al cambiar de etapa.',
      });
      await fetchLeads();
      throw err;
    }
  };

  // Reassign salesperson
  const handleAssignChange = async (leadId, assignedToUserId) => {
    try {
      const data = await apiClient.post(`/api/leads/${leadId}/assign`, {
        assignedToUserId,
      });

      const updatedLead = data.lead;
      setLeads((prev) =>
        prev.map((l) => (l.id === leadId ? { ...l, ...updatedLead } : l))
      );

      if (selectedLeadForDetail && selectedLeadForDetail.id === leadId) {
        setSelectedLeadForDetail((prev) => ({ ...prev, ...updatedLead }));
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al asignar vendedor.',
      });
      await fetchLeads();
      throw err;
    }
  };

  // Archive lead
  const handleArchive = async (leadId) => {
    try {
      await apiClient.post(`/api/leads/${leadId}/archive`, {});

      setFeedback({
        type: 'success',
        message: 'Prospecto archivado correctamente.',
      });
      setIsDetailModalOpen(false);
      await fetchLeads();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al archivar prospecto.',
      });
    }
  };

  // Reactivate lead
  const handleReactivate = async (leadId) => {
    try {
      await apiClient.post(`/api/leads/${leadId}/reactivate`, {});

      setFeedback({
        type: 'success',
        message: 'Prospecto reactivado correctamente.',
      });
      setIsDetailModalOpen(false);
      await fetchLeads();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al reactivar prospecto.',
      });
    }
  };

  // Open detail modal with complete lead info
  const openLeadDetail = async (lead) => {
    try {
      const data = await apiClient(`/api/leads/${lead.id}`);
      setSelectedLeadForDetail(data.lead || lead);
      setIsDetailModalOpen(true);
    } catch {
      setSelectedLeadForDetail(lead);
      setIsDetailModalOpen(true);
    }
  };

  // Open sale modal (new sale or collect payment)
  const openSaleModal = (lead, sale = null) => {
    setSelectedLeadForSale(lead);
    setSelectedSaleForCollect(sale);
    setIsSaleModalOpen(true);
  };

  // Handle register sale
  const handleSaveSale = async (salePayload) => {
    setIsActionLoading(true);
    setFeedback(null);
    try {
      await apiClient('/api/sales', {
        method: 'POST',
        body: JSON.stringify(salePayload),
      });

      setFeedback({
        type: 'success',
        message: 'Venta registrada con éxito y lead marcado como Ganado.',
      });
      setIsSaleModalOpen(false);
      setSelectedLeadForSale(null);
      await fetchLeads();
      if (selectedLeadForDetail) {
        await openLeadDetail(selectedLeadForDetail);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al registrar la venta.',
      });
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle collect payment on existing sale
  const handleCollectPayment = async (saleId, paymentPayload) => {
    setIsActionLoading(true);
    setFeedback(null);
    try {
      await apiClient(`/api/sales/${saleId}/payments`, {
        method: 'POST',
        body: JSON.stringify(paymentPayload),
      });

      setFeedback({
        type: 'success',
        message: 'Cobro registrado correctamente.',
      });
      setIsSaleModalOpen(false);
      setSelectedSaleForCollect(null);
      await fetchLeads();
      if (selectedLeadForDetail) {
        await openLeadDetail(selectedLeadForDetail);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al registrar cobro.',
      });
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle cancel sale
  const handleCancelSale = async (saleId, notes) => {
    setIsActionLoading(true);
    setFeedback(null);
    try {
      await apiClient(`/api/sales/${saleId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ notes }),
      });

      setFeedback({
        type: 'success',
        message: 'Venta anulada correctamente.',
      });
      setIsSaleModalOpen(false);
      setSelectedSaleForCollect(null);
      await fetchLeads();
      if (selectedLeadForDetail) {
        await openLeadDetail(selectedLeadForDetail);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error al anular venta.',
      });
      throw err;
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-brand-border">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Gestión de Leads & Pipeline Comercial
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            Administración del ciclo comercial, captura de prospectos y control de cierres.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isSalesperson && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsCsvModalOpen(true)}
              className="text-xs gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Importar CSV</span>
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingLead(null);
              setIsLeadModalOpen(true);
            }}
            className="text-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Prospecto</span>
          </Button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <Alert
          variant={feedback.type === 'error' ? 'error' : 'success'}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Query Fetch Error Banner */}
      {fetchError && (
        <Alert variant="error" className="flex items-center justify-between">
          <span>{fetchError}</span>
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchLeads}
            className="text-xs gap-1 py-1 ml-4"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reintentar</span>
          </Button>
        </Alert>
      )}

      {/* Control Bar: Search, Filters & View Toggle */}
      <div className="p-4 bg-white border border-brand-border rounded-lg shadow-subtle space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-brand-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo electrónico o teléfono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-xs rounded-md border border-brand-border bg-white text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {isGlobal && clients.length > 0 && (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="h-9 px-2.5 text-xs rounded border border-brand-border bg-white text-brand-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                {clients.map((c) => {
                  const cId = c.id || c._id;
                  return (
                    <option key={cId} value={cId}>
                      Empresa: {c.name}
                    </option>
                  );
                })}
              </select>
            )}

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="h-9 px-2.5 text-xs rounded border border-brand-border bg-white text-brand-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="all">Todas las Etapas</option>
              {LEAD_STAGES.map((stg) => (
                <option key={stg} value={stg}>
                  {LEAD_STAGE_LABELS[stg]}
                </option>
              ))}
            </select>

            {!isSalesperson && (
              <select
                value={selectedSalesperson}
                onChange={(e) => setSelectedSalesperson(e.target.value)}
                className="h-9 px-2.5 text-xs rounded border border-brand-border bg-white text-brand-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">Todos los Vendedores</option>
                {salespeople.map((sp) => {
                  const spId = sp.id || sp._id;
                  return (
                    <option key={spId} value={spId}>
                      {sp.displayName || sp.email}{sp.status === 'invited' ? ' (Pendiente de activación)' : ''}
                    </option>
                  );
                })}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded border border-brand-border bg-white text-brand-text-primary font-medium focus:outline-none focus:ring-1 focus:ring-brand-primary"
            >
              <option value="active">Activos</option>
              <option value="archived">Archivados</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex border border-brand-border rounded bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 font-semibold transition-colors ${
                  viewMode === 'kanban' ? 'bg-white shadow-subtle text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
                title="Vista Tablero Kanban"
              >
                <Kanban className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded text-xs flex items-center gap-1 font-semibold transition-colors ${
                  viewMode === 'table' ? 'bg-white shadow-subtle text-brand-primary' : 'text-brand-text-secondary hover:text-brand-text-primary'
                }`}
                title="Vista Tabla"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Kanban or Table */}
      {isLoading ? (
        <div className="p-12 text-center text-xs text-brand-text-secondary bg-white border border-brand-border rounded-lg">
          Cargando prospectos y pipeline...
        </div>
      ) : fetchError ? (
        <div className="p-8 text-center text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
          {fetchError}
        </div>
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No se encontraron prospectos"
          description="Comenzá dando de alta un nuevo lead de forma manual o importando un lote CSV."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setEditingLead(null);
                setIsLeadModalOpen(true);
              }}
              className="text-xs"
            >
              Crear Primer Prospecto
            </Button>
          }
        />
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {LEAD_STAGES.map((stg, stgIdx) => {
            const columnLeads = leads.filter((l) => l.stage === stg);
            const totalValueMinor = columnLeads.reduce((acc, l) => acc + (l.valueEstimateMinor || 0), 0);
            const stgColor = LEAD_STAGE_COLORS[stg] || LEAD_STAGE_COLORS.new;

            return (
              <div
                key={stg}
                className={`p-3 rounded-lg border flex flex-col min-h-[450px] ${stgColor.bg} ${stgColor.border}`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-brand-border/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase text-brand-text-primary">
                      {LEAD_STAGE_LABELS[stg]}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full bg-white border border-brand-border text-[10px] font-bold font-mono text-brand-text-primary">
                      {columnLeads.length}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-brand-text-secondary">
                    {formatCurrency(totalValueMinor / 100, 'ARS', language === 'es' ? 'es-AR' : 'en-US')}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2.5 flex-1">
                  {columnLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white p-3 rounded border border-brand-border shadow-subtle hover:border-brand-primary transition-all space-y-2 text-xs"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => openLeadDetail(lead)}
                          className="font-bold text-brand-text-primary hover:text-brand-primary text-left text-xs leading-snug"
                        >
                          {lead.name}
                        </button>
                        <span className="text-[10px] font-mono text-brand-text-secondary uppercase">
                          {lead.source}
                        </span>
                      </div>

                      {/* Contact items */}
                      <div className="space-y-0.5 text-[11px] text-brand-text-secondary">
                        {lead.email && (
                          <div className="flex items-center gap-1 truncate">
                            <Mail className="w-3 h-3 text-brand-primary flex-shrink-0" />
                            <span className="truncate">{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-brand-primary flex-shrink-0" />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>

                      {/* Salesperson & Value */}
                      <div className="flex items-center justify-between pt-1.5 border-t border-brand-border/60 text-[11px]">
                        <span className="text-brand-text-secondary truncate max-w-[100px]">
                          {lead.assignedToUser?.displayName || 'Sin asignar'}
                        </span>
                        <span className="font-bold font-mono text-brand-text-primary">
                          {formatCurrency((lead.valueEstimateMinor || 0) / 100, lead.currency || 'ARS', language === 'es' ? 'es-AR' : 'en-US')}
                        </span>
                      </div>

                      {/* Quick stage transition accessible buttons */}
                      <div className="flex items-center justify-between pt-1 border-t border-brand-border/40 gap-1">
                        <button
                          type="button"
                          disabled={stgIdx === 0}
                          onClick={() => handleStageChange(lead.id, LEAD_STAGES[stgIdx - 1])}
                          className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Retroceder etapa"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => openLeadDetail(lead)}
                          className="px-2 py-0.5 text-[10px] rounded bg-gray-100 hover:bg-gray-200 text-brand-text-primary font-semibold"
                        >
                          Ver Detalle
                        </button>

                        <button
                          type="button"
                          disabled={stgIdx === LEAD_STAGES.length - 1}
                          onClick={() => handleStageChange(lead.id, LEAD_STAGES[stgIdx + 1])}
                          className="p-1 rounded text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Avanzar etapa"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-brand-border rounded-lg shadow-subtle overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#F7F6F2] border-b border-brand-border text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Contacto</th>
                <th className="p-3">Etapa</th>
                <th className="p-3">Vendedor</th>
                <th className="p-3">Valor Estimado</th>
                <th className="p-3">Origen</th>
                <th className="p-3">Fecha Captura</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border/60">
              {leads.map((lead) => {
                const stgColor = LEAD_STAGE_COLORS[lead.stage] || LEAD_STAGE_COLORS.new;
                return (
                  <tr key={lead.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="p-3 font-semibold text-brand-text-primary">
                      <button
                        type="button"
                        onClick={() => openLeadDetail(lead)}
                        className="hover:underline text-left font-bold"
                      >
                        {lead.name}
                      </button>
                    </td>
                    <td className="p-3 text-brand-text-secondary font-mono space-y-0.5">
                      <div>{lead.email || '-'}</div>
                      <div className="text-[11px] text-gray-500">{lead.phone || '-'}</div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${stgColor.badge}`}>
                        {LEAD_STAGE_LABELS[lead.stage]}
                      </span>
                    </td>
                    <td className="p-3 text-brand-text-secondary">
                      {lead.assignedToUser?.displayName || <span className="italic text-gray-400">Sin asignar</span>}
                    </td>
                    <td className="p-3 font-mono font-bold text-brand-text-primary">
                      {formatCurrency((lead.valueEstimateMinor || 0) / 100, lead.currency, language === 'es' ? 'es-AR' : 'en-US')}
                    </td>
                    <td className="p-3 uppercase font-mono text-[10px] text-brand-text-secondary">
                      {lead.source}
                    </td>
                    <td className="p-3 text-brand-text-secondary">
                      {lead.acquiredAt ? formatDate(lead.acquiredAt, tenantTimezone, language === 'es' ? 'es-AR' : 'en-US') : '-'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => openLeadDetail(lead)}
                          className="text-xs py-1 px-2"
                          title="Ver Ficha y Actividad"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openSaleModal(lead)}
                          className="text-xs py-1 px-2"
                          title="Registrar Venta"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        onSave={handleSaveLead}
        lead={editingLead}
        salespeople={salespeople}
        clients={clients}
        isGlobal={isGlobal}
        userRole={userProfile?.role}
        isLoading={isActionLoading}
      />

      <LeadDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        lead={selectedLeadForDetail}
        onStageChange={handleStageChange}
        onAssignChange={handleAssignChange}
        onArchive={handleArchive}
        onReactivate={handleReactivate}
        onOpenSaleModal={openSaleModal}
        salespeople={salespeople}
        userRole={userProfile?.role}
        timezone={tenantTimezone}
      />

      <SaleModal
        isOpen={isSaleModalOpen}
        onClose={() => setIsSaleModalOpen(false)}
        onSaveSale={handleSaveSale}
        onCollectPayment={handleCollectPayment}
        onCancelSale={handleCancelSale}
        lead={selectedLeadForSale}
        sale={selectedSaleForCollect}
        userRole={userProfile?.role}
        defaultCurrency={selectedLeadForSale?.currency || 'ARS'}
        isLoading={isActionLoading}
      />

      <CsvImportModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportComplete={() => {
          fetchLeads();
        }}
        salespeople={salespeople}
        clients={clients}
        isGlobal={isGlobal}
      />
    </div>
  );
}
