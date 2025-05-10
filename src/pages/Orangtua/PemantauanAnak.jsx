import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/layout/layoutParts/Header';
import { 
  RiBookOpenLine, 
  RiTimeLine, 
  RiArrowUpLine, 
  RiArrowDownLine,
  RiMedalLine,
  RiFileChartLine,
  RiCheckboxCircleLine,
  RiErrorWarningLine,
  RiBarChartGroupedLine
} from 'react-icons/ri';

const PemantauanAnakPage = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState('all'); // all, active, completed
  const [sortBy, setSortBy] = useState('recent'); // recent, name, progress, score

  useEffect(() => {
    const fetchChildrenData = async () => {
      try {
        setLoading(true);
        
        // Dalam implementasi sebenarnya, ini akan menjadi panggilan API
        // const childrenResponse = await axios.get('/api/parents/children');
        // setChildren(childrenResponse.data);
        
        // Untuk demo, kita gunakan data dummy
        const dummyChildren = [
          { id: 1, name: 'Muhamad Dimas', class: '5A', school: 'SD Negeri 1 Surakarta', nis: '23523252', image: '/api/placeholder/50/50' },
          { id: 2, name: 'Aisyah Putri', class: '3B', school: 'SD Negeri 1 Surakarta', nis: '23523253', image: '/api/placeholder/50/50' }
        ];
        
        setChildren(dummyChildren);
        
        // Set anak pertama sebagai default yang dipilih
        if (dummyChildren.length > 0 && !selectedChild) {
          setSelectedChild(dummyChildren[0]);
          
          // Fetch data for selected child
          // const [coursesRes, activitiesRes] = await Promise.all([
          //   axios.get(`/api/parents/children/${dummyChildren[0].id}/courses`),
          //   axios.get(`/api/parents/children/${dummyChildren[0].id}/activities`)
          // ]);
          
          // Dummy data untuk kursus anak
          setCourses([
            { 
              id: 1, 
              title: 'Matematika - Aljabar', 
              progress: 82, 
              last_accessed: '2 jam lalu', 
              score: 85,
              status: 'active',
              teacher: 'Ibu Indah Pertiwi',
              upcoming_tasks: [
                { id: 1, title: 'Quiz Persamaan Kuadrat', deadline: '12 Mei 2025' }
              ]
            },
            { 
              id: 2, 
              title: 'Biologi - Reproduksi Manusia', 
              progress: 43, 
              last_accessed: '1 hari lalu', 
              score: 78,
              status: 'active',
              teacher: 'Bapak Ahmad Jauhari',
              upcoming_tasks: [
                { id: 1, title: 'Tugas Laporan Praktikum', deadline: '14 Mei 2025' }
              ]
            },
            { 
              id: 3, 
              title: 'Fisika - Hukum Newton', 
              progress: 10, 
              last_accessed: '3 hari lalu', 
              score: null,
              status: 'active',
              teacher: 'Ibu Sri Wahyuni',
              upcoming_tasks: [
                { id: 1, title: 'Quiz Hukum Newton', deadline: '16 Mei 2025' }
              ]
            },
            { 
              id: 4, 
              title: 'Bahasa Indonesia - Puisi', 
              progress: 100, 
              last_accessed: '1 minggu lalu', 
              score: 90,
              status: 'completed',
              teacher: 'Bapak Darmawan',
              upcoming_tasks: []
            },
            { 
              id: 5, 
              title: 'IPS - Sejarah Indonesia', 
              progress: 100, 
              last_accessed: '2 minggu lalu', 
              score: 88,
              status: 'completed',
              teacher: 'Ibu Ratna Sari',
              upcoming_tasks: []
            },
          ]);
          
          // Dummy data untuk aktivitas anak
          setActivities([
            { id: 1, type: 'course_progress', course: 'Matematika - Aljabar', description: 'Menyelesaikan modul Persamaan Kuadrat', date: '2 jam lalu' },
            { id: 2, type: 'assignment_complete', course: 'Matematika - Aljabar', description: 'Mengumpulkan tugas Persamaan Kuadrat', score: 85, date: '1 hari lalu' },
            { id: 3, type: 'quiz_complete', course: 'Biologi', description: 'Menyelesaikan quiz Sistem Reproduksi', score: 78, date: '3 hari lalu' },
            { id: 4, type: 'course_started', course: 'Fisika - Hukum Newton', description: 'Memulai kursus baru', date: '3 hari lalu' },
            { id: 5, type: 'course_complete', course: 'Bahasa Indonesia - Puisi', description: 'Menyelesaikan kursus', score: 90, date: '1 minggu lalu' },
            { id: 6, type: 'course_complete', course: 'IPS - Sejarah Indonesia', description: 'Menyelesaikan kursus', score: 88, date: '2 minggu lalu' },
          ]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching children data:', error);
        setLoading(false);
      }
    };

    fetchChildrenData();
  }, []);

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    // In a real implementation, we would fetch data for the selected child here
  };

  const filteredCourses = courses.filter(course => {
    if (filterActive === 'all') return true;
    return course.status === filterActive;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.title.localeCompare(b.title);
      case 'progress':
        return b.progress - a.progress;
      case 'score':
        // Handle null scores
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return b.score - a.score;
      case 'recent':
      default:
        // This would ideally sort by a timestamp
        // Here we're relying on the order in the array for simplicity
        return courses.indexOf(a) - courses.indexOf(b);
    }
  });

  const getProgressColorClass = (progress) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getScoreColorClass = (score) => {
    if (!score) return 'text-gray-500';
    if (score < 60) return 'text-red-500';
    if (score < 80) return 'text-yellow-500';
    return 'text-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen ml-20">
      <Header title="Pemantauan Anak" />
      
      <div className="px-6 py-4">
        {/* Pilihan Anak */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-3">Anak Saya</h2>
          <div className="flex space-x-4">
            {children.map(child => (
              <div 
                key={child.id}
                onClick={() => handleChildSelect(child)}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all
                  ${selectedChild?.id === child.id 
                    ? 'bg-blue-100 ring-2 ring-blue-500' 
                    : 'bg-gray-50 hover:bg-gray-100'}`}
              >
                <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 overflow-hidden">
                  <img src={child.image} alt={child.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="font-medium">{child.name}</p>
                  <p className="text-xs text-gray-500">Kelas {child.class}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedChild && (
          <>
            {/* Informasi Siswa */}
            <div className="bg-white p-5 rounded-lg shadow mb-6">
              <div className="flex items-center">
                <div className="w-20 h-20 rounded-full bg-gray-300 mr-4 overflow-hidden">
                  <img src={selectedChild.image} alt={selectedChild.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{selectedChild.name}</h2>
                  <p className="text-gray-500">Kelas {selectedChild.class} - {selectedChild.school}</p>
                  <p className="text-gray-500">NIS: {selectedChild.nis}</p>
                </div>
              </div>
            </div>

            {/* Filter dan Sorting */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="flex flex-wrap justify-between items-center">
                <div className="flex space-x-2 mb-2 sm:mb-0">
                  <button 
                    onClick={() => setFilterActive('all')}
                    className={`px-4 py-2 rounded-md text-sm ${
                      filterActive === 'all' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Semua
                  </button>
                  <button 
                    onClick={() => setFilterActive('active')}
                    className={`px-4 py-2 rounded-md text-sm ${
                      filterActive === 'active' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Aktif
                  </button>
                  <button 
                    onClick={() => setFilterActive('completed')}
                    className={`px-4 py-2 rounded-md text-sm ${
                      filterActive === 'completed' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Selesai
                  </button>
                </div>
                
                <div className="flex items-center">
                  <span className="text-sm text-gray-600 mr-2">Urutkan: </span>
                  <select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                    className="p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="recent">Terbaru</option>
                    <option value="name">Nama</option>
                    <option value="progress">Kemajuan</option>
                    <option value="score">Nilai</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Kursus */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Kursus {filterActive === 'all' ? '' : filterActive === 'active' ? 'Aktif' : 'Selesai'}</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedCourses.map(course => (
                  <div key={course.id} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="text-lg font-semibold">{course.title}</h3>
                        {course.status === 'completed' && (
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                            <RiCheckboxCircleLine className="mr-1" /> Selesai
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-500 mb-3">Pengajar: {course.teacher}</p>
                      
                                              <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Kemajuan</span>
                          <span className="font-medium">{course.progress}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 rounded-full">
                          <div 
                            className={`h-2 rounded-full ${getProgressColorClass(course.progress)}`}
                            style={{ width: `${course.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm text-gray-500">
                          <RiTimeLine className="mr-1" />
                          <span>Terakhir diakses {course.last_accessed}</span>
                        </div>
                        
                        <div className="flex items-center">
                          <RiMedalLine className="mr-1" />
                          <span className={`font-bold ${getScoreColorClass(course.score)}`}>
                            {course.score ? `${course.score}/100` : 'Belum ada nilai'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {course.upcoming_tasks.length > 0 && (
                      <div className="border-t border-gray-100 p-4 bg-gray-50">
                        <p className="text-sm font-medium mb-2">Tugas Mendatang:</p>
                        {course.upcoming_tasks.map(task => (
                          <div key={task.id} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{task.title}</span>
                            <span className="text-gray-500">Deadline: {task.deadline}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {sortedCourses.length === 0 && (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <RiErrorWarningLine size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500">
                    {filterActive === 'all' 
                      ? 'Tidak ada kursus yang tersedia' 
                      : filterActive === 'active' 
                        ? 'Tidak ada kursus aktif'
                        : 'Tidak ada kursus yang telah selesai'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Aktivitas Terbaru */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold">Aktivitas Terbaru</h2>
              </div>
              
              <div className="p-4">
                <div className="space-y-4">
                  {activities.map(activity => (
                    <div key={activity.id} className="flex py-3 border-b border-gray-100 last:border-0">
                      <div className="bg-blue-100 p-2 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                        {activity.type === 'course_progress' && <RiBarChartGroupedLine className="text-blue-600" />}
                        {activity.type === 'assignment_complete' && <RiFileChartLine className="text-green-600" />}
                        {activity.type === 'quiz_complete' && <RiMedalLine className="text-purple-600" />}
                        {activity.type === 'course_started' && <RiBookOpenLine className="text-yellow-600" />}
                        {activity.type === 'course_complete' && <RiCheckboxCircleLine className="text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{activity.course}</h3>
                        <p className="text-sm text-gray-700">{activity.description}</p>
                        {activity.score && (
                          <p className="text-sm font-medium text-green-600">Nilai: {activity.score}/100</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Statistik Kursus */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="text-xl font-semibold mb-4">Statistik Pembelajaran</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Distribusi Status Kursus</h3>
                  <div className="h-32 flex items-end">
                    <div className="w-1/2 mx-auto">
                      <div className="flex justify-between text-sm text-gray-500 mb-1">
                        <span>Aktif</span>
                        <span>Selesai</span>
                      </div>
                      <div className="flex h-20">
                        <div className="w-1/2 mr-1">
                          <div 
                            className="bg-blue-500 w-full rounded-t-md" 
                            style={{ height: `${(courses.filter(c => c.status === 'active').length / courses.length) * 100}%` }}
                          ></div>
                        </div>
                        <div className="w-1/2 ml-1">
                          <div 
                            className="bg-green-500 w-full rounded-t-md" 
                            style={{ height: `${(courses.filter(c => c.status === 'completed').length / courses.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span className="font-medium">{courses.filter(c => c.status === 'active').length}</span>
                        <span className="font-medium">{courses.filter(c => c.status === 'completed').length}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Rata-rata Nilai</h3>
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-blue-600">
                        {Math.round(courses.filter(c => c.score !== null).reduce((sum, course) => sum + course.score, 0) / 
                          courses.filter(c => c.score !== null).length)}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">dari 100</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-3">Kemajuan Keseluruhan</h3>
                  <div className="flex items-center justify-center h-32">
                    <div className="w-32 h-32 relative">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path 
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#eeeeee"
                          strokeWidth="3"
                        />
                        <path 
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="#4f46e5"
                          strokeWidth="3"
                          strokeDasharray={`${courses.reduce((sum, course) => sum + course.progress, 0) / courses.length}, 100`}
                          strokeLinecap="round"
                        />
                        <text x="18" y="20.35" className="text-5xl font-bold" textAnchor="middle" fill="#4f46e5">
                          {Math.round(courses.reduce((sum, course) => sum + course.progress, 0) / courses.length)}%
                        </text>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PemantauanAnakPage;