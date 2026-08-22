import { useState } from 'react';
import {
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { auth, validatePasswordPolicy } from '../lib/firebase';
import { formatRole } from '../lib/utils';

export function SettingsPage() {
  const {
    userProfile,
    firebaseUser,
    hasGoogleProvider,
    hasPasswordProvider,
    linkPasswordAccount,
    sendPasswordReset,
  } = useAuth();

  const [isLinking, setIsLinking] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPasswordValidLength = newPassword.length >= 6;
  const canSubmit = isPasswordValidLength && passwordsMatch && !actionLoading;

  const handleLinkPassword = async (e) => {
    e.preventDefault();
    setFeedback(null);

    if (!passwordsMatch) {
      setFeedback({
        type: 'error',
        message: 'Las contraseñas ingresadas no coinciden.',
      });
      return;
    }

    setActionLoading(true);
    try {
      // Validate against configured Firebase Password Policy dynamically
      try {
        if (typeof validatePasswordPolicy === 'function') {
          const validationStatus = await validatePasswordPolicy(auth, newPassword);
          if (validationStatus && !validationStatus.isValid) {
            const unmetRequirements = [];
            if (!validationStatus.meetsMinPasswordLength) {
              unmetRequirements.push('longitud mínima de la política de seguridad');
            }
            if (!validationStatus.containsLowercaseLetter) {
              unmetRequirements.push('al menos una letra minúscula');
            }
            if (!validationStatus.containsUppercaseLetter) {
              unmetRequirements.push('al menos una letra mayúscula');
            }
            if (!validationStatus.containsNumericCharacter) {
              unmetRequirements.push('al menos un número');
            }
            if (!validationStatus.containsNonAlphanumericCharacter) {
              unmetRequirements.push('al menos un carácter especial');
            }

            const errorDetail = unmetRequirements.length > 0
              ? ` Requisitos pendientes: ${unmetRequirements.join(', ')}.`
              : '';

            setFeedback({
              type: 'error',
              message: `La contraseña no cumple con la política de seguridad configurada en Firebase.${errorDetail}`,
            });
            // La contraseña se elimina inmediatamente del estado de React después del envío o cancelación y nunca se persiste ni registra
            setNewPassword('');
            setConfirmPassword('');
            setActionLoading(false);
            return;
          }
        }
      } catch (validationErr) {
        // If validatePassword is not supported or errors offline, proceed to linkWithCredential which enforces it
        console.warn('[AUTH] validatePassword check skipped or failed:', validationErr.message);
      }

      await linkPasswordAccount(newPassword);
      // La contraseña se elimina inmediatamente del estado de React después del envío o cancelación y nunca se persiste ni registra
      setNewPassword('');
      setConfirmPassword('');
      setIsLinking(false);
      setFeedback({
        type: 'success',
        message: '¡Contraseña vinculada exitosamente! Ahora podés iniciar sesión tanto con Google como con correo y contraseña.',
      });
    } catch (err) {
      // La contraseña se elimina inmediatamente del estado de React después del envío o cancelación y nunca se persiste ni registra
      setNewPassword('');
      setConfirmPassword('');

      let message = 'No se pudo vincular la contraseña. Intente nuevamente.';
      if (err.code === 'auth/weak-password') {
        message = 'La contraseña ingresada es demasiado débil según la política de Firebase. Utilice una contraseña más segura con mayúsculas, minúsculas y números.';
      } else if (err.code === 'auth/credential-already-in-use') {
        message = 'Esta credencial ya se encuentra en uso por otra cuenta. Por seguridad, no se permite la fusión automática de cuentas.';
      } else if (err.code === 'auth/requires-recent-login') {
        message = 'Por seguridad, cierre sesión e inicie nuevamente con Google antes de vincular la contraseña.';
      } else if (err.message) {
        message = err.message;
      }

      setFeedback({
        type: 'error',
        message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!firebaseUser?.email) return;
    setActionLoading(true);
    setFeedback(null);
    try {
      await sendPasswordReset(firebaseUser.email);
      setResetEmailSent(true);
      setFeedback({
        type: 'success',
        message: `Se envió un correo de restablecimiento a ${firebaseUser.email}. Verifique su bandeja de entrada.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: 'Error al enviar el correo de restablecimiento: ' + (err.message || 'Intente más tarde.'),
      });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-brand-border gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-brand-text-primary tracking-tight">
            Configuración del Sistema
          </h1>
          <p className="text-xs md:text-sm text-brand-text-secondary mt-0.5">
            Gestión de perfil, identidad y seguridad de acceso a Anima MKT CRM.
          </p>
        </div>
        <div>
          <Badge variant="primary" className="text-xs py-1 px-3 uppercase tracking-wider font-bold">
            {formatRole(userProfile?.role)}
          </Badge>
        </div>
      </div>

      {/* Global Feedback Alert */}
      {feedback && (
        <div
          role="alert"
          className={`p-4 rounded-md border flex items-start gap-3 text-xs leading-relaxed ${
            feedback.type === 'success'
              ? 'bg-green-50 border-status-success/40 text-status-success'
              : 'bg-red-50 border-brand-primary/40 text-brand-primary'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-status-success" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-brand-primary" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Perfil Autenticado */}
      <div className="bg-white p-6 border border-brand-border rounded-lg shadow-subtle">
        <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-primary" />
          <span>Perfil de Identidad & Rol</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 bg-[#F7F6F2] border border-brand-border rounded">
            <span className="text-brand-text-secondary block font-semibold mb-1">Correo Electrónico:</span>
            <span className="font-mono font-medium text-brand-text-primary">{userProfile?.email || firebaseUser?.email}</span>
          </div>
          <div className="p-3.5 bg-[#F7F6F2] border border-brand-border rounded">
            <span className="text-brand-text-secondary block font-semibold mb-1">Rol en MongoDB:</span>
            <span className="font-mono font-extrabold text-brand-primary tracking-wide">
              {formatRole(userProfile?.role)}
            </span>
          </div>
        </div>
      </div>

      {/* Seguridad de Acceso & Métodos de Autenticación */}
      <div className="bg-white p-6 border border-brand-border rounded-lg shadow-subtle space-y-6">
        <div>
          <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand-primary" />
            <span>Seguridad de Acceso & Proveedores Vinculados</span>
          </h3>
          <p className="text-xs text-brand-text-secondary mt-1">
            Administrá los métodos de autenticación habilitados para ingresar a tu cuenta.
          </p>
        </div>

        {/* Proveedores Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Google */}
          <div className="p-4 border border-brand-border rounded-md bg-[#F7F6F2]/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white border border-brand-border flex items-center justify-center text-xs font-bold text-brand-primary">
                    G
                  </div>
                  <span className="text-xs font-bold text-brand-text-primary">Google Workspace / Gmail</span>
                </div>
                {hasGoogleProvider ? (
                  <Badge variant="success" className="text-[10px] px-2 py-0.5">
                    Conectado
                  </Badge>
                ) : (
                  <Badge variant="neutral" className="text-[10px] px-2 py-0.5">
                    No conectado
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-brand-text-secondary">
                {hasGoogleProvider
                  ? `Vinculado al correo ${firebaseUser?.email || userProfile?.email}.`
                  : 'No disponible como método de inicio directo.'}
              </p>
            </div>
          </div>

          {/* Contraseña */}
          <div className="p-4 border border-brand-border rounded-md bg-[#F7F6F2]/60 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-white border border-brand-border flex items-center justify-center text-xs font-bold text-brand-primary">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-brand-text-primary">Contraseña Directa</span>
                </div>
                {hasPasswordProvider ? (
                  <Badge variant="success" className="text-[10px] px-2 py-0.5">
                    Configurada
                  </Badge>
                ) : (
                  <Badge variant="warning" className="text-[10px] px-2 py-0.5">
                    No configurada
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-brand-text-secondary">
                {hasPasswordProvider
                  ? 'Permite iniciar sesión ingresando correo y contraseña en el CRM.'
                  : 'Tu cuenta fue creada con Google. Podés configurar una contraseña para habilitar acceso directo.'}
              </p>
            </div>

            {hasPasswordProvider && (
              <div className="mt-3 pt-3 border-t border-brand-border/60 flex items-center justify-between">
                <span className="text-[11px] text-brand-text-secondary">¿Olvidaste o querés cambiarla?</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSendResetEmail}
                  disabled={actionLoading || resetEmailSent}
                  className="text-[11px] text-brand-primary p-0 hover:bg-transparent underline"
                >
                  {resetEmailSent ? 'Correo enviado' : 'Restablecer vía Email'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Action Panel: Crear contraseña si no está configurada */}
        {!hasPasswordProvider && (
          <div className="p-4 border border-brand-border bg-white rounded-md space-y-4">
            {!isLinking ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-brand-text-primary">
                    ¿Deseas habilitar acceso con correo y contraseña?
                  </h4>
                  <p className="text-[11px] text-brand-text-secondary mt-0.5">
                    Te permitirá ingresar directamente sin depender del popup de Google. Tu cuenta y permisos permanecerán idénticos.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsLinking(true);
                    setFeedback(null);
                  }}
                  className="shrink-0 text-xs"
                >
                  Crear Contraseña
                </Button>
              </div>
            ) : (
              <form onSubmit={handleLinkPassword} className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-brand-text-primary uppercase tracking-wider">
                    Configurar Contraseña de Acceso
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setIsLinking(false);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-[11px] text-brand-text-secondary hover:text-brand-text-primary underline"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nueva Contraseña */}
                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-xs font-semibold text-brand-text-primary mb-1"
                    >
                      Nueva Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        autoComplete="new-password"
                        required
                        disabled={actionLoading}
                        className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-white pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary"
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Contraseña */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-xs font-semibold text-brand-text-primary mb-1"
                    >
                      Confirmar Contraseña
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repetí la contraseña"
                        autoComplete="new-password"
                        required
                        disabled={actionLoading}
                        className="w-full px-3 py-2 text-xs border border-brand-border rounded focus:outline-none focus:ring-1 focus:ring-brand-primary focus:border-brand-primary bg-white pr-9"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-text-secondary hover:text-brand-text-primary"
                        aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Validation indicators */}
                <div className="space-y-1 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isPasswordValidLength ? 'bg-status-success' : 'bg-brand-border'
                      }`}
                    />
                    <span className={isPasswordValidLength ? 'text-status-success font-medium' : 'text-brand-text-secondary'}>
                      Al menos 6 caracteres
                    </span>
                  </div>
                  {confirmPassword.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          passwordsMatch ? 'bg-status-success' : 'bg-brand-primary'
                        }`}
                      />
                      <span className={passwordsMatch ? 'text-status-success font-medium' : 'text-brand-primary'}>
                        {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!canSubmit}
                    className="text-xs gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{actionLoading ? 'Vinculando...' : 'Establecer Contraseña'}</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
