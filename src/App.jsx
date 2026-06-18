import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Eager load the main dashboard page to prevent LCP waterfalls
import DashboardPage from './pages/DashboardPage';

// Lazy load other pages for code splitting
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const WalletPage = lazy(() => import('./pages/WalletPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const BudgetSettingsPage = lazy(() => import('./pages/BudgetSettingsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SecurityPage = lazy(() => import('./pages/SecurityPage'));

// A minimal fallback loader
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center min-h-screen bg-canvas">
    <div className="w-8 h-8 border-2 border-slate-200 border-t-accent-blue rounded-full animate-spin" />
  </div>
);

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <img src="/circle.png" alt="Logo" className="w-12 h-12 object-contain animate-pulse" />
          <div className="w-8 h-8 border-2 border-slate-200 border-t-accent-blue rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route
          path="/register"
          element={isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />}
        />

        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/budget/settings" element={<BudgetSettingsPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/profile" element={<ProfilePage />} />
          <Route path="/settings/security" element={<SecurityPage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
