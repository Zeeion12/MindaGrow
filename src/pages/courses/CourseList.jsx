import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const CourseList = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [newCourses, setNewCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [streakDays, setStreakDays] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch all required data in parallel
        const [coursesRes, popularRes, newCoursesRes, categoriesRes, progressRes, streakRes] = await Promise.all([
          axios.get('/api/courses'),
          axios.get('/api/courses/popular'),
          axios.get('/api/courses/new'),
          axios.get('/api/categories'),
          axios.get('/api/users/me/progress'),
          axios.get('/api/users/me/streak')
        ]);
        
        setCourses(coursesRes.data);
        setPopularCourses(popularRes.data);
        setNewCourses(newCoursesRes.data);
        setCategories(categoriesRes.data);
        
        // Convert progress to a more usable format
        const progressMap = {};
        progressRes.data.forEach(item => {
          progressMap[item.course_id] = item.progress;
        });
        setUserProgress(progressMap);
        
        // Set streak days
        setStreakDays(streakRes.data.current_streak || 0);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const filteredCourses = courses.filter(course => 
    course.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-6">
        {/* Hero Section */}
        <div className="bg-blue-100 rounded-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                <span className="text-green-600">🌟</span> Lanjutkan kursusmu dan capai bintang tertinggi!
              </h1>
              <p className="text-gray-600">Baru saja</p>
            </div>
            
            {/* Fire Streak */}
            {streakDays > 0 && (
              <div className="bg-yellow-400 rounded-lg p-4 text-center mt-4 md:mt-0">
                <div className="text-4xl mb-1">🔥</div>
                <div className="text-4xl font-bold">{streakDays}</div>
                <div className="text-sm font-medium">hari beruntun!</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Currently Enrolled Courses */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {courses.filter(course => userProgress[course.id] !== undefined && userProgress[course.id] < 100)
            .slice(0, 3)
            .map(course => (
              <Link to={`/courses/${course.id}`} key={course.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img 
                    src={course.banner_image} 
                    alt={course.title} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">{course.title}</h3>
                  <div className="text-sm text-gray-600 mb-2">{course.category}</div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ width: `${userProgress[course.id]}%` }}
                    ></div>
                  </div>
                  <div className="text-right text-sm text-gray-600">{userProgress[course.id]}%</div>
                </div>
              </Link>
          ))}
        </div>
        
        {/* Performance Charts Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Course Progress Chart */}
          <div className="bg-white rounded-lg p-4 shadow-sm col-span-1 md:col-span-1">
            <h3 className="font-medium text-gray-800 mb-4">Pencapaian kursus</h3>
            <div className="h-64 flex items-center justify-center">
              {/* Chart will go here - simplified for this example */}
              <div className="w-full h-56 bg-gray-100 flex items-center justify-center">
                <span className="text-gray-400">Grafik Pencapaian</span>
              </div>
            </div>
          </div>
          
          {/* Course Scores */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <h3 className="font-medium text-gray-800 mb-4">Skor kursus kamu</h3>
            <div className="space-y-3">
              {courses.filter(course => userProgress[course.id] !== undefined)
                .slice(0, 4)
                .map(course => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white mr-3">
                        {course.title.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{course.title}</div>
                        <div className="text-xs text-gray-500">Nama status</div>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-md flex items-center justify-center text-white font-medium ${getScoreColor(course.score)}`}>
                      {course.score || Math.floor(Math.random() * 100)}
                    </div>
                  </div>
              ))}
              <div className="text-right">
                <a href="#" className="text-blue-500 text-sm hover:underline">Lihat lebih lanjut...</a>
              </div>
            </div>
          </div>
          
          {/* Streak Card */}
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="bg-yellow-400 rounded-lg p-6 flex flex-col items-center justify-center h-full">
              <div className="text-6xl mb-2">🔥</div>
              <div className="text-6xl font-bold">{streakDays}</div>
              <div className="text-xl font-medium">hari beruntun!</div>
            </div>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative mb-8">
          <input
            type="text"
            placeholder="Cari kursus..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full px-4 py-3 pr-10 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute right-3 top-3 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        {/* Popular Courses */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Paling populer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {popularCourses.map(course => (
              <Link to={`/courses/${course.id}`} key={course.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img 
                    src={course.banner_image} 
                    alt={course.title} 
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900">{course.title}</h3>
                </div>
              </Link>
            ))}
          </div>
        </section>
        
        {/* New Courses */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Kursus baru</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {newCourses.map(course => (
              <Link to={`/courses/${course.id}`} key={course.id} className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="aspect-w-16 aspect-h-9 bg-gray-100 relative">
                  {/* Course Thumbnail or Icon */}
                  <div className={`absolute top-2 left-2 w-10 h-10 rounded-md flex items-center justify-center text-white font-bold ${getCategoryColor(course.category_id)}`}>
                    {course.title.charAt(0)}
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-1">{course.title}</h3>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Tipe: {course.level}</span>
                    <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">Cek</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
        
        {/* Categories */}
        <section>
          <h2 className="text-xl font-bold mb-4">Kategori</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
            {categories.map(category => (
              <Link to={`/categories/${category.slug}`} key={category.id} className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center">
                <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                  {/* Category icon would go here - using text as placeholder */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(category.id)}`}>
                    <span className="text-white text-lg">{category.name.charAt(0)}</span>
                  </div>
                </div>
                <div className="text-xs font-medium">{category.name}</div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

// Helper functions
const getScoreColor = (score) => {
  if (!score) return 'bg-gray-400';
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

const getCategoryColor = (categoryId) => {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'
  ];
  
  return colors[categoryId % colors.length];
};

export default CourseList;