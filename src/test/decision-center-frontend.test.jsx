import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DecisionCenterPage } from '../pages/DecisionCenterPage';
import * as ApiModule from '../lib/api';

describe('Stages 20/21 — Frontend Decision & Experimentation Center UI Tests', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('1. DecisionCenterPage renderiza métricas de alertas y permite ejecutar acciones con un clic', async () => {
    vi.spyOn(ApiModule, 'apiClient').mockImplementation(async (path, options = {}) => {
      if (path === '/api/decision-engine/alerts') {
        return {
          ok: true,
          alerts: [
            {
              id: 'alt_001',
              alertType: 'CREATIVE_FATIGUE',
              severity: 'CRITICAL',
              title: 'Fatiga Creativa Severa: Feed 1:1 Promocional',
              target: { entityName: 'Campaña Notebooks - Feed 1:1', adId: 'ad_101' },
              aiDecision: {
                diagnosis: 'Frecuencia publicitaria superó 4.2 en 7 días.',
                evidence: 'Frecuencia: 4.2 (+110% vs benchmark)',
                recommendation: 'Apagar inmediatamente el anuncio fatigado.',
                proposedAction: {
                  actionType: 'PAUSE_AD',
                  buttonLabel: '🛑 Apagar Anuncio Fatigado',
                  targetId: 'ad_101',
                },
              },
            },
          ],
        };
      }
      if (path === '/api/decision-engine/experiments') {
        return {
          ok: true,
          experiments: [
            {
              id: 'exp_001',
              name: 'Test de Hook: Problema vs Oferta Flash',
              hypothesis: 'Hook problema bajará el CPL en 25%',
              primaryMetric: 'ROAS',
              status: 'WINNER',
              controlAsset: { name: 'Control A', format: '9:16', impressions: 12000, conversions: 180, cpl: 1550, roas: 3.2 },
              variantAsset: { name: 'Variante B', format: '9:16', impressions: 12500, conversions: 310, cpl: 980, roas: 4.4 },
              statisticalSignificance: { pValue: 0.0082, confidenceLevel: 0.991, zScore: 2.64, isSignificant: true, relativeLiftPct: 47.9 },
            },
          ],
        };
      }
      if (path === '/api/decision-engine/execute-action') {
        return {
          ok: true,
          message: 'Anuncio ad_101 pausado exitosamente en Meta Ads para evitar sobrecostos.',
        };
      }
      return { ok: true };
    });

    render(
      <MemoryRouter>
        <DecisionCenterPage />
      </MemoryRouter>
    );

    // Verify Title & Badges
    expect(await screen.findByText('ANIMA Decision & Experimentation Engine')).toBeInTheDocument();
    expect(screen.getByText('Closed-Loop AI')).toBeInTheDocument();
    expect(screen.getByText('Fatiga Creativa Severa: Feed 1:1 Promocional')).toBeInTheDocument();

    // Verify 4 Decision Blocks
    expect(screen.getByText(/1. Diagnóstico/i)).toBeInTheDocument();
    expect(screen.getByText(/2. Evidencia Dura/i)).toBeInTheDocument();
    expect(screen.getByText(/3. Recomendación/i)).toBeInTheDocument();

    // Execute Action Button
    const actionBtn = screen.getByRole('button', { name: /Apagar Anuncio Fatigado/i });
    expect(actionBtn).toBeInTheDocument();

    fireEvent.click(actionBtn);

    await waitFor(() => {
      expect(screen.getByText(/pausado exitosamente en Meta Ads/i)).toBeInTheDocument();
    });

    // Switch to Experiments Tab
    const expTabBtn = screen.getByRole('button', { name: /Experimentos A\/B/i });
    fireEvent.click(expTabBtn);

    expect(await screen.findByText('Test de Hook: Problema vs Oferta Flash')).toBeInTheDocument();
    expect(screen.getByText('p-value:')).toBeInTheDocument();
    expect(screen.getByText('0.0082')).toBeInTheDocument();
  });
});
