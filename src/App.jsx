import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoleSelection from './components/auth/RoleSelection';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import DashboardSiswa from './components/dashboard/DashboardSiswa';
import DashboardGuru from './components/dashboard/DashboardGuru';
import DashboardOrangtua from './components/dashboard/DashboardOrangtua';
import DashboardLayout from './components/layout/DashboardLayout';
import ProfileSettings from './pages/setting/ProfileSettings';
import { AuthProvider, useAuth } from './context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/register/:role" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route path="/dashboard/siswa" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <DashboardSiswa />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/guru" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <DashboardGuru />
            </ProtectedRoute>
          } />
          <Route path="/dashboard/orangtua" element={
            <ProtectedRoute allowedRoles={['orangtua']}>
              <DashboardOrangtua />
            </ProtectedRoute>
          } />
          <Route path="/pengaturan" element={<ProfileSettings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;