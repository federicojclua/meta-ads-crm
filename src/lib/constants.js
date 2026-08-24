export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  CLIENT: 'client',
  SALESPERSON: 'salesperson',
};

export const USER_STATUS = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  PENDING_INVITE: 'pending_invite',
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'SUPER ADMINISTRADOR',
  [ROLES.ADMIN]: 'ADMINISTRADOR',
  [ROLES.CLIENT]: 'CLIENTE',
  [ROLES.SALESPERSON]: 'VENDEDOR',
};

export const CURRENT_STAGE = {
  NUMBER: 5,
  LABEL: 'FASE 5A',
  SHORT_LABEL: 'Fase 5A',
  NAME: 'Leads, Pipeline Comercial, Ventas e Ingresos Cobrados',
  DESCRIPTION: 'Alta manual y CSV de prospectos, tablero Kanban accesible, registro de ventas en centavos, seguimiento de cobros parciales/totales y KPIs en tiempo real.',
  NEXT_STAGE_NAME: 'Integración Meta Ads, Sincronización de Campañas y ROAS Real',
};

export const LEAD_STAGE_KEYS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  WON: 'won',
  LOST: 'lost',
};

export const LEAD_STAGES = [
  'new',
  'contacted',
  'qualified',
  'won',
  'lost',
];

export const LEAD_STAGE_LABELS = {
  new: 'Nuevo',
  contacted: 'Contactado',
  qualified: 'Calificado',
  won: 'Ganado',
  lost: 'Perdido',
};

export const LEAD_STAGE_COLORS = {
  new: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800' },
  contacted: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800' },
  qualified: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800' },
  won: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800' },
  lost: { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-800' },
};

export const LEAD_SOURCES = [
  'manual',
  'csv',
];

export const LEAD_SOURCE_LABELS = {
  manual: 'Manual',
  csv: 'Importación CSV',
};

export const SALE_STATUSES = [
  'pending',
  'partial',
  'collected',
  'cancelled',
];

export const SALE_STATUS_LABELS = {
  pending: 'Pendiente de Cobro',
  partial: 'Cobro Parcial',
  collected: 'Cobrado',
  cancelled: 'Cancelada',
};

export const SALE_STATUS_COLORS = {
  pending: 'bg-amber-100 text-amber-800 border-amber-200',
  partial: 'bg-blue-100 text-blue-800 border-blue-200',
  collected: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200 line-through',
};

export const ACTIVITY_TYPES = [
  'stage_change',
  'assignment',
  'note',
  'sale_created',
  'sale_updated',
  'payment_collected',
  'status_change',
  'system',
];

export const ACTIVITY_TYPE_LABELS = {
  stage_change: 'Cambio de Etapa',
  assignment: 'Asignación Comercial',
  note: 'Nota Comercial',
  sale_created: 'Venta Registrada',
  sale_updated: 'Venta Modificada',
  payment_collected: 'Cobro Confirmado',
  status_change: 'Cambio de Estado',
  system: 'Evento del Sistema',
};
