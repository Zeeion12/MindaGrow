import React from 'react';
import { Link } from 'react-router-dom';

const RoleCard = ({ title, description, to, icon }) => (
  <Link 
    to={to}
    className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center transition-transform hover:transform hover:scale-105"
  >
    <div className="text-5xl text-indigo-600 mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </Link>
);

const RoleSelection = () => {
  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 flex flex-col justify-center items-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">Pilih Peran Anda</h1>
        <p className="text-gray-600 mt-2">Daftar sebagai siswa, guru, atau orang tua</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
        <RoleCard 
          title="Siswa"
          description="Akses pembelajaran personalisasi dan pantau perkembangan Anda"
          to="/register/siswa"
          icon="👨‍🎓"
        />
        <RoleCard 
          title="Guru"
          description="Kelola kelas dan pantau perkembangan siswa Anda"
          to="/register/guru"
          icon="👨‍🏫"
        />
        <RoleCard 
          title="Orang Tua"
          description="Pantau perkembangan anak Anda dan berkolaborasi dengan guru"
          to="/register/orangtua"
          icon="👨‍👩‍👧‍👦"
        />
      </div>
      
      <div className="mt-8">
        <p className="text-gray-600">
          Sudah memiliki akun? <Link to="/login" className="text-indigo-600 font-medium">Masuk di sini</Link>
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;