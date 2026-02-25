import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

// Auth Pages
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import RoomsPage from './pages/admin/RoomsPage.jsx';
import TenantsPage from './pages/admin/TenantsPage.jsx';
import PaymentsPage from './pages/admin/PaymentsPage.jsx';
import ComplaintsPage from './pages/admin/ComplaintsPage.jsx';
import AuditLogsPage from './pages/admin/AuditLogsPage.jsx';

// Tenant Pages
import TenantDashboard from './pages/tenant/TenantDashboard.jsx';
import MyRoomPage from './pages/tenant/MyRoomPage.jsx';
import MyPaymentsPage from './pages/tenant/MyPaymentsPage.jsx';
import MyComplaintsPage from './pages/tenant/MyComplaintsPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1f2937',
                color: '#f9fafb',
                border: '1px solid #374151',
                borderRadius: '12px',
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/"         element={<Navigate to="/login" replace />} />

            {/* Admin Routes */}
            <Route element={<ProtectedRoute role="admin" />}>
              <Route element={<Layout />}>
                <Route path="/admin/dashboard"  element={<AdminDashboard />} />
                <Route path="/admin/rooms"       element={<RoomsPage />} />
                <Route path="/admin/tenants"     element={<TenantsPage />} />
                <Route path="/admin/payments"    element={<PaymentsPage />} />
                <Route path="/admin/complaints"  element={<ComplaintsPage />} />
                <Route path="/admin/audit-logs"  element={<AuditLogsPage />} />
              </Route>
            </Route>

            {/* Tenant Routes */}
            <Route element={<ProtectedRoute role="tenant" />}>
              <Route element={<Layout />}>
                <Route path="/tenant/dashboard"   element={<TenantDashboard />} />
                <Route path="/tenant/room"         element={<MyRoomPage />} />
                <Route path="/tenant/payments"     element={<MyPaymentsPage />} />
                <Route path="/tenant/complaints"   element={<MyComplaintsPage />} />
              </Route>
            </Route>

            {/* 404 */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
