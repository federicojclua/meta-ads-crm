import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import crypto from 'node:crypto';
import { ObjectId } from 'mongodb';
import {
  MetaApiClient,
  generateAppSecretProof,
  isVerifiedMetaEndpoint,
  parseRateLimitHeaders,
} from '../../netlify/functions/_shared/metaClient.js';
import {
  getMetaConfig,
  timingSafeCompare,
  sanitizeMetaLog,
} from '../../netlify/functions/_shared/metaConfig.js';
import {
  resolveAdSetTenant,
  normalizeActions,
  normalizeActionValues,
  executeSyncJob,
} from '../../netlify/functions/_shared/metaSyncWorker.js';
import { calculateDerivedMetrics } from '../../models/MetaInsightDaily.js';
import { handler as assetsHandler } from '../../netlify/functions/api-meta-assets.js';
import { handler as insightsHandler } from '../../netlify/functions/api-meta-insights.js';
import { handler as syncHandler } from '../../netlify/functions/api-meta-sync.js';
import { handler as backgroundHandler } from '../../netlify/functions/meta-sync-background.js';
import * as PermissionsModule from '../../netlify/functions/_shared/permissions.js';
import * as DbModule from '../../netlify/functions/_shared/db.js';

let activeMockDb = null;

describe('Stage 4 — Meta Marketing API v26.0 Backend Test Suite (32 Casos)', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      META_APP_ID: '123456789012345',
      META_APP_SECRET: 'test_meta_app_secret_32_chars_long_123',
      META_SYSTEM_USER_TOKEN: 'EAAB_test_system_user_token_abc123',
      META_BUSINESS_ID: '987654321098765',
      META_API_VERSION: 'v26.0',
      CRON_SECRET: 'super_secret_cron_token_32_chars_long',
      META_MANUAL_SYNC_ENABLED: 'true',
    };
    activeMockDb = {
      collection: () => ({
        find: () => ({
          sort: () => ({
            toArray: () => Promise.resolve([]),
          }),
          toArray: () => Promise.resolve([]),
        }),
        findOne: () => Promise.resolve(null),
        insertOne: () => Promise.resolve({}),
        updateOne: () => Promise.resolve({}),
        updateMany: () => Promise.resolve({}),
      }),
    };
    vi.spyOn(DbModule, 'connectToDatabase').mockImplementation(async () => ({ db: activeMockDb }));
    vi.spyOn(DbModule, 'getDb').mockImplementation(async () => activeMockDb);
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // =========================================================================
  // 1. Configuración, Sanitización y Prevención de Fugas de Tokens
  // =========================================================================
  describe('1. Configuración, Sanitización y Cero Fuga de Tokens', () => {
    it('1.1 getMetaConfig detecta correctamente estado isConfigured', () => {
      const cfg = getMetaConfig();
      expect(cfg.isConfigured).toBe(true);
      expect(cfg.apiVersion).toBe('v26.0');
      expect(cfg.baseUrl).toBe('https://graph.facebook.com/v26.0');

      delete process.env.META_SYSTEM_USER_TOKEN;
      const uncfg = getMetaConfig();
      expect(uncfg.isConfigured).toBe(false);
    });

    it('1.2 sanitizeMetaLog redacta tokens de Meta (EAAB...), Bearer, JWTs y parámetros sin exponer fragmentos', () => {
      const sensitiveString = 'Error connecting to https://graph.facebook.com/v26.0/me?access_token=EAAB1234567890abcdef and Bearer eyJhbGciOi.eyJzdWIi.signature';
      const sanitized = sanitizeMetaLog(sensitiveString);

      expect(sanitized).not.toContain('EAAB1234567890abcdef');
      expect(sanitized).not.toContain('eyJhbGciOi');
      expect(sanitized).toContain('access_token=[REDACTED]');
      expect(sanitized).toContain('Bearer [REDACTED]');
    });

    it('1.3 sanitizeMetaLog limpia objetos anidados, arrays y stack traces de errores', () => {
      const err = new Error('Failed with token EAABsecret in url');
      const sanitizedErr = sanitizeMetaLog(err);

      expect(sanitizedErr.message).not.toContain('EAABsecret');
      expect(sanitizedErr.message).toContain('[REDACTED]');

      const nestedObj = {
        metaToken: 'EAAB999888777',
        config: {
          appSecret: 'secret_value',
          cronSecret: 'cron_value',
        },
        items: ['Bearer token123', 'safe_text'],
      };

      const sanitizedObj = sanitizeMetaLog(nestedObj);
      expect(sanitizedObj.metaToken).toBe('[REDACTED]');
      expect(sanitizedObj.config.appSecret).toBe('[REDACTED]');
      expect(sanitizedObj.config.cronSecret).toBe('[REDACTED]');
      expect(sanitizedObj.items[0]).toBe('Bearer [REDACTED]');
      expect(sanitizedObj.items[1]).toBe('safe_text');
    });

    it('1.4 timingSafeCompare previene timing attacks y rechaza strings desiguales o nulos', () => {
      const secret = 'valid_cron_secret_key_123456';
      expect(timingSafeCompare(secret, 'valid_cron_secret_key_123456')).toBe(true);
      expect(timingSafeCompare(secret, 'invalid_cron_secret')).toBe(false);
      expect(timingSafeCompare(secret, '')).toBe(false);
      expect(timingSafeCompare(null, secret)).toBe(false);
      expect(timingSafeCompare(undefined, undefined)).toBe(false);
    });
  });

  // =========================================================================
  // 2. Cliente Graph API v26.0, AppSecret Proof y Endpoints Oficiales
  // =========================================================================
  describe('2. Cliente Graph API v26.0, AppSecret Proof y Endpoints Oficiales', () => {
    it('2.1 generateAppSecretProof calcula HMAC-SHA256 exacto', () => {
      const token = 'test_token';
      const secret = 'test_secret';
      const expected = crypto.createHmac('sha256', secret).update(token).digest('hex');
      const proof = generateAppSecretProof(token, secret);
      expect(proof).toBe(expected);
      expect(generateAppSecretProof(null, secret)).toBeNull();
    });

    it('2.2 isVerifiedMetaEndpoint permite solo edges oficiales y bloquea edges genéricos no confirmados', () => {
      expect(isVerifiedMetaEndpoint('me')).toBe(true);
      expect(isVerifiedMetaEndpoint('act_123456/insights')).toBe(true);
      expect(isVerifiedMetaEndpoint('act_123456/campaigns')).toBe(true);
      expect(isVerifiedMetaEndpoint('act_123456/adsets')).toBe(true);
      expect(isVerifiedMetaEndpoint('9876543210/owned_ad_accounts')).toBe(true);
      expect(isVerifiedMetaEndpoint('9876543210/client_ad_accounts')).toBe(true);
      expect(isVerifiedMetaEndpoint('9876543210/owned_pixels')).toBe(true);
      expect(isVerifiedMetaEndpoint('1234567890')).toBe(true); // Single pixel validation

      // Bloquea endpoints no verificados
      expect(isVerifiedMetaEndpoint('9876543210/datasets')).toBe(false);
      expect(isVerifiedMetaEndpoint('9876543210/random_unverified_edge')).toBe(false);
    });

    it('2.3 metaClient envía Authorization: Bearer en headers y bloquea endpoints no verificados', async () => {
      const client = new MetaApiClient();

      // Intentar llamar endpoint no verificado arroja META_ENDPOINT_UNAVAILABLE
      await expect(client.request('9876543210/datasets')).rejects.toMatchObject({
        statusCode: 400,
        metaType: 'META_ENDPOINT_UNAVAILABLE',
      });
    });

    it('2.4 parseRateLimitHeaders analiza x-business-use-case-usage y x-app-usage detectando throttling', () => {
      const headers = new Headers({
        'x-app-usage': JSON.stringify({ call_count: 80, total_cputime: 60, total_time: 40 }),
        'x-business-use-case-usage': JSON.stringify({
          act_123: [{ type: 'ads_insights', call_count: 75, total_cputime: 70, total_time: 30 }],
        }),
        'retry-after': '30',
      });

      const parsed = parseRateLimitHeaders(headers);
      expect(parsed.maxUtilization).toBe(80);
      expect(parsed.isThrottlingRecommended).toBe(true);
      expect(parsed.isNearLimit).toBe(false);
      expect(parsed.retryAfter).toBe(30);
    });

    it('2.5 checkConnectionStatus devuelve objeto de estado seguro sin exponer tokens', async () => {
      const client = new MetaApiClient();
      vi.spyOn(client, 'request').mockResolvedValueOnce({
        data: { id: 'sys_123', name: 'System User CRM' },
        rateLimits: {},
      });

      const status = await client.checkConnectionStatus();
      expect(status.configured).toBe(true);
      expect(status.connectionStatus).toBe('connected');
      expect(status.apiVersion).toBe('v26.0');
      expect(status).not.toHaveProperty('token');
      expect(status).not.toHaveProperty('systemUserToken');
    });
  });

  // =========================================================================
  // 3. Métricas Financieras, Fórmulas Derivadas y Tratamiento Multimoneda
  // =========================================================================
  describe('3. Métricas Financieras, Fórmulas Derivadas y Multimoneda', () => {
    it('3.1 calculateDerivedMetrics realiza división protegida sin producir Infinity ni NaN', () => {
      const zeroSpendMetrics = calculateDerivedMetrics({
        spendMinor: 0,
        impressions: 0,
        clicks: 0,
        leadsCrm: 0,
        wonSalesCrm: 0,
        collectedRevenueMinor: 0,
      });

      expect(zeroSpendMetrics.cpl).toBeNull();
      expect(zeroSpendMetrics.cpa).toBeNull();
      expect(zeroSpendMetrics.roas).toBeNull();
      expect(zeroSpendMetrics.ctr).toBeNull();
      expect(zeroSpendMetrics.cpc).toBeNull();
      expect(zeroSpendMetrics.cpm).toBeNull();
    });

    it('3.2 calculateDerivedMetrics calcula CPL, CPA y ROAS en centavos con precisión exacta', () => {
      const metrics = calculateDerivedMetrics({
        spendMinor: 1000000, // $10,000.00
        impressions: 50000,
        clicks: 1000,
        leadsCrm: 50,
        wonSalesCrm: 10,
        collectedRevenueMinor: 3500000, // $35,000.00
      });

      expect(metrics.cpl).toBe(200.00); // 10,000 / 50
      expect(metrics.cpa).toBe(1000.00); // 10,000 / 10
      expect(metrics.roas).toBe(3.50); // 35,000 / 10,000
      expect(metrics.ctr).toBe(2.00); // (1000 / 50000) * 100
      expect(metrics.cpc).toBe(10.00); // 10,000 / 1000
      expect(metrics.cpm).toBe(200.00); // (10,000 / 50,000) * 1000
    });

    it('3.3 normalizadores convierten valores de acciones y montos a unidades menores (centavos)', () => {
      const rawActions = [{ action_type: 'lead', value: '15' }, { action_type: 'purchase', value: '3' }];
      const normalizedActions = normalizeActions(rawActions);
      expect(normalizedActions[0]).toEqual({ actionType: 'lead', value: 15 });

      const rawValues = [{ action_type: 'purchase', value: '250.50' }];
      const normalizedValues = normalizeActionValues(rawValues);
      expect(normalizedValues[0]).toEqual({ actionType: 'purchase', valueMinor: 25050 });
    });
  });

  // =========================================================================
  // 4. Resolución Temporal de Tenant (Temporal Scopes & Lookback)
  // =========================================================================
  describe('4. Resolución Temporal de Tenant y Lookback Seguro', () => {
    it('4.1 resolveAdSetTenant asigna el tenant según la vigencia de fechas del scope', () => {
      const clientA = new ObjectId();
      const clientB = new ObjectId();

      const scopes = [
        {
          clientId: clientA,
          adAccountId: 'act_100',
          allowedDatasetIds: ['pixel_1'],
          effectiveFrom: new Date('2026-08-01T00:00:00Z'),
          effectiveTo: new Date('2026-08-10T23:59:59Z'),
        },
        {
          clientId: clientB,
          adAccountId: 'act_100',
          allowedDatasetIds: ['pixel_1'],
          effectiveFrom: new Date('2026-08-11T00:00:00Z'),
          effectiveTo: null, // Scope activo actual
        },
      ];

      // Fecha dentro del rango de Empresa A (5 de Agosto)
      const tenantForAug5 = resolveAdSetTenant({
        adAccountId: 'act_100',
        datasetId: 'pixel_1',
        campaignId: null,
        dateStr: '2026-08-05',
        activeScopes: scopes,
        adAccounts: [],
        dataSources: [],
      });
      expect(tenantForAug5).toEqual(clientA);

      // Fecha dentro del rango de Empresa B (15 de Agosto)
      const tenantForAug15 = resolveAdSetTenant({
        adAccountId: 'act_100',
        datasetId: 'pixel_1',
        campaignId: null,
        dateStr: '2026-08-15',
        activeScopes: scopes,
        adAccounts: [],
        dataSources: [],
      });
      expect(tenantForAug15).toEqual(clientB);
    });

    it('4.2 resolveAdSetTenant fallback a cuenta exclusiva cuando no hay datasets ni manual scopes', () => {
      const exclusiveClient = new ObjectId();
      const adAccounts = [
        { adAccountId: 'act_exclusive', assignedClientId: exclusiveClient },
      ];

      const tenant = resolveAdSetTenant({
        adAccountId: 'act_exclusive',
        datasetId: null,
        campaignId: null,
        dateStr: '2026-08-20',
        activeScopes: [],
        adAccounts,
        dataSources: [],
      });

      expect(tenant).toEqual(exclusiveClient);
    });
  });

  // =========================================================================
  // 5. Simulación de Sync Worker, Idempotencia y Campañas Mixtas
  // =========================================================================
  describe('5. Simulación de Sync Worker, Idempotencia y Campañas Mixtas', () => {
    it('5.1 executeSyncJob se salta la ejecución con status skipped si Meta no está configurada', async () => {
      delete process.env.META_SYSTEM_USER_TOKEN;

      const mockDb = {
        collection: vi.fn(),
      };

      const result = await executeSyncJob(mockDb, { jobId: new ObjectId() });
      expect(result.status).toBe('skipped');
      expect(result.rowsUpserted).toBe(0);
    });

    it('5.2 executeSyncJob procesa insights por AdSet, detecta campañas mixtas y realiza upsert idempotente', async () => {
      const clientA = new ObjectId();
      const clientB = new ObjectId();

      const mockAdAccounts = [
        { adAccountId: 'act_shared_1', currency: 'ARS', assignedClientId: null, isSharedAccount: true },
      ];

      const mockScopes = [
        {
          clientId: clientA,
          adAccountId: 'act_shared_1',
          allowedDatasetIds: ['pixel_A'],
          effectiveFrom: new Date('2026-08-01T00:00:00Z'),
          effectiveTo: null,
        },
        {
          clientId: clientB,
          adAccountId: 'act_shared_1',
          allowedDatasetIds: ['pixel_B'],
          effectiveFrom: new Date('2026-08-01T00:00:00Z'),
          effectiveTo: null,
        },
      ];

      const mockDataSources = [
        { metaDatasetId: 'pixel_A', assignedClientId: clientA },
        { metaDatasetId: 'pixel_B', assignedClientId: clientB },
      ];

      const updateOneCalls = [];
      const mockInsightsCollection = {
        updateOne: vi.fn().mockImplementation((query, update, options) => {
          updateOneCalls.push({ query, update, options });
          return Promise.resolve({ upsertedId: new ObjectId() });
        }),
      };

      const mockCampaignsCollection = {
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      };

      const mockConflictsCollection = {
        updateOne: vi.fn().mockResolvedValue({ upsertedId: new ObjectId() }),
      };

      const mockSyncLogsCollection = {
        updateOne: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
      };

      const mockDb = {
        collection: (name) => {
          if (name === 'meta_ad_accounts') return { find: () => ({ toArray: () => Promise.resolve(mockAdAccounts) }), updateOne: vi.fn() };
          if (name === 'client_meta_scopes') return { find: () => ({ toArray: () => Promise.resolve(mockScopes) }) };
          if (name === 'meta_data_sources') return { find: () => ({ toArray: () => Promise.resolve(mockDataSources) }) };
          if (name === 'meta_insights_daily') return mockInsightsCollection;
          if (name === 'meta_campaigns') return mockCampaignsCollection;
          if (name === 'meta_adsets') return { updateOne: vi.fn() };
          if (name === 'meta_asset_conflicts') return mockConflictsCollection;
          if (name === 'meta_sync_logs') return mockSyncLogsCollection;
          return { find: () => ({ toArray: () => Promise.resolve([]) }), updateOne: vi.fn() };
        },
      };

      // Mock Meta API responses
      vi.spyOn(MetaApiClient.prototype, 'fetchAllPages').mockImplementation(async (endpoint) => {
        if (endpoint.includes('/campaigns')) {
          return [{ id: 'camp_mixed_1', name: 'Campaña Conjunta', status: 'ACTIVE' }];
        }
        if (endpoint.includes('/adsets')) {
          return [
            { id: 'adset_1', name: 'AdSet Cliente A', campaign_id: 'camp_mixed_1', promoted_object: { pixel_id: 'pixel_A' } },
            { id: 'adset_2', name: 'AdSet Cliente B', campaign_id: 'camp_mixed_1', promoted_object: { pixel_id: 'pixel_B' } },
          ];
        }
        if (endpoint.includes('/insights')) {
          return [
            {
              adset_id: 'adset_1',
              campaign_id: 'camp_mixed_1',
              date_start: '2026-08-20',
              spend: '5000.00',
              impressions: '10000',
              reach: '8000',
              clicks: '200',
              inline_link_clicks: '150',
              actions: [{ action_type: 'lead', value: '10' }],
            },
            {
              adset_id: 'adset_2',
              campaign_id: 'camp_mixed_1',
              date_start: '2026-08-20',
              spend: '3000.00',
              impressions: '6000',
              reach: '5000',
              clicks: '120',
              inline_link_clicks: '90',
              actions: [{ action_type: 'lead', value: '6' }],
            },
          ];
        }
        return [];
      });

      const result = await executeSyncJob(mockDb, { jobId: new ObjectId(), adAccountId: 'act_shared_1' });

      expect(result.status).toBe('completed');
      expect(result.rowsUpserted).toBe(2);

      // Verify that AdSet 1 was assigned to Client A and AdSet 2 to Client B
      expect(updateOneCalls[0].query.clientId).toEqual(clientA);
      expect(updateOneCalls[0].query.adsetId).toBe('adset_1');
      expect(updateOneCalls[0].update.$set.spendMinor).toBe(500000);

      expect(updateOneCalls[1].query.clientId).toEqual(clientB);
      expect(updateOneCalls[1].query.adsetId).toBe('adset_2');
      expect(updateOneCalls[1].update.$set.spendMinor).toBe(300000);

      // Verify mixed tenant conflict was detected and flagged
      expect(mockCampaignsCollection.updateOne).toHaveBeenCalledWith(
        { campaignId: 'camp_mixed_1' },
        expect.objectContaining({ $set: expect.objectContaining({ hasMultipleTenants: true }) })
      );
      expect(mockConflictsCollection.updateOne).toHaveBeenCalledWith(
        { conflictCode: 'MIXED_TENANT_CAMPAIGN', entityId: 'camp_mixed_1' },
        expect.any(Object),
        { upsert: true }
      );
    });
  });

  // =========================================================================
  // 6. Endpoints Serverless: Assets, Status, Reclassification & Cron Sync
  // =========================================================================
  describe('6. Endpoints Serverless: Assets, Status, Reclassification & Cron Sync', () => {
    const superAdminUser = {
      _id: new ObjectId(),
      email: 'superadmin@animamkt.com',
      role: 'super_admin',
    };

    it('6.1 GET /api/meta/status devuelve estado seguro sin exponer credenciales ni fragmentos de token', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: superAdminUser,
        isGlobal: true,
      });

      vi.spyOn(MetaApiClient.prototype, 'checkConnectionStatus').mockResolvedValueOnce({
        configured: true,
        connectionStatus: 'connected',
        apiVersion: 'v26.0',
        lastSuccessfulRequestAt: new Date().toISOString(),
        permissionsStatus: 'ads_read_active',
      });

      const res = await assetsHandler({
        httpMethod: 'GET',
        path: '/api/meta/status',
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.configured).toBe(true);
      expect(data.connectionStatus).toBe('connected');
      expect(data.apiVersion).toBe('v26.0');
      expect(data).not.toHaveProperty('token');
      expect(data).not.toHaveProperty('systemUserToken');
    });

    it('6.2 POST /api/meta/sync autenticado vía X-Cron-Auth rechaza métodos GET con 405', async () => {
      const res = await syncHandler({
        httpMethod: 'GET',
        path: '/api/meta/sync',
      });

      expect(res.statusCode).toBe(405);
    });

    it('6.3 POST /api/meta/sync rechaza x-cron-auth inválido con 403', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: false,
      });

      const res = await syncHandler({
        httpMethod: 'POST',
        path: '/api/meta/sync',
        headers: {
          'x-cron-auth': 'wrong_secret',
        },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // =========================================================================
  // 7. Endpoints Serverless: Insights, Atribución Estricta y Cobros por collectedAt
  // =========================================================================
  describe('7. Endpoints Serverless: Insights y Atribución CRM Estricta', () => {
    it('7.1 GET /api/meta/insights devuelve hasAttributionData: false si no hay leads atribuidos', async () => {
      const clientDocId = new ObjectId();
      const mockInsights = [
        {
          _id: { campaignId: 'camp_no_crm', currency: 'ARS' },
          spendMinor: 500000,
          impressions: 10000,
          clicks: 200,
          actions: [],
          actionValues: [],
          adsetsCount: ['adset_1'],
        },
      ];

      const mockDb = {
        collection: (name) => {
          if (name === 'meta_insights_daily') return { aggregate: () => ({ toArray: () => Promise.resolve(mockInsights) }) };
          if (name === 'meta_campaigns') return { find: () => ({ toArray: () => Promise.resolve([{ campaignId: 'camp_no_crm', name: 'Campaña Test' }]) }) };
          if (name === 'leads') return { countDocuments: () => Promise.resolve(0) }; // 0 leads atribuidos
          if (name === 'sales') return { find: () => ({ toArray: () => Promise.resolve([]) }) };
          if (name === 'clients') return { findOne: () => Promise.resolve({ _id: clientDocId, status: 'active' }) };
          return { find: () => ({ toArray: () => Promise.resolve([]) }), countDocuments: () => Promise.resolve(0) };
        },
      };

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
        db: mockDb,
      });

      const res = await insightsHandler({
        httpMethod: 'GET',
        path: '/api/meta/insights',
        queryStringParameters: { level: 'campaign', clientId: clientDocId.toString() },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      const campaign = data.results[0];
      expect(campaign.hasAttributionData).toBe(false);
      expect(campaign.crmAttributedLeads).toBeNull();
      expect(campaign.cplCrm).toBeNull();
      expect(campaign.roasCollected).toBeNull();
    });

    it('7.2 GET /api/meta/insights calcula ROAS atribuido filtrando cobros por payments.collectedAt', async () => {
      const clientDocId = new ObjectId();
      const mockInsights = [
        {
          _id: { campaignId: 'camp_with_crm', currency: 'ARS' },
          spendMinor: 1000000, // $10,000.00
          impressions: 20000,
          clicks: 500,
          actions: [],
          actionValues: [],
          adsetsCount: ['adset_1'],
        },
      ];

      const mockSales = [
        {
          _id: new ObjectId(),
          metaCampaignId: 'camp_with_crm',
          currency: 'ARS',
          status: 'won',
          payments: [
            { amountMinor: 2000000, collectedAt: new Date('2026-08-15T10:00:00Z') }, // $20,000.00 dentro del rango
          ],
        },
      ];

      const mockDb = {
        collection: (name) => {
          if (name === 'meta_insights_daily') return { aggregate: () => ({ toArray: () => Promise.resolve(mockInsights) }) };
          if (name === 'meta_campaigns') return { find: () => ({ toArray: () => Promise.resolve([{ campaignId: 'camp_with_crm', name: 'Campaña Exitosa' }]) }) };
          if (name === 'leads') return { countDocuments: () => Promise.resolve(5) }; // 5 leads atribuidos
          if (name === 'sales') return { find: () => ({ toArray: () => Promise.resolve(mockSales) }) };
          if (name === 'clients') return { findOne: () => Promise.resolve({ _id: clientDocId, status: 'active' }) };
          return { find: () => ({ toArray: () => Promise.resolve([]) }), countDocuments: () => Promise.resolve(0) };
        },
      };

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
        db: mockDb,
      });

      const res = await insightsHandler({
        httpMethod: 'GET',
        path: '/api/meta/insights',
        queryStringParameters: {
          level: 'campaign',
          clientId: clientDocId.toString(),
          dateStart: '2026-08-01',
          dateStop: '2026-08-31',
        },
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      const campaign = data.results[0];
      expect(campaign.hasAttributionData).toBe(true);
      expect(campaign.crmAttributedLeads).toBe(5);
      expect(campaign.cplCrm).toBe(2000.00); // 10,000 / 5
      expect(campaign.crmAttributedSales).toBe(1);
      expect(campaign.cpaCrm).toBe(10000.00); // 10,000 / 1
      expect(campaign.roasCollected).toBe(2.00); // 20,000 / 10,000
    });
  });

  // =========================================================================
  // 8. Pruebas Adicionales Correctivas (Etapa 4 - Nuevos Casos Requeridos)
  // =========================================================================
  describe('8. Pruebas Adicionales Correctivas (Etapa 4 - Nuevos Casos)', () => {
    it('8.1 Sanitizadores: assetsHandler importa y carga sin errores', async () => {
      const mockCursor = {
        sort: () => mockCursor,
        toArray: () => Promise.resolve([]),
      };
      const mockDb = {
        collection: () => {
          return {
            find: () => mockCursor,
          };
        },
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
        db: mockDb,
      });

      const res = await assetsHandler({
        httpMethod: 'GET',
        path: '/api/meta/assets',
      });
      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.adAccounts)).toBe(true);
      expect(Array.isArray(data.dataSources)).toBe(true);
    });

    it('8.2 appsecret_proof: fórmula determinista exacta', () => {
      const dummyToken = 'token_123';
      const dummySecret = 'secret_abc_32_chars_long_12345678';
      const expectedHmac = crypto.createHmac('sha256', dummySecret).update(dummyToken).digest('hex');
      const calculated = generateAppSecretProof(dummyToken, dummySecret);
      expect(calculated).toBe(expectedHmac);
    });

    it('8.3 Aislamiento: usuario de Empresa A no puede listar activos de Empresa B', async () => {
      const clientA = new ObjectId();

      const mockCursor = {
        sort: () => mockCursor,
        toArray: () => Promise.resolve([]),
      };
      const mockDb = {
        collection: (name) => {
          if (name === 'client_meta_scopes') {
            return {
              find: (query) => {
                expect(query.clientId).toEqual(clientA);
                return { toArray: () => Promise.resolve([]) };
              }
            };
          }
          return {
            find: () => mockCursor,
          };
        },
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: { _id: new ObjectId(), role: 'client', clientId: clientA },
        isGlobal: false,
        clientScope: clientA,
        db: mockDb,
      });

      const res = await assetsHandler({
        httpMethod: 'GET',
        path: '/api/meta/assets',
      });
      expect(res.statusCode).toBe(200);
    });

    it('8.4 Aislamiento: usuario de Empresa A no puede consultar insights de Empresa B', async () => {
      const clientA = new ObjectId();
      const clientB = new ObjectId();

      const mockDb = {
        collection: (name) => {
          if (name === 'meta_insights_daily') {
            return {
              aggregate: (pipeline) => {
                const matchStage = pipeline[0].$match;
                expect(matchStage.clientId).toEqual(clientA);
                return { toArray: () => Promise.resolve([]) };
              }
            };
          }
          return {
            find: () => ({
              toArray: () => Promise.resolve([]),
            }),
            findOne: () => Promise.resolve({ _id: clientA, status: 'active' }),
          };
        },
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: { _id: new ObjectId(), role: 'client', clientId: clientA },
        isGlobal: false,
        clientScope: clientA,
        db: mockDb,
      });

      const res = await insightsHandler({
        httpMethod: 'GET',
        path: '/api/meta/insights',
        queryStringParameters: { clientId: clientB.toString() },
      });
      expect(res.statusCode).toBe(200);
    });

    it('8.5 Background Sync: dispatcher retorna 202 inmediatamente y no espera al worker', async () => {
      const superAdminUser = { _id: new ObjectId(), role: 'super_admin' };
      const jobId = new ObjectId();

      const mockDb = {
        collection: () => {
          return {
            findOne: () => Promise.resolve(null),
            insertOne: () => Promise.resolve({ insertedId: jobId }),
            updateOne: () => Promise.resolve({}),
            updateMany: () => Promise.resolve({ modifiedCount: 0 }),
          };
        },
      };
      activeMockDb = mockDb;

      process.env.URL = 'https://example.netlify.app';

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: superAdminUser,
        isGlobal: true,
        db: mockDb,
      });

      const globalFetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        status: 202,
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      const res = await syncHandler({
        httpMethod: 'POST',
        path: '/api/meta/sync',
        rawUrl: 'https://example.netlify.app/.netlify/functions/api-meta-sync',
        body: JSON.stringify({ adAccountId: 'act_123' }),
      });

      expect(res.statusCode).toBe(202);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.message).toContain('iniciada en segundo plano');
      expect(globalFetchSpy).toHaveBeenCalled();
    });

    it('8.6 Reclasificación: solo super_admin puede reasignar datos', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: { _id: new ObjectId(), role: 'admin' },
        isGlobal: true,
      });

      const res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/reclassify-historical',
        body: JSON.stringify({ action: 'preview' }),
      });

      expect(res.statusCode).toBe(403);
    });

    it('8.7 datasets: endpoint blocked en allowlist', () => {
      expect(isVerifiedMetaEndpoint('123456/datasets')).toBe(false);
    });

    it('8.8 Insights: requiere obligatoriamente clientId para global admin', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
      });

      const res = await insightsHandler({
        httpMethod: 'GET',
        path: '/api/meta/insights',
        queryStringParameters: {},
      });

      expect(res.statusCode).toBe(400);
      const data = JSON.parse(res.body);
      expect(data.code).toBe('CLIENT_ID_REQUIRED');
    });

    it('8.9 URL Injection: event.rawUrl es ignorado y fetch utiliza process.env.URL', async () => {
      const superAdminUser = { _id: new ObjectId(), role: 'super_admin' };
      const jobId = new ObjectId();

      const mockDb = {
        collection: () => ({
          findOne: () => Promise.resolve(null),
          insertOne: () => Promise.resolve({ insertedId: jobId }),
          updateOne: () => Promise.resolve({}),
          updateMany: () => Promise.resolve({ modifiedCount: 0 }),
        }),
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValueOnce({
        authorized: true,
        user: superAdminUser,
        isGlobal: true,
        db: mockDb,
      });

      process.env.URL = 'https://trusted-server.netlify.app';

      const globalFetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        status: 202,
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      const res = await syncHandler({
        httpMethod: 'POST',
        path: '/api/meta/sync',
        rawUrl: 'https://user-injected-malicious-domain.com/some-path',
        body: JSON.stringify({ adAccountId: 'act_123' }),
      });

      expect(res.statusCode).toBe(202);
      expect(globalFetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('https://trusted-server.netlify.app/.netlify/functions/meta-sync-background'),
        expect.anything()
      );
    });

    it('8.10 Concurrencia: doble adquisición atómica del mismo jobId ejecuta el worker una sola vez', async () => {
      const jobId = new ObjectId();
      let currentStatus = 'queued';
      let updateCallsCount = 0;

      const mockDb = {
        collection: (name) => {
          if (name === 'meta_sync_logs') {
            return {
              findOne: () => Promise.resolve({ _id: jobId, status: currentStatus, adAccountId: 'act_123', lookbackDays: 7 }),
              findOneAndUpdate: vi.fn().mockImplementation((query) => {
                if (query._id.equals(jobId) && query.status === 'queued' && currentStatus === 'queued') {
                  currentStatus = 'in_progress';
                  updateCallsCount++;
                  return Promise.resolve({
                    value: { _id: jobId, status: 'in_progress', adAccountId: 'act_123', lookbackDays: 7 },
                  });
                }
                return Promise.resolve(null);
              }),
              updateOne: () => Promise.resolve({}),
            };
          }
          return {
            find: () => ({ toArray: () => Promise.resolve([]) }),
          };
        },
      };
      activeMockDb = mockDb;

      await backgroundHandler({
        headers: { 'X-Cron-Auth': 'super_secret_cron_token_32_chars_long' },
        body: JSON.stringify({ jobId: jobId.toString() }),
      });

      await backgroundHandler({
        headers: { 'X-Cron-Auth': 'super_secret_cron_token_32_chars_long' },
        body: JSON.stringify({ jobId: jobId.toString() }),
      });

      expect(updateCallsCount).toBe(1);
    });

    it('8.11 Preservación Histórica: asignación posterior a Empresa B no modifica el clientId histórico de Empresa A', async () => {
      const clientA = new ObjectId();
      const clientB = new ObjectId();

      const scopes = [
        {
          clientId: clientA,
          adAccountId: 'act_shared_1',
          allowedDatasetIds: ['pixel_1'],
          effectiveFrom: new Date('2026-08-01T00:00:00Z'),
          effectiveTo: new Date('2026-08-10T23:59:59Z'),
        },
        {
          clientId: clientB,
          adAccountId: 'act_shared_1',
          allowedDatasetIds: ['pixel_1'],
          effectiveFrom: new Date('2026-08-11T00:00:00Z'),
          effectiveTo: null,
        },
      ];

      const mockAdAccounts = [
        { adAccountId: 'act_shared_1', currency: 'ARS', assignedClientId: null, isSharedAccount: true },
      ];

      const mockDataSources = [
        { metaDatasetId: 'pixel_1', assignedClientId: null },
      ];

      const upsertedInsights = [];

      const mockDb = {
        collection: (name) => {
          if (name === 'meta_ad_accounts') return { find: () => ({ toArray: () => Promise.resolve(mockAdAccounts) }), updateOne: vi.fn() };
          if (name === 'client_meta_scopes') return { find: () => ({ toArray: () => Promise.resolve(scopes) }) };
          if (name === 'meta_data_sources') return { find: () => ({ toArray: () => Promise.resolve(mockDataSources) }) };
          if (name === 'meta_insights_daily') {
            return {
              updateOne: vi.fn().mockImplementation((query, update) => {
                const doc = {
                  clientId: query.clientId,
                  date: query.date,
                  adsetId: query.adsetId,
                  spendMinor: update.$set?.spendMinor || 0,
                };
                upsertedInsights.push(doc);
                return Promise.resolve({ upsertedId: new ObjectId() });
              }),
            };
          }
          return {
            find: () => ({ toArray: () => Promise.resolve([]) }),
            updateOne: vi.fn(),
          };
        },
      };
      activeMockDb = mockDb;

      vi.spyOn(MetaApiClient.prototype, 'fetchAllPages').mockImplementation(async (endpoint) => {
        if (endpoint.includes('/campaigns')) {
          return [{ id: 'camp_1', name: 'Campaña Compartida', status: 'ACTIVE' }];
        }
        if (endpoint.includes('/adsets')) {
          return [{ id: 'adset_1', name: 'AdSet Compartido', campaign_id: 'camp_1', promoted_object: { pixel_id: 'pixel_1' } }];
        }
        if (endpoint.includes('/insights')) {
          return [
            {
              adset_id: 'adset_1',
              campaign_id: 'camp_1',
              date_start: '2026-08-05',
              spend: '300.00',
              impressions: '1000',
              clicks: '50',
            },
            {
              adset_id: 'adset_1',
              campaign_id: 'camp_1',
              date_start: '2026-08-15',
              spend: '700.00',
              impressions: '2000',
              clicks: '100',
            },
          ];
        }
        return [];
      });

      await executeSyncJob(mockDb, {
        jobId: new ObjectId(),
        adAccountId: 'act_shared_1',
        lookbackDays: 30,
      });

      const insightAug5 = upsertedInsights.find(x => x.date === '2026-08-05');
      expect(insightAug5).toBeDefined();
      expect(insightAug5.clientId).toEqual(clientA);

      const insightAug15 = upsertedInsights.find(x => x.date === '2026-08-15');
      expect(insightAug15).toBeDefined();
      expect(insightAug15.clientId).toEqual(clientB);
    });
  });

  // =========================================================================
  // 9. Endurecimiento Técnico, Kill Switch y Validación Manual (Fase 5A)
  // =========================================================================
  describe('9. Endurecimiento Técnico, Kill Switch y Validación Manual (Fase 5A)', () => {
    it('9.1 GET /api/meta/status no contiene fragmentos ni partes del token o secretos y retorna booleanos correctos', async () => {
      process.env.META_MANUAL_SYNC_ENABLED = 'false';

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
      });

      const res = await assetsHandler({
        httpMethod: 'GET',
        path: '/api/meta/status',
      });

      expect(res.statusCode).toBe(200);
      const data = JSON.parse(res.body);
      expect(data.ok).toBe(true);
      expect(data.hasAppId).toBe(true);
      expect(data.hasAppSecret).toBe(true);
      expect(data.hasSystemUserToken).toBe(true);
      expect(data.hasBusinessId).toBe(true);
      expect(data.hasCronSecret).toBe(true);
      expect(data.manualSyncEnabled).toBe(false);

      // Garantizar que no se fugue ningún fragmento o token completo
      const bodyStr = res.body;
      expect(bodyStr).not.toContain('EAAB_test');
      expect(bodyStr).not.toContain('test_meta_app_secret');
    });

    it('9.2 POST /api/meta/sync rechaza trigger manual con 503 si META_MANUAL_SYNC_ENABLED es false o no definido', async () => {
      process.env.META_MANUAL_SYNC_ENABLED = 'false';

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
      });

      const res = await syncHandler({
        httpMethod: 'POST',
        path: '/api/meta/sync',
        body: JSON.stringify({ adAccountId: 'act_111111111111111' }),
      });

      expect(res.statusCode).toBe(503);
      const data = JSON.parse(res.body);
      expect(data.code).toBe('META_MANUAL_SYNC_DISABLED');
      expect(data.error).toContain('desactivada');
      expect(res.body).not.toContain('EAAB_test');
    });

    it('9.3 POST /api/meta/sync permite trigger manual si META_MANUAL_SYNC_ENABLED es true y es super_admin', async () => {
      process.env.META_MANUAL_SYNC_ENABLED = 'true';
      process.env.URL = 'https://trusted-server.netlify.app';

      const mockDb = {
        collection: () => ({
          updateMany: () => Promise.resolve({}),
          findOne: () => Promise.resolve(null),
          insertOne: () => Promise.resolve({ insertedId: new ObjectId() }),
        }),
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
        db: mockDb,
      });

      // Mock the netlify dispatcher fetch
      vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 202,
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      const res = await syncHandler({
        httpMethod: 'POST',
        path: '/api/meta/sync',
        body: JSON.stringify({ adAccountId: 'act_111111111111111' }),
      });

      expect(res.statusCode).toBe(202);
    });

    it('9.4 POST /api/meta/sync rechaza trigger manual si META_MANUAL_SYNC_ENABLED es true pero el usuario no es super_admin', async () => {
      process.env.META_MANUAL_SYNC_ENABLED = 'true';

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'salesperson' },
        isGlobal: false,
      });

      const res = await syncHandler({
        httpMethod: 'POST',
        path: '/api/meta/sync',
        body: JSON.stringify({ adAccountId: 'act_111111111111111' }),
      });

      expect(res.statusCode).toBe(403);
      const data = JSON.parse(res.body);
      expect(data.code).toBe('FORBIDDEN');
    });

    it('9.5 POST /api/meta/sync permite trigger de cron independiente del flag manual', async () => {
      process.env.META_MANUAL_SYNC_ENABLED = 'false';
      process.env.URL = 'https://trusted-server.netlify.app';

      const mockDb = {
        collection: () => ({
          updateMany: () => Promise.resolve({}),
          findOne: () => Promise.resolve(null),
          insertOne: () => Promise.resolve({ insertedId: new ObjectId() }),
        }),
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: false,
      });

      vi.spyOn(global, 'fetch').mockResolvedValue({
        status: 202,
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      });

      const res = await syncHandler({
        httpMethod: 'POST',
        path: '/api/meta/sync',
        headers: {
          'X-Cron-Auth': 'super_secret_cron_token_32_chars_long',
        },
        body: JSON.stringify({ adAccountId: 'act_111111111111111' }),
      });

      expect(res.statusCode).toBe(202);
    });

    it('9.6 POST /api/meta/assets/manual registra cuenta/dataset válidos, normaliza y valida formatos estrictos', async () => {
      const mockAdAccounts = [];
      const mockDataSources = [];

      const mockDb = {
        collection: (name) => {
          if (name === 'meta_ad_accounts') {
            return {
              findOne: () => Promise.resolve(null),
              insertOne: (doc) => {
                mockAdAccounts.push(doc);
                return Promise.resolve({ insertedId: new ObjectId() });
              },
            };
          }
          if (name === 'meta_data_sources') {
            return {
              findOne: () => Promise.resolve(null),
              insertOne: (doc) => {
                mockDataSources.push(doc);
                return Promise.resolve({ insertedId: new ObjectId() });
              },
            };
          }
          return {};
        },
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
        db: mockDb,
      });

      // 1. Valid registration of ad account
      let res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assets/manual',
        body: JSON.stringify({
          type: 'ad_account',
          id: '111111111111111',
          name: 'Mi Cuenta Realista',
          currency: 'USD',
        }),
      });
      expect(res.statusCode).toBe(201);
      expect(mockAdAccounts[0].adAccountId).toBe('act_111111111111111');
      expect(mockAdAccounts[0]).not.toHaveProperty('appSecret');
      expect(mockAdAccounts[0]).not.toHaveProperty('token');

      // 2. Reject letters where digits are expected
      res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assets/manual',
        body: JSON.stringify({
          type: 'ad_account',
          id: '11111abc11111',
          name: 'Cuenta Inválida',
        }),
      });
      expect(res.statusCode).toBe(400);

      // 3. Reject spaces
      res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assets/manual',
        body: JSON.stringify({
          type: 'ad_account',
          id: '1111 1111',
          name: 'Cuenta Con Espacios',
        }),
      });
      expect(res.statusCode).toBe(400);

      // 4. Reject URLs
      res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assets/manual',
        body: JSON.stringify({
          type: 'ad_account',
          id: 'https://graph.facebook.com/123',
          name: 'Cuenta URL',
        }),
      });
      expect(res.statusCode).toBe(400);

      // 5. Reject objects in id (MongoDB Injection check)
      res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assets/manual',
        body: JSON.stringify({
          type: 'ad_account',
          id: { $gt: '' },
          name: 'Cuenta Inyección',
        }),
      });
      expect(res.statusCode).toBe(400);

      // 6. Reject empty IDs
      res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assets/manual',
        body: JSON.stringify({
          type: 'ad_account',
          id: '',
          name: 'Cuenta Vacía',
        }),
      });
      expect(res.statusCode).toBe(400);

      // 7. Reject excessively long IDs
      res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assets/manual',
        body: JSON.stringify({
          type: 'ad_account',
          id: '111111111111111111111111111111',
          name: 'Cuenta Larga',
        }),
      });
      expect(res.statusCode).toBe(400);
    });

    it('9.7 POST /api/meta/assign detecta conflicto de dataset asignado a otra empresa', async () => {
      const clientA = new ObjectId();
      const clientB = new ObjectId();

      const mockDb = {
        collection: (name) => {
          if (name === 'clients') {
            return {
              findOne: () => Promise.resolve({ _id: clientA, status: 'active' }),
            };
          }
          if (name === 'meta_data_sources') {
            return {
              find: () => ({
                toArray: () => Promise.resolve([
                  { metaDatasetId: '222222222222222', assignedClientId: clientB },
                ]),
              }),
            };
          }
          return {};
        },
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
        db: mockDb,
      });

      const res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assign',
        body: JSON.stringify({
          clientId: clientA.toString(),
          adAccountId: 'act_111111111111111',
          allowedDatasetIds: ['222222222222222'],
          assignmentReason: 'Motivo de prueba obligatorio de 5 chars',
        }),
      });

      expect(res.statusCode).toBe(409);
      const data = JSON.parse(res.body);
      expect(data.code).toBe('DATA_SOURCE_ALREADY_ASSIGNED');
    });

    it('9.8 POST /api/meta/sync rechaza valores alternativos no estrictos en META_MANUAL_SYNC_ENABLED', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
      });

      for (const val of ['TRUE', '1', 'yes', ' true ', 'enabled']) {
        process.env.META_MANUAL_SYNC_ENABLED = val;
        const res = await syncHandler({
          httpMethod: 'POST',
          path: '/api/meta/sync',
          body: JSON.stringify({ adAccountId: 'act_111111111111111' }),
        });
        expect(res.statusCode).toBe(503);
      }
    });

    it('9.9 POST /api/meta/sync rechaza usuario suspendido o inactivo', async () => {
      process.env.META_MANUAL_SYNC_ENABLED = 'true';
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: false,
        error: 'Usuario suspendido.',
        statusCode: 403,
      });

      const res = await syncHandler({
        httpMethod: 'POST',
        path: '/api/meta/sync',
        body: JSON.stringify({ adAccountId: 'act_111111111111111' }),
      });
      expect(res.statusCode).toBe(403);
    });

    it('9.10 POST /api/meta/assets/manual ignora campos inesperados en el payload', async () => {
      const mockAdAccounts = [];
      const mockDb = {
        collection: () => ({
          findOne: () => Promise.resolve(null),
          insertOne: (doc) => {
            mockAdAccounts.push(doc);
            return Promise.resolve({ insertedId: new ObjectId() });
          },
        }),
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
        db: mockDb,
      });

      const res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assets/manual',
        body: JSON.stringify({
          type: 'ad_account',
          id: '111111111111111',
          name: 'Mi Cuenta',
          unexpected_field: 'malicious_content',
        }),
      });

      expect(res.statusCode).toBe(201);
      expect(mockAdAccounts[0]).not.toHaveProperty('unexpected_field');
      expect(mockAdAccounts[0]).not.toHaveProperty('appSecret');
      expect(mockAdAccounts[0]).not.toHaveProperty('token');
    });

    it('9.11 POST /api/meta/assets/manual rechaza usuarios sin rol super_admin', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'salesperson' },
        isGlobal: false,
      });

      const res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assets/manual',
        body: JSON.stringify({
          type: 'ad_account',
          id: '111111111111111',
        }),
      });
      expect(res.statusCode).toBe(403);
    });

    it('9.12 POST /api/meta/assign rechaza usuarios sin rol super_admin', async () => {
      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'salesperson' },
        isGlobal: false,
      });

      const res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assign',
        body: JSON.stringify({
          clientId: new ObjectId().toString(),
          adAccountId: 'act_111111111111111',
        }),
      });
      expect(res.statusCode).toBe(403);
    });

    it('9.13 POST /api/meta/assign archiva scopes activos anteriores para el mismo cliente y cuenta', async () => {
      const clientA = new ObjectId();
      let archived = false;

      const mockDb = {
        collection: (name) => {
          if (name === 'clients') {
            return { findOne: () => Promise.resolve({ _id: clientA, status: 'active' }) };
          }
          if (name === 'meta_data_sources') {
            return {
              find: () => ({ toArray: () => Promise.resolve([]) }),
              updateMany: () => Promise.resolve({ modifiedCount: 1 }),
            };
          }
          if (name === 'client_meta_scopes') {
            return {
              updateMany: (query, update) => {
                if (query.clientId.equals(clientA) && query.adAccountId === 'act_111111111111111' && query.status === 'active' && update.$set.status === 'archived') {
                  archived = true;
                }
                return Promise.resolve({ modifiedCount: 1 });
              },
              insertOne: () => Promise.resolve({ insertedId: new ObjectId() }),
            };
          }
          return { updateOne: () => Promise.resolve({}) };
        },
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: new ObjectId(), role: 'super_admin' },
        isGlobal: true,
        db: mockDb,
      });

      const res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assign',
        body: JSON.stringify({
          clientId: clientA.toString(),
          adAccountId: 'act_111111111111111',
          allowedDatasetIds: ['222222222222222'],
          assignmentReason: 'Motivo de prueba obligatorio de 5 chars',
        }),
      });

      expect(res.statusCode).toBe(201);
      expect(archived).toBe(true);
    });

    it('9.14 POST /api/meta/assign registra metadatos de auditoría en el scope creado', async () => {
      const clientA = new ObjectId();
      const userId = new ObjectId();
      let savedScope = null;

      const mockDb = {
        collection: (name) => {
          if (name === 'clients') {
            return { findOne: () => Promise.resolve({ _id: clientA, status: 'active' }) };
          }
          if (name === 'meta_data_sources') {
            return {
              find: () => ({ toArray: () => Promise.resolve([]) }),
              updateMany: () => Promise.resolve({ modifiedCount: 1 }),
            };
          }
          if (name === 'client_meta_scopes') {
            return {
              updateMany: () => Promise.resolve({}),
              insertOne: (doc) => {
                savedScope = doc;
                return Promise.resolve({ insertedId: new ObjectId() });
              },
            };
          }
          return { updateOne: () => Promise.resolve({}) };
        },
      };
      activeMockDb = mockDb;

      vi.spyOn(PermissionsModule, 'verifyAuthorizedUser').mockResolvedValue({
        authorized: true,
        user: { _id: userId, role: 'super_admin' },
        isGlobal: true,
        db: mockDb,
      });

      const res = await assetsHandler({
        httpMethod: 'POST',
        path: '/api/meta/assign',
        body: JSON.stringify({
          clientId: clientA.toString(),
          adAccountId: 'act_111111111111111',
          allowedDatasetIds: ['222222222222222'],
          assignmentReason: 'Motivo de prueba obligatorio de 5 chars',
        }),
      });

      expect(res.statusCode).toBe(201);
      expect(savedScope).toBeDefined();
      expect(savedScope.assignedByUserId).toEqual(userId);
      expect(savedScope.assignmentReason).toBe('Motivo de prueba obligatorio de 5 chars');
      expect(savedScope.effectiveFrom).toBeInstanceOf(Date);
    });

    it('9.15 El workflow de GitHub Actions usa vars.APP_URL y secrets.CRON_SECRET', async () => {
      const fs = await import('node:fs');
      const path = await import('node:path');
      const yamlPath = path.join(process.cwd(), '.github/workflows/meta-sync-cron.yml');
      const content = fs.readFileSync(yamlPath, 'utf8');

      expect(content).toContain('vars.APP_URL');
      expect(content).toContain('secrets.CRON_SECRET');
      expect(content).not.toContain('secrets.APP_URL');
      expect(content).toContain('if [ "$ENABLED" != "true" ]; then');
      expect(content).toContain('exit 0');
      expect(content).toContain('if [ -z "${{ secrets.CRON_SECRET }}" ] || [ -z "${{ vars.APP_URL }}" ]; then');
      expect(content).toContain('exit 1');
    });
  });
});
