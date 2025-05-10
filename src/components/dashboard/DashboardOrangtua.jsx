import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../layout/layoutParts/Header';
import { 
  RiUserHeartLine, 
  RiMessage3Line, 
  RiParentLine,
  RiCheckboxCircleLine, 
  RiTimeLine,
  RiArrowRightSLine,
  RiLineChartLine,
  RiCalendarCheckLine,
  RiBarChart2Line,
  RiMedalLine
} from 'react-icons/ri';

const DashboardOrangtua = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [childStats, setChildStats] = useState({
    completedCourses: 0,
    activeCourses: 0,
    averageScore: 0,
    lastActivity: '',
    totalMinutes: 0
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Dalam implementasi nyata, ini akan menjadi panggilan API
        // Dummy data untuk demo
        const dummyChildren = [
          { id: 1, name: 'Muhamad Dimas', class: '5A', school: 'SD Negeri 1 Surakarta', image: 'https://via.placeholder.com/50', nis: '23523252' },
          { id: 2, name: 'Aisyah Putri', class: '3B', school: 'SD Negeri 1 Surakarta', image: 'https://via.placeholder.com/50', nis: '23523253' }
        ];
        
        setChildren(dummyChildren);
        
        // Set anak pertama sebagai default
        if (dummyChildren.length > 0) {
          const firstChild = dummyChildren[0];
          setSelectedChild(firstChild);
          
          // Dummy stats untuk anak yang dipilih
          setChildStats({
            completedCourses: 5,
            activeCourses: 3,
            averageScore: 85,
            lastActivity: '2 jam lalu',
            totalMinutes: 1280
          });
          
          // Dummy data untuk aktivitas terbaru
          setRecentActivities([
            { id: 1, type: 'course_progress', course: 'Matematika - Aljabar', description: 'Menyelesaikan modul Persamaan Kuadrat', date: '2 jam lalu' },
            { id: 2, type: 'assignment_complete', course: 'Matematika - Aljabar', description: 'Mengumpulkan tugas Persamaan Kuadrat', score: 85, date: '1 hari lalu' },
            { id: 3, type: 'quiz_complete', course: 'Biologi', description: 'Menyelesaikan quiz Sistem Reproduksi', score: 78, date: '3 hari lalu' },
            { id: 4, type: 'course_started', course: 'Fisika - Hukum Newton', description: 'Memulai kursus baru', date: '3 hari lalu' },
          ]);
          
          // Dummy data untuk acara mendatang
          setUpcomingEvents([
            { id: 1, title: 'Ujian Matematika', date: 'Senin, 12 Mei 2025', course: 'Matematika - Aljabar' },
            { id: 2, title: 'Deadline Tugas Biologi', date: 'Rabu, 14 Mei 2025', course: 'Biologi - Reproduksi Manusia' },
            { id: 3, title: 'Quiz Fisika', date: 'Jumat, 16 Mei 2025', course: 'Fisika - Hukum Newton' }
          ]);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    // Dalam implementasi nyata, kita akan melakukan fetch data berdasarkan anak yang dipilih
  };

  const navigateToSection = (path) => {
    navigate(path);
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
      <Header title="Dashboard Orangtua" />
      
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
                  <img src="/api/placeholder/50/50" alt={child.name} className="w-full h-full object-cover" />
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
            {/* Statistik Anak */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
              <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
                <div className="bg-blue-100 p-3 rounded-full mb-2">
                  <RiCheckboxCircleLine size={24} className="text-blue-600" />
                </div>
                <p className="text-gray-500 text-sm">Kursus Selesai</p>
                <p className="text-2xl font-bold">{childStats.completedCourses}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
                <div className="bg-green-100 p-3 rounded-full mb-2">
                  <RiLineChartLine size={24} className="text-green-600" />
                </div>
                <p className="text-gray-500 text-sm">Kursus Aktif</p>
                <p className="text-2xl font-bold">{childStats.activeCourses}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
                <div className="bg-yellow-100 p-3 rounded-full mb-2">
                  <RiMedalLine size={24} className="text-yellow-600" />
                </div>
                <p className="text-gray-500 text-sm">Rata-rata Nilai</p>
                <p className="text-2xl font-bold">{childStats.averageScore}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
                <div className="bg-purple-100 p-3 rounded-full mb-2">
                  <RiTimeLine size={24} className="text-purple-600" />
                </div>
                <p className="text-gray-500 text-sm">Total Waktu Belajar</p>
                <p className="text-2xl font-bold">{childStats.totalMinutes} <span className="text-sm">menit</span></p>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow flex flex-col items-center">
                <div className="bg-red-100 p-3 rounded-full mb-2">
                  <RiCalendarCheckLine size={24} className="text-red-600" />
                </div>
                <p className="text-gray-500 text-sm">Aktivitas Terakhir</p>
                <p className="text-lg font-medium">{childStats.lastActivity}</p>
              </div>
            </div>
            
            {/* Menu Akses Cepat */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg shadow cursor-pointer transform transition hover:scale-105"
                onClick={() => navigateToSection('/pemantauan-anak')}
              >
                <div className="flex items-center justify-between text-white">
                  <div>
                    <RiUserHeartLine size={36} className="mb-3" />
                    <h3 className="text-xl font-semibold">Pemantauan Anak</h3>
                    <p className="text-blue-100 mt-1">Pantau kemajuan belajar {selectedChild.name}</p>
                  </div>
                  <RiArrowRightSLine size={24} />
                </div>
              </div>
              
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg shadow cursor-pointer transform transition hover:scale-105"
                onClick={() => navigateToSection('/chat-guru')}
              >
                <div className="flex items-center justify-between text-white">
                  <div>
                    <RiMessage3Line size={36} className="mb-3" />
                    <h3 className="text-xl font-semibold">Chat dengan Guru</h3>
                    <p className="text-green-100 mt-1">Diskusikan kemajuan belajar dengan guru</p>
                  </div>
                  <RiArrowRightSLine size={24} />
                </div>
              </div>
              
              <div 
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg shadow cursor-pointer transform transition hover:scale-105"
                onClick={() => navigateToSection('/laporan-anak')}
              >
                <div className="flex items-center justify-between text-white">
                  <div>
                    <RiParentLine size={36} className="mb-3" />
                    <h3 className="text-xl font-semibold">Laporan Perkembangan</h3>
                    <p className="text-yellow-100 mt-1">Lihat laporan perkembangan lengkap</p>
                  </div>
                  <RiArrowRightSLine size={24} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Aktivitas Terbaru */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h2 className="text-lg font-semibold">Aktivitas Terbaru</h2>
                  <Link to="/pemantauan-anak" className="text-blue-500 text-sm hover:underline">
                    Lihat Semua
                  </Link>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {recentActivities.map(activity => (
                      <div key={activity.id} className="flex items-start">
                        <div className="bg-blue-100 p-2 rounded-full mr-3">
                          {activity.type === 'course_progress' && <RiLineChartLine className="text-blue-600" />}
                          {activity.type === 'assignment_complete' && <RiCheckboxCircleLine className="text-green-600" />}
                          {activity.type === 'quiz_complete' && <RiBarChart2Line className="text-purple-600" />}
                          {activity.type === 'course_started' && <RiCalendarCheckLine className="text-yellow-600" />}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm">
                            <span className="font-medium">{activity.course}</span> - {activity.description}
                            {activity.score && <span className="font-medium text-green-600"> - Nilai: {activity.score}</span>}
                          </p>
                          <p className="text-xs text-gray-500">{activity.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Acara Mendatang */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-100">
                  <h2 className="text-lg font-semibold">Acara Mendatang</h2>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {upcomingEvents.map(event => (
                      <div key={event.id} className="bg-gray-50 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <h3 className="font-medium">{event.title}</h3>
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">{event.course}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{event.date}</p>
                      </div>
                    ))}
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

export default DashboardOrangtua;