import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

// Import komponen autentikasi
import Login from '../components/auth/Login';
import RoleSelection from '../components/auth/register/roleSelection';
import RegisterSiswa from '../components/auth/register/registerSiswa';
import RegisterOrangtua from '../components/auth/register/registerOrangtua';
import RegisterGuru from '../components/auth/register/registerGuru';

// PERHATIKAN: Tidak ada lagi BrowserRouter di sini

const AppRouter = ({ setIsLoggedIn }) => {
  const { login, register } = useAuth();
  
  // Handler untuk login sukses
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  return (
    <Routes>
      {/* Rute publik */}
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} login={login} />} />
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/register/siswa" element={<RegisterSiswa register={register} />} />
      <Route path="/register/orangtua" element={<RegisterOrangtua register={register} />} />
      <Route path="/register/guru" element={<RegisterGuru register={register} />} />
      
      {/* Redirect ke login */}
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
};

export default AppRouter;