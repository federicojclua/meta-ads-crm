import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EcommerceCroPage } from '../pages/EcommerceCroPage';
import * as ApiModule from '../lib/api';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    userProfile: { role: 'super_admin', clientId: '65df44444444444444444444' },
    isAuthenticated: true,
  }),
}));

describe('Stage 20 — Frontend E-Commerce Intelligence UI Tests', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('1. EcommerceCroPage renderiza las pestañas operativas y permite analizar un producto de dropshipping', async () => {
    vi.spyOn(ApiModule, 'apiClient').mockImplementation(async (path, options = {}) => {
      if (path === '/api/ecommerce/dashboard') {
        return {
          ok: true,
          summary: {
            productsAnalyzed: 3,
            potentialWinners: 2,
            validatedWinners: 1,
            avgProductScore: 85,
            croAuditsCount: 12,
            totalCustomers: 342,
            repeatCustomers: 89,
            repeatPurchaseRate: 26.0,
            totalRevenue: 24650000,
            retentionRevenue: 6850000,
            realLtv: 72076,
            predictedLtv: 98500,
            scheduledAutomationsCount: 14,
          },
        };
      }
      if (path === '/api/ecommerce/products') {
        return {
          ok: true,
          products: [
            {
              id: 'prod_001',
              productName: 'Limpiador Facial Ultrasónico Pro V3',
              category: 'Belleza',
              sourceType: 'dropshipping',
              salePrice: 38500,
              estimatedMargin: 59.7,
              productScore: 84,
              status: 'possible_winner',
            },
          ],
        };
      }
      if (path === '/api/ecommerce/customers') {
        return {
          ok: true,
          customers: [
            {
              id: 'cust_001',
              name: 'Juan Ignacio Perez',
              email: 'juan@test.com',
              phone: '+5491144445555',
              totalOrders: 4,
              totalRevenue: 480000,
              realLtv: 480000,
              predictedLtv: 650000,
              retentionStatus: 'active',
            },
          ],
        };
      }
      if (path === '/api/ecommerce/ltv') {
        return {
          ok: true,
          ltv: { totalCustomers: 342, realLtv: 72076, predictedLtv: 98500, retentionRevenue: 6850000 },
        };
      }
      if (path === '/api/ecommerce/retention-rules') {
        return {
          ok: true,
          rules: [{ id: 'rule_1', name: 'Recompra 30d', delayDays: 30, whatsappTemplateId: 'repurchase_30d', messageBody: 'Hola {{name}}' }],
        };
      }
      if (path === '/api/ecommerce/retention-events') {
        return {
          ok: true,
          events: [{ id: 'evt_1', customerName: 'Juan Perez', productName: 'Notebook', scheduledFor: new Date().toISOString(), status: 'SCHEDULED' }],
        };
      }
      if (path.startsWith('/api/ecommerce/cross-sell')) {
        return {
          ok: true,
          recommendations: [{ title: 'Funda Protectora', price: 18500, whyThisProduct: 'Alta afinidad con compradores' }],
        };
      }
      if (path === '/api/ecommerce/products/analyze') {
        return {
          ok: true,
          analysis: {
            mode: 'dropshipping',
            classification: 'potential_winner',
            scores: { overallScore: 84, confidenceScore: 0.91, subscores: { demandPotential: 85, problemSolutionFit: 88 } },
            angles: [{ angleNumber: 1, angleType: 'Pain Point', hook: '¿Cansado de productos lentos?', coreMessage: 'Solución inmediata', recommendedFormat: '9:16' }],
            hooks: [{ category: 'Curiosity', hook: 'El secreto que nadie te cuenta' }],
            factsVsInferences: { observed: ['Precio $45.000'], inferred: ['Alta demanda'], recommended: ['Testear en Reels'], unknown: ['CPA real'] },
          },
        };
      }
      return { ok: true };
    });

    render(
      <MemoryRouter>
        <EcommerceCroPage />
      </MemoryRouter>
    );

    // Verify Title & Badges
    expect(await screen.findByText('Hub de E-Commerce & Optimización CRO')).toBeInTheDocument();
    expect(screen.getByText('Product → Offer → Retention')).toBeInTheDocument();

    // Navigate to Product Intelligence Tab
    const prodTab = screen.getByRole('button', { name: /Product Intelligence/i });
    fireEvent.click(prodTab);

    // Execute Product Analysis
    const analyzeBtn = screen.getByRole('button', { name: /Ejecutar Análisis Inteligente/i });
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText('ANIMA Product Score')).toBeInTheDocument();
      expect(screen.getByText('84/100')).toBeInTheDocument();
      expect(screen.getByText('Angle Engine: 5 Ángulos Comerciales Validados')).toBeInTheDocument();
    });

    // Switch to Customer Retention tab
    const retentionTab = screen.getByRole('button', { name: /Customer Retention/i });
    fireEvent.click(retentionTab);

    expect(await screen.findByText('Juan Ignacio Perez')).toBeInTheDocument();
    expect(screen.getByText('Recompra (Repeat Rate)')).toBeInTheDocument();
  });
});
