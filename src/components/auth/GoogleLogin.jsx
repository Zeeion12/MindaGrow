import React, { useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

const GoogleLogin = ({ onSuccess, onError, disabled = false }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = () => {
    setLoading(true);
    
    // Redirect ke Google OAuth endpoint
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`;
  };

  return (
    <button
      onClick={handleGoogleLogin}
      disabled={disabled || loading}
      className={`
        w-full flex items-center justify-center gap-3 px-4 py-3 
        border border-gray-300 rounded-lg font-medium text-gray-700
        hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        transition-colors duration-200
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
      `}
    >
      <FcGoogle className="w-5 h-5" />
      {loading ? 'Menghubungkan...' : 'Masuk dengan Google'}
    </button>
  );
};

export default GoogleLogin;