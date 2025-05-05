import { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { useAuth } from './context/AuthContext';
import Chatbot from './Chatbot';

// Import komponen autentikasi
import Login from './components/auth/login';
import RoleSelection from './components/auth/RoleSelection';
import RegisterSiswa from './components/auth/RegisterSiswa';
import RegisterOrangtua from './components/auth/RegisterOrangtua';
import RegisterGuru from './components/auth/RegisterGuru';

// Import halaman utama
import MainPage from './pages/MainPage';

// Import dashboard
import StudentDashboard from './components/dashboard/Student/StudentDashboard';

export default function App() {
  // Cek apakah user sudah login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { login, register, currentUser } = useAuth();
  
  // Cek status login saat komponen dimuat
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  // Effect untuk mengubah status login ketika currentUser berubah
  useEffect(() => {
    if (currentUser) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  }, [currentUser]);
  
  // Handler untuk login sukses
  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };
  
  return (
    <Routes>
      {/* Halaman Publik - Dapat diakses tanpa login */}
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/register/siswa" element={<RegisterSiswa register={register} />} />
      <Route path="/register/orangtua" element={<RegisterOrangtua register={register} />} />
      <Route path="/register/guru" element={<RegisterGuru register={register} />} />
      
      {/* Rute yang perlu login */}
      {isLoggedIn ? (
        <>
          <Route path="/dashboard/Student" element={<StudentDashboard />} />
          <Route path="/kursus" element={<StudentDashboard />} />
          <Route path="/kelas" element={<StudentDashboard />} />
          <Route path="/game" element={<StudentDashboard />} />
          <Route path="/notifikasi" element={<StudentDashboard />} />
          <Route path="/pengaturan" element={<StudentDashboard />} />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/profile" element={<div>Halaman Profil</div>} />
        </>
      ) : (
        // Redirect ke login jika mencoba mengakses rute yang memerlukan autentikasi
        <>
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
}