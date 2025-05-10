import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const CourseLearn = () => {
  const { courseId, lessonId } = useParams();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [currentModule, setCurrentModule] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('detail');
  
  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch course with modules and lessons
        const courseRes = await axios.get(`/api/courses/${courseId}/learn`);
        setCourse(courseRes.data.course);
        setModules(courseRes.data.modules);
        
        // Set default lesson if not specified
        const defaultLessonId = lessonId || getFirstLessonId(courseRes.data.modules);
        
        if (defaultLessonId) {
          const lessonRes = await axios.get(`/api/lessons/${defaultLessonId}`);
          setCurrentLesson(lessonRes.data);
          
          // Find the module containing this lesson
          const foundModule = courseRes.data.modules.find(module => 
            module.lessons.some(lesson => lesson.id.toString() === defaultLessonId.toString())
          );
          setCurrentModule(foundModule);
          
          // Mark lesson as started
          await axios.post(`/api/lessons/${defaultLessonId}/progress`, { status: 'started' });
        }
        
        // Fetch user progress for this course
        const progressRes = await axios.get(`/api/courses/${courseId}/progress`);
        setProgress(progressRes.data.progress);
        
      } catch (error) {
        console.error('Error fetching course data:', error);
        setError('Failed to load course content');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId, lessonId]);
  
  const getFirstLessonId = (modules) => {
    if (!modules || modules.length === 0) return null;
    const firstModule = modules[0];
    if (!firstModule.lessons || firstModule.lessons.length === 0) return null;
    return firstModule.lessons[0].id;
  };
  
  const changeLesson = async (lesson) => {
    try {
      setLoading(true);
      
      // Fetch lesson content
      const lessonRes = await axios.get(`/api/lessons/${lesson.id}`);
      setCurrentLesson(lessonRes.data);
      
      // Find the module containing this lesson
      const foundModule = modules.find(module => 
        module.lessons.some(l => l.id === lesson.id)
      );
      setCurrentModule(foundModule);
      
      // Mark lesson as started
      await axios.post(`/api/lessons/${lesson.id}/progress`, { status: 'started' });
      
      // Update progress
      const progressRes = await axios.get(`/api/courses/${courseId}/progress`);
      setProgress(progressRes.data.progress);
      
    } catch (error) {
      console.error('Error changing lesson:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const markLessonComplete = async () => {
    if (!currentLesson) return;
    
    try {
      await axios.post(`/api/lessons/${currentLesson.id}/progress`, { status: 'completed' });
      
      // Update progress
      const progressRes = await axios.get(`/api/courses/${courseId}/progress`);
      setProgress(progressRes.data.progress);
      
      // Find next lesson
      const nextLesson = findNextLesson();
      if (nextLesson) {
        changeLesson(nextLesson);
      }
    } catch (error) {
      console.error('Error marking lesson as complete:', error);
    }
  };
  
  const findNextLesson = () => {
    if (!currentLesson || !currentModule || !modules.length) return null;
    
    // Find current lesson index in current module
    const currentLessonIndex = currentModule.lessons.findIndex(
      lesson => lesson.id === currentLesson.id
    );
    
    // If there's a next lesson in the current module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      return currentModule.lessons[currentLessonIndex + 1];
    }
    
    // If we need to go to the next module
    const currentModuleIndex = modules.findIndex(
      module => module.id === currentModule.id
    );
    
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      if (nextModule.lessons.length > 0) {
        return nextModule.lessons[0];
      }
    }
    
    return null;
  };
  
  if (loading && !course) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="text-red-500 mb-4">{error}</div>
        <Link to="/courses" className="text-blue-500 hover:underline">Back to courses</Link>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-blue-500 py-3 shadow-md">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link to="/" className="text-white font-medium flex items-center">
            <span className="text-white font-medium flex items-center">MindaGrow</span>
          </Link>
          
          <div className="flex items-center">
            <div className="hidden md:block mr-4">
              <div className="w-48 bg-blue-600 rounded-full h-2">
                <div 
                  className="bg-yellow-400 h-2 rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <Link to={`/courses/${courseId}`} className="text-white hover:text-blue-100">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Link>
          </div>
        </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Content */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto">
            {currentLesson ? (
              <div className="container mx-auto px-4 py-6 max-w-4xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2 md:mb-0">
                    {currentLesson.title || 'MATERI'}
                  </h1>
                  
                  <div className="flex">
                    <div className="relative w-48 mr-2">
                      <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                        <div 
                          className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">{Math.round(progress)}%</div>
                  </div>
                </div>
                
                <div className="mb-6 border-b border-gray-200">
                  <div className="flex">
                    <button 
                      onClick={() => setActiveTab('detail')}
                      className={`px-4 py-2 border-b-2 font-medium text-sm focus:outline-none ${
                        activeTab === 'detail' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Detail Kursus
                    </button>
                    <button 
                      onClick={() => setActiveTab('notes')}
                      className={`px-4 py-2 border-b-2 font-medium text-sm focus:outline-none ${
                        activeTab === 'notes' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Catatan
                    </button>
                    <button 
                      onClick={() => setActiveTab('teacher')}
                      className={`px-4 py-2 border-b-2 font-medium text-sm focus:outline-none ${
                        activeTab === 'teacher' 
                          ? 'border-blue-500 text-blue-600' 
                          : 'border-transparent text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Hubungi Guru
                    </button>
                  </div>
                </div>
                
                {activeTab === 'detail' && (
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: currentLesson.content || `
                      <h1>Lorem Ipsum Cerud Simat</h1>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Modi non accusamus excepturi consequuntur placeat minima sit esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?</p>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Modi non accusamus excepturi consequuntur placeat minima sit esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?</p>
                      <h2>Lorem Ipsum Simat</h2>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Modi non accusamus excepturi consequuntur placeat minima sit esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?</p>
                      <ul>
                        <li>Lorem ipsum dolor sit amet</li>
                        <li>Consectetur adipiscing elit</li>
                        <li>Modi non accusamus excepturi</li>
                        <li>Consequuntur placeat minima sit</li>
                      </ul>
                      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Modi non accusamus excepturi consequuntur placeat minima sit esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?</p>
                    ` }} />
                  </div>
                )}
                
                {activeTab === 'notes' && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Catatan</h3>
                    <textarea
                      className="w-full h-48 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Tulis catatan Anda tentang materi ini..."
                    ></textarea>
                    <div className="mt-4 text-right">
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                        Simpan Catatan
                      </button>
                    </div>
                  </div>
                )}
                
                {activeTab === 'teacher' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Hubungi Guru</h3>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Subjek</label>
                      <input
                        type="text"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Masukkan subjek pesan"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pesan</label>
                      <textarea
                        className="w-full h-32 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Tulis pesan untuk guru..."
                      ></textarea>
                    </div>
                    <div className="text-right">
                      <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50">
                        Kirim Pesan
                      </button>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 flex justify-between">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    onClick={() => {
                      const prevLesson = findPreviousLesson();
                      if (prevLesson) changeLesson(prevLesson);
                    }}
                  >
                    Sebelumnya
                  </button>
                  <button
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                    onClick={markLessonComplete}
                  >
                    Tandai Selesai & Lanjutkan
                  </button>
                </div>
              </div>
            ) : (
              <div className="container mx-auto px-4 py-6 flex justify-center items-center h-full">
                <div className="text-gray-500">Pilih pelajaran untuk memulai</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="hidden md:block w-80 bg-gray-50 border-l border-gray-200 overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {course?.title || 'Biologi - Reproduksi Manusia'}
            </h2>
            <div className="mb-4">
              <div className="relative w-full">
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div 
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {Math.round(progress)}% selesai
              </div>
            </div>
            
            <div className="space-y-4">
              {modules.map((module, moduleIndex) => (
                <div key={moduleIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between bg-gray-50 px-4 py-3">
                    <div className="flex items-center">
                      <button className="focus:outline-none">
                        <svg className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {module.title || `Lesson ${moduleIndex + 1}: ${moduleIndex === 0 ? 'Introduction' : 'Lorem Ipsum'}`}
                      </span>
                    </div>
                  </div>
                  
                  <div className="px-4 pb-4">
                    {module.lessons.map((lesson, lessonIndex) => (
                      <div 
                        key={lessonIndex} 
                        className={`py-2 border-b border-gray-100 last:border-b-0 ${
                          currentLesson && currentLesson.id === lesson.id ? 'bg-blue-50' : ''
                        }`}
                      >
                        <button 
                          className="w-full flex items-center text-left focus:outline-none"
                          onClick={() => changeLesson(lesson)}
                        >
                          <div className="w-6 flex-shrink-0">
                            {lesson.completed ? (
                              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            )}
                          </div>
                          <span className="ml-2 text-sm text-gray-600">
                            {lesson.title || 'Lorem ipsum Sitat bacus trusm'}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Helper function to find previous lesson
  function findPreviousLesson() {
    if (!currentLesson || !currentModule || !modules.length) return null;
    
    // Find current lesson index in current module
    const currentLessonIndex = currentModule.lessons.findIndex(
      lesson => lesson.id === currentLesson.id
    );
    
    // If there's a previous lesson in the current module
    if (currentLessonIndex > 0) {
      return currentModule.lessons[currentLessonIndex - 1];
    }
    
    // If we need to go to the previous module
    const currentModuleIndex = modules.findIndex(
      module => module.id === currentModule.id
    );
    
    if (currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1];
      if (prevModule.lessons.length > 0) {
        return prevModule.lessons[prevModule.lessons.length - 1];
      }
    }
    
    return null;
  }
};

export default CourseLearn;