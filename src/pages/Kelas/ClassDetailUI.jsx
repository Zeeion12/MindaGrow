import { useState } from "react"
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';

import { 
    LuBookOpen, 
    LuCalendar, 
    LuClock, 
    LuFileText, 
    LuMessageSquare, 
    LuMoreVertical, 
    LuPlusCircle, 
    LuUsers, 
    LuVideo, 
    LuDownload, 
    LuEye, 
    LuCheckCircle2, 
    LuAlertCircle 
} from "react-icons/lu"

export default function ClassDetailUI () {
    const { id } = useParams();
    const [activeTab, setActiveTab] = useState("stream")
    const [showBackConfirm, setShowBackConfirm] = useState(false)
    const navigate = useNavigate();

    //function to handle back navigation
    const handleBack = () => {
        navigate('/kelas');
    }

    // Data mapel
    const subjects = [
        {
            id: 1,
            name: "Bahasa Indonesia",
            icon: LuBookOpen,
            color: "from-red-400 to-red-600",
            lessons: 12,
            nextLesson: "Membaca Cerita Pendek",
        },
        {
            id: 2,
            name: "Matematika",
            icon: LuBookOpen,
            color: "from-blue-400 to-blue-600",
            lessons: 15,
            nextLesson: "Perkalian Dasar",
        },
        {
            id: 3,
            name: "IPA",
            icon: LuBookOpen,
            color: "from-green-400 to-green-600",
            lessons: 10,
            nextLesson: "Siklus Air",
        },
    ];

    // Dummy Pengumuman
    const announcements = [
        {
            id: 1,
            teacher: "Bu Sarah",
            avatar: "/placeholder.svg?height=40&width=40",
            content:
                "Selamat datang di kelas Bahasa Indonesia semester ini! Jangan lupa untuk membaca materi pengantar yang sudah saya upload.",
            timestamp: "2 hari yang lalu",
        },
        {
            id: 2,
            teacher: "Bu Sarah",
            avatar: "/placeholder.svg?height=40&width=40",
            content:
                "Reminder: Tugas essay tentang 'Analisis Puisi Modern' deadline nya besok pukul 23:59. Pastikan kalian sudah submit ya!",
            timestamp: "1 hari yang lalu",
        },
    ]

    // Dummy Tugas
    const assignments = [
        {
            id: 1,
            title: "Essay Analisis Puisi Modern",
            description: "Buatlah analisis mendalam tentang puisi karya Chairil Anwar pilihan kalian",
            dueDate: "Besok, 23:59",
            status: "pending",
            points: 100,
            submitted: 23,
            total: 30,
        },
        {
            id: 2,
            title: "Presentasi Sastra Kontemporer",
            description: "Presentasi kelompok tentang perkembangan sastra Indonesia kontemporer",
            dueDate: "Minggu depan",
            status: "upcoming",
            points: 150,
            submitted: 0,
            total: 30,
        },
        {
            id: 3,
            title: "Kuis Tata Bahasa",
            description: "Kuis online tentang penggunaan EYD dan tata bahasa Indonesia",
            dueDate: "Sudah lewat",
            status: "overdue",
            points: 50,
            submitted: 28,
            total: 30,
        },
    ]

    // Dummy Materi
    const materials = [
        {
            id: 1,
            title: "Pengantar Sastra Indonesia",
            type: "pdf",
            size: "2.5 MB",
            uploadDate: "3 hari yang lalu",
        },
        {
            id: 2,
            title: "Video Pembelajaran: Teknik Menulis Esai",
            type: "video",
            duration: "45 menit",
            uploadDate: "1 minggu yang lalu",
        },
        {
            id: 3,
            title: "Contoh Analisis Puisi",
            type: "doc",
            size: "1.2 MB",
            uploadDate: "2 minggu yang lalu",
        },
    ]

    // Ngambil warna status tugas
    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "upcoming":
                return "bg-blue-100 text-blue-800 border-blue-200"
            case "overdue":
                return "bg-red-100 text-red-800 border-red-200"
            case "completed":
                return "bg-green-100 text-green-800 border-green-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    // Ngambil icon status tugas
    const getStatusIcon = (status) => {
        switch (status) {
            case "pending":
                return <LuClock className="w-4 h-4" />
            case "upcoming":
                return <LuCalendar className="w-4 h-4" />
            case "overdue":
                return <LuAlertCircle className="w-4 h-4" />
            case "completed":
                return <LuCheckCircle2 className="w-4 h-4" />
            default:
                return <LuClock className="w-4 h-4" />
        }
    }

    const currentSubject = subjects.find(subject => subject.id === parseInt(id)) || subjects[0];

    
    return (
        <div className="min-h-screen bg-[#F3F4F6]">
            {/* Header */}
            <div className={`bg-gradient-to-r ${currentSubject.color} text-white`}>
                <div className="container mx-auto px-4 py-8">
                    <div className="container mx-auto px-4 py-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                                    <currentSubject.icon className="w-8 h-8" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold">{currentSubject.name}</h1>
                                    <p className="text-white/80">Kelas E • Semester Ganjil 2024</p>
                                    <p className="text-white/80 text-sm">Bu Sarah Wijaya • 30 siswa</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <button className="flex items-center px-3 py-1.5 bg-white/10 rounded-md text-sm hover:bg-white/20 transition">
                                    <LuUsers className="w-4 h-4 mr-2" />
                                    Lihat Anggota
                                </button>
                                <button 
                                    onClick={() => setShowBackConfirm(true)} 
                                    className="flex items-center p-1.5 bg-white/10 rounded-md text-sm hover:bg-white/20 transition"
                                >
                                    <LuMoreVertical className="w-4 h-4" />
                                </button>

                                {/* Back Confirmation Popup */}
                                {showBackConfirm && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                        <div className="bg-white rounded-lg p-6 w-80">
                                            <h3 className="text-lg text-black font-semibold mb-4">Ingin kembali?</h3>
                                            <div className="flex space-x-4">
                                                <button
                                                    onClick={handleBack}
                                                    className={`flex-1 px-4 py-2 bg-gradient-to-r ${currentSubject.color} text-white rounded-md hover:opacity-90`}
                                                >
                                                    Ya
                                                </button>
                                                <button
                                                    onClick={() => setShowBackConfirm(false)}
                                                    className={`flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 text-gray-700`}
                                                >
                                                    Tidak
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
                <div className="bg-white border-b">
                    <div className="container mx-auto px-4">
                        <div className="w-full">
                            <div className="grid grid-cols-4 w-full bg-transparent h-12">
                                <button
                                    onClick={() => setActiveTab("stream")}
                                    className={`flex items-center justify-center font-medium ${activeTab === "stream" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
                                >
                                    Stream
                                </button>
                                <button
                                    onClick={() => setActiveTab("classwork")}
                                    className={`flex items-center justify-center font-medium ${activeTab === "classwork" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
                                >
                                    Tugas Kelas
                                </button>
                                <button
                                    onClick={() => setActiveTab("materials")}
                                    className={`flex items-center justify-center font-medium ${activeTab === "materials" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
                                >
                                    Materi
                                </button>
                                <button
                                    onClick={() => setActiveTab("people")}
                                    className={`flex items-center justify-center font-medium ${activeTab === "people" ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600" : "text-gray-600"}`}
                                >
                                    Anggota
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="container mx-auto px-4 py-6">
                    {/* Stream Tab */}
                    {activeTab === "stream" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] xl:grid-cols-[3fr_1fr] gap-6">
                                {/* Pengumuman */}
                                <div className="space-y-4">
                                    {announcements.map((announcement) => (
                                        <div key={announcement.id} className=" bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                            <div className="p-6">
                                                <div className="flex items-start space-x-4">
                                                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <span>BS</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <h3 className="text-black font-semibold">{announcement.teacher}</h3>
                                                            <span className="text-sm text-gray-500">{announcement.timestamp}</span>
                                                        </div>
                                                        <p className="text-gray-700 mb-4">{announcement.content}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* SideBar */}
                            <div className="space-y-6">
                                {/* Tugas Mendatang */}
                                <div className="bg-white rounded-lg shadow">
                                    <div className="p-4 border-b">
                                        <h2 className="text-lg text-black font-semibold flex items-center">
                                            <LuCalendar className="w-5 h-5 mr-2" />
                                            Tugas Mendatang
                                        </h2>
                                    </div>

                                    <div className="p-4 space-y-3">
                                        {assignments
                                            .filter((a) => a.status === "pending" || a.status === "upcoming")
                                            .map((assignment) => (
                                                <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                                                    <h4 className="font-medium text-black text-sm mb-1">{assignment.title}</h4>
                                                    <p className="text-xs text-gray-600 mb-2">{assignment.dueDate}</p>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                                                        {getStatusIcon(assignment.status)}
                                                        <span className="ml-1 capitalize">{assignment.status}</span>
                                                    </span>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </div>

                                {/* Data Stat Kelas */}
                                <div className="bg-white rounded-lg shadow">
                                    <div className="p-4 border-b">
                                        <h2 className="text-lg font-semibold">Statistik Kelas</h2>
                                    </div>
                                    <div className="p-4 space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Total Siswa</span>
                                            <span className="font-semibold">30</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Tugas Aktif</span>
                                            <span className="font-semibold">3</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tugas Kelas */}
                    {activeTab === "classwork" && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Tugas Kelas</h2>
                            </div>

                            <div className="grid gap-6">
                                {assignments.map((assignment) => (
                                    <div key={assignment.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-start space-x-4">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                        <LuFileText className="w-5 h-5 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold mb-2">{assignment.title}</h3>
                                                        <p className="text-gray-600 mb-3">{assignment.description}</p>
                                                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                            <span>Due: {assignment.dueDate}</span>
                                                            <span>•</span>
                                                            <span>{assignment.points} poin</span>
                                                            <span>•</span>
                                                            <span>
                                                            {assignment.submitted}/{assignment.total} diserahkan
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}>
                                                    {getStatusIcon(assignment.status)}
                                                    <span className="ml-1 capitalize">{assignment.status}</span>
                                                </span>
                                            </div>
                                            <div className="border-t border-gray-200 my-4"></div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                                                        <div
                                                            className="bg-blue-600 h-2 rounded-full"
                                                            style={{ width: `${(assignment.submitted / assignment.total) * 100}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-sm text-gray-500">
                                                        {Math.round((assignment.submitted / assignment.total) * 100)}%
                                                    </span>
                                                </div>

                                                <div className="flex space-x-2">
                                                    <button className="flex items-center px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition">
                                                        <LuEye className="w-4 h-4 mr-1" />Lihat
                                                    </button>
                                                    {assignment.status === "pending" && (
                                                        <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition">
                                                            <LuPlusCircle className="w-4 h-4 mr-1" />Submit
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Materi */}
                    {activeTab === "materials" && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold">Materi Pembelajaran</h2>
                            </div>

                            <div className="grid gap-4">
                                {materials.map((material) => (
                                    <div key={material.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                        <div className="p-4">
                                            <div className="flex items-center space-x-4">
                                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                                    {material.type === "pdf" && <LuFileText className="w-6 h-6 text-green-600" />}
                                                    {material.type === "video" && <LuVideo className="w-6 h-6 text-green-600" />}
                                                    {material.type === "doc" && <LuFileText className="w-6 h-6 text-green-600" />}
                                                </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold mb-1">{material.title}</h3>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span>{material.type.toUpperCase()}</span>
                                                    <span>•</span>
                                                    <span>{material.size || material.duration}</span>
                                                    <span>•</span>
                                                    <span>{material.uploadDate}</span>
                                                </div>
                                            </div>
                                            <div className="flex space-x-2">
                                                <button className="flex items-center px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition">
                                                    <LuEye className="w-4 h-4 mr-1" />
                                                    Lihat
                                                </button>
                                                <button className="flex items-center px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition">
                                                    <LuDownload className="w-4 h-4 mr-1" />
                                                    Download
                                                </button>
                                            </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Jumlah Siswa */}
                    {activeTab === "people" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                                {/* Guru */}
                                <div className="bg-white rounded-lg shadow self-start">
                                    <div className="p-4 border-b">
                                        <h2 className="text-lg font-semibold flex items-center">
                                            <LuUsers className="w-5 h-5 mr-2" />
                                            Pengajar
                                        </h2>
                                    </div>

                                    <div  className="p-4 space-y-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                <span>SW</span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">Sarah Wijaya</h3>
                                                <p className="text-sm text-gray-600">Guru Bahasa Indonesia</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Murid */}
                                <div className="bg-white rounded-lg shadow">
                                    <div className="p-4 border-b flex items-center justify-between">
                                        <h2 className="text-lg font-semibold flex items-center">
                                            <LuUsers className="w-5 h-5 mr-2" />
                                            Siswa (30)
                                        </h2>
                                        <button className="flex items-center px-3 py-1 border rounded-md text-sm hover:bg-gray-50 transition">
                                            Lihat Semua
                                        </button>
                                    </div>

                                    <div className="space-y-3 p-3">
                                        {[
                                            1, 2, 3, 4, 5,
                                            6, 7, 8, 9, 10,
                                            11, 12, 13, 14, 15,
                                            16, 17, 18, 19, 20
                                        ].map((i) => (
                                            <div key={i} className="flex items-center space-x-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm">
                                                    <span>S{i}</span>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium">Siswa {i}</h4>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
        </div>
    );  
}