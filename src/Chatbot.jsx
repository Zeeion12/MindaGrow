// src/Chatbot.jsx
import { useState, useRef, useEffect } from 'react';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Responses dari AI sederhana
  const botResponses = {
    "halo": "Halo! Apa kabar?",
    "hai": "Hai! Ada yang bisa saya bantu?",
    "selamat pagi": "Selamat pagi! Semoga hari Anda menyenangkan!",
    "selamat siang": "Selamat siang! Ada yang bisa saya bantu hari ini?",
    "selamat malam": "Selamat malam! Bagaimana hari Anda?",
    "bantuan": "Saya dapat membantu Anda dengan berbagai informasi. Cukup tanyakan saja!",
    "terima kasih": "Sama-sama! Senang bisa membantu.",
    "siapa kamu": "Saya adalah chatbot AI sederhana yang dibuat untuk membantu Anda.",
    "apa kabar": "Saya baik-baik saja, terima kasih! Bagaimana dengan Anda?",
    "bye": "Sampai jumpa lagi! Semoga hari Anda menyenangkan!"
  };

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Mendapatkan respons dari 'AI'
  const getBotResponse = (userInput) => {
    const input = userInput.toLowerCase().trim();
    
    // Coba cari jawaban langsung
    for (const [key, value] of Object.entries(botResponses)) {
      if (input.includes(key)) {
        return value;
      }
    }
    
    // Jika tidak ada jawaban yang cocok
    if (input.includes("?")) {
      return "Pertanyaan yang menarik! Saya masih belajar untuk menjawabnya.";
    } else {
      return "Maaf, saya tidak mengerti maksud Anda. Coba ungkapkan dengan cara lain atau tanyakan sesuatu yang berbeda.";
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (input.trim() === '') return;
    
    // Tambahkan pesan pengguna
    const userMessage = { text: input, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Reset input dan tampilkan loading
    setInput('');
    setIsLoading(true);
    
    // Simulasi delay respons AI (untuk pengalaman yang lebih realistis)
    setTimeout(() => {
      const botMessage = { 
        text: getBotResponse(input), 
        sender: 'bot' 
      };
      setMessages(prevMessages => [...prevMessages, botMessage]);
      setIsLoading(false);
    }, 1000);
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
          <p className="text-xs opacity-80">Online</p>
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
                {message.text}
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