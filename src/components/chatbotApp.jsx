import { useState, useEffect, useRef } from 'react';

export default function ChatbotApp() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [keySubmitted, setKeySubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, errorData);
        throw new Error(`API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const aiMessage = { 
        role: 'assistant', 
        content: data.choices[0].message.content 
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error calling Groq API:', error);
      setErrorMessage(error.message || 'Error connecting to the API');
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I had trouble processing your request. Please try again later.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeySubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      setKeySubmitted(true);
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. How can I help you today?'
      }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      {!keySubmitted ? (
        <div className="flex flex-col items-center justify-center h-full bg-gradient-to-b from-blue-900 to-gray-900">
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-blue-700">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-300">AI Chatbot</h1>
            <p className="mb-6 text-gray-300">Masukkan API key Groq untuk memulai:</p>
            <form onSubmit={handleKeySubmit} className="flex flex-col">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="border rounded-lg p-3 mb-6 bg-gray-700 text-white border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="gsk_..."
                required
              />
              <button
                type="submit"
                className="bg-blue-800 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors duration-300 font-medium shadow-lg"
              >
                Mulai Percakapan
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <header className="bg-blue-900 text-white p-4 shadow-md">
            <div className="max-w-4xl mx-auto flex items-center">
              <h1 className="text-2xl font-bold">AI Chatbot</h1>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-900 to-blue-900">
            <div className="max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`mb-6 ${
                    message.role === 'user' 
                      ? 'ml-auto' 
                      : 'mr-auto'
                  } max-w-xs md:max-w-md lg:max-w-lg animate-fade-in`}
                >
                  <div className={`p-4 rounded-2xl shadow-lg ${
                    message.role === 'user'
                      ? 'bg-blue-800 text-white rounded-br-none'
                      : 'bg-gray-800 text-gray-100 rounded-bl-none border-l-4 border-blue-500'
                  }`}>
                    {message.content}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 px-2">
                    {message.role === 'user' ? 'Anda' : 'AI Assistant'}
                  </div>
                </div>
              ))}
              {errorMessage && (
                <div className="text-red-400 text-sm mb-4 p-3 bg-red-900 bg-opacity-30 rounded-lg">
                  Error: {errorMessage}
                </div>
              )}
              {isLoading && (
                <div className="mr-auto max-w-xs md:max-w-md mb-6">
                  <div className="bg-gray-800 text-white rounded-2xl p-4 rounded-bl-none border-l-4 border-blue-500 shadow-lg">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 px-2">
                    AI Assistant
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <footer className="p-4 border-t border-blue-800 bg-gray-900">
            <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 border rounded-l-lg p-3 bg-gray-800 text-white border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ketik pesan..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`bg-blue-800 text-white py-3 px-6 rounded-r-lg ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700 transition-colors duration-300'
                } font-medium`}
                disabled={isLoading}
              >
                Kirim
              </button>
            </form>
          </footer>
        </>
      )}
    </div>
  );
}