import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { OfferEnginePanel } from '../components/OfferEnginePanel';

describe('Stage 15B — Frontend OfferEnginePanel UI Tests', () => {
  const mockProduct = {
    id: 'prod_lenovo_01',
    name: 'Notebook Lenovo ThinkPad E14',
    price: 1299999,
    installments: '12 cuotas fijas',
    costStructure: {
      cogs: 780000,
      gatewayFeePercent: 3.5,
      shippingCost: 8500,
      estimatedCpa: 32000,
      targetMinMarginPercent: 15,
    },
  };

  const mockProfit = {
    sellingPrice: 1299999,
    totalUnitCost: 866000,
    trueProfitAmount: 433999,
    trueProfitMarginPct: 33.38,
    maxDiscountAllowedPct: 18.38,
    maxDiscountAmount: 238939,
    healthStatus: 'HEALTHY',
  };

  const mockArchitecture = {
    productId: 'prod_lenovo_01',
    offers: [
      {
        id: 'offer_a',
        name: 'Oferta A: Flash Sale Directo',
        type: 'direct_discount',
        headline: 'Ahorrá un 14% directo',
        valueAddons: ['Envío Express Bonificado'],
        urgencyScarcity: 'Solo por 48hs',
        riskReversal: 'Garantía Oficial 1 Año',
        paymentTerms: '12 cuotas fijas',
        projectedPrice: 1117999,
        projectedTrueProfit: 300000,
        projectedMarginPct: 26.8,
        isRecommended: false,
      },
      {
        id: 'offer_b',
        name: 'Oferta B: Master Bundle de Alto Valor',
        type: 'value_bundle',
        headline: 'Llevate el ThinkPad + Kit Ejecutivo',
        valueAddons: ['Funda de Neopreno', 'Garantía Extendida 2 Años'],
        urgencyScarcity: 'Solo los primeros 15 pedidos',
        riskReversal: '30 días de prueba',
        paymentTerms: '12 cuotas fijas',
        projectedPrice: 1299999,
        projectedTrueProfit: 427499,
        projectedMarginPct: 32.88,
        isRecommended: true,
      },
    ],
    activeOfferId: 'offer_b',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.url || '';

      if (urlStr.includes('/api/offers/calculate-profit')) {
        const payload = { ok: true, profit: mockProfit };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        });
      }

      if (urlStr.includes('/api/offers/generate')) {
        const payload = { ok: true, architecture: mockArchitecture };
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => payload,
          text: async () => JSON.stringify(payload),
        });
      }

      if (urlStr.includes('/api/offers/activate')) {
        const payload = { ok: true, message: 'Oferta activada' };
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

  it('1. OfferEnginePanel renderiza métricas de True Profit y genera ofertas estratégicas', async () => {
    const handleOfferActivated = vi.fn();

    render(
      <OfferEnginePanel
        product={mockProduct}
        onClose={() => {}}
        onOfferActivated={handleOfferActivated}
      />
    );

    // Verify True Profit metrics are loaded
    await waitFor(() => {
      expect(screen.getByText(/Offer Engine & E-Commerce True Profit/i)).toBeInTheDocument();
      expect(screen.getByText(/Notebook Lenovo ThinkPad E14/i)).toBeInTheDocument();
      expect(screen.getByText(/HEALTHY/i)).toBeInTheDocument();
      expect(screen.getByText(/33.38%/i)).toBeInTheDocument();
    });

    // Click on Generate Offers
    const generateBtn = screen.getByText(/Generar 3 Ofertas Estratégicas/i);
    fireEvent.click(generateBtn);

    // Verify 3 offer cards are shown
    await waitFor(() => {
      expect(screen.getByText(/Oferta B: Master Bundle de Alto Valor/i)).toBeInTheDocument();
      expect(screen.getByText(/Funda de Neopreno/i)).toBeInTheDocument();
      expect(screen.getByText(/⭐ RECOMENDADA POR MARGEN/i)).toBeInTheDocument();
    });
  });
});
