import { ObjectId } from 'mongodb';

export function validateGoogleAnalysis(data) {
  const errors = [];

  if (!data.clientId || (!ObjectId.isValid(data.clientId) && typeof data.clientId !== 'string')) {
    errors.push('clientId es requerido.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function createGoogleAnalysisDocument(data, createdByUserId) {
  const now = new Date();
  return {
    _id: data._id ? new ObjectId(data._id) : new ObjectId(),
    clientId: typeof data.clientId === 'string' ? new ObjectId(data.clientId) : data.clientId,
    sourceId: data.sourceId ? (typeof data.sourceId === 'string' ? new ObjectId(data.sourceId) : data.sourceId) : null,
    
    // Deterministic Calculated Matrices (Pre-IA)
    deterministicMetrics: {
      reputation: data.deterministicMetrics?.reputation || {},
      seoSummary: data.deterministicMetrics?.seoSummary || {},
      trafficOverview: data.deterministicMetrics?.trafficOverview || {},
      competitiveDiff: data.deterministicMetrics?.competitiveDiff || {},
    },

    // Schema-validated AI Strategic Report
    aiReport: {
      executiveSummary: data.aiReport?.executiveSummary || '',
      overallScore: Number(data.aiReport?.overallScore) || 70,
      pillars: data.aiReport?.pillars || {},
      findings: Array.isArray(data.aiReport?.findings) ? data.aiReport.findings : [],
      quickWins: Array.isArray(data.aiReport?.quickWins) ? data.aiReport.quickWins : [],
      roadmap: {
        days30: Array.isArray(data.aiReport?.roadmap?.days30) ? data.aiReport.roadmap.days30 : [],
        days60: Array.isArray(data.aiReport?.roadmap?.days60) ? data.aiReport.roadmap.days60 : [],
        days90: Array.isArray(data.aiReport?.roadmap?.days90) ? data.aiReport.roadmap.days90 : [],
      },
      disclaimer: 'Diferenciación estricta entre métricas verificadas y recomendaciones estratégicas. No se garantizan rankings ni ventas.',
    },

    aiProvider: data.aiProvider || 'gemini',
    aiModel: data.aiModel || 'gemini-2.0-flash',
    createdAt: now,
    createdBy: createdByUserId ? new ObjectId(createdByUserId) : null,
  };
}
