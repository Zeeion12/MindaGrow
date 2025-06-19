"use client"

import React, { useState } from "react"
import {
    FaBell as Bell,
    FaClock as Clock,
    FaCheckCircle as CheckCircle2,
    FaTimes as X,
    FaChalkboardTeacher as Teacher,
    FaExclamationTriangle as Alert,
    FaInfoCircle as Info,
    FaGraduationCap as Grade,
    FaComments as Chat,
} from "react-icons/fa"

export default function NotifikasiOrtu() {
    const [activeTab, setActiveTab] = useState("all")
    // Dummy Data
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: "grade",
            title: "Nilai Ujian Tengah Semester Matematika telah dikeluarkan",
            time: "15 menit yang lalu",
            isRead: false,
            icon: Grade,
            category: "academic",
            color: "text-green-600",
            details: {
                subject: "Matematika",
                score: "85",
                teacherName: "Ibu Sarah",
            }
        },
        {
            id: 2,
            type: "teacher",
            title: "[Guru - Ibu Sarah] Budi menunjukkan peningkatan yang baik dalam pelajaran Matematika",
            time: "1 jam yang lalu",
            isRead: false,
            avatar: "/placeholder.svg?height=40&width=40",
            category: "teacher_message",
            teacherName: "Ibu Sarah",
            subject: "Matematika"
        },
        {
            id: 3,
            type: "system",
            title: "Pengumuman: Pertemuan Orang Tua Murid akan diadakan tanggal 25 Juni 2025",
            time: "2 jam yang lalu",
            isRead: false,
            icon: Info,
            category: "announcement",
            color: "text-blue-600",
        },
        {
            id: 4,
            type: "attendance",
            title: "Laporan Kehadiran: Budi hadir 100% selama bulan ini",
            time: "1 hari yang lalu",
            isRead: true,
            icon: CheckCircle2,
            category: "attendance",
            color: "text-green-600",
        },
        {
            id: 5,
            type: "grade",
            title: "Nilai Tugas Bahasa Indonesia telah diperbarui",
            time: "2 hari yang lalu",
            isRead: true,
            icon: Grade,
            category: "academic",
            color: "text-green-600",
            details: {
                subject: "Bahasa Indonesia",
                score: "90",
                teacherName: "Bapak Bambang",
            }
        },
        {
            id: 6,
            type: "behavior",
            title: "Laporan Perilaku: Budi aktif berpartisipasi dalam diskusi kelas",
            time: "3 hari yang lalu",
            isRead: true,
            icon: Chat,
            category: "behavior",
            teacherName: "Ibu Sarah",
        },
        {
            id: 7,
            type: "system",
            title: "Pengingat: Pembayaran SPP Bulan Juni",
            time: "4 hari yang lalu",
            isRead: true,
            icon: Alert,
            category: "payment",
            color: "text-orange-600",
        },
    ])

    // Menghitung jumlah notifikasi yang belum dibaca
    const unreadCount = notifications.filter((n) => !n.isRead).length

    // Memfilter notifikasi berdasarkan tab aktif
    const filteredNotifications = activeTab === "all" ? notifications : notifications.filter((n) => !n.isRead)

    // Fungsi untuk menandai satu notifikasi sebagai sudah dibaca
    const markAsRead = (id) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
    }

    // Fungsi untuk menandai semua notifikasi sebagai sudah dibaca
    const markAllAsRead = () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    }

    // Fungsi untuk menghapus notifikasi
    const deleteNotification = (id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
    }

    // Fungsi untuk mendapatkan warna kategori
    const getCategoryColor = (category) => {
        const colors = {
            academic: "bg-green-50 border-green-200",
            teacher_message: "bg-purple-50 border-purple-200",
            announcement: "bg-blue-50 border-blue-200",
            attendance: "bg-teal-50 border-teal-200",
            behavior: "bg-indigo-50 border-indigo-200",
            payment: "bg-orange-50 border-orange-200",
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
                                👨‍👩‍👧‍👦 Notifikasi Orang Tua - Pantau Perkembangan Anak
                            </h1>
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 mt-2 md:mt-0"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Tandai Semua Dibaca
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-200 mb-8">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${activeTab === "all"
                                ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-md"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                    >
                        <Bell className="w-4 h-4" />
                        Semua
                        <span className="bg-white/20 text-xs px-2 py-1 rounded-full">{notifications.length}</span>
                    </button>

                    <button
                        onClick={() => setActiveTab("unread")}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 relative ${activeTab === "unread"
                                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md"
                                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                            }`}
                    >
                        <Bell className="w-4 h-4" />
                        Belum dibaca
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
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`group relative bg-white rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${notification.isRead
                                        ? "border-gray-100 opacity-75"
                                        : `${getCategoryColor(notification.category)} shadow-sm`
                                    }`}
                            >
                                <div className="p-6">
                                    <div className="flex items-start gap-4">
                                        {/* Icon/Avatar */}
                                        <div className="flex-shrink-0">
                                            {notification.type === "teacher" ? (
                                                <div className="relative">
                                                    <img
                                                        src={notification.avatar}
                                                        alt="Avatar Guru"
                                                        className="w-12 h-12 rounded-full border-2 border-white shadow-md"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center">
                                                        <Teacher className="w-3 h-3 text-white" />
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
                                                    <p className={`text-sm leading-relaxed ${notification.isRead ? "text-gray-600" : "text-gray-900 font-medium"
                                                        }`}>
                                                        {notification.title}
                                                    </p>

                                                    {/* Additional Details for Grade Notifications */}
                                                    {notification.type === "grade" && notification.details && (
                                                        <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                                            <p className="text-sm text-gray-600">
                                                                Nilai: <span className="font-medium">{notification.details.score}</span> |
                                                                Mata Pelajaran: <span className="font-medium">{notification.details.subject}</span> |
                                                                Guru: <span className="font-medium">{notification.details.teacherName}</span>
                                                            </p>
                                                        </div>
                                                    )}

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
                                    <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    )
}