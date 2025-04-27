import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Import komponen...

const AppRouter = () => {
  const { currentUser, logout } = useAuth();
  
  const isLoggedIn = !!currentUser;

  return (
    <Routes>
      {/* Rute publik */}
      <Route path="/" element={<MainPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/register/siswa" element={<RegisterSiswa />} />
      <Route path="/register/orangtua" element={<RegisterOrangtua />} />
      <Route path="/register/guru" element={<RegisterGuru />} />
      
      {/* Rute yang memerlukan autentikasi */}
      <Route path="/dashboard" element={
        isLoggedIn ? <StudentDashboard onLogout={logout} /> : <Navigate to="/login" />
      } />
      <Route path="/dashboard/student" element={
        isLoggedIn && currentUser.role === 'siswa' ? <StudentDashboard onLogout={logout} /> : <Navigate to="/login" />
      } />
      <Route path="/dashboard/parent" element={
        isLoggedIn && currentUser.role === 'orangtua' ? <ParentDashboard onLogout={logout} /> : <Navigate to="/login" />
      } />
      <Route path="/dashboard/teacher" element={
        isLoggedIn && currentUser.role === 'guru' ? <TeacherDashboard onLogout={logout} /> : <Navigate to="/login" />
      } />
      
      {/* Rute lainnya... */}
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRouter;