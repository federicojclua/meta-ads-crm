/**
 * Anima MKT CRM — User Model Schema & Roles Definition
 */

export const ROLES = ['super_admin', 'admin', 'client', 'salesperson'];
export const USER_STATUSES = ['active', 'suspended', 'pending_invite'];

export const DEFAULT_PERMISSIONS = {
  super_admin: {
    canExport: true,
    canDeleteLeads: true,
    canViewFinancials: true,
  },
  admin: {
    canExport: true,
    canDeleteLeads: false,
    canViewFinancials: true,
  },
  client: {
    canExport: true,
    canDeleteLeads: false,
    canViewFinancials: true,
  },
  salesperson: {
    canExport: false,
    canDeleteLeads: false,
    canViewFinancials: false,
  },
};

export function validateUserDocument(user) {
  const errors = [];

  if (!user.email || typeof user.email !== 'string') {
    errors.push('El campo email es obligatorio.');
  }

  if (!user.normalizedEmail || typeof user.normalizedEmail !== 'string') {
    errors.push('El campo normalizedEmail es obligatorio.');
  }

  if (!user.role || !ROLES.includes(user.role)) {
    errors.push(`Rol inválido. Debe ser uno de: ${ROLES.join(', ')}`);
  }

  if (!user.status || !USER_STATUSES.includes(user.status)) {
    errors.push(`Estado inválido. Debe ser uno de: ${USER_STATUSES.join(', ')}`);
  }

  if (user.clientIds && !Array.isArray(user.clientIds)) {
    errors.push('clientIds debe ser un array.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
