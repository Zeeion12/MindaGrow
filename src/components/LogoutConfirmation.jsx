import React from 'react';

const LogoutConfirmation = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <div className="bg-white rounded-lg shadow-xl overflow-hidden w-full max-w-md z-50 transform transition-all">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Konfirmasi Keluar</h3>
        </div>
        <div className="px-6 py-4">
          <p className="text-gray-700">Apakah Anda yakin ingin keluar dari aplikasi?</p>
        </div>
        <div className="px-6 py-3 bg-gray-50 text-right space-x-2">
          <button
            type="button"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={onClose}
          >
            Batal
          </button>
          <button
            type="button"
            className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            onClick={onConfirm}
          >
            Ya, Keluar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmation;