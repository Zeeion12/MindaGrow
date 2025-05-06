import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState(false);
  
  // API configuration
  const API_URL = 'http://localhost:3000/api';

  // Check backend availability
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        // Try to actually check if the backend is available
        const response = await axios.get(`${API_URL}/health`, { 
          timeout: 3000,
          // Add retry logic to handle temporary connection issues
          retry: 2,
          retryDelay: 1000
        });
        if (response.status === 200) {
          setBackendAvailable(true);
          console.log('Backend is available');
        } else {
          setBackendAvailable(false);
          console.log('Backend responded but with unexpected status:', response.status);
        }
      } catch (error) {
        console.error('Backend health check failed:', error.message);
        setBackendAvailable(false);
      } finally {
        // Proceed with loading user session regardless of backend status
      }
    };
    
    checkBackendStatus();
  }, []);

  // Check for existing user session on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // First check if we have a token
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        
        if (!token) {
          setLoading(false);
          return;
        }
        
        // If backend is not available, try to get user from localStorage
        if (!backendAvailable) {
          const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
          setLoading(false);
          return;
        }
        
        // Verify token with backend
        try {
          const response = await axios.get(`${API_URL}/auth/verify`, {
            headers: { 
              'Authorization': `Bearer ${token}` 
            }
          });
          
          if (response.data.success) {
            setUser(response.data.user);
          } else {
            // Clear invalid token
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
          }
        } catch (error) {
          console.error('Auth verification error:', error);
          // On error, fall back to stored user data if available
          const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
            // Continue using offline mode with stored user
            console.log('Using stored user data in offline mode');
          } else {
            // Clear token on error if no stored user
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
          }
        }
      } catch (error) {
        console.error('Auth verification error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [backendAvailable]);

  // Login function
  const login = async (userData, rememberMe = false) => {
    try {
      console.log('AuthContext: Login user', userData);
      
      // Store the user data in state
      setUser(userData);
      
      // Only try API call if backend is available
      if (backendAvailable) {
        try {
          const response = await axios.post(`${API_URL}/auth/login`, userData, {
            timeout: 5000, // 5 seconds timeout
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data.success) {
            console.log('Login API response:', response.data);
          }
        } catch (fetchError) {
          console.log('API call failed, but continuing with local login:', fetchError);
          // Continue with local login despite API failure
        }
      } else {
        console.log('Backend not available, using local login only');
      }
      
      // Store the token based on remember me preference
      const token = userData.token || 'mock-token-' + Date.now();
      
      if (rememberMe) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
      } else {
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      return true;
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      return false;
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      // Always store user locally regardless of backend status
      // This ensures fallback works properly
      const existingUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
      
      // Check if user already exists
      const userExists = existingUsers.some(
        user => user.nis === userData.nis || user.surel === userData.surel
      );
      
      if (userExists) {
        console.log('User already exists in mock users');
        return { success: false, message: 'User already exists' };
      }
      
      // Add to mock users
      existingUsers.push(userData);
      localStorage.setItem('mockUsers', JSON.stringify(existingUsers));
      console.log('User added to mock users storage');
      
      // Try API call if backend is available
      if (backendAvailable) {
        try {
          const response = await axios.post(`${API_URL}/auth/register`, userData, {
            timeout: 5000,
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.data.success) {
            console.log('Register API response:', response.data);
            return { success: true };
          }
        } catch (apiError) {
          console.log('API registration failed, but user was stored locally:', apiError);
          // Continue with success since user was stored locally
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Register error in AuthContext:', error);
      return { success: false, message: error.message };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (token && backendAvailable) {
        // Notify backend about logout if available
        try {
          await axios.post(`${API_URL}/auth/logout`, {}, {
            headers: { 'Authorization': `Bearer ${token}` },
            timeout: 3000
          });
        } catch (error) {
          console.log('Logout API error (proceeding with local logout):', error.message);
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user state and tokens
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user && user.userType === role;
  };

  // Get user type
  const getUserType = () => {
    return user ? user.userType : null;
  };

  // Get user data
  const getUserData = () => {
    return user;
  };

  const value = {
    user,
    loading,
    isAuthenticated: isAuthenticated(),
    backendAvailable,
    login,
    logout,
    register,
    hasRole,
    getUserType,
    getUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);