import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

// Set the base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Configure default axios base URL
axios.defaults.baseURL = API_URL;

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
          
          // Make sure userType is included
          let userData = response.data.user;
          
          // If userType is not explicitly set, infer it from the available identifiers
          if (!userData.userType) {
            if (userData.nis) {
              userData.userType = 'siswa';
            } else if (userData.nik) {
              userData.userType = 'orangtua';
            } else if (userData.nuptk) {
              userData.userType = 'guru';
            }
          }
          
          setCurrentUser(userData);
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
        
        // Make sure userType is included
        let userData = response.data.user;
        
        // If userType is not explicitly set, infer it from the available identifiers
        if (!userData.userType) {
          if (userData.nis) {
            userData.userType = 'siswa';
          } else if (userData.nik) {
            userData.userType = 'orangtua';
          } else if (userData.nuptk) {
            userData.userType = 'guru';
          }
          console.log('Inferred userType:', userData.userType);
        }
        
        // Set current user
        setCurrentUser(userData);
        
        return {
          success: true,
          user: userData
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
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;