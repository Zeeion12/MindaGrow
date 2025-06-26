import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Users, Star, BookOpen } from 'lucide-react';

const CourseCard = ({ course, showEnrollButton = true, isEnrolled = false, onEnroll, onUnenroll }) => {
  const formatPrice = (price) => {
    if (price === 0 || price === null) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}j ${remainingMinutes}m` : `${hours} jam`;
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelText = (level) => {
    switch (level) {
      case 'beginner': return 'Pemula';
      case 'intermediate': return 'Menengah';
      case 'advanced': return 'Lanjutan';
      default: return level;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-200">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-indigo-400" />
          </div>
        )}
        
        {/* Level badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLevelColor(course.level)}`}>
            {getLevelText(course.level)}
          </span>
        </div>
        
        {/* Price badge */}
        <div className="absolute top-3 right-3">
          <span className="bg-white px-2 py-1 text-sm font-semibold text-gray-800 rounded-full shadow">
            {formatPrice(course.price)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <div className="mb-2">
          <span className="text-xs font-medium text-indigo-600 uppercase tracking-wider">
            {course.category_name}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          <Link 
            to={`/courses/${course.id}`}
            className="hover:text-indigo-600 transition-colors"
          >
            {course.title}
          </Link>
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {course.description}
        </p>

        {/* Instructor */}
        <div className="text-sm text-gray-500 mb-3">
          <span>Oleh: {course.instructor_name}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{formatDuration(course.duration)}</span>
          </div>
          
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{course.enrolled_count || 0}</span>
          </div>
          
          {course.average_rating && (
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 fill-current text-yellow-400" />
              <span>{parseFloat(course.average_rating).toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Link
            to={`/courses/${course.id}`}
            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors text-center"
          >
            Lihat Detail
          </Link>
          
          {showEnrollButton && (
            <>
              {isEnrolled ? (
                <button
                  onClick={() => onUnenroll?.(course.id)}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Keluar
                </button>
              ) : (
                <button
                  onClick={() => onEnroll?.(course.id)}
                  className="px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors"
                >
                  Daftar
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCard;