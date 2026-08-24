import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { handler as dashboardHandler } from '../../netlify/functions/api-dashboard.js';
import { handler as leadsHandler } from '../../netlify/functions/api-leads.js';
import { handler as salesHandler } from '../../netlify/functions/api-sales.js';
import { handler as authMeHandler } from '../../netlify/functions/api-auth-me.js';
import { repairInvalidAssignments } from '../../netlify/functions/_shared/db.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';
import * as AuthModule from '../../netlify/functions/_shared/auth.js';
import * as DbModule from '../../netlify/functions/_shared/db.js';

describe('Etapa 3 — Auditoría Final y Corrección Integral', () => {
  let mockDb;
  let mockLeadsCollection;
  let mockSalesCollection;
  let mockUsersCollection;
  let mockClientsCollection;
  let mockActivitiesCollection;

  const clientAId = new ObjectId('65df11111111111111111111');
  const clientBId = new ObjectId('65df22222222222222222222');

  const superAdminUser = {
    _id: new ObjectId('65df00000000000000000000'),
    email: 'admin@animamkt.com',
    role: 'super_admin',
    status: 'active',
  };

  const clientAUser = {
    _id: new ObjectId('65df33333333333333333333'),
    email: 'roxana@perfumeriamarion.com',
    role: 'client',
    status: 'active',
    clientId: clientAId,
    clientIds: [clientAId],
  };

  const salespersonA = {
    _id: new ObjectId('65df44444444444444444444'),
    email: 'angel.correa@perfumeriamarion.com',
    displayName: 'Ángel Correa',
    role: 'salesperson',
    status: 'active',
    clientId: clientAId,
    clientIds: [clientAId],
  };

  const invitedSalespersonA = {
    _id: new ObjectId('65df55555555555555555555'),
    email: 'federicojclua78@gmail.com',
    displayName: 'Ángel Correa (Invitado)',
    role: 'salesperson',
    status: 'invited',
    clientId: clientAId,
    clientIds: [clientAId],
    firebaseUid: null,
  };

  const salespersonB = {
    _id: new ObjectId('65df66666666666666666666'),
    email: 'vendedor@ferreteriadelsur.com',
    displayName: 'Vendedor Ferretería',
    role: 'salesperson',
    status: 'active',
    clientId: clientBId,
    clientIds: [clientBId],
  };

  beforeEach(() => {
    mockLeadsCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      countDocuments: vi.fn(),
    };

    mockSalesCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
      countDocuments: vi.fn(),
    };

    mockUsersCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
      insertOne: vi.fn(),
      updateOne: vi.fn(),
      findOneAndUpdate: vi.fn(),
    };

    mockClientsCollection = {
      find: vi.fn(),
      findOne: vi.fn(),
    };

    mockActivitiesCollection = {
      insertOne: vi.fn().mockResolvedValue({ insertedId: new ObjectId() }),
      find: vi.fn(),
    };

    mockDb = {
      collection: vi.fn().mockImplementation((name) => {
        if (name === 'leads') return mockLeadsCollection;
        if (name === 'sales') return mockSalesCollection;
        if (name === 'users') return mockUsersCollection;
        if (name === 'clients') return mockClientsCollection;
        if (name === 'lead_activities') return mockActivitiesCollection;
        return null;
      }),
    };
  });

  // =========================================================================
  // 1. DASHBOARD MULTIEMPRESA Y AISLAMIENTO DE ESTADÍSTICAS
  // =========================================================================
  describe('1. Dashboard Multiempresa', () => {
    it('1.1 Dos empresas devuelven estadísticas completamente diferentes según el clientId', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: superAdminUser,
        db: mockDb,
        isGlobal: true,
        clientScope: null,
      });

      // Mock clientA lookup
      mockClientsCollection.findOne.mockImplementation(async (q) => {
        const id = q.$or?.[0]?._id?.toString() || q._id?.toString();
        if (id === clientAId.toString()) {
          return { _id: clientAId, name: 'Perfumería Marion', status: 'active', defaultCurrency: 'ARS' };
        }
        if (id === clientBId.toString()) {
          return { _id: clientBId, name: 'Ferretería del Sur', status: 'active', defaultCurrency: 'ARS' };
        }
        return null;
      });

      // Request for Client A
      mockLeadsCollection.countDocuments
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(20) // new
        .mockResolvedValueOnce(15) // contacted
        .mockResolvedValueOnce(10) // qualified
        .mockResolvedValueOnce(5)  // won
        .mockResolvedValueOnce(0); // lost

      mockSalesCollection.find.mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValueOnce([
          { currency: 'ARS', amountMinor: 20000000, collectedAmountMinor: 20000000, collectedAmountDefaultMinor: 20000000 },
        ]),
      });

      mockUsersCollection.find.mockReturnValueOnce({
        project: vi.fn().mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValueOnce([]),
        }),
      });

      const resA = await dashboardHandler({
        httpMethod: 'GET',
        path: '/api/dashboard/stats',
        queryStringParameters: { clientId: clientAId.toString() },
      });

      expect(resA.statusCode).toBe(200);
      const dataA = JSON.parse(resA.body);
      expect(dataA.kpis.totalLeadsCount).toBe(50);
      expect(dataA.kpis.wonLeadsCount).toBe(5);
      expect(dataA.kpis.totalCollectedFormatted).toBe('200.000,00');

      // Request for Client B
      mockLeadsCollection.countDocuments
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(5)  // new
        .mockResolvedValueOnce(2)  // contacted
        .mockResolvedValueOnce(1)  // qualified
        .mockResolvedValueOnce(2)  // won
        .mockResolvedValueOnce(0); // lost

      mockSalesCollection.find.mockReturnValueOnce({
        toArray: vi.fn().mockResolvedValueOnce([
          { currency: 'ARS', amountMinor: 5000000, collectedAmountMinor: 5000000, collectedAmountDefaultMinor: 5000000 },
        ]),
      });

      mockUsersCollection.find.mockReturnValueOnce({
        project: vi.fn().mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValueOnce([]),
        }),
      });

      const resB = await dashboardHandler({
        httpMethod: 'GET',
        path: '/api/dashboard/stats',
        queryStringParameters: { clientId: clientBId.toString() },
      });

      expect(resB.statusCode).toBe(200);
      const dataB = JSON.parse(resB.body);
      expect(dataB.kpis.totalLeadsCount).toBe(10);
      expect(dataB.kpis.wonLeadsCount).toBe(2);
      expect(dataB.kpis.totalCollectedFormatted).toBe('50.000,00');

      // Demostrar que los resultados de ambas empresas NO coinciden
      expect(dataA.kpis.totalLeadsCount).not.toBe(dataB.kpis.totalLeadsCount);
      expect(dataA.kpis.totalCollectedFormatted).not.toBe(dataB.kpis.totalCollectedFormatted);
    });

    it('1.2 Rol client no puede cambiar de empresa mediante queryStringParameters', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: clientAUser,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      mockClientsCollection.findOne.mockResolvedValueOnce({
        _id: clientAId,
        name: 'Perfumería Marion',
        status: 'active',
        defaultCurrency: 'ARS',
      });

      mockLeadsCollection.countDocuments.mockResolvedValue(0);
      mockSalesCollection.find.mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) });
      mockUsersCollection.find.mockReturnValueOnce({ project: vi.fn().mockReturnValueOnce({ toArray: vi.fn().mockResolvedValueOnce([]) }) });

      // Intento malicioso de consultar Client B siendo usuario de Client A
      const res = await dashboardHandler({
        httpMethod: 'GET',
        path: '/api/dashboard/stats',
        queryStringParameters: { clientId: clientBId.toString() },
      });

      expect(res.statusCode).toBe(200);
      // Verify that lead queries were forced with clientAId, not clientBId
      const lastCountCallArg = mockLeadsCollection.countDocuments.mock.calls[0][0];
      expect(lastCountCallArg.clientId.toString()).toBe(clientAId.toString());
    });
  });

  // =========================================================================
  // 2. CÁLCULO FINANCIERO Y CONTROL DE COBROS
  // =========================================================================
  describe('2. Flujo Financiero y Saldos', () => {
    it('2.1 Crea venta de $100.000 ARS, cobro inicial de $70.000 ARS (saldo $30.000, estado partial) y cobra los $30.000 restantes', async () => {
      const leadId = new ObjectId('65df77777777777777777777');
      const saleId = new ObjectId('65df88888888888888888888');

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: clientAUser,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      mockLeadsCollection.findOne.mockResolvedValue({
        _id: leadId,
        clientId: clientAId,
        name: 'Martín Guzmán',
        stage: 'qualified',
      });

      mockClientsCollection.findOne.mockResolvedValue({
        _id: clientAId,
        status: 'active',
        defaultCurrency: 'ARS',
      });

      mockSalesCollection.insertOne.mockResolvedValue({ insertedId: saleId });

      const initialSaleDoc = {
        _id: saleId,
        clientId: clientAId,
        leadId,
        leadName: 'Martín Guzmán',
        status: 'partial',
        amountMinor: 10000000, // $100.000
        currency: 'ARS',
        collectedAmountMinor: 7000000, // $70.000
        collectedAmountDefaultMinor: 7000000,
        payments: [{
          _id: new ObjectId(),
          amountMinor: 7000000,
          collectedAt: new Date(),
          notes: 'Cobro inicial registrado al crear la venta.',
        }],
      };

      mockSalesCollection.findOne.mockResolvedValue(initialSaleDoc);

      // 1. Crear venta con cobro inicial
      const createRes = await salesHandler({
        httpMethod: 'POST',
        path: '/api/sales',
        body: JSON.stringify({
          leadId: leadId.toString(),
          amountMinor: 10000000,
          currency: 'ARS',
          collectedAmountMinor: 7000000,
        }),
      });

      expect(createRes.statusCode).toBe(201);
      const createdBody = JSON.parse(createRes.body);
      expect(createdBody.sale.amountMinor).toBe(10000000);
      expect(createdBody.sale.collectedAmountMinor).toBe(7000000);
      expect(createdBody.sale.status).toBe('partial');

      // Saldo pendiente calculado
      const pendingMinor = createdBody.sale.amountMinor - createdBody.sale.collectedAmountMinor;
      expect(pendingMinor).toBe(3000000); // $30.000

      // 2. Registrar cobro de los $30.000 restantes
      const fullyCollectedDoc = {
        ...initialSaleDoc,
        status: 'collected',
        collectedAmountMinor: 10000000,
        collectedAmountDefaultMinor: 10000000,
        payments: [
          ...initialSaleDoc.payments,
          {
            _id: new ObjectId(),
            amountMinor: 3000000,
            collectedAt: new Date(),
            notes: 'Segundo cobro saldo restante.',
          },
        ],
      };

      mockSalesCollection.findOneAndUpdate.mockResolvedValueOnce(fullyCollectedDoc);
      mockSalesCollection.findOne.mockResolvedValueOnce(fullyCollectedDoc);

      const collectRes = await salesHandler({
        httpMethod: 'POST',
        path: `/api/sales/${saleId.toString()}/collect`,
        body: JSON.stringify({
          collectedAmountMinor: 3000000,
        }),
      });

      expect(collectRes.statusCode).toBe(200);
      const collectedBody = JSON.parse(collectRes.body);
      expect(collectedBody.sale.collectedAmountMinor).toBe(10000000);
      expect(collectedBody.sale.status).toBe('collected');

      // 3. Intentar cobrar $1 adicional (100 centavos) sobre una venta totalmente cobrada
      mockSalesCollection.findOneAndUpdate.mockResolvedValueOnce(null); // atomic condition fails
      mockSalesCollection.findOne.mockImplementation(async (q) => {
        if (q._id?.toString() === saleId.toString()) {
          return fullyCollectedDoc;
        }
        return null;
      });

      const overCollectRes = await salesHandler({
        httpMethod: 'POST',
        path: `/api/sales/${saleId.toString()}/collect`,
        body: JSON.stringify({
          collectedAmountMinor: 100, // $1
        }),
      });

      expect(overCollectRes.statusCode).toBe(409);
      const overCollectBody = JSON.parse(overCollectRes.body);
      expect(overCollectBody.code).toBe('SALE_ALREADY_COLLECTED');
    });
  });

  // =========================================================================
  // 3. FORMALIZACIÓN DE REGLAS DE ASIGNACIÓN
  // =========================================================================
  describe('3. Reglas de Asignación Comercial', () => {
    it('3.1 Permite asignar a un vendedor activo de la misma empresa', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: clientAUser,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      mockClientsCollection.findOne.mockResolvedValueOnce({ _id: clientAId, status: 'active' });
      mockUsersCollection.findOne.mockResolvedValueOnce(salespersonA);
      mockLeadsCollection.insertOne.mockResolvedValueOnce({ insertedId: new ObjectId() });
      mockLeadsCollection.findOne.mockResolvedValueOnce({
        _id: new ObjectId(),
        clientId: clientAId,
        name: 'Lead Test',
        assignedToUserId: salespersonA._id,
      });

      const res = await leadsHandler({
        httpMethod: 'POST',
        path: '/api/leads',
        body: JSON.stringify({
          name: 'Lead Asignado Activo',
          email: 'lead@test.com',
          assignedToUserId: salespersonA._id.toString(),
        }),
      });

      expect(res.statusCode).toBe(201);
    });

    it('3.2 Permite preasignar a un vendedor invitado (status: invited) de la misma empresa', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: clientAUser,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      mockClientsCollection.findOne.mockResolvedValueOnce({ _id: clientAId, status: 'active' });
      mockUsersCollection.findOne.mockResolvedValueOnce(invitedSalespersonA);
      mockLeadsCollection.insertOne.mockResolvedValueOnce({ insertedId: new ObjectId() });
      mockLeadsCollection.findOne.mockResolvedValueOnce({
        _id: new ObjectId(),
        clientId: clientAId,
        name: 'Lead Test Invitado',
        assignedToUserId: invitedSalespersonA._id,
      });

      const res = await leadsHandler({
        httpMethod: 'POST',
        path: '/api/leads',
        body: JSON.stringify({
          name: 'Lead Preasignado',
          email: 'preasignado@test.com',
          assignedToUserId: invitedSalespersonA._id.toString(),
        }),
      });

      expect(res.statusCode).toBe(201);
    });

    it('3.3 Rechaza asignación a usuario con rol client (ej: Roxana o Joaquín)', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: clientAUser,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      mockClientsCollection.findOne.mockResolvedValueOnce({ _id: clientAId, status: 'active' });
      // Search for salesperson fails because role is 'client'
      mockUsersCollection.findOne.mockResolvedValueOnce(null);

      const res = await leadsHandler({
        httpMethod: 'POST',
        path: '/api/leads',
        body: JSON.stringify({
          name: 'Lead Rechazado Rol',
          email: 'rechazo@test.com',
          assignedToUserId: clientAUser._id.toString(),
        }),
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('INVALID_SALESPERSON');
    });

    it('3.4 Rechaza asignación a vendedor de otra empresa', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: clientAUser,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      mockClientsCollection.findOne.mockResolvedValueOnce({ _id: clientAId, status: 'active' });
      // salespersonB belongs to clientBId, so tenant filter fails
      mockUsersCollection.findOne.mockResolvedValueOnce(null);

      const res = await leadsHandler({
        httpMethod: 'POST',
        path: '/api/leads',
        body: JSON.stringify({
          name: 'Lead Rechazado Tenant',
          email: 'rechazo_tenant@test.com',
          assignedToUserId: salespersonB._id.toString(),
        }),
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('INVALID_SALESPERSON');
    });

    it('3.5 Rechaza asignación a vendedor suspendido', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: clientAUser,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      mockClientsCollection.findOne.mockResolvedValueOnce({ _id: clientAId, status: 'active' });
      mockUsersCollection.findOne.mockResolvedValueOnce(null); // suspended user not matched in { status: { $in: ['active', 'invited'] } }

      const res = await leadsHandler({
        httpMethod: 'POST',
        path: '/api/leads',
        body: JSON.stringify({
          name: 'Lead Rechazado Suspendido',
          email: 'suspendido@test.com',
          assignedToUserId: new ObjectId().toString(),
        }),
      });

      expect(res.statusCode).toBe(400);
      const body = JSON.parse(res.body);
      expect(body.code).toBe('INVALID_SALESPERSON');
    });
  });

  // =========================================================================
  // 4. ACTIVACIÓN CON GOOGLE Y CONSERVACIÓN DE CARTERA
  // =========================================================================
  describe('4. Activación con Google y Aislamiento', () => {
    it('4.1 Vendedor invitado activa su cuenta con Google y conserva sus leads preasignados', async () => {
      vi.spyOn(AuthModule, 'verifyAuth').mockResolvedValueOnce({
        authenticated: true,
        user: { uid: 'google_uid_angel_123', email: 'federicojclua78@gmail.com' },
      });

      vi.spyOn(DbModule, 'connectToDatabase').mockResolvedValueOnce({ db: mockDb });

      // First lookup by UID returns null; lookup by email returns invitedSalespersonA
      mockUsersCollection.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(invitedSalespersonA);

      mockClientsCollection.findOne.mockResolvedValueOnce({ _id: clientAId, status: 'active' });
      mockUsersCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

      const res = await authMeHandler({
        httpMethod: 'GET',
        path: '/api/auth/me',
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.user.role).toBe('salesperson');
      expect(body.user.status).toBe('active');
      expect(body.user.firebaseUid).toBe('google_uid_angel_123');

      // Verify that update set status to 'active' and saved firebaseUid
      const updateArgs = mockUsersCollection.updateOne.mock.calls[0];
      expect(updateArgs[1].$set.status).toBe('active');
      expect(updateArgs[1].$set.firebaseUid).toBe('google_uid_angel_123');
    });

    it('4.2 Vendedor solo puede consultar y listar sus leads asignados', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: salespersonA,
        db: mockDb,
        isGlobal: false,
        clientScope: clientAId.toString(),
      });

      mockLeadsCollection.find.mockReturnValueOnce({
        sort: vi.fn().mockReturnValueOnce({
          skip: vi.fn().mockReturnValueOnce({
            limit: vi.fn().mockReturnValueOnce({
              toArray: vi.fn().mockResolvedValueOnce([
                { _id: new ObjectId(), name: 'Lead Asignado a Ángel', assignedToUserId: salespersonA._id },
              ]),
            }),
          }),
        }),
      });
      mockLeadsCollection.countDocuments.mockResolvedValueOnce(1);
      mockUsersCollection.find.mockReturnValueOnce({
        project: vi.fn().mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValueOnce([
            { _id: salespersonA._id, displayName: 'Ángel Correa', email: salespersonA.email },
          ]),
        }),
      });

      const res = await leadsHandler({
        httpMethod: 'GET',
        path: '/api/leads',
      });

      expect(res.statusCode).toBe(200);
      const queryUsed = mockLeadsCollection.find.mock.calls[0][0];
      expect(queryUsed.assignedToUserId.toString()).toBe(salespersonA._id.toString());
      expect(queryUsed.clientId.toString()).toBe(clientAId.toString());
    });
  });

  // =========================================================================
  // 5. REPARACIÓN IDEMPOTENTE DE ASIGNACIONES INVÁLIDAS
  // =========================================================================
  describe('5. Reparación Automática de Asignaciones Inválidas', () => {
    it('5.1 repairInvalidAssignments desasigna leads con usuarios rol client o suspendidos y genera actividad', async () => {
      const invalidLead = {
        _id: new ObjectId('65df99999999999999999999'),
        clientId: clientAId,
        name: 'Lead Asignado Históricamente a Roxana',
        assignedToUserId: clientAUser._id, // Roxana has role 'client'
      };

      mockLeadsCollection.find.mockReturnValueOnce({
        project: vi.fn().mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValueOnce([invalidLead]),
        }),
      });

      mockUsersCollection.findOne.mockResolvedValueOnce(clientAUser); // returns role 'client'
      mockLeadsCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 });

      await repairInvalidAssignments(mockDb);

      // Verify that lead was unassigned
      expect(mockLeadsCollection.updateOne).toHaveBeenCalledWith(
        { _id: invalidLead._id },
        expect.objectContaining({ $set: expect.objectContaining({ assignedToUserId: null }) })
      );

      // Verify audit activity written
      expect(mockActivitiesCollection.insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: clientAId,
          leadId: invalidLead._id,
          type: 'assignment',
          description: expect.stringContaining('Asignación comercial corregida automáticamente'),
        })
      );
    });
  });
});
