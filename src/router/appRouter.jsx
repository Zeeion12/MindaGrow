import { Navigate, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';

// Import komponen halaman publik
import MainPage from '../pages/MainPage';
import Login from '../components/auth/Login';
import RoleSelection from '../components/auth/RoleSelection';
import RegisterSiswa from '../components/auth/RegisterSiswa';
import RegisterOrangtua from '../components/auth/RegisterOrangtua';
import RegisterGuru from '../components/auth/RegisterGuru';

// Import komponen halaman yang memerlukan autentikasi
import StudentDashboard from '../components/dashboard/StudentDashboard';
import Chatbot from '../Chatbot';

const AppRouter = () => {
  // State untuk mengelola status login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Periksa status login saat komponen dimuat
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      if (token) {
        setIsLoggedIn(true);
      }
    };
    
    checkLoginStatus();
  }, []);

  // Handler untuk login sukses
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  // Handler untuk logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
  };

  return (
    <Routes>
      {/* Rute publik */}
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<Login onLoginSuccess={handleLoginSuccess} />} />
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/register/siswa" element={<RegisterSiswa />} />
      <Route path="/register/orangtua" element={<RegisterOrangtua />} />
      <Route path="/register/guru" element={<RegisterGuru />} />
      
      {/* Rute yang memerlukan autentikasi */}
      {isLoggedIn ? (
        <>
          <Route path="/dashboard" element={<StudentDashboard onLogout={handleLogout} />} />
          <Route path="/kursus" element={<StudentDashboard onLogout={handleLogout} />} />
          <Route path="/kelas" element={<StudentDashboard onLogout={handleLogout} />} />
          <Route path="/game" element={<StudentDashboard onLogout={handleLogout} />} />
          <Route path="/notifikasi" element={<StudentDashboard onLogout={handleLogout} />} />
          <Route path="/pengaturan" element={<StudentDashboard onLogout={handleLogout} />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/profile" element={<div>Halaman Profil</div>} />
        </>
      ) : (
        <>
          {/* Redirect ke login jika mencoba mengakses halaman yang memerlukan autentikasi */}
          <Route path="/dashboard" element={<Navigate to="/login" />} />
          <Route path="/kursus" element={<Navigate to="/login" />} />
          <Route path="/kelas" element={<Navigate to="/login" />} />
          <Route path="/game" element={<Navigate to="/login" />} />
          <Route path="/notifikasi" element={<Navigate to="/login" />} />
          <Route path="/pengaturan" element={<Navigate to="/login" />} />
          <Route path="/chatbot" element={<Navigate to="/login" />} />
          <Route path="/profile" element={<Navigate to="/login" />} />
        </>
      )}
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;