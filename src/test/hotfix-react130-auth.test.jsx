import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LeadsPage } from '../pages/LeadsPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import { apiClient, ApiError } from '../lib/api';
import * as AuthHook from '../hooks/useAuth';
import * as FirebaseAuth from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LEAD_STAGES, LEAD_STAGE_COLORS, LEAD_STAGE_LABELS } from '../lib/constants';

describe('Hotfix Verification: React #130 Prevention, Centralized Auth & ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // 1. Todos los componentes e íconos configurados para las etapas existen
  it('1. Todos los componentes e íconos configurados para las etapas existen y no son undefined', () => {
    expect(LEAD_STAGES).toBeDefined();
    expect(LEAD_STAGES.length).toBe(5);
    for (const stage of LEAD_STAGES) {
      expect(LEAD_STAGE_LABELS[stage]).toBeDefined();
      expect(LEAD_STAGE_COLORS[stage]).toBeDefined();
      expect(LEAD_STAGE_COLORS[stage].bg).toBeDefined();
      expect(LEAD_STAGE_COLORS[stage].border).toBeDefined();
      expect(LEAD_STAGE_COLORS[stage].badge).toBeDefined();
    }

    // Alert with danger and custom icon
    const { container: alertContainer } = render(
      <Alert variant="danger" title="Error grave" onClose={() => {}}>
        Mensaje de prueba
      </Alert>
    );
    expect(alertContainer.querySelector('[role="alert"]')).toBeInTheDocument();
    expect(screen.getByText('Error grave')).toBeInTheDocument();

    // EmptyState with fallback icon
    const { container: emptyContainer } = render(
      <EmptyState title="Vacío" description="Sin elementos" />
    );
    expect(emptyContainer).toBeInTheDocument();
  });

  // 2. /app/leads completa el render asíncrono sin lanzar React #130
  it('2. /app/leads completa el render asíncrono sin lanzar React #130 incluso ante error en fetch', async () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: { displayName: 'Admin', role: 'admin' },
      firebaseUser: { email: 'admin@demo.com', uid: 'u-1', getIdToken: async () => 'test-token' },
      loading: false,
    });

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/leads')) {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: async () => JSON.stringify({ message: 'Token no provisto' }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ clients: [], users: [] }),
      });
    });

    render(
      <MemoryRouter>
        <LeadsPage />
      </MemoryRouter>
    );

    // Debe renderizar sin crashear con React #130
    await waitFor(() => {
      expect(screen.getByText(/Gestión de Leads & Pipeline Comercial/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Token no provisto/i).length).toBeGreaterThan(0);
    });
  });

  // 3. Estado vacío después de resolver las consultas
  it('3. Estado vacío después de resolver las consultas muestra EmptyState correctamente', async () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: { displayName: 'Client User', role: 'client' },
      firebaseUser: { email: 'client@demo.com', uid: 'u-client', getIdToken: async () => 'client-token' },
      loading: false,
    });

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/leads')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ leads: [] }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ users: [], clients: [] }),
      });
    });

    render(
      <MemoryRouter>
        <LeadsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No se encontraron prospectos')).toBeInTheDocument();
      expect(screen.getByText('Crear Primer Prospecto')).toBeInTheDocument();
    });
  });

  // 4. Las llamadas protegidas incluyen Authorization: Bearer test-token
  it('4. Las llamadas protegidas incluyen Authorization: Bearer test-token', async () => {
    auth.currentUser = {
      getIdToken: vi.fn().mockResolvedValue('fresh-bearer-token-123'),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true }),
    });

    await apiClient('/api/test-protected');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/test-protected',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer fresh-bearer-token-123',
        }),
      })
    );
  });

  // 5. Las consultas no se ejecutan antes de que la sesión esté lista
  it('5. DashboardPage y LeadsPage no realizan llamadas API mientras loading sea true o firebaseUser sea null', async () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: null,
      firebaseUser: null,
      loading: true,
    });

    global.fetch = vi.fn();

    render(
      <MemoryRouter>
        <DashboardPage />
        <LeadsPage />
      </MemoryRouter>
    );

    // No debe haber llamado a endpoints mientras auth está cargando
    expect(global.fetch).not.toHaveBeenCalled();
  });

  // 6. Primer 401 fuerza renovación y reintenta
  it('6. Primer 401 fuerza renovación con getIdToken(true) y reintenta la llamada', async () => {
    const mockGetIdToken = vi.fn()
      .mockResolvedValueOnce('stale-token')
      .mockResolvedValueOnce('refreshed-token');

    auth.currentUser = {
      getIdToken: mockGetIdToken,
    };

    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return Promise.resolve({
          ok: false,
          status: 401,
          text: async () => JSON.stringify({ code: 'AUTH_TOKEN_EXPIRED' }),
        });
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ recovered: true }),
      });
    });

    const result = await apiClient('/api/retry-test');
    expect(result).toEqual({ recovered: true });
    expect(mockGetIdToken).toHaveBeenCalledWith(true);
    expect(callCount).toBe(2);
  });

  // 7. Segundo 401 cierra sesión
  it('7. Segundo 401 persistente cierra sesión invocando signOut(auth)', async () => {
    auth.currentUser = {
      getIdToken: vi.fn().mockResolvedValue('some-token'),
    };

    const signOutSpy = vi.spyOn(FirebaseAuth, 'signOut').mockResolvedValue();

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'Invalid auth' }),
    });

    await expect(apiClient('/api/fail-auth')).rejects.toThrow(ApiError);
    expect(signOutSpy).toHaveBeenCalled();
  });

  // 8. Un 401 no se representa como métricas cero en el Dashboard
  it('8. Un 401 o error en DashboardPage muestra estado de error y botón Reintentar, no métricas cero falsas', async () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: { displayName: 'Super User', role: 'super_admin' },
      firebaseUser: { email: 'admin@demo.com', uid: 'su-1', getIdToken: async () => 'su-token' },
      loading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'Unauthorized request' }),
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Debe mostrar el banner de alerta y el botón de Reintentar
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
      expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    });
  });

  // 9. Respuestas 403 y 500 muestran estados controlados
  it('9. Respuestas 403 y 500 muestran estados controlados y claros en DashboardPage', async () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      userProfile: { displayName: 'Salesperson User', role: 'salesperson' },
      firebaseUser: { email: 'sp@demo.com', uid: 'sp-1', getIdToken: async () => 'sp-token' },
      loading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () => JSON.stringify({ error: 'Acceso Prohibido' }),
    });

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/No tenés permisos para visualizar las estadísticas/i)).toBeInTheDocument();
    });
  });

  // 10. Un componente hijo defectuoso queda contenido por ErrorBoundary
  it('10. Un componente hijo defectuoso queda contenido por ErrorBoundary con incidentId, Reintentar y Volver al Dashboard', () => {
    const ProblematicComponent = () => {
      throw new Error('Component crashed intentionally');
    };

    // Prevent React test runner from polluting console for the intentional error
    const spyConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblematicComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText('Ocurrió un error al cargar este módulo.')).toBeInTheDocument();
    expect(screen.getByText(/Identificador del incidente:/i)).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
    expect(screen.getByText('Volver al Dashboard')).toBeInTheDocument();

    spyConsoleError.mockRestore();
  });

  // 11. Dashboard y Leads funcionan con super_admin, client y salesperson
  it('11. Dashboard y Leads funcionan con los roles super_admin, client y salesperson', async () => {
    const roles = ['super_admin', 'client', 'salesperson'];

    for (const role of roles) {
      vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
        userProfile: { displayName: `User ${role}`, role, clientId: 'client-1' },
        firebaseUser: { email: `${role}@demo.com`, uid: `uid-${role}`, getIdToken: async () => 'role-token' },
        loading: false,
      });

      global.fetch = vi.fn().mockImplementation((url) => {
        if (url.includes('/api/dashboard/stats')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () =>
              JSON.stringify({
                kpis: {
                  totalLeadsCount: 5,
                  wonLeadsCount: 2,
                  conversionRate: 40.0,
                  hasConversionData: true,
                  totalCollectedFormatted: '50.000,00',
                  revenueByCurrency: { ARS: { collectedFormatted: '50.000,00', salesCount: 1 } },
                  pipelineBreakdown: { new: 2, contacted: 1, qualified: 0, won: 2, lost: 0 },
                },
                salespeoplePerformance: [],
              }),
          });
        }
        if (url.includes('/api/leads')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            text: async () => JSON.stringify({ leads: [{ id: 'lead-1', name: 'Lead Role Test', stage: 'new', valueEstimateMinor: 10000 }] }),
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          text: async () => JSON.stringify({ clients: [], users: [] }),
        });
      });

      const { unmount } = render(
        <MemoryRouter>
          <DashboardPage />
          <LeadsPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Panel de Control & Rendimiento Comercial')).toBeInTheDocument();
        expect(screen.getByText('Gestión de Leads & Pipeline Comercial')).toBeInTheDocument();
      });

      unmount();
    }
  });
});
