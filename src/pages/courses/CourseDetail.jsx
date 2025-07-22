// src/pages/courses/CourseDetail.jsx - Simple version
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import EnrollButton from '../../components/layout/layoutParts/enrollButton';
import { courseAPI } from '../../service/api';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('deskripsi');
  console.log('🎯 Initial activeTab:', activeTab); // DEBUG LOG
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  // Debug useEffect untuk activeTab
  useEffect(() => {
    console.log('🔄 Active tab changed to:', activeTab);
  }, [activeTab]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseAPI.getCourseById(id);
      
      if (response.data?.success) {
        setCourse(response.data.data);
      } else {
        setError(response.data?.message || 'Gagal memuat detail kursus');
      }
    } catch (err) {
      console.error('❌ Fetch error:', err);
      setError(err.response?.data?.message || 'Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { returnTo: `/kursus/${id}` } });
      return;
    }

    if (user.role !== 'siswa') {
      alert('Hanya siswa yang dapat mendaftar kursus');
      return;
    }

    try {
      setEnrolling(true);
      const response = await courseAPI.enrollCourse(id);
      
      if (response.data.success) {
        setCourse(prev => ({ ...prev, is_enrolled: 1 }));
        alert('Berhasil mendaftar kursus!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mendaftar kursus');
    } finally {
      setEnrolling(false);
    }
  };

  const handleUnenroll = async () => {
    if (window.confirm('Apakah Anda yakin ingin batal dari kursus ini?')) {
      try {
        setEnrolling(true);
        const response = await courseAPI.unenrollCourse(id);
        
        if (response.data.success) {
          setCourse(prev => ({ ...prev, is_enrolled: 0 }));
          alert('Berhasil batal dari kursus!');
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal batal dari kursus');
      } finally {
        setEnrolling(false);
      }
    }
  };

  // Utility functions
  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}j ${remainingMinutes}m` : `${hours} jam`;
  };

  const formatPrice = (price) => {
    if (price === 0 || price === null) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<span key={i} className="text-yellow-400">★</span>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<span key={i} className="text-yellow-400">☆</span>);
      } else {
        stars.push(<span key={i} className="text-gray-300">☆</span>);
      }
    }
    return stars;
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

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-red-600 text-lg mb-4">
              {error || 'Kursus tidak ditemukan'}
            </div>
            <button
              onClick={() => navigate('/kursus')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Kembali ke Daftar Kursus
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Tab definitions
  const tabs = [
    { id: 'deskripsi', label: 'Deskripsi' },
    { id: 'konten', label: 'Konten Kursus' },
    { id: 'guru', label: 'Guru' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/kursus')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Kembali ke Daftar Kursus</span>
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div 
        className="relative h-96"
        style={{
          background: course.thumbnail 
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${course.thumbnail}) center/cover` 
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info - 2 columns */}
            <div className="lg:col-span-2 text-white">
              <div className="mb-4">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  {course.category_name || 'Kursus'}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center">
                  {renderStars(course.average_rating || 0)}
                  <span className="ml-2 text-lg">
                    {course.average_rating ? course.average_rating.toFixed(1) : '0.0'}
                  </span>
                  <span className="ml-1 opacity-75">
                    ({course.review_count || 0} ulasan)
                  </span>
                </div>
                <div className="text-lg">
                  {course.enrolled_count || 0} siswa terdaftar
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">
                      {course.instructor_name?.charAt(0).toUpperCase() || 'G'}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{course.instructor_name || 'Guru'}</div>
                    <div className="opacity-75">Instruktur</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Info Card - 1 column */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6">
                {/* Course Preview Image */}
                <div className="mb-4">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <div className="text-center text-white">
                        <div className="text-4xl mb-2">📚</div>
                        <div className="text-sm font-medium">{course.category_name}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatPrice(course.price)}
                  </div>
                  <div className="text-gray-600">
                    {formatDuration(course.duration)}
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-center mb-4">
                    <div className="text-lg font-semibold text-gray-900">
                      Yang Akan Anda Pelajari:
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <span className="mr-3">📚</span>
                      <span>{course.modules?.length || 0} Modul</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-3">⏰</span>
                      <span>{formatDuration(course.duration)} Total Durasi</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-3">📱</span>
                      <span>Akses Mobile & Desktop</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-3">🏆</span>
                      <span>Sertifikat Penyelesaian</span>
                    </div>
                  </div>
                </div>

                <EnrollButton
                  courseId={course.id}
                  isEnrolled={course.is_enrolled}
                  onEnroll={handleEnroll}
                  onUnenroll={handleUnenroll}
                  enrolling={enrolling}
                  user={user}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs and Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - 2 columns */}
          <div className="lg:col-span-2">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('🔄 Tab clicked:', tab.id); // DEBUG LOG
                      setActiveTab(tab.id);
                    }}
                    className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors duration-200 cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
              {activeTab === 'deskripsi' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">Tentang Kursus Ini</h2>
                  <div className="prose max-w-none mb-8">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                      {course.description}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'konten' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">Konten Kursus</h2>
                  <div className="mb-6">
                    <div className="text-gray-600">
                      {course.modules?.length || 0} modul • {formatDuration(course.duration)}
                    </div>
                  </div>
                  
                  {course.modules && course.modules.length > 0 ? (
                    <div className="space-y-4">
                      {course.modules.map((module, index) => (
                        <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900">{index + 1}. {module.title}</h4>
                          {module.description && (
                            <p className="text-sm text-gray-600 mt-2">{module.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Konten kursus akan segera tersedia</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'guru' && (
                <div>
                  <h2 className="text-3xl font-bold mb-6">Tentang Guru</h2>
                  <div className="bg-white rounded-lg p-6 shadow-sm border">
                    <div className="flex items-start">
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-6 flex-shrink-0">
                        <span className="text-white text-2xl font-bold">
                          {course.instructor_name?.charAt(0).toUpperCase() || 'G'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">{course.instructor_name || 'Guru'}</h3>
                        <p className="text-gray-600 mb-4">
                          Pengajar berpengalaman yang ahli dalam bidangnya.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;