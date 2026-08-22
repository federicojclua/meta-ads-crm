import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { loginWithEmail, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const SAFE_RETURN_PATHS = new Set([
    '/app',
    '/app/clients',
    '/app/leads',
    '/app/campaigns',
    '/app/settings',
  ]);
  const rawFrom = location.state?.from?.pathname;
  const from = typeof rawFrom === 'string' && SAFE_RETURN_PATHS.has(rawFrom) ? rawFrom : '/app';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await loginWithEmail(email, password);
      if (!user.emailVerified) {
        navigate('/verify-email');
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login error:', err);
      let userFriendlyMessage = 'Credenciales inválidas o error de autenticación.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        userFriendlyMessage = 'Correo o contraseña incorrectos. Verifica tus credenciales.';
      } else if (err.code === 'auth/too-many-requests') {
        userFriendlyMessage = 'Demasiados intentos fallidos. Por favor, intenta más tarde o restablece tu contraseña.';
      } else if (err.message) {
        userFriendlyMessage = err.message;
      }
      setError(userFriendlyMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);

    try {
      const user = await loginWithGoogle();
      if (!user.emailVerified) {
        navigate('/verify-email');
        return;
      }
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Google login error:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('No se pudo completar el inicio de sesión con Google. Intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-brand-primary text-white font-extrabold text-xl mb-3 shadow-subtle">
          A
        </div>
        <h1 className="text-2xl font-extrabold text-brand-text-primary tracking-tight">
          ANIMA MKT CRM
        </h1>
        <p className="mt-1 text-xs uppercase font-bold text-brand-text-secondary tracking-widest">
          Acceso Exclusivo &middot; Plataforma de Inteligencia Comercial
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 border border-brand-border rounded-lg shadow-card">
          {error && (
            <Alert variant="error" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Input
                label="Correo Electrónico"
                type="email"
                required
                autoComplete="email"
                placeholder="tu@agencia.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password-input"
                  className="block text-xs font-semibold text-brand-text-primary uppercase tracking-wider"
                >
                  Contraseña <span className="text-brand-primary">*</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-brand-primary hover:text-brand-dark font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-brand-text-secondary hover:text-brand-text-primary focus:outline-none"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full justify-center text-sm font-semibold py-2.5"
              >
                <Lock className="w-4 h-4 mr-2" />
                Ingresar al CRM
              </Button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-brand-text-secondary font-medium tracking-wider">
                  O continuar con
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full justify-center gap-2.5 text-sm py-2.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google Workspace / Gmail</span>
              </Button>
            </div>
          </div>

          <div className="mt-6 border-t border-brand-border pt-4 text-center">
            <p className="text-[11px] text-brand-text-secondary leading-relaxed">
              El acceso requiere autorización previa en MongoDB por parte del Super Administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
