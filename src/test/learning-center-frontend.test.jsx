import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LearningCenterPage } from '../pages/LearningCenterPage';

describe('Stage 19 — Frontend Learning Center UI Tests', () => {
  const mockInsights = {
    ok: true,
    patterns: [
      {
        id: 'pat_01',
        patternType: 'WINNING',
        headline: 'Winning DNA: Video Reel 9:16 + Hook Problema',
        featureCombination: {
          format: '9:16',
          hookType: 'question_problem',
          offerType: 'value_bundle',
          presenterType: 'ai_avatar',
        },
        metrics: {
          avgRoas: 4.3,
          avgCpl: 980,
          avgTrueProfit: 427499,
          salesClosed: 28,
          liftVsAveragePct: 42.5,
        },
        statisticalConfidence: 0.96,
        diagnosis: 'Los videos verticales generan un 42.5% más de True Profit.',
        prescriptiveAction: 'Replicar el formato 9:16 con Avatar IA.',
        appliedCount: 5,
      },
      {
        id: 'pat_02',
        patternType: 'FATIGUE_WARNING',
        headline: 'Alerta de Fatiga Creativa: Feed 1:1 Scarcity',
        featureCombination: {
          format: '1:1',
          hookType: 'scarcity',
          offerType: 'direct_discount',
        },
        metrics: {
          avgRoas: 2.1,
          avgCpl: 2100,
          totalSpend: 210000,
          liftVsAveragePct: -26.5,
        },
        statisticalConfidence: 0.94,
        diagnosis: 'Frecuencia superior a 3.9.',
        prescriptiveAction: 'Renovar el concepto visual.',
      },
    ],
    summary: {
      totalAnalyzed: 4,
      winningCount: 1,
      losingCount: 0,
      fatigueAlerts: 1,
      avgRoasLiftPct: 42.5,
      overallDiagnosis: 'El 78% del True Profit proviene de formatos verticales 9:16.',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.url || '';

      if (urlStr.includes('/api/learning-engine/insights')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => mockInsights,
          text: async () => JSON.stringify(mockInsights),
        });
      }

      if (urlStr.includes('/api/learning-engine/apply-to-creative-studio')) {
        const payload = { ok: true, preset: { campaignName: 'Winning Camp' } };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        });
      }

      const payload = { ok: true };
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      });
    });
  });

  it('1. LearningCenterPage renderiza métricas de Winning DNA y aplica al Creative Studio', async () => {
    render(
      <BrowserRouter>
        <LearningCenterPage />
      </BrowserRouter>
    );

    // Verify title and KPI cards
    await waitFor(() => {
      expect(screen.getByText(/ANIMA Learning Engine & Closed-Loop Intelligence/i)).toBeInTheDocument();
      expect(screen.getByText(/Winning DNA: Video Reel 9:16 \+ Hook Problema/i)).toBeInTheDocument();
      expect(screen.getByText(/\+42.5% Lift vs Promedio/i)).toBeInTheDocument();
      expect(screen.getByText(/Alerta de Fatiga Creativa/i)).toBeInTheDocument();
    });

    // Click Apply button
    const applyBtn = screen.getByText(/Aplicar al Creative Studio/i);
    fireEvent.click(applyBtn);

    await waitFor(() => {
      expect(screen.getByText(/inyectado exitosamente al Creative Studio/i)).toBeInTheDocument();
    });
  });
});
