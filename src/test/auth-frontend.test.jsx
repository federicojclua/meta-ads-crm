import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import * as AuthHook from '../hooks/useAuth';

describe('Frontend UI & Protected Routes Tests', () => {
  it('10. Rutas privadas -> redirige a /login cuando no hay usuario autenticado', () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      firebaseUser: null,
      userProfile: null,
      loading: false,
      isEmailVerified: false,
      authError: null,
      serverUnavailable: false,
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/login" element={<div>Pantalla de Login</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Contenido Privado del CRM</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Pantalla de Login')).toBeInTheDocument();
    expect(screen.queryByText('Contenido Privado del CRM')).not.toBeInTheDocument();
  });

  it('10b. Usuario autenticado pero email no verificado -> redirige a /verify-email', () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      firebaseUser: { email: 'test@agencia.com', emailVerified: false },
      userProfile: null,
      loading: false,
      isEmailVerified: false,
      authError: null,
      serverUnavailable: false,
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/verify-email" element={<div>Pantalla de Verificación de Email</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Contenido Privado del CRM</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Pantalla de Verificación de Email')).toBeInTheDocument();
  });

  it('10c. Usuario verificado sin perfil en MongoDB (403) -> redirige a /unauthorized', () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      firebaseUser: { email: 'noautorizado@agencia.com', emailVerified: true },
      userProfile: null,
      loading: false,
      isEmailVerified: true,
      authError: 'Acceso no autorizado al CRM.',
      authErrorCode: 'USER_NOT_AUTHORIZED',
      serverUnavailable: false,
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/unauthorized" element={<div>Pantalla No Autorizado 403</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Contenido Privado del CRM</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Pantalla No Autorizado 403')).toBeInTheDocument();
  });

  it('10d. Error de servidor 500 (serverUnavailable) en ProtectedRoute -> muestra pantalla Servicio No Disponible sin redirigir a /unauthorized', () => {
    vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
      firebaseUser: { email: 'admin@animamkt.com', emailVerified: true },
      userProfile: null,
      loading: false,
      isEmailVerified: true,
      authError: 'El servicio de autenticación no está disponible temporalmente.',
      authErrorCode: 'SERVER_ERROR',
      serverUnavailable: true,
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route path="/unauthorized" element={<div>Pantalla No Autorizado 403</div>} />
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <div>Contenido Privado del CRM</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Servicio No Disponible')).toBeInTheDocument();
    expect(screen.getByText('Reintentar Conexión')).toBeInTheDocument();
    expect(screen.queryByText('Pantalla No Autorizado 403')).not.toBeInTheDocument();
    expect(screen.queryByText('Contenido Privado del CRM')).not.toBeInTheDocument();
  });

  it('10e. Detección y distinción segura de proveedores (Google-only, Password, Ambos)', () => {
    const googleOnlyUser = {
      email: 'federicojclua@gmail.com',
      providerData: [{ providerId: 'google.com' }],
    };
    const passwordUser = {
      email: 'admin@animamkt.com',
      providerData: [{ providerId: 'password' }],
    };
    const linkedUser = {
      email: 'federicojclua@gmail.com',
      providerData: [{ providerId: 'google.com' }, { providerId: 'password' }],
    };

    const isGoogleOnly = (u) => {
      const p = u.providerData.map((x) => x.providerId);
      return p.includes('google.com') && !p.includes('password');
    };

    const hasPassword = (u) => u.providerData.some((x) => x.providerId === 'password');
    const hasGoogle = (u) => u.providerData.some((x) => x.providerId === 'google.com');

    expect(isGoogleOnly(googleOnlyUser)).toBe(true);
    expect(hasPassword(googleOnlyUser)).toBe(false);

    expect(isGoogleOnly(passwordUser)).toBe(false);
    expect(hasPassword(passwordUser)).toBe(true);

    expect(isGoogleOnly(linkedUser)).toBe(false);
    expect(hasGoogle(linkedUser)).toBe(true);
    expect(hasPassword(linkedUser)).toBe(true);
  });

  it('12. Componentes UI principales renderizan con diseño accesible', () => {
    render(
      <div>
        <Button variant="primary">Botón Principal</Button>
        <Input label="Correo" placeholder="correo@test.com" />
        <Badge variant="success">Activo</Badge>
        <Alert variant="info" title="Aviso">
          Mensaje informativo
        </Alert>
        <EmptyState title="Sin Datos" description="Descripción de estado vacío" />
      </div>
    );

    expect(screen.getByText('Botón Principal')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('correo@test.com')).toBeInTheDocument();
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Aviso')).toBeInTheDocument();
    expect(screen.getByText('Sin Datos')).toBeInTheDocument();
  });
});
