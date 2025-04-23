import { useState, useEffect, useRef } from 'react';
import Navibar from './Navibar';

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
          model: 'llama3-8b-8192', // Groq's model
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
      // Add welcome message
      setMessages([{
        role: 'assistant',
        content: 'Hello! I\'m your AI assistant. How can I help you today?'
      }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-putih-second text-white">
      
      {!keySubmitted ? (
        <Navibar/>,
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
            <h1 className="text-2xl font-bold mb-4 text-center text-biru-dasar">MindaGrow AI Chatbot</h1>
            <p className="mb-4 text-black">Please enter your API key to start:</p>
            <form onSubmit={handleKeySubmit} className="flex flex-col">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="border rounded-md p-2 mb-4 bg-white-700 text-black border-gray-600"
                placeholder="gsk_..."
                required
              />
              <button
                type="submit"
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              >
                Start Chatting
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <header className="bg-biru-dasar text-white p-4 shadow-md">
            <h1 className="text-xl font-semibold">MindaGrow Chatbot</h1>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-3xl mx-auto">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`mb-4 ${
                    message.role === 'user' 
                      ? 'ml-auto bg-biru-dasar text-white' 
                      : 'mr-auto bg-white text-black'
                  } rounded-lg p-3 max-w-xs md:max-w-md`}
                >
                  {message.content}
                </div>
              ))}
              {errorMessage && (
                <div className="text-red-400 text-sm mb-4">Error: {errorMessage}</div>
              )}
              {isLoading && (
                <div className="mr-auto bg-gray-700 text-white rounded-lg p-3 max-w-xs md:max-w-md">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          <footer className="p-4 border-t border-gray-700">
            <form onSubmit={handleSendMessage} className="max-w-3xl mx-auto flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 border rounded-l-md p-2 bg-white text-black border-gray-600"
                placeholder="Type a message..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className={`bg-biru-dasar text-white py-2 px-4 rounded-r-md ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
                }`}
                disabled={isLoading}
              >
                Send
              </button>
            </form>
          </footer>
        </>
      )}
    </div>
  );
}
