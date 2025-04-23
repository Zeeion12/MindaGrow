export default function Chatbot() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="chatbot-container w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="chatbot-header bg-blue-600 p-4 text-center">
          <h2 className="text-xl font-semibold text-white">Chatbot</h2>
        </div>
        
        <div className="chatbot-messages h-96 overflow-y-auto p-4 space-y-4">
          {/* Example messages to show styling */}
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-2 rounded-lg bg-gray-200 text-gray-800 rounded-tl-none">
              Hello! How can I help you today?
            </div>
          </div>
          
          <div className="flex justify-end">
            <div className="max-w-[80%] px-4 py-2 rounded-lg bg-blue-600 text-white rounded-tr-none">
              I have a question about your services.
            </div>
          </div>
          
          <div className="flex justify-start">
            <div className="max-w-[80%] px-4 py-2 rounded-lg bg-gray-200 text-gray-800 rounded-tl-none">
              Sure, I'd be happy to help with any questions about our services!
            </div>
          </div>
        </div>
        
        <div className="chatbot-input p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              placeholder="Type your message..." 
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button 
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    );
}