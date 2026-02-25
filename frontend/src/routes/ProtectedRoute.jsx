import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const ProtectedRoute = ({ role }) => {
  const { user, loading } = useAuth();

  // Show spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Wrong role → redirect to their correct dashboard
  if (role && user.role !== role) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  // All checks passed → render child routes
  return <Outlet />;
};

export default ProtectedRoute;
