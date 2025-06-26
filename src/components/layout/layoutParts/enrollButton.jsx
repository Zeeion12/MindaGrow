import React from 'react';
import { useNavigate } from 'react-router-dom';

const EnrollButton = ({ 
  courseId, 
  isEnrolled, 
  onEnroll, 
  onUnenroll, 
  enrolling, 
  user 
}) => {
  const navigate = useNavigate();

  if (!user) {
    return (
      <button
        onClick={() => navigate('/login', { state: { returnTo: `/courses/${courseId}` } })}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
      >
        Masuk untuk Mendaftar
      </button>
    );
  }

  if (user.role !== 'siswa') {
    return (
      <div className="w-full bg-gray-100 text-gray-500 py-3 px-4 rounded-lg text-center">
        Hanya siswa yang dapat mendaftar kursus
      </div>
    );
  }

  if (isEnrolled) {
    return (
      <div className="space-y-2">
        <button
          onClick={() => navigate(`/learn/${courseId}`)}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 transition-colors"
        >
          Lanjutkan Belajar
        </button>
        <button
          onClick={onUnenroll}
          disabled={enrolling}
          className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          {enrolling ? 'Membatalkan...' : 'Batal dari Kursus'}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={onEnroll}
      disabled={enrolling}
      className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
    >
      {enrolling ? 'Mendaftar...' : 'Daftar Sekarang'}
    </button>
  );
};

export default EnrollButton;