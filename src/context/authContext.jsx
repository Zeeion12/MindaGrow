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

  const fetchUserData = async () => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // UPDATED: Use validate-session endpoint instead of dashboard
        // This ensures the token is still valid with 2FA system
        const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/validate-session`);
        
        if (response.data.success && response.data.valid) {
          setUser(response.data.user);
        } else {
          console.log('❌ Auth: Session invalid, logging out');
          handleLogout();
        }
      } catch (error) {
        console.error('❌ Auth: Error fetching user data:', error);
        handleLogout();
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };
  
  // Load user data on initial mount
  useEffect(() => {
    fetchUserData();
  }, [navigate]);
  
  // UPDATED: Modified login function to work with 2FA
  // This function is now mainly used to save token and user data after 2FA completion
  const login = async (tokenOrIdentifier, passwordOrUserData, remember) => {
    try {
      // Check if this is the new usage (saving token and user data)
      if (typeof passwordOrUserData === 'object' && passwordOrUserData.role) {
        // New usage: login(token, userData)
        const token = tokenOrIdentifier;
        const userData = passwordOrUserData;
        
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(userData);
        
        return { user: userData, success: true };
      }
      
      // Legacy usage: login(identifier, password, remember) - for backward compatibility
      console.log('🔄 Auth: Legacy login attempt for:', tokenOrIdentifier);
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/login`, {
        identifier: tokenOrIdentifier,
        password: passwordOrUserData,
        remember
      });
      
      // With 2FA system, we might get different responses
      if (response.data.success) {
        if (response.data.token && response.data.user) {
          // Direct login success (no 2FA required)
          const { token, user } = response.data;
          localStorage.setItem('token', token);
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser(user);
          return { user, success: true };
        } else if (response.data.requires2FA || response.data.requiresSetup) {
          // Return the response for 2FA handling
          return response.data;
        }
      }
      
      throw new Error(response.data.message || 'Login gagal');
    } catch (error) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Login gagal');
      }
      throw new Error(error.message || 'Login gagal');
    }
  };

  // UPDATED: Enhanced logout with proper 2FA session cleanup
  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      console.log('🚪 Auth: Logging out user');
      
      // Call backend to invalidate the session (important for 2FA)
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/logout`);
          console.log('✅ Auth: Session invalidated on server');
        } catch (error) {
          console.error('❌ Auth: Failed to invalidate session on server:', error);
        }
      }
      
      // Clear local storage and auth headers
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      // Clear user state
      setUser(null);
      
      // Navigate to login page
      navigate('/login');
      console.log('✅ Auth: Logout completed');
    } catch (error) {
      console.error('❌ Auth: Error during logout:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  // Legacy logout function for backward compatibility
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const updateUser = async (userData) => {
    setUser(userData);
    await fetchUserData();
  };

  // NEW: 2FA related functions
  const get2FAStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/2fa-status`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to get 2FA status');
      }
    } catch (error) {
      console.error('❌ Auth: Failed to get 2FA status:', error);
      throw new Error(error.response?.data?.message || 'Failed to get 2FA status');
    }
  };

  const disable2FA = async (password, currentToken) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/disable-2fa`, {
        password,
        token: currentToken
      });
      
      if (response.data.success) {
        // Update user data to reflect 2FA disabled
        if (user) {
          setUser({ ...user, is_2fa_enabled: false });
        }
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to disable 2FA');
      }
    } catch (error) {
      console.error('❌ Auth: Failed to disable 2FA:', error);
      throw new Error(error.response?.data?.message || 'Failed to disable 2FA');
    }
  };

  const changePassword = async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/change-password`, {
        currentPassword,
        newPassword,
        confirmPassword
      });
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('❌ Auth: Failed to change password:', error);
      throw new Error(error.response?.data?.message || 'Failed to change password');
    }
  };

  const getUserSessions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/sessions`);
      
      if (response.data.success) {
        return response.data.sessions;
      } else {
        throw new Error(response.data.message || 'Failed to get sessions');
      }
    } catch (error) {
      console.error('❌ Auth: Failed to get sessions:', error);
      throw new Error(error.response?.data?.message || 'Failed to get sessions');
    }
  };

  const terminateSession = async (sessionId) => {
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/sessions/${sessionId}`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to terminate session');
      }
    } catch (error) {
      console.error('❌ Auth: Failed to terminate session:', error);
      throw new Error(error.response?.data?.message || 'Failed to terminate session');
    }
  };

  const terminateAllOtherSessions = async () => {
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/sessions`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to terminate sessions');
      }
    } catch (error) {
      console.error('❌ Auth: Failed to terminate sessions:', error);
      throw new Error(error.response?.data?.message || 'Failed to terminate sessions');
    }
  };

  const updateProfilePicture = async (file) => {
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile-picture`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.user) {
        // Update user data with new profile picture
        setUser(response.data.user);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('❌ Auth: Failed to update profile picture:', error);
      throw new Error(error.response?.data?.message || 'Failed to update profile picture');
    }
  };

  const deleteProfilePicture = async () => {
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile-picture`);
      
      if (response.data.message) {
        // Update user to remove profile picture
        if (user) {
          setUser({ ...user, profile_picture: null });
        }
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to delete profile picture');
      }
    } catch (error) {
      console.error('❌ Auth: Failed to delete profile picture:', error);
      throw new Error(error.response?.data?.message || 'Failed to delete profile picture');
    }
  };

  // UPDATED: Enhanced refresh function with session validation
  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }

      // Use validate-session to ensure token is still valid
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/validate-session`);
      
      if (response.data.success && response.data.valid) {
        setUser(response.data.user);
        console.log('✅ Auth: User data refreshed');
      } else {
        console.log('❌ Auth: Session invalid during refresh');
        handleLogout();
      }
    } catch (error) {
      console.error('❌ Auth: Error refreshing user data:', error);
      handleLogout();
    }
  };

  const value = {
    // Existing properties
    user,
    loading,
    loggingOut,
    login,
    updateUser,
    logout: handleLogout,
    refreshUserData,
    
    // Legacy logout for backward compatibility
    logoutSimple: logout,
    
    // NEW: 2FA and security functions
    get2FAStatus,
    disable2FA,
    changePassword,
    getUserSessions,
    terminateSession,
    terminateAllOtherSessions,
    updateProfilePicture,
    deleteProfilePicture,
    
    // Helper to check if user has 2FA enabled
    is2FAEnabled: user?.is_2fa_enabled || false,
    
    // Helper to check user role
    isAdmin: user?.role === 'admin',
    isStudent: user?.role === 'siswa',
    isTeacher: user?.role === 'guru',
    isParent: user?.role === 'orangtua'
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ADD THIS: Named export for AuthContext
export { AuthContext };

// Keep default export as well
export default AuthContext;