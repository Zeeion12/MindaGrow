import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
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
        setLoading(true);
        const token = localStorage.getItem("token");

        // Fetch data assignments dari API yang sesungguhnya
        const assignmentsResponse = await axios.get('http://localhost:5000/api/teacher/assignments', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (assignmentsResponse.data.success) {
          const assignments = assignmentsResponse.data.assignments;

          // Filter assignments yang memiliki submissions belum dinilai
          const pendingAssignmentsData = assignments.filter(assignment => {
            const totalSubmissions = assignment.total_submissions || 0;
            // Anggap ada submission yang belum dinilai jika total_submissions > 0
            return totalSubmissions > 0;
          }).map(assignment => ({
            id: assignment.id,
            title: assignment.title,
            course: assignment.class_name,
            pending_reviews: assignment.total_submissions || 0, // Untuk sementara, anggap semua submission belum dinilai
            due_date: assignment.due_date ? new Date(assignment.due_date).toLocaleDateString("id-ID") : 'Tidak ada deadline'
          }));

          setPendingAssignments(pendingAssignmentsData);

          // Update dashboard stats
          setDashboardStats(prev => ({
            ...prev,
            totalClasses: assignments.length,
            pendingGrades: pendingAssignmentsData.reduce((sum, a) => sum + a.pending_reviews, 0)
          }));

          // Set courses berdasarkan assignments yang ada
          const coursesData = assignments.map((assignment, index) => ({
            id: assignment.id,
            title: `${assignment.class_name} - ${assignment.title}`,
            students_count: assignment.total_submissions || 0,
            progress_avg: Math.floor(Math.random() * 30) + 70, // Random untuk demo
            image: `https://via.placeholder.com/150?text=${encodeURIComponent(assignment.class_name)}`
          }));

          setCourses(coursesData);
        }

        // Data siswa dummy (bisa diganti dengan API call sesungguhnya nanti)
        setStudents([
          { id: 1, name: 'Muhamad Dimas', class: '5A', last_active: '2 jam lalu', progress: 85 },
          { id: 2, name: 'Tio Ananda', class: '5A', last_active: '1 jam lalu', progress: 72 },
          { id: 3, name: 'Anisa Putri', class: '5A', last_active: '30 menit lalu', progress: 90 },
          { id: 4, name: 'Budi Santoso', class: '5A', last_active: '5 jam lalu', progress: 65 },
          { id: 5, name: 'Dian Sastro', class: '5A', last_active: '1 hari lalu', progress: 78 }
        ]);

        // Data pesan dummy (bisa diganti dengan API call sesungguhnya nanti)
        setRecentMessages([
          { id: 1, from: 'Ibu Anisa Putri', subject: 'Jadwal Konsultasi', excerpt: 'Selamat siang Bu Senia, saya ingin berkonsultasi...', time: '10:30', unread: true },
          { id: 2, from: 'Ayah Budi Santoso', subject: 'Laporan Kemajuan', excerpt: 'Terima kasih atas laporan perkembangan Budi...', time: '08:45', unread: false },
          { id: 3, from: 'Ibu Tio Ananda', subject: 'Pertanyaan PR', excerpt: 'Bu guru, Tio kesulitan mengerjakan PR matematika...', time: 'Kemarin', unread: true }
        ]);

        // Update stats untuk siswa dan pesan
        setDashboardStats(prev => ({
          ...prev,
          totalStudents: 5, // Hardcoded untuk demo
          unreadMessages: 2 // Hardcoded untuk demo
        }));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);

        // Fallback ke data dummy jika API gagal
        setCourses([
          { id: 1, title: 'Matematika - Aljabar', students_count: 32, progress_avg: 78, image: 'https://via.placeholder.com/150?text=Matematika' },
          { id: 2, title: 'Biologi - Reproduksi Manusia', students_count: 28, progress_avg: 65, image: 'https://via.placeholder.com/150?text=Biologi' }
        ]);

        setPendingAssignments([
          { id: 1, title: 'Tidak ada data', course: 'Error loading', pending_reviews: 0, due_date: 'N/A' }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);



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
            <Link to="/buat-kursus" className="text-blue-500 hover:text-blue-700 font-medium">
              + Buat Kursus Baru
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map(course => (
              <Link to={`/kelas-diajar/${course.id}`} key={course.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 mb-1">{course.title}</h3>
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{course.students_count} siswa</span>
                    <span>Rata-rata: {course.progress_avg}%</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
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