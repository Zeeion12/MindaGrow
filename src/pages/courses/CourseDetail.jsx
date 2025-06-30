// src/pages/courses/CourseDetail.jsx
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
  const [activeTab, setActiveTab] = useState('deskripsi'); // State for active tab
  const [enrolling, setEnrolling] = useState(false);
  const [expandedModules, setExpandedModules] = useState([]); // For curriculum accordion
  const [instructorOtherCourses, setInstructorOtherCourses] = useState([]);

  useEffect(() => {
    fetchCourseDetail();
  }, [id]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await courseAPI.getCourseById(id);
      
      if (response.data?.success) {
        setCourse(response.data.data);
        
        // Fetch instructor other courses (mock for now)
        setInstructorOtherCourses([
          {
            id: 2,
            title: "Biologi - Organisme dalam Ekosistem",
            description: "Pelajari tentang hubungan organisme dalam ekosistem",
            thumbnail: "https://via.placeholder.com/300x200",
            enrolled_count: 45
          },
          {
            id: 3,
            title: "Biologi - Sistem Organ pada Hewan Kucing",
            description: "Memahami sistem organ pada hewan mamalia",
            thumbnail: "https://via.placeholder.com/300x200", 
            enrolled_count: 32
          }
        ]);
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

  // Toggle module expansion
  const toggleModule = (moduleId) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  // Utility functions
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

  // Mock data for learning outcomes (until backend provides this)
  const learningOutcomes = [
    "Memahami konsep dasar reproduksi manusia",
    "Mengetahui organ reproduksi pria dan wanita", 
    "Memahami proses fertilisasi dan kehamilan",
    "Mengetahui berbagai metode kontrasepsi",
    "Memahami masalah kesehatan reproduksi",
    "Dapat menjelaskan siklus menstruasi"
  ];

  // Mock data for modules (until backend provides detailed modules)
  const mockModules = [
    {
      id: 1,
      title: "Lesson 1: Introduction",
      description: "Pengenalan dasar tentang reproduksi manusia",
      lessons: [
        { title: "Pengertian Reproduksi", type: "video", duration: 15 },
        { title: "Organ Reproduksi Manusia", type: "text", duration: 10 },
        { title: "Fungsi Reproduksi", type: "video", duration: 20 },
        { title: "Quiz Pengenalan", type: "quiz", duration: 5 }
      ]
    },
    {
      id: 2,
      title: "Lesson 2: Sistem Reproduksi Pria",
      description: "Mempelajari anatomi dan fungsi sistem reproduksi pria",
      lessons: [
        { title: "Anatomi Organ Reproduksi Pria", type: "video", duration: 25 },
        { title: "Proses Spermatogenesis", type: "text", duration: 15 }
      ]
    },
    {
      id: 3,
      title: "Lesson 3: Sistem Reproduksi Wanita", 
      description: "Mempelajari anatomi dan fungsi sistem reproduksi wanita",
      lessons: [
        { title: "Anatomi Organ Reproduksi Wanita", type: "video", duration: 25 },
        { title: "Siklus Menstruasi", type: "video", duration: 30 }
      ]
    },
    {
      id: 4,
      title: "Lesson 4: Fertilisasi dan Kehamilan",
      description: "Proses pembuahan dan perkembangan janin",
      lessons: [
        { title: "Proses Fertilisasi", type: "video", duration: 20 },
        { title: "Perkembangan Embrio", type: "text", duration: 15 }
      ]
    }
  ];

  // Tab definitions
  const tabs = [
    { id: 'deskripsi', label: 'Deskripsi' },
    { id: 'konten', label: 'Konten Kursus' },
    { id: 'guru', label: 'Guru' }
  ];

  // Render tab content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'deskripsi':
        return (
          <div>
            <h2 className="text-3xl font-bold mb-6">Tentang Kursus Ini</h2>
            <div className="prose max-w-none mb-8">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {course.description}
              </p>
              <p className="text-gray-700 leading-relaxed mt-4">
                Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi non accusamus excepturi 
                placeat minima sit esse numquam deserunt delectus, totam velit beatae, 
                officiis expedita aliquid dignissimos qui maxime vero?
              </p>
            </div>
            
            <h3 className="text-2xl font-semibold mb-4">Disini Anda Akan Belajar</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {learningOutcomes.map((outcome, index) => (
                <div key={index} className="flex items-start">
                  <span className="text-red-500 mr-3 mt-1 flex-shrink-0">•</span>
                  <span className="text-gray-700">{outcome}</span>
                </div>
              ))}
            </div>
          </div>
        );

      case 'konten':
        return (
          <div>
            <h2 className="text-3xl font-bold mb-6">Konten Kursus</h2>
            <div className="mb-6">
              <div className="text-gray-600">
                {mockModules?.length || 0} modul • {mockModules?.reduce((total, module) => total + (module.lessons?.length || 0), 0)} pelajaran • 
                {formatDuration(mockModules?.reduce((total, module) => 
                  total + (module.lessons?.reduce((lessonTotal, lesson) => lessonTotal + lesson.duration, 0) || 0), 0) || course.duration)}
              </div>
            </div>
            
            <div className="space-y-4">
              {mockModules?.map((module, moduleIndex) => (
                <div key={module.id} className="border border-gray-200 rounded-lg">
                  {/* Module Header */}
                  <div 
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleModule(module.id)}
                  >
                    <div className="flex items-center">
                      <span className="text-lg font-semibold mr-3">
                        {moduleIndex + 1}.
                      </span>
                      <div>
                        <h4 className="font-medium text-gray-900">{module.title}</h4>
                        <p className="text-sm text-gray-500">
                          {module.lessons?.length || 0} pelajaran • {formatDuration(
                            module.lessons?.reduce((total, lesson) => total + lesson.duration, 0) || 0
                          )}
                        </p>
                      </div>
                    </div>
                    <svg 
                      className={`w-5 h-5 transform transition-transform duration-200 ${
                        expandedModules.includes(module.id) ? 'rotate-180' : ''
                      }`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  
                  {/* Module Content */}
                  {expandedModules.includes(module.id) && (
                    <div className="border-t border-gray-200">
                      {module.lessons?.map((lesson, lessonIndex) => (
                        <div key={lessonIndex} className="flex items-center p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-25">
                          <div className="mr-3">
                            {lesson.type === 'video' && '🎥'}
                            {lesson.type === 'text' && '📄'}
                            {lesson.type === 'quiz' && '❓'}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{lesson.title}</div>
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDuration(lesson.duration)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'guru':
        return (
          <div>
            <h2 className="text-3xl font-bold mb-6">Tentang Guru</h2>
            
            {/* Instructor Profile */}
            <div className="bg-white rounded-lg p-6 mb-8 shadow-sm border">
              <div className="flex items-start">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center mr-6 flex-shrink-0">
                  <span className="text-white text-2xl font-bold">
                    {course.instructor_name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">{course.instructor_name}</h3>
                  <p className="text-gray-600 mb-4">
                    Seorang educator berpengalaman dengan gelar Sarjana Pendidikan (B.Ed.). 
                    Dengan latar belakang yang kuat dalam bidang pengajaran dan 
                    pengembangan materi edukatif, Senia berkomitmen membantu siswa dan 
                    para pengajar mencapai potensi terbaik mereka.
                  </p>
                  <p className="text-gray-600 mb-4">
                    Melalui kurikulum inovatif dan metode pembelajaran interaktif, dia telah 
                    memperoleh pengetahuan dan inspirasi di berbagai platform, termasuk 
                    Udemy. Pengalaman dan dedikasiya menjadikannya mentor terpercaya 
                    dalam bidang pendidikan online.
                  </p>
                  
                  {/* Instructor Stats */}
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <div className="flex items-center">
                      <span className="mr-1">📚</span>
                      200 Courses
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">👥</span>
                      1,500 Students
                    </div>
                    <div className="flex items-center">
                      <span className="mr-1">⭐</span>
                      4.8 Rating
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Other Courses by Instructor */}
            <h3 className="text-2xl font-semibold mb-6">Kursus Lain Dari Guru Ini</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {instructorOtherCourses?.map((otherCourse) => (
                <div key={otherCourse.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  <img 
                    src={otherCourse.thumbnail}
                    alt={otherCourse.title}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-4">
                    <h4 className="font-semibold mb-2 line-clamp-2">{otherCourse.title}</h4>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{otherCourse.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        👥 {otherCourse.enrolled_count || 0} siswa
                      </span>
                      <button 
                        onClick={() => navigate(`/kursus/${otherCourse.id}`)}
                        className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors"
                      >
                        Lihat Detail →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
        className="relative bg-cover bg-center h-96"
        style={{
          backgroundImage: `url(${course.thumbnail || 'https://via.placeholder.com/1200x400'})`,
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

            {/* Course Info Card - 1 column */}
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

                <div className="mb-6">
                  <div className="text-center mb-4">
                    <div className="text-lg font-semibold text-gray-900">
                      This Course Include :
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-center">
                      <span className="mr-3">📚</span>
                      <span>{mockModules?.length || 0} Module</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-3">🎥</span>
                      <span>{mockModules?.reduce((total, module) => 
                        total + (module.lessons?.filter(lesson => lesson.type === 'video').length || 0), 0)} Video Lessons</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-3">📄</span>
                      <span>{mockModules?.reduce((total, module) => 
                        total + (module.lessons?.filter(lesson => lesson.type === 'text').length || 0), 0)} Reading Materials</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-3">❓</span>
                      <span>{mockModules?.reduce((total, module) => 
                        total + (module.lessons?.filter(lesson => lesson.type === 'quiz').length || 0), 0)} Quizzes</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-3">⏰</span>
                      <span>{formatDuration(course.duration)} Total Duration</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-3">📱</span>
                      <span>Mobile & Desktop Access</span>
                    </div>
                    <div className="flex items-center">
                      <span className="mr-3">🏆</span>
                      <span>Certificate of Completion</span>
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
                      e.stopPropagation();
                      setActiveTab(tab.id);
                    }}
                    className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors duration-200 cursor-pointer z-10 relative ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                    style={{ 
                      pointerEvents: 'auto',
                      userSelect: 'none'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;