export const ALERT_TYPES = [
  'CPL_ANOMALY',
  'ROAS_DROP',
  'LEAD_DROP',
  'CREATIVE_FATIGUE',
  'SLA_LEAK',
];

export const ALERT_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'INFO'];
export const ALERT_STATUSES = ['TRIGGERED', 'EXECUTING', 'RESOLVED', 'DISMISSED'];

/**
 * Sanitizes a SystemAlert document.
 */
export function sanitizeSystemAlert(doc = {}) {
  const target = doc.target || {};
  const metrics = doc.metricsSnapshot || {};
  const aiDecision = doc.aiDecision || {};

  return {
    id: doc._id?.toString() || doc.id || '',
    clientId: doc.clientId?.toString() || '',
    alertType: ALERT_TYPES.includes(doc.alertType) ? doc.alertType : 'CPL_ANOMALY',
    severity: ALERT_SEVERITIES.includes(doc.severity) ? doc.severity : 'HIGH',
    title: doc.title || 'Anomalía Detectada en Campaña',
    target: {
      campaignId: target.campaignId?.toString() || '',
      adId: target.adId?.toString() || '',
      assetId: target.assetId?.toString() || '',
      entityName: target.entityName || 'Campaña Activa',
    },
    metricsSnapshot: {
      currentVal: Number(metrics.currentVal) || 0,
      benchmarkVal: Number(metrics.benchmarkVal) || 0,
      deltaPct: Number(metrics.deltaPct) || 0,
      frequency: Number(metrics.frequency) || 1.0,
      spend: Number(metrics.spend) || 0,
    },
    aiDecision: {
      diagnosis: aiDecision.diagnosis || 'Se detectó una desviación respecto al benchmark del cliente.',
      evidence: aiDecision.evidence || 'El costo por lead aumentó un 40% en las últimas 48 horas.',
      recommendation: aiDecision.recommendation || 'Pausar el anuncio afectado y lanzar nuevas variantes.',
      proposedAction: {
        actionType: aiDecision.proposedAction?.actionType || 'PAUSE_AD',
        buttonLabel: aiDecision.proposedAction?.buttonLabel || 'Pausar Anuncio Fatigado',
        targetId: aiDecision.proposedAction?.targetId || target.adId || 'ad_01',
        payload: aiDecision.proposedAction?.payload || {},
      },
    },
    status: ALERT_STATUSES.includes(doc.status) ? doc.status : 'TRIGGERED',
    triggeredAt: doc.triggeredAt || new Date().toISOString(),
    resolvedAt: doc.resolvedAt || null,
    createdAt: doc.createdAt || new Date().toISOString(),
    updatedAt: doc.updatedAt || new Date().toISOString(),
  };
}
