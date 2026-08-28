import { describe, it, expect } from 'vitest';
import { scanTenantAnomaliesService } from '../../netlify/functions/_shared/decisionEngine/alertEngineService.js';
import { sanitizeSystemAlert, ALERT_TYPES, ALERT_SEVERITIES } from '../../models/SystemAlert.js';

describe('Stage 21 — Alert Engine: 24/7 Anomaly Monitoring Daemon Tests', () => {
  it('1. scanTenantAnomaliesService escanea y genera las alertas con los 4 bloques prescriptivos', async () => {
    const mockDb = {
      collection: () => ({
        find: () => ({ toArray: async () => [] }),
        insertOne: async (doc) => ({ insertedId: 'mock_alt_id', ...doc }),
      }),
    };

    const alerts = await scanTenantAnomaliesService({
      clientId: '65df44444444444444444444',
      db: mockDb,
    });

    expect(Array.isArray(alerts)).toBe(true);
    expect(alerts.length).toBe(3);

    // Alert 1: Creative Fatigue
    const fatigueAlert = alerts.find((a) => a.alertType === 'CREATIVE_FATIGUE');
    expect(fatigueAlert).toBeDefined();
    expect(fatigueAlert.severity).toBe('CRITICAL');
    expect(fatigueAlert.metricsSnapshot.frequency).toBeGreaterThanOrEqual(3.8);
    expect(fatigueAlert.aiDecision.diagnosis).toContain('frecuencia publicitaria superó');
    expect(fatigueAlert.aiDecision.evidence).toBeDefined();
    expect(fatigueAlert.aiDecision.recommendation).toBeDefined();
    expect(fatigueAlert.aiDecision.proposedAction.actionType).toBe('PAUSE_AD');

    // Alert 2: CPL Anomaly
    const cplAlert = alerts.find((a) => a.alertType === 'CPL_ANOMALY');
    expect(cplAlert).toBeDefined();
    expect(cplAlert.severity).toBe('HIGH');
    expect(cplAlert.metricsSnapshot.deltaPct).toBeGreaterThanOrEqual(35);

    // Alert 3: SLA Leak
    const slaAlert = alerts.find((a) => a.alertType === 'SLA_LEAK');
    expect(slaAlert).toBeDefined();
    expect(slaAlert.metricsSnapshot.currentVal).toBeGreaterThanOrEqual(60);
  });

  it('2. sanitizeSystemAlert aplica validaciones de tipo de alerta, severidad y estado', () => {
    const sanitized = sanitizeSystemAlert({
      alertType: 'INVALID_TYPE',
      severity: 'SUPER_HIGH',
      status: 'NOT_A_STATUS',
    });

    expect(sanitized.alertType).toBe('CPL_ANOMALY');
    expect(sanitized.severity).toBe('HIGH');
    expect(sanitized.status).toBe('TRIGGERED');
    expect(sanitized.aiDecision.proposedAction.buttonLabel).toBeDefined();
  });
});
