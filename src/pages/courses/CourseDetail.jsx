// src/pages/courses/CourseDetail.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext, useAuth } from '../../context/AuthContext';
import EnrollButton from '../../components/layout/layoutParts/enrollButton';
import { courseAPI } from '../../../server/services/api';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const response = await courseAPI.getCourseById(id);
      
      if (response.data.success) {
        setCourse(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login', { state: { returnTo: `/courses/${id}` } });
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

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} menit`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}j ${remainingMinutes}m` : `${hours} jam`;
  };

  const formatPrice = (price) => {
    if (price === 0) return 'Gratis';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <span key={i} className="text-yellow-400">★</span>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <span key={i} className="text-yellow-400">☆</span>
        );
      } else {
        stars.push(
          <span key={i} className="text-gray-300">☆</span>
        );
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
              onClick={() => navigate('/courses')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Kembali ke Daftar Kursus
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Course Info */}
            <div className="lg:col-span-2">
              <div className="mb-4">
                <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-sm">
                  {course.category_name}
                </span>
              </div>
              <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
              <p className="text-xl mb-6 opacity-90">{course.description}</p>
              
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center">
                  {renderStars(course.average_rating || 0)}
                  <span className="ml-2 text-lg">
                    {course.average_rating ? course.average_rating.toFixed(1) : '0.0'}
                  </span>
                  <span className="ml-1 opacity-75">
                    ({course.review_count} ulasan)
                  </span>
                </div>
                <div className="text-lg">
                  {course.enrolled_count} siswa terdaftar
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-semibold">
                      {course.instructor_name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold">{course.instructor_name}</div>
                    <div className="opacity-75">Instruktur</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Course Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {formatPrice(course.price)}
                  </div>
                  <div className="text-gray-600">
                    {formatDuration(course.duration)}
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

                <div className="mt-6 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Level:</span>
                    <span className="font-medium capitalize">{course.level}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Durasi:</span>
                    <span className="font-medium">{formatDuration(course.duration)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Modul:</span>
                    <span className="font-medium">{course.modules?.length || 0} modul</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'description', label: 'Deskripsi' },
                  { id: 'curriculum', label: 'Kurikulum' },
                  { id: 'reviews', label: 'Ulasan' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
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
            {activeTab === 'description' && (
              <div className="prose max-w-none">
                <h3 className="text-xl font-semibold mb-4">Tentang Kursus Ini</h3>
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {course.description}
                </div>
                
                <h3 className="text-xl font-semibold mt-8 mb-4">Disini Anda Akan Belajar</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi non accusamus excepturi</li>
                  <li>Consectetur adipisicing elit. Modi non accusamus excepturi placeat minima sit</li>
                  <li>Esse numquam deserunt delectus, totam velit beatae</li>
                  <li>Officiis expedita aliquid dignissimos qui maxime vero?</li>
                </ul>
              </div>
            )}

            {activeTab === 'curriculum' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Kurikulum Kursus</h3>
                <div className="space-y-4">
                  {course.modules && course.modules.length > 0 ? (
                    course.modules.map((module, index) => (
                      <div key={module.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {index + 1}. {module.title}
                          </h4>
                          <span className="text-sm text-gray-500">
                            {formatDuration(module.duration)}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-2">{module.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      Kurikulum belum tersedia
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div>
                <h3 className="text-xl font-semibold mb-4">Ulasan Siswa</h3>
                
                {course.average_rating && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-6">
                    <div className="flex items-center">
                      <div className="text-4xl font-bold text-gray-900 mr-4">
                        {course.average_rating.toFixed(1)}
                      </div>
                      <div>
                        <div className="flex items-center mb-1">
                          {renderStars(course.average_rating)}
                        </div>
                        <div className="text-gray-600">
                          {course.review_count} ulasan
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-6">
                  {course.recent_reviews && course.recent_reviews.length > 0 ? (
                    course.recent_reviews.map((review, index) => (
                      <div key={index} className="border-b border-gray-200 pb-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">
                            {review.user_name}
                          </div>
                          <div className="flex items-center">
                            {renderStars(review.rating)}
                            <span className="ml-2 text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-500 text-center py-8">
                      Belum ada ulasan untuk kursus ini
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h4 className="font-semibold text-gray-900 mb-4">
                Kursus Terkait
              </h4>
              <div className="text-gray-500 text-center py-4">
                Sedang memuat...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;