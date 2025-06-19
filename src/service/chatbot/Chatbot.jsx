"use client"

import { useState, useRef, useEffect } from "react"

const Chatbot = ({ onClose }) => {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  // Auto-scroll ke pesan terbaru
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Tambahkan pesan selamat datang saat pertama kali dibuka
  useEffect(() => {
    const welcomeMessage = {
      text: "Halo! Saya RoGrow, asisten AI Anda! 🌱 Saya siap membantu menjawab pertanyaan tentang pembelajaran dan menganalisis dataset edukasi. Ada yang bisa saya bantu hari ini?",
      sender: "bot",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages([welcomeMessage])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Simulasi respons bot (ganti dengan API call yang sebenarnya)
  const getBotResponse = async (userMessage) => {
    // Simulasi delay
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000))

    // Respons sederhana untuk demo
    const responses = [
      "Terima kasih atas pertanyaannya! Saya sedang memproses informasi untuk memberikan jawaban terbaik.",
      "Itu pertanyaan yang menarik! Berdasarkan analisis saya, berikut penjelasannya...",
      "Saya senang bisa membantu! Mari kita bahas topik ini lebih dalam.",
      "Pertanyaan yang bagus! Saya akan cari informasi yang relevan untuk Anda.",
    ]

    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()

    if (input.trim() === "") return

    // Tambahkan pesan pengguna
    const userMessage = {
      text: input,
      sender: "user",
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    }
    setMessages((prevMessages) => [...prevMessages, userMessage])

    // Reset input dan tampilkan loading
    const currentInput = input
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
        text: "Maaf, terjadi kesalahan. Silakan coba lagi dalam beberapa saat.",
        sender: "bot",
        timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages((prevMessages) => [...prevMessages, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

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
              <div className="h-2 w-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span>Online & Ready to Help</span>
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

      {/* Area Chat */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
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
                  <p className="text-sm leading-relaxed">
                    {message.text.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < message.text.split("\n").length - 1 && <br />}
                      </span>
                    ))}
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
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div
                    className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
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
              placeholder="Ketik pesan Anda di sini..."
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
      </div>
    </div>
  )
}

export default Chatbot
