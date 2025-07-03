// src/services/api.js - FIXED VERSION
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// URL untuk Flask backend (port 5001)
const CHATBOT_API_URL = 'http://localhost:5001/api';

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
  getAllCourses: (params = {}) => api.get('/courses', { params }),
  getCategories: () => api.get('/courses/categories'),
  getCourseById: (id) => api.get(`/courses/${id}`),
  enrollCourse: (courseId) => api.post(`/courses/${courseId}/enroll`),
  unenrollCourse: (courseId) => api.delete(`/courses/${courseId}/unenroll`),
  getMyEnrolledCourses: () => api.get('/courses/my/enrolled'),
  getMyCreatedCourses: () => api.get('/courses/my/created'),
  createCourse: (courseData) => api.post('/courses', courseData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
};

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/login', credentials),
  register: (userData) => api.post('/register', userData),
  validateSession: () => api.post('/auth/validate-session'),
  logout: () => api.post('/auth/logout'),
  setup2FA: (tempToken) => api.post('/auth/setup-2fa', {}, { headers: { Authorization: `Bearer ${tempToken}` } }),
  verifySetup: (token, tempToken) => api.post('/auth/verify-setup', { token }, { headers: { Authorization: `Bearer ${tempToken}` } }),
  verify2FA: (data) => api.post('/auth/verify-2fa', data),
  skip2FA: (tempToken) => api.post('/auth/skip-2fa', {}, { headers: { Authorization: `Bearer ${tempToken}` } }),
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

// Chatbot API
export const chatbotAPI = {
  queryDataset: (question) => api.post('/dataset/query', { question }),
  analyzeStudent: (nis) => api.get(`/student/${nis}/analysis`),
  testConnection: () => api.get('/test')
};

// Fungsi untuk mengecek apakah pertanyaan adalah tentang dataset
export const isDatasetQuestion = (question) => {
  const datasetKeywords = [
    'siswa', 'skor', 'nilai', 'rata-rata', 'kuis', 'tugas', 'jumlah',
    'analisis', 'performa', 'mata pelajaran', 'mapel', 'tertinggi', 'terendah',
    'statistik', 'data', 'berapa', 'semua', 'keseluruhan'
  ];
  return datasetKeywords.some(keyword => question.toLowerCase().includes(keyword));
};

// Fungsi untuk query dataset ke Flask backend
export const queryDataset = async (question) => {
  try {
    const response = await fetch(`${CHATBOT_API_URL}/dataset/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Error querying dataset:', error);
    return 'Maaf, tidak dapat mengakses data saat ini. Sistem sedang offline. 🔧';
  }
};

// Fungsi untuk analisis siswa ke Flask backend
export const analyzeStudent = async (nis) => {
  try {
    const response = await fetch(`${CHATBOT_API_URL}/student/${nis}/analysis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { error: 'Siswa tidak ditemukan' };
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing student:', error);
    return { error: 'Maaf, terjadi kesalahan saat menganalisis data siswa.' };
  }
};

// Fungsi fallback untuk respon offline
const getOfflineResponse = (userMessage) => {
  const message = userMessage.toLowerCase();

  // Respon untuk tips belajar
  if (message.includes('tips') || message.includes('belajar')) {
    const tips = [
      "🌟 Belajar rutin 15-30 menit setiap hari lebih efektif daripada belajar marathon!",
      "📚 Buat catatan kecil dengan kata-kata kunci untuk mudah diingat.",
      "🎯 Tetapkan target kecil setiap hari, seperti 'hari ini saya akan memahami 1 konsep baru'.",
      "👥 Belajar bersama teman bisa membuat proses belajar lebih menyenangkan!",
      "🔄 Ulangi materi yang sudah dipelajari sebelumnya untuk memperkuat ingatan."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  // Respon untuk matematika
  if (message.includes('matematika') || message.includes('mtk')) {
    const mathTips = [
      "🔢 Untuk matematika: Mulai dari soal yang mudah, lalu naik ke yang lebih sulit.",
      "✏️ Tulis rumus-rumus penting di kartu kecil untuk sering dibaca.",
      "🧮 Gunakan benda di sekitar untuk memahami konsep hitungan.",
      "📐 Latihan soal adalah kunci sukses matematika. Semakin banyak latihan, semakin paham!"
    ];
    return mathTips[Math.floor(Math.random() * mathTips.length)];
  }

  // Respon untuk sapaan
  if (['halo', 'hai', 'hi', 'hello', 'hey'].includes(message.trim())) {
    return "Halo! Saya RoGrow 🌱 Meski sedang offline, saya tetap bisa berbagi tips belajar yang menyenangkan! Tanyakan apa saja tentang belajar ya!";
  }

  // Respon default
  const fallbackResponses = [
    'Saya RoGrow! 🌱 Meski sedang offline, coba tanyakan tips belajar atau masukkan NIS untuk nanti dianalisis.',
    'Halo! Sistem sedang offline, tapi saya bisa berbagi tips belajar yang menyenangkan! 📚',
    'Yuk belajar bersama! Tanyakan tips untuk mata pelajaran apa pun. ✨',
    'Wah, saya sedang offline nih! Tapi tetap bisa kasih tips belajar yang keren! 🤖'
  ];
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
};

// Fungsi untuk menggunakan AI lokal (offline) - HAPUS GROQ API
export const sendMessageToGroq = async (messages) => {
  try {
    // Ambil pesan user terakhir
    const userMessage = messages[messages.length - 1]?.content || '';

    // Gunakan respon offline yang sudah disediakan
    return getOfflineResponse(userMessage);

  } catch (error) {
    console.error('Error in local AI response:', error);
    return getOfflineResponse('');
  }
};

// Test koneksi ke Flask backend
export const testFlaskConnection = async () => {
  try {
    const response = await fetch(`${CHATBOT_API_URL}/test`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Flask connection test:', data);
    return data;
  } catch (error) {
    console.error('❌ Flask connection failed:', error);
    return null;
  }
};

export default api;