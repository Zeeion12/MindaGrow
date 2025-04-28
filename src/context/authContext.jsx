import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Create Auth Context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Setup axios interceptor for handling expired tokens
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          // Token expired or invalid
          logout();
        }
        return Promise.reject(error);
      }
    );
    
    return () => {
      // Remove interceptor when component unmounts
      axios.interceptors.response.eject(interceptor);
    };
  }, []);
  
  // Check if user is authenticated on component mount
  useEffect(() => {
    checkAuthStatus();
  }, []);
  
  // Check auth status from the server
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }
      
      // Configure axios with token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Verify token with server
      const response = await axios.get('/api/auth/check-status', config);
      
      if (response.data.success) {
        setCurrentUser(response.data.user);
      } else {
        // Token invalid or expired
        localStorage.removeItem('authToken');
        setCurrentUser(null);
        setError('Sesi telah berakhir. Silakan login kembali.');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      localStorage.removeItem('authToken');
      setCurrentUser(null);
      setError('Terjadi kesalahan saat memeriksa status autentikasi.');
    } finally {
      setLoading(false);
    }
  };
  
  // Login function
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      
      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', response.data.token);
        
        // Pastikan data user lengkap dan disimpan dengan benar
        console.log('User data from server:', response.data.user);
        
        // Set current user dengan data lengkap dari server
        setCurrentUser(response.data.user);
        
        return {
          success: true,
          user: response.data.user
        };
      } else {
        setError(response.data.message || 'Login gagal');
        return {
          success: false,
          message: response.data.message || 'Login gagal'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error responses
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Login gagal');
        return {
          success: false,
          message: error.response.data.message || 'Login gagal'
        };
      }
      
      setError('Terjadi kesalahan saat login');
      return {
        success: false,
        message: 'Terjadi kesalahan saat login'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/auth/register', userData);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message
        };
      } else {
        setError(response.data.message || 'Registrasi gagal');
        return {
          success: false,
          message: response.data.message || 'Registrasi gagal'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle specific error responses
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Registrasi gagal');
        return {
          success: false,
          message: error.response.data.message || 'Registrasi gagal'
        };
      }
      
      setError('Terjadi kesalahan saat registrasi');
      return {
        success: false,
        message: 'Terjadi kesalahan saat registrasi'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
    setError(null);
  };
  
  // Update user profile
  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Tidak terotentikasi');
        return {
          success: false,
          message: 'Tidak terotentikasi'
        };
      }
      
      // Configure axios with token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Update user profile
      const response = await axios.put('/api/user/profile', userData, config);
      
      if (response.data.success) {
        setCurrentUser(response.data.user);
        return {
          success: true,
          user: response.data.user,
          message: response.data.message || 'Profil berhasil diperbarui'
        };
      } else {
        setError(response.data.message || 'Gagal memperbarui profil');
        return {
          success: false,
          message: response.data.message || 'Gagal memperbarui profil'
        };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Gagal memperbarui profil');
        return {
          success: false,
          message: error.response.data.message || 'Gagal memperbarui profil'
        };
      }
      
      setError('Terjadi kesalahan saat memperbarui profil');
      return {
        success: false,
        message: 'Terjadi kesalahan saat memperbarui profil'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Change password
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('authToken');
      
      if (!token) {
        setError('Tidak terotentikasi');
        return {
          success: false,
          message: 'Tidak terotentikasi'
        };
      }
      
      // Configure axios with token
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Change password
      const response = await axios.post('/api/user/change-password', {
        currentPassword,
        newPassword
      }, config);
      
      if (response.data.success) {
        return {
          success: true,
          message: response.data.message || 'Password berhasil diubah'
        };
      } else {
        setError(response.data.message || 'Gagal mengubah password');
        return {
          success: false,
          message: response.data.message || 'Gagal mengubah password'
        };
      }
    } catch (error) {
      console.error('Change password error:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.message || 'Gagal mengubah password');
        return {
          success: false,
          message: error.response.data.message || 'Gagal mengubah password'
        };
      }
      
      setError('Terjadi kesalahan saat mengubah password');
      return {
        success: false,
        message: 'Terjadi kesalahan saat mengubah password'
      };
    } finally {
      setLoading(false);
    }
  };
  
  // Auth context value
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    refreshUser: checkAuthStatus
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;