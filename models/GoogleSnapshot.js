import { ObjectId } from 'mongodb';

export function validateGoogleSnapshot(data) {
  const errors = [];

  if (!data.clientId || (!ObjectId.isValid(data.clientId) && typeof data.clientId !== 'string')) {
    errors.push('clientId es requerido.');
  }

  const validTypes = ['business_profile', 'search_console', 'ga4', 'google_ads'];
  if (!data.type || !validTypes.includes(data.type)) {
    errors.push(`type debe ser uno de: ${validTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function createGoogleSnapshotDocument(data, createdByUserId) {
  const now = new Date();
  return {
    _id: data._id ? new ObjectId(data._id) : new ObjectId(),
    clientId: typeof data.clientId === 'string' ? new ObjectId(data.clientId) : data.clientId,
    sourceId: data.sourceId ? (typeof data.sourceId === 'string' ? new ObjectId(data.sourceId) : data.sourceId) : null,
    type: data.type, // 'business_profile' | 'search_console' | 'ga4' | 'google_ads'
    startDate: data.startDate ? new Date(data.startDate) : new Date(now.getTime() - 30 * 86400000),
    endDate: data.endDate ? new Date(data.endDate) : now,
    
    // Type-specific metric payload
    data: data.data || {},
    
    source: data.source || 'manual', // 'api' | 'manual'
    createdAt: now,
    createdBy: createdByUserId ? new ObjectId(createdByUserId) : null,
  };
}
