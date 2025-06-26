// src/pages/courses/CourseList.jsx - CLEAN VERSION
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { courseAPI } from '../../service/api';
import FilterKursus from '../../components/layout/TaskCard/FilterKursus';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    page: 1,
    limit: 12
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseAPI.getAllCourses(filters);
      
      if (response.data.success) {
        setCourses(response.data.data || []);
        setPagination(response.data.pagination || {
          currentPage: 1,
          totalPages: 1,
          totalItems: 0,
          itemsPerPage: 12
        });
      } else {
        setError(response.data.message || 'Failed to fetch courses');
      }
    } catch (err) {
      console.error('Error fetching courses:', err.message);
      setError(err.response?.data?.message || err.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prev => {
      const updated = {
        ...prev,
        ...newFilters,
        page: 1
      };
      
      const hasChanged = Object.keys(updated).some(key => updated[key] !== prev[key]);
      return hasChanged ? updated : prev;
    });
  }, []);

  const handlePageChange = useCallback((page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  }, []);

  const formatPrice = useMemo(() => (price) => {
    if (price === 0 || price === null) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  const formatDuration = useMemo(() => (minutes) => {
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}j ${remainingMinutes}m` : `${hours} jam`;
  }, []);

  if (loading && courses.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Jelajahi Kursus
        </h1>
        <p className="text-gray-600">
          Temukan kursus yang sesuai dengan minat dan kebutuhan belajar Anda
        </p>
      </div>

      <FilterKursus 
        onFiltersChange={handleFiltersChange}
        initialFilters={filters}
      />

      {loading && (
        <div className="flex justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800 text-center">
            <p className="mb-2">{error}</p>
            <button
              onClick={fetchCourses}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Results Info */}
      <div className="mb-6 flex justify-between items-center">
        <div className="text-gray-600">
          Menampilkan {courses.length} dari {pagination.totalItems} kursus
        </div>
        {pagination.totalPages > 1 && (
          <div className="text-sm text-gray-500">
            Halaman {pagination.currentPage} dari {pagination.totalPages}
          </div>
        )}
      </div>

      {/* Course Grid */}
      {courses.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">
            {error ? 'Terjadi kesalahan saat memuat kursus' : 'Tidak ada kursus ditemukan'}
          </div>
          {!error && (
            <p className="text-gray-400">
              Coba ubah filter pencarian atau reset filter
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
              {/* Course Thumbnail */}
              <div className="relative h-48 bg-gradient-to-br from-blue-100 to-indigo-200">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-6xl">📚</div>
                  </div>
                )}
                
                {/* Level badge */}
                <div className="absolute top-3 left-3">
                  <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium capitalize">
                    {course.level}
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
                    {course.category_name || 'Uncategorized'}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {course.description}
                </p>

                {/* Instructor */}
                <div className="text-sm text-gray-500 mb-3">
                  <span>Oleh: {course.instructor_name || 'Unknown'}</span>
                </div>

                {/* Stats */}
                <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                  <div className="flex items-center">
                    <span>⏱️ {formatDuration(course.duration || 60)}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span>👥 {course.enrolled_count || 0}</span>
                  </div>
                  
                  {course.average_rating && (
                    <div className="flex items-center">
                      <span>⭐ {parseFloat(course.average_rating).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div>
                  <button 
                    onClick={() => {
                      window.location.href = `/kursus/${course.id}`;
                    }}
                    className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          {pagination.currentPage > 1 && (
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Previous
            </button>
          )}

          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-3 py-2 text-sm rounded-md ${
                  page === pagination.currentPage
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            );
          })}

          {pagination.currentPage < pagination.totalPages && (
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              className="px-3 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Next
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CourseList;