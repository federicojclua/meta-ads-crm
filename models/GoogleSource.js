import { ObjectId } from 'mongodb';

/**
 * Validates GoogleSource payload before database persistence.
 */
export function validateGoogleSource(data) {
  const errors = [];

  if (!data.clientId || (!ObjectId.isValid(data.clientId) && typeof data.clientId !== 'string')) {
    errors.push('clientId es requerido y debe ser un ObjectId o string válido.');
  }

  const validSourceTypes = ['api_oauth', 'manual'];
  if (data.sourceType && !validSourceTypes.includes(data.sourceType)) {
    errors.push(`sourceType inválido. Debe ser uno de: ${validSourceTypes.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Generates a normalized GoogleSource document.
 */
export function createGoogleSourceDocument(data, createdByUserId) {
  const now = new Date();
  return {
    _id: data._id ? new ObjectId(data._id) : new ObjectId(),
    clientId: typeof data.clientId === 'string' ? new ObjectId(data.clientId) : data.clientId,
    sourceType: data.sourceType || 'manual',
    businessName: data.businessName?.trim() || '',
    websiteUrl: data.websiteUrl?.trim() || '',
    address: data.address?.trim() || '',
    phone: data.phone?.trim() || '',
    category: data.category?.trim() || 'General',
    city: data.city?.trim() || '',
    
    // Connected Google Services Identifiers (Authorized)
    googleBusinessProfile: {
      locationId: data.googleBusinessProfile?.locationId || '',
      verified: !!data.googleBusinessProfile?.verified,
      rating: Number(data.googleBusinessProfile?.rating) || 0,
      userRatingsTotal: Number(data.googleBusinessProfile?.userRatingsTotal) || 0,
      openingHours: data.googleBusinessProfile?.openingHours || {},
      connectedAt: data.googleBusinessProfile?.connectedAt ? new Date(data.googleBusinessProfile.connectedAt) : null,
    },
    searchConsole: {
      siteUrl: data.searchConsole?.siteUrl || '',
      connectedAt: data.searchConsole?.connectedAt ? new Date(data.searchConsole.connectedAt) : null,
    },
    googleAnalytics4: {
      propertyId: data.googleAnalytics4?.propertyId || '',
      connectedAt: data.googleAnalytics4?.connectedAt ? new Date(data.googleAnalytics4.connectedAt) : null,
    },
    googleAds: {
      customerId: data.googleAds?.customerId || '',
      connectedAt: data.googleAds?.connectedAt ? new Date(data.googleAds.connectedAt) : null,
    },

    status: data.status || 'active',
    lastSyncedAt: data.lastSyncedAt ? new Date(data.lastSyncedAt) : null,
    createdBy: createdByUserId ? new ObjectId(createdByUserId) : null,
    createdAt: now,
    updatedAt: now,
  };
}
