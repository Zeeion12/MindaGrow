// src/App.jsx
import Chatbot from './Chatbot';
import Navibar from './Navibar';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navibar />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">Aplikasi Chatbot AI Sederhana</h1>
        <Chatbot />
      </div>
    </div>
  );
}

export default App;