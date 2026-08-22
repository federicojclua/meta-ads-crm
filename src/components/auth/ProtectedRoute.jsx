import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function ProtectedRoute({ children, allowedRoles }) {
  const { firebaseUser, userProfile, loading, isEmailVerified, authError } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-3 border-brand-border border-t-brand-primary rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-semibold text-brand-text-secondary uppercase tracking-widest">
          Cargando CRM...
        </p>
      </div>
    );
  }

  if (!firebaseUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  if (!userProfile) {
    return <Navigate to="/unauthorized" state={{ error: authError }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/unauthorized" state={{ error: 'No tienes permisos suficientes para acceder a esta sección.' }} replace />;
  }

  return children;
}
