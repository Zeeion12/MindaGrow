import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BiCrown } from 'react-icons/bi';
import { useAuth } from '../../../context/AuthContext';
import SideBar from '../../layout/SideBar';
import axios from 'axios';

// Card Import
import CardKursus from '../../layout/TaskCard/CardKursus';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  
  useEffect(() => {
    // Redirect ke login jika user tidak ada
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    // Pastikan user adalah siswa
    if (currentUser.role !== 'siswa') {
      navigate(`/dashboard/${currentUser.role === 'guru' ? 'teacher' : 
                             currentUser.role === 'orangtua' ? 'parent' : ''}`);
      return;
    }
    
    // Ambil data dari server
    fetchDashboardData();
  }, [currentUser, navigate]);

  // Fungsi untuk mengambil data dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get auth token
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Configure headers
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Fetch courses data
      // Uncomment ketika endpoint sudah tersedia
      /*
      const coursesResponse = await axios.get('/api/courses/student', config);
      setCourses(coursesResponse.data.courses || []);
      
      // Fetch tasks data
      const tasksResponse = await axios.get('/api/tasks/student', config);
      setTasks(tasksResponse.data.tasks || []);
      
      // Fetch announcements
      const announcementsResponse = await axios.get('/api/announcements', config);
      setAnnouncements(announcementsResponse.data.announcements || []);
      */
      
      // Placeholder data untuk sementara
      setCourses([]);
      setTasks([]);
      setAnnouncements([]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Jika tidak ada user, jangan render apapun
  if (!currentUser) {
    return null;
  }

  // Coba berbagai format nama yang mungkin ada di objek currentUser
  // Sesuaikan dengan struktur database PostgreSQL
  const userName = currentUser.nama_lengkap || currentUser.name || currentUser.username || "User";

  return (
    <div className="flex h-screen">
      <SideBar />

      {/* Main Content */}
      <main className="flex-1 bg-blue-50 overflow-y-auto">
        {/* Header */}
        <header className="bg-blue-50 p-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
          <h1 className="text-lg">
            👋 Selamat datang, {userName}! Siap belajar seru hari ini?
          </h1>
          
          {/* User Avatar */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {currentUser?.profile_image ? (
              <img 
                src={currentUser.profile_image} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-gray-500">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Kursus Aktif */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Kursus Aktif</h2>
                {courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.map(course => (
                      <CardKursus key={course.id} course={course} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Anda belum memiliki kursus aktif.</p>
                )}
              </div>
              
              {/* Tugas Terbaru */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Tugas Terbaru</h2>
                {tasks.length > 0 ? (
                  <div className="space-y-4">
                    {tasks.map(task => (
                      <div key={task.id} className="border-l-4 border-blue-500 pl-3 py-2">
                        <h3 className="font-medium">{task.title}</h3>
                        <p className="text-sm text-gray-600">Tenggat: {new Date(task.deadline).toLocaleDateString('id-ID')}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Tidak ada tugas yang menunggu.</p>
                )}
              </div>
              
              {/* Pengumuman */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">Pengumuman</h2>
                {announcements.length > 0 ? (
                  <div className="space-y-4">
                    {announcements.map(announcement => (
                      <div key={announcement.id} className="border-l-4 border-yellow-500 pl-3 py-2">
                        <h3 className="font-medium">{announcement.title}</h3>
                        <p className="text-sm text-gray-500">{new Date(announcement.created_at).toLocaleDateString('id-ID')}</p>
                        <p className="text-sm mt-1">{announcement.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">Tidak ada pengumuman terbaru.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;