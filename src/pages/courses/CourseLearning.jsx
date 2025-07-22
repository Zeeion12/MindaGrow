// src/pages/courses/CourseLearning.jsx
import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { courseAPI } from '../../service/api';
import {
  RiArrowLeftLine,
  RiCheckboxCircleLine,
  RiCheckboxBlankCircleLine,
  RiDownloadLine,
  RiMessageLine,
  RiBookOpenLine,
  RiPlayCircleLine,
  RiPauseCircleLine,
  RiFileTextLine,
  RiFullscreenLine,
  RiFullscreenExitLine,
  RiZoomInLine,
  RiZoomOutLine
} from 'react-icons/ri';

const CourseLearning = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const pdfViewerRef = useRef(null);

  // State management
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({});
  const [expandedModules, setExpandedModules] = useState({});
  const [pdfZoom, setPdfZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lessonNotes, setLessonNotes] = useState('');
  const [showNotes, setShowNotes] = useState(false);

  // Fetch course data and modules
  useEffect(() => {
    if (courseId) {
      fetchCourseData();
    }
  }, [courseId]);

  // Auto-select first lesson when modules are loaded
  useEffect(() => {
    if (modules.length > 0 && !currentLesson) {
      const firstModule = modules[0];
      if (firstModule.lessons && firstModule.lessons.length > 0) {
        selectLesson(firstModule.lessons[0], firstModule);
        setExpandedModules({ [firstModule.id]: true });
      }
    }
  }, [modules, currentLesson]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if user is enrolled
      if (!user || user.role !== 'siswa') {
        navigate('/login');
        return;
      }

      const response = await courseAPI.getCourseById(courseId);
      
      if (response.data.success) {
        const courseData = response.data.data;
        
        // Check if user is enrolled
        if (!courseData.is_enrolled) {
          navigate(`/kursus/${courseId}`);
          return;
        }

        setCourse(courseData);
        setModules(courseData.modules || []);
        
        // Fetch user progress
        await fetchProgress();
      } else {
        setError('Course not found');
      }
    } catch (err) {
      console.error('Error fetching course data:', err);
      setError('Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProgress = async () => {
    try {
      // This would be an API call to get user's progress
      // For now, using mock data
      const mockProgress = {
        completedLessons: [],
        currentProgress: 45,
        totalLessons: 20
      };
      setProgress(mockProgress);
    } catch (err) {
      console.error('Error fetching progress:', err);
    }
  };

  const selectLesson = (lesson, module) => {
    setCurrentLesson(lesson);
    setCurrentModule(module);
    setLessonNotes(''); // Reset notes for new lesson
    
    // Mark lesson as accessed
    markLessonAccessed(lesson.id);
  };

  const markLessonAccessed = async (lessonId) => {
    try {
      // API call to mark lesson as accessed
      console.log('Marking lesson as accessed:', lessonId);
    } catch (err) {
      console.error('Error marking lesson as accessed:', err);
    }
  };

  const toggleLessonComplete = async (lessonId) => {
    try {
      // API call to toggle lesson completion
      const isCompleted = progress.completedLessons.includes(lessonId);
      
      if (isCompleted) {
        setProgress(prev => ({
          ...prev,
          completedLessons: prev.completedLessons.filter(id => id !== lessonId)
        }));
      } else {
        setProgress(prev => ({
          ...prev,
          completedLessons: [...prev.completedLessons, lessonId]
        }));
      }
    } catch (err) {
      console.error('Error toggling lesson completion:', err);
    }
  };

  const toggleModuleExpansion = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  const handlePdfZoom = (type) => {
    if (type === 'in' && pdfZoom < 3) {
      setPdfZoom(prev => prev + 0.25);
    } else if (type === 'out' && pdfZoom > 0.5) {
      setPdfZoom(prev => prev - 0.25);
    }
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (pdfViewerRef.current.requestFullscreen) {
        pdfViewerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

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

  const goToPrevLesson = () => {
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

  const handleChatWithTeacher = () => {
    // Navigate to chat with teacher
    navigate(`/chat?teacher=${course.instructor_id}&course=${courseId}`);
  };

  const calculateOverallProgress = () => {
    if (!modules.length) return 0;
    
    const totalLessons = modules.reduce((total, module) => 
      total + (module.lessons ? module.lessons.length : 0), 0);
    
    if (totalLessons === 0) return 0;
    
    return Math.round((progress.completedLessons.length / totalLessons) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading course...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <button
            onClick={() => navigate('/kursus')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-full mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate(`/kursus/${courseId}`)}
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RiArrowLeftLine size={20} />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {course?.title}
                </h1>
                <p className="text-sm text-gray-600">
                  Progress: {calculateOverallProgress()}%
                </p>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="flex-1 max-w-md mx-8">
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateOverallProgress()}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-1 text-center">
                {progress.completedLessons.length} of {modules.reduce((total, m) => total + (m.lessons?.length || 0), 0)} lessons completed
              </div>
            </div>

            <div className="text-sm text-gray-600">
              {course?.instructor_name}
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Main Content Area */}
        <div className="flex-1 bg-white">
          {currentModule && currentModule.file_url ? (
            /* PDF Viewer */
            <div className="h-full flex flex-col">
              {/* PDF Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                <div className="flex items-center space-x-2">
                  <RiFileTextLine className="text-blue-600" size={20} />
                  <span className="font-medium">{currentModule.title}</span>
                  {currentLesson && (
                    <span className="text-gray-500">- {currentLesson.title}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePdfZoom('out')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    disabled={pdfZoom <= 0.5}
                  >
                    <RiZoomOutLine size={16} />
                  </button>
                  <span className="text-sm px-2">{Math.round(pdfZoom * 100)}%</span>
                  <button
                    onClick={() => handlePdfZoom('in')}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                    disabled={pdfZoom >= 3}
                  >
                    <RiZoomInLine size={16} />
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                  >
                    {isFullscreen ? <RiFullscreenExitLine size={16} /> : <RiFullscreenLine size={16} />}
                  </button>
                  <a
                    href={currentModule.file_url}
                    download
                    className="p-2 hover:bg-gray-200 rounded transition-colors"
                  >
                    <RiDownloadLine size={16} />
                  </a>
                </div>
              </div>

              {/* PDF Display */}
              <div ref={pdfViewerRef} className="flex-1 overflow-auto bg-gray-100 p-4">
                <div className="max-w-4xl mx-auto">
                  <iframe
                    src={`${currentModule.file_url}#zoom=${pdfZoom * 100}`}
                    className="w-full h-full min-h-[800px] border border-gray-300 rounded"
                    title={`${currentModule.title} - Module Material`}
                  />
                </div>
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border-t">
                <button
                  onClick={goToPrevLesson}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                  disabled={!currentLesson || (modules.findIndex(m => m.id === currentModule.id) === 0 && 
                    currentModule.lessons.findIndex(l => l.id === currentLesson.id) === 0)}
                >
                  Previous Lesson
                </button>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleLessonComplete(currentLesson?.id)}
                    className={`flex items-center px-4 py-2 rounded transition-colors ${
                      progress.completedLessons.includes(currentLesson?.id)
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {progress.completedLessons.includes(currentLesson?.id) ? (
                      <RiCheckboxCircleLine className="mr-2" />
                    ) : (
                      <RiCheckboxBlankCircleLine className="mr-2" />
                    )}
                    {progress.completedLessons.includes(currentLesson?.id) ? 'Completed' : 'Mark Complete'}
                  </button>
                </div>

                <button
                  onClick={goToNextLesson}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  disabled={!currentLesson || (modules.findIndex(m => m.id === currentModule.id) === modules.length - 1 && 
                    currentModule.lessons.findIndex(l => l.id === currentLesson.id) === currentModule.lessons.length - 1)}
                >
                  Next Lesson
                </button>
              </div>
            </div>
          ) : (
            /* No Material Selected */
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <RiBookOpenLine className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  {currentLesson ? 'No Material Available' : 'Select a Lesson'}
                </h3>
                <p className="text-gray-600">
                  {currentLesson 
                    ? 'This lesson does not have a PDF material attached.'
                    : 'Choose a lesson from the course outline to start learning.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Course Progress */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Your Progress</span>
              <span className="text-sm font-bold text-blue-600">{calculateOverallProgress()}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${calculateOverallProgress()}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {progress.completedLessons.length}/{modules.reduce((total, m) => total + (m.lessons?.length || 0), 0)} lessons
            </div>
          </div>

          {/* Course Modules */}
          <div className="flex-1 overflow-y-auto">
            {modules.map((module, moduleIndex) => (
              <div key={module.id} className="border-b border-gray-100">
                {/* Module Header */}
                <button
                  onClick={() => toggleModuleExpansion(module.id)}
                  className="w-full text-left p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        Lesson {moduleIndex + 1}: {module.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {module.lessons?.length || 0} Content{module.lessons?.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className={`transform transition-transform ${
                      expandedModules[module.id] ? 'rotate-90' : ''
                    }`}>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </button>

                {/* Module Lessons */}
                {expandedModules[module.id] && module.lessons && (
                  <div className="border-t border-gray-100">
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = progress.completedLessons.includes(lesson.id);
                      const isActive = currentLesson?.id === lesson.id;
                      
                      return (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(lesson, module)}
                          className={`w-full text-left p-3 pl-8 hover:bg-gray-50 transition-colors border-l-2 ${
                            isActive 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-transparent'
                          }`}
                        >
                          <div className="flex items-center">
                            <div className="mr-3">
                              {isCompleted ? (
                                <RiCheckboxCircleLine className="text-green-500" size={16} />
                              ) : (
                                <RiCheckboxBlankCircleLine className="text-gray-400" size={16} />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className={`text-sm ${
                                isActive ? 'font-medium text-blue-900' : 'text-gray-900'
                              }`}>
                                {lessonIndex + 1}. {lesson.title}
                              </div>
                              {lesson.duration && (
                                <div className="text-xs text-gray-500 mt-1">
                                  {lesson.duration} min
                                </div>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Lesson Details */}
          {currentLesson && (
            <div className="border-t border-gray-200">
              {/* Lesson Info */}
              <div className="p-4">
                <h5 className="font-medium text-gray-900 mb-2">
                  {currentLesson.title}
                </h5>
                {currentLesson.content && (
                  <p className="text-sm text-gray-600 mb-3">
                    {currentLesson.content}
                  </p>
                )}
                {currentLesson.duration && (
                  <div className="text-xs text-gray-500 mb-3">
                    Duration: {currentLesson.duration} minutes
                  </div>
                )}
              </div>

              {/* Notes Section */}
              <div className="px-4 pb-4">
                <button
                  onClick={() => setShowNotes(!showNotes)}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors mb-2"
                >
                  <RiFileTextLine className="mr-1" size={14} />
                  {showNotes ? 'Hide Notes' : 'Add Notes'}
                </button>
                
                {showNotes && (
                  <div className="mt-2">
                    <textarea
                      value={lessonNotes}
                      onChange={(e) => setLessonNotes(e.target.value)}
                      placeholder="Add your notes about this lesson..."
                      className="w-full h-20 text-xs border border-gray-300 rounded p-2 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <button
                      onClick={() => {
                        // Save notes logic here
                        console.log('Saving notes:', lessonNotes);
                      }}
                      className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                    >
                      Save Notes
                    </button>
                  </div>
                )}
              </div>

              {/* Chat with Teacher */}
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={handleChatWithTeacher}
                  className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  <RiMessageLine className="mr-2" size={16} />
                  Chat with Teacher
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseLearning;