// src/pages/courses/CourseLearning.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { courseAPI, progressAPI, getErrorMessage } from '../../service/api';
import Header from '../../components/layout/layoutParts/Header';
import {
  RiArrowLeftLine,
  RiPlayFill,
  RiPauseFill,
  RiCheckboxCircleLine,
  RiCheckboxBlankLine,
  RiTimeLine,
  RiFileTextLine,
  RiDownloadLine,
  RiBookOpenLine,
  RiVideoLine,
  RiCloseLine,
  RiFullscreenLine,
  RiVolumeUpLine,
  RiLoader4Line,
  RiErrorWarningLine,
  RiArrowRightLine,
  RiArrowUpSLine,
  RiArrowDownSLine
} from 'react-icons/ri';

const CourseLearning = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});
  const [progress, setProgress] = useState({});
  const [courseProgress, setCourseProgress] = useState({
    completed_lessons: 0,
    total_lessons: 0,
    progress_percentage: 0
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [updateingProgress, setUpdatingProgress] = useState(false);

  // Initialize data
  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { returnTo: `/kursus/${courseId}/belajar` } });
      return;
    }

    if (user.role !== 'siswa') {
      navigate('/');
      return;
    }

    fetchCourseContent();
  }, [courseId, user, navigate]);

  // Fetch course content and progress
  const fetchCourseContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch course content (modules and lessons)
      const courseResponse = await courseAPI.getCourseContent(courseId);
      
      if (!courseResponse.data.success) {
        throw new Error(courseResponse.data.message || 'Failed to fetch course content');
      }

      const courseData = courseResponse.data.data;
      setCourse(courseData.course);
      setModules(courseData.modules || []);

      // Set initial module and lesson
      if (courseData.modules && courseData.modules.length > 0) {
        const firstModule = courseData.modules[0];
        setCurrentModule(firstModule);
        setExpandedModules({ [firstModule.id]: true });

        if (firstModule.lessons && firstModule.lessons.length > 0) {
          setCurrentLesson(firstModule.lessons[0]);
        }
      }

      // Fetch progress
      await fetchProgress();

    } catch (error) {
      console.error('Error fetching course content:', error);
      setError(error.message || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student progress
  const fetchProgress = async () => {
    try {
      const progressResponse = await progressAPI.getStudentCourseProgress(courseId);
      
      if (progressResponse.data.success) {
        const progressData = progressResponse.data.progress || [];
        const progressStats = progressResponse.data.stats || {};
        
        // Convert progress array to object for easier lookup
        const progressMap = {};
        progressData.forEach(item => {
          progressMap[item.lesson_id] = item;
        });
        
        setProgress(progressMap);
        setCourseProgress(progressStats);
      }
    } catch (error) {
      console.error('Error fetching progress:', error);
    }
  };

  // Toggle module expansion
  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  // Select lesson
  const selectLesson = async (lesson, module) => {
    setCurrentLesson(lesson);
    setCurrentModule(module);

    // Mark lesson as started if not already
    if (!progress[lesson.id]) {
      await updateLessonProgress(lesson.id, { completed: false, started: true });
    }
  };

  // Update lesson progress
  const updateLessonProgress = async (lessonId, progressData) => {
    try {
      setUpdatingProgress(true);
      
      const response = await progressAPI.updateLessonProgress(lessonId, progressData);
      
      if (response.data.success) {
        // Update local progress state
        setProgress(prev => ({
          ...prev,
          [lessonId]: {
            ...prev[lessonId],
            ...progressData,
            last_accessed_at: new Date().toISOString()
          }
        }));

        // Refresh course progress stats
        await fetchProgress();
      }
    } catch (error) {
      console.error('Error updating lesson progress:', error);
      alert('Gagal memperbarui progress. Silakan coba lagi.');
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Mark lesson as complete
  const markLessonComplete = async (lessonId) => {
    await updateLessonProgress(lessonId, { completed: true });
  };

  // Mark lesson as incomplete
  const markLessonIncomplete = async (lessonId) => {
    await updateLessonProgress(lessonId, { completed: false });
  };

  // Navigate to next lesson
  const goToNextLesson = () => {
    if (!currentModule || !currentLesson) return;

    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
    
    // Check if there's a next lesson in current module
    if (currentLessonIndex < currentModule.lessons.length - 1) {
      const nextLesson = currentModule.lessons[currentLessonIndex + 1];
      selectLesson(nextLesson, currentModule);
      return;
    }

    // Check if there's a next module
    const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      if (nextModule.lessons && nextModule.lessons.length > 0) {
        setExpandedModules(prev => ({ ...prev, [nextModule.id]: true }));
        selectLesson(nextModule.lessons[0], nextModule);
      }
    }
  };

  // Navigate to previous lesson
  const goToPreviousLesson = () => {
    if (!currentModule || !currentLesson) return;

    const currentLessonIndex = currentModule.lessons.findIndex(l => l.id === currentLesson.id);
    
    // Check if there's a previous lesson in current module
    if (currentLessonIndex > 0) {
      const prevLesson = currentModule.lessons[currentLessonIndex - 1];
      selectLesson(prevLesson, currentModule);
      return;
    }

    // Check if there's a previous module
    const currentModuleIndex = modules.findIndex(m => m.id === currentModule.id);
    if (currentModuleIndex > 0) {
      const prevModule = modules[currentModuleIndex - 1];
      if (prevModule.lessons && prevModule.lessons.length > 0) {
        setExpandedModules(prev => ({ ...prev, [prevModule.id]: true }));
        const lastLesson = prevModule.lessons[prevModule.lessons.length - 1];
        selectLesson(lastLesson, prevModule);
      }
    }
  };

  // Download module file
  const downloadModuleFile = (fileUrl, fileName) => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get file type icon
  const getFileTypeIcon = (fileType) => {
    if (!fileType) return <RiFileTextLine />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf')) return <RiFileTextLine className="text-red-500" />;
    if (type.includes('doc')) return <RiFileTextLine className="text-blue-500" />;
    if (type.includes('ppt')) return <RiFileTextLine className="text-orange-500" />;
    return <RiFileTextLine />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RiLoader4Line className="animate-spin text-6xl text-blue-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Memuat Kursus...</h3>
          <p className="text-gray-600">Sedang menyiapkan materi pembelajaran</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <RiErrorWarningLine className="text-6xl text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => navigate(`/kursus/${courseId}`)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Kembali ke Detail
            </button>
            <button
              onClick={fetchCourseContent}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No content state
  if (!course || !modules.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 text-center">
          <RiBookOpenLine className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Belum Ada Materi</h3>
          <p className="text-gray-600 mb-6">Kursus ini belum memiliki materi pembelajaran.</p>
          <button
            onClick={() => navigate(`/kursus/${courseId}`)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Kembali ke Detail Kursus
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Module List */}
        <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-80'
        } flex-shrink-0 overflow-hidden`}>
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              {!sidebarCollapsed && (
                <div className="flex-1 mr-2">
                  <button
                    onClick={() => navigate(`/kursus/${courseId}`)}
                    className="flex items-center text-blue-600 hover:text-blue-700 text-sm mb-2"
                  >
                    <RiArrowLeftLine className="mr-1" />
                    Kembali ke Detail
                  </button>
                  <h2 className="font-semibold text-gray-900 text-sm line-clamp-2">
                    {course.title}
                  </h2>
                </div>
              )}
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              >
                {sidebarCollapsed ? <RiArrowRightLine /> : <RiCloseLine />}
              </button>
            </div>
          </div>

          {/* Progress Overview */}
          {!sidebarCollapsed && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Progress Kursus</span>
                <span className="text-sm font-medium text-gray-900">
                  {courseProgress.progress_percentage}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${courseProgress.progress_percentage}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500">
                {courseProgress.completed_lessons} dari {courseProgress.total_lessons} lesson selesai
              </div>
            </div>
          )}

          {/* Module List */}
          <div className="flex-1 overflow-y-auto">
            {!sidebarCollapsed ? (
              <div className="p-4 space-y-3">
                {modules.map((module, moduleIndex) => (
                  <div key={module.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                        currentModule?.id === module.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm mb-1">
                            Lesson {moduleIndex + 1}: {module.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {module.lessons?.length || 0} materi
                          </div>
                        </div>
                        <div className="ml-2">
                          {expandedModules[module.id] ? (
                            <RiArrowUpSLine className="text-gray-500" />
                          ) : (
                            <RiArrowDownSLine className="text-gray-500" />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Module Content */}
                    {expandedModules[module.id] && (
                      <div className="border-t border-gray-200">
                        {/* Module Description */}
                        {module.description && (
                          <div className="p-3 bg-gray-50 text-sm text-gray-600">
                            {module.description}
                          </div>
                        )}

                        {/* Module File */}
                        {module.file_url && (
                          <div className="p-3 bg-blue-50 border-b border-gray-200">
                            <button
                              onClick={() => downloadModuleFile(module.file_url, `${module.title}.${module.file_type}`)}
                              className="flex items-center text-blue-600 hover:text-blue-700 text-sm"
                            >
                              {getFileTypeIcon(module.file_type)}
                              <span className="ml-2">Download Materi</span>
                              <RiDownloadLine className="ml-1" />
                            </button>
                          </div>
                        )}

                        {/* Lessons */}
                        <div className="divide-y divide-gray-200">
                          {module.lessons?.map((lesson, lessonIndex) => {
                            const lessonProgress = progress[lesson.id];
                            const isCompleted = lessonProgress?.completed || false;
                            const isCurrent = currentLesson?.id === lesson.id;

                            return (
                              <button
                                key={lesson.id}
                                onClick={() => selectLesson(lesson, module)}
                                className={`w-full p-3 text-left hover:bg-gray-50 transition-colors ${
                                  isCurrent ? 'bg-blue-100' : ''
                                }`}
                              >
                                <div className="flex items-center">
                                  <div className="mr-3">
                                    {isCompleted ? (
                                      <RiCheckboxCircleLine className="text-green-500 text-lg" />
                                    ) : (
                                      <RiCheckboxBlankLine className="text-gray-400 text-lg" />
                                    )}
                                  </div>
                                  <div className="flex-1">
                                    <div className={`text-sm font-medium ${
                                      isCurrent ? 'text-blue-900' : 'text-gray-900'
                                    }`}>
                                      {lessonIndex + 1}. {lesson.title}
                                    </div>
                                    {lesson.duration && (
                                      <div className="flex items-center text-xs text-gray-500 mt-1">
                                        <RiTimeLine className="mr-1" />
                                        {lesson.duration} menit
                                      </div>
                                    )}
                                  </div>
                                  {isCurrent && (
                                    <RiPlayFill className="text-blue-600 ml-2" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Collapsed sidebar - show minimal info
              <div className="p-2 space-y-2">
                {modules.map((module) => (
                  <div key={module.id} className="relative">
                    <button
                      onClick={() => {
                        setSidebarCollapsed(false);
                        toggleModule(module.id);
                      }}
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        currentModule?.id === module.id 
                          ? 'bg-blue-100 text-blue-600' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                      title={module.title}
                    >
                      <RiBookOpenLine />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentLesson ? (
            <>
              {/* Content Header */}
              <div className="bg-white border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <span>{currentModule?.title}</span>
                      <span className="mx-2">•</span>
                      <span>Lesson {currentModule?.lessons?.findIndex(l => l.id === currentLesson.id) + 1}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentLesson.title}
                    </h1>
                    {currentLesson.duration && (
                      <div className="flex items-center text-sm text-gray-500">
                        <RiTimeLine className="mr-1" />
                        Estimasi: {currentLesson.duration} menit
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* Progress Toggle */}
                    <button
                      onClick={() => {
                        const isCompleted = progress[currentLesson.id]?.completed || false;
                        if (isCompleted) {
                          markLessonIncomplete(currentLesson.id);
                        } else {
                          markLessonComplete(currentLesson.id);
                        }
                      }}
                      disabled={updateingProgress}
                      className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        progress[currentLesson.id]?.completed
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      } disabled:opacity-50`}
                    >
                      {updateingProgress ? (
                        <RiLoader4Line className="animate-spin mr-2" />
                      ) : progress[currentLesson.id]?.completed ? (
                        <RiCheckboxCircleLine className="mr-2" />
                      ) : (
                        <RiCheckboxBlankLine className="mr-2" />
                      )}
                      {progress[currentLesson.id]?.completed ? 'Selesai' : 'Tandai Selesai'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Lesson Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto p-8">
                  {/* Content Display */}
                  <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                    <div className="text-center mb-8">
                      <h2 className="text-6xl font-bold text-gray-800 mb-8">MATERI</h2>
                    </div>

                    {/* Lesson Content */}
                    <div className="prose prose-lg max-w-none">
                      {currentLesson.content ? (
                        <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                          {currentLesson.content}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <RiFileTextLine className="text-4xl mx-auto mb-4" />
                          <p>Konten lesson belum tersedia</p>
                        </div>
                      )}
                    </div>

                    {/* Module File Download */}
                    {currentModule?.file_url && (
                      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-3 flex items-center">
                          {getFileTypeIcon(currentModule.file_type)}
                          <span className="ml-2">Materi Tambahan</span>
                        </h4>
                        <p className="text-blue-700 text-sm mb-4">
                          Download file materi untuk pembelajaran yang lebih mendalam
                        </p>
                        <button
                          onClick={() => downloadModuleFile(
                            currentModule.file_url, 
                            `${currentModule.title}.${currentModule.file_type || 'pdf'}`
                          )}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <RiDownloadLine className="mr-2" />
                          Download Materi ({currentModule.file_type?.toUpperCase() || 'PDF'})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between items-center">
                    <button
                      onClick={goToPreviousLesson}
                      className="flex items-center px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!currentModule || !currentLesson || 
                        (currentModule.lessons?.[0]?.id === currentLesson.id && 
                         modules?.[0]?.id === currentModule.id)}
                    >
                      <RiArrowLeftLine className="mr-2" />
                      Lesson Sebelumnya
                    </button>

                    <div className="text-center">
                      <div className="text-sm text-gray-500">
                        Lesson {(currentModule?.lessons?.findIndex(l => l.id === currentLesson.id) || 0) + 1} dari {currentModule?.lessons?.length || 0}
                      </div>
                    </div>

                    <button
                      onClick={goToNextLesson}
                      className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!currentModule || !currentLesson || 
                        (currentModule.lessons?.[currentModule.lessons.length - 1]?.id === currentLesson.id && 
                         modules?.[modules.length - 1]?.id === currentModule.id)}
                    >
                      Lesson Selanjutnya
                      <RiArrowRightLine className="ml-2" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* No Lesson Selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <RiBookOpenLine className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Pilih Lesson untuk Memulai
                </h3>
                <p className="text-gray-600">
                  Klik pada lesson di sidebar untuk memulai pembelajaran
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseLearning;