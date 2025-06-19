import { useAuth } from '../../context/authContext';
import { useState } from 'react';
import { Link } from 'react-router-dom';

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
    FaUsers as Users
} from "react-icons/fa";

const subjects = [
    {
        id: 1,
        name: "Bahasa Indonesia",
        icon: BookOpen,
        color: "bg-gradient-to-br from-red-400 to-red-600",
        lessons: 12,
        nextLesson: "Membaca Cerita Pendek",
    },
    {
        id: 2,
        name: "Matematika",
        icon: Calculator,
        color: "bg-gradient-to-br from-blue-400 to-blue-600",
        lessons: 15,
        nextLesson: "Perkalian Dasar",
    },
    {
        id: 3,
        name: "IPA",
        icon: Beaker,
        color: "bg-gradient-to-br from-green-400 to-green-600",
        lessons: 10,
        nextLesson: "Siklus Air",
    },
]

export default function ClassMainUI() {

    // State untuk menyimpan data kelas, subjek, dan aktivitas
    const [selectedSubject, setSelectedSubject] = useState(null)
    const [hoveredCard, setHoveredCard] = useState(null)
    // Inisialisasi User Context
    const { user, logout } = useAuth();

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
                            <p className="text-gray-600">Kelas E</p>
                        </div>
                    </div>
                </div>

                {/* Kartu Subjek */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subjects.map((subject) => {
                        const IconComponent = subject.icon
                        return (
                            <Link
                                to={`/kelas/${subject.id}`}
                                key={subject.id}
                            >
                                <div
                                    key={subject.id}
                                    className={`relative bg-white rounded-3xl p-6 shadow-lg cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-gray-100 ${hoveredCard === subject.id ? "ring-4 ring-blue-200" : ""
                                        }`}
                                    onMouseEnter={() => setHoveredCard(subject.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                    onClick={() => setSelectedSubject(subject)}
                                >
                                    {/* Ikon Subject ama Nama */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className={`${subject.color} p-4 rounded-2xl shadow-lg`}>
                                            <IconComponent className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{subject.name}</h3>
                                            <p className="text-gray-500 text-sm">{subject.lessons} Pelajaran</p>
                                        </div>
                                    </div>

                                    {/* Info Materi */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Clock className="w-4 h-4" />
                                            <span>Pelajaran Selanjutnya:</span>
                                        </div>
                                        <p className="text-sm font-medium text-gray-800 bg-gray-50 p-2 rounded-lg">{subject.nextLesson}</p>
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
            </main>
        </div>
    )
}