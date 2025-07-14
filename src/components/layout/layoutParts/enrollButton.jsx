// src/components/layout/layoutParts/enrollButton.jsx - Updated Version
import React from 'react';
import { useNavigate } from 'react-router-dom';

const EnrollButton = ({ 
  courseId, 
  isEnrolled, 
  onEnroll, 
  onUnenroll, 
  enrolling, 
  user,
  className = "",
  size = "default" // "small", "default", "large"
}) => {
  const navigate = useNavigate();

  // Handle click based on user status and enrollment
  const handleClick = () => {
    // If user not logged in, redirect to login
    if (!user) {
      navigate('/login', { 
        state: { returnTo: `/kursus/${courseId}` } 
      });
      return;
    }

    // Check if user is student
    if (user.role !== 'siswa') {
      alert('Hanya siswa yang dapat mendaftar kursus');
      return;
    }

    // If enrolled, go to learning page instead of unenrolling
    if (isEnrolled) {
      navigate(`/kursus/${courseId}/belajar`);
      return;
    }

    // If not enrolled, enroll first
    onEnroll();
  };

  // Size variants
  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    default: "px-4 py-3 text-base",
    large: "px-6 py-4 text-lg"
  };

  // Base button classes
  const baseClasses = `
    w-full font-medium rounded-lg transition-all duration-200 
    disabled:opacity-50 disabled:cursor-not-allowed
    ${sizeClasses[size]}
    ${className}
  `;

  // Button text and styling based on state
  const getButtonContent = () => {
    if (enrolling) {
      return {
        text: isEnrolled ? 'Membatalkan...' : 'Mendaftar...',
        classes: 'bg-gray-400 text-white cursor-not-allowed'
      };
    }

    if (!user) {
      return {
        text: 'Login untuk Mendaftar',
        classes: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
      };
    }

    if (user.role !== 'siswa') {
      return {
        text: 'Hanya untuk Siswa',
        classes: 'bg-gray-400 text-white cursor-not-allowed'
      };
    }

    if (isEnrolled) {
      return {
        text: 'Masuk Kursus', // Changed from 'Batal dari Kursus'
        classes: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
      };
    }

    return {
      text: 'Daftar Sekarang',
      classes: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
    };
  };

  const { text, classes } = getButtonContent();

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={enrolling || (user && user.role !== 'siswa')}
        className={`${baseClasses} ${classes}`}
      >
        <span className="flex items-center justify-center">
          {enrolling && (
            <svg 
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              ></circle>
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {text}
        </span>
      </button>

      {/* Additional info text */}
      {!user && (
        <p className="text-xs text-gray-500 text-center">
          Masuk untuk mendaftar kursus ini
        </p>
      )}
      
      {user && user.role !== 'siswa' && (
        <p className="text-xs text-gray-500 text-center">
          Fitur ini hanya tersedia untuk siswa
        </p>
      )}

      {isEnrolled && (
        <p className="text-xs text-green-600 text-center font-medium">
          ✓ Anda sudah terdaftar di kursus ini
        </p>
      )}
    </div>
  );
};

export default EnrollButton;