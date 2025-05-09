import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import Sidebar from '../../layout/layoutParts/SideBar';

const DashboardGuru = () => {
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
              Dashboard Guru
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
              Ini adalah dashboard untuk guru. Pantau perkembangan siswa, kelola kelas, dan lihat statistik pembelajaran di sini.
            </p>
          </div>
          
          {/* Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Classes Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Kelas
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        4
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Students Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Siswa
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        124
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Assignments Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-yellow-400 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Tugas Aktif
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        8
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Average Performance */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Rata-rata Nilai
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">
                        82%
                      </div>
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Class List */}
          <div className="mt-6 bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Kelas Saya
              </h3>
            </div>
            <ul className="divide-y divide-gray-200">
              <li className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">5A</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-blue-600">
                        Kelas 5A - Matematika
                      </div>
                      <div className="text-sm text-gray-500">
                        32 siswa • Senin, Rabu, Jumat
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    <button className="ml-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                      Detail
                    </button>
                  </div>
                </div>
              </li>
              <li className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <span className="text-yellow-600 font-semibold">4C</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-blue-600">
                        Kelas 4C - Matematika
                      </div>
                      <div className="text-sm text-gray-500">
                        28 siswa • Senin, Selasa
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    <button className="ml-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                      Detail
                    </button>
                  </div>
                </div>
              </li>
              <li className="hover:bg-gray-50">
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">3A</span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-blue-600">
                        Kelas 3A - Matematika
                      </div>
                      <div className="text-sm text-gray-500">
                        34 siswa • Rabu, Jumat
                      </div>
                    </div>
                  </div>
                  <div className="flex">
                    <button className="ml-2 px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200">
                      Detail
                    </button>
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

export default DashboardGuru;