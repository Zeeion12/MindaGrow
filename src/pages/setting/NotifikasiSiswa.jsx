
import React, { useState } from "react"
import { 
    FaBell as Bell, 
    FaTrophy as Trophy, 
    FaGift as Gift, 
    FaPuzzlePiece as Puzzle, 
    FaUser as User, 
    FaClock as Clock, 
    FaCheckCircle as CheckCircle2, 
    FaTimes as X 
} from "react-icons/fa";


export default function NotifikasiSiswa() {

    const [activeTab, setActiveTab] = useState("all")
    // Dummy Data
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: "teacher",
            title: "[Guru Mia] Tugas Kimia minggu ini sudah tersedia, selesaikan sebelum Jumat!",
            time: "2 jam yang lalu",
            isRead: false,
            avatar: "/placeholder.svg?height=40&width=40",
            category: "academic",
        },
        {
            id: 2,
            type: "system",
            title: "Level Up! Selamat, kamu naik ke Level 15. Terus semangat!",
            time: "5 jam yang lalu",
            isRead: false,
            icon: Trophy,
            category: "achievement",
            color: "text-yellow-600",
        },
        {
            id: 3,
            type: "system",
            title: "Bonus Harian Tersedia! Klaim 25 XP hari ini sebelum pukul 23.59.",
            time: "1 hari yang lalu",
            isRead: false,
            icon: Gift,
            category: "reward",
            color: "text-red-500",
        },
        {
            id: 4,
            type: "system",
            title: "Tahukah kamu? Bermain puzzle 15 menit sehari bisa meningkatkan konsentrasi.",
            time: "2 hari yang lalu",
            isRead: true,
            icon: Puzzle,
            category: "tip",
            color: "text-green-600",
        },
        {
            id: 5,
            type: "system",
            title: "Selamat! Kamu telah menyelesaikan 10 tugas berturut-turut. Streak bonus +50 XP!",
            time: "3 hari yang lalu",
            isRead: true,
            icon: Trophy,
            category: "achievement",
            color: "text-purple-600",
        },
    ])

    // Menghitung jumlah notifikasi yang belum dibaca
    const unreadCount = notifications.filter((n) => !n.isRead).length

    // Memfilter notifikasi berdasarkan tab aktif
    // Jika tab 'all' tampilkan semua notifikasi, jika 'unread' tampilkan yang belum dibaca
    const filteredNotifications = activeTab === "all" ? notifications : notifications.filter((n) => !n.isRead)

    // Fungsi untuk menandai satu notifikasi sebagai sudah dibaca berdasarkan ID
    const markAsRead = (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    }

    // Fungsi untuk menandai SEMUA notifikasi sebagai sudah dibaca
    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    }

    // Fungsi untuk menghapus notifikasi berdasarkan ID
    const deleteNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }

    // Fungsi untuk mendapatkan warna background dan border berdasarkan kategori notifikasi
    const getCategoryColor = (category) => {
        const colors = {
            academic: "bg-blue-50 border-blue-200",
            achievement: "bg-yellow-50 border-yellow-200",
            reward: "bg-red-50 border-red-200",
            tip: "bg-green-50 border-green-200",
        }
        return colors[category] || "bg-gray-50 border-gray-200"
    }

    return (
        <div className="h-screen flex flex-col">
            <main className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="bg-blue-100 rounded-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                🔔 Ada info penting nih! Jangan sampai ketinggalan.
                            </h1>
                        </div>
                        {unreadCount > 0 && (
                            <button 
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 mt-2 md:mt-0"
                            >
                                <CheckCircle2 className="w-4 h-4" />Tandai Semua Dibaca
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200 mb-8">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                            activeTab === "all" ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md" :"text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                        <Bell className="w-4 h-4" />Semua
                        <span className="bg-white/20 text-xs px-2 py-1 rounded-full">{notifications.length}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("unread")}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 relative ${
                            activeTab === "unread"
                            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                        }`}
                    >
                        <Bell className="w-4 h-4" />Belum dibaca
                        {unreadCount > 0 && (
                            <>
                                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">{unreadCount}</span>
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            </>
                        )}
                    </button>
                </div>

                {/* Notification List */}
                <div className="space-y-4">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {activeTab === "unread" ? "Tidak ada notifikasi yang belum dibaca" : "Tidak ada notifikasi"}
                            </h3>
                            <p className="text-gray-500">
                                {activeTab === "unread" ? "Semua notifikasi sudah dibaca" : "Notifikasi baru akan muncul di sini"}
                            </p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification, index) => (
                            <div
                                key={notification.id}
                                className={`group relative bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${
                                    notification.isRead
                                    ? "border-gray-100 opacity-75"
                                    : `${getCategoryColor(notification.category)} shadow-sm`
                                }`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        {/* Avatar Icon */}
                                        <div className="flex-shrink-0">
                                            {notification.type === "teacher" ? (
                                                <div className="relative">
                                                    <img
                                                        src={notification.avatar || "/placeholder.svg"}
                                                        alt="Avatar"
                                                        className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                                                        <User className="w-3 h-3 text-white" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
                                                    {React.createElement(notification.icon, {
                                                        className: "w-6 h-6 text-white",
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <p className={`text-sm leading-relaxed ${
                                                            notification.isRead ? "text-gray-600" : "text-gray-900 font-medium"
                                                        }`}
                                                    >
                                                        {notification.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Clock className="w-3 h-3 text-gray-400" />
                                                        <span className="text-xs text-gray-500">{notification.time}</span>
                                                        {!notification.isRead && (
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                                Baru
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => markAsRead(notification.id)}
                                                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                                            title="Tandai sudah dibaca"
                                                        >
                                                            <CheckCircle2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                                                        title="Hapus notifikasi"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Unread Indicator */}
                                        {!notification.isRead && (
                                            <div className="flex-shrink-0">
                                                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Bottom border for unread */}
                                {!notification.isRead && (
                                    <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
                                )}
                            </div>
                        ))
                    )} 
                </div>
            </main>
        </div>
    )
}