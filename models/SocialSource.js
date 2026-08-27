import { ObjectId } from 'mongodb';

export const SOCIAL_PLATFORMS = ['instagram', 'facebook'];
export const SOCIAL_SOURCE_TYPES = ['api_oauth', 'manual'];
export const SOCIAL_SOURCE_STATUSES = ['active', 'disconnected', 'error'];

export function validateSocialSource(data) {
  const errors = [];

  if (!data.clientId) {
    errors.push('El campo clientId es obligatorio.');
  }

  if (!data.platform || !SOCIAL_PLATFORMS.includes(data.platform)) {
    errors.push(`Plataforma inválida. Debe ser una de: ${SOCIAL_PLATFORMS.join(', ')}.`);
  }

  if (!data.sourceType || !SOCIAL_SOURCE_TYPES.includes(data.sourceType)) {
    errors.push(`Tipo de fuente inválido. Debe ser uno de: ${SOCIAL_SOURCE_TYPES.join(', ')}.`);
  }

  if (!data.accountUsername || typeof data.accountUsername !== 'string' || !data.accountUsername.trim()) {
    errors.push('El nombre de usuario (accountUsername) es obligatorio.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function createSocialSourceDocument(data, creatorUserId = null) {
  const now = new Date();

  return {
    clientId: typeof data.clientId === 'string' ? new ObjectId(data.clientId) : data.clientId,
    platform: data.platform,
    sourceType: data.sourceType || 'manual',
    externalAccountId: data.externalAccountId ? String(data.externalAccountId) : null,
    accountUsername: String(data.accountUsername).trim().replace(/^@/, ''),
    accountName: data.accountName ? String(data.accountName).trim() : String(data.accountUsername).trim(),
    biography: data.biography ? String(data.biography).slice(0, 500) : '',
    website: data.website ? String(data.website).slice(0, 255) : '',
    profilePictureUrl: data.profilePictureUrl ? String(data.profilePictureUrl) : null,
    followersCount: Number.isFinite(data.followersCount) ? Math.max(0, parseInt(data.followersCount, 10)) : 0,
    followsCount: Number.isFinite(data.followsCount) ? Math.max(0, parseInt(data.followsCount, 10)) : 0,
    mediaCount: Number.isFinite(data.mediaCount) ? Math.max(0, parseInt(data.mediaCount, 10)) : 0,
    status: data.status || 'active',
    encryptedAccessToken: data.encryptedAccessToken || null,
    tokenExpiresAt: data.tokenExpiresAt ? new Date(data.tokenExpiresAt) : null,
    lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
    createdBy: creatorUserId ? (typeof creatorUserId === 'string' ? new ObjectId(creatorUserId) : creatorUserId) : null,
    createdAt: now,
    updatedAt: now,
  };
}
