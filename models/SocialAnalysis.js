import { ObjectId } from 'mongodb';

export function validateSocialAnalysis(data) {
  const errors = [];

  if (!data.clientId) {
    errors.push('El campo clientId es obligatorio.');
  }

  if (!data.sourceId) {
    errors.push('El campo sourceId es obligatorio.');
  }

  if (!data.snapshotId) {
    errors.push('El campo snapshotId es obligatorio.');
  }

  if (!data.deterministicMetrics) {
    errors.push('Las métricas deterministas calculadas son obligatorias.');
  }

  if (!data.aiReport) {
    errors.push('El reporte de análisis de IA es obligatorio.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function createSocialAnalysisDocument(data, creatorUserId = null) {
  const now = new Date();

  return {
    clientId: typeof data.clientId === 'string' ? new ObjectId(data.clientId) : data.clientId,
    sourceId: typeof data.sourceId === 'string' ? new ObjectId(data.sourceId) : data.sourceId,
    snapshotId: typeof data.snapshotId === 'string' ? new ObjectId(data.snapshotId) : data.snapshotId,
    platform: data.platform || 'instagram',
    accountUsername: data.accountUsername || '',
    deterministicMetrics: data.deterministicMetrics || {},
    aiReport: data.aiReport || {},
    aiProvider: data.aiProvider || 'gemini',
    aiModel: data.aiModel || 'gemini-2.0-flash',
    tokenUsage: {
      promptTokens: data.tokenUsage?.promptTokens || 0,
      completionTokens: data.tokenUsage?.completionTokens || 0,
      totalTokens: data.tokenUsage?.totalTokens || 0,
    },
    status: 'completed',
    createdBy: creatorUserId ? (typeof creatorUserId === 'string' ? new ObjectId(creatorUserId) : creatorUserId) : null,
    createdAt: now,
  };
}
