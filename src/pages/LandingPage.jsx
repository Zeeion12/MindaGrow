import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
  const { user } = useAuth();
  
  const redirectToDashboard = () => {
    if (user) {
      if (user.role === 'siswa') return '/dashboard/siswa';
      if (user.role === 'guru') return '/dashboard/guru';
      if (user.role === 'orangtua') return '/dashboard/orangtua';
    }
    return '/role-selection';
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600 flex flex-col justify-center items-center text-white p-4">
      <div className="text-center max-w-3xl">
        <h1 className="text-5xl font-bold mb-4">MindaGrow</h1>
        <p className="text-xl mb-8">Platform personalisasi siswa untuk membantu perkembangan pendidikan</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {user ? (
            <Link 
              to={redirectToDashboard()}
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Masuk ke Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/role-selection" 
                className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
              >
                Daftar
              </Link>
              <Link 
                to="/login" 
                className="bg-transparent border-2 border-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:bg-opacity-10 transition-colors"
              >
                Masuk
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPage;