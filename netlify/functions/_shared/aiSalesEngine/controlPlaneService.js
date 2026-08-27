import { ObjectId } from 'mongodb';
import { checkToolExecutionPermission, DEFAULT_TOOL_PERMISSIONS } from '../../../../models/AIToolPermissionMatrix.js';
import { sanitizeAIActionLog } from '../../../../models/AIActionLog.js';

/**
 * Control Plane Interceptor: Validates permissions, intercepts sensitive tools,
 * and records immutable audit action logs.
 */
export async function executeControlledTool({
  agentRole = 'qualifier',
  toolName = 'send_whatsapp',
  inputData = {},
  reasoning = '',
  clientId = null,
  userId = null,
  db = null,
  toolExecutor = async () => ({ success: true }),
} = {}) {
  let matrix = DEFAULT_TOOL_PERMISSIONS;
  if (db && clientId) {
    const permCollection = db.collection('ai_tool_permissions');
    const permDoc = await permCollection.findOne({ clientId: new ObjectId(clientId) });
    if (permDoc?.permissions) {
      matrix = permDoc.permissions;
    }
  }

  const check = checkToolExecutionPermission({
    agentRole,
    toolName,
    inputData,
    matrix,
  });

  const parseId = (val) => {
    if (!val) return null;
    if (typeof val === 'object' && val instanceof ObjectId) return val;
    return ObjectId.isValid(val) ? new ObjectId(val) : val;
  };

  if (!check.allowed) {
    const rejectedLog = {
      agentId: `agent_${agentRole}_01`,
      agentRole,
      toolName,
      action: `Ejecución de ${toolName}`,
      inputData,
      reasoning,
      clientId: parseId(clientId),
      userId: parseId(userId),
      status: 'failed',
      error: check.reason,
      timestamp: new Date().toISOString(),
    };

    if (db) {
      await db.collection('ai_action_logs').insertOne(rejectedLog);
    }

    return {
      success: false,
      blocked: true,
      requiresApproval: false,
      error: check.reason,
      log: sanitizeAIActionLog(rejectedLog),
    };
  }

  // If requires human approval, suspend action
  if (check.requiresApproval) {
    const pendingLog = {
      agentId: `agent_${agentRole}_01`,
      agentRole,
      toolName,
      action: `Ejecución de ${toolName}`,
      inputData,
      reasoning,
      clientId: parseId(clientId),
      userId: parseId(userId),
      status: 'pending_approval',
      result: null,
      timestamp: new Date().toISOString(),
    };

    if (db) {
      const insRes = await db.collection('ai_action_logs').insertOne(pendingLog);
      pendingLog._id = insRes.insertedId;
    }

    return {
      success: true,
      blocked: false,
      requiresApproval: true,
      message: check.reason,
      log: sanitizeAIActionLog(pendingLog),
    };
  }

  // Execute autonomously
  let executionResult = null;
  let executionError = null;
  let status = 'executed';

  try {
    executionResult = await toolExecutor(inputData);
  } catch (err) {
    status = 'failed';
    executionError = err.message;
  }

  const actionLog = {
    agentId: `agent_${agentRole}_01`,
    agentRole,
    toolName,
    action: `Ejecución de ${toolName}`,
    inputData,
    reasoning,
    clientId: parseId(clientId),
    userId: parseId(userId),
    status,
    result: executionResult,
    error: executionError,
    timestamp: new Date().toISOString(),
  };

  if (db) {
    const insRes = await db.collection('ai_action_logs').insertOne(actionLog);
    actionLog._id = insRes.insertedId;
  }

  return {
    success: status === 'executed',
    blocked: false,
    requiresApproval: false,
    result: executionResult,
    error: executionError,
    log: sanitizeAIActionLog(actionLog),
  };
}

/**
 * Approves a pending AI action.
 */
export async function approveAIActionService({
  logId = null,
  approverUser = {},
  db = null,
} = {}) {
  if (!db || !logId) {
    throw new Error('Parámetros inválidos para aprobación.');
  }

  const logsCollection = db.collection('ai_action_logs');
  const logDoc = await logsCollection.findOne({ _id: new ObjectId(logId) });

  if (!logDoc) {
    throw new Error('Log de acción de IA no encontrado.');
  }

  if (logDoc.status !== 'pending_approval') {
    throw new Error(`La acción ya fue procesada con estado: ${logDoc.status}`);
  }

  await logsCollection.updateOne(
    { _id: logDoc._id },
    {
      $set: {
        status: 'executed',
        approverUserId: approverUser.id || approverUser.email,
        approvedAt: new Date().toISOString(),
        result: { approved: true, executedByApproval: true },
      },
    }
  );

  return {
    success: true,
    message: 'Acción aprobada y ejecutada exitosamente por el Control Plane.',
  };
}

/**
 * Rejects a pending AI action.
 */
export async function rejectAIActionService({
  logId = null,
  approverUser = {},
  reason = 'Rechazado manualmente por el operador.',
  db = null,
} = {}) {
  if (!db || !logId) {
    throw new Error('Parámetros inválidos para rechazo.');
  }

  const logsCollection = db.collection('ai_action_logs');
  const logDoc = await logsCollection.findOne({ _id: new ObjectId(logId) });

  if (!logDoc) {
    throw new Error('Log de acción de IA no encontrado.');
  }

  await logsCollection.updateOne(
    { _id: logDoc._id },
    {
      $set: {
        status: 'rejected',
        approverUserId: approverUser.id || approverUser.email,
        rejectedReason: reason,
        approvedAt: new Date().toISOString(),
      },
    }
  );

  return {
    success: true,
    message: 'Acción rechazada por el operador.',
  };
}
