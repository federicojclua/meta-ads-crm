import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  validateCaseDocument,
  sanitizeCase,
  CASE_TYPES,
  CASE_STATUSES,
  CASE_PRIORITIES,
} from '../../models/Case.js';
import { handler as casesHandler } from '../../netlify/functions/api-cases.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';
import * as NotifierModule from '../../netlify/functions/_shared/whatsappGroupNotifier.js';

describe('Fase 2 — Cases & Post-sales Management Module Tests', () => {
  // ----------------------------------------------------
  // 1. Model Validation & Sanitization Tests
  // ----------------------------------------------------
  describe('1. Case Model Validation & Sanitization', () => {
    it('valida que clientId y title sean obligatorios en la creación de un caso', () => {
      const res1 = validateCaseDocument({});
      expect(res1.isValid).toBe(false);
      expect(res1.errors).toContain('El campo clientId es obligatorio para asociar el caso a una empresa.');
      expect(res1.errors).toContain('El título o motivo del caso es obligatorio.');

      const res2 = validateCaseDocument({ clientId: 'client_123', title: '   ' });
      expect(res2.isValid).toBe(false);
      expect(res2.errors).toContain('El título o motivo del caso es obligatorio.');
    });

    it('acepta tipos, estados y prioridades válidos', () => {
      const res = validateCaseDocument({
        clientId: 'client_123',
        title: 'Falla al imprimir en terminal Clover Mini',
        type: 'soporte_tecnico',
        status: 'abierto',
        priority: 'alta',
      });
      expect(res.isValid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('rechaza tipos, estados y prioridades inválidos', () => {
      const res = validateCaseDocument({
        clientId: 'client_123',
        title: 'Pedido de insumos',
        type: 'tipo_inexistente',
        status: 'status_invalido',
        priority: 'super_urgente',
      });
      expect(res.isValid).toBe(false);
      expect(res.errors.length).toBe(3);
    });

    it('exige resolutionNotes si el estado se cambia o marca como resuelto', () => {
      const resNoNotes = validateCaseDocument(
        { status: 'resuelto', resolutionNotes: '' },
        true
      );
      expect(resNoNotes.isValid).toBe(false);
      expect(resNoNotes.errors).toContain(
        'Para marcar un caso como resuelto se deben documentar las notas de resolución.'
      );

      const resWithNotes = validateCaseDocument(
        { status: 'resuelto', resolutionNotes: 'Se reemplazó bobina térmica y terminal quedó operativa.' },
        true
      );
      expect(resWithNotes.isValid).toBe(true);
    });

    it('sanitiza un documento de caso con etiquetas amigables y formato #1001', () => {
      const rawDoc = {
        _id: new ObjectId('507f1f77bcf86cd799439011'),
        clientId: new ObjectId('507f1f77bcf86cd799439022'),
        caseNumber: 1045,
        caseCode: '#1045',
        title: 'Pedido 10 rollos térmicos PosNet',
        type: 'insumos_rollos',
        status: 'en_curso',
        priority: 'media',
        contactName: 'Carlos Gómez',
        contactPhone: '+5493815551234',
        createdAt: new Date('2026-10-08T10:00:00Z'),
      };

      const sanitized = sanitizeCase(rawDoc);
      expect(sanitized.id).toBe('507f1f77bcf86cd799439011');
      expect(sanitized.caseNumber).toBe(1045);
      expect(sanitized.caseCode).toBe('#1045');
      expect(sanitized.typeLabel).toBe('Insumos y rollos');
      expect(sanitized.statusLabel).toBe('En curso');
      expect(sanitized.priorityLabel).toBe('Media');
      expect(sanitized.contactName).toBe('Carlos Gómez');
    });
  });

  // ----------------------------------------------------
  // 2. Serverless API Cases Handler Tests
  // ----------------------------------------------------
  describe('2. Serverless API Cases Handler', () => {
    let mockDb;
    let mockCasesCollection;
    let mockCountersCollection;
    let mockNotifyGroup;

    beforeEach(() => {
      mockCasesCollection = {
        find: vi.fn(),
        findOne: vi.fn(),
        insertOne: vi.fn(),
        updateOne: vi.fn(),
      };

      mockCountersCollection = {
        findOneAndUpdate: vi.fn(),
      };

      mockDb = {
        collection: vi.fn((colName) => {
          if (colName === 'cases') return mockCasesCollection;
          if (colName === 'counters') return mockCountersCollection;
          return {};
        }),
      };

      mockNotifyGroup = vi.spyOn(NotifierModule, 'notifyGroup').mockResolvedValue({ ok: true });
    });

    it('rechaza llamadas no autenticadas con 401', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: false,
        status: 401,
        error: 'Token inválido',
        code: 'AUTH_REQUIRED',
      });

      const res = await casesHandler({
        httpMethod: 'GET',
        path: '/api/cases',
      });

      expect(res.statusCode).toBe(401);
      const parsed = JSON.parse(res.body);
      expect(parsed.code).toBe('AUTH_REQUIRED');
    });

    it('POST /api/cases genera número secuencial #1001, inserta en base y dispara alerta de grupo', async () => {
      const clientId = new ObjectId('507f1f77bcf86cd799439011');
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), displayName: 'Federico Asesor', email: 'fede@novati.com' },
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      mockCountersCollection.findOneAndUpdate.mockResolvedValue({ seq: 1 });
      const insertedId = new ObjectId();
      mockCasesCollection.insertOne.mockResolvedValue({ insertedId });

      const event = {
        httpMethod: 'POST',
        path: '/api/cases',
        body: JSON.stringify({
          title: 'Terminal Clover Flex no conecta a WiFi',
          contactName: 'Minimercado San Cayetano',
          contactPhone: '+5493816667788',
          type: 'soporte_tecnico',
          priority: 'urgente',
          description: 'El dueño reporta que no puede cobrar desde las 9am.',
        }),
      };

      const res = await casesHandler(event);
      expect(res.statusCode).toBe(201);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.case.caseNumber).toBe(1001);
      expect(data.case.caseCode).toBe('#1001');
      expect(data.case.title).toBe('Terminal Clover Flex no conecta a WiFi');
      expect(data.case.priority).toBe('urgente');

      // Verificamos que se haya invocado notifyGroup con 'new_case'
      expect(mockNotifyGroup).toHaveBeenCalledWith(
        'new_case',
        expect.objectContaining({
          caseNumber: 1001,
          clientName: 'Minimercado San Cayetano',
          phone: '+5493816667788',
          caseType: 'Soporte técnico',
          status: 'Abierto',
        })
      );
    });

    it('GET /api/cases lista casos aplicando filtros de búsqueda y estado', async () => {
      const clientId = new ObjectId('507f1f77bcf86cd799439011');
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), email: 'asesor@novati.com' },
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      const mockCases = [
        {
          _id: new ObjectId(),
          clientId,
          caseNumber: 1001,
          caseCode: '#1001',
          title: 'Terminal Clover bloqueada',
          type: 'soporte_tecnico',
          status: 'abierto',
          priority: 'alta',
        },
      ];

      const toArrayMock = vi.fn().mockResolvedValue(mockCases);
      const limitMock = vi.fn().mockReturnValue({ toArray: toArrayMock });
      const sortMock = vi.fn().mockReturnValue({ limit: limitMock });
      mockCasesCollection.find.mockReturnValue({ sort: sortMock });

      const event = {
        httpMethod: 'GET',
        path: '/api/cases',
        queryStringParameters: {
          status: 'abierto',
          search: 'Clover',
        },
      };

      const res = await casesHandler(event);
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.cases).toHaveLength(1);
      expect(data.cases[0].caseCode).toBe('#1001');

      // Verifica query construida
      const calledFilter = mockCasesCollection.find.mock.calls[0][0];
      expect(calledFilter.status).toBe('abierto');
      expect(calledFilter.$or).toBeDefined();
    });

    it('PATCH /api/cases/:id actualiza estado a resuelto exigiendo notas y registrando auditoría', async () => {
      const clientId = new ObjectId('507f1f77bcf86cd799439011');
      const caseId = new ObjectId('507f1f77bcf86cd799439099');

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), displayName: 'Juan Soporte', email: 'juan@novati.com' },
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      const existingCase = {
        _id: caseId,
        clientId,
        caseNumber: 1002,
        caseCode: '#1002',
        title: 'Pedido de 5 rollos de papel',
        type: 'insumos_rollos',
        status: 'en_curso',
        priority: 'media',
        activities: [],
      };

      mockCasesCollection.findOne
        .mockResolvedValueOnce(existingCase) // Primera lectura para verificar existencia
        .mockResolvedValueOnce({
          ...existingCase,
          status: 'resuelto',
          resolutionNotes: 'Se entregaron los rollos en mano en el local del cliente.',
          resolvedBy: 'Juan Soporte',
          resolvedAt: new Date(),
        }); // Segunda lectura para respuesta sanitizada

      mockCasesCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

      const event = {
        httpMethod: 'PATCH',
        path: `/api/cases/${caseId.toString()}`,
        body: JSON.stringify({
          status: 'resuelto',
          resolutionNotes: 'Se entregaron los rollos en mano en el local del cliente.',
        }),
      };

      const res = await casesHandler(event);
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.case.status).toBe('resuelto');
      expect(data.case.resolutionNotes).toBe('Se entregaron los rollos en mano en el local del cliente.');
      expect(mockCasesCollection.updateOne).toHaveBeenCalled();
    });

    it('PATCH /api/cases/:id rechaza marcar como resuelto si faltan resolutionNotes', async () => {
      const clientId = new ObjectId('507f1f77bcf86cd799439011');
      const caseId = new ObjectId('507f1f77bcf86cd799439099');

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), displayName: 'Juan Soporte', email: 'juan@novati.com' },
        db: mockDb,
        clientScope: clientId.toString(),
        isGlobal: false,
      });

      const event = {
        httpMethod: 'PATCH',
        path: `/api/cases/${caseId.toString()}`,
        body: JSON.stringify({
          status: 'resuelto',
          resolutionNotes: '   ',
        }),
      };

      const res = await casesHandler(event);
      expect(res.statusCode).toBe(400);
      const data = JSON.parse(res.body);
      expect(data.code).toBe('VALIDATION_FAILED');
    });
  });
});
