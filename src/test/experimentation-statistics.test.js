import { describe, it, expect } from 'vitest';
import {
  calculateABStatistics,
  listExperimentsService,
  createExperimentService,
} from '../../netlify/functions/_shared/decisionEngine/experimentationService.js';
import { sanitizeBusinessExperiment } from '../../models/BusinessExperiment.js';

describe('Stage 20 — ANIMA Experiments: Statistical A/B Testing Engine', () => {
  it('1. Descarta significancia y mantiene estado RUNNING cuando el tamaño de muestra es insuficiente (< 1.000 impresiones)', () => {
    const stats = calculateABStatistics({
      control: { impressions: 450, conversions: 12 },
      variant: { impressions: 480, conversions: 24 },
      metric: 'ROAS',
    });

    expect(stats.sampleSizeReached).toBe(false);
    expect(stats.isSignificant).toBe(false);
    expect(stats.status).toBe('RUNNING');
    expect(stats.winnerAssetId).toBeNull();
  });

  it('2. Declara WINNER y calcula p-value < 0.05 con confianza >= 95% ante diferencia estadísticamente concluyente', () => {
    const stats = calculateABStatistics({
      control: { assetId: 'ctrl_01', impressions: 12000, conversions: 180 },
      variant: { assetId: 'var_01', impressions: 12500, conversions: 310 },
      metric: 'ROAS',
    });

    expect(stats.sampleSizeReached).toBe(true);
    expect(stats.isSignificant).toBe(true);
    expect(stats.pValue).toBeLessThan(0.05);
    expect(stats.confidenceLevel).toBeGreaterThanOrEqual(0.95);
    expect(stats.status).toBe('WINNER');
    expect(stats.winnerAssetId).toBe('var_01');
    expect(stats.relativeLiftPct).toBeGreaterThan(50);
  });

  it('3. Declara INCONCLUSIVE cuando se alcanza la muestra pero no hay significancia estadística (p-value >= 0.05)', () => {
    const stats = calculateABStatistics({
      control: { assetId: 'ctrl_01', impressions: 5000, conversions: 100 },
      variant: { assetId: 'var_01', impressions: 5050, conversions: 102 },
      metric: 'CPL',
    });

    expect(stats.sampleSizeReached).toBe(true);
    expect(stats.isSignificant).toBe(false);
    expect(stats.pValue).toBeGreaterThanOrEqual(0.05);
    expect(stats.status).toBe('INCONCLUSIVE');
  });

  it('4. listExperimentsService y createExperimentService retornan modelos sanitizados tenant-isolated', async () => {
    const mockDb = {
      collection: () => ({
        find: () => ({ toArray: async () => [] }),
        insertOne: async (doc) => ({ insertedId: 'mock_exp_id', ...doc }),
      }),
    };

    const experiments = await listExperimentsService({
      clientId: '65df44444444444444444444',
      db: mockDb,
    });

    expect(Array.isArray(experiments)).toBe(true);
    expect(experiments.length).toBeGreaterThan(0);
    expect(experiments[0].statisticalSignificance.pValue).toBeDefined();

    const created = await createExperimentService({
      clientId: '65df44444444444444444444',
      experimentData: {
        name: 'Test de Gancho: Fricción vs Oferta',
        hypothesis: 'Mostrar el precio antes bajará el CPL',
        controlAsset: { impressions: 2000, conversions: 30 },
        variantAsset: { impressions: 2200, conversions: 65 },
      },
      db: mockDb,
    });

    expect(created.name).toBe('Test de Gancho: Fricción vs Oferta');
    expect(created.status).toBe('WINNER');
  });
});
