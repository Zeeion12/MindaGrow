// src/services/api.js

const GROQ_API_KEY = import.meta.env.example.VITE_GROQ_API_KEY;
const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Mengirim pesan ke API Groq untuk mendapatkan respons
 * @param {Array} messages - Array objek pesan dalam format [{role: 'user', content: 'Pesan pengguna'}]
 * @returns {Promise<string>} - Respons dari model AI
 */
export const sendMessageToGroq = async (messages) => {
  try {
    // Log untuk debugging (hapus di produksi)
    console.log('Mengirim pesan ke Groq API:', messages);
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama3-8b-8192', // Anda bisa mengubah ke model Groq lain seperti 'mixtral-8x7b-32768'
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
    console.log('Respons dari Groq API:', data);
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error saat mengirim pesan ke Groq:', error);
    throw error; // Re-throw error untuk penanganan di chatbot
  }
};