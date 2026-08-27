import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import { RevenueDashboardPage } from '../pages/RevenueDashboardPage';
import { CopilotPage } from '../pages/CopilotPage';
import * as AuthHook from '../hooks/useAuth';

vi.mock('../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    language: 'es',
    t: (key) => key,
  }),
}));

vi.mock('../lib/firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: () => Promise.resolve('mock-token'),
    },
  },
}));

describe('Stage 11 Evolution — Frontend Business Intelligence & ANIMA Memory UI Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: {
        uid: 'user-123',
        email: 'admin@animamkt.com',
        role: 'super_admin',
        clientId: '65df11111111111111111111',
      },
      firebaseUser: { uid: 'user-123', email: 'admin@animamkt.com' },
      loading: false,
      authLoading: false,
    });

    global.fetch = vi.fn().mockImplementation((url) => {
      const urlStr = typeof url === 'string' ? url : url.toString();

      let payload = { ok: true };

      if (urlStr.includes('/api/dashboard/stats')) {
        payload = {
          totalLeadsCount: 84,
          wonLeadsCount: 14,
          conversionRate: 16.6,
          amountsByCurrency: { ARS: 18199986 },
        };
      } else if (urlStr.includes('/api/dashboard/revenue')) {
        payload = {
          kpis: {
            spendMinor: 12450000,
            revenueMinor: 1819998600,
            attributed: { roas: 146.1, leadsCount: 84, cpl: 1482 },
          },
          funnel: { conversion: { total: 84, won: 14 } },
          timeSeries: [],
        };
      } else if (urlStr.includes('/api/clients')) {
        payload = { ok: true, clients: [{ _id: '65df11111111111111111111', name: 'Cliente Activo' }] };
      } else if (urlStr.includes('/api/copilot/suggestions')) {
        payload = {
          ok: true,
          suggestions: [
            { id: 'anima_score', category: 'ANIMA Health Score', query: '¿Cuál es el ANIMA Score?' },
          ],
        };
      }

      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => payload,
        text: async () => JSON.stringify(payload),
      });
    });
  });

  it('1. DashboardPage renderiza el banner de ANIMA Business Health Score y Goals & Forecast Engine', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/ANIMA Business Health Score/i)).toBeInTheDocument();
      expect(screen.getByText(/EXCELENTE \(88\/100\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Goals & Forecast Engine/i)).toBeInTheDocument();
      expect(screen.getByText(/Facturación MTD \/ Meta/i)).toBeInTheDocument();
    });
  });

  it('2. RevenueDashboardPage renderiza el panel de Transparencia de Costos & Margen Real de Agencia', async () => {
    render(
      <MemoryRouter>
        <RevenueDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Transparencia de Costos & Margen Real de Agencia/i)).toBeInTheDocument();
      expect(screen.getByText(/Beneficio Neto Agencia/i)).toBeInTheDocument();
    });
  });

  it('3. CopilotPage renderiza el widget de ANIMA Performance DNA & Memoria de Negocio', async () => {
    render(
      <MemoryRouter>
        <CopilotPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/ANIMA Performance DNA & Memoria de Negocio/i)).toBeInTheDocument();
      expect(screen.getByText(/Winning Pattern: Avatar IA \+ B-Roll Real/i)).toBeInTheDocument();
      expect(screen.getByText(/Losing Pattern \(Regla de Bloqueo\)/i)).toBeInTheDocument();
    });
  });
});
