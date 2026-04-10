import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from '@phosphor-icons/react';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import LandingPage from './features/landing/LandingPage';
import Login from './features/auth/Login';
import Register from './features/auth/Register';
import MapDashboard from './features/map/MapDashboard';
import AIChat from './features/chat/AIChat';
import AnalyticsDashboard from './features/analytics/AnalyticsDashboard';
import HistoryReport from './features/history/HistoryReport';
import UserManagement from './features/admin/UserManagement';
import OrganizationList from './features/admin/OrganizationList';
import MLOpsDashboard from './features/admin/MLOpsDashboard';
import UserProfile from './features/profile/UserProfile';
import HumanChat from './features/chat/HumanChat';
import MainLayout from './components/layout/MainLayout';

/* Helper to get role safely */
const getUserRole = () => {
  const token = localStorage.getItem('orbitani_token');
  if (!token) return 'user';
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || 'user';
  } catch {
    return 'user';
  }
};

/* Protected Route Wrapper */
const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
};

/* Role Based Route Wrapper */
const RoleProtectedRoute = ({ allowedRoles }) => {
  const role = getUserRole();
  if (!allowedRoles.includes(role)) {
    // If not allowed, silently redirect back to dashboard
    return <Navigate to="/dashboard" replace />;
  }
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
        position="bottom-right"
        containerStyle={{ zIndex: 99999, pointerEvents: 'none' }}
        toastOptions={{
          duration: 4000,
          style: {
            pointerEvents: 'auto',
            background: '#ffffff',
            color: '#1f2937',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #f3f4f6',
            padding: '12px 16px',
            fontWeight: '500',
            maxWidth: '400px',
          },
          success: { 
            iconTheme: { primary: '#1c4234', secondary: '#ffffff' } 
          },
          error: { 
            iconTheme: { primary: '#ef4444', secondary: '#ffffff' } 
          },
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <>
                {icon}
                <div className="flex-1 min-w-0 pr-2">{message}</div>
                {t.type !== 'loading' && (
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="flex shrink-0 items-center justify-center p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none"
                    aria-label="Tutup notifikasi"
                  >
                    <X size={16} weight="bold" />
                  </button>
                )}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>
      <Routes>
        {/* Landing Page — root / */}
        <Route path="/" element={<LandingPage />} />

        {/* Public auth routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            {/* Global Access (All authenticated) */}
            <Route path="/dashboard" element={<MapDashboard />} />
            <Route path="/chat" element={<AIChat />} />
            <Route path="/support" element={<HumanChat />} />
            <Route path="/profile" element={<UserProfile />} />

            {/* Admin & Superadmin Access */}
            <Route element={<RoleProtectedRoute allowedRoles={['admin', 'superadmin']} />}>
              <Route path="/analytics" element={<AnalyticsDashboard />} />
              <Route path="/history" element={<HistoryReport />} />
              <Route path="/users" element={<UserManagement />} />
            </Route>

            {/* Strict Superadmin Access */}
            <Route element={<RoleProtectedRoute allowedRoles={['superadmin']} />}>
              <Route path="/admin/organizations" element={<OrganizationList />} />
              <Route path="/admin/mlops" element={<MLOpsDashboard />} />
            </Route>
          </Route>
        </Route>

        {/* Catch-all → back to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
