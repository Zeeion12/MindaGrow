import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RoleSelection from './components/auth/RoleSelection';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import DashboardSiswa from './components/dashboard/DashboardSiswa';
import DashboardLayout from './components/layout/DashboardLayout';

//Import Khusus 2FA
import TwoFactorSetup from './components/auth/TwoFactorSetup';
import TwoFactorVerify from './components/auth/TwoFactorVerify';

// Import komponen kursus
import CourseList from './pages/courses/CourseList';
import CourseDetail from './pages/courses/CourseDetail';
import CourseLearn from './pages/courses/CourseLearn';

// Import komponen Kelas
import ClassMainUI from './pages/kelas/ClassMainUI';
import ClassDetailUI from './pages/kelas/ClassDetailUI';

// Import komponen game
import GameMainUI from './pages/games/GameMainUI';
import GameContainer from './pages/games/GameContainer';

// Import komponen notifikasi siswa
import NotifikasiSiswa from './pages/setting/NotifikasiSiswa';

// Import Guru
import DashboardGuru from './components/dashboard/DashboardGuru';
import BuatKursusPage from './pages/Guru/BuatKursus';
import ManajemenKelas from './pages/Guru/ManajemenKelas';
import KelasYangDiajar from './pages/Guru/KelasYangDiajar';
import NotifikasiGuru from './pages/Guru/NotifikasiGuru';
import ChatOrtuPage from './pages/Guru/ChatOrtu';

// Import OrangTua
import DashboardOrangtua from './components/dashboard/DashboardOrangtua';
import PemantauanAnakPage from './pages/Orangtua/PemantauanAnak';
import ChatGuruPage from './pages/Orangtua/ChatGuru';
import LaporanPerkembanganPage from './pages/Orangtua/LaporanPerkembangan';
import NotifikasiOrtu from './pages/Orangtua/NotifikasiOrtu';

// import Admin
import AdminDashboard from './components/dashboard/DashboardAdmin';

import ProfileSettings from './pages/setting/ProfileSettings';
import UpdatePremium from './pages/setting/UpdatePremium';
import Chatbot from './service/chatbot/Chatbot'
import { AuthProvider, useAuth } from './context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/register/:role" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/2fa-setup" element={<TwoFactorSetup />} />
        <Route path="/2fa-verify" element={<TwoFactorVerify />} />

        <Route path="/" element={<DashboardLayout />}>

          {/*Route khusus dashboard admin*/}
          <Route path="/dashboard/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/*Route khusus dashboard siswa*/}
          <Route path="/dashboard/siswa" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <DashboardSiswa />
            </ProtectedRoute>
          } />

          {/*Route khusus kursus*/}
          <Route path="/kursus" element={
            <ProtectedRoute allowedRoles={['siswa', 'guru', 'orangtua']}>
              <CourseList />
            </ProtectedRoute>
          } />
          <Route path="/kursus/:courseId" element={
            <ProtectedRoute allowedRoles={['siswa', 'guru', 'orangtua']}>
              <CourseDetail />
            </ProtectedRoute>
          } />
          <Route path="/kursus/:courseId/learn" element={
            <ProtectedRoute allowedRoles={['siswa', 'orangtua']}>
              <CourseLearn />
            </ProtectedRoute>
          } />
          <Route path="/kursus/:courseId/learn/:lessonId" element={
            <ProtectedRoute allowedRoles={['siswa', 'orangtua']}>
              <CourseLearn />
            </ProtectedRoute>
          } />

          {/*Route khusus Kelas*/}
          <Route path="/kelas" element={
            <ProtectedRoute allowedRoles={['siswa', 'orangtua']}>
              <ClassMainUI />
            </ProtectedRoute>
          } />
          <Route path="/kelas/:id" element={
            <ProtectedRoute allowedRoles={['siswa', 'orangtua', 'guru']}>
              <ClassDetailUI />
            </ProtectedRoute>
          } />

          {/* Route khusus game */}
          <Route path="/game" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <GameMainUI />
            </ProtectedRoute>
          } />

          <Route path="/game/:gameId" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <GameContainer />
            </ProtectedRoute>
          } />

          {/*Route khusus Noitf Siswa*/}
          <Route path="/notifikasi" element={
            <ProtectedRoute allowedRoles={['siswa']}>
              <NotifikasiSiswa />
            </ProtectedRoute>
          } />

          {/*Route khusus Guru*/}
          <Route path="/dashboard/guru" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <DashboardGuru />
            </ProtectedRoute>
          } />
          <Route path="/buat-kursus" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <BuatKursusPage />
            </ProtectedRoute>
          } />
          <Route path="/manajemen-kelas" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <ManajemenKelas />
            </ProtectedRoute>
          } />
          <Route path="/kelas-yang-diajar" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <KelasYangDiajar />
            </ProtectedRoute>
          } />
          <Route path="/notifikasi-guru" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <NotifikasiGuru />
            </ProtectedRoute>
          } />
          <Route path="/chat-ortu" element={
            <ProtectedRoute allowedRoles={['guru']}>
              <ChatOrtuPage />
            </ProtectedRoute>
          } />

          {/*Route khusus Orangtua*/}
          <Route path="/dashboard/orangtua" element={
            <ProtectedRoute allowedRoles={['orangtua']}>
              <DashboardOrangtua />
            </ProtectedRoute>
          } />
          <Route path="/pemantauan-anak" element={
            <ProtectedRoute allowedRoles={['orangtua']}>
              <PemantauanAnakPage />
            </ProtectedRoute>
          } />
          <Route path="/chat-guru" element={
            <ProtectedRoute allowedRoles={['orangtua']}>
              <ChatGuruPage />
            </ProtectedRoute>
          } />
          <Route path="/laporan-anak" element={
            <ProtectedRoute allowedRoles={['orangtua']}>
              <LaporanPerkembanganPage />
            </ProtectedRoute>
          } />
          <Route path="/notifikasi-ortu" element={
            <ProtectedRoute allowedRoles={['orangtua']}>
              <NotifikasiOrtu />
            </ProtectedRoute>
          } />

          {/*Route khusus pengaturan*/}
          <Route path="/pengaturan" element={<ProfileSettings />} />
          <Route path="/pengaturan/premium" element={<UpdatePremium />} />
          <Route path="/chatbot" element={<Chatbot />} />

        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;