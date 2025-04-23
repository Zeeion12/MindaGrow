// src/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';
import { sendMessageToGroq } from './service/api';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
      // Tetap memberikan pesan error yang informatif kepada pengguna
      return "Maaf, terjadi kesalahan saat berkomunikasi dengan API. Mohon periksa koneksi internet Anda atau coba lagi nanti.";
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
      // Selalu gunakan Groq API untuk respons
      const botResponse = await getGroqResponse(currentInput);
      const botMessage = { 
        text: botResponse, 
        sender: 'bot' 
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } catch (error) {
      console.error('Error dalam respons API:', error);
      const botMessage = { 
        text: "Maaf, terjadi kesalahan saat mencoba mendapatkan respons. Mohon periksa koneksi internet Anda dan coba lagi.", 
        sender: 'bot' 
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-96 max-w-md mx-auto border border-gray-300 rounded-lg overflow-hidden bg-white shadow-lg">
      {/* Header Chatbot */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center">
        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center mr-3">
          <span className="text-blue-600 text-xl">🤖</span>
        </div>
        <div>
          <h3 className="font-medium">AI Chatbot</h3>
          <p className="text-xs opacity-80">Powered by Groq API</p>
        </div>
      </div>
      
      {/* Area Chat */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>Mulai percakapan dengan AI Chatbot</p>
          </div>
        ) : (
          messages.map((message, index) => (
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
          ))
        )}
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
  );
};

export default Chatbot;