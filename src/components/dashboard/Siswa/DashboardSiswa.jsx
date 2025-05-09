import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { RiBarChartFill } from 'react-icons/ri';
import Header from '../../layout/layoutParts/Header';

const DashboardSiswa = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="h-screen flex flex-col">
      <Header/>
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Welcome Card */}
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Selamat datang, {user?.nama_lengkap}!</h2>
            <p className="text-gray-600">
              Ini adalah dashboard personalisasi untuk siswa. Anda dapat melihat kemajuan belajar, tugas, dan aktivitas lainnya di sini.
            </p>
          </div>
          
          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Kemajuan Belajar Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 p-3 rounded-lg mr-4">
                  <RiBarChartFill className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600">Kemajuan Belajar</p>
                  <h3 className="text-2xl font-bold text-gray-800">72%</h3>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '72%' }}></div>
              </div>
            </div>
            
            {/* Points Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-400 p-3 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600">Total Poin</p>
                  <h3 className="text-2xl font-bold text-gray-800">1,250</h3>
                </div>
              </div>
              <div className="text-sm text-green-500 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                </svg>
                +25 hari ini
              </div>
            </div>
            
            {/* Tasks Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-500 p-3 rounded-lg mr-4">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600">Tugas</p>
                  <h3 className="text-2xl font-bold text-gray-800">5</h3>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-500">3 selesai</span>
                <span className="text-yellow-500">2 baru</span>
              </div>
            </div>
          </div>
          
          {/* Activities Section */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Aktivitas Terbaru</h3>
            </div>
            <div className="divide-y divide-gray-200">
              <div className="p-4 hover:bg-gray-50">
                <a href="#" className="text-blue-600 font-medium">Matematika: Persamaan Kuadrat</a>
                <p className="text-gray-600 mt-1">Anda mendapatkan nilai 85/100</p>
              </div>
              <div className="p-4 hover:bg-gray-50">
                <a href="#" className="text-blue-600 font-medium">Bahasa Indonesia: Menulis Narasi</a>
                <p className="text-gray-600 mt-1">Tugas baru ditambahkan - deadline 12 Mei</p>
              </div>
              <div className="p-4 hover:bg-gray-50">
                <a href="#" className="text-blue-600 font-medium">Game: Petualangan Angka</a>
                <p className="text-gray-600 mt-1">Anda mencapai level 5 dan mendapatkan 50 poin</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardSiswa;