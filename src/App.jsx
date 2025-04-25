import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './index.css';
import { AuthProvider } from './context/authContext';
import AppRouter from './router/appRouter';
import Navbar from './components/layout/Navbar';
import Chatbot from './Chatbot';

export default function App() {
  // Cek apakah user sudah login
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Cek status login saat komponen dimuat
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);
  
  // Jika belum login, tampilkan router autentikasi
  if (!isLoggedIn) {
    return (
      <AuthProvider>
        <AppRouter setIsLoggedIn={setIsLoggedIn} />
      </AuthProvider>
    );
  }
  
  // Jika sudah login, tampilkan konten dashboard
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col">
          <h1 className="text-center text-3xl font-bold">Welcome To MindaGrow</h1>
          <p className="text-center mt-4">
            Your E - Learning Platform
          </p>
          <Link to='/chatbot' >
            <button className='bg-biru-dasar text-white hover:bg-gold-first p-[10px] m-10 font-semibold rounded-2xl '>Click Here To Chat with AI</button>
          </Link>
        </div>
      </div>
    </>
  );
}