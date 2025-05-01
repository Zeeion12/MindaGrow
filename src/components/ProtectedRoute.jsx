import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Component to protect routes based on authentication and role
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, loading, getUserRole } = useAuth();
  const location = useLocation();
  
  // Show loading state if still determining authentication status
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-700">Memverifikasi akun...</p>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  // If no specific roles are required, allow access
  if (allowedRoles.length === 0) {
    return children;
  }
  
  // Get user role
  const userRole = getUserRole();
  console.log('User role:', userRole, 'Allowed roles:', allowedRoles);
  
  // If user role is allowed, grant access
  if (userRole && allowedRoles.includes(userRole)) {
    return children;
  }
  
  // If user has a role but it's not allowed, redirect to dashboard based on role
  if (userRole) {
    // Redirect to appropriate dashboard based on role
    switch (userRole) {
      case 'siswa':
        return <Navigate to="/siswa/dashboard" replace />;
      case 'orangtua':
        return <Navigate to="/orangtua/dashboard" replace />;
      case 'guru':
        return <Navigate to="/guru/dashboard" replace />;
      default:
        return <Navigate to="/dashboard" replace />;
    }
  }
  
  // Fallback: redirect to login with message about missing role
  return <Navigate to="/login" state={{ 
    message: "Anda tidak memiliki akses ke halaman ini. Silakan login dengan akun yang sesuai." 
  }} replace />;
};

export default ProtectedRoute;