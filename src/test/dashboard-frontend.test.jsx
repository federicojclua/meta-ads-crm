import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DashboardPage } from '../pages/DashboardPage';
import * as AuthHook from '../hooks/useAuth';

describe('Frontend Dashboard UI & Conversion Rate Denominator Handling', () => {
  const mockUser = {
    displayName: 'Admin User',
    email: 'admin@animamkt.com',
    role: 'super_admin',
    status: 'active',
  };

  beforeEach(() => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: mockUser,
      firebaseUser: { email: 'admin@animamkt.com', uid: 'mock-uid' },
    });
  });

  it('1. DashboardPage muestra "Sin datos" (no 0,0%) cuando totalLeads es 0 y hasConversionData es false', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clients: [{ id: 'client-1', name: 'Empresa Demo', slug: 'empresa-demo' }] }),
        });
      }
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            kpis: {
              totalLeadsCount: 0,
              wonLeadsCount: 0,
              conversionRate: null,
              hasConversionData: false,
              totalCollectedFormatted: '0,00',
              revenueByCurrency: {},
              pipelineBreakdown: { new: 0, contacted: 0, qualified: 0, won: 0, lost: 0 },
            },
            salespeoplePerformance: [],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Panel de Control/i)).toBeInTheDocument();
      // Should show 'Sin datos' for conversion rate
      expect(screen.getByText('Sin datos')).toBeInTheDocument();
      expect(screen.queryByText('0%')).not.toBeInTheDocument();
      expect(screen.queryByText('0,0%')).not.toBeInTheDocument();
    });
  });

  it('2. DashboardPage muestra el porcentaje calculado cuando existen leads (hasConversionData: true)', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ clients: [{ id: 'client-1', name: 'Empresa Demo', slug: 'empresa-demo' }] }),
        });
      }
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            kpis: {
              totalLeadsCount: 10,
              wonLeadsCount: 3,
              conversionRate: 30.0,
              hasConversionData: true,
              totalCollectedFormatted: '150.000,00',
              revenueByCurrency: {
                ARS: { collectedFormatted: '150.000,00', salesCount: 1 },
              },
              pipelineBreakdown: { new: 4, contacted: 2, qualified: 1, won: 3, lost: 0 },
            },
            salespeoplePerformance: [
              {
                id: 'sp-1',
                displayName: 'Vendedor Alpha',
                email: 'alpha@demo.com',
                leadsCount: 10,
                wonLeadsCount: 3,
                conversionRate: 30.0,
                hasConversionData: true,
                collectedFormatted: '150.000,00',
              },
            ],
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Panel de Control/i)).toBeInTheDocument();
      expect(screen.getAllByText('30%').length).toBeGreaterThan(0);
      expect(screen.getByText('ARS: $150.000,00')).toBeInTheDocument();
      expect(screen.getAllByText('Sin datos de Meta').length).toBeGreaterThan(0);
    });
  });
});
