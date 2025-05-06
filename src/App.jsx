import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainPage from './pages/MainPage';
import Login from './components/auth/login';
import RoleSelection from './components/auth/RoleSelection';
import RegisterSiswa from './components/auth/RegisterSiswa';
import NotFound from './pages/NotFound';
import StudentDashboard from './components/dashboard/Student/StudentDashboard';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/register/siswa" element={<RegisterSiswa/>} />

        <Route 
          path="/dashboard/student" 
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          } 
        />

        {/* More routes here */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;