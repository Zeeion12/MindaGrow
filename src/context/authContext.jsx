import React, { createContext, useState, useEffect, useContext } from 'react';

// Buat konteks autentikasi
const AuthContext = createContext();

// Provider untuk autentikasi
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cek apakah user sudah login ketika aplikasi dimuat
    const checkUserStatus = () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (token && user) {
          setCurrentUser(user);
        } else {
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
      // Simulasi API call untuk login
      // Ganti dengan implementasi API sesungguhnya
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          // Simulasi data user, sesuaikan dengan kebutuhan proyek
          resolve({
            success: true,
            data: {
              id: '123',
              name: 'User Test',
              email: email,
              role: 'siswa',
              // Default avatar placeholder
              profileImage: null
            },
            token: 'sample-token-xyz'
          });
        }, 1000);
      });

      if (response.success) {
        const { data, token } = response;
        // Simpan data user dan token ke localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(data));
        
        // Update state
        setCurrentUser(data);
        return { success: true };
      } else {
        return { success: false, message: 'Login gagal' };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Terjadi kesalahan saat login' };
    }
  };

  // Fungsi register
  const register = async (userData, role) => {
    try {
      // Simulasi API call untuk registrasi
      // Ganti dengan implementasi API sesungguhnya
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 1000);
      });

      if (response.success) {
        return { success: true };
      } else {
        return { success: false, message: 'Registrasi gagal' };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Terjadi kesalahan saat registrasi' };
    }
  };

  // Fungsi update profil
  const updateProfile = async (userData) => {
    try {
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
    }
  };

  // Fungsi update foto profil
  const updateProfileImage = async (imageUrl) => {
    try {
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
    }
  };

  // Fungsi logout
  const logout = () => {
    // Hapus token dan data user dari localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Reset state user
    setCurrentUser(null);
    
    console.log('User logged out successfully');
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
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook untuk menggunakan konteks autentikasi
export const useAuth = () => {
  return useContext(AuthContext);
};

export default AuthContext;