import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-50 px-4">
      <div className="text-6xl font-bold text-blue-500 mb-4">404</div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Halaman Tidak Ditemukan</h1>
      <p className="text-gray-600 text-center mb-8 max-w-md">
        Maaf, halaman yang Anda cari tidak dapat ditemukan atau mungkin telah dipindahkan.
      </p>
      <Link
        to="/"
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
};

export default NotFound;