/**
 * Anima MKT CRM — User Model Schema & Validation
 */

export const ROLES = ['super_admin', 'admin', 'client', 'salesperson'];
export const USER_STATUSES = ['active', 'suspended', 'invited', 'pending_invite'];

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

  // Tenant scoping rules
  if (['client', 'salesperson'].includes(user.role)) {
    if (!user.clientId && (!user.clientIds || user.clientIds.length === 0)) {
      errors.push('Los usuarios con rol client o salesperson deben tener un clientId asignado.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function sanitizeUserResponse(user) {
  if (!user) return null;
  return {
    _id: user._id ? user._id.toString() : undefined,
    firebaseUid: user.firebaseUid || null,
    email: user.email,
    normalizedEmail: user.normalizedEmail,
    displayName: user.displayName || user.email?.split('@')[0],
    photoURL: user.photoURL || null,
    role: user.role,
    status: user.status,
    clientId: user.clientId ? user.clientId.toString() : (user.clientIds?.[0] ? user.clientIds[0].toString() : null),
    clientIds: user.clientIds ? user.clientIds.map((id) => id.toString()) : (user.clientId ? [user.clientId.toString()] : []),
    permissions: user.permissions || DEFAULT_PERMISSIONS[user.role] || {},
    invitedBy: user.invitedBy ? user.invitedBy.toString() : null,
    invitedAt: user.invitedAt ? new Date(user.invitedAt).toISOString() : null,
    activatedAt: user.activatedAt ? new Date(user.activatedAt).toISOString() : null,
    lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt).toISOString() : null,
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
    updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null,
  };
}
