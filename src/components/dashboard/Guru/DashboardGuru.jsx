import React from 'react';
import { useAuth } from '../../../context/AuthContext';

const DashboardGuru = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">MindaGrow</h1>
              </div>
            </div>
            <div className="flex items-center">
              <div className="hidden md:ml-4 md:flex-shrink-0 md:flex md:items-center">
                <div className="ml-3 relative">
                  <div className="flex items-center">
                    <span className="text-gray-700 mr-2">{user?.nama_lengkap}</span>
                    <button
                      onClick={logout}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <header>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Dashboard Guru
            </h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mt-4 bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Selamat datang, {user?.nama_lengkap}!</h2>
              <p className="text-gray-600">
                Ini adalah dashboard untuk guru. Anda dapat mengelola kelas, melihat perkembangan siswa, dan aktivitas lainnya di sini.
              </p>
            </div>
            
            {/* Placeholder content */}
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Kelas Saya</h3>
                  <div className="mt-4">
                    <p className="text-gray-600">Daftar kelas akan ditampilkan di sini.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Tugas & Penilaian</h3>
                  <div className="mt-4">
                    <p className="text-gray-600">Tugas dan penilaian akan ditampilkan di sini.</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Jadwal Mengajar</h3>
                  <div className="mt-4">
                    <p className="text-gray-600">Jadwal mengajar akan ditampilkan di sini.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardGuru;