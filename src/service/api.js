// src/service/api.js - Updated with OpenAI Integration
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const CHATBOT_API_URL = 'http://localhost:5001/api';

// Create axios instance
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
};

// Course API
export const courseAPI = {
  getAllCourses: (filters = {}) => api.get('/courses', { params: filters }),
  getCourseById: (id) => api.get(`/courses/${id}`),
  createCourse: (courseData) => api.post('/courses', courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),
  enrollCourse: (courseId) => api.post(`/courses/${courseId}/enroll`),
  getEnrolledCourses: () => api.get('/courses/enrolled'),
};

// Admin API
export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, userData) => api.put(`/admin/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getStats: () => api.get('/admin/stats'),
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

// Enhanced Chatbot API with OpenAI
export const chatbotAPI = {
  // Chat dengan OpenAI
  chatWithOpenAI: (messages, nis = null) => 
    fetch(`${CHATBOT_API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, nis })
    }).then(res => res.json()),
  
  // Query dataset
  queryDataset: (question) => 
    fetch(`${CHATBOT_API_URL}/dataset/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question })
    }).then(res => res.json()),
  
  // Analisis siswa detail
  analyzeStudent: (nis) => 
    fetch(`${CHATBOT_API_URL}/student/${nis}/analysis`).then(res => res.json()),
  
  // Prediksi dan rekomendasi
  getStudentPredictions: (nis) => 
    fetch(`${CHATBOT_API_URL}/student/${nis}/predictions`).then(res => res.json()),
  
  // Test connection
  testConnection: () => 
    fetch(`${CHATBOT_API_URL}/test`).then(res => res.json())
};

// Fungsi untuk mengecek apakah pertanyaan adalah tentang dataset
export const isDatasetQuestion = (question) => {
  const datasetKeywords = [
    'siswa', 'skor', 'nilai', 'rata-rata', 'kuis', 'tugas', 'jumlah',
    'analisis', 'performa', 'mata pelajaran', 'mapel', 'tertinggi', 'terendah',
    'statistik', 'data', 'berapa', 'semua', 'keseluruhan', 'prediksi'
  ];
  return datasetKeywords.some(keyword => question.toLowerCase().includes(keyword));
};

// Fungsi untuk query dataset ke Flask backend
export const queryDataset = async (question) => {
  try {
    const response = await chatbotAPI.queryDataset(question);
    return response.answer || 'Maaf, tidak dapat memproses pertanyaan saat ini.';
  } catch (error) {
    console.error('Error querying dataset:', error);
    return 'Maaf, tidak dapat mengakses data saat ini. Sistem sedang offline. 🔧';
  }
};

// Fungsi untuk analisis siswa ke Flask backend
export const analyzeStudent = async (nis) => {
  try {
    const response = await chatbotAPI.analyzeStudent(nis);
    
    if (!response.success) {
      return { error: response.error || 'Siswa tidak ditemukan' };
    }
    
    return {
      success: true,
      data: response.data,
      formatted_response: response.formatted_response
    };
  } catch (error) {
    console.error('Error analyzing student:', error);
    return { error: 'Maaf, terjadi kesalahan saat menganalisis data siswa.' };
  }
};

// Fungsi untuk mendapatkan prediksi siswa
export const getStudentPredictions = async (nis) => {
  try {
    const response = await chatbotAPI.getStudentPredictions(nis);
    
    if (!response.success) {
      return { error: response.error || 'Gagal mendapatkan prediksi' };
    }
    
    return {
      success: true,
      predictions: response.predictions,
      chart_recommendations: response.chart_recommendations,
      formatted_response: response.formatted_response
    };
  } catch (error) {
    console.error('Error getting predictions:', error);
    return { error: 'Maaf, terjadi kesalahan saat menganalisis prediksi.' };
  }
};

// Enhanced function dengan OpenAI
export const sendMessageToOpenAI = async (messages, nis = null) => {
  try {
    const response = await chatbotAPI.chatWithOpenAI(messages, nis);
    
    if (!response.success) {
      return getOfflineResponse(messages[messages.length - 1]?.content || '');
    }
    
    return response.response;
  } catch (error) {
    console.error('Error with OpenAI:', error);
    return getOfflineResponse(messages[messages.length - 1]?.content || '');
  }
};

// Fungsi fallback untuk respon offline yang lebih baik
const getOfflineResponse = (userMessage) => {
  const message = userMessage.toLowerCase();

  // Respon untuk tips belajar
  if (message.includes('tips') || message.includes('belajar')) {
    const tips = [
      "🌟 Belajar rutin 15-30 menit setiap hari lebih efektif daripada belajar marathon!",
      "📚 Buat catatan kecil dengan kata-kata kunci untuk mudah diingat.",
      "🎯 Tetapkan target kecil setiap hari, seperti 'hari ini saya akan memahami 1 konsep baru'.",
      "👥 Belajar bersama teman bisa membuat proses belajar lebih menyenangkan!",
      "🔄 Ulangi materi yang sudah dipelajari sebelumnya untuk memperkuat ingatan.",
      "⏰ Gunakan teknik Pomodoro: 25 menit belajar, 5 menit istirahat!",
      "🧠 Coba metode mind mapping untuk menghubungkan konsep-konsep yang dipelajari."
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }

  // Respon untuk matematika
  if (message.includes('matematika') || message.includes('mtk')) {
    const mathTips = [
      "🔢 Untuk matematika: Mulai dari soal yang mudah, lalu naik ke yang lebih sulit.",
      "✏️ Tulis rumus-rumus penting di kartu kecil untuk sering dibaca.",
      "🧮 Gunakan benda di sekitar untuk memahami konsep hitungan.",
      "📐 Latihan soal adalah kunci sukses matematika. Semakin banyak latihan, semakin paham!",
      "🎯 Pahami konsep dasar dulu sebelum mengerjakan soal yang rumit.",
      "👥 Diskusi dengan teman tentang cara menyelesaikan soal matematika."
    ];
    return mathTips[Math.floor(Math.random() * mathTips.length)];
  }

  // Respon untuk analisis/prediksi
  if (message.includes('analisis') || message.includes('prediksi') || message.includes('performa')) {
    return "📊 Untuk analisis dan prediksi yang akurat, masukkan NIS kamu dulu ya! Setelah itu saya bisa memberikan:\n• Analisis performa detail\n• Prediksi pola belajar\n• Rekomendasi berdasarkan chart dashboard\n• Tips personal sesuai kemampuan 🎯";
  }

  // Respon untuk sapaan
  if (['halo', 'hai', 'hi', 'hello', 'hey', 'p', 'hei'].includes(message.trim())) {
    return "Halo! Saya RoGrow dengan teknologi OpenAI! 🤖✨\n\nMeski sedang offline, saya tetap bisa:\n• Berbagi tips belajar yang efektif\n• Memberikan motivasi belajar\n• Membantu dengan strategi pembelajaran\n\nTanyakan apa saja tentang belajar ya! 🌱";
  }

  // Respon untuk NIS
  if (/^\d{6,8}$/.test(message.trim())) {
    return `✅ NIS ${message.trim()} tercatat! Setelah sistem online, saya akan memberikan:\n🔍 Analisis performa lengkap\n📈 Prediksi berdasarkan chart dashboard\n🎯 Rekomendasi personal\n💡 Tips belajar yang disesuaikan\n\nSementara itu, tanyakan tips belajar ya! 📚`;
  }

  // Respon default yang lebih engaging
  const fallbackResponses = [
    'Saya RoGrow dengan AI OpenAI! 🤖 Meski offline, coba tanyakan tips belajar atau strategi pembelajaran efektif!',
    'Halo! Sistem AI sedang offline, tapi saya bisa berbagi tips belajar yang amazing! 📚✨',
    'Yuk belajar bersama! Tanyakan tips untuk mata pelajaran apa pun atau cara belajar yang fun! 🌟',
    'Wah, saya sedang offline nih! Tapi tetap bisa kasih motivasi dan tips belajar yang keren! 🚀',
    'AI OpenAI sedang istirahat, tapi semangat belajar jangan istirahat ya! Tanyakan tips belajar! 💪'
  ];
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
};

// Backward compatibility (untuk komponen yang masih menggunakan nama lama)
export const sendMessageToGroq = sendMessageToOpenAI;

// Test koneksi ke Flask backend
export const testFlaskConnection = async () => {
  try {
    const response = await chatbotAPI.testConnection();
    return response;
  } catch (error) {
    console.error('Flask connection test failed:', error);
    return { status: 'error', message: 'Connection failed' };
  }
};

// Export default API instance
export default api;