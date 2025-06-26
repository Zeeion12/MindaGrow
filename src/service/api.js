// src/services/api.js - CLEAN VERSION (minimal logging)
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simplified interceptors - only log errors
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only log actual errors
    if (error.response?.status >= 400) {
      console.error('❌ API Error:', error.response.status, error.config?.url);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Course API - CLEAN VERSION
export const courseAPI = {
  getAllCourses: (params = {}) => {
    return api.get('/courses', { params });
  },

  getCategories: () => {
    return api.get('/courses/categories');
  },

  getCourseById: (id) => {
    return api.get(`/courses/${id}`);
  },

  enrollCourse: (courseId) => {
    return api.post(`/courses/${courseId}/enroll`);
  },

  unenrollCourse: (courseId) => {
    return api.delete(`/courses/${courseId}/unenroll`);
  },

  getMyEnrolledCourses: () => {
    return api.get('/courses/my/enrolled');
  },

  getMyCreatedCourses: () => {
    return api.get('/courses/my/created');
  },

  createCourse: (courseData) => {
    return api.post('/courses', courseData);
  },

  updateCourse: (id, courseData) => {
    return api.put(`/courses/${id}`, courseData);
  },

  deleteCourse: (id) => {
    return api.delete(`/courses/${id}`);
  }
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  validateSession: () => api.post('/auth/validate-session'),
  logout: () => api.post('/auth/logout'),
  setup2FA: (tempToken) => api.post('/auth/setup-2fa', {}, {
    headers: { Authorization: `Bearer ${tempToken}` }
  }),
  verifySetup: (token, tempToken) => api.post('/auth/verify-setup', { token }, {
    headers: { Authorization: `Bearer ${tempToken}` }
  }),
  verify2FA: (data) => api.post('/auth/verify-2fa', data),
  skip2FA: (tempToken) => api.post('/auth/skip-2fa', {}, {
    headers: { Authorization: `Bearer ${tempToken}` }
  }),
  disable2FA: (data) => api.post('/auth/disable-2fa', data),
  get2FAStatus: () => api.get('/user/2fa-status'),
  checkNIK: (nik) => api.post('/check-nik', { nik }),
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getStats: () => api.get('/admin/stats'),
  getCourseStats: () => api.get('/admin/course-stats'),
  getActivities: () => api.get('/admin/activities'),
};

// User API
export const userAPI = {
  getDashboard: () => api.get('/dashboard'),
  uploadProfilePicture: (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    return api.post('/users/profile-picture', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteProfilePicture: () => api.delete('/users/profile-picture'),
};

export default api;