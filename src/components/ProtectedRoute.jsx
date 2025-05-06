import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-blue-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    // Save the location they were trying to visit
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check user role for specific routes (optional)
  if (location.pathname.includes('/dashboard/Student') && user.role !== 'siswa') {
    return <Navigate to={`/dashboard/${user.role}`} replace />;
  }

  // If authenticated and role is correct, render the protected content
  return children;
};

export default ProtectedRoute;