import { useAuth } from '../../context/authContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Import Chart
import FavoriteSubjectChart from '../../components/layout/Chartcard/FavoriteSubjectChart';

// Import Card
import CardKomenGuru from '../../components/layout/ClassCard/CardKomenGuru';
import CardSkor from '../../components/layout/TaskCard/CardSkor';
import CardCalendar from '../../components/layout/TaskCard/CardCalendar';
import CardTugas from '../../components/layout/TaskCard/CardTugas';

// Import ikon-ikon yang diperlukan
import {
    FaBookOpen as BookOpen,
    FaCalculator as Calculator,
    FaFlask as Beaker,
} from "react-icons/fa";
import {
    GiEarthAmerica as Globe,
    GiPalette as Palette,
    GiMusicalNotes as Music,
} from "react-icons/gi";
import {
    IoMdTime as Clock
} from "react-icons/io";
import {
    FaUsers as Users,
    FaGraduationCap as GraduationCap
} from "react-icons/fa";
import { MdSchool as School } from "react-icons/md";

export default function ClassMainUI() {
    // Inisialisasi User Context
    const { user } = useAuth();

    // State untuk menyimpan data kelas, subjek, dan aktivitas
    const [classes, setClasses] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedSubject, setSelectedSubject] = useState(null)
    const [hoveredCard, setHoveredCard] = useState(null)

    // Mapping subjects dengan icon dan warna
    const subjects = {
        "Bahasa Indonesia": {
            icon: BookOpen,
            color: "bg-gradient-to-br from-red-400 to-red-600",
            lessons: 12,
            nextLesson: "Membaca Cerita Pendek",
        },
        "Matematika": {
            icon: Calculator,
            color: "bg-gradient-to-br from-blue-400 to-blue-600",
            lessons: 15,
            nextLesson: "Perkalian Dasar",
        },
        "IPA": {
            icon: Beaker,
            color: "bg-gradient-to-br from-green-400 to-green-600",
            lessons: 10,
            nextLesson: "Siklus Air",
        },
        "IPS": {
            icon: Globe,
            color: "bg-gradient-to-br from-yellow-400 to-yellow-600",
            lessons: 8,
            nextLesson: "Sejarah Indonesia",
        },
        "Seni Budaya": {
            icon: Palette,
            color: "bg-gradient-to-br from-purple-400 to-purple-600",
            lessons: 6,
            nextLesson: "Seni Rupa Tradisional",
        },
        "Musik": {
            icon: Music,
            color: "bg-gradient-to-br from-pink-400 to-pink-600",
            lessons: 5,
            nextLesson: "Alat Musik Tradisional",
        }
    }

    // Function untuk fetch kelas siswa dari backend
    const fetchStudentClasses = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("token")

            if (!token) {
                console.error("No token found")
                setLoading(false)
                return
            }

            const response = await axios.get("http://localhost:5000/api/student/classes", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            console.log("Student classes response:", response.data)

            // Map data backend ke struktur frontend
            const mappedClasses = response.data.classes.map(cls => {
                const subject = subjects[cls.name] || {
                    icon: BookOpen,
                    color: "bg-gradient-to-br from-gray-400 to-gray-600",
                    lessons: 0,
                    nextLesson: "Belum ada materi",
                }

                return {
                    id: cls.id,
                    name: cls.name,
                    icon: subject.icon,
                    color: subject.color,
                    lessons: subject.lessons,
                    nextLesson: subject.nextLesson,
                    grade: cls.grade,
                    description: cls.description,
                    schedule: cls.schedule,
                    teacher_name: cls.teacher_name,
                    status: cls.status
                }
            })

            setClasses(mappedClasses)
        } catch (error) {
            console.error("Error fetching student classes:", error)
            if (error.response?.status === 401) {
                // Token expired or invalid
                localStorage.removeItem("token")
                window.location.href = "/login"
            }
            // Jika error 403, berarti user bukan siswa atau belum ada kelas
            if (error.response?.status === 403) {
                console.log("User is not a student or doesn't have access")
                setClasses([])
            }
        } finally {
            setLoading(false)
        }
    }

    // useEffect untuk fetch data saat component mount
    useEffect(() => {
        if (user?.role === 'siswa') {
            fetchStudentClasses()
        } else {
            setLoading(false)
        }
    }, [user])

    // Loading state
    if (loading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-[#F3F4F6]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Memuat data kelas...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen flex flex-col">
            <main className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="bg-blue-100 rounded-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                Hai {user?.nama_lengkap}! Yuk cek aktivitas dan teman-teman sekelasmu!
                            </h1>
                            <p className="text-gray-600">
                                {classes.length > 0 ? `Kamu terdaftar di ${classes.length} kelas` : "Belum ada kelas"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Kartu Subjek */}
                {classes.length === 0 ? (
                    <div className="text-center py-12">
                        <School className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">Belum Ada Kelas</h3>
                        <p className="text-gray-500 mb-6">
                            Kamu belum ditambahkan ke kelas manapun. Hubungi guru untuk bergabung ke kelas.
                        </p>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                            <GraduationCap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-blue-800 text-sm">
                                <strong>Info:</strong> Guru dapat menambahkan kamu ke kelas menggunakan NIS: <code className="bg-blue-200 px-2 py-1 rounded">{user?.nis}</code>
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {classes.map((subject) => {
                            const IconComponent = subject.icon
                            return (
                                <Link
                                    to={`/kelas/${subject.id}`}
                                    key={subject.id}
                                >
                                    <div
                                        className={`relative bg-white rounded-3xl p-6 shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-gray-100 ${hoveredCard === subject.id ? "ring-4 ring-blue-200" : ""
                                            }`}
                                        onMouseEnter={() => setHoveredCard(subject.id)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        onClick={() => setSelectedSubject(subject)}
                                    >
                                        {/* Status Badge */}
                                        <div className="absolute top-4 right-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${subject.status === "active"
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                                }`}>
                                                {subject.status === "active" ? "Aktif" : "Tidak Aktif"}
                                            </span>
                                        </div>

                                        {/* Ikon Subject ama Nama */}
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className={`${subject.color} p-4 rounded-2xl shadow-lg`}>
                                                <IconComponent className="w-8 h-8 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800">{subject.name}</h3>
                                                <p className="text-gray-500 text-sm">{subject.grade}</p>
                                                <p className="text-gray-400 text-xs">Guru: {subject.teacher_name}</p>
                                            </div>
                                        </div>

                                        {/* Info Materi */}
                                        <div className="space-y-3 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span>Jadwal: {subject.schedule}</span>
                                            </div>
                                            {subject.description && (
                                                <div className="flex items-start gap-2 text-sm text-gray-600">
                                                    <BookOpen className="w-4 h-4 mt-0.5" />
                                                    <span className="line-clamp-2">{subject.description}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Pelajaran Selanjutnya */}
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock className="w-4 h-4" />
                                                <span>Pelajaran Selanjutnya:</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg">
                                                {subject.nextLesson}
                                            </p>
                                        </div>

                                        {/* Hover Effect */}
                                        {hoveredCard === subject.id && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 rounded-3xl pointer-events-none"></div>
                                        )}
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}

                {/* Charts and Other Components - Only show if there are classes */}
                {classes.length > 0 && (
                    <>
                        {/* Favorite Subject Chart and Calendar Section */}
                        <div className="mt-8 md:mt-12">
                            <div className="grid grid-cols-1 gap-4 md:gap-5">
                                {/* Chart and Calendar Container */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[2fr_1fr] xl:grid-cols-[3fr_400px] gap-4 md:gap-5">
                                    {/* Chart */}
                                    <div className="w-full min-h-[300px] sm:min-h-[400px]">
                                        <FavoriteSubjectChart />
                                    </div>
                                    {/* Calendar */}
                                    <div className="w-full self-start">
                                        <CardCalendar />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Other Components Section */}
                        <div className="mt-8 md:mt-12">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                <div className="w-full">
                                    <CardTugas />
                                </div>
                                <div className="w-full">
                                    <CardSkor />
                                </div>
                                <div className="w-full self-start sm:col-span-2 lg:col-span-1">
                                    <CardKomenGuru />
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    )
}