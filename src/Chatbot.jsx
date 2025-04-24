// src/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { sendMessageToGroq, isDatasetQuestion, queryDataset } from './service/api';
import { Link } from 'react-router-dom';
import Navibar from './components/layout/Navibar';

const Chatbot = () => {
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
      text: "Halo! Saya adalah chatbot AI yang dapat membantu menjawab pertanyaan Anda. Saya juga bisa menganalisis dataset edukasi AI gamifikasi anak. Apa yang ingin Anda tanyakan?", 
      sender: 'bot' 
    };
    setMessages([welcomeMessage]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Mendapatkan respons dari Groq API
  const getGroqResponse = async (userMessage) => {
    try {
      // Format riwayat pesan untuk API
      const messageHistory = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      // Tambahkan pesan terbaru
      messageHistory.push({
        role: 'user',
        content: userMessage
      });
      
      // Tambahkan sistem prompt untuk memberikan konteks pada AI
      const systemPrompt = {
        role: 'system',
        content: `Anda adalah asisten AI yang membantu dalam memberikan informasi yang akurat dan bermanfaat. 
                 Anda menggunakan Bahasa Indonesia yang baik dan benar.
                 Berikan jawaban yang singkat dan jelas, kecuali diminta lebih detail.
                 Jika Anda tidak yakin atau tidak memiliki informasi yang cukup, berikan jawaban yang jujur bahwa Anda tidak memiliki cukup informasi.`
      };
      
      // Kirim ke API Groq dengan sistem prompt
      const allMessages = [systemPrompt, ...messageHistory];
      const response = await sendMessageToGroq(allMessages);
      return response;
    } catch (error) {
      console.error('Error mendapatkan respons dari Groq:', error);
      throw error;
    }
  };

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
      let botResponse;
      
      // Periksa apakah pertanyaan berkaitan dengan dataset
      if (isDatasetQuestion(currentInput)) {
        // Jika ya, gunakan backend Python untuk menjawab
        botResponse = await queryDataset(currentInput);
      } else {
        // Jika tidak, gunakan Groq API
        botResponse = await getGroqResponse(currentInput);
      }
      
      const botMessage = { 
        text: botResponse, 
        sender: 'bot' 
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error dalam respons:', error);
      
      let errorMessage;
      if (error.message.includes('API key')) {
        errorMessage = "Maaf, terjadi masalah dengan API key. Pastikan Anda telah mengonfigurasi API key Groq di file .env.";
      } else if (error.message.includes('backend Python')) {
        errorMessage = "Maaf, terjadi masalah saat menghubungi backend Python. Pastikan server Python berjalan di http://localhost:5000.";
      } else {
        errorMessage = "Maaf, terjadi kesalahan saat memproses pertanyaan Anda. Silakan coba lagi nanti.";
      }
      
      const botMessage = { 
        text: errorMessage, 
        sender: 'bot' 
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <nav className="navbar fixed w-full bg-biru-dasar flex justify-between items-center font-poppins shadow-lg ">
        <div className="logoPort">
          <h1 className="text-emerald-50 text-2xl font-bold p-[15px]">MindaGrow</h1>
        </div>
        <div className="navButton font-poppins p-[15px] text-amber-50 font-medium">
          <ul className="flex space-x-5"> 
            <li><Link to='/'>Back To Home</Link></li>
          
          </ul>
        </div>
      </nav>
      
      <div className="pt-[100px] flex flex-col h-150 border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
        {/* Header Chatbot */}
        <div className="bg-blue-600 text-white px-4 py-3 flex items-center">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
            <span className="text-blue-600 text-xl">🤖</span>
          </div>
          <div>
            <h3 className="font-medium">AI Chatbot</h3>
            <p className="text-xs opacity-80">Powered by Groq API + Python Analytics</p>
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
            placeholder="Ketik pesan..."
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
      </div>
    </div>
  );
};

export default Chatbot;