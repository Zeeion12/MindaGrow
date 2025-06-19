"use client"

import { useState } from "react"
import { Link } from "react-router-dom"

// Import ikon-ikon yang diperlukan
import {
    FaBookOpen as BookOpen,
    FaCalculator as Calculator,
    FaFlask as Beaker,
    FaPlus as Plus,
    FaUsers as Users,
    FaTrash as Trash,
    FaCog as Settings,
    FaEye as Eye,
} from "react-icons/fa"
import { GiEarthAmerica as Globe, GiPalette as Palette, GiMusicalNotes as Music } from "react-icons/gi"
import { IoMdTime as Clock, IoMdClose as Close } from "react-icons/io"
import { MdSchool as School, MdAssignment as Assignment } from "react-icons/md"

export default function KelasYangDiajar() {
    // State untuk menyimpan data kelas yang diajar
    const [classes, setClasses] = useState([
        {
            id: 1,
            name: "Bahasa Indonesia",
            grade: "Kelas 7A",
            icon: BookOpen,
            color: "bg-gradient-to-br from-red-400 to-red-600",
            students: 32,
            lessons: 12,
            nextLesson: "Membaca Cerita Pendek",
            status: "active",
            schedule: "Senin, Rabu, Jumat",
        },
        {
            id: 2,
            name: "Matematika",
            grade: "Kelas 8A",
            icon: Calculator,
            color: "bg-gradient-to-br from-blue-400 to-blue-600",
            students: 28,
            lessons: 15,
            nextLesson: "Persamaan Linear",
            status: "active",
            schedule: "Senin, Selasa, Kamis",
        },
        {
            id: 3,
            name: "IPA",
            grade: "Kelas 9C",
            icon: Beaker,
            color: "bg-gradient-to-br from-green-400 to-green-600",
            students: 25,
            lessons: 10,
            nextLesson: "Sistem Reproduksi",
            status: "active",
            schedule: "Rabu, Jumat",

        },
    ])

    const [hoveredCard, setHoveredCard] = useState(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)
    const [newClass, setNewClass] = useState({
        name: "",
        grade: "",
        students: "",
        schedule: "",
        icon: BookOpen,
        color: "bg-gradient-to-br from-blue-400 to-blue-600",
    })

    // Data untuk dropdown mata pelajaran
    const subjects = [
        { name: "Bahasa Indonesia", icon: BookOpen, color: "bg-gradient-to-br from-red-400 to-red-600" },
        { name: "Matematika", icon: Calculator, color: "bg-gradient-to-br from-blue-400 to-blue-600" },
        { name: "IPA", icon: Beaker, color: "bg-gradient-to-br from-green-400 to-green-600" },
        { name: "IPS", icon: Globe, color: "bg-gradient-to-br from-yellow-400 to-yellow-600" },
        { name: "Seni Budaya", icon: Palette, color: "bg-gradient-to-br from-purple-400 to-purple-600" },
        { name: "Musik", icon: Music, color: "bg-gradient-to-br from-pink-400 to-pink-600" },
    ]

    // Function untuk menambah kelas baru
    const handleAddClass = () => {
        if (newClass.name && newClass.grade && newClass.students && newClass.schedule) {
            const selectedSubject = subjects.find((s) => s.name === newClass.name)
            const newClassData = {
                id: classes.length + 1,
                name: newClass.name,
                grade: newClass.grade,
                icon: selectedSubject?.icon || BookOpen,
                color: selectedSubject?.color || "bg-gradient-to-br from-blue-400 to-blue-600",
                students: Number.parseInt(newClass.students),
                lessons: 0,
                nextLesson: "Belum ada materi",
                status: "active",
                schedule: newClass.schedule,
            }

            setClasses([...classes, newClassData])
            setNewClass({
                name: "",
                grade: "",
                students: "",
                schedule: "",
                icon: BookOpen,
                color: "bg-gradient-to-br from-blue-400 to-blue-600",
            })
            setShowAddModal(false)
        }
    }

    // Function untuk menghapus kelas
    const handleDeleteClass = (id) => {
        setClasses(classes.filter((cls) => cls.id !== id))
        setShowDeleteConfirm(null)
    }

    // Function untuk mengubah status kelas
    const toggleClassStatus = (id) => {
        setClasses(
            classes.map((cls) => (cls.id === id ? { ...cls, status: cls.status === "active" ? "inactive" : "active" } : cls)),
        )
    }

    return (
        <div className="min-h-screen bg-[#F3F4F6]">
            <main className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-400  rounded-lg p-6 mb-8 text-white">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Kelas yang Anda Ajar</h1>
                            <p className="text-blue-100">Kelola dan pantau semua kelas yang Anda ampu</p>
                        </div>
                        <div className="mt-4 md:mt-0">
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
                            >
                                <Plus className="w-5 h-5" />
                                Tambah Kelas
                            </button>
                        </div>
                    </div>
                </div>

                {/* Statistik Singkat */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <School className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">{classes.length}</h3>
                                <p className="text-gray-600 text-sm">Total Kelas</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Users className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {classes.reduce((total, cls) => total + cls.students, 0)}
                                </h3>
                                <p className="text-gray-600 text-sm">Total Siswa</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <Assignment className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {classes.reduce((total, cls) => total + cls.lessons, 0)}
                                </h3>
                                <p className="text-gray-600 text-sm">Total Materi</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg p-6 shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Settings className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-800">
                                    {classes.filter((cls) => cls.status === "active").length}
                                </h3>
                                <p className="text-gray-600 text-sm">Kelas Aktif</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grid Kelas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {classes.map((classItem) => {
                        const IconComponent = classItem.icon
                        return (
                            <div
                                key={classItem.id}
                                className={`relative bg-white rounded-3xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-gray-100 ${hoveredCard === classItem.id ? "ring-4 ring-blue-200" : ""
                                    } ${classItem.status === "inactive" ? "opacity-75" : ""}`}
                                onMouseEnter={() => setHoveredCard(classItem.id)}
                                onMouseLeave={() => setHoveredCard(null)}
                            >
                                {/* Status Badge */}
                                <div className="absolute top-4 right-4">
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-medium ${classItem.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                            }`}
                                    >
                                        {classItem.status === "active" ? "Aktif" : "Tidak Aktif"}
                                    </span>
                                </div>

                                {/* Header Kelas */}
                                <div className="flex items-center gap-4 mb-4">
                                    <div className={`${classItem.color} p-4 rounded-2xl shadow-lg`}>
                                        <IconComponent className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">{classItem.name}</h3>
                                        <p className="text-gray-500 text-sm">{classItem.grade}</p>
                                    </div>
                                </div>

                                {/* Info Kelas */}
                                <div className="space-y-3 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Users className="w-4 h-4" />
                                        <span>{classItem.students} Siswa</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Clock className="w-4 h-4" />
                                        <span>{classItem.schedule}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <Assignment className="w-4 h-4" />
                                        <span>{classItem.lessons} Materi</span>
                                    </div>
                                </div>

                                {/* Materi Selanjutnya */}
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 mb-1">Materi Selanjutnya:</p>
                                    <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg">{classItem.nextLesson}</p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                    <Link
                                        to={`/kelas/${classItem.id}`}
                                        className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Kelola
                                    </Link>
                                    <button
                                        onClick={() => toggleClassStatus(classItem.id)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${classItem.status === "active"
                                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                            : "bg-green-100 text-green-800 hover:bg-green-200"
                                            }`}
                                    >
                                        <Settings className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(classItem.id)}
                                        className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                                    >
                                        <Trash className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Hover Effect */}
                                {hoveredCard === classItem.id && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-3xl pointer-events-none"></div>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Modal Tambah Kelas */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Tambah Kelas Baru</h3>
                                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 rounded">
                                    <Close className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                                    <select
                                        value={newClass.name}
                                        onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Pilih Mata Pelajaran</option>
                                        {subjects.map((subject) => (
                                            <option key={subject.name} value={subject.name}>
                                                {subject.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                                    <input
                                        type="text"
                                        value={newClass.grade}
                                        onChange={(e) => setNewClass({ ...newClass, grade: e.target.value })}
                                        placeholder="Contoh: Kelas 7A"
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Siswa</label>
                                    <input
                                        type="number"
                                        value={newClass.students}
                                        onChange={(e) => setNewClass({ ...newClass, students: e.target.value })}
                                        placeholder="Masukkan jumlah siswa"
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Jadwal</label>
                                    <input
                                        type="text"
                                        value={newClass.schedule}
                                        onChange={(e) => setNewClass({ ...newClass, schedule: e.target.value })}
                                        placeholder="Contoh: Senin, Rabu, Jumat"
                                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={handleAddClass}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                                >
                                    Tambah Kelas
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Konfirmasi Hapus */}
                {showDeleteConfirm && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg p-6 w-full max-w-sm">
                            <h3 className="text-lg font-semibold mb-4">Hapus Kelas</h3>
                            <p className="text-gray-600 mb-6">
                                Apakah Anda yakin ingin menghapus kelas ini? Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    onClick={() => handleDeleteClass(showDeleteConfirm)}
                                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                                >
                                    Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}
