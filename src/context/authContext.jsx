import React, { createContext, useState, useContext, useEffect } from 'react';

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
    
  // Login function
  const login = async (username, password) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
        username,
        password
      });

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
  
  // Register function
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
      
      // Handle specific error responses
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || 'Registrasi gagal'
        };
      }
      
      return {
        success: false,
        message: 'Terjadi kesalahan saat registrasi'
      };
    }
  };
  
  const logout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('user');
  };
  
  // Get user role
  const getUserRole = () => {
    if (!currentUser) return null;
    
    // If userType is explicitly set, use it
    if (currentUser.userType) {
      return currentUser.userType;
    }
    
    // Otherwise infer from identifiers
    if (currentUser.nis) return 'siswa';
    if (currentUser.nik) return 'orangtua';
    if (currentUser.nuptk) return 'guru';
    
    // Default fallback
    return null;
  };
  
  // Auth context value
  const value = {
    currentUser,
    login,
    register,
    logout,
    loading,
    getUserRole
  };

  if (loading) return <div>Loading...</div>;
  
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoggedIn,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);