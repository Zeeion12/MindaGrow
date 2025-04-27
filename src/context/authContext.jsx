import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Periksa token di localStorage
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        // Ambil data user dari localStorage sebagai fallback
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData) {
          setCurrentUser(userData);
        }
        
        // Coba fetch user profile jika backend sudah siap
        fetchUserProfile(token).catch(err => {
          console.error("Profile API not available yet:", err);
        });
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    
    setLoading(false);
  }, []);

  // Fungsi untuk mengambil profil pengguna
  const fetchUserProfile = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setCurrentUser(userData.user);
        // Update localStorage untuk konsistensi
        localStorage.setItem('user', JSON.stringify(userData.user));
      } else {
        // Token tidak valid, hapus dari localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setCurrentUser(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      // Jangan hapus data kalau server tidak merespon
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
    }
  };

  // Fungsi login
  const login = async (username, password) => {
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        // Simpan token dan user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Update current user state
        setCurrentUser(data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          message: data.message || 'Login gagal. Silakan periksa username dan password Anda.' 
        };
      }
    } catch (error) {
      console.error("Error during login:", error);
      return { 
        success: false, 
        message: 'Terjadi kesalahan saat login. Silakan coba lagi.'
      };
    }
  };

  // Fungsi logout
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // Fungsi register
  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        return { success: true, message: data.message || 'Registrasi berhasil!' };
      } else {
        return { 
          success: false, 
          message: data.message || 'Registrasi gagal. Silakan coba lagi.' 
        };
      }
    } catch (error) {
      console.error("Error during registration:", error);
      return { 
        success: false, 
        message: 'Terjadi kesalahan saat registrasi. Silakan coba lagi.'
      };
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;