import { describe, it, expect, vi } from 'vitest';
import { executeDecisionActionService } from '../../netlify/functions/_shared/decisionEngine/decisionEngineService.js';

describe('Stages 20/21 — The Decision Engine & Control Plane Execution Tests', () => {
  it('1. executeDecisionActionService enruta la acción por el Agent Control Plane y resuelve la alerta en MongoDB', async () => {
    let updatedAlert = null;
    let insertedActionLog = null;

    const mockDb = {
      collection: (name) => {
        if (name === 'system_alerts') {
          return {
            updateOne: async (query, update) => {
              updatedAlert = { query, update };
              return { modifiedCount: 1 };
            },
          };
        }
        if (name === 'ai_action_logs') {
          return {
            insertOne: async (doc) => {
              insertedActionLog = { _id: 'mock_action_log_123', ...doc };
              return { insertedId: 'mock_action_log_123' };
            },
          };
        }
        return {
          findOne: async () => null,
        };
      },
    };

    const result = await executeDecisionActionService({
      alertId: '65df88888888888888888888',
      actionType: 'PAUSE_AD',
      targetId: 'ad_feed_101',
      payload: { adId: 'ad_feed_101' },
      clientId: '65df44444444444444444444',
      user: { _id: 'user_001', email: 'admin@animamkt.com' },
      db: mockDb,
    });

    expect(result.ok).toBe(true);
    expect(result.actionType).toBe('PAUSE_AD');
    expect(result.targetId).toBe('ad_feed_101');
    expect(result.newStatus).toBe('PAUSED');
    expect(result.actionLogId).toBe('mock_action_log_123');

    // Verify Control Plane Log Audit
    expect(insertedActionLog).toBeDefined();
    expect(insertedActionLog.agentRole).toBe('director');
    expect(insertedActionLog.toolName).toBe('decision_pause_ad');

    // Verify Alert Resolved in MongoDB
    expect(updatedAlert).toBeDefined();
    expect(updatedAlert.update.$set.status).toBe('RESOLVED');
    expect(updatedAlert.update.$set.resolvedBy.email).toBe('admin@animamkt.com');
  });

  it('2. executeDecisionActionService maneja acciones de SCALE_BUDGET y TRIGGER_AI_SETTER con éxito', async () => {
    const mockDb = {
      collection: () => ({
        updateOne: async () => ({ modifiedCount: 1 }),
        insertOne: async (doc) => ({ insertedId: 'act_101', ...doc }),
      }),
    };

    const resScale = await executeDecisionActionService({
      actionType: 'SCALE_BUDGET',
      targetId: 'camp_002',
      clientId: '65df44444444444444444444',
      db: mockDb,
    });
    expect(resScale.ok).toBe(true);
    expect(resScale.newStatus).toBe('ACTIVE_SCALED');

    const resSetter = await executeDecisionActionService({
      actionType: 'TRIGGER_AI_SETTER',
      targetId: 'crm_queue',
      clientId: '65df44444444444444444444',
      db: mockDb,
    });
    expect(resSetter.ok).toBe(true);
    expect(resSetter.leadsNotified).toBe(3);
  });
});
