import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { executeFollowUpCadenceService } from '../../netlify/functions/_shared/aiSalesEngine/followUpEngine.js';

describe('Stage 14 — Multi-Stage Follow-Up Engine Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');
  const now = new Date('2026-08-27T12:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. executeFollowUpCadenceService ejecuta Follow-up #1 a leads con más de 24h sin respuesta', async () => {
    const leads = [
      {
        id: 'lead_01',
        name: 'Lead 24h Inactivo',
        phone: '+5491144556677',
        followUpStep: 0,
        lastActivityAt: new Date(now.getTime() - 25 * 60 * 60 * 1000).toISOString(), // 25h ago
      },
    ];

    const mockDb = {
      collection: vi.fn().mockReturnValue({
        findOne: vi.fn().mockResolvedValue(null),
        insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      }),
    };

    const res = await executeFollowUpCadenceService({
      leads,
      clientId: mockTenantId,
      user: { id: 'usr_admin' },
      db: mockDb,
      simulatedNow: now,
    });

    expect(res.success).toBe(true);
    expect(res.totalActioned).toBe(1);
    expect(res.processedLeads[0].stepExecuted).toBe(1);
    expect(res.processedLeads[0].messageSent).toContain('revisar la propuesta');
  });

  it('2. executeFollowUpCadenceService mueve a Reactivation Queue a leads con más de 96h sin respuesta', async () => {
    const leads = [
      {
        id: 'lead_dormido',
        name: 'Lead Dormido 4 días',
        phone: '+5491199887766',
        followUpStep: 3,
        lastActivityAt: new Date(now.getTime() - 100 * 60 * 60 * 1000).toISOString(), // 100h ago
      },
    ];

    const res = await executeFollowUpCadenceService({
      leads,
      clientId: mockTenantId,
      user: { id: 'usr_admin' },
      simulatedNow: now,
    });

    expect(res.success).toBe(true);
    expect(res.processedLeads[0].stepExecuted).toBe(4);
    expect(res.processedLeads[0].action).toBe('MOVED_TO_REACTIVATION_QUEUE');
    expect(res.processedLeads[0].newStage).toBe('lost');
  });
});
