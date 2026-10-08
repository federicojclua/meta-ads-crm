import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  LifeBuoy,
  Plus,
  Search,
  Kanban,
  Table as TableIcon,
  Phone,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Filter,
  MessageCircle,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { useLanguage } from '../contexts/LanguageContext';
import { formatDate } from '../lib/utils';
import { apiClient } from '../lib/api';
import {
  CASE_TYPES,
  CASE_TYPE_LABELS,
  CASE_STATUSES,
  CASE_STATUS_LABELS,
  CASE_STATUS_COLORS,
  CASE_PRIORITIES,
  CASE_PRIORITY_LABELS,
  CASE_PRIORITY_COLORS,
} from '../lib/constants';

export function CasesPage() {
  const [searchParams] = useSearchParams();
  const initialClientId = searchParams.get('clientId') || '';

  const { userProfile, firebaseUser, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const isGlobal = userProfile && ['super_admin', 'admin'].includes(userProfile.role);

  // Tenant state
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(initialClientId);

  // Data state
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // View & Filters state
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCaseDetail, setSelectedCaseDetail] = useState(null);
  const [resolvingCase, setResolvingCase] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state for creating a new case
  const [newCaseForm, setNewCaseForm] = useState({
    title: '',
    contactName: '',
    contactPhone: '',
    type: 'soporte_tecnico',
    priority: 'media',
    description: '',
  });

  const activeClientId = isGlobal ? selectedClientId : userProfile?.clientId;

  // 1. Fetch Clients (if global admin)
  const fetchClients = useCallback(async () => {
    if (authLoading || !firebaseUser || !isGlobal) return;
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
      console.warn('[CASES] Error fetching clients:', err.message);
    }
  }, [authLoading, firebaseUser, isGlobal, initialClientId, selectedClientId]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // 2. Fetch Cases with Filters
  const fetchCases = useCallback(async () => {
    if (authLoading || !firebaseUser) return;
    setIsLoading(true);
    setFetchError(null);

    try {
      const params = new URLSearchParams();
      if (isGlobal && activeClientId && activeClientId !== 'all') {
        params.append('clientId', activeClientId);
      }
      if (selectedType !== 'all') {
        params.append('type', selectedType);
      }
      if (selectedPriority !== 'all') {
        params.append('priority', selectedPriority);
      }
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const q = params.toString() ? `?${params.toString()}` : '';
      const data = await apiClient.get(`/api/cases${q}`);
      setCases(data.cases || []);
    } catch (err) {
      setFetchError(err.message || 'No se pudieron cargar los casos.');
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, firebaseUser, isGlobal, activeClientId, selectedType, selectedPriority, selectedStatus, searchQuery]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  // 3. Create Case
  const handleCreateCase = async (e) => {
    e.preventDefault();
    if (!newCaseForm.title.trim()) {
      setFeedback({ type: 'error', message: 'El título o motivo del caso es obligatorio.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...newCaseForm,
        clientId: activeClientId,
      };
      const res = await apiClient.post('/api/cases', payload);
      if (res?.case) {
        setCases((prev) => [res.case, ...prev]);
        setIsCreateModalOpen(false);
        setNewCaseForm({
          title: '',
          contactName: '',
          contactPhone: '',
          type: 'soporte_tecnico',
          priority: 'media',
          description: '',
        });
        setFeedback({
          type: 'success',
          message: `Caso ${res.case.caseCode} creado exitosamente con aviso automático al grupo.`,
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error al crear el caso.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Update Status or Open Resolution Modal
  const handleStatusChange = async (caseItem, newStatus) => {
    if (newStatus === 'resuelto') {
      setResolvingCase(caseItem);
      setResolutionNotes('');
      return;
    }

    try {
      const res = await apiClient.patch(`/api/cases/${caseItem.id}`, { status: newStatus });
      if (res?.case) {
        setCases((prev) => prev.map((c) => (c.id === caseItem.id ? res.case : c)));
        if (selectedCaseDetail?.id === caseItem.id) {
          setSelectedCaseDetail(res.case);
        }
        setFeedback({
          type: 'success',
          message: `Caso ${res.case.caseCode} actualizado a "${CASE_STATUS_LABELS[newStatus] || newStatus}".`,
        });
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Error al actualizar el estado.' });
    }
  };

  // 5. Submit Resolution
  const handleSubmitResolution = async (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      alert('Debes documentar cómo se resolvió el caso.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.patch(`/api/cases/${resolvingCase.id}`, {
        status: 'resuelto',
        resolutionNotes: resolutionNotes.trim(),
      });
      if (res?.case) {
        setCases((prev) => prev.map((c) => (c.id === resolvingCase.id ? res.case : c)));
        if (selectedCaseDetail?.id === resolvingCase.id) {
          setSelectedCaseDetail(res.case);
        }
        setResolvingCase(null);
        setResolutionNotes('');
        setFeedback({
          type: 'success',
          message: `Caso ${res.case.caseCode} resuelto y documentado correctamente.`,
        });
      }
    } catch (err) {
      alert(err.message || 'Error al resolver el caso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered cases for view
  const filteredCases = cases.filter((c) => {
    if (selectedType !== 'all' && c.type !== selectedType) return false;
    if (selectedPriority !== 'all' && c.priority !== selectedPriority) return false;
    if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCode = (c.caseCode || '').toLowerCase().includes(q);
      const matchTitle = (c.title || '').toLowerCase().includes(q);
      const matchName = (c.contactName || '').toLowerCase().includes(q);
      const matchPhone = (c.contactPhone || '').toLowerCase().includes(q);
      if (!matchCode && !matchTitle && !matchName && !matchPhone) return false;
    }
    return true;
  });

  // Counters for status
  const countTotal = cases.length;
  const countOpen = cases.filter((c) => c.status === 'abierto').length;
  const countInProgress = cases.filter((c) => c.status === 'en_curso').length;
  const countWaiting = cases.filter((c) => c.status === 'esperando_cliente').length;
  const countResolved = cases.filter((c) => c.status === 'resuelto').length;

  const kanbanColumns = [
    { key: 'abierto', label: 'Abierto', color: 'border-amber-400 bg-amber-50/50' },
    { key: 'en_curso', label: 'En curso', color: 'border-blue-400 bg-blue-50/50' },
    { key: 'esperando_cliente', label: 'Esperando cliente', color: 'border-purple-400 bg-purple-50/50' },
    { key: 'resuelto', label: 'Resuelto', color: 'border-emerald-400 bg-emerald-50/50' },
  ];

  return (
    <div className="space-y-6">
      {/* Feedback Alert */}
      {feedback && (
        <Alert
          variant={feedback.type === 'error' ? 'error' : 'success'}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-brand-text-primary tracking-tight">
                Gestión de Casos & Posventa
              </h1>
              <p className="text-xs text-brand-text-secondary mt-0.5">
                Soporte técnico, insumos de rollos térmicos, cobros Fiserv y bajas de Clover / PosNet.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isGlobal && clients.length > 0 && (
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs border border-brand-border rounded-lg bg-white px-2.5 py-1.5 font-medium text-brand-text-primary"
            >
              {clients.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>
                  {c.name || 'Empresa'}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center border border-brand-border rounded-lg bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
              title="Vista Tablero Kanban"
            >
              <Kanban className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tablero</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-brand-primary text-white shadow-xs'
                  : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
              title="Vista Tabla"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tabla</span>
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchCases}
            disabled={isLoading}
            className="h-8 px-2.5"
            title="Recargar casos"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateModalOpen(true)}
            className="h-8 gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Caso</span>
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-brand-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider block">
            Total Casos
          </span>
          <span className="text-xl font-extrabold text-brand-text-primary mt-1 block">
            {countTotal}
          </span>
        </div>

        <div className="bg-white border border-amber-200/80 rounded-xl p-3.5 shadow-xs bg-linear-to-b from-amber-50/40 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Abiertos
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-xl font-extrabold text-amber-800 mt-1 block">
            {countOpen}
          </span>
        </div>

        <div className="bg-white border border-blue-200/80 rounded-xl p-3.5 shadow-xs bg-linear-to-b from-blue-50/40 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
              En Curso
            </span>
            <Clock className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-xl font-extrabold text-blue-800 mt-1 block">
            {countInProgress}
          </span>
        </div>

        <div className="bg-white border border-purple-200/80 rounded-xl p-3.5 shadow-xs bg-linear-to-b from-purple-50/40 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
              Esperando
            </span>
            <Clock className="w-3.5 h-3.5 text-purple-600" />
          </div>
          <span className="text-xl font-extrabold text-purple-800 mt-1 block">
            {countWaiting}
          </span>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-xl p-3.5 shadow-xs bg-linear-to-b from-emerald-50/40 to-transparent">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
              Resueltos
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <span className="text-xl font-extrabold text-emerald-800 mt-1 block">
            {countResolved}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-brand-border rounded-xl p-3 shadow-xs flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-brand-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por #1001, cliente, teléfono, motivo..."
            className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg pl-9 pr-3 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:bg-white"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-brand-text-secondary font-medium text-[11px]">Tipo:</span>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-1.5 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todos los tipos</option>
            {CASE_TYPES.map((type) => (
              <option key={type} value={type}>
                {CASE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-brand-text-secondary font-medium text-[11px]">Prioridad:</span>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-1.5 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
          >
            <option value="all">Todas las prioridades</option>
            {CASE_PRIORITIES.map((pri) => (
              <option key={pri} value={pri}>
                {CASE_PRIORITY_LABELS[pri]}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter (Table View only) */}
        {viewMode === 'table' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-brand-text-secondary font-medium text-[11px]">Estado:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-1.5 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">Todos los estados</option>
              {CASE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {CASE_STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {isLoading ? (
        <div className="bg-white border border-brand-border rounded-xl p-12 text-center shadow-xs">
          <div className="w-8 h-8 border-2 border-brand-border border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-brand-text-secondary">Cargando casos...</p>
        </div>
      ) : fetchError ? (
        <Alert variant="error">{fetchError}</Alert>
      ) : filteredCases.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No hay casos registrados"
          description={
            searchQuery || selectedType !== 'all' || selectedPriority !== 'all'
              ? 'No se encontraron casos con los filtros aplicados.'
              : 'Registrá un nuevo caso de soporte o posventa para comenzar a dar seguimiento.'
          }
          actionLabel="Crear Primer Caso"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : viewMode === 'kanban' ? (
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {kanbanColumns.map((col) => {
            const columnCases = filteredCases.filter((c) => c.status === col.key);
            return (
              <div
                key={col.key}
                className="bg-white border border-brand-border rounded-xl flex flex-col shadow-xs overflow-hidden"
              >
                {/* Column Header */}
                <div className={`px-3.5 py-2.5 border-b border-brand-border bg-slate-50 flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-brand-text-primary uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-border text-brand-text-secondary">
                      {columnCases.length}
                    </span>
                  </div>
                </div>

                {/* Column Cards Container */}
                <div className="p-3 space-y-3 min-h-[350px] max-h-[70vh] overflow-y-auto bg-[#FBFBFA]/60">
                  {columnCases.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center border-2 border-dashed border-brand-border/60 rounded-lg text-brand-text-secondary text-[11px]">
                      <span>Sin casos</span>
                    </div>
                  ) : (
                    columnCases.map((caseItem) => (
                      <div
                        key={caseItem.id}
                        className="bg-white border border-brand-border rounded-lg p-3 shadow-xs hover:shadow-subtle hover:border-slate-300 transition-all cursor-pointer group"
                        onClick={() => setSelectedCaseDetail(caseItem)}
                      >
                        {/* Top: Code & Priority */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-mono text-xs font-extrabold text-brand-text-primary group-hover:text-emerald-700 transition-colors">
                            {caseItem.caseCode}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                              CASE_PRIORITY_COLORS[caseItem.priority] || 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {CASE_PRIORITY_LABELS[caseItem.priority] || caseItem.priority}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-xs font-bold text-brand-text-primary line-clamp-2 mb-1.5 leading-snug">
                          {caseItem.title}
                        </h4>

                        {/* Type Badge */}
                        <div className="mb-2.5">
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {caseItem.typeLabel || CASE_TYPE_LABELS[caseItem.type] || caseItem.type}
                          </span>
                        </div>

                        {/* Contact details */}
                        {(caseItem.contactName || caseItem.contactPhone) && (
                          <div className="text-[11px] text-slate-600 mb-2.5 border-t border-brand-border/60 pt-2 flex flex-col gap-0.5">
                            {caseItem.contactName && (
                              <span className="font-semibold text-brand-text-primary truncate">
                                {caseItem.contactName}
                              </span>
                            )}
                            {caseItem.contactPhone && (
                              <div className="flex items-center justify-between text-[10px] text-brand-text-secondary">
                                <span className="font-mono">{caseItem.contactPhone}</span>
                                <a
                                  href={`https://wa.me/${caseItem.contactPhone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
                                  title="Abrir chat en WhatsApp"
                                >
                                  <MessageCircle className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Footer: Assignee & Action */}
                        <div className="flex items-center justify-between pt-2 border-t border-brand-border/60 text-[10px] text-brand-text-secondary">
                          <span className="truncate max-w-[100px]" title={caseItem.assignedToName}>
                            👤 {caseItem.assignedToName || 'Sin asignar'}
                          </span>

                          <div onClick={(e) => e.stopPropagation()}>
                            {caseItem.status !== 'resuelto' ? (
                              <button
                                type="button"
                                onClick={() => handleStatusChange(caseItem, 'resuelto')}
                                className="px-2 py-0.5 rounded text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                              >
                                Resolver
                              </button>
                            ) : (
                              <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" />
                                Resuelto
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white border border-brand-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-brand-border text-[11px] font-bold text-brand-text-secondary uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Asunto / Motivo</th>
                  <th className="px-4 py-3">Prioridad</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Responsable</th>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {filteredCases.map((caseItem) => (
                  <tr
                    key={caseItem.id}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    onClick={() => setSelectedCaseDetail(caseItem)}
                  >
                    <td className="px-4 py-3 font-mono font-extrabold text-brand-text-primary">
                      {caseItem.caseCode}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-brand-text-primary">
                        {caseItem.contactName || 'Sin nombre'}
                      </div>
                      <div className="text-[11px] text-brand-text-secondary font-mono">
                        {caseItem.contactPhone || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {caseItem.typeLabel || CASE_TYPE_LABELS[caseItem.type] || caseItem.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 max-w-[240px]">
                      <span className="font-medium text-brand-text-primary block truncate">
                        {caseItem.title}
                      </span>
                      {caseItem.description && (
                        <span className="text-[11px] text-brand-text-secondary block truncate">
                          {caseItem.description}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                          CASE_PRIORITY_COLORS[caseItem.priority] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {CASE_PRIORITY_LABELS[caseItem.priority] || caseItem.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                          CASE_STATUS_COLORS[caseItem.status]?.badge || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {CASE_STATUS_LABELS[caseItem.status] || caseItem.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {caseItem.assignedToName || 'Sin asignar'}
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-[11px]">
                      {caseItem.createdAt ? formatDate(caseItem.createdAt) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {caseItem.status !== 'resuelto' ? (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(caseItem, 'resuelto')}
                            className="px-2 py-1 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
                          >
                            Resolver
                          </button>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-bold px-2 py-0.5 bg-emerald-50 rounded">
                            Resuelto
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCaseDetail(caseItem)}
                          className="h-7 w-7 p-0"
                          title="Ver detalle"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: NUEVO CASO                                                      */}
      {/* ========================================================================= */}
      {isCreateModalOpen && (
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Crear Nuevo Caso de Soporte / Posventa"
          description="Al crearse se notificará automáticamente con aviso prioritario al grupo operativo de WhatsApp."
        >
          <form onSubmit={handleCreateCase} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-brand-text-primary mb-1">
                Motivo / Asunto del Caso *
              </label>
              <Input
                value={newCaseForm.title}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                placeholder="Ej: Terminal Clover no enciende / Pedido de 10 rollos térmicos"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">
                  Tipo de Caso *
                </label>
                <select
                  value={newCaseForm.type}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, type: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-2 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {CASE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {CASE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">
                  Prioridad *
                </label>
                <select
                  value={newCaseForm.priority}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, priority: e.target.value })}
                  className="w-full text-xs bg-slate-50 border border-brand-border rounded-lg px-2.5 py-2 font-medium text-brand-text-primary focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  {CASE_PRIORITIES.map((pri) => (
                    <option key={pri} value={pri}>
                      {CASE_PRIORITY_LABELS[pri]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-brand-text-primary mb-1">
                  Nombre del Cliente / Comercio
                </label>
                <Input
                  value={newCaseForm.contactName}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, contactName: e.target.value })}
                  placeholder="Ej: Farmacia San Martín / Juan Pérez"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-text-primary mb-1">
                  Teléfono / WhatsApp
                </label>
                <Input
                  value={newCaseForm.contactPhone}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, contactPhone: e.target.value })}
                  placeholder="Ej: +54 9 381 555-1234"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">
                Descripción detallada del pedido o falla
              </label>
              <textarea
                value={newCaseForm.description}
                onChange={(e) => setNewCaseForm({ ...newCaseForm, description: e.target.value })}
                placeholder="Ingresá los detalles del equipo, serie, mensaje de error o solicitud de insumos..."
                rows={3}
                className="w-full text-xs p-2.5 bg-slate-50 border border-brand-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !newCaseForm.title.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                {isSubmitting ? 'Registrando...' : 'Crear y Notificar Caso'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RESOLVER CASO (NOTAS OBLIGATORIAS)                              */}
      {/* ========================================================================= */}
      {resolvingCase && (
        <Modal
          isOpen={Boolean(resolvingCase)}
          onClose={() => setResolvingCase(null)}
          title={`Resolver Caso ${resolvingCase.caseCode}`}
          description="Documentá la solución técnica o administrativa aplicada antes de cerrar el ticket."
        >
          <form onSubmit={handleSubmitResolution} className="space-y-4 text-xs">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <span className="font-bold text-emerald-900 block">{resolvingCase.title}</span>
              <span className="text-[11px] text-emerald-800 block mt-0.5">
                Cliente: {resolvingCase.contactName || resolvingCase.contactPhone || 'No especificado'}
              </span>
            </div>

            <div>
              <label className="block font-bold text-brand-text-primary mb-1">
                Notas de Resolución * (Obligatorio)
              </label>
              <textarea
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Ej: Se entregó pack de 10 rollos en el local / Se reinició la terminal Clover y volvió a operar / Se gestionó la acreditación pendiente con Fiserv."
                rows={4}
                required
                className="w-full text-xs p-2.5 bg-slate-50 border border-brand-border rounded-lg focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-brand-text-secondary mt-1">
                Estas notas quedarán registradas en la auditoría y cronología del caso.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-brand-border">
              <Button type="button" variant="outline" onClick={() => setResolvingCase(null)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !resolutionNotes.trim()}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
              >
                {isSubmitting ? 'Guardando...' : 'Confirmar Resolución'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: DETALLE COMPLETO Y CRONOLOGÍA DEL CASO                          */}
      {/* ========================================================================= */}
      {selectedCaseDetail && (
        <Modal
          isOpen={Boolean(selectedCaseDetail)}
          onClose={() => setSelectedCaseDetail(null)}
          title={`Detalle del Caso ${selectedCaseDetail.caseCode}`}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Header badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-brand-border rounded-lg">
              <div>
                <span className="font-bold text-sm text-brand-text-primary block">
                  {selectedCaseDetail.title}
                </span>
                <span className="text-[11px] text-brand-text-secondary">
                  Creado el {formatDate(selectedCaseDetail.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    CASE_PRIORITY_COLORS[selectedCaseDetail.priority]
                  }`}
                >
                  {CASE_PRIORITY_LABELS[selectedCaseDetail.priority]}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    CASE_STATUS_COLORS[selectedCaseDetail.status]?.badge
                  }`}
                >
                  {CASE_STATUS_LABELS[selectedCaseDetail.status]}
                </span>
              </div>
            </div>

            {/* Quick status dropdown */}
            <div className="flex items-center justify-between p-3 border border-brand-border rounded-lg">
              <span className="font-bold text-brand-text-primary">Cambiar Estado del Ticket:</span>
              <select
                value={selectedCaseDetail.status}
                onChange={(e) => handleStatusChange(selectedCaseDetail, e.target.value)}
                className="text-xs bg-white border border-brand-border rounded-md px-2.5 py-1 font-semibold text-brand-text-primary"
              >
                {CASE_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {CASE_STATUS_LABELS[st]}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact & Type Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-brand-border rounded-lg">
              <div>
                <span className="text-[10px] font-bold uppercase text-brand-text-secondary block">
                  Cliente / Contacto
                </span>
                <p className="font-semibold text-brand-text-primary mt-0.5">
                  {selectedCaseDetail.contactName || 'No especificado'}
                </p>
                {selectedCaseDetail.contactPhone && (
                  <p className="font-mono text-slate-600 mt-0.5">
                    {selectedCaseDetail.contactPhone}
                  </p>
                )}
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase text-brand-text-secondary block">
                  Tipo de Caso & Responsable
                </span>
                <p className="font-semibold text-brand-text-primary mt-0.5">
                  {selectedCaseDetail.typeLabel || selectedCaseDetail.type}
                </p>
                <p className="text-slate-600 mt-0.5">
                  Asignado a: {selectedCaseDetail.assignedToName || 'Sin asignar'}
                </p>
              </div>
            </div>

            {/* Description */}
            {selectedCaseDetail.description && (
              <div className="p-3 border border-brand-border rounded-lg">
                <span className="text-[10px] font-bold uppercase text-brand-text-secondary block mb-1">
                  Descripción o Fallas Reportadas
                </span>
                <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">
                  {selectedCaseDetail.description}
                </p>
              </div>
            )}

            {/* Resolution Notes (if resolved) */}
            {selectedCaseDetail.resolutionNotes && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <span className="text-[10px] font-bold uppercase text-emerald-900 block mb-1">
                  Notas de Resolución ({selectedCaseDetail.resolvedBy || 'Asesor'})
                </span>
                <p className="whitespace-pre-wrap text-emerald-800 leading-relaxed font-medium">
                  {selectedCaseDetail.resolutionNotes}
                </p>
                {selectedCaseDetail.resolvedAt && (
                  <span className="text-[10px] text-emerald-700 block mt-1">
                    Resuelto el {formatDate(selectedCaseDetail.resolvedAt)}
                  </span>
                )}
              </div>
            )}

            {/* Timeline / Activities */}
            <div className="border border-brand-border rounded-lg p-3">
              <span className="text-[10px] font-bold uppercase text-brand-text-secondary block mb-2">
                Cronología de Eventos & Auditoría
              </span>
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {(selectedCaseDetail.activities || []).map((act, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] border-b border-brand-border/40 pb-1.5 last:border-b-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-brand-text-primary font-medium block">
                        {act.description}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {act.performedBy?.displayName || 'Sistema'} · {formatDate(act.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-brand-border">
              <Button type="button" onClick={() => setSelectedCaseDetail(null)}>
                Cerrar Detalle
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default CasesPage;
