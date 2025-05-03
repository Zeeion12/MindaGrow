
import { useState } from "react"

const initialMessages = [
    {
        id: 1,
        sender: "teacher",
        username: "username 1", // Teacher username
        message: "Mantap ITO!! Semangatttt",
        timestamp: "kemarin, 19 April 2025 11.56",
        avatar: "/placeholder.svg?height=60&width=60",
    },
    {
        id: 2,
        sender: "student",
        username: "username 2", // Student username
        message: "Hehehee, makasi ibu!",
        timestamp: "kemarin, 19 April 2025 13.01",
        avatar: "/placeholder.svg?height=60&width=60",
    }
]


export default function CardKomenGuru () {

    // Untuk menyimpan pesan yang ada di chat
    const [messages, setMessages] = useState(initialMessages)
    // Untuk menyimpan pesan yang baru dikirim
    const [newMessage, setNewMessage] = useState("")

    // 
    const handleSendMessage = (e) => {
        e.preventDefault()
        if (newMessage.trim() === "") return

        // Menambahkan pesan baru ke dalam array messages
        const newMsg = {
            id: messages.length + 1, // ID baru untuk pesan
            sender: "student", 
            username: "username 2", // Student username
            message: newMessage, // Pesan yang baru dikirim
            
            // Menggunakan format tanggal dan waktu lokal
            timestamp: new Date().toLocaleString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            }),
            avatar: "/placeholder.svg?height=60&width=60",
        }

        setMessages([...messages, newMsg]) // Menambahkan pesan baru ke dalam array messages
        setNewMessage("") // Mengosongkan input setelah mengirim pesan
    }
        


    return (
        <div className="max-w-md  bg-white rounded-3xl shadow-lg overflow-hidden border border-blue-100">    
            <div className="p-6 space-y-6"> 
                <h2 className="text-2xl font-bold text-gray-900">Komentar guru tentang anda</h2>

                <div className="space-y-6">
                    {messages.map((msg) => (
                        <div key={msg.id} className="flex flex-col">
                            <div className={`flex items-start gap-3 ${msg.sender === "student" ? "flex-row-reverse" : ""}`}>

                                {/* Avatar */}
                                <div className={`w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ${msg.sender === "teacher" ? "bg-purple-300" : "student" ? "bg-biru-dasar" : ""}`}>
                                    {/* <img  src={msg.avatar || "/placeholder.svg"}
                                    alt={`${msg.username} avatar`} className="w-full h-full object-cover"/> */}
                                </div>

                                {/* Isi Pesan */}
                                <div className={`flex-1 ${msg.sender === "student" ? "text-right" : "text-left"}`}>
                                    {/* Username */}
                                    <p className={`text-sm font-semibold mb-1 ${msg.sender === "teacher" ? "text-purple-700" : "text-blue-700"}`}>
                                        {msg.username}
                                    </p>
                                    <p className="text-lg font-medium mb-1">
                                        {msg.message}
                                    </p>
                                    <div className="w-full h-px bg-gray-200 my-2"></div>
                                    <p className="text-sm text-gray-500">
                                        {msg.timestamp}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


                {/* Input Message */}
                <form onSubmit={handleSendMessage} className="mt-4">
                    <div className="relative">
                        <input 
                            type="text" 
                            placeholder="Ketik disini..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-blue-400 text-white p-2 rounded-full hover:bg-blue-500 transition-colors"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="w-5 h-5"
                            >
                                <path d="M22 2L11 13"></path>
                                <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
                            </svg>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}