import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import LogoutConfirmation from '../../LogoutConfirmation';

const Header = () => {
  const { user, logout } = useAuth();
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);

  const handleLogoutClick = () => {
    setShowLogoutConfirmation(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutConfirmation(false);
  };

  const handleLogoutCancel = () => {
    setShowLogoutConfirmation(false);
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Dashboard {user?.role === 'siswa' ? 'Siswa' : user?.role === 'guru' ? 'Guru' : 'Orang Tua'}
        </h1>
        <div className="flex items-center">
          <span className="text-gray-700 mr-4">{user?.nama_lengkap}</span>
          <button
            onClick={handleLogoutClick}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            Keluar
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutConfirmation 
        isOpen={showLogoutConfirmation}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
      />
    </header>
  );
};

export default Header;