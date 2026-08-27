import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { ServiceUnavailablePage } from './pages/ServiceUnavailablePage';

// Lazy load page components to optimize initial bundle size
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const VerifyEmailPage = lazy(() => import('./pages/VerifyEmailPage').then(m => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const UnauthorizedPage = lazy(() => import('./pages/UnauthorizedPage').then(m => ({ default: m.UnauthorizedPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const AdminCenterPage = lazy(() => import('./pages/AdminCenterPage').then(m => ({ default: m.AdminCenterPage })));
const LeadsPage = lazy(() => import('./pages/LeadsPage').then(m => ({ default: m.LeadsPage })));
const CampaignsPage = lazy(() => import('./pages/CampaignsPage').then(m => ({ default: m.CampaignsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const SocialAnalyzerPage = lazy(() => import('./pages/SocialAnalyzerPage').then(m => ({ default: m.SocialAnalyzerPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const RevenueDashboardPage = lazy(() => import('./pages/RevenueDashboardPage').then(m => ({ default: m.RevenueDashboardPage })));

export function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F7F6F2] flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-border border-t-brand-primary rounded-full animate-spin mb-3"></div>
        </div>
      }
    >
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
          <Route path="social-analyzer" element={<SocialAnalyzerPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
