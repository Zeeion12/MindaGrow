import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../layout/layoutParts/SideBar';

const DashboardOrangtua = () => {
  const { user, logout } = useAuth();
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className="flex-1 pl-16 lg:pl-60"> {/* Adjust padding based on sidebar width */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">
              Dashboard Orang Tua
            </h1>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">{user?.nama_lengkap}</span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                Keluar
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Selamat datang, {user?.nama_lengkap}!</h2>
            <p className="text-gray-600">
              Ini adalah dashboard untuk orang tua. Pantau perkembangan anak Anda, lihat laporan kemajuan, dan tetap terhubung dengan guru di sini.
            </p>
          </div>
          
          {/* Child Info */}
          <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Informasi Anak
              </h3>
            </div>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-xl font-semibold">MS</span>
                </div>
                <div className="ml-4">
                  <h4 className="text-lg font-semibold text-gray-900">Muhamad Dimas</h4>
                  <p className="text-sm text-gray-500">Kelas 5A • NIS: 23523252</p>
                  <div className="mt-1 flex items-center">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      Matematika
                    </span>
                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Bahasa Indonesia
                    </span>
                    <span className="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      IPA
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Progress Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Kemajuan Belajar</h3>
                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Matematika</span>
                    <span className="text-sm font-medium text-gray-700">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '85%' }}></div>
                  </div>
                  
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">Bahasa Indonesia</span>
                    <span className="text-sm font-medium text-gray-700">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                    <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '75%' }}></div>
                  </div>
                  
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">IPA</span>
                    <span className="text-sm font-medium text-gray-700">92%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Kehadiran</h3>
                <div className="flex items-center">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#e5e7eb"
                        strokeWidth="2"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="2"
                        strokeDasharray="95, 100"
                      />
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-900">95%</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-500 mb-1">Total Kehadiran: 38/40 hari</p>
                    <p className="text-sm text-gray-500">Sakit: 1 hari</p>
                    <p className="text-sm text-gray-500">Izin: 1 hari</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">Tugas Terbaru</h3>
                <ul className="divide-y divide-gray-200">
                  <li className="py-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Matematika: Persamaan Kuadrat</p>
                        <p className="text-xs text-gray-500">Deadline: 10 Mei 2025</p>
                      </div>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Selesai
                      </span>
                    </div>
                  </li>
                  <li className="py-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Bahasa Indonesia: Esai Narasi</p>
                        <p className="text-xs text-gray-500">Deadline: 15 Mei 2025</p>
                      </div>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Ongoing
                      </span>
                    </div>
                  </li>
                  <li className="py-2">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-600">IPA: Eksperimen Sains</p>
                        <p className="text-xs text-gray-500">Deadline: 20 Mei 2025</p>
                      </div>
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                        Belum Mulai
                      </span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Teacher Messages */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Pesan dari Guru
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex">
                  <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-semibold">BP</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Budi Pratama (Guru Matematika)</p>
                    <p className="text-sm text-gray-500">Dimas menunjukkan kemajuan yang baik dalam pelajaran persamaan kuadrat. Ia aktif bertanya dan membantu teman-temannya.</p>
                    <p className="mt-1 text-xs text-gray-400">5 Mei 2025, 13:45</p>
                  </div>
                </div>
              </li>
              <li className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                <div className="flex">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">RS</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Rini Sulistyo (Guru Bahasa Indonesia)</p>
                    <p className="text-sm text-gray-500">Tolong ingatkan Dimas untuk mengumpulkan tugas esai narasinya sebelum tanggal 15 Mei. Ia memiliki potensi yang bagus dalam menulis.</p>
                    <p className="mt-1 text-xs text-gray-400">4 Mei 2025, 10:20</p>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardOrangtua;