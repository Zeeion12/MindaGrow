import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiCrown } from 'react-icons/bi';
import { useAuth } from '../../../context/AuthContext';
import SideBar from '../../layout/SideBar';

// Card Import
import CardKursus from '../../layout/TaskCard/CardKursus';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect ke login jika user tidak ada
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Jika tidak ada user, jangan render apapun
  if (!currentUser) {
    return null;
  }

  // Coba berbagai format nama yang mungkin ada di objek currentUser
  // Sesuaikan dengan struktur database PostgreSQL
  const userName = currentUser.nama_lengkap || currentUser.name || currentUser.nis || "User";

  return (
    <div className="flex h-screen">
      <SideBar />

      {/* Main Content */}
      <main className="flex-1 bg-blue-50">
        {/* Header */}
        
        <header className="bg-blue-50 p-4 flex justify-between items-center">
          <h1 className="text-lg">
            👋 Selamat datang, {userName}! Siap belajar seru hari ini?
          </h1>
          
          {/* User Avatar */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {currentUser?.profile_image ? (
              <img 
                src={currentUser.profile_image} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-gray-500">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4">
          {/* Dashboard content will go here */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Placeholder untuk konten dashboard */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Kursus Aktif</h2>
              <p className="text-gray-600">Anda belum memiliki kursus aktif.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Tugas Terbaru</h2>
              <p className="text-gray-600">Tidak ada tugas yang menunggu.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Pengumuman</h2>
              <p className="text-gray-600">Tidak ada pengumuman terbaru.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;