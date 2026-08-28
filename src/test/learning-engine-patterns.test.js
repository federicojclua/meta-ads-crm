import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  extractPerformancePatternsService,
  generateCreativeStudioPreset,
} from '../../netlify/functions/_shared/learningEngine/learningEngineService.js';
import { sanitizePatternMemory } from '../../models/PatternMemory.js';

describe('Stage 19 — ANIMA Learning Engine Pattern Recognition Tests', () => {
  const mockTenantId = new ObjectId('65df11111111111111111111');

  it('1. extractPerformancePatternsService identifica patrones de Winning DNA, Losing DNA y Fatiga', async () => {
    const res = await extractPerformancePatternsService({
      clientId: mockTenantId,
    });

    expect(res.patterns.length).toBeGreaterThanOrEqual(3);
    expect(res.summary.winningCount).toBeGreaterThanOrEqual(1);
    expect(res.summary.losingCount).toBeGreaterThanOrEqual(1);
    expect(res.summary.fatigueAlerts).toBeGreaterThanOrEqual(1);

    const winning = res.patterns.find((p) => p.patternType === 'WINNING');
    expect(winning).toBeDefined();
    expect(winning.metrics.avgRoas).toBeGreaterThan(3.0);
    expect(winning.metrics.liftVsAveragePct).toBeGreaterThan(20);
    expect(winning.statisticalConfidence).toBeGreaterThanOrEqual(0.85);

    const losing = res.patterns.find((p) => p.patternType === 'LOSING');
    expect(losing).toBeDefined();
    expect(losing.metrics.liftVsAveragePct).toBeLessThan(0);
  });

  it('2. generateCreativeStudioPreset crea un brief optimizado a partir de un Winning Pattern', () => {
    const mockPattern = {
      id: 'pat_win_01',
      headline: 'Winning DNA: Video Reel 9:16 + Hook Problema',
      featureCombination: {
        hookType: 'question_problem',
        format: '9:16',
        offerType: 'value_bundle',
      },
    };

    const preset = generateCreativeStudioPreset({ pattern: mockPattern });

    expect(preset.campaignName).toContain('Winning DNA');
    expect(preset.formats).toContain('9:16');
    expect(preset.brief.mainMessage).toContain('equipo de trabajo se traba');
    expect(preset.appliedPatternId).toBe(mockPattern.id);
  });

  it('3. sanitizePatternMemory valida campos y asegura métricas numéricas', () => {
    const doc = {
      _id: '65df33333333333333333333',
      patternType: 'WINNING',
      metrics: {
        avgRoas: 4.2,
        totalSpend: 150000,
      },
    };

    const sanitized = sanitizePatternMemory(doc);
    expect(sanitized.id).toBe('65df33333333333333333333');
    expect(sanitized.metrics.avgRoas).toBe(4.2);
    expect(sanitized.metrics.totalSpend).toBe(150000);
    expect(sanitized.patternType).toBe('WINNING');
  });
});
