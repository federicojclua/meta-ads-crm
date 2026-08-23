import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { LeadModal } from '../components/leads/LeadModal';
import { LeadDetailModal } from '../components/leads/LeadDetailModal';
import { SaleModal } from '../components/leads/SaleModal';
import { CsvImportModal } from '../components/leads/CsvImportModal';
import {
  LEAD_STAGES,
  LEAD_STAGE_LABELS,
  LEAD_STAGE_COLORS,
  CURRENT_STAGE,
} from '../lib/constants';

export function LeadsPage() {
  const { userProfile } = useAuth();
  const isGlobal = ['super_admin', 'admin'].includes(userProfile?.role);
  const isSalesperson = userProfile?.role === 'salesperson';

  // Data state
  const [leads, setLeads] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

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

  // Fetch initial clients for global users
  useEffect(() => {
    if (isGlobal) {
      fetch('/api/clients', {
        headers: { authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      })
        .then((res) => (res.ok ? res.json() : { clients: [] }))
        .then((data) => {
          const cls = data.clients || [];
          setClients(cls);
          if (cls.length > 0 && !selectedClientId) {
            setSelectedClientId(cls[0].id);
          }
        })
        .catch((err) => console.warn('Error fetching clients:', err));
    }
  }, [isGlobal, selectedClientId]);

  // Fetch salespeople for current scope
  const fetchSalespeople = useCallback(async () => {
    try {
      const q = selectedClientId ? `?clientId=${selectedClientId}` : '';
      const res = await fetch(`/api/users${q}`, {
        headers: { authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        const usersList = data.users || [];
        const activeSp = usersList.filter(
          (u) => u.status === 'active' && ['salesperson', 'client', 'admin'].includes(u.role)
        );
        setSalespeople(activeSp);
      }
    } catch (err) {
      console.warn('Error fetching salespeople:', err);
    }
  }, [selectedClientId]);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedClientId && isGlobal) params.set('clientId', selectedClientId);
      if (selectedStage !== 'all') params.set('stage', selectedStage);
      if (selectedSalesperson !== 'all') params.set('assignedToUserId', selectedSalesperson);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      params.set('status', statusFilter);
      params.set('limit', '100');

      const res = await fetch(`/api/leads?${params.toString()}`, {
        headers: { authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });

      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      } else {
        const errData = await res.json();
        setFeedback({ type: 'error', message: errData.message || 'Error al cargar prospectos.' });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: 'Error de conexión al cargar prospectos.' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedClientId, selectedStage, selectedSalesperson, searchQuery, statusFilter, isGlobal]);

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

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error al guardar prospecto.');
      }

      setFeedback({
        type: 'success',
        message: data.message || 'Prospecto guardado exitosamente.',
      });

      await fetchLeads();
    } finally {
      setIsActionLoading(false);
    }
  };

  // Change stage
  const handleStageChange = async (leadId, nextStage, lostReason = null) => {
    try {
      const payload = { stage: nextStage };
      if (nextStage === 'lost' && lostReason) {
        payload.lostReason = lostReason;
      }
      const res = await fetch(`/api/leads/${leadId}/stage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchLeads();
      }
    } catch (err) {
      console.warn('Error changing stage:', err);
    }
  };

  // Assign salesperson
  const handleAssignChange = async (leadId, spId) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ assignedToUserId: spId }),
      });
      if (res.ok) {
        await fetchLeads();
      }
    } catch (err) {
      console.warn('Error assigning salesperson:', err);
    }
  };

  // Archive / Reactivate
  const handleArchive = async (leadId) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/archive`, {
        method: 'POST',
        headers: { authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Prospecto archivado.' });
        await fetchLeads();
        setIsDetailModalOpen(false);
      }
    } catch (err) {
      console.warn('Error archiving lead:', err);
    }
  };

  const handleReactivate = async (leadId) => {
    try {
      const res = await fetch(`/api/leads/${leadId}/reactivate`, {
        method: 'POST',
        headers: { authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Prospecto reactivado.' });
        await fetchLeads();
        setIsDetailModalOpen(false);
      }
    } catch (err) {
      console.warn('Error reactivating lead:', err);
    }
  };

  // Save Sale & Collect Payments
  const handleSaveSale = async (payload) => {
    setIsActionLoading(true);
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error al guardar la venta.');
      }

      setFeedback({ type: 'success', message: 'Venta registrada exitosamente.' });
      await fetchLeads();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCollectPayment = async (saleId, payload) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/sales/${saleId}/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Error al registrar el cobro.');
      }

      setFeedback({ type: 'success', message: 'Cobro confirmado exitosamente.' });
      await fetchLeads();
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleCancelSale = async (saleId) => {
    try {
      const res = await fetch(`/api/sales/${saleId}/cancel`, {
        method: 'POST',
        headers: { authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        setFeedback({ type: 'success', message: 'Venta cancelada.' });
        await fetchLeads();
      }
    } catch (err) {
      console.warn('Error cancelling sale:', err);
    }
  };

  const openLeadDetail = async (lead) => {
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        headers: { authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedLeadForDetail(data.lead);
        setIsDetailModalOpen(true);
      }
    } catch (err) {
      console.warn('Error fetching lead detail:', err);
    }
  };

  const openSaleModal = (lead, sale = null) => {
    setSelectedLeadForSale(lead);
    setSelectedSaleForCollect(sale);
    setIsSaleModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-border gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Leads & Pipeline Comercial
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            Tablero Kanban accesible, seguimiento de notas, registro de ventas y cobros en tiempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="success" className="text-xs py-1 px-2.5">
            {CURRENT_STAGE.LABEL}
          </Badge>

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

      {feedback && (
        <Alert variant={feedback.type === 'error' ? 'danger' : 'success'} onClose={() => setFeedback(null)}>
          {feedback.message}
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
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    Empresa: {c.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="h-9 px-2.5 text-xs rounded border border-brand-border bg-white text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
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
                className="h-9 px-2.5 text-xs rounded border border-brand-border bg-white text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
              >
                <option value="all">Todos los Vendedores</option>
                {salespeople.map((sp) => (
                  <option key={sp.id} value={sp.id}>
                    {sp.displayName || sp.email}
                  </option>
                ))}
              </select>
            )}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-2.5 text-xs rounded border border-brand-border bg-white text-brand-text-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
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
      ) : leads.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No se encontraron prospectos"
          description="Comenzá dando de alta un nuevo lead de forma manual o importando un lote CSV."
          actionText="Crear Primer Prospecto"
          onAction={() => {
            setEditingLead(null);
            setIsLeadModalOpen(true);
          }}
        />
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD */
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
          {LEAD_STAGES.map((stg, stgIdx) => {
            const columnLeads = leads.filter((l) => l.stage === stg);
            const totalValueMinor = columnLeads.reduce((acc, l) => acc + (l.valueEstimateMinor || 0), 0);
            const stgColor = LEAD_STAGE_COLORS[stg];

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
                    ${(totalValueMinor / 100).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
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
                          ${((lead.valueEstimateMinor || 0) / 100).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
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
                      ${((lead.valueEstimateMinor || 0) / 100).toLocaleString('es-AR', { minimumFractionDigits: 2 })} {lead.currency}
                    </td>
                    <td className="p-3 uppercase font-mono text-[10px] text-brand-text-secondary">
                      {lead.source}
                    </td>
                    <td className="p-3 text-brand-text-secondary">
                      {lead.acquiredAt ? new Date(lead.acquiredAt).toLocaleDateString('es-AR') : '-'}
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
