import { Navigate, Route, Routes, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import komponen halaman
import MainPage from '../pages/MainPage';
import Login from '../components/auth/login';
import RoleSelection from '../components/auth/RoleSelection';
import RegisterSiswa from '../components/auth/RegisterSiswa';
import RegisterOrangtua from '../components/auth/RegisterOrangtua';
import RegisterGuru from '../components/auth/RegisterGuru';
import StudentDashboard from '../components/dashboard/Student/StudentDashboard';
import ParentDashboard from '../components/dashboard/Parent/ParentDashboard';
import TeacherDashboard from '../components/dashboard/Teacher/TeacherDashboard';
import Loading from '../components/common/Loading';

// ProtectedRoute component for routes that require authentication
const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
    return <Loading />;
  }
  
  if (!currentUser) {
    console.log('User not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles.length === 0 || allowedRoles.includes(currentUser.role)) {
    return <Outlet />;
  }
  
  const roleRouteMap = {
    'siswa': '/dashboard/student',
    'orangtua': '/dashboard/parent',
    'guru': '/dashboard/teacher'
  };
  
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
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRouter;