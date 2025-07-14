import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../layout/layoutParts/Header';
import axios from 'axios';


const DashboardGuru = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [pendingAssignments, setPendingAssignments] = useState([]);
  const [recentMessages, setRecentMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // TAMBAHKAN STATE BARU INI:
  const [dashboardStats, setDashboardStats] = useState({
    totalClasses: 0,
    totalStudents: 0,
    pendingGrades: 0,
    unreadMessages: 0
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem("token")

        // TAMBAH - Fetch kelas yang diajar guru
        const classesResponse = await axios.get('http://localhost:5000/api/teacher/classes', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (classesResponse.data.classes) {
          const realClasses = classesResponse.data.classes.map(cls => ({
            id: cls.id,
            title: cls.name, // Gunakan nama kelas yang sebenarnya
            students_count: cls.total_students || 0,
            status: cls.status || 'active',
            grade: cls.grade,
            schedule: cls.schedule,
            description: cls.description
          }))

          setCourses(realClasses)

          // Update dashboard stats dengan data real kelas
          setDashboardStats(prev => ({
            ...prev,
            totalClasses: realClasses.length,
            totalStudents: realClasses.reduce((sum, cls) => sum + (cls.total_students || 0), 0)
          }))
        }

        // Fetch assignments untuk pending grades
        const assignmentsResponse = await axios.get('http://localhost:5000/api/teacher/assignments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (assignmentsResponse.data.success) {
          const assignments = assignmentsResponse.data.assignments

          // Fetch detail submissions untuk setiap assignment
          const pendingAssignmentsData = await Promise.all(
            assignments.map(async (assignment) => {
              try {
                const submissionResponse = await axios.get(
                  `http://localhost:5000/api/assignments/${assignment.id}/grading`,
                  {
                    headers: {
                      'Authorization': `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    }
                  }
                )

                if (submissionResponse.data.success) {
                  const stats = submissionResponse.data.stats
                  const pendingCount = parseInt(stats.pending_grading) || 0

                  if (pendingCount > 0) {
                    return {
                      id: assignment.id,
                      title: assignment.title,
                      course: assignment.class_name,
                      pending_reviews: pendingCount,
                      due_date: assignment.due_date ? new Date(assignment.due_date).toLocaleDateString("id-ID") : 'Tidak ada deadline'
                    }
                  }
                }
                return null
              } catch (error) {
                console.error(`Error fetching submission stats for assignment ${assignment.id}:`, error)
                return null
              }
            })
          )

          const validPendingAssignments = pendingAssignmentsData.filter(assignment => assignment !== null)
          setPendingAssignments(validPendingAssignments)

          const totalPendingGrades = validPendingAssignments.reduce((sum, a) => sum + a.pending_reviews, 0)
          setDashboardStats(prev => ({
            ...prev,
            pendingGrades: totalPendingGrades
          }))
        }

        // Data siswa dan pesan tetap sama (dummy data)
        setStudents([
          { id: 1, name: 'Muhamad Dimas', class: '5A', last_active: '2 jam lalu', progress: 85 },
          { id: 2, name: 'Tio Ananda', class: '5A', last_active: '1 jam lalu', progress: 72 },
          { id: 3, name: 'Anisa Putri', class: '5A', last_active: '30 menit lalu', progress: 90 },
          { id: 4, name: 'Budi Santoso', class: '5A', last_active: '5 jam lalu', progress: 65 },
          { id: 5, name: 'Dian Sastro', class: '5A', last_active: '1 hari lalu', progress: 78 }
        ])

        setRecentMessages([
          { id: 1, from: 'Ibu Anisa Putri', subject: 'Jadwal Konsultasi', excerpt: 'Selamat siang Bu Senia, saya ingin berkonsultasi...', time: '10:30', unread: true },
          {
            id: 2, from: 'Ayah Budi Santoso', subject: 'Laporan Kemajuan', excerpt: 'Terima kasih atas laporan perkembangan Budi...', time: '08: 45', unread: false
          },
          { id: 3, from: 'Ibu Tio Ananda', subject: 'Pertanyaan PR', excerpt: 'Bu guru, Tio kesulitan mengerjakan PR matematika...', time: 'Kemarin', unread: true }
        ])

        setDashboardStats(prev => ({
          ...prev,
          unreadMessages: 2
        }))

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Fallback ke data dummy jika API gagal
        setCourses([
          { id: 1, title: 'Bahasa Indonesia', students_count: 4, status: 'active', grade: 'Kelas E', description: 'Kelas Bahasa Indonesia untuk semester Ganjil 2024' },
          { id: 2, title: 'Matematika', students_count: 2, status: 'active', grade: 'Kelas E', description: 'Kelas Matematika untuk semester Ganjil 2024' },
          { id: 3, title: 'IPA', students_count: 1, status: 'active', grade: 'Kelas E', description: 'Kelas IPA untuk semester Ganjil 2024' }
        ]);

        setPendingAssignments([
          { id: 1, title: 'Tidak ada data', course: 'Error loading', pending_reviews: 0, due_date: 'N/A' }
        ]);
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData();
  }, []);

  //Auto refresh setiap 30 detik untuk real-time update
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchDashboardData()
      }
    }, 30000) // 30 detik

    return () => clearInterval(interval)
  }, [loading])

  //Setelah useEffect pertama
  useEffect(() => {
    const handleRefreshDashboard = () => {
      fetchDashboardData()
    }

    window.addEventListener('refreshDashboard', handleRefreshDashboard)

    return () => {
      window.removeEventListener('refreshDashboard', handleRefreshDashboard)
    }
  }, [])


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="container mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Selamat datang, {user?.nama_lengkap || 'Senia'}!</h1>
          <p className="text-gray-600">Pantau perkembangan kelas dan siswa Anda di dashboard ini.</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full mr-4">
                <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Kelas</p>
                <h3 className="text-2xl font-bold text-gray-800">{dashboardStats.totalClasses}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full mr-4">
                <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Total Siswa</p>
                <h3 className="text-2xl font-bold text-gray-800">{dashboardStats.totalStudents}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full mr-4">
                <svg className="h-6 w-6 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Tugas Belum Dinilai</p>
                <h3 className="text-2xl font-bold text-gray-800">{dashboardStats.pendingGrades}</h3>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full mr-4">
                <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">Pesan Baru</p>
                <h3 className="text-2xl font-bold text-gray-800">{dashboardStats.unreadMessages}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Kelas yang Anda Ajar</h2>
            <Link to="/kelas-yang-diajar" className="text-blue-500 hover:text-blue-700 font-medium">
              Lihat Semua Kelas
            </Link>
          </div>

          {courses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
              <div className="bg-gray-100 p-3 rounded-full w-12 h-12 mx-auto mb-4">
                <svg className="w-6 h-6 text-gray-400 mx-auto mt-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">Belum Ada Kelas</h3>
              <p className="text-gray-500 mb-4">Mulai dengan membuat kelas pertama Anda</p>
              <Link
                to="/kelas-yang-diajar"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Buat Kelas
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {courses.slice(0, 4).map(course => {
                // Menentukan icon dan warna berdasarkan mata pelajaran
                const getSubjectIcon = (title) => {
                  const lowerTitle = title.toLowerCase();
                  if (lowerTitle.includes('matematika')) return '🔢';
                  if (lowerTitle.includes('indonesia')) return '📚';
                  if (lowerTitle.includes('inggris')) return '🌍';
                  if (lowerTitle.includes('ipa') || lowerTitle.includes('biologi') || lowerTitle.includes('fisika') || lowerTitle.includes('kimia')) return '🧪';
                  if (lowerTitle.includes('ips') || lowerTitle.includes('sejarah') || lowerTitle.includes('geografi')) return '🌏';
                  if (lowerTitle.includes('seni')) return '🎨';
                  if (lowerTitle.includes('olahraga') || lowerTitle.includes('pjok')) return '⚽';
                  if (lowerTitle.includes('agama')) return '🕌';
                  return '📖';
                };

                const getSubjectColor = (title) => {
                  const lowerTitle = title.toLowerCase();
                  if (lowerTitle.includes('matematika')) return 'bg-gradient-to-br from-blue-400 to-blue-600';
                  if (lowerTitle.includes('indonesia')) return 'bg-gradient-to-br from-red-400 to-red-600';
                  if (lowerTitle.includes('inggris')) return 'bg-gradient-to-br from-green-400 to-green-600';
                  if (lowerTitle.includes('ipa') || lowerTitle.includes('biologi') || lowerTitle.includes('fisika') || lowerTitle.includes('kimia')) return 'bg-gradient-to-br from-emerald-400 to-emerald-600';
                  if (lowerTitle.includes('ips') || lowerTitle.includes('sejarah') || lowerTitle.includes('geografi')) return 'bg-gradient-to-br from-yellow-400 to-yellow-600';
                  if (lowerTitle.includes('seni')) return 'bg-gradient-to-br from-purple-400 to-purple-600';
                  if (lowerTitle.includes('olahraga') || lowerTitle.includes('pjok')) return 'bg-gradient-to-br from-orange-400 to-orange-600';
                  if (lowerTitle.includes('agama')) return 'bg-gradient-to-br from-teal-400 to-teal-600';
                  return 'bg-gradient-to-br from-gray-400 to-gray-600';
                };

                return (
                  <Link
                    to={`/kelas-yang-diajar`}
                    key={course.id}
                    className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105 border border-gray-100 group"
                  >
                    {/* Header dengan icon */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`${getSubjectColor(course.title)} p-3 rounded-xl shadow-md`}>
                          <span className="text-xl">{getSubjectIcon(course.title)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">
                            {course.title}
                          </h3>
                        </div>
                      </div>

                      {/* Stats - Hanya jumlah siswa */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                          <span>{course.students_count} siswa</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer dengan status */}
                    <div className="px-6 pb-4">
                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5"></span>
                          Aktif
                        </span>
                        <div className="flex items-center text-xs text-gray-500">
                          <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                          Kelola
                        </div>
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 to-purple-400/0 group-hover:from-blue-400/5 group-hover:to-purple-400/5 transition-all duration-300 rounded-2xl pointer-events-none"></div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Students Activity */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Aktivitas Siswa Terbaru</h2>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Siswa</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kelas</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terakhir Aktif</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progres</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map(student => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-800 font-medium">{student.name.charAt(0)}</span>
                            </div>
                            <div className="ml-3">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.class}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.last_active}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-sm text-gray-900 mr-2">{student.progress}%</span>
                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full ${student.progress >= 80 ? 'bg-green-500' : student.progress >= 60 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                                style={{ width: `${student.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 text-right">
                <Link to="/kelas-diajar/students" className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                  Lihat semua siswa →
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            {/* Assignments to Review */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Tugas Perlu Dinilai</h2>

              <div className="space-y-4">
                {pendingAssignments.length > 0 ? (
                  pendingAssignments.slice(0, 3).map(assignment => (
                    <div key={assignment.id} className="border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                      <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-500 mb-1">{assignment.course}</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-red-500">{assignment.pending_reviews} belum dinilai</span>
                        <span className="text-gray-500">Deadline: {assignment.due_date}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Tidak ada tugas yang perlu dinilai</p>
                  </div>
                )}
              </div>

              <div className="mt-4 text-right">
                <Link to="/penilaian-tugas" className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                  Lihat semua tugas →
                </Link>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Pesan Terbaru</h2>

              <div className="space-y-4">
                {recentMessages.map(message => (
                  <div key={message.id} className={`border-b border-gray-100 pb-3 last:border-b-0 last:pb-0 ${message.unread ? 'bg-blue-50 -mx-4 px-4' : ''}`}>
                    <div className="flex justify-between mb-1">
                      <h3 className="font-medium text-gray-900">{message.from}</h3>
                      <span className="text-xs text-gray-500">{message.time}</span>
                    </div>
                    <p className="text-sm font-medium text-gray-800 mb-1">{message.subject}</p>
                    <p className="text-sm text-gray-500 truncate">{message.excerpt}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 text-right">
                <Link to="/chat-guru" className="text-blue-500 hover:text-blue-700 text-sm font-medium">
                  Lihat semua pesan →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardGuru;