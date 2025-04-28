import { Navigate, Route, Routes, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import komponen halaman
import MainPage from '../pages/MainPage';
import Login from '../pages/auth/login';
import RoleSelection from '../pages/auth/RoleSelection';
import RegisterSiswa from '../pages/auth/RegisterSiswa';
import RegisterOrangtua from '../pages/auth/RegisterOrangtua';
import RegisterGuru from '../pages/auth/RegisterGuru';
import StudentDashboard from '../pages/dashboard/StudentDashboard';
import ParentDashboard from '../pages/dashboard/ParentDashboard';
import TeacherDashboard from '../pages/dashboard/TeacherDashboard';
import NotFound from '../pages/NotFound';

// Komponen ProtectedRoute untuk menangani rute yang memerlukan autentikasi
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { currentUser, loading } = useAuth();
  
  // Tambahkan log untuk debugging
  console.log('ProtectedRoute check - currentUser:', currentUser);
  console.log('ProtectedRoute check - allowedRoles:', allowedRoles);
  
  // Tampilkan loading spinner saat memeriksa status autentikasi
  if (loading) {
    return <Loading />;
  }
  
  // Jika tidak login, redirect ke halaman login
  if (!currentUser) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Jika allowedRoles kosong atau role user termasuk dalam allowedRoles
  if (allowedRoles.length === 0 || allowedRoles.includes(currentUser.role)) {
    console.log('User has permission, rendering outlet');
    return <Outlet />;
  }
  
  // Jika user login tapi tidak memiliki akses ke rute ini,
  // redirect ke dashboard sesuai role-nya
  const roleRouteMap = {
    'siswa': '/dashboard/student',
    'orangtua': '/dashboard/parent',
    'guru': '/dashboard/teacher'
  };
  
  console.log('User authenticated but lacks permission, redirecting to correct dashboard');
  return <Navigate to={roleRouteMap[currentUser.role] || '/dashboard'} replace />;
};

const AppRouter = () => {
  const { logout } = useAuth();
  
  return (
    <Routes>
      {/* Rute publik */}
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/register/siswa" element={<RegisterSiswa />} />
      <Route path="/register/orangtua" element={<RegisterOrangtua />} />
      <Route path="/register/guru" element={<RegisterGuru />} />
      
      {/* Rute yang memerlukan autentikasi (menggunakan ProtectedRoute) */}
      <Route element={<ProtectedRoute allowedRoles={[]} />}>
        <Route path="/dashboard" element={<Navigate to="/dashboard/student" replace />} />
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={['siswa']} />}>
        <Route path="/dashboard/student" element={<StudentDashboard onLogout={logout} />} />
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={['orangtua']} />}>
        <Route path="/dashboard/parent" element={<ParentDashboard onLogout={logout} />} />
      </Route>
      
      <Route element={<ProtectedRoute allowedRoles={['guru']} />}>
        <Route path="/dashboard/teacher" element={<TeacherDashboard onLogout={logout} />} />
      </Route>
      
      {/* Rute tambahan untuk dashboard jika diperlukan */}
      {/* <Route element={<ProtectedRoute allowedRoles={['siswa']} />}>
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/courses" element={<StudentCourses />} />
      </Route> */}
      
      {/* Halaman 404 */}
      <Route path="/404" element={<NotFound />} />
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
  );
};

export default AppRouter;