import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  checkToolExecutionPermission,
  DEFAULT_TOOL_PERMISSIONS,
} from '../../models/AIToolPermissionMatrix.js';
import {
  executeControlledTool,
  approveAIActionService,
  rejectAIActionService,
} from '../../netlify/functions/_shared/aiSalesEngine/controlPlaneService.js';
import { handler as salesEngineHandler } from '../../netlify/functions/api-sales-engine.js';
import * as AuthModule from '../../netlify/functions/_shared/permissions.js';

describe('Stage 14 — AI Agent Control Plane & Zero-Rogue Security Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. checkToolExecutionPermission autoriza herramientas estándar para Qualifier sin aprobación', () => {
    const res = checkToolExecutionPermission({
      agentRole: 'qualifier',
      toolName: 'create_lead',
      inputData: { name: 'Carlos Test' },
      matrix: DEFAULT_TOOL_PERMISSIONS,
    });

    expect(res.allowed).toBe(true);
    expect(res.requiresApproval).toBe(false);
  });

  it('2. checkToolExecutionPermission bloquea herramientas no autorizadas (Zero-Rogue AI)', () => {
    const res = checkToolExecutionPermission({
      agentRole: 'qualifier',
      toolName: 'delete_campaign',
      matrix: DEFAULT_TOOL_PERMISSIONS,
    });

    expect(res.allowed).toBe(false);
    expect(res.reason).toContain('no está autorizada');
  });

  it('3. checkToolExecutionPermission suspende herramientas condicionales que excedan umbrales', () => {
    const res = checkToolExecutionPermission({
      agentRole: 'setter',
      toolName: 'apply_discount',
      inputData: { discountPct: 25 }, // Exceeds 15% limit
      matrix: DEFAULT_TOOL_PERMISSIONS,
    });

    expect(res.allowed).toBe(true);
    expect(res.requiresApproval).toBe(true);
    expect(res.reason).toContain('excede el límite autónomo');
  });

  it('4. executeControlledTool suspende acción en pending_approval si requiere aprobación humana', async () => {
    const mockCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId('65df66666666666666666666') }),
      findOne: vi.fn().mockResolvedValue(null),
    };
    const mockDb = {
      collection: vi.fn().mockReturnValue(mockCollection),
    };

    const res = await executeControlledTool({
      agentRole: 'setter',
      toolName: 'apply_discount',
      inputData: { discountPct: 25 },
      reasoning: 'Cliente solicita descuento por pago en efectivo.',
      clientId: mockTenantId,
      db: mockDb,
    });

    expect(res.success).toBe(true);
    expect(res.requiresApproval).toBe(true);
    expect(res.log.status).toBe('pending_approval');
    expect(mockCollection.insertOne).toHaveBeenCalled();
  });

  it('5. approveAIActionService cambia el estado a executed y registra al aprobador', async () => {
    const logId = new ObjectId('65df77777777777777777777');
    const existingLog = {
      _id: logId,
      status: 'pending_approval',
      toolName: 'apply_discount',
    };

    const mockCollection = {
      findOne: vi.fn().mockResolvedValue(existingLog),
      updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
    };
    const mockDb = {
      collection: vi.fn().mockReturnValue(mockCollection),
    };

    const res = await approveAIActionService({
      logId: logId.toString(),
      approverUser: { id: 'usr_admin', email: 'admin@animamkt.com' },
      db: mockDb,
    });

    expect(res.success).toBe(true);
    expect(mockCollection.updateOne).toHaveBeenCalledWith(
      expect.objectContaining({ _id: logId }),
      expect.objectContaining({
        $set: expect.objectContaining({
          status: 'executed',
          approverUserId: 'usr_admin',
        }),
      })
    );
  });
});
