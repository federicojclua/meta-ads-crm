import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CreativeStudioPage } from '../pages/CreativeStudioPage';

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

describe('Stage 16 — Frontend Creative Studio UI & Wizard Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();

      if (urlStr.includes('/api/creative-profile')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            profile: {
              brandIdentity: { commercialName: 'Grupo Novati Tech', logoPrimary: 'https://example.com/logo.png' },
              colorPalette: { primary: '#0F172A', secondary: '#1E293B', accent: '#F59E0B', background: '#F8FAFC' },
              typography: { headingFont: 'Montserrat', bodyFont: 'Inter' },
              brandDna: { industry: 'electronics', toneOfVoice: 'professional_friendly' },
              forbiddenElements: ['No deformar las fotos de productos'],
            },
          }),
        });
      }

      if (urlStr.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            products: [
              { id: 'prod_1', name: 'Notebook Lenovo ThinkPad', price: 1299999, previousPrice: 1549999, installments: '12 cuotas fijas', imageUrl: 'https://example.com/lenovo.png' },
              { id: 'prod_2', name: 'Monitor Gamer Samsung', price: 289999, previousPrice: 349999, installments: '6 cuotas fijas', imageUrl: 'https://example.com/samsung.png' },
            ],
          }),
        });
      }

      if (urlStr.includes('/api/creative-campaigns/brief')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            brief: { campaignTitle: 'Campaña Vender — Grupo Novati', mainMessage: 'Mega Ofertas en Notebooks', secondaryMessage: '12 cuotas fijas' },
            concepts: [
              { id: 'A', name: 'Hero Protagonista', headline: 'RENOVÁ TU EQUIPAMIENTO', subtitle: '12 cuotas fijas', cta: 'COMPRAR AHORA', rationale: 'Destaca al producto principal con badge gigante.' },
              { id: 'B', name: 'Catálogo de Ofertas', headline: 'OFERTAS DE LA SEMANA', subtitle: 'Equipos seleccionados', cta: 'VER CATÁLOGO', rationale: 'Distribución en cuadrícula.' },
            ],
          }),
        });
      }

      if (urlStr.includes('/api/creative-campaigns/generate')) {
        return Promise.resolve({
          ok: true,
          status: 201,
          json: async () => ({
            ok: true,
            campaign: {
              id: 'camp_new_1',
              campaignName: 'Campaña Hero Protagonista',
              objective: 'vender',
              status: 'ai_generated',
              formats: ['1:1', '9:16'],
              copy: { headline: 'RENOVÁ TU EQUIPAMIENTO', subtitle: '12 cuotas fijas', cta: 'COMPRAR AHORA' },
              qualityScore: { overall: 92, brandConsistency: 95, visualHierarchy: 90, ctaVisibility: 94, recommendations: ['Jerarquía visual óptima.'] },
              renderedAssets: [
                { format: '1:1', svg: '<svg viewBox="0 0 1080 1080"><text>RENOVÁ TU EQUIPAMIENTO</text></svg>' },
              ],
            },
          }),
        });
      }

      if (urlStr.includes('/api/creative-campaigns')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            ok: true,
            campaigns: [
              { id: 'camp_old_1', campaignName: 'Campaña Gamer Cyber Monday', objective: 'vender', version: 1, copy: { headline: 'OFERTAS GAMER' }, renderedAssets: [] },
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

  it('1. CreativeStudioPage renderiza el título, las 4 pestañas y el catálogo de productos', async () => {
    render(
      <MemoryRouter>
        <CreativeStudioPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/AI Campaign Creative Engine/i)).toBeInTheDocument();
      expect(screen.getByText(/Generador de Campañas/i)).toBeInTheDocument();
      expect(screen.getByText(/Brand DNA & Memoria Visual/i)).toBeInTheDocument();
      expect(screen.getByText(/Catálogo de Productos/i)).toBeInTheDocument();
      expect(screen.getByText(/Galería & Historial/i)).toBeInTheDocument();
      expect(screen.getByText(/Notebook Lenovo ThinkPad/i)).toBeInTheDocument();
    });
  });

  it('2. CreativeStudioPage avanza por el Wizard de Generación y produce los conceptos de Gemini', async () => {
    render(
      <MemoryRouter>
        <CreativeStudioPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Notebook Lenovo ThinkPad/i)).toBeInTheDocument();
    });

    const generateBtn = screen.getByText(/Generar Propuestas Conceptuales/i).closest('button');
    await waitFor(() => {
      expect(generateBtn).not.toBeDisabled();
    });

    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText(/Propuestas Conceptuales/i)).toBeInTheDocument();
      expect(screen.getByText(/Concepto A/i)).toBeInTheDocument();
      expect(screen.getByText(/Hero Protagonista/i)).toBeInTheDocument();
      expect(screen.getByText(/Aprobar Concepto & Componer Gráficas/i)).toBeInTheDocument();
    });
  });
});
