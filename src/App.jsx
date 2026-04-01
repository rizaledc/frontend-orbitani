import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useState, useEffect } from 'react';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import MapDashboard from './features/map/MapDashboard';
import AIChat from './features/chat/AIChat';
import AnalyticsDashboard from './features/analytics/AnalyticsDashboard';
import HistoryReport from './features/history/HistoryReport';
import UserManagement from './features/admin/UserManagement';
import HumanChat from './features/chat/HumanChat';
import MainLayout from './components/layout/MainLayout';

/* Protected Route Wrapper */
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

/* Removed old AppLayout */

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);
  const initializeTheme = useThemeStore((state) => state.initializeTheme);

  useEffect(() => {
    initializeAuth();
    initializeTheme();
  }, [initializeAuth, initializeTheme]);

  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1c4234',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { style: { background: '#1c4234' } },
          error: { style: { background: '#DC2626' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<MapDashboard />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/support" element={<HumanChat />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/history" element={<HistoryReport />} />
            <Route path="/users" element={<UserManagement />} />
          </Route>
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
