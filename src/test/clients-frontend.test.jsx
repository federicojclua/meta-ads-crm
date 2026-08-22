import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClientsPage } from '../pages/ClientsPage';
import { ClientModal } from '../components/clients/ClientModal';
import { AuthorizeUserModal } from '../components/users/AuthorizeUserModal';
import * as AuthHookModule from '../hooks/useAuth';
import * as ApiModule from '../lib/api';

describe('Frontend Clients & User Authorization UI', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    vi.spyOn(AuthHookModule, 'useAuth').mockReturnValue({
      userProfile: {
        _id: '65df11111111111111111111',
        email: 'superadmin@animamkt.com',
        displayName: 'Super Admin',
        role: 'super_admin',
        firebaseUid: 'super-admin-uid',
      },
      currentUser: { email: 'superadmin@animamkt.com' },
      isSuperAdmin: true,
      isAdmin: false,
    });
  });

  it('1. ClientsPage renderiza empresas y badges correctamente', async () => {
    vi.spyOn(ApiModule, 'apiClient').mockImplementation((url) => {
      if (url === '/api/clients') {
        return Promise.resolve({
          clients: [
            {
              _id: '65df22222222222222222222',
              name: 'Empresa Demo Alpha',
              slug: 'empresa-demo-alpha',
              status: 'active',
              country: 'AR',
              defaultCurrency: 'ARS',
              metaAdAccountIds: ['act_12345'],
            },
          ],
        });
      }
      if (url === '/api/users') {
        return Promise.resolve({ users: [] });
      }
      return Promise.resolve({});
    });

    render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ClientsPage />
        </BrowserRouter>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Empresa Demo Alpha')).toBeInTheDocument();
    });

    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('empresa-demo-alpha')).toBeInTheDocument();
    expect(screen.getByText('act_12345')).toBeInTheDocument();
  });

  it('2. ClientModal valida que el nombre sea obligatorio antes de enviar', async () => {
    const onSaveMock = vi.fn();
    const onCloseMock = vi.fn();

    render(
      <ClientModal
        isOpen={true}
        onClose={onCloseMock}
        onSave={onSaveMock}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /crear empresa/i });
    fireEvent.click(submitBtn);

    expect(onSaveMock).not.toHaveBeenCalled();
  });

  it('3. AuthorizeUserModal valida correo y muestra enlace tras autorizar', async () => {
    const onAuthorizeMock = vi.fn().mockResolvedValueOnce({
      user: {
        _id: 'new-user-id',
        email: 'nuevo@empresa.com',
        displayName: 'Nuevo',
        role: 'client',
      },
      loginUrl: '/login',
    });
    const onCloseMock = vi.fn();

    render(
      <AuthorizeUserModal
        isOpen={true}
        onClose={onCloseMock}
        onAuthorize={onAuthorizeMock}
        clients={[{ _id: 'client-1', name: 'Empresa 1', slug: 'empresa-1', status: 'active' }]}
        currentUserRole="super_admin"
      />
    );

    const emailInput = screen.getByPlaceholderText('usuario@empresa.com');
    fireEvent.change(emailInput, { target: { value: 'nuevo@empresa.com' } });

    const submitBtn = screen.getByRole('button', { name: /preautorizar usuario/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onAuthorizeMock).toHaveBeenCalled();
      expect(screen.getByText('Usuario Preautorizado Exitosamente')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copiar/i })).toBeInTheDocument();
    });
  });
});
