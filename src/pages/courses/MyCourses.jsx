// src/pages/courses/MyCourses.jsx
import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { courseAPI } from '../../services/api';

const MyCourses = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, in-progress, completed

  useEffect(() => {
    // Check if user is student
    if (!user || user.role !== 'siswa') {
      navigate('/');
      return;
    }

    fetchMyCourses();
  }, [user, navigate]);

  const fetchMyCourses = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getMyEnrolledCourses();
      
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch enrolled courses');
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (percentage) => {
    if (percentage === 0) return 'bg-gray-200';
    if (percentage < 30) return 'bg-red-500';
    if (percentage < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getProgressStatus = (percentage) => {
    if (percentage === 0) return 'Belum Dimulai';
    if (percentage < 100) return 'Sedang Belajar';
    return 'Selesai';
  };

  const filteredCourses = courses.filter(course => {
    if (filter === 'all') return true;
    if (filter === 'in-progress') return course.progress_percentage > 0 && course.progress_percentage < 100;
    if (filter === 'completed') return course.progress_percentage === 100;
    return true;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-4">{error}</div>
            <button
              onClick={fetchMyCourses}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Kursus Saya
          </h1>
          <p className="text-gray-600">
            Lanjutkan perjalanan belajar Anda
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-gray-900">
              {courses.length}
            </div>
            <div className="text-gray-600">Total Kursus</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-green-600">
              {courses.filter(c => c.progress_percentage === 100).length}
            </div>
            <div className="text-gray-600">Selesai</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {courses.filter(c => c.progress_percentage > 0 && c.progress_percentage < 100).length}
            </div>
            <div className="text-gray-600">Sedang Belajar</div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="text-2xl font-bold text-blue-600">
              {courses.length > 0 ? Math.round(courses.reduce((acc, c) => acc + c.progress_percentage, 0) / courses.length) : 0}%
            </div>
            <div className="text-gray-600">Rata-rata Progress</div>
          </div>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex space-x-4">
            {[
              { value: 'all', label: 'Semua' },
              { value: 'in-progress', label: 'Sedang Belajar' },
              { value: 'completed', label: 'Selesai' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  filter === option.value
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Course List */}
        {filteredCourses.length > 0 ? (
          <div className="space-y-4">
            {filteredCourses.map((course) => (
              <div key={course.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                          {course.category_name}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.progress_percentage === 100 
                            ? 'bg-green-100 text-green-800'
                            : course.progress_percentage > 0 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {getProgressStatus(course.progress_percentage)}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {course.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {course.description}
                      </p>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4 mb-4">
                        <span>👨‍🏫 {course.instructor_name}</span>
                        <span>📅 Daftar: {formatDate(course.enrolled_at)}</span>
                        <span>💰 {formatPrice(course.price)}</span>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600">Progress</span>
                          <span className="text-gray-900 font-medium">
                            {Math.round(course.progress_percentage)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(course.progress_percentage)}`}
                            style={{ width: `${course.progress_percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-6">
                      <Link
                        to={`/learn/${course.id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md text-center hover:bg-blue-700 transition-colors"
                      >
                        {course.progress_percentage === 100 ? 'Review' : 'Lanjutkan'}
                      </Link>
                      
                      <Link
                        to={`/courses/${course.id}`}
                        className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-center hover:bg-gray-200 transition-colors"
                      >
                        Detail
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">
              {filter === 'all' 
                ? 'Anda belum mendaftar kursus apapun'
                : filter === 'in-progress'
                ? 'Tidak ada kursus yang sedang berlangsung'
                : 'Belum ada kursus yang selesai'}
            </div>
            
            {filter === 'all' && (
              <Link
                to="/courses"
                className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
              >
                Jelajahi Kursus
              </Link>
            )}
            
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-blue-600 hover:text-blue-700"
              >
                Lihat Semua Kursus
              </button>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {courses.length > 0 && (
          <div className="mt-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-2">
                  Terus Belajar dan Raih Tujuan Anda!
                </h3>
                <p className="opacity-90">
                  Konsistensi adalah kunci kesuksesan dalam belajar
                </p>
              </div>
              <div className="text-right">
                <Link
                  to="/courses"
                  className="bg-white text-blue-600 px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors"
                >
                  Temukan Kursus Baru
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;