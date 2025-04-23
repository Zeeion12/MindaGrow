// src/components/DatasetChatbot.jsx
import { useState, useEffect, useRef } from 'react';
import { queryDataset } from '../service/api';

const DatasetChatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Tambahkan pesan selamat datang saat pertama kali dibuka
  useEffect(() => {
    const welcomeMessage = { 
      text: "Selamat datang di Dataset Chatbot! Saya dapat menjawab pertanyaan tentang dataset edukasi AI gamifikasi anak. Silakan tanyakan tentang jumlah siswa, rata-rata skor, distribusi umur, korelasi skor dan absensi, atau rekomendasi strategi gamifikasi.", 
      sender: 'bot' 
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle submit pesan
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (input.trim() === '') return;
    
    // Tambahkan pesan pengguna
    const userMessage = { text: input, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Reset input dan tampilkan loading
    const currentInput = input;
    setInput('');
    setIsLoading(true);
    
    try {
      // Kirim pertanyaan ke backend Python
      const response = await queryDataset(currentInput);
      
      const botMessage = { 
        text: response, 
        sender: 'bot' 
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error dalam mendapatkan respons:', error);
      
      const errorMessage = { 
        text: "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Pastikan backend Python berjalan di http://localhost:5000 dan coba lagi.",
        sender: 'bot' 
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96 border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
      {/* Header Chatbot */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center">
        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
          <span className="text-blue-600 text-xl">📊</span>
        </div>
        <div>
          <h3 className="font-medium">Dataset Chatbot</h3>
          <p className="text-xs opacity-80">Analisis Data Edukasi AI Gamifikasi</p>
        </div>
      </div>
      
      {/* Area Chat */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
          >
            <div 
              className={`inline-block px-4 py-2 rounded-lg max-w-xs ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-none' 
                  : 'bg-gray-200 text-gray-800 rounded-bl-none'
              }`}
            >
              {message.text.split('\n').map((line, i) => (
                <span key={i}>
                  {line}
                  {i < message.text.split('\n').length - 1 && <br />}
                </span>
              ))}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="text-left mb-4">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg rounded-bl-none inline-block">
              <div className="flex space-x-1">
                <div className="bg-gray-600 rounded-full h-2 w-2 animate-bounce"></div>
                <div className="bg-gray-600 rounded-full h-2 w-2 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="bg-gray-600 rounded-full h-2 w-2 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Form Input */}
      <form onSubmit={handleSendMessage} className="border-t border-gray-300 p-2 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan tentang dataset..."
          className="flex-1 py-2 px-3 focus:outline-none rounded-l-lg"
        />
        <button 
          type="submit"
          disabled={isLoading || input.trim() === ''}
          className="bg-blue-600 text-white px-4 py-2 rounded-r-lg disabled:opacity-50"
        >
          Kirim
        </button>
      </form>
      
      {/* Contoh Pertanyaan */}
      <div className="bg-blue-50 p-3 border-t border-blue-100">
        <h4 className="text-sm font-medium text-blue-800 mb-1">Contoh Pertanyaan:</h4>
        <div className="grid grid-cols-2 gap-1 text-xs text-blue-700">
          <div>• Berapa jumlah siswa dalam dataset?</div>
          <div>• Berapa rata-rata skor mata pelajaran?</div>
          <div>• Bagaimana distribusi umur siswa?</div>
          <div>• Apa korelasi antara absensi dan skor?</div>
          <div>• Siapa siswa dengan skor tertinggi?</div>
          <div>• Berikan rekomendasi strategi gamifikasi</div>
        </div>
      </div>
    </div>
  );
};

export default DatasetChatbot;