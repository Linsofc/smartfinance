import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import WalletPage from './pages/WalletPage';
import SettingsPage from './pages/SettingsPage';
import BudgetPage from './pages/BudgetPage';
import BudgetSettingsPage from './pages/BudgetSettingsPage';

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-gradient-violet to-gradient-magenta flex items-center justify-center animate-pulse">
            <span className="text-lg font-bold text-white">S</span>
          </div>
          <div className="w-8 h-8 border-2 border-ink-muted border-t-accent-blue rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
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
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
