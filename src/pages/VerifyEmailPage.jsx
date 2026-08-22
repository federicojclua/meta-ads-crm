import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MailCheck, RefreshCw, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/Button';
import { Alert } from '../components/ui/Alert';

export function VerifyEmailPage() {
  const { firebaseUser, sendVerification, refreshProfile, logout } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleResend = async () => {
    setError(null);
    setMessage(null);
    setSending(true);

    try {
      await sendVerification();
      setMessage('Correo de verificación enviado. Revisa tu bandeja de entrada o spam.');
    } catch (err) {
      console.error('Error sending verification:', err);
      if (err.code === 'auth/too-many-requests') {
        setError('Has solicitado demasiados correos recientemente. Por favor, espera unos minutos.');
      } else {
        setError('No se pudo enviar el correo de verificación. Intenta nuevamente.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleCheckVerified = async () => {
    setError(null);
    setMessage(null);
    setChecking(true);

    try {
      const profile = await refreshProfile();
      if (profile) {
        navigate('/app', { replace: true });
      } else {
        setMessage('Tu correo aún no figura como verificado en Firebase. Si hiciste clic en el enlace, espera unos instantes y vuelve a presionar "Ya lo verifiqué".');
      }
    } catch (err) {
      console.error('Error checking verification:', err);
      setError('Error al constatar el estado con el servidor.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full mx-auto bg-white p-8 border border-brand-border rounded-lg shadow-card text-center">
        <div className="w-12 h-12 rounded-full bg-[#F4C430]/20 border border-[#F4C430]/40 flex items-center justify-center text-[#854D0E] mx-auto mb-4">
          <MailCheck className="w-6 h-6" />
        </div>

        <h2 className="text-xl font-bold text-brand-text-primary tracking-tight mb-2">
          Verificación de Correo Requerida
        </h2>

        <p className="text-xs text-brand-text-secondary mb-6 leading-relaxed">
          Para acceder a <strong>Anima MKT CRM</strong> y activar tu perfil, debes verificar la dirección de correo electrónico asociada:
          <span className="block font-semibold text-brand-text-primary mt-1 text-sm">
            {firebaseUser?.email || 'tu-correo@agencia.com'}
          </span>
        </p>

        {message && (
          <Alert variant="info" className="mb-6 text-left">
            {message}
          </Alert>
        )}

        {error && (
          <Alert variant="error" className="mb-6 text-left">
            {error}
          </Alert>
        )}

        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={handleCheckVerified}
            loading={checking}
            className="w-full justify-center text-sm py-2.5"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Ya verifiqué mi correo
          </Button>

          <Button
            variant="secondary"
            onClick={handleResend}
            loading={sending}
            className="w-full justify-center text-sm py-2.5"
          >
            Reenviar enlace de verificación
          </Button>

          <div className="pt-3 border-t border-brand-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="w-full justify-center text-xs text-brand-text-secondary hover:text-brand-primary"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" />
              Cerrar sesión e ingresar con otra cuenta
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
