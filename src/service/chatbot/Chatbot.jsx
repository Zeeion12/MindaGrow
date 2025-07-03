"use client"

import { sendMessageToGroq, isDatasetQuestion, queryDataset, analyzeStudent, testFlaskConnection } from '../api';
import { useState, useRef, useEffect } from "react"

const Chatbot = ({ onClose }) => {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [nis, setNis] = useState(null)
  const [flaskConnected, setFlaskConnected] = useState(false)
  const messagesEndRef = useRef(null)
  const [pendingAvg, setPendingAvg] = useState(null); // { step: 1|2, subject: '', type: '' }

  // Daftar mapel dan jenis nilai untuk keperluan rata-rata nilai
  const subjects = [
    { key: "mtk", label: "Matematika", backend: "MTK" },
    { key: "bindo", label: "Bahasa Indonesia", backend: "BINDO" },
    { key: "bing", label: "Bahasa Inggris", backend: "BING" },
    { key: "ipa", label: "IPA", backend: "IPA" },
    { key: "ips", label: "IPS", backend: "IPS" },
    { key: "pkn", label: "PKN", backend: "PKN" },
    { key: "seni", label: "Seni", backend: "Seni" },
  ];

  const nilaiTypes = [
    { key: "quiz", label: "Kuis", backend: "Quiz" },
    { key: "tugas", label: "Tugas", backend: "Tugas" },
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
          console.log('✅ Flask backend connected successfully:', result.message);
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

    // Tambahkan pesan selamat datang
    const welcomeMessage = {
      text: "Halo! Saya RoGrow, asisten AI Anda! 🌱\n\nSilakan:\n• Masukkan NIS Anda (contoh: 202301) untuk analisis personal\n• Tanyakan tentang data siswa dan pembelajaran (contoh: rata-rata nilai)\n• Minta tips belajar yang efektif\n\nApa yang ingin Anda ketahui?",
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

      // Cek apakah input adalah NIS (format angka 6-8 digit)
      if (!nis && /^\d{6,8}$/.test(cleanMessage)) {
        setNis(cleanMessage)
        return `✅ NIS ${cleanMessage} berhasil disimpan!\n\n🎯 Sekarang Anda bisa:\n• Ketik "analisis saya" atau "performa saya" untuk melihat hasil belajar\n• Tanyakan tips belajar untuk mata pelajaran tertentu\n• Tanyakan tentang data siswa secara umum`
      }

      // === FLOW RATA-RATA NILAI ===
      // Step 1: User tanya rata-rata nilai
      if (pendingAvg?.step !== 2 && (
        userMessage.toLowerCase().includes('rata-rata nilai') ||
        userMessage.toLowerCase().includes('rata rata nilai') ||
        userMessage.toLowerCase().includes('nilai rata-rata') ||
        userMessage.toLowerCase().includes('nilai rata rata') ||
        (userMessage.toLowerCase().includes('rata') && userMessage.toLowerCase().includes('nilai'))
      )) {
        if (!flaskConnected) {
          return '⚠️ Maaf, sistem data sedang offline. Coba tanyakan tips belajar saja dulu ya! 📚\n\nContoh: "tips belajar matematika" atau "cara belajar efektif"'
        }

        setPendingAvg({ step: 1 });
        return `📊 Rata-rata nilai mata pelajaran apa yang ingin Anda lihat?\n\nPilih salah satu:\n${subjects.map((s, index) => `${index + 1}. ${s.label}`).join('\n')}\n\nAtau ketik nama mata pelajarannya langsung! 😊`;
      }

      // Step 2: User pilih mapel
      if (pendingAvg?.step === 1) {
        let selectedSubject = null;

        // Cek berdasarkan nomor
        const num = parseInt(userMessage.trim());
        if (num >= 1 && num <= subjects.length) {
          selectedSubject = subjects[num - 1];
        } else {
          // Cek berdasarkan nama mata pelajaran
          selectedSubject = subjects.find(s =>
            userMessage.toLowerCase().includes(s.key) ||
            userMessage.toLowerCase().includes(s.label.toLowerCase()) ||
            userMessage.toLowerCase().includes(s.backend.toLowerCase())
          );
        }

        if (selectedSubject) {
          setPendingAvg({ step: 2, subject: selectedSubject });
          return `📚 Anda memilih **${selectedSubject.label}**\n\nIngin melihat rata-rata nilai untuk:\n1. Kuis\n2. Tugas\n\nPilih nomor atau ketik "kuis" atau "tugas"! 📝`;
        } else {
          return `❌ Mata pelajaran tidak dikenali.\n\nSilakan pilih dengan mengetik:\n• Nomor (1-${subjects.length})\n• Nama mata pelajaran\n\nDaftar mata pelajaran:\n${subjects.map((s, index) => `${index + 1}. ${s.label}`).join('\n')}`;
        }
      }

      // Step 3: User pilih jenis nilai
      if (pendingAvg?.step === 2 && pendingAvg.subject) {
        let selectedType = null;

        // Cek berdasarkan nomor
        const num = parseInt(userMessage.trim());
        if (num === 1) {
          selectedType = nilaiTypes[0]; // Kuis
        } else if (num === 2) {
          selectedType = nilaiTypes[1]; // Tugas
        } else {
          // Cek berdasarkan nama
          selectedType = nilaiTypes.find(t =>
            userMessage.toLowerCase().includes(t.key) ||
            userMessage.toLowerCase().includes(t.label.toLowerCase())
          );
        }

        if (selectedType) {
          const subject = pendingAvg.subject;
          setPendingAvg(null); // Reset flow

          // Query ke backend untuk rata-rata dari 30 siswa
          try {
            const query = `rata-rata ${subject.backend} ${selectedType.backend} semua siswa`;
            const answer = await queryDataset(query);
            return `📊 **Rata-rata ${selectedType.label} ${subject.label}** (dari 30 siswa):\n\n${answer}\n\n💡 **Tips**: Nilai ini adalah rata-rata dari seluruh siswa di dataset. Untuk melihat nilai personal, masukkan NIS Anda!`;
          } catch (error) {
            console.error('Error getting average:', error);
            return `❌ Maaf, terjadi kesalahan saat mengambil data rata-rata ${selectedType.label} ${subject.label}. Coba lagi nanti ya! 🔧`;
          }
        } else {
          return `❌ Jenis nilai tidak dikenali.\n\nSilakan pilih:\n1. Kuis\n2. Tugas\n\nAtau ketik "kuis" atau "tugas"`;
        }
      }
      // === END FLOW RATA-RATA NILAI ===

      // Jika sudah ada NIS dan menanyakan performa/analisis personal
      if (nis && (userMessage.toLowerCase().includes('performa') ||
        userMessage.toLowerCase().includes('nilai saya') ||
        userMessage.toLowerCase().includes('analisis saya') ||
        userMessage.toLowerCase().includes('hasil saya'))) {

        if (!flaskConnected) {
          return '⚠️ Maaf, sistem analisis sedang offline. Coba lagi nanti ya! 🔧\n\nSementara itu, saya bisa memberikan tips belajar umum!'
        }

        try {
          const analysis = await analyzeStudent(nis);

          if (analysis.error) {
            return `❌ Maaf, ${analysis.error}.\n\nPastikan NIS sudah benar atau coba lagi nanti! 🤔`
          }

          // Format response yang ramah untuk anak
          let response = `📊 **Analisis Belajar untuk ${analysis.nama}**\n`;
          response += `🆔 NIS: ${analysis.nis}\n\n`;
          response += `🌟 **Mata Pelajaran Terkuat**: ${analysis.mata_pelajaran_terkuat}\n`;
          response += `💪 **Perlu Ditingkatkan**: ${analysis.mata_pelajaran_terlemah}\n\n`;
          response += `💡 **Saran Personal**:\n${analysis.rekomendasi}\n\n`;
          response += `🎯 **Tips Tambahan**: Fokus pada ${analysis.mata_pelajaran_terlemah} dengan latihan rutin 15 menit setiap hari!`;

          return response;
        } catch (error) {
          console.error('Error getting student analysis:', error);
          return '❌ Terjadi kesalahan saat menganalisis data. Coba lagi nanti ya! 🔧';
        }
      }

      // Pertanyaan tentang dataset/data siswa umum (kecuali rata-rata yang sudah dihandle)
      if (isDatasetQuestion(userMessage) && !userMessage.toLowerCase().includes('rata')) {
        if (!flaskConnected) {
          return '⚠️ Maaf, sistem data sedang offline. Coba tanyakan tips belajar saja dulu ya! 📚\n\nContoh: "tips belajar matematika" atau "cara belajar efektif"'
        }

        try {
          const answer = await queryDataset(userMessage);
          return answer || '❌ Maaf, saya tidak bisa memproses pertanyaan tersebut saat ini.';
        } catch (error) {
          console.error('Error querying dataset:', error);
          return '❌ Terjadi kesalahan saat mengakses data. Coba lagi nanti! 🔧';
        }
      }

      // Pertanyaan umum - gunakan AI assistant atau fallback responses
      const response = await sendMessageToGroq([
        {
          role: 'system',
          content: `You are RoGrow, a friendly AI learning assistant for Mindagrow educational platform. 
          You help children aged 5-12 with learning guidance and study tips. 
          Always respond in Indonesian, use encouraging language, and include relevant emojis. 
          Never give direct answers to homework - instead provide learning strategies and tips.
          Keep responses concise and child-friendly. Focus on motivation and learning techniques.`
        },
        { role: 'user', content: userMessage }
      ]);

      return response;

    } catch (error) {
      console.error('Error getting bot response:', error)
      return 'Maaf, saya sedang belajar juga! 🤖 Coba tanya yang lain ya!\n\nAtau ketik NIS Anda untuk analisis personal!'
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (input.trim() === "") return

    const userMessage = {
      text: input,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prevMessages) => [...prevMessages, userMessage])

    const currentInput = input;
    setInput("")
    setIsLoading(true)

    try {
      const botResponse = await getBotResponse(currentInput)
      const botMessage = {
        text: botResponse,
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prevMessages) => [...prevMessages, botMessage])
    } catch (error) {
      console.error("Error:", error)
      const errorMessage = {
        text: "Waduh, saya lagi bingung nih! 😅 Coba tanya yang lain ya!\n\nContoh pertanyaan:\n• Masukkan NIS (angka 6-8 digit)\n• Tips belajar matematika\n• Berapa jumlah siswa?\n• Rata-rata nilai",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prevMessages) => [...prevMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Quick action buttons
  const quickActions = [
    { text: "Tips Belajar", icon: "📚" },
    { text: "Analisis Saya", icon: "📊", disabled: !nis },
    { text: "Jumlah Siswa", icon: "👥" },
    { text: "Rata-rata Nilai", icon: "📈" }
  ];

  const handleQuickAction = (actionText) => {
    if (actionText === "Analisis Saya" && !nis) return;

    setInput(actionText.toLowerCase());
    // Auto submit after short delay
    setTimeout(() => {
      const fakeEvent = { preventDefault: () => { } };
      handleSendMessage(fakeEvent);
    }, 100);
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header Chatbot */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-400 text-white px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center">
          <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4 shadow-lg">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">RoGrow AI Assistant</h3>
            <div className="flex items-center text-sm opacity-90">
              <div className={`h-2 w-2 ${flaskConnected ? 'bg-green-400' : 'bg-yellow-400'} rounded-full mr-2 animate-pulse`}></div>
              <span>{flaskConnected ? 'Online & Ready' : 'Limited Mode'}</span>
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
        <div className="p-4 border-b border-gray-200 bg-white/50">
          <p className="text-sm text-gray-600 mb-3">Aksi Cepat:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.text)}
                disabled={action.disabled}
                className={`flex items-center space-x-2 px-3 py-2 rounded-full text-sm transition-all duration-200 ${action.disabled
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:scale-105'
                  }`}
              >
                <span>{action.icon}</span>
                <span>{action.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Area Chat */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex items-end space-x-2 max-w-xs lg:max-w-md xl:max-w-lg ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
            >
              {/* Avatar */}
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.sender === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gradient-to-br from-green-400 to-blue-500 text-white"
                  }`}
              >
                {message.sender === "user" ? "👤" : "🤖"}
              </div>

              {/* Message Bubble */}
              <div className="flex flex-col">
                <div
                  className={`px-4 py-3 rounded-2xl shadow-md ${message.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white text-gray-800 rounded-bl-md border border-gray-100"
                    }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">
                    {message.text}
                  </p>
                </div>
                <span
                  className={`text-xs text-gray-500 mt-1 ${message.sender === "user" ? "text-right" : "text-left"}`}
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
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-500 text-white flex items-center justify-center flex-shrink-0">
                🤖
              </div>
              <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-md border border-gray-100">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"></div>
                  <div
                    className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-2 w-2 bg-blue-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

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
                  ? "Tanyakan 'analisis saya', tips belajar, atau data siswa..."
                  : "Masukkan NIS (6-8 digit), 'rata-rata nilai', atau tanyakan tips belajar..."
              }
              className="w-full py-3 px-4 pr-12 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-400 text-sm">💬</span>
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading || input.trim() === ""}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2"
          >
            <span>Kirim</span>
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>

        {/* Status Info */}
        <div className="mt-2 text-center">
          <p className="text-xs text-gray-500">
            {flaskConnected ? (
              <span className="text-green-600">🟢 Sistem online - Semua fitur tersedia</span>
            ) : (
              <span className="text-yellow-600">🟡 Mode terbatas - Tips belajar tersedia</span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default Chatbot