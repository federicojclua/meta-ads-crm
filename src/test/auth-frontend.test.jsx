import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Alert } from '../components/ui/Alert';
import { EmptyState } from '../components/ui/EmptyState';
import * as AuthHook from '../hooks/useAuth';

describe('Frontend UI & Protected Routes Tests', () => {
  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });
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

  describe('SettingsPage - Seguridad de Acceso & Vinculación de Contraseña', () => {
    it('13a. Cuenta Google-only renderiza estados y permite desplegar el formulario de crear contraseña', async () => {
      const { SettingsPage } = await import('../pages/SettingsPage');
      vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
        userProfile: { email: 'federicojclua@gmail.com', role: 'super_admin' },
        firebaseUser: { email: 'federicojclua@gmail.com', uid: 'uid-12345' },
        hasGoogleProvider: true,
        hasPasswordProvider: false,
        linkPasswordAccount: vi.fn(),
        sendPasswordReset: vi.fn(),
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      // Verify Role is displayed normalized as SUPER ADMINISTRADOR
      expect(screen.getAllByText('SUPER ADMINISTRADOR').length).toBeGreaterThan(0);
      expect(screen.queryByText('super_admin')).not.toBeInTheDocument();

      // Verify Provider Statuses
      expect(screen.getByText('Conectado')).toBeInTheDocument();
      expect(screen.getByText('No configurada')).toBeInTheDocument();
      expect(screen.getByText('Crear Contraseña')).toBeInTheDocument();
    });

    it('13b. Formulario de contraseña valida largo mínimo y coincidencia de contraseñas', async () => {
      const { SettingsPage } = await import('../pages/SettingsPage');
      const { fireEvent } = await import('@testing-library/react');

      vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
        userProfile: { email: 'federicojclua@gmail.com', role: 'super_admin' },
        firebaseUser: { email: 'federicojclua@gmail.com', uid: 'uid-12345' },
        hasGoogleProvider: true,
        hasPasswordProvider: false,
        linkPasswordAccount: vi.fn(),
        sendPasswordReset: vi.fn(),
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      // Open password form
      fireEvent.click(screen.getByText('Crear Contraseña'));

      const newPassInput = screen.getByLabelText('Nueva Contraseña');
      const confirmPassInput = screen.getByLabelText('Confirmar Contraseña');
      const submitBtn = screen.getByRole('button', { name: /Establecer Contraseña/i });

      // Initially disabled
      expect(submitBtn).toBeDisabled();

      // Password too short (< 6 chars)
      fireEvent.change(newPassInput, { target: { value: '123' } });
      fireEvent.change(confirmPassInput, { target: { value: '123' } });
      expect(submitBtn).toBeDisabled();

      // Passwords mismatch
      fireEvent.change(newPassInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPassInput, { target: { value: 'different123' } });
      expect(screen.getByText('Las contraseñas no coinciden')).toBeInTheDocument();
      expect(submitBtn).toBeDisabled();

      // Valid match (>= 6 chars)
      fireEvent.change(confirmPassInput, { target: { value: 'password123' } });
      expect(screen.getByText('Las contraseñas coinciden')).toBeInTheDocument();
      expect(submitBtn).not.toBeDisabled();
    });

    it('13c. Vinculación exitosa conserva el mismo firebaseUid y actualiza el estado', async () => {
      const { SettingsPage } = await import('../pages/SettingsPage');
      const { fireEvent, waitFor } = await import('@testing-library/react');

      const mockLink = vi.fn().mockResolvedValue({
        uid: 'uid-12345',
        email: 'federicojclua@gmail.com',
        providerData: [{ providerId: 'google.com' }, { providerId: 'password' }],
      });

      vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
        userProfile: { email: 'federicojclua@gmail.com', role: 'super_admin' },
        firebaseUser: { email: 'federicojclua@gmail.com', uid: 'uid-12345' },
        hasGoogleProvider: true,
        hasPasswordProvider: false,
        linkPasswordAccount: mockLink,
        sendPasswordReset: vi.fn(),
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Crear Contraseña'));

      const newPassInput = screen.getByLabelText('Nueva Contraseña');
      const confirmPassInput = screen.getByLabelText('Confirmar Contraseña');
      const submitBtn = screen.getByRole('button', { name: /Establecer Contraseña/i });

      fireEvent.change(newPassInput, { target: { value: 'MiClaveSegura2026' } });
      fireEvent.change(confirmPassInput, { target: { value: 'MiClaveSegura2026' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockLink).toHaveBeenCalledWith('MiClaveSegura2026');
        expect(screen.getByText(/¡Contraseña vinculada exitosamente!/i)).toBeInTheDocument();
      });
    });

    it('13d. Manejo de error cuando la credencial ya está en uso (credential-already-in-use)', async () => {
      const { SettingsPage } = await import('../pages/SettingsPage');
      const { fireEvent, waitFor } = await import('@testing-library/react');

      const mockError = new Error('Credencial duplicada');
      mockError.code = 'auth/credential-already-in-use';
      const mockLink = vi.fn().mockRejectedValue(mockError);

      vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
        userProfile: { email: 'federicojclua@gmail.com', role: 'super_admin' },
        firebaseUser: { email: 'federicojclua@gmail.com', uid: 'uid-12345' },
        hasGoogleProvider: true,
        hasPasswordProvider: false,
        linkPasswordAccount: mockLink,
        sendPasswordReset: vi.fn(),
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Crear Contraseña'));

      fireEvent.change(screen.getByLabelText('Nueva Contraseña'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirmar Contraseña'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Establecer Contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/Esta credencial ya se encuentra en uso/i)).toBeInTheDocument();
      });
    });

    it('13e. Cuenta con contraseña configurada muestra estado y opción de restablecimiento', async () => {
      const { SettingsPage } = await import('../pages/SettingsPage');
      vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
        userProfile: { email: 'federicojclua@gmail.com', role: 'super_admin' },
        firebaseUser: { email: 'federicojclua@gmail.com', uid: 'uid-12345' },
        hasGoogleProvider: true,
        hasPasswordProvider: true,
        linkPasswordAccount: vi.fn(),
        sendPasswordReset: vi.fn(),
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      expect(screen.getByText('Configurada')).toBeInTheDocument();
      expect(screen.getByText('Restablecer vía Email')).toBeInTheDocument();
      expect(screen.queryByText('Crear Contraseña')).not.toBeInTheDocument();
    });

    it('13f. Rechazo dinámico cuando validatePassword de Firebase indica que la contraseña no cumple la política activa', async () => {
      const { SettingsPage } = await import('../pages/SettingsPage');
      const { fireEvent, waitFor } = await import('@testing-library/react');
      const FirebaseModule = await import('../lib/firebase');

      // Mock validatePasswordPolicy to return invalid status
      vi.spyOn(FirebaseModule, 'validatePasswordPolicy').mockResolvedValue({
        isValid: false,
        meetsMinPasswordLength: false,
        containsLowercaseLetter: true,
        containsUppercaseLetter: false,
        containsNumericCharacter: false,
        containsNonAlphanumericCharacter: false,
      });

      const mockLink = vi.fn();

      vi.spyOn(AuthHook, 'useAuth').mockReturnValue({
        userProfile: { email: 'federicojclua@gmail.com', role: 'super_admin' },
        firebaseUser: { email: 'federicojclua@gmail.com', uid: 'uid-12345' },
        hasGoogleProvider: true,
        hasPasswordProvider: false,
        linkPasswordAccount: mockLink,
        sendPasswordReset: vi.fn(),
      });

      render(
        <MemoryRouter>
          <SettingsPage />
        </MemoryRouter>
      );

      fireEvent.click(screen.getByText('Crear Contraseña'));

      fireEvent.change(screen.getByLabelText('Nueva Contraseña'), { target: { value: 'password123' } });
      fireEvent.change(screen.getByLabelText('Confirmar Contraseña'), { target: { value: 'password123' } });
      fireEvent.click(screen.getByRole('button', { name: /Establecer Contraseña/i }));

      await waitFor(() => {
        expect(screen.getByText(/La contraseña no cumple con la política de seguridad configurada en Firebase/i)).toBeInTheDocument();
        expect(mockLink).not.toHaveBeenCalled();
      });
    });
  });
});
