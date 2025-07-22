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

  getCategories: () => {
    return api.get('/courses/categories');
  },

  createCourseWithModules: (courseData) => {
    return api.post('/courses', courseData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 seconds timeout for file uploads
    });
  },

  getCourseById: (id) => {
    return api.get(`/courses/${id}`);
  },

  createCourse: (courseData) => {
    return api.post('/courses', courseData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 seconds for file upload
    });
  },

  createCourseWithModules: (courseData) => {
    return api.post('/courses', courseData, {
      headers: { 
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    });
  },

  updateCourse: (id, courseData) => api.put(`/courses/${id}`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}`),

  enrollCourse: (courseId) => {
    return api.post(`/courses/${courseId}/enroll`);
  },

  unenrollCourse: (courseId) => {
    return api.delete(`/courses/${courseId}/enroll`);
  },

  getEnrolledCourses: () => {
    return api.get('/courses/enrolled');
  },
  
  getCourseContent: (courseId) => api.get(`/courses/${courseId}/content`),

  getCourseLearningData: (courseId) => {
    return api.get(`/courses/${courseId}/learning`);
  },

   getCourseProgress: (courseId) => {
    return api.get(`/courses/${courseId}/progress`);
  },

   saveLessonNotes: (lessonId, notes) => {
    return api.post(`/lessons/${lessonId}/notes`, { notes });
  },

  // Get lesson notes
  getLessonNotes: (lessonId) => {
    return api.get(`/lessons/${lessonId}/notes`);
  },

  updateLessonProgress: (lessonId, progressData) => {
    return api.put(`/lessons/${lessonId}/progress`, progressData);
  },
};

export const gameAPI = {
  // ============================================
  // USER GAME PROGRESS
  // ============================================
  
  // Get user's game progress (all games)
  getProgress: () => {
    const timestamp = Date.now();
    return api.get(`/games/progress?_=${timestamp}`);
  },

  // Get progress for specific game
  getGameProgress: (gameId) => {
    return api.get(`/games/progress/${gameId}`);
  },

  // Update game progress after playing
  updateGameProgress: (gameId, gameResult) => {
    return api.post(`/games/progress/${gameId}`, gameResult);
  },

  // Legacy method (keep for backward compatibility)
  updateGameProgress: (gameId, gameResult) => {
    return api.post(`/games/progress/${gameId}`, gameResult);
  },

  // ============================================
  // USER STREAKS
  // ============================================
  
  // Get user streak data with countdown timer
  getUserStreak: () => {
    const timestamp = Date.now();
    return api.get(`/games/streak?_=${timestamp}`);
  },

  // Update streak (called after playing game)
  updateStreak: (gameId) => {
    return api.post('/games/streak', { gameId });
  },

  // ============================================
  // USER LEVELS & XP
  // ============================================
  
  // Get user level info
  getUserLevel: () => {
    const timestamp = Date.now();
    return api.get(`/games/level?_=${timestamp}`);
  },


  // ============================================
  // DAILY MISSIONS
  // ============================================
  
  // Get daily missions
  getDailyMissions: () => {
    return api.get('/games/daily-missions');
  },

  // Update daily mission progress
  updateDailyMissionProgress: (missionType, progressValue = 1) => {
    return api.post('/games/daily-missions/progress', {
      missionType,
      progressValue
    });
  },

  // ============================================
  // LEADERBOARD
  // ============================================
  
  // Get weekly leaderboard
  getWeeklyLeaderboard: (limit = 10) => {
    return api.get(`/games/leaderboard/weekly?limit=${limit}`);
  },

  // Get overall leaderboard
  getOverallLeaderboard: (limit = 10) => {
    return api.get(`/games/leaderboard/overall?limit=${limit}`);
  },

  // Legacy method (keep for backward compatibility)
  getLeaderboard: (type = 'weekly') => {
    return api.get(`/games/leaderboard?type=${type}`);
  },

  // Get user ranking
  getUserRanking: () => {
    return api.get('/games/ranking');
  },

  // ============================================
  // GAME DATA
  // ============================================
  
  // Get all games
  getGames: () => {
    return api.get('/games');
  },

  // Get game detail
  getGameDetail: (gameId) => {
    return api.get(`/games/${gameId}`);
  },

  // ============================================
  // GAME SESSIONS
  // ============================================
  
  // Start game session
  startGameSession: (gameId) => {
    return api.post('/games/session/start', { gameId });
  },

  // End game session
  endGameSession: (sessionId, gameResult) => {
    return api.post('/games/session/end', {
      sessionId,
      ...gameResult
    });
  },

  // ============================================
  // ANALYTICS & STATS
  // ============================================
  
  // Get user game stats
  getUserGameStats: () => {
    return api.get('/games/stats');
  },

  // Get game history
  getGameHistory: (gameId, limit = 10) => {
    return api.get(`/games/history/${gameId}?limit=${limit}`);
  }
};

export const progressAPI = {
  // Update lesson progress
  updateLessonProgress: (lessonId, progressData) => {
    return api.post(`/lessons/${lessonId}/progress`, progressData);
  },

  // Get student course progress
  getStudentCourseProgress: (courseId) => {
    return api.get(`/courses/${courseId}/progress`);
  },

  // Get all student progress
  getStudentProgress: () => {
    return api.get('/progress/my-progress');
  },

  // Get course completion certificate
  getCertificate: (courseId) => {
    return api.get(`/courses/${courseId}/certificate`);
  },
};

export const moduleAPI = {
  // Create module
  createModule: (courseId, moduleData) => {
    return api.post(`/courses/${courseId}/modules`, moduleData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Update module
  updateModule: (moduleId, moduleData) => {
    return api.put(`/modules/${moduleId}`, moduleData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Delete module
  deleteModule: (moduleId) => {
    return api.delete(`/modules/${moduleId}`);
  },

  // Get module by ID
  getModuleById: (moduleId) => {
    return api.get(`/modules/${moduleId}`);
  },

  // Create lesson
  createLesson: (moduleId, lessonData) => {
    return api.post(`/modules/${moduleId}/lessons`, lessonData);
  },

  // Update lesson
  updateLesson: (lessonId, lessonData) => {
    return api.put(`/lessons/${lessonId}`, lessonData);
  },

  // Delete lesson
  deleteLesson: (lessonId) => {
    return api.delete(`/lessons/${lessonId}`);
  },

  // Get lesson by ID
  getLessonById: (lessonId) => {
    return api.get(`/lessons/${lessonId}`);
  },
};

export const materialAPI = {
  // Get materials
  getMaterials: (params = {}) => {
    return api.get('/materials', { params });
  },

  // Get material by ID
  getMaterialById: (materialId) => {
    return api.get(`/materials/${materialId}`);
  },

  // Create material (guru only)
  createMaterial: (materialData) => {
    return api.post('/materials', materialData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Update material (guru only)
  updateMaterial: (materialId, materialData) => {
    return api.put(`/materials/${materialId}`, materialData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Delete material (guru only)
  deleteMaterial: (materialId) => {
    return api.delete(`/materials/${materialId}`);
  },

  // Download material
  downloadMaterial: (materialId) => {
    return api.get(`/materials/${materialId}/download`, {
      responseType: 'blob'
    });
  },
};

export const notificationAPI = {
  // Get notifications
  getNotifications: (params = {}) => {
    return api.get('/notifications', { params });
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    return api.put(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return api.put('/notifications/mark-all-read');
  },

  // Delete notification
  deleteNotification: (notificationId) => {
    return api.delete(`/notifications/${notificationId}`);
  },

  // Get unread count
  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },
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

export const chatAPI = {
  // Get conversations
  getConversations: () => {
    return api.get('/chat/conversations');
  },

  // Get conversation by ID
  getConversation: (conversationId) => {
    return api.get(`/chat/conversations/${conversationId}`);
  },

  // Send message
  sendMessage: (conversationId, messageData) => {
    return api.post(`/chat/conversations/${conversationId}/messages`, messageData);
  },

  // Create conversation
  createConversation: (participantIds) => {
    return api.post('/chat/conversations', { participantIds });
  },

  // Mark messages as read
  markAsRead: (conversationId) => {
    return api.put(`/chat/conversations/${conversationId}/read`);
  },
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

export const uploadFile = async (file, uploadPath = 'uploads') => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploadPath', uploadPath);
  
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Helper function untuk download file
export const downloadFile = async (fileUrl, fileName) => {
  try {
    const response = await api.get(fileUrl, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return response;
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
};

// Helper function untuk format error message
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'Terjadi kesalahan yang tidak diketahui';
};

// Helper function untuk check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  return !!(token && user);
};

// Helper function untuk get current user
export const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user data:', error);
    return null;
  }
};

// Export default API instance
export default api;

// Re-export specific APIs for backwards compatibility
export { 
  courseAPI as default_courseAPI,
  authAPI as default_authAPI,
  userAPI as default_userAPI 
};