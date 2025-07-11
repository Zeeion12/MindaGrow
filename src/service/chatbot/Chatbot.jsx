"use client"

import { sendMessageToOpenAI, isDatasetQuestion, queryDataset, analyzeStudent, getStudentPredictions, testFlaskConnection } from '../api';
import { useState, useRef, useEffect } from "react"

const Chatbot = ({ onClose }) => {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [nis, setNis] = useState(null)
  const [flaskConnected, setFlaskConnected] = useState(false)
  const [studentData, setStudentData] = useState(null)
  const messagesEndRef = useRef(null)
  const [pendingAction, setPendingAction] = useState(null) // { type: 'analysis', 'predictions', 'subject_avg', data: {} }

  // Daftar mata pelajaran
  const subjects = [
    { key: "mtk", label: "Matematika", backend: "MTK" },
    { key: "bindo", label: "Bahasa Indonesia", backend: "BINDO" },
    { key: "bing", label: "Bahasa Inggris", backend: "BING" },
    { key: "ipa", label: "IPA", backend: "IPA" },
    { key: "ips", label: "IPS", backend: "IPS" },
    { key: "pkn", label: "PKN", backend: "PKN" },
    { key: "seni", label: "Seni Budaya", backend: "Seni" },
  ];

  const nilaiTypes = [
    { key: "quiz", label: "Kuis", backend: "Quiz" },
    { key: "tugas", label: "Tugas", backend: "Tugas" },
  ];

  // Quick actions untuk user
  const quickActions = [
    { icon: "🔍", text: "Analisis Performa", action: "analysis", disabled: !nis },
    { icon: "🔮", text: "Prediksi Belajar", action: "predictions", disabled: !nis },
    { icon: "📊", text: "Rata-rata Nilai", action: "average", disabled: false },
    { icon: "💡", text: "Tips Belajar", action: "tips", disabled: false }
  ];

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Test koneksi Flask saat component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const result = await testFlaskConnection();
        if (result && result.status === 'success') {
          setFlaskConnected(true);
          console.log('✅ Flask backend connected:', result.message);
        } else {
          setFlaskConnected(false);
          console.log('❌ Flask backend not connected');
        }
      } catch (error) {
        setFlaskConnected(false);
        console.error('❌ Flask connection test failed:', error);
      }
    };

    testConnection();

    // Tambahkan pesan selamat datang yang lebih informatif
    const welcomeMessage = {
      text: "Halo! Saya RoGrow dengan teknologi OpenAI! 🤖✨\n\n🌟 **Fitur Baru:**\n• Analisis performa siswa mendalam\n• Prediksi pola belajar berdasarkan chart\n• Rekomendasi personal untuk setiap mata pelajaran\n• Tips belajar yang disesuaikan dengan kemampuan\n\n📝 **Mulai dengan:**\n• Masukkan NIS Anda untuk analisis personal\n• Tanyakan tentang data siswa atau pembelajaran\n• Minta tips belajar yang efektif\n\nApa yang ingin Anda ketahui?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages([welcomeMessage])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const getBotResponse = async (userMessage) => {
    try {
      const cleanMessage = userMessage.trim();

      // === NIS DETECTION & VALIDATION ===
      if (!nis && /^\d{6,8}$/.test(cleanMessage)) {
        setNis(cleanMessage)
        
        // Load student data jika Flask connected
        if (flaskConnected) {
          try {
            const analysis = await analyzeStudent(cleanMessage);
            if (analysis.success) {
              setStudentData(analysis.data);
              return `✅ **NIS ${cleanMessage} berhasil diidentifikasi!**\n\n👤 **Siswa:** ${analysis.data.nama}\n🎓 **Kelas:** ${analysis.data.kelas}\n\n🎯 **Sekarang Anda bisa:**\n• Ketik "analisis saya" untuk performa lengkap\n• Ketik "prediksi saya" untuk rekomendasi berdasarkan chart\n• Tanyakan tips belajar personal\n• Tanyakan tentang mata pelajaran tertentu\n\n✨ **AI OpenAI siap membantu pembelajaran Anda!**`;
            }
          } catch (error) {
            console.error('Error loading student data:', error);
          }
        }
        
        return `✅ **NIS ${cleanMessage} tersimpan!**\n\n🎯 **Anda sekarang bisa:**\n• Ketik "analisis saya" untuk melihat performa lengkap\n• Ketik "prediksi saya" untuk rekomendasi chart-based\n• Tanyakan tips belajar yang dipersonalisasi\n• Tanyakan tentang mata pelajaran spesifik\n\n${flaskConnected ? '🟢 Sistem analisis online!' : '🟡 Mode terbatas - analisis akan tersedia saat sistem online'}`;
      }

      // === FLOW RATA-RATA NILAI ===
      if (pendingAction?.type === 'subject_selection') {
        let selectedSubject = null;
        const num = parseInt(cleanMessage);
        
        if (num >= 1 && num <= subjects.length) {
          selectedSubject = subjects[num - 1];
        } else {
          selectedSubject = subjects.find(s =>
            cleanMessage.toLowerCase().includes(s.key) ||
            cleanMessage.toLowerCase().includes(s.label.toLowerCase()) ||
            cleanMessage.toLowerCase().includes(s.backend.toLowerCase())
          );
        }

        if (selectedSubject) {
          setPendingAction({ type: 'value_type_selection', subject: selectedSubject });
          return `📚 **${selectedSubject.label} dipilih!**\n\nTipe nilai apa yang ingin dilihat?\n\n1. Kuis\n2. Tugas\n\nPilih nomor atau ketik "kuis"/"tugas"! 📝`;
        } else {
          return `❌ Mata pelajaran tidak dikenali.\n\nSilakan pilih:\n${subjects.map((s, index) => `${index + 1}. ${s.label}`).join('\n')}\n\nAtau ketik nama mata pelajarannya! 📚`;
        }
      }

      if (pendingAction?.type === 'value_type_selection') {
        let selectedType = null;
        const num = parseInt(cleanMessage);
        
        if (num === 1) selectedType = nilaiTypes[0];
        else if (num === 2) selectedType = nilaiTypes[1];
        else {
          selectedType = nilaiTypes.find(t =>
            cleanMessage.toLowerCase().includes(t.key) ||
            cleanMessage.toLowerCase().includes(t.label.toLowerCase())
          );
        }

        if (selectedType) {
          const subject = pendingAction.subject;
          setPendingAction(null);

          if (!flaskConnected) {
            return `📊 **${selectedType.label} ${subject.label}**\n\n⚠️ Sistem sedang offline, tidak bisa mengakses data real-time.\n\nTapi saya bisa memberikan tips belajar ${subject.label}! 💡`;
          }

          try {
            const query = `rata-rata ${subject.backend} ${selectedType.backend} semua siswa`;
            const answer = await queryDataset(query);
            return `📊 **Rata-rata ${selectedType.label} ${subject.label}** (30 siswa):\n\n${answer}\n\n💡 **Info:** Data ini mencakup seluruh siswa. Untuk analisis personal, gunakan "analisis saya"!`;
          } catch (error) {
            return `❌ Gagal mengambil data ${selectedType.label} ${subject.label}. Coba lagi nanti! 🔧`;
          }
        } else {
          return `❌ Pilihan tidak dikenali.\n\nSilakan pilih:\n1. Kuis\n2. Tugas\n\nAtau ketik "kuis" atau "tugas"`;
        }
      }

      // === ANALISIS PERSONAL SISWA ===
      if (nis && (cleanMessage.toLowerCase().includes('analisis saya') ||
        cleanMessage.toLowerCase().includes('performa saya') ||
        cleanMessage.toLowerCase().includes('hasil saya'))) {
        
        if (!flaskConnected) {
          return '⚠️ **Sistem analisis sedang offline**\n\nSementara itu saya bisa:\n• Memberikan tips belajar umum\n• Berbagi strategi pembelajaran\n• Motivasi belajar\n\nTanyakan tips untuk mata pelajaran tertentu! 📚✨'
        }

        try {
          const analysis = await analyzeStudent(nis);
          if (analysis.error) {
            return `❌ **${analysis.error}**\n\nPastikan NIS sudah benar atau coba lagi nanti! 🤔`;
          }

          setStudentData(analysis.data);
          return analysis.formatted_response;
        } catch (error) {
          console.error('Error getting analysis:', error);
          return '❌ Terjadi kesalahan saat menganalisis data. Coba lagi nanti ya! 🔧';
        }
      }

      // === PREDIKSI BERDASARKAN CHART ===
      if (nis && (cleanMessage.toLowerCase().includes('prediksi saya') ||
        cleanMessage.toLowerCase().includes('prediksi belajar') ||
        cleanMessage.toLowerCase().includes('rekomendasi chart'))) {
        
        if (!flaskConnected) {
          return '⚠️ **Sistem prediksi sedang offline**\n\nSementara itu, tips umum berdasarkan chart dashboard:\n\n📊 **Total Durasi Belajar:** Usahakan konsisten 45-60 menit/hari\n📈 **Rata-rata Skor:** Review materi yang skornya di bawah 75\n📚 **Mata Pelajaran Sering Diakses:** Variasikan dengan mapel yang jarang dibuka\n\nTanyakan tips spesifik ya! 💡'
        }

        try {
          const predictions = await getStudentPredictions(nis);
          if (predictions.error) {
            return `❌ **${predictions.error}**\n\nCoba lagi nanti atau minta analisis umum dulu! 🤔`;
          }

          return predictions.formatted_response;
        } catch (error) {
          console.error('Error getting predictions:', error);
          return '❌ Terjadi kesalahan saat menganalisis prediksi. Coba lagi nanti! 🔧';
        }
      }

      // === RATA-RATA NILAI TRIGGER ===
      if ((cleanMessage.toLowerCase().includes('rata-rata nilai') ||
        cleanMessage.toLowerCase().includes('rata rata nilai') ||
        cleanMessage.toLowerCase().includes('nilai rata-rata')) &&
        !pendingAction) {
        
        setPendingAction({ type: 'subject_selection' });
        return `📊 **Rata-rata nilai mata pelajaran mana yang ingin dilihat?**\n\n${subjects.map((s, index) => `${index + 1}. ${s.label}`).join('\n')}\n\nPilih nomor atau ketik nama mata pelajarannya! 😊`;
      }

      // === DATASET QUESTIONS ===
      if (isDatasetQuestion(cleanMessage)) {
        if (!flaskConnected) {
          return '⚠️ **Sistem data sedang offline**\n\nSementara itu coba:\n• Tanyakan tips belajar\n• Minta motivasi pembelajaran\n• Strategi belajar efektif\n\nContoh: "tips belajar matematika" 📚✨'
        }

        try {
          const answer = await queryDataset(cleanMessage);
          return answer || '❌ Maaf, tidak bisa memproses pertanyaan tersebut saat ini.';
        } catch (error) {
          console.error('Error querying dataset:', error);
          return '❌ Terjadi kesalahan saat mengakses data. Coba lagi nanti! 🔧';
        }
      }

      // === OPENAI CHAT UNTUK PERTANYAAN UMUM ===
      const conversationHistory = messages.slice(-4).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      }));
      
      conversationHistory.push({
        role: 'user',
        content: cleanMessage
      });

      const response = await sendMessageToOpenAI(conversationHistory, nis);
      return response;

    } catch (error) {
      console.error('Error getting bot response:', error)
      return 'Maaf, saya sedang belajar juga! 🤖 Coba tanya yang lain ya!\n\n💡 **Saran:**\n• Masukkan NIS untuk analisis personal\n• Tanyakan tips belajar\n• Minta prediksi berdasarkan chart'
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = {
      text: input.trim(),
      sender: "user",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const botResponse = await getBotResponse(input.trim())
      const botMessage = {
        text: botResponse,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      const errorMessage = {
        text: "Maaf, terjadi kesalahan! Coba lagi ya! 😅",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickAction = async (action) => {
    let message = "";
    
    switch (action) {
      case 'analysis':
        message = "analisis saya";
        break;
      case 'predictions':
        message = "prediksi saya";
        break;
      case 'average':
        message = "rata-rata nilai";
        break;
      case 'tips':
        message = "tips belajar efektif";
        break;
      default:
        return;
    }

    setInput(message);
    // Auto-send the message
    const syntheticEvent = { preventDefault: () => {} };
    setInput(message);
    setTimeout(() => {
      handleSendMessage(syntheticEvent);
    }, 100);
  }

  return (
    <div className="flex flex-col h-[600px] w-[400px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 text-white p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
            🤖
          </div>
          <div>
            <h3 className="font-semibold text-lg">RoGrow AI</h3>
            <div className="flex items-center text-sm opacity-90">
              <div className={`h-2 w-2 ${flaskConnected ? 'bg-green-400' : 'bg-yellow-400'} rounded-full mr-2 animate-pulse`}></div>
              <span>{flaskConnected ? 'OpenAI Ready' : 'Limited Mode'}</span>
              {nis && <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">NIS: {nis}</span>}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors duration-200"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Quick Actions */}
      {!isLoading && messages.length <= 2 && (
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <p className="text-sm text-gray-600 mb-3 font-medium">⚡ Aksi Cepat:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.action)}
                disabled={action.disabled}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
                  action.disabled
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 shadow-sm hover:shadow-md hover:scale-105'
                }`}
              >
                <span>{action.icon}</span>
                <span className="font-medium">{action.text}</span>
              </button>
            ))}
          </div>
          {!nis && (
            <div className="mt-3 p-2 bg-blue-100 rounded-lg">
              <p className="text-xs text-blue-700">💡 Masukkan NIS untuk membuka fitur analisis personal!</p>
            </div>
          )}
        </div>
      )}

      {/* Area Chat */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex items-end space-x-2 max-w-xs lg:max-w-md xl:max-w-lg ${
                message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
              }`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.sender === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gradient-to-br from-purple-500 to-teal-500 text-white shadow-md"
                }`}
              >
                {message.sender === "user" ? "👤" : "🤖"}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col">
                <div
                  className={`px-4 py-3 rounded-2xl shadow-md ${
                    message.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {message.text.split('\n').map((line, index) => {
                      // Format markdown-style text
                      if (line.includes('**') && line.includes('**')) {
                        // Bold text
                        const parts = line.split('**');
                        return (
                          <span key={index}>
                            {parts.map((part, i) => 
                              i % 2 === 1 ? (
                                <strong key={i} className="font-bold text-blue-700">{part}</strong>
                              ) : (
                                <span key={i}>{part}</span>
                              )
                            )}
                            <br />
                          </span>
                        );
                      }
                      
                      // Chart analysis headers
                      if (line.includes('📊') || line.includes('📈') || line.includes('🔮')) {
                        return (
                          <div key={index} className="font-semibold text-purple-700 mt-2 mb-1">
                            {line}
                          </div>
                        );
                      }
                      
                      // Insights and actions
                      if (line.includes('💡') || line.includes('🎯') || line.includes('⏱️')) {
                        return (
                          <div key={index} className="ml-3 text-gray-700 mb-1">
                            {line}
                          </div>
                        );
                      }
                      
                      // Subject details
                      if (line.includes('🔢') || line.includes('📚') || line.includes('🌍') || 
                          line.includes('🧪') || line.includes('🌏') || line.includes('🏛️') || 
                          line.includes('🎨')) {
                        return (
                          <div key={index} className="bg-gray-50 p-2 rounded my-1 border-l-2 border-blue-300">
                            {line}
                          </div>
                        );
                      }
                      
                      // Priority items
                      if (line.includes('• **Prioritas') || line.includes('• **Pertahankan')) {
                        return (
                          <div key={index} className="ml-4 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400 my-1">
                            {line}
                          </div>
                        );
                      }
                      
                      // Target items
                      if (line.includes('• Naikkan') || line.includes('• Konsisten') || line.includes('• Selesaikan')) {
                        return (
                          <div key={index} className="ml-4 p-2 bg-green-50 rounded border-l-2 border-green-400 my-1">
                            {line}
                          </div>
                        );
                      }
                      
                      // Regular line
                      return <div key={index} className="mb-1">{line}</div>;
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs text-gray-500 mt-1 ${
                    message.sender === "user" ? "text-right" : "text-left"
                  }`}
                >
                  {message.timestamp}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Loading Animation */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-end space-x-2 max-w-xs">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                🤖
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-md border border-gray-100">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-purple-400 rounded-full animate-bounce"></div>
                  <div
                    className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-2 w-2 bg-teal-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Student Info Bar (jika ada data siswa) */}
      {studentData && (
        <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-blue-100 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-green-600 font-medium">📚 {studentData.nama}</span>
              <span className="text-gray-500">•</span>
              <span className="text-blue-600">🎯 {studentData.terkuat}</span>
            </div>
            <div className="text-xs text-gray-500">
              Avg: {studentData.overall_stats?.rata_rata_keseluruhan?.toFixed(1) || 'N/A'}
            </div>
          </div>
        </div>
      )}

      {/* Form Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSendMessage} className="flex space-x-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                nis
                  ? "Tanyakan analisis, prediksi, atau tips belajar..."
                  : "Masukkan NIS atau tanyakan sesuatu..."
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
              disabled={isLoading}
            />
            {!flaskConnected && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="h-2 w-2 bg-yellow-400 rounded-full animate-pulse" title="Limited Mode"></div>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </form>
        
        {/* Status Info */}
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <span className={`h-2 w-2 rounded-full ${flaskConnected ? 'bg-green-400' : 'bg-yellow-400'}`}></span>
            <span>{flaskConnected ? 'OpenAI + Data Analytics Ready' : 'Basic AI Mode (Tips & General Help)'}</span>
          </div>
          {nis && (
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
              Student Mode Active
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chatbot