import { ObjectId } from 'mongodb';

export function validateGoogleCompetitor(data) {
  const errors = [];

  if (!data.clientId || (!ObjectId.isValid(data.clientId) && typeof data.clientId !== 'string')) {
    errors.push('clientId es requerido.');
  }

  if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
    errors.push('El nombre del competidor es requerido.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function createGoogleCompetitorDocument(data, createdByUserId) {
  const now = new Date();
  return {
    _id: data._id ? new ObjectId(data._id) : new ObjectId(),
    clientId: typeof data.clientId === 'string' ? new ObjectId(data.clientId) : data.clientId,
    name: data.name.trim(),
    category: data.category?.trim() || 'General',
    city: data.city?.trim() || '',
    address: data.address?.trim() || '',
    rating: Number(data.rating) || 0,
    userRatingsTotal: Number(data.userRatingsTotal) || 0,
    websiteUrl: data.websiteUrl?.trim() || '',
    phone: data.phone?.trim() || '',
    businessStatus: data.businessStatus || 'OPERATIONAL',
    priceLevel: data.priceLevel || null,
    
    // Competitive Differential Notes
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    weaknesses: Array.isArray(data.weaknesses) ? data.weaknesses : [],
    
    source: data.source || 'manual', // 'google_places_api' | 'manual'
    confidenceScore: Number(data.confidenceScore) || 90,
    capturedAt: data.capturedAt ? new Date(data.capturedAt) : now,
    createdAt: now,
    updatedAt: now,
    createdBy: createdByUserId ? new ObjectId(createdByUserId) : null,
  };
}
