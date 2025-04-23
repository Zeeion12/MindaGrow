// src/service/api.js

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const PYTHON_BACKEND_URL = 'http://localhost:5000/api';

/**
 * Mengirim pesan ke API Groq untuk mendapatkan respons
 * @param {Array} messages - Array objek pesan dalam format [{role: 'user', content: 'Pesan pengguna'}]
 * @returns {Promise<string>} - Respons dari model AI
 */
export const sendMessageToGroq = async (messages) => {
  try {
    // Periksa apakah API key tersedia
    if (!GROQ_API_KEY) {
      console.error('API key Groq tidak ditemukan. Periksa file .env Anda.');
      throw new Error('API key tidak dikonfigurasi. Silakan tambahkan VITE_GROQ_API_KEY di file .env');
    }
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192',
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Groq API error response:', errorData);
      throw new Error(`Error API: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error saat mengirim pesan ke Groq:', error);
    throw error;
  }
};

/**
 * Mengirim pertanyaan dataset ke backend Python
 * @param {string} question - Pertanyaan tentang dataset
 * @returns {Promise<string>} - Jawaban berdasarkan analisis dataset
 */
export const queryDataset = async (question) => {
  try {
    const response = await fetch(`${PYTHON_BACKEND_URL}/dataset/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: question
      })
    });

    if (!response.ok) {
      throw new Error(`Error API: ${response.statusText}`);
    }

    const data = await response.json();
    return data.answer;
  } catch (error) {
    console.error('Error saat mengirim pertanyaan ke backend Python:', error);
    throw error;
  }
};

/**
 * Memeriksa apakah pertanyaan berkaitan dengan dataset
 * @param {string} question - Pertanyaan pengguna
 * @returns {boolean} - True jika pertanyaan berkaitan dengan dataset
 */
export const isDatasetQuestion = (question) => {
  const datasetKeywords = [
    'dataset', 'data', 'siswa', 'pelajar', 'murid', 'sekolah',
    'nilai', 'skor', 'absensi', 'absen', 'umur', 'grade', 'kelas',
    'rata-rata', 'rata rata', 'average', 'jumlah', 'total', 'banyak',
    'distribusi', 'sebaran', 'statistik', 'analisis', 'korelasi',
    'hubungan', 'tertinggi', 'terendah', 'maksimum', 'minimum',
    'prediksi', 'perkiraan', 'cluster', 'kelompok', 'grup',
    'gamifikasi', 'rekomendasi', 'strategi', 'saran'
  ];
  
  const lowerQuestion = question.toLowerCase();
  
  return datasetKeywords.some(keyword => lowerQuestion.includes(keyword));
};