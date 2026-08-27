import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EcommerceCroPage } from '../pages/EcommerceCroPage';

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    userProfile: {
      uid: 'user-123',
      email: 'admin@animamkt.com',
      role: 'admin',
      clientId: '65df11111111111111111111',
    },
    firebaseUser: { uid: 'user-123', email: 'admin@animamkt.com' },
  }),
}));

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'es',
    t: (key) => key,
  }),
}));

describe('Stage 15 — Frontend E-Commerce & CRO Dashboard UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();

      if (urlStr.includes('/api/ecommerce/funnel')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            summary: { totalViews: 12450, totalPurchases: 540, overallConversionRate: 4.34 },
            funnel: [
              { step: 'view_item', label: 'Vista de Producto (view_item)', count: 12450, conversionFromInitial: 100, dropoffFromPrevious: 0 },
              { step: 'add_to_cart', label: 'Añadido al Carrito (add_to_cart)', count: 3860, conversionFromInitial: 31.0, dropoffFromPrevious: 69.0 },
              { step: 'begin_checkout', label: 'Inicio de Checkout (begin_checkout)', count: 1940, conversionFromInitial: 15.6, dropoffFromPrevious: 49.7 },
              { step: 'add_payment_info', label: 'Datos de Pago (add_payment_info)', count: 820, conversionFromInitial: 6.6, dropoffFromPrevious: 57.7 },
              { step: 'purchase', label: 'Compra Finalizada (purchase)', count: 540, conversionFromInitial: 4.34, dropoffFromPrevious: 34.1 },
            ],
          }),
        });
      }

      if (urlStr.includes('/api/ecommerce/friction')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            friction: { score: 68, severity: 'CRÍTICA', topBottleneck: 'Abandono masivo en pasarela de pagos' },
            formAnalytics: [
              { field: 'email', label: 'Correo Electrónico', startCount: 1940, completeCount: 1890, abandonRate: 2.6 },
            ],
          }),
        });
      }

      if (urlStr.includes('/api/ecommerce/cro-diagnose')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            diagnostic: {
              title: 'Auditoría Estructural de Conversión & CRO',
              overallSeverity: 'CRÍTICA',
              estimatedRevenueLift: '+24.5% con optimizaciones prioritarias',
              bottlenecks: [
                { step: 'add_payment_info -> purchase', dropoff: '42.5% de caída', rootCause: 'Fricción en pasarela de pago', recommendation: 'Añadir badges de confianza', priority: 'ALTA' },
              ],
              actionPlan: ['1. Implementar One-Step Checkout.'],
            },
          }),
        });
      }

      if (urlStr.includes('/api/ecommerce/meta-catalog')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            catalogCampaigns: [
              { id: 'camp_adv_01', name: 'Advantage+ Shopping — Catálogo Completo', status: 'ACTIVE', spend: 342000, purchases: 320, roas: 4.85, cpa: 1068.75, costPerAddToCart: 142.5, currency: 'ARS' },
            ],
            callCampaignsAudit: { totalCallClicks: 430, connectedCalls: 180, closedSales: 54, callToCloseRatio: 30.0 },
          }),
        });
      }

      if (urlStr.includes('/api/affiliates/profitability')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            profitability: { grossRevenue: 10000000, metaSpend: 2000000, dropshipCogs: 4000000, affiliateCommissions: 1000000, netProfit: 3000000, netMarginPercent: 30 },
          }),
        });
      }

      if (urlStr.includes('/api/affiliates')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            affiliates: [
              { id: 'aff_1', name: 'Laura Influencer Tech', email: 'laura@tech.com', promoCode: 'LAURA10', commissionRate: 12, salesAttributedCount: 42, totalRevenueGenerated: 2450000, totalCommissionsPaid: 294000 },
            ],
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ ok: true }),
      });
    });
  });

  it('1. EcommerceCroPage renderiza el título, las 4 pestañas y el embudo visual', async () => {
    render(
      <MemoryRouter>
        <EcommerceCroPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Hub de E-Commerce & Optimización CRO/i)).toBeInTheDocument();
      expect(screen.getByText(/Embudo & Drop-off/i)).toBeInTheDocument();
      expect(screen.getByText(/Auditoría UI\/UX & Agente CRO/i)).toBeInTheDocument();
      expect(screen.getByText(/Meta Ads Catálogo & Llamadas/i)).toBeInTheDocument();
      expect(screen.getByText(/Afiliados & Margen Neto Real/i)).toBeInTheDocument();
      expect(screen.getByText(/Vista de Producto \(view_item\)/i)).toBeInTheDocument();
    });
  });

  it('2. EcommerceCroPage permite navegar a la pestaña CRO y ejecutar el diagnóstico con IA', async () => {
    render(
      <MemoryRouter>
        <EcommerceCroPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Auditoría UI\/UX & Agente CRO/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Auditoría UI\/UX & Agente CRO/i));

    await waitFor(() => {
      expect(screen.getByText(/Puntaje de Fricción UI\/UX/i)).toBeInTheDocument();
      expect(screen.getByText(/Ejecutar Diagnóstico CRO con IA/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/Ejecutar Diagnóstico CRO con IA/i));

    await waitFor(() => {
      expect(screen.getByText(/Auditoría Estructural de Conversión & CRO/i)).toBeInTheDocument();
      expect(screen.getByText(/\+24\.5% con optimizaciones prioritarias/i)).toBeInTheDocument();
    });
  });
});
