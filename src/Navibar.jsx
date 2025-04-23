// src/Navibar.jsx
import { useState } from 'react';

const Navibar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <span className="text-2xl font-bold mr-2">🤖</span>
            <span className="text-xl font-semibold">AI Chatbot</span>
          </div>
          
          {/* Menu untuk Desktop */}
          <div className="hidden md:flex space-x-6">
            <a href="#" className="hover:text-blue-200 transition-colors">Beranda</a>
            <a href="#" className="hover:text-blue-200 transition-colors">Tentang</a>
            <a href="#" className="hover:text-blue-200 transition-colors">Fitur</a>
            <a href="#" className="hover:text-blue-200 transition-colors">Kontak</a>
          </div>
          
          {/* Toggle Menu untuk Mobile */}
          <button 
            onClick={toggleMenu}
            className="md:hidden focus:outline-none"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        
        {/* Menu Mobile */}
        {isMenuOpen && (
          <div className="md:hidden py-2 pb-4">
            <a href="#" className="block py-2 hover:text-blue-200 transition-colors">Beranda</a>
            <a href="#" className="block py-2 hover:text-blue-200 transition-colors">Tentang</a>
            <a href="#" className="block py-2 hover:text-blue-200 transition-colors">Fitur</a>
            <a href="#" className="block py-2 hover:text-blue-200 transition-colors">Kontak</a>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navibar;