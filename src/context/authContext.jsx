import React, { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';

// Buat konteks autentikasi
const AuthContext = createContext();

// Provider untuk autentikasi
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Cek apakah user sudah login ketika aplikasi dimuat
    const checkUserStatus = () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (token && user) {
          console.log("User sudah login:", user);
          setCurrentUser(user);
        } else {
          console.log("User belum login");
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error checking authentication status:', error);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkUserStatus();
  }, []);

  // Fungsi login
  const login = async (email, password) => {
    try {
      console.log("Mencoba login dengan email:", email);
      setLoading(true);
      
      // Simulasi API call untuk login
      // Ganti dengan implementasi API sesungguhnya
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          // Simulasi data user, sesuaikan dengan kebutuhan proyek
          // Untuk tujuan demo, kita anggap login selalu berhasil
          resolve({
            success: true,
            data: {
              id: '123',
              name: "User Test",
              email: email,
              role: 'siswa',
              // Default avatar placeholder
              profileImage: null
            },
            token: 'sample-token-xyz'
          });
        }, 1000);
      });

      console.log("Hasil login:", response);

      if (response.success) {
        const { data, token } = response;
        
        // Simpan data user dan token ke localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data));
        
        // Update state
        setCurrentUser(data);
        console.log("Login berhasil, navigasi ke dashboard");
        
        // Navigasi ke dashboard
        navigate('/dashboard');
        
        return { success: true };
      } else {
        console.error("Login gagal:", response);
        return { success: false, message: 'Login gagal' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Terjadi kesalahan saat login' };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi register
  const register = async (userData, role) => {
    try {
      setLoading(true);
      console.log("Mencoba register dengan data:", userData, "role:", role);
      
      // Simulasi API call untuk registrasi
      // Ganti dengan implementasi API sesungguhnya
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });

      console.log("Hasil register:", response);

      if (response.success) {
        // Redirect ke login setelah registrasi berhasil
        navigate('/login', { 
          state: { message: 'Registrasi berhasil! Silakan login dengan akun Anda.' } 
        });
        
        return { success: true };
      } else {
        console.error("Registrasi gagal:", response);
        return { success: false, message: 'Registrasi gagal' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Terjadi kesalahan saat registrasi' };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi update profil
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      console.log("Mencoba update profil dengan data:", userData);
      
      // Simulasi API call untuk update profil
      // Ganti dengan implementasi API sesungguhnya
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });

      if (response.success) {
        // Update user data di localStorage
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update state
        setCurrentUser(updatedUser);
        return { success: true };
      } else {
        return { success: false, message: 'Update profil gagal' };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, message: 'Terjadi kesalahan saat update profil' };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi update foto profil
  const updateProfileImage = async (imageUrl) => {
    try {
      setLoading(true);
      console.log("Mencoba update foto profil:", imageUrl);
      
      // Simulasi API call untuk update foto profil
      // Ganti dengan implementasi API sesungguhnya
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });

      if (response.success) {
        // Update user data di localStorage
        const updatedUser = { ...currentUser, profileImage: imageUrl };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Update state
        setCurrentUser(updatedUser);
        return { success: true };
      } else {
        return { success: false, message: 'Update foto profil gagal' };
      }
    } catch (error) {
      console.error('Update profile image error:', error);
      return { success: false, message: 'Terjadi kesalahan saat update foto profil' };
    } finally {
      setLoading(false);
    }
  };

  // Fungsi logout
  const logout = () => {
    console.log("Logout dimulai");
    
    // Hapus token dan data user dari localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset state user
    setCurrentUser(null);
    
    console.log("Logout selesai, navigasi ke login");
    
    // Navigasi ke halaman login
    navigate('/login');
    
    return { success: true };
  };

  // Nilai yang akan disediakan ke komponen lain
  const value = {
    currentUser,
    login,
    register,
    updateProfile,
    updateProfileImage,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
    </AuthContext.Provider>
  );
};

// Custom hook untuk menggunakan konteks autentikasi
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;