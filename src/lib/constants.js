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
  'whatsapp',
  'meta_ads',
  'web',
];

export const LEAD_SOURCE_LABELS = {
  manual: 'Manual',
  csv: 'Importación CSV',
  whatsapp: 'WhatsApp Bot',
  meta_ads: 'Meta Ads',
  web: 'Web / Landing',
};

export const LOST_REASON_PRESETS = [
  { id: 'precio', label: 'Precio / Costo del equipo elevado' },
  { id: 'competencia', label: 'Eligió a la competencia (PosNet / Payway / MP)' },
  { id: 'comisiones', label: 'Comisiones por cobro altas' },
  { id: 'sin_monotributo', label: 'Sin actividad fiscal / monotributo formal' },
  { id: 'no_responde', label: 'No responde mensajes / Teléfono inválido' },
  { id: 'fuera_zona', label: 'Fuera de zona de cobertura (solo Tucumán)' },
  { id: 'otro', label: 'Otro motivo' },
];

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

export const CASE_TYPES = [
  'soporte_tecnico',
  'insumos_rollos',
  'cobros_liquidaciones',
  'bajas',
  'otro',
];

export const CASE_TYPE_LABELS = {
  soporte_tecnico: 'Soporte técnico',
  insumos_rollos: 'Insumos y rollos',
  cobros_liquidaciones: 'Cobros y liquidaciones',
  bajas: 'Bajas y cambios',
  otro: 'Otro',
};

export const CASE_STATUSES = [
  'abierto',
  'en_curso',
  'esperando_cliente',
  'resuelto',
  'cancelado',
];

export const CASE_STATUS_LABELS = {
  abierto: 'Abierto',
  en_curso: 'En curso',
  esperando_cliente: 'Esperando cliente',
  resuelto: 'Resuelto',
  cancelado: 'Cancelado',
};

export const CASE_STATUS_COLORS = {
  abierto: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  en_curso: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
  esperando_cliente: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-800', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
  resuelto: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  cancelado: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-600 border-gray-200' },
};

export const CASE_PRIORITIES = ['baja', 'media', 'alta', 'urgente'];

export const CASE_PRIORITY_LABELS = {
  baja: 'Baja',
  media: 'Media',
  alta: 'Alta',
  urgente: 'Urgente',
};

export const CASE_PRIORITY_COLORS = {
  baja: 'bg-slate-100 text-slate-700 border-slate-200',
  media: 'bg-blue-100 text-blue-700 border-blue-200',
  alta: 'bg-amber-100 text-amber-800 border-amber-200',
  urgente: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
};

export const CONVERSATION_STATUSES = ['abierta', 'en_curso', 'esperando', 'resuelta'];

export const CONVERSATION_STATUS_LABELS = {
  abierta: 'Abierta',
  en_curso: 'En curso',
  esperando: 'Esperando cliente',
  resuelta: 'Resuelta',
};

export const CONVERSATION_STATUS_COLORS = {
  abierta: { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-800 border-sky-200' },
  en_curso: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  esperando: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
  resuelta: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const CHANNELS = ['whatsapp', 'instagram', 'facebook', 'telegram', 'tiktok', 'twitter'];

export const CHANNEL_LABELS = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram Direct',
  facebook: 'Facebook Messenger',
  telegram: 'Telegram',
  tiktok: 'TikTok DM',
  twitter: 'X / Twitter DM',
};

export const CHANNEL_COLORS = {
  whatsapp: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' },
  instagram: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', badge: 'bg-pink-100 text-pink-800' },
  facebook: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  telegram: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', badge: 'bg-sky-100 text-sky-800' },
  tiktok: { bg: 'bg-slate-900', text: 'text-white', border: 'border-slate-800', badge: 'bg-slate-900 text-white' },
  twitter: { bg: 'bg-neutral-800', text: 'text-neutral-100', border: 'border-neutral-700', badge: 'bg-neutral-800 text-white' },
};


