"use client"

import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuth } from "../../context/authContext"
import axios from "axios"

import {
    LuBookOpen,
    LuCalendar,
    LuClock,
    LuFileText,
    LuMoreVertical,
    LuPlusCircle,
    LuUsers,
    LuVideo,
    LuDownload,
    LuEye,
    LuCheckCircle2,
    LuAlertCircle,
    LuX,
    LuSend,
    LuPaperclip,
    LuUserPlus,
    LuUserMinus,
    LuTrash2,
} from "react-icons/lu"

export default function EnhancedClassDetail() {
    const { id } = useParams()
    const [activeTab, setActiveTab] = useState("stream")
    const [showBackConfirm, setShowBackConfirm] = useState(false)
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
    const [showAssignmentModal, setShowAssignmentModal] = useState(false)
    const [showMaterialModal, setShowMaterialModal] = useState(false)
    const [showAddStudentModal, setShowAddStudentModal] = useState(false)
    const [showDeleteAssignmentModal, setShowDeleteAssignmentModal] = useState(null)
    const [showDeleteMaterialModal, setShowDeleteMaterialModal] = useState(null)
    const [showRemoveStudentModal, setShowRemoveStudentModal] = useState(null)
    const navigate = useNavigate()
    const { user } = useAuth()

    // State untuk data kelas dari database
    const [classData, setClassData] = useState(null)
    const [classMembers, setClassMembers] = useState([])
    const [teacher, setTeacher] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // States untuk form
    const [announcementText, setAnnouncementText] = useState("")
    const [newAssignment, setNewAssignment] = useState({
        title: "",
        description: "",
        dueDate: "",
        dueTime: "",
        points: "",
        attachments: [],
    })
    const [newMaterial, setNewMaterial] = useState({
        title: "",
        description: "",
        type: "pdf",
        file: null,
    })
    const [newStudent, setNewStudent] = useState({
        nis: "",
    })
    const [addStudentLoading, setAddStudentLoading] = useState(false)

    // Dummy Pengumuman (masih dummy untuk sementara)
    const [announcements, setAnnouncements] = useState([
        {
            id: 1,
            teacher: "Guru",
            avatar: "/placeholder.svg?height=40&width=40",
            content:
                "Selamat datang di kelas ini! Jangan lupa untuk membaca materi pengantar yang sudah saya upload.",
            timestamp: "2 hari yang lalu",
        },
    ])

    // Dummy Tugas (masih dummy untuk sementara)
    const [assignments, setAssignments] = useState([
        {
            id: 1,
            title: "Tugas Analisis",
            description: "Buatlah analisis mendalam tentang materi yang telah dipelajari",
            dueDate: "Besok, 23:59",
            status: "pending",
            points: 100,
            submitted: 5,
            total: 10,
        },
    ])

    // Dummy Materi (masih dummy untuk sementara)
    const [materials, setMaterials] = useState([
        {
            id: 1,
            title: "Materi Pengantar",
            type: "pdf",
            size: "2.5 MB",
            uploadDate: "3 hari yang lalu",
        },
    ])

    // Function untuk fetch detail kelas dari database
    const fetchClassDetails = async () => {
        try {
            setLoading(true)
            setError(null)
            const token = localStorage.getItem("token")

            if (!token) {
                setError("Token tidak ditemukan")
                return
            }

            const response = await axios.get(`http://localhost:5000/api/classes/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            console.log("Class details response:", response.data)

            setClassData(response.data.class)
            setTeacher(response.data.teacher)
            setClassMembers(response.data.members || [])

            // Update announcements dengan nama guru yang sebenarnya
            setAnnouncements(prev => prev.map(announcement => ({
                ...announcement,
                teacher: response.data.teacher?.name || announcement.teacher
            })))

            // Update assignments total dengan jumlah member yang sebenarnya
            setAssignments(prev => prev.map(assignment => ({
                ...assignment,
                total: response.data.members?.length || assignment.total
            })))

        } catch (error) {
            console.error("Error fetching class details:", error)
            if (error.response?.status === 401) {
                localStorage.removeItem("token")
                navigate("/login")
            } else if (error.response?.status === 403) {
                setError("Anda tidak memiliki akses ke kelas ini")
            } else if (error.response?.status === 404) {
                setError("Kelas tidak ditemukan")
            } else {
                setError("Gagal memuat data kelas")
            }
        } finally {
            setLoading(false)
        }
    }

    // Function untuk menambah siswa ke kelas
    const handleAddStudent = async () => {
        if (!newStudent.nis.trim()) {
            alert("NIS siswa wajib diisi")
            return
        }

        try {
            setAddStudentLoading(true)
            const token = localStorage.getItem("token")

            const response = await axios.post(
                `http://localhost:5000/api/classes/${id}/members`,
                { nis: newStudent.nis },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            )

            console.log("Student added:", response.data)

            // Reset form
            setNewStudent({ nis: "" })
            setShowAddStudentModal(false)

            // Refresh data kelas
            await fetchClassDetails()

            alert(response.data.message || "Siswa berhasil ditambahkan")

        } catch (error) {
            console.error("Error adding student:", error)
            const errorMessage = error.response?.data?.message || "Gagal menambahkan siswa"
            alert(errorMessage)
        } finally {
            setAddStudentLoading(false)
        }
    }

    // Function untuk menghapus siswa dari kelas
    const handleRemoveStudent = async (studentUserId) => {
        try {
            const token = localStorage.getItem("token")

            await axios.delete(`http://localhost:5000/api/classes/${id}/members/${studentUserId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            setShowRemoveStudentModal(null)

            // Refresh data kelas
            await fetchClassDetails()

            alert("Siswa berhasil dihapus dari kelas")

        } catch (error) {
            console.error("Error removing student:", error)
            const errorMessage = error.response?.data?.message || "Gagal menghapus siswa"
            alert(errorMessage)
        }
    }

    // useEffect untuk fetch data saat component mount
    useEffect(() => {
        if (id) {
            fetchClassDetails()
        }
    }, [id])

    //function to handle back navigation
    const handleBack = () => {
        if (user?.role === "guru") {
            navigate("/kelas-yang-diajar")
        } else {
            navigate("/kelas")
        }
    }

    // Function untuk handle klik tombol Users
    const handleUsersClick = () => {
        setActiveTab("people")
    }

    // Functions untuk handle form submissions (masih dummy)
    const handleCreateAnnouncement = () => {
        if (announcementText.trim()) {
            const newAnnouncement = {
                id: announcements.length + 1,
                teacher: teacher?.name || user?.nama_lengkap || "Guru",
                avatar: "/placeholder.svg?height=40&width=40",
                content: announcementText,
                timestamp: "Baru saja",
            }
            setAnnouncements([newAnnouncement, ...announcements])
            setAnnouncementText("")
            setShowAnnouncementModal(false)
        }
    }

    const handleCreateAssignment = () => {
        if (newAssignment.title && newAssignment.description && newAssignment.dueDate) {
            const assignment = {
                id: assignments.length + 1,
                title: newAssignment.title,
                description: newAssignment.description,
                dueDate: `${newAssignment.dueDate}, ${newAssignment.dueTime}`,
                status: "upcoming",
                points: Number.parseInt(newAssignment.points) || 100,
                submitted: 0,
                total: classMembers.length || 10,
            }
            setAssignments([assignment, ...assignments])
            setNewAssignment({
                title: "",
                description: "",
                dueDate: "",
                dueTime: "",
                points: "",
                attachments: [],
            })
            setShowAssignmentModal(false)
        }
    }

    const handleCreateMaterial = () => {
        if (newMaterial.title && newMaterial.description) {
            const material = {
                id: materials.length + 1,
                title: newMaterial.title,
                description: newMaterial.description,
                type: newMaterial.type,
                size: "1.0 MB",
                uploadDate: "Baru saja",
            }
            setMaterials([material, ...materials])
            setNewMaterial({
                title: "",
                description: "",
                type: "pdf",
                file: null,
            })
            setShowMaterialModal(false)
        }
    }

    const handleDeleteAssignment = (assignmentId) => {
        setAssignments(assignments.filter((assignment) => assignment.id !== assignmentId))
        setShowDeleteAssignmentModal(null)
    }

    const handleDeleteMaterial = (materialId) => {
        setMaterials(materials.filter((material) => material.id !== materialId))
        setShowDeleteMaterialModal(null)
    }

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

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat detail kelas...</p>
                </div>
            </div>
        )
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LuAlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">Error</h3>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={handleBack}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        )
    }

    // Jika tidak ada data kelas
    if (!classData) {
        return (
            <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600">Data kelas tidak ditemukan</p>
                    <button
                        onClick={handleBack}
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6]">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <div className="container mx-auto px-4 py-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center">
                                <LuBookOpen className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold">{classData.name}</h1>
                                <p className="text-white/80">{classData.grade} • {classData.status === 'active' ? 'Aktif' : 'Tidak Aktif'}</p>
                                <p className="text-white/80 text-sm">{teacher?.name} • {classMembers.length} siswa</p>
                                {classData.schedule && (
                                    <p className="text-white/80 text-sm">Jadwal: {classData.schedule}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleUsersClick}
                                className="flex items-center px-3 py-1.5 bg-white/10 rounded-md text-sm hover:bg-white/20 transition"
                            >
                                <LuUsers className="w-4 h-4 mr-2" />
                                {user?.role === "guru" ? "Kelola Siswa" : "Lihat Anggota"}
                            </button>
                            <button
                                onClick={() => setShowBackConfirm(true)}
                                className="flex items-center p-1.5 bg-white/10 rounded-md text-sm hover:bg-white/20 transition"
                            >
                                <LuMoreVertical className="w-4 h-4" />
                            </button>
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
                        {/* Tombol Buat Pengumuman untuk Guru */}
                        {user?.role === "guru" && (
                            <div className="bg-white rounded-lg shadow p-4">
                                <button
                                    onClick={() => setShowAnnouncementModal(true)}
                                    className="w-full flex items-center justify-center space-x-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                >
                                    <LuPlusCircle className="w-5 h-5 text-gray-500" />
                                    <span className="text-gray-600">Buat pengumuman untuk kelas Anda</span>
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] xl:grid-cols-[3fr_1fr] gap-6">
                            {/* Pengumuman */}
                            <div className="space-y-4">
                                {announcements.map((announcement) => (
                                    <div key={announcement.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            <div className="flex items-start space-x-4">
                                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                    <span>
                                                        {teacher?.name ? teacher.name.split(' ').map(n => n[0]).join('') : 'G'}
                                                    </span>
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

                            {/* Sidebar */}
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
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}
                                                    >
                                                        {getStatusIcon(assignment.status)}
                                                        <span className="ml-1 capitalize">{assignment.status}</span>
                                                    </span>
                                                </div>
                                            ))}
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
                                            <span className="font-semibold">{classMembers.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Tugas Aktif</span>
                                            <span className="font-semibold">{assignments.length}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-gray-600">Materi</span>
                                            <span className="font-semibold">{materials.length}</span>
                                        </div>
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
                            {user?.role === "guru" && (
                                <button
                                    onClick={() => setShowAssignmentModal(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    <LuPlusCircle className="w-5 h-5" />
                                    <span>Buat Tugas</span>
                                </button>
                            )}
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
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(assignment.status)}`}
                                            >
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
                                                    <LuEye className="w-4 h-4 mr-1" />
                                                    Lihat
                                                </button>
                                                <button className="flex items-center px-3 py-1.5 border rounded-md text-sm hover:bg-gray-50 transition">
                                                    <LuDownload className="w-4 h-4 mr-1" />
                                                    Download
                                                </button>
                                                {user?.role === "guru" && (
                                                    <button
                                                        onClick={() => setShowDeleteAssignmentModal(assignment.id)}
                                                        className="flex items-center px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 transition"
                                                    >
                                                        <LuTrash2 className="w-4 h-4 mr-1" />
                                                        Hapus
                                                    </button>
                                                )}
                                                {assignment.status === "pending" && user?.role !== "guru" && (
                                                    <button className="flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition">
                                                        <LuPlusCircle className="w-4 h-4 mr-1" />
                                                        Submit
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
                            {user?.role === "guru" && (
                                <button
                                    onClick={() => setShowMaterialModal(true)}
                                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                >
                                    <LuPlusCircle className="w-5 h-5" />
                                    <span>Tambah Materi</span>
                                </button>
                            )}
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
                                                {user?.role === "guru" && (
                                                    <button
                                                        onClick={() => setShowDeleteMaterialModal(material.id)}
                                                        className="flex items-center px-3 py-1.5 border border-red-200 text-red-600 rounded-md text-sm hover:bg-red-50 transition"
                                                    >
                                                        <LuTrash2 className="w-4 h-4" />
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

                {/* Anggota */}
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

                                <div className="p-4 space-y-4">
                                    {teacher ? (
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                <span className="text-blue-600 font-semibold">
                                                    {teacher.name.split(' ').map(n => n[0]).join('')}
                                                </span>
                                            </div>
                                            <div>
                                                <h3 className="font-semibold">{teacher.name}</h3>
                                                <p className="text-sm text-gray-600">{teacher.email}</p>
                                                {teacher.nuptk && (
                                                    <p className="text-xs text-gray-500">NUPTK: {teacher.nuptk}</p>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-gray-500">Data pengajar tidak tersedia</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Siswa */}
                            <div className="bg-white rounded-lg shadow">
                                <div className="p-4 border-b flex items-center justify-between">
                                    <h2 className="text-lg font-semibold flex items-center">
                                        <LuUsers className="w-5 h-5 mr-2" />
                                        Siswa ({classMembers.length})
                                    </h2>
                                    {user?.role === "guru" && (
                                        <button
                                            onClick={() => setShowAddStudentModal(true)}
                                            className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 transition"
                                        >
                                            <LuUserPlus className="w-4 h-4 mr-1" />
                                            Tambah Siswa
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3 p-3 max-h-96 overflow-y-auto">
                                    {classMembers.length === 0 ? (
                                        <div className="text-center py-8">
                                            <LuUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500 text-sm">Belum ada siswa di kelas ini</p>
                                            {user?.role === "guru" && (
                                                <p className="text-gray-400 text-xs mt-1">
                                                    Klik "Tambah Siswa" untuk menambahkan siswa ke kelas
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        classMembers.map((student) => (
                                            <div key={student.user_id} className="flex items-center justify-between space-x-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-sm">
                                                        <span className="text-green-600 font-semibold">
                                                            {student.nama_lengkap.split(' ').map(n => n[0]).join('')}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-medium">{student.nama_lengkap}</h4>
                                                        <p className="text-xs text-gray-500">NIS: {student.nis}</p>
                                                        {student.email && (
                                                            <p className="text-xs text-gray-400">{student.email}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {user?.role === "guru" && (
                                                    <button
                                                        onClick={() => setShowRemoveStudentModal(student)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                                        title={`Hapus ${student.nama_lengkap} dari kelas`}
                                                    >
                                                        <LuUserMinus className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Modal Buat Pengumuman */}
            {showAnnouncementModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Buat Pengumuman</h3>
                            <button onClick={() => setShowAnnouncementModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Pengumuman</label>
                                <textarea
                                    value={announcementText}
                                    onChange={(e) => setAnnouncementText(e.target.value)}
                                    placeholder="Tulis pengumuman untuk siswa..."
                                    rows={4}
                                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAnnouncementModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateAnnouncement}
                                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                <LuSend className="w-4 h-4 mr-2" />
                                Posting
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Buat Tugas */}
            {showAssignmentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Buat Tugas</h3>
                            <button onClick={() => setShowAssignmentModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Tugas</label>
                                <input
                                    type="text"
                                    value={newAssignment.title}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                                    placeholder="Masukkan judul tugas"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea
                                    value={newAssignment.description}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                                    placeholder="Jelaskan instruksi tugas..."
                                    rows={4}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Deadline</label>
                                    <input
                                        type="date"
                                        value={newAssignment.dueDate}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Deadline</label>
                                    <input
                                        type="time"
                                        value={newAssignment.dueTime}
                                        onChange={(e) => setNewAssignment({ ...newAssignment, dueTime: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Poin</label>
                                <input
                                    type="number"
                                    value={newAssignment.points}
                                    onChange={(e) => setNewAssignment({ ...newAssignment, points: e.target.value })}
                                    placeholder="100"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lampiran</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                                    <LuPaperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Klik untuk menambahkan file</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAssignmentModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateAssignment}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                                Buat Tugas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Materi */}
            {showMaterialModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Tambah Materi</h3>
                            <button onClick={() => setShowMaterialModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Judul Materi</label>
                                <input
                                    type="text"
                                    value={newMaterial.title}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                                    placeholder="Masukkan judul materi"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea
                                    value={newMaterial.description}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                                    placeholder="Jelaskan tentang materi ini..."
                                    rows={3}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe Materi</label>
                                <select
                                    value={newMaterial.type}
                                    onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="pdf">PDF</option>
                                    <option value="video">Video</option>
                                    <option value="doc">Dokumen</option>
                                    <option value="ppt">Presentasi</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                    <LuPaperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500 mb-2">Drag & drop file atau klik untuk browse</p>
                                    <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors">
                                        Pilih File
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowMaterialModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleCreateMaterial}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                Tambah Materi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Tambah Siswa */}
            {showAddStudentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Tambah Siswa</h3>
                            <button onClick={() => setShowAddStudentModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">NIS Siswa</label>
                                <input
                                    type="text"
                                    value={newStudent.nis}
                                    onChange={(e) => setNewStudent({ ...newStudent, nis: e.target.value })}
                                    placeholder="Masukkan NIS siswa (contoh: 2024001)"
                                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Siswa akan dicari berdasarkan NIS yang terdaftar di sistem
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddStudentModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                disabled={addStudentLoading}
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleAddStudent}
                                disabled={addStudentLoading}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {addStudentLoading ? (
                                    <div className="flex items-center">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Menambahkan...
                                    </div>
                                ) : (
                                    "Tambah Siswa"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Siswa */}
            {showRemoveStudentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-red-600">Hapus Siswa dari Kelas</h3>
                            <button onClick={() => setShowRemoveStudentModal(null)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <LuUserMinus className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{showRemoveStudentModal?.nama_lengkap}</h4>
                                    <p className="text-sm text-gray-500">NIS: {showRemoveStudentModal?.nis}</p>
                                </div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">
                                    <strong>Konfirmasi:</strong> Siswa ini akan dihapus dari kelas. Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowRemoveStudentModal(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleRemoveStudent(showRemoveStudentModal.user_id)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Hapus dari Kelas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Tugas */}
            {showDeleteAssignmentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-red-600">Hapus Tugas</h3>
                            <button onClick={() => setShowDeleteAssignmentModal(null)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <LuTrash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">
                                        {assignments.find((a) => a.id === showDeleteAssignmentModal)?.title}
                                    </h4>
                                    <p className="text-sm text-gray-500">Tugas akan dihapus secara permanen</p>
                                </div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">
                                    <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. Semua data tugas dan submission
                                    siswa akan hilang.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteAssignmentModal(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDeleteAssignment(showDeleteAssignmentModal)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Hapus Tugas
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus Materi */}
            {showDeleteMaterialModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-red-600">Hapus Materi</h3>
                            <button onClick={() => setShowDeleteMaterialModal(null)} className="p-1 hover:bg-gray-100 rounded">
                                <LuX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mb-6">
                            <div className="flex items-center space-x-3 mb-4">
                                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                                    <LuTrash2 className="w-6 h-6 text-red-600" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">
                                        {materials.find((m) => m.id === showDeleteMaterialModal)?.title}
                                    </h4>
                                    <p className="text-sm text-gray-500">Materi akan dihapus secara permanen</p>
                                </div>
                            </div>
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <p className="text-sm text-red-800">
                                    <strong>Peringatan:</strong> Tindakan ini tidak dapat dibatalkan. File materi akan hilang dari sistem.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteMaterialModal(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => handleDeleteMaterial(showDeleteMaterialModal)}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Hapus Materi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Back Confirmation Popup */}
            {showBackConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-80">
                        <h3 className="text-lg text-black font-semibold mb-4">Ingin kembali?</h3>
                        <div className="flex space-x-4">
                            <button
                                onClick={handleBack}
                                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-md hover:opacity-90"
                            >
                                Ya
                            </button>
                            <button
                                onClick={() => setShowBackConfirm(false)}
                                className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50 text-gray-700"
                            >
                                Tidak
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}