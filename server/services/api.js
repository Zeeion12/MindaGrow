// src/services/api.js - Updated untuk PostgreSQL backend
import axios from 'axios';

// Create axios instance - update base URL to match your backend
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Course API
export const courseAPI = {
  // Get all courses with filters and pagination
  getAllCourses: (params = {}) => {
    return api.get('/courses', { params });
  },

  // Get course by ID
  getCourseById: (id) => {
    return api.get(`/courses/${id}`);
  },

  // Get popular courses
  getPopularCourses: (limit = 6) => {
    return api.get('/courses/popular', { params: { limit } });
  },

  // Get new courses
  getNewCourses: (limit = 6) => {
    return api.get('/courses/new', { params: { limit } });
  },

  // Get categories
  getCategories: () => {
    return api.get('/courses/categories');
  },

  // Search courses (enhanced)
  searchCourses: (params = {}) => {
    return api.get('/courses/search', { params });
  },

  // Create new course (guru/admin only)
  createCourse: (courseData) => {
    return api.post('/courses', courseData);
  },

  // Update course (guru/admin only)
  updateCourse: (id, courseData) => {
    return api.put(`/courses/${id}`, courseData);
  },

  // Delete course (admin only)
  deleteCourse: (id) => {
    return api.delete(`/courses/${id}`);
  },

  // Enroll in course (siswa only)
  enrollCourse: (courseId) => {
    return api.post(`/courses/${courseId}/enroll`);
  },

  // Unenroll from course (siswa only)
  unenrollCourse: (courseId) => {
    return api.delete(`/courses/${courseId}/unenroll`);
  },

  // Get my enrolled courses (siswa only)
  getMyEnrolledCourses: () => {
    return api.get('/courses/my/enrolled');
  },

  // Get my created courses (guru only)
  getMyCreatedCourses: () => {
    return api.get('/courses/my/created');
  },
};

// Auth API (updated untuk PostgreSQL)
export const authAPI = {
  // Login
  login: (credentials) => {
    return api.post('/login', credentials);
  },

  // Admin login
  adminLogin: (credentials) => {
    return api.post('/admin/login', credentials);
  },

  // Register
  register: (userData) => {
    return api.post('/register', userData);
  },

  // Validate session
  validateSession: () => {
    return api.post('/auth/validate-session');
  },

  // 2FA Setup
  setup2FA: (tempToken) => {
    return api.post('/auth/setup-2fa', {}, {
      headers: { Authorization: `Bearer ${tempToken}` }
    });
  },

  // Verify 2FA setup
  verifySetup: (token, tempToken) => {
    return api.post('/auth/verify-setup', { token }, {
      headers: { Authorization: `Bearer ${tempToken}` }
    });
  },

  // Verify 2FA for login
  verify2FA: (data) => {
    return api.post('/auth/verify-2fa', data);
  },

  // Skip 2FA setup
  skip2FA: (tempToken) => {
    return api.post('/auth/skip-2fa', {}, {
      headers: { Authorization: `Bearer ${tempToken}` }
    });
  },

  // Disable 2FA
  disable2FA: (data) => {
    return api.post('/auth/disable-2fa', data);
  },

  // Get 2FA status
  get2FAStatus: () => {
    return api.get('/user/2fa-status');
  },

  // Logout
  logout: () => {
    return api.post('/auth/logout');
  },

  // Check NIK
  checkNIK: (nik) => {
    return api.post('/check-nik', { nik });
  },
};

// Admin API
export const adminAPI = {
  // Get all users
  getUsers: () => {
    return api.get('/admin/users');
  },

  // Get user by ID
  getUserById: (id) => {
    return api.get(`/admin/users/${id}`);
  },

  // Delete user
  deleteUser: (id) => {
    return api.delete(`/admin/users/${id}`);
  },

  // Get statistics
  getStats: () => {
    return api.get('/admin/stats');
  },

  // Get course statistics
  getCourseStats: () => {
    return api.get('/admin/course-stats');
  },

  // Get activities
  getActivities: () => {
    return api.get('/admin/activities');
  },
};

// User API
export const userAPI = {
  // Get dashboard data
  getDashboard: () => {
    return api.get('/dashboard');
  },

  // Upload profile picture
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    return api.post('/users/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete profile picture
  deleteProfilePicture: () => {
    return api.delete('/users/profile-picture');
  },
};

export default api;