import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const CourseDetail = () => {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [teacher, setTeacher] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch course details with teacher info
        const courseRes = await axios.get(`/api/courses/${courseId}`);
        setCourse(courseRes.data);
        
        // Fetch teacher profile
        const teacherRes = await axios.get(`/api/teachers/${courseRes.data.teacher_id}`);
        setTeacher(teacherRes.data);
        
        // Check if user is enrolled
        if (user) {
          const enrollmentRes = await axios.get(`/api/courses/${courseId}/enrollment`);
          setIsEnrolled(enrollmentRes.data.is_enrolled);
        }
        
      } catch (error) {
        console.error('Error fetching course details:', error);
        setError('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, user]);
  
  const handleStartCourse = async () => {
    try {
      if (!isEnrolled) {
        // Enroll user in course
        await axios.post(`/api/courses/${courseId}/enroll`);
        setIsEnrolled(true);
      }
      
      // Redirect to course content
      window.location.href = `/courses/${courseId}/learn`;
    } catch (error) {
      console.error('Error starting course:', error);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-red-500 mb-4">Error: {error || 'Course not found'}</div>
        <Link to="/courses" className="text-blue-500 hover:underline">Back to courses</Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50"> 
      {/* Course Banner */}
      <div className="relative">
        <div className="w-full h-64 bg-gray-300 relative overflow-hidden">
          {course.banner_image ? (
            <img 
              src={course.banner_image} 
              alt={course.title} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="bg-gray-700 w-full h-full flex items-center justify-center text-white text-2xl">
              {course.title}
            </div>
          )}
          
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          
          {/* Course Title */}
          <div className="absolute bottom-0 left-0 p-6 w-full">
            <div className="container mx-auto">
              <h1 className="text-3xl font-bold text-white mb-2">{course.title}</h1>
              <p className="text-white text-opacity-90">{course.short_description}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row">
          {/* Main Content */}
          <div className="w-full md:w-2/3 lg:w-3/4 pr-0 md:pr-6">
            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex">
                <button 
                  onClick={() => setActiveTab('description')}
                  className={`px-4 py-3 font-medium text-sm focus:outline-none ${
                    activeTab === 'description' 
                      ? 'border-b-2 border-blue-500 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Deskripsi
                </button>
                <button 
                  onClick={() => setActiveTab('content')}
                  className={`px-4 py-3 font-medium text-sm focus:outline-none ${
                    activeTab === 'content' 
                      ? 'border-b-2 border-blue-500 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Konten Kursus
                </button>
                <button 
                  onClick={() => setActiveTab('content')}
                  className={`px-4 py-3 font-medium text-sm focus:outline-none ${
                    activeTab === 'content' 
                      ? 'border-b-2 border-blue-500 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Konten Kursus
                </button>
                <button 
                  onClick={() => setActiveTab('teacher')}
                  className={`px-4 py-3 font-medium text-sm focus:outline-none ${
                    activeTab === 'teacher' 
                      ? 'border-b-2 border-blue-500 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Guru
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="pb-8">
              {/* Description Tab */}
              {activeTab === 'description' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Tentang Kursus Ini</h2>
                  <div className="prose max-w-none text-gray-600">
                    {course.description || 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi non accusamus excepturi consequuntur placeat minima sit esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?'}
                  </div>
                  
                  {/* Learning Objectives */}
                  <div className="mt-8">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Disini Anda Akan Belajar</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(course.learning_objectives || []).length > 0 ? (
                        course.learning_objectives.map((objective, index) => (
                          <div key={index} className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 mt-0.5 text-red-500">⬤</div>
                            <p className="ml-3 text-gray-600">{objective}</p>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 mt-0.5 text-red-500">⬤</div>
                            <p className="ml-3 text-gray-600">Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi non accusamus excepturi consequuntur placeat minima sit</p>
                          </div>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 mt-0.5 text-red-500">⬤</div>
                            <p className="ml-3 text-gray-600">esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?</p>
                          </div>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 mt-0.5 text-red-500">⬤</div>
                            <p className="ml-3 text-gray-600">Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi non accusamus excepturi consequuntur placeat minima sit</p>
                          </div>
                          <div className="flex items-start">
                            <div className="flex-shrink-0 h-5 w-5 mt-0.5 text-red-500">⬤</div>
                            <p className="ml-3 text-gray-600">esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Content Tab */}
              {activeTab === 'content' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Konten Kursus</h2>
                  
                  {/* Modules Accordion */}
                  <div className="space-y-4">
                    {(course.modules || []).length > 0 ? (
                      course.modules.map((module, moduleIndex) => (
                        <div key={moduleIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer">
                            <div className="flex items-center">
                              <button className="focus:outline-none">
                                <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <span className="ml-2 text-sm font-medium text-gray-900">Lesson {moduleIndex + 1}: {module.title}</span>
                            </div>
                          </div>
                          
                          <div className="px-4 pb-4">
                            {module.lessons.map((lesson, lessonIndex) => (
                              <div key={lessonIndex} className="py-2 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center">
                                  <div className="w-6 flex-shrink-0">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <span className="ml-2 text-sm text-gray-600">
                                    {lesson.title || 'Lorem ipsum Sitat bacus trusm'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer">
                            <div className="flex items-center">
                              <button className="focus:outline-none">
                                <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <span className="ml-2 text-sm font-medium text-gray-900">Lesson 1: Introduction</span>
                            </div>
                          </div>
                          <div className="px-4 pb-4">
                            {Array(4).fill(0).map((_, i) => (
                              <div key={i} className="py-2 border-b border-gray-100 last:border-b-0">
                                <div className="flex items-center">
                                  <div className="w-6 flex-shrink-0">
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <span className="ml-2 text-sm text-gray-600">
                                    Lorem ipsum Sitat bacus trusm
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {Array(3).fill(0).map((_, i) => (
                          <div key={i} className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="flex items-center justify-between bg-gray-50 px-4 py-3 cursor-pointer">
                              <div className="flex items-center">
                                <button className="focus:outline-none">
                                  <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                  </svg>
                                </button>
                                <span className="ml-2 text-sm font-medium text-gray-900">Lesson {i + 2}: Lorem ipsum</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {/* Teacher Tab */}
              {activeTab === 'teacher' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Tentang Guru</h2>
                  
                  {teacher ? (
                    <div className="flex flex-col md:flex-row">
                      <div className="w-24 h-24 md:w-36 md:h-36 flex-shrink-0 mb-4 md:mb-0">
                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                          {teacher.profile_picture ? (
                            <img 
                              src={teacher.profile_picture} 
                              alt={teacher.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">
                              {teacher.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="md:ml-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {teacher.name} {teacher.credentials}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {teacher.bio || 'Seorang edukator berpengalaman dengan gelar Sarjana Pendidikan (S.Ed.). Dengan latar belakang yang kuat dalam bidang pengajaran dan pengembangan material edukatif, Senia berkomitmen membantu siswa dan para pengajar mencapai potensi terbaik mereka.'}
                        </p>
                        
                        <div className="flex items-center text-gray-500 text-sm">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span>{teacher.total_courses || 200} Courses</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col md:flex-row">
                      <div className="w-24 h-24 md:w-36 md:h-36 flex-shrink-0 mb-4 md:mb-0">
                        <div className="w-full h-full rounded-full overflow-hidden bg-gray-200">
                          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xl">
                            S
                          </div>
                        </div>
                      </div>
                      <div className="md:ml-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Senia Willingtion S B.Ed.
                        </h3>
                        <p className="text-gray-600 mb-4">
                          Seorang edukator berpengalaman dengan gelar Sarjana Pendidikan (S.Ed.). Dengan latar belakang yang kuat dalam bidang pengajaran dan pengembangan material edukatif, Senia berkomitmen membantu siswa dan para pengajar mencapai potensi terbaik mereka.
                        </p>
                        
                        <div className="flex items-center text-gray-500 text-sm">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                          <span>200 Courses</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Other Courses */}
                  <div className="mt-10">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Kursus Lain Dari Guru Ini</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm">
                        <div className="flex">
                          <div className="w-24 h-24 bg-gray-200">
                            <img 
                              src="https://via.placeholder.com/100" 
                              alt="Course thumbnail" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Biologi - Organisme dalam Tumbuhan</h4>
                          </div>
                        </div>
                      </div>
                      
                      <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-sm">
                        <div className="flex">
                          <div className="w-24 h-24 bg-gray-200">
                            <img 
                              src="https://via.placeholder.com/100" 
                              alt="Course thumbnail" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-3 flex-1">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Biologi - Bagian-bagian tubuh pada hewan Kucing</h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Sidebar */}
          <div className="w-full md:w-1/3 lg:w-1/4 mt-8 md:mt-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <div className="mb-4">
                  <div className="flex items-center mb-1">
                    <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-sm text-gray-600">This Course Include :</div>
                  </div>
                  <div className="flex items-center ml-7 mb-2">
                    <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="text-sm text-gray-600">{course.total_modules || 15} Module</div>
                  </div>
                </div>
                
                <button 
                  onClick={() => setShowStartModal(true)} 
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  Start Course
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Start Course Modal */}
      {showStartModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowStartModal(false)}></div>
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 z-10 relative">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Apakah anda yakin ingin memulai kursus ini?</h3>
              <p className="text-gray-600">Anda akan mulai mempelajari {course.title}</p>
            </div>
            
            <div className="flex justify-center space-x-4">
              <button 
                onClick={() => setShowStartModal(false)} 
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={handleStartCourse} 
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                Mulai Belajar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseDetail;