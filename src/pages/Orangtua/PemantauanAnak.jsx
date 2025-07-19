import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/layout/layoutParts/Header';
import ParentInsightsPanel from '../../components/ParentInsightsPanel';
import {
  RiBrainLine,
  RiStarLine,
  RiAlarmWarningLine,
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
  const [childClasses, setChildClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterActive, setFilterActive] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [showInsights, setShowInsights] = useState(false);

  // Modifikasi bagian useEffect
  useEffect(() => {
    const fetchChildrenData = async () => {
      try {
        setLoading(true);

        // Ambil token dari localStorage atau context
        const token = localStorage.getItem('token');

        // Fetch data anak-anak dari API
        const response = await fetch('/api/parent/children', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch children data');
        }

        const data = await response.json();
        setChildren(data.children);

        // Set anak pertama sebagai default yang dipilih
        if (data.children.length > 0 && !selectedChild) {
          const firstChild = data.children[0];
          setSelectedChild(firstChild);

          // Fetch kelas yang diikuti anak pertama
          await fetchChildClasses(firstChild.id, token);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching children data:', error);
        setLoading(false);
        alert('Gagal mengambil data anak. Silakan coba lagi.');
      }
    };

    fetchChildrenData();
  }, []);

  // fungsi untuk fetch kelas anak
  const fetchChildClasses = async (childId, token) => {
    try {
      // Fetch kelas
      const classesResponse = await fetch(`/api/parent/children/${childId}/classes`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setCourses(classesData.classes);
      } else {
        console.error('Failed to fetch child classes');
        setCourses([]);
      }

      // Fetch aktivitas tugas
      const activitiesResponse = await fetch(`/api/parent/children/${childId}/activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json();
        setActivities(activitiesData.activities);
      } else {
        console.error('Failed to fetch child activities');
        // Fallback ke dummy data jika gagal
        setActivities([
          { id: 1, type: 'course_progress', course: 'Tidak ada aktivitas', description: 'Belum ada aktivitas tugas', date: '-' }
        ]);
      }

    } catch (error) {
      console.error('Error fetching child data:', error);
      setCourses([]);
      setActivities([]);
    }
  };

  // Modifikasi fungsi handleChildSelect
  const handleChildSelect = async (child) => {
    setSelectedChild(child);

    // Fetch kelas untuk anak yang dipilih
    const token = localStorage.getItem('token');
    await fetchChildClasses(child.id, token);
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
    <div className="bg-gray-50 min-h-screen">
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
                    className={`px-4 py-2 rounded-md text-sm ${filterActive === 'all'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setFilterActive('active')}
                    className={`px-4 py-2 rounded-md text-sm ${filterActive === 'active'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Aktif
                  </button>
                  <button
                    onClick={() => setFilterActive('completed')}
                    className={`px-4 py-2 rounded-md text-sm ${filterActive === 'completed'
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

            {/* Kelas */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Kelas {filterActive === 'all' ? '' : filterActive === 'active' ? 'Aktif' : 'Selesai'}</h2>

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
                        {course.status === 'active' && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center">
                            Aktif
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-gray-500 mb-3">Pengajar: {course.teacher}</p>

                      {course.subject && (
                        <p className="text-sm text-gray-600 mb-3">Mata Pelajaran: {course.subject}</p>
                      )}

                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm text-gray-500">
                          <RiTimeLine className="mr-1" />
                          <span>{course.last_accessed}</span>
                        </div>

                        <div className="flex items-center">
                          <RiMedalLine className="mr-1" />
                          <span className={`font-bold ${getScoreColorClass(course.score)}`}>
                            {course.score ? `${course.score}/100` : 'Sedang Berlangsung'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {course.upcoming_tasks && course.upcoming_tasks.length > 0 && (
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
                    {selectedChild?.name} belum mengikuti kelas apapun
                  </p>
                </div>
              )}
            </div>

            {/* Aktivitas Terbaru */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-4 border-b border-gray-100">
                <h2 className="text-xl font-semibold">Aktivitas Terbaru</h2>
              </div>

              {/* AI Insights Button */}
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-800 flex items-center">
                      <RiBrainLine className="mr-2 text-blue-600" />
                      AI Insights & Rekomendasi
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Dapatkan analisis mendalam dan rekomendasi berbasis AI untuk mendukung pembelajaran {selectedChild?.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowInsights(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center shadow-lg"
                  >
                    <RiBrainLine className="mr-2" />
                    Lihat AI Insights
                  </button>
                </div>
              </div>

              <div className="p-4">
                <div className="space-y-4">
                  {/* Quick AI Summary Card - tambahkan sebelum activities loop */}
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-indigo-800 flex items-center mb-2">
                          <RiBrainLine className="mr-2" />
                          AI Quick Insights
                        </h4>
                        <div className="space-y-2">
                          {/* Quick status indicator */}
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              {activities.filter(a => a.score >= 80).length > activities.filter(a => a.score < 80).length ? (
                                <RiStarLine className="text-green-600 mr-1" />
                              ) : (
                                <RiAlarmWarningLine className="text-yellow-600 mr-1" />
                              )}
                              <span className="text-sm text-gray-700">
                                {activities.filter(a => a.score >= 80).length > activities.filter(a => a.score < 80).length
                                  ? `${selectedChild?.name} menunjukkan performa yang baik`
                                  : `${selectedChild?.name} memerlukan perhatian lebih`}
                              </span>
                            </div>
                          </div>

                          {/* Quick stats */}
                          <div className="grid grid-cols-3 gap-4 mt-3">
                            <div className="text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {activities.filter(a => a.status === 'graded').length}
                              </div>
                              <div className="text-xs text-gray-600">Tugas Dinilai</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-green-600">
                                {activities.filter(a => a.score >= 75).length}
                              </div>
                              <div className="text-xs text-gray-600">Nilai Baik</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-yellow-600">
                                {activities.filter(a => a.status === 'submitted').length}
                              </div>
                              <div className="text-xs text-gray-600">Menunggu</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowInsights(true)}
                        className="bg-indigo-100 text-indigo-700 px-3 py-2 rounded-lg hover:bg-indigo-200 transition-colors text-sm font-medium"
                      >
                        Detail
                      </button>
                    </div>
                  </div>

                  {activities.map(activity => (
                    <div key={activity.id} className="flex py-3 border-b border-gray-100 last:border-0">
                      <div className="bg-blue-100 p-2 rounded-full h-10 w-10 flex items-center justify-center mr-3">
                        {activity.type === 'assignment_graded' && <RiCheckboxCircleLine className="text-green-600" />}
                        {activity.type === 'assignment_submitted' && <RiFileChartLine className="text-blue-600" />}
                        {activity.type === 'course_progress' && <RiBarChartGroupedLine className="text-blue-600" />}
                        {activity.type === 'quiz_complete' && <RiMedalLine className="text-purple-600" />}
                        {activity.type === 'course_started' && <RiBookOpenLine className="text-yellow-600" />}
                        {activity.type === 'course_complete' && <RiCheckboxCircleLine className="text-green-600" />}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{activity.course}</h3>
                        <p className="text-sm text-gray-700">{activity.description}</p>

                        {/* Tampilkan nilai jika ada */}
                        {activity.score !== null && activity.score !== undefined && (
                          <div className="mt-1">
                            <span className={`text-sm font-medium ${activity.score >= 80 ? 'text-green-600' :
                              activity.score >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                              Nilai: {activity.score}/100
                            </span>
                          </div>
                        )}

                        {/* Tampilkan feedback jika ada */}
                        {activity.feedback && (
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Feedback: "{activity.feedback}"
                          </p>
                        )}

                        {/* Tampilkan status jika belum dinilai */}
                        {activity.status === 'submitted' && (
                          <span className="inline-block mt-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Menunggu Penilaian
                          </span>
                        )}

                        <p className="text-xs text-gray-500 mt-1">{activity.date}</p>
                      </div>
                    </div>
                  ))}

                  {activities.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">Belum ada aktivitas tugas</p>
                      <button
                        onClick={() => setShowInsights(true)}
                        className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Lihat AI Insights untuk rekomendasi
                      </button>
                    </div>
                  )}
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

      {/* AI Insights Panel */}
      {showInsights && selectedChild && (
        <ParentInsightsPanel
          childId={selectedChild.id}
          onClose={() => setShowInsights(false)}
        />
      )}
    </div>
  );
};

export default PemantauanAnakPage;