import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { ServiceUnavailablePage } from './pages/ServiceUnavailablePage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminCenterPage } from './pages/AdminCenterPage';
import { LeadsPage } from './pages/LeadsPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RevenueDashboardPage } from './pages/RevenueDashboardPage';

export function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="/service-unavailable" element={<ServiceUnavailablePage />} />

      {/* Root redirect to App */}
      <Route path="/" element={<Navigate to="/app" replace />} />

      {/* Protected CRM Routes */}
      <Route
        path="/app"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="revenue" element={<RevenueDashboardPage />} />
        <Route path="admin" element={<AdminCenterPage />} />
        <Route path="clients" element={<Navigate to="/app/admin" replace />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
