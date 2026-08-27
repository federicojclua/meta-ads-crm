import { ObjectId } from 'mongodb';

/**
 * Validates GoogleReview document.
 */
export function validateGoogleReview(data) {
  const errors = [];

  if (!data.clientId || (!ObjectId.isValid(data.clientId) && typeof data.clientId !== 'string')) {
    errors.push('clientId es requerido.');
  }

  if (data.rating === undefined || data.rating === null || data.rating < 1 || data.rating > 5) {
    errors.push('El rating debe ser un número entero entre 1 y 5.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Creates a normalized GoogleReview document.
 */
export function createGoogleReviewDocument(data, createdByUserId) {
  const now = new Date();
  const reviewDate = data.reviewDate ? new Date(data.reviewDate) : now;
  const replyDate = data.replyDate ? new Date(data.replyDate) : null;
  
  let responseTimeHours = null;
  if (replyDate && replyDate >= reviewDate) {
    responseTimeHours = Math.round((replyDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60));
  }

  return {
    _id: data._id ? new ObjectId(data._id) : new ObjectId(),
    clientId: typeof data.clientId === 'string' ? new ObjectId(data.clientId) : data.clientId,
    sourceId: data.sourceId ? (typeof data.sourceId === 'string' ? new ObjectId(data.sourceId) : data.sourceId) : null,
    externalReviewId: data.externalReviewId || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    reviewerName: data.reviewerName?.trim() || 'Cliente Anónimo',
    rating: Number(data.rating) || 5,
    comment: data.comment?.trim() || '',
    reviewDate: reviewDate,
    
    // Official Business Reply
    replyText: data.replyText?.trim() || '',
    replyDate: replyDate,
    replyStatus: data.replyText ? 'replied' : 'unanswered',
    responseTimeHours: responseTimeHours,

    // AI Suggestions (Draft only)
    aiSuggestedReply: data.aiSuggestedReply || '',
    
    // Metadata tags
    sentiment: data.sentiment || (data.rating >= 4 ? 'positive' : data.rating === 3 ? 'neutral' : 'negative'),
    topics: Array.isArray(data.topics) ? data.topics : [],
    
    createdAt: now,
    updatedAt: now,
    createdBy: createdByUserId ? new ObjectId(createdByUserId) : null,
  };
}
