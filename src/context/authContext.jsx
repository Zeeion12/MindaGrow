import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token and get user data
      axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/dashboard`)
        .then(response => {
          setUser(response.data.user);
        })
        .catch(() => {
          logout(); // This is where the error is occurring
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [navigate]);
  
  const login = async (identifier, password, remember) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/login`, {
        identifier,
        password,
        remember
      });
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return { user, success: true };
    } catch (error) {
      throw error.response?.data?.message || 'Login gagal';
    }
  };

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      
      // Optional: Call backend to invalidate the token
      // await axios.post('/api/logout');
      
      // Clear local storage and auth headers
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      // Clear user state
      setUser(null);
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setLoggingOut(false);
    }
  };
  
  const value = {
    user,
    loading,
    loggingOut,
    login,
    logout: handleLogout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;