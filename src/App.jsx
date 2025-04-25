import { useState, useEffect } from 'react';
import { Link, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import { useAuth } from './context/authContext';
import Navbar from './components/layout/Navbar';
import Chatbot from './Chatbot';

// Import komponen autentikasi
import Login from './components/auth/Login';
import RoleSelection from './components/auth/register/roleSelection';
import RegisterSiswa from './components/auth/register/registerSiswa';
import RegisterOrangtua from './components/auth/register/registerOrangtua';
import RegisterGuru from './components/auth/register/registerGuru';

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
  
  // Handler untuk logout sukses
  const handleLogoutSuccess = () => {
    setIsLoggedIn(false);
  };
  
  // Jika sudah login, tampilkan konten dashboard dan fitur lainnya
  if (isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={
          <>
            <Navbar />
            <div className="flex min-h-screen items-center justify-center">
              <div className="flex flex-col">
                <h1 className="text-center text-3xl font-bold">Welcome To MindaGrow</h1>
                <p className="text-center mt-4">
                  Your E - Learning Platform
                </p>
                <Link to='/chatbot'>
                  <button className='bg-biru-dasar text-white hover:bg-gold-first p-[10px] m-10 font-semibold rounded-2xl'>Click Here To Chat with AI</button>
                </Link>
              </div>
            </div>
          </>
        } />
        
        <Route path="/chatbot" element={
          <>
            <Navbar />
            <Chatbot />
          </>
        } />
        
        {/* Tambahkan rute lain yang memerlukan autentikasi di sini */}
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    );
  }
  
  // Jika belum login, tampilkan rute autentikasi
  return (
    <Routes>
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
}