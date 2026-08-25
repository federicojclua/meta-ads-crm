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
          status: 200,
          json: async () => ({ clients: [{ id: 'client-1', name: 'Empresa Demo', slug: 'empresa-demo' }] }),
        });
      }
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          status: 200,
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
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
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
          status: 200,
          json: async () => ({ clients: [{ id: 'client-1', name: 'Empresa Demo', slug: 'empresa-demo' }] }),
        });
      }
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          status: 200,
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
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
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

  it('3. Frontend con "Todas las Empresas" no envia clientId y llama a la API correctamente', async () => {
    const fetchSpy = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ clients: [{ id: 'client-1', name: 'Empresa Demo', slug: 'empresa-demo' }] }),
        });
      }
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          status: 200,
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
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
    global.fetch = fetchSpy;

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Todas las Empresas/i)).toBeInTheDocument();
    });

    const callUrls = fetchSpy.mock.calls.map(call => call[0]);
    const statsCall = callUrls.find(url => url.includes('/api/dashboard/stats'));
    expect(statsCall).toBeDefined();
    // Verify no clientId param (or at least not 'all') is appended when "Todas las Empresas" is active
    expect(statsCall).not.toContain('clientId=all');
  });

  it('4. Cambio de vista global a empresa concreta realiza nueva peticion con clientId', async () => {
    let callUrls = [];
    global.fetch = vi.fn().mockImplementation((url) => {
      callUrls.push(url);
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ clients: [{ id: 'client-1', name: 'Empresa Demo', slug: 'empresa-demo' }] }),
        });
      }
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            kpis: {
              totalLeadsCount: 5,
              wonLeadsCount: 1,
              conversionRate: 20.0,
              hasConversionData: true,
              totalCollectedFormatted: '100.000,00',
              revenueByCurrency: {},
              pipelineBreakdown: { new: 1, contacted: 1, qualified: 1, won: 1, lost: 1 },
            },
            salespeoplePerformance: [],
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });

    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Todas las Empresas/i)).toBeInTheDocument();
    });

    // Select the specific client option
    const select = container.querySelector('select');
    expect(select).toBeInTheDocument();

    // Simulate user selection change
    const fireEvent = (await import('@testing-library/react')).fireEvent;
    fireEvent.change(select, { target: { value: 'client-1' } });

    await waitFor(() => {
      const statsCallsWithClientId = callUrls.filter(url => url.includes('/api/dashboard/stats?clientId=client-1'));
      expect(statsCallsWithClientId.length).toBeGreaterThan(0);
    });
  });

  it('5. Cambio de una empresa a otra limpia los datos anteriores para evitar mezcla', async () => {
    let callUrls = [];
    global.fetch = vi.fn().mockImplementation((url) => {
      callUrls.push(url);
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ clients: [{ id: 'client-1', name: 'Empresa Demo', slug: 'empresa-demo' }] }),
        });
      }
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            kpis: {
              totalLeadsCount: 10,
              wonLeadsCount: 2,
              conversionRate: 20,
              hasConversionData: true,
              totalCollectedFormatted: '200.000,00',
              revenueByCurrency: {},
              pipelineBreakdown: { new: 2, contacted: 2, qualified: 2, won: 2, lost: 2 },
            },
            salespeoplePerformance: [],
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });

    const { container } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Todas las Empresas/i)).toBeInTheDocument();
    });

    const select = container.querySelector('select');
    const fireEvent = (await import('@testing-library/react')).fireEvent;

    // Changing selectedClientId should immediately clear stats
    fireEvent.change(select, { target: { value: 'client-1' } });

    // Since stats gets set to null immediately on reload, the values like 10 leads are not visible during loading
    expect(screen.queryByText('10')).not.toBeInTheDocument();
  });

  it('6. Etiqueta visual actualizada a Fase 5A', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ clients: [] }),
        });
      }
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          status: 200,
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
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // The badge should display FASE 5A
      expect(screen.getAllByText('FASE 5A').length).toBeGreaterThan(0);
      expect(screen.queryByText('ETAPA 3 · ACTIVA')).not.toBeInTheDocument();
    });
  });

  it('7. Una respuesta vacía exitosa no muestra el banner rojo', async () => {
    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ clients: [] }),
        });
      }
      if (url.includes('/api/dashboard/stats')) {
        return Promise.resolve({
          ok: true,
          status: 200,
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
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/Reintentar/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Error al cargar las estadísticas/i)).not.toBeInTheDocument();
    });
  });
});
