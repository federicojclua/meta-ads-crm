import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const { sendPasswordReset } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await sendPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      if (err.code === 'auth/user-not-found') {
        // For security reasons, show success-like or neutral response
        setSuccess(true);
      } else {
        setError('Ocurrió un error al intentar enviar el enlace. Verifica el correo e intenta nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-brand-primary text-white font-extrabold text-xl mb-3 shadow-subtle">
          A
        </div>
        <h1 className="text-xl font-extrabold text-brand-text-primary tracking-tight">
          Recuperación de Contraseña
        </h1>
        <p className="mt-1 text-xs text-brand-text-secondary">
          Anima MKT CRM &middot; Acceso Seguro
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 border border-brand-border rounded-lg shadow-card">
          {success ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#15803D]/10 text-[#15803D] flex items-center justify-center mx-auto mb-4 border border-[#15803D]/30">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-brand-text-primary mb-2">
                Correo Enviado
              </h3>
              <p className="text-xs text-brand-text-secondary leading-relaxed mb-6">
                Si la dirección <strong>{email}</strong> está registrada, recibirás un enlace seguro para restablecer tu contraseña. Revisa también tu carpeta de spam.
              </p>
              <Link to="/login">
                <Button variant="primary" className="w-full justify-center text-sm py-2.5">
                  Volver a Iniciar Sesión
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {error && <Alert variant="error">{error}</Alert>}

              <p className="text-xs text-brand-text-secondary leading-relaxed mb-2">
                Ingresa tu correo electrónico registrado para enviarte las instrucciones de restablecimiento de contraseña.
              </p>

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

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="w-full justify-center text-sm font-semibold py-2.5"
                >
                  <KeyRound className="w-4 h-4 mr-2" />
                  Enviar Enlace de Recuperación
                </Button>
              </div>

              <div className="pt-4 border-t border-brand-border text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center text-xs font-medium text-brand-primary hover:text-brand-dark transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
