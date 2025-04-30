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
  
  // Check if user is authenticated on component mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
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
          console.log('User is authenticated:', response.data.user);
          setCurrentUser(response.data.user);
        } else {
          // Token invalid or expired
          console.log('Token invalid or expired');
          localStorage.removeItem('authToken');
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        localStorage.removeItem('authToken');
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login function
  const login = async (username, password) => {
    try {
      console.log('Attempting login with:', { username });
      
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('authToken', response.data.token);
        
        // Set current user
        setCurrentUser(response.data.user);
        
        return {
          success: true,
          user: response.data.user
        };
      } else {
        return {
          success: false,
          message: response.data.message || 'Login gagal'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle specific error responses
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || 'Login gagal'
        };
      }
      
      return {
        success: false,
        message: 'Terjadi kesalahan saat login'
      };
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
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
  };
  
  // Auth context value
  const value = {
    currentUser,
    login,
    register,
    logout,
    loading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;