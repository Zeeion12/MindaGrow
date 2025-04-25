import React from 'react';
import { Link } from 'react-router-dom';
import { BiCrown } from 'react-icons/bi';
import { useAuth } from '../../context/AuthContext';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const userName = currentUser?.name || "User";

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-[140px] bg-blue-500 flex flex-col">
        {/* Logo */}
        <div className="p-4 flex items-center">
          <img 
            src="/images/logo.png" 
            alt="MindaGrow" 
            className="w-8 h-8 mr-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'/%3E%3C/svg%3E";
            }}
          />
          <span className="text-white font-bold">MindaGrow</span>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 pt-4">
          <Link to="/dashboard" className="block mx-2 my-1 bg-yellow-400 text-center py-3 px-2 rounded-md text-blue-900">
            Dashboard
          </Link>
          <Link to="/kursus" className="block mx-2 my-1 text-white text-center py-3 px-2 rounded-md hover:bg-blue-600">
            Kursus
          </Link>
          <Link to="/kelas" className="block mx-2 my-1 text-white text-center py-3 px-2 rounded-md hover:bg-blue-600">
            Kelas saya
          </Link>
          <Link to="/game" className="block mx-2 my-1 text-white text-center py-3 px-2 rounded-md hover:bg-blue-600 relative">
            Game
            <span className="absolute top-1 right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              1
            </span>
          </Link>
          <Link to="/notifikasi" className="block mx-2 my-1 text-white text-center py-3 px-2 rounded-md hover:bg-blue-600">
            Notifikasi
          </Link>
          <Link to="/pengaturan" className="block mx-2 my-1 text-white text-center py-3 px-2 rounded-md hover:bg-blue-600">
            Pengaturan
          </Link>
        </nav>

        {/* Pro Upgrade Button */}
        <div className="p-3 mb-4">
          <div className="bg-yellow-400 rounded-lg p-3 text-center">
            <div className="flex justify-center">
              <BiCrown className="text-2xl text-blue-900" />
            </div>
            <p className="text-xs text-blue-900 font-medium mt-1">
              Tingkatkan Pro untuk fitur lebih
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-blue-50">
        {/* Header */}
        <header className="bg-blue-50 p-4 flex justify-between items-center">
          <h1 className="text-lg">
            👋 Selamat datang, {userName}! Siap belajar seru hari ini?
          </h1>
          
          {/* User Avatar */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {currentUser?.profileImage ? (
              <img 
                src={currentUser.profileImage} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : null}
          </div>
        </header>

        {/* Dashboard Content - Empty for now */}
        <div className="p-4">
          {/* Dashboard content will go here */}
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;