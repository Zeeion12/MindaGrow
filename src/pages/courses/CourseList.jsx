// src/pages/courses/CourseList.jsx
import React, { useState, useEffect, useCallback, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { courseAPI } from '../../service/api';
import Header from '../../components/layout/layoutParts/Header';
import FilterKursus from '../../components/layout/TaskCard/FilterKursus';
import EnrollButton from '../../components/layout/layoutParts/enrollButton';
import {
  RiBookOpenLine,
  RiTimeLine,
  RiUserLine,
  RiStarFill,
  RiStarLine,
  RiPlayFill,
  RiCheckboxCircleLine,
  RiLoader4Line,
  RiBookmarkLine,
  RiBookmarkFill,
  RiEyeLine
} from 'react-icons/ri';

const CourseList = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // Helper function untuk error message
  const getErrorMessage = (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.response?.data?.error) {
      return error.response.data.error;
    }
    if (error.message) {
      return error.message;
    }
    return 'Terjadi kesalahan yang tidak diketahui';
  };
  
  // State management
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState({});
  const [showMyCoursesView, setShowMyCoursesView] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    level: '',
    page: 1,
    limit: 12
  });
  
  // Pagination state
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });

  // Fetch all courses
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
      console.error('Error fetching courses:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch enrolled courses
  const fetchEnrolledCourses = useCallback(async () => {
    if (!user || user.role !== 'siswa') return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseAPI.getEnrolledCourses();
      
      if (response.data.success) {
        setEnrolledCourses(response.data.data || []);
      } else {
        setError(response.data.message || 'Failed to fetch enrolled courses');
      }
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Effects
  useEffect(() => {
    if (showMyCoursesView) {
      fetchEnrolledCourses();
    } else {
      fetchCourses();
    }
  }, [showMyCoursesView, fetchCourses, fetchEnrolledCourses]);

  // Handle filters change
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

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  }, []);

  // Handle enrollment
  const handleEnroll = async (courseId) => {
    if (!user) {
      navigate('/login', { state: { returnTo: `/kursus/${courseId}` } });
      return;
    }

    if (user.role !== 'siswa') {
      alert('Hanya siswa yang dapat mendaftar kursus');
      return;
    }

    try {
      setEnrolling(prev => ({ ...prev, [courseId]: true }));
      
      const response = await courseAPI.enrollCourse(courseId);
      
      if (response.data.success || response.status === 200 || response.status === 201) {
        // Update courses state to reflect enrollment
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, is_enrolled: true }
            : course
        ));
        
        // Refresh enrolled courses if in my courses view
        if (showMyCoursesView) {
          await fetchEnrolledCourses();
        } else {
          // Refresh current courses to get updated enrollment status
          await fetchCourses();
        }
        
        alert('Berhasil mendaftar kursus!');
      } else {
        alert(response.data?.message || 'Gagal mendaftar kursus');
      }
    } catch (error) {
      console.error('Error enrolling course:', error);
      
      // Check if actually enrolled despite error
      if (error.response?.status === 400 && 
          error.response?.data?.message?.includes('already enrolled')) {
        // Update UI to show enrolled
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, is_enrolled: true }
            : course
        ));
        alert('Anda sudah terdaftar di kursus ini!');
      } else {
        alert(getErrorMessage(error));
      }
    } finally {
      setEnrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  // Handle unenrollment
  const handleUnenroll = async (courseId) => {
    if (!confirm('Apakah Anda yakin ingin keluar dari kursus ini?')) {
      return;
    }

    try {
      setEnrolling(prev => ({ ...prev, [courseId]: true }));
      
      const response = await courseAPI.unenrollCourse(courseId);
      
      if (response.data.success) {
        // Update courses state
        setCourses(prev => prev.map(course => 
          course.id === courseId 
            ? { ...course, is_enrolled: false }
            : course
        ));
        
        // Remove from enrolled courses
        setEnrolledCourses(prev => prev.filter(course => course.id !== courseId));
        
        alert('Berhasil keluar dari kursus');
      } else {
        alert(response.data.message || 'Gagal keluar dari kursus');
      }
    } catch (error) {
      console.error('Error unenrolling course:', error);
      alert(getErrorMessage(error));
    } finally {
      setEnrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  // Handle view course details
  const handleViewCourse = (courseId) => {
    navigate(`/kursus/${courseId}`);
  };

  // Handle enter course (for enrolled courses)
  const handleEnterCourse = (courseId) => {
    navigate(`/kursus/${courseId}/belajar`);
  };

  // Format price
  const formatPrice = useMemo(() => (price) => {
    if (price === 0 || price === null) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  }, []);

  // Format duration
  const formatDuration = useMemo(() => (minutes) => {
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}j ${remainingMinutes}m` : `${hours} jam`;
  }, []);

  // Get level badge color
  const getLevelBadgeColor = (level) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get level label
  const getLevelLabel = (level) => {
    switch (level) {
      case 'beginner':
        return 'Pemula';
      case 'intermediate':
        return 'Menengah';
      case 'advanced':
        return 'Lanjutan';
      default:
        return level;
    }
  };

  // Calculate progress for enrolled courses
  const calculateProgress = (course) => {
    if (!course.progress) return 0;
    const { completed_lessons = 0, total_lessons = 1 } = course.progress;
    return Math.round((completed_lessons / total_lessons) * 100);
  };

  // Render course card
  const renderCourseCard = (course, isEnrolled = false) => (
    <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Course Image */}
      <div className="relative h-48 bg-gray-200">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <RiBookOpenLine className="text-white text-4xl" />
          </div>
        )}
        
        {/* Level Badge */}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-medium ${getLevelBadgeColor(course.level)}`}>
          {getLevelLabel(course.level)}
        </div>
        
        {/* Price Badge */}
        <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-xs font-bold text-gray-800">
          {formatPrice(course.price)}
        </div>

        {/* Progress Bar for Enrolled Courses */}
        {isEnrolled && course.progress && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-2">
            <div className="flex items-center justify-between text-white text-xs mb-1">
              <span>Progress</span>
              <span>{calculateProgress(course)}%</span>
            </div>
            <div className="w-full bg-gray-600 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress(course)}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {course.short_description || course.description}
        </p>

        {/* Course Meta */}
        <div className="flex items-center text-xs text-gray-500 mb-4 space-x-4">
          <div className="flex items-center">
            <RiUserLine className="mr-1" />
            <span>{course.instructor_name || 'Guru'}</span>
          </div>
          <div className="flex items-center">
            <RiTimeLine className="mr-1" />
            <span>{formatDuration(course.duration || course.estimated_duration)}</span>
          </div>
          {course.rating && (
            <div className="flex items-center">
              <RiStarFill className="mr-1 text-yellow-400" />
              <span>{course.rating}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {isEnrolled ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleEnterCourse(course.id)}
                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <RiPlayFill className="mr-1" />
                Masuk Kursus
              </button>
              <button
                onClick={() => handleViewCourse(course.id)}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                <RiEyeLine className="mr-1" />
                Detail
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <EnrollButton
                courseId={course.id}
                isEnrolled={course.is_enrolled}
                onEnroll={() => handleEnroll(course.id)}
                onUnenroll={() => handleUnenroll(course.id)}
                enrolling={enrolling[course.id]}
                user={user}
                size="small"
              />
              <button
                onClick={() => handleViewCourse(course.id)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Lihat Detail
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => {
              setShowMyCoursesView(false);
              setError(null);
            }}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              !showMyCoursesView 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <div className="flex items-center">
              <RiBookOpenLine className="mr-2" />
              Semua Kursus
            </div>
          </button>
          
          {user && user.role === 'siswa' && (
            <button
              onClick={() => {
                setShowMyCoursesView(true);
                setError(null);
              }}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                showMyCoursesView 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <div className="flex items-center">
                <RiBookmarkFill className="mr-2" />
                Kursus Saya
                {enrolledCourses.length > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                    {enrolledCourses.length}
                  </span>
                )}
              </div>
            </button>
          )}
        </div>

        {/* Page Content */}
        {showMyCoursesView ? (
          /* My Courses View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Kursus Saya</h1>
                <p className="text-gray-600 mt-2">
                  Lanjutkan pembelajaran dari kursus yang sudah Anda ikuti
                </p>
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <RiLoader4Line className="animate-spin text-4xl text-blue-600" />
                <span className="ml-3 text-gray-600">Memuat kursus...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-red-600 mr-3">⚠️</div>
                  <div>
                    <h3 className="text-red-800 font-medium">Terjadi Kesalahan</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && enrolledCourses.length === 0 && (
              <div className="text-center py-16">
                <RiBookmarkLine className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Belum Ada Kursus
                </h3>
                <p className="text-gray-600 mb-6">
                  Anda belum mendaftar di kursus manapun. Mulai belajar sekarang!
                </p>
                <button
                  onClick={() => setShowMyCoursesView(false)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Jelajahi Kursus
                </button>
              </div>
            )}

            {/* Enrolled Courses Grid */}
            {!loading && !error && enrolledCourses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {enrolledCourses.map(course => renderCourseCard(course, true))}
              </div>
            )}
          </div>
        ) : (
          /* All Courses View */
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Semua Kursus</h1>
                <p className="text-gray-600 mt-2">
                  Temukan kursus terbaik untuk mengembangkan kemampuan Anda
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="mb-8">
              <FilterKursus onFiltersChange={handleFiltersChange} />
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <RiLoader4Line className="animate-spin text-4xl text-blue-600" />
                <span className="ml-3 text-gray-600">Memuat kursus...</span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className="text-red-600 mr-3">⚠️</div>
                  <div>
                    <h3 className="text-red-800 font-medium">Terjadi Kesalahan</h3>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && courses.length === 0 && (
              <div className="text-center py-16">
                <RiBookOpenLine className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Tidak Ada Kursus Ditemukan
                </h3>
                <p className="text-gray-600">
                  Coba ubah filter pencarian atau kata kunci Anda
                </p>
              </div>
            )}

            {/* Courses Grid */}
            {!loading && !error && courses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {courses.map(course => renderCourseCard(course, false))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                {/* Previous Button */}
                {pagination.currentPage > 1 && (
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Previous
                  </button>
                )}

                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 text-sm rounded-md transition-colors ${
                        page === pagination.currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}

                {/* Next Button */}
                {pagination.currentPage < pagination.totalPages && (
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Next
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseList;