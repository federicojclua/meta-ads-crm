export const AI_ACTION_STATUSES = ['executed', 'pending_approval', 'rejected', 'failed'];

/**
 * Sanitizes an AIActionLog document for forensic audit inspection.
 */
export function sanitizeAIActionLog(doc = {}) {
  return {
    id: doc._id?.toString() || doc.id || '',
    agentId: doc.agentId || 'agent_qualifier_01',
    agentRole: doc.agentRole || 'qualifier',
    toolName: doc.toolName || 'classify_lead',
    action: doc.action || 'Clasificación automática de prospecto',
    inputData: doc.inputData || {},
    reasoning: doc.reasoning || 'Lead consultó por notebooks en 12 cuotas con presupuesto calificado.',
    clientId: doc.clientId?.toString() || '',
    userId: doc.userId?.toString() || null,
    status: AI_ACTION_STATUSES.includes(doc.status) ? doc.status : 'executed',
    approverUserId: doc.approverUserId?.toString() || null,
    approvedAt: doc.approvedAt || null,
    rejectedReason: doc.rejectedReason || null,
    result: doc.result || null,
    error: doc.error || null,
    timestamp: doc.timestamp || doc.createdAt || new Date().toISOString(),
  };
}
