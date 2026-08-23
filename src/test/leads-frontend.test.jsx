import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LeadsPage } from '../pages/LeadsPage';
import * as AuthHook from '../hooks/useAuth';

describe('Frontend Leads & Commercial Pipeline UI', () => {
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

    global.fetch = vi.fn().mockImplementation((url) => {
      if (url.includes('/api/clients')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            clients: [{ id: 'client-1', name: 'Empresa Demo', slug: 'empresa-demo' }],
          }),
        });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            users: [{ id: 'user-1', displayName: 'Vendedor 1', email: 'sp1@demo.com', role: 'salesperson', status: 'active' }],
          }),
        });
      }
      if (url.includes('/api/leads')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            leads: [
              {
                id: 'lead-1',
                name: 'Cliente Potencial Alpha',
                email: 'alpha@test.com',
                phone: '+5491100001111',
                stage: 'new',
                source: 'manual',
                valueEstimateMinor: 25000000,
                currency: 'ARS',
                status: 'active',
                createdAt: new Date().toISOString(),
              },
            ],
            pagination: { total: 1 },
          }),
        });
      }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    });
  });

  it('1. LeadsPage renderiza el título y las 5 columnas del Kanban', async () => {
    render(
      <MemoryRouter>
        <LeadsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Gestión de Leads & Pipeline Comercial/i)).toBeInTheDocument();
      expect(screen.getAllByText('Nuevo').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Contactado').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Calificado').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Ganado').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Perdido').length).toBeGreaterThan(0);
      expect(screen.getByText('Cliente Potencial Alpha')).toBeInTheDocument();
    });
  });

  it('2. Abre el modal de nuevo prospecto al hacer click en Nuevo Prospecto', async () => {
    render(
      <MemoryRouter>
        <LeadsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nuevo Prospecto')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nuevo Prospecto'));

    expect(screen.getByText('Nuevo Prospecto Comercial')).toBeInTheDocument();
    expect(screen.getByLabelText(/Nombre Completo/i)).toBeInTheDocument();
  });

  it('3. Abre el modal de importación CSV al hacer click en Importar CSV', async () => {
    render(
      <MemoryRouter>
        <LeadsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Importar CSV')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Importar CSV'));

    expect(screen.getByText('Importación Masiva de Prospectos (CSV)')).toBeInTheDocument();
  });

  it('4. LeadModal para super_admin muestra "Seleccionar empresa" por defecto y exige seleccionarla', async () => {
    render(
      <MemoryRouter>
        <LeadsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nuevo Prospecto')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nuevo Prospecto'));

    expect(screen.getByText('Seleccionar empresa')).toBeInTheDocument();
    
    // Fill name and contact info
    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Juan Carrizo' } });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'juan@carrizo.com' } });

    // Submit form without selecting company
    const submitBtn = screen.getByRole('button', { name: 'Crear Prospecto' });
    fireEvent.submit(submitBtn.closest('form'));

    await waitFor(() => {
      expect(screen.getByText('Debe seleccionar la empresa a la que pertenece el prospecto.')).toBeInTheDocument();
    });
  });

  it('5. LeadModal para super_admin envía el clientId elegido al guardar', async () => {
    render(
      <MemoryRouter>
        <LeadsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nuevo Prospecto')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Nuevo Prospecto'));

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Juan Carrizo' } });
    fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'juan@carrizo.com' } });

    // Select company using specific label
    const selectCompany = screen.getByLabelText(/Empresa \/ Cliente/i);
    fireEvent.change(selectCompany, { target: { value: 'client-1' } });

    const submitBtn = screen.getByRole('button', { name: 'Crear Prospecto' });
    fireEvent.submit(submitBtn.closest('form'));

    await waitFor(() => {
      const postCalls = global.fetch.mock.calls.filter(([url, opts]) => url.includes('/api/leads') && opts?.method === 'POST');
      expect(postCalls.length).toBeGreaterThan(0);
      const payload = JSON.parse(postCalls[0][1].body);
      expect(payload.clientId).toBe('client-1');
      expect(payload.name).toBe('Juan Carrizo');
    });
  });
});


