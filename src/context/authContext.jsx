import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        { username, password }
      );

      const user = response.data?.user;

      if (user) {
        const userType =
          user.userType ||
          (user.nis ? 'siswa' :
           user.nik ? 'orangtua' :
           user.nuptk ? 'guru' : null);

        const userWithType = { ...user, userType };

        setCurrentUser(userWithType);
        setIsLoggedIn(true);
        localStorage.setItem('user', JSON.stringify(userWithType));

        return { success: true, user: userWithType };
      } else {
        return { success: false, message: 'Data pengguna tidak ditemukan' };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Login gagal';
      return { success: false, message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/register', userData);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Registrasi gagal'
        };
      }
    } catch (error) {
      console.error('Registration error:', error);

      return {
        success: false,
        message: error.response?.data?.message || 'Terjadi kesalahan saat registrasi'
      };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
  };

  const getUserRole = () => {
    if (!currentUser) return null;
    if (currentUser.userType) return currentUser.userType;
    if (currentUser.nis) return 'siswa';
    if (currentUser.nik) return 'orangtua';
    if (currentUser.nuptk) return 'guru';
    return null;
  };

  const value = {
    currentUser,
    isLoggedIn,
    login,
    logout,
    register,
    getUserRole,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
