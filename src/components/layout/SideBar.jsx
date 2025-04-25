import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BiCrown } from 'react-icons/bi';

const Sidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  // Menu items
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/kursus', label: 'Kursus' },
    { path: '/kelas', label: 'Kelas saya' },
    { path: '/game', label: 'Game', notification: 1 },
    { path: '/notifikasi', label: 'Notifikasi' },
    { path: '/pengaturan', label: 'Pengaturan' },
  ];

  return (
    <div className="w-[140px] bg-blue-500 flex flex-col min-h-screen">
      {/* Logo */}
      <div className="p-4 flex items-center">
        <img 
          src="/images/Logo.png" 
          alt="MindaGrow" 
          className="w-8 h-8 mr-2"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://via.placeholder.com/32/FFFFFF/000000?text=M";
          }}
        />
        <span className="text-white font-bold">MindaGrow</span>
      </div>

      {/* Menu */}
      <div className="flex-grow flex flex-col items-center space-y-2 py-4">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              relative w-[120px] py-3 px-2 rounded-md
              flex flex-col items-center justify-center text-center
              ${currentPath === item.path ? 'bg-yellow-400 text-blue-900' : 'text-white hover:bg-blue-600'}
              transition-colors duration-200
            `}
          >
            <span className="text-sm">{item.label}</span>
            
            {/* Notification badge */}
            {item.notification && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {item.notification}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Premium button */}
      <div className="p-3 mb-4">
        <div className="bg-yellow-400 rounded-lg p-4 text-center">
          <BiCrown className="mx-auto text-2xl text-blue-900 mb-1" />
          <p className="text-xs text-blue-900 font-medium">Tingkatkan Pro untuk fitur lebih</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;