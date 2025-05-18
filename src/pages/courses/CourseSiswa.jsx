

import { useState } from "react"
import { Link } from 'react-router-dom';

export default function CourseSiswa() {
    // State untuk tab navigasi
    const [activeTab, setActiveTab] = useState("Deskripsi")
    // State untuk lesson yang terbuka
    const [openLesson, setOpenLesson] = useState(1)

    // Data kursus
    const courseData = {
        title: "Biologi - Reproduksi Manusia",
        description:
            "Pada modul ini anda akan belajar mengenai organ reproduksi yang ada pada manusia serta belajar mengenai kegunaanya",
        instructor: "Senia Willingtion S",
        instructorImage: "/placeholder.svg?height=50&width=50",
        aboutCourse:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi non accusamus excepturi consequuntur placeat minima sit esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?",
        learningPoints: [
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi non accusamus excepturi consequuntur placeat minima sit",
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi non accusamus excepturi consequuntur placeat minima sit",
            "esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?",
            "esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?",
        ],
        moduleCount: 15,
        tabs: ["Deskripsi", "Kontent Kursus", "Guru"],
        lessons: [
            {
                id: 1,
                title: "Lesson 1: Introduction",
                subLessons: [
                "Lorem ipsum sit lacus trum",
                "Lorem ipsum sit lacus trum",
                "Lorem ipsum sit lacus trum",
                "Lorem ipsum sit lacus trum",
                ],
            },
            {
                id: 2,
                title: "Lesson 2: Lorem ipsum",
                subLessons: ["Lorem ipsum sit lacus trum", "Lorem ipsum sit lacus trum"],
            },
            {
                id: 3,
                title: "Lesson 3: Lorem ipsum",
                subLessons: ["Lorem ipsum sit lacus trum", "Lorem ipsum sit lacus trum"],
            },
            {
                id: 4,
                title: "Lesson 4: Lorem ipsum",
                subLessons: ["Lorem ipsum sit lacus trum", "Lorem ipsum sit lacus trum"],
            },
        ],
        guru: {
            name: "Senia Willingtion S B.Ed.",
            bio: "Seorang educator berpengalaman dengan gelar Sarjana Pendidikan (B.Ed.). Dengan latar belakang yang kuat dalam bidang pengajaran dan pengembangan materi edukatif, Senia berkomitmen membantu siswa dan para pengajar mencapai potensi terbaik mereka.",
            additionalInfo:
                "Melalui kurikulum inovatif dan metode pembelajaran interaktif, dia telah menyebarkan pengetahuan dan inspirasi di berbagai platform, termasuk Udemy. Pengabdian dan dedikasinya menjadikannya mentor terpercaya dalam bidang pendidikan online.",
            courseCount: 200,
            otherCourses: [
                {
                id: 1,
                title: "Biologi - Organisme dalam tumbuhan",
                image: "/placeholder.svg?height=200&width=300",
                },
                {
                id: 2,
                title: "Biologi - Bagian-bagian tubuh pada hewan kucing",
                image: "/placeholder.svg?height=200&width=300",
                },
            ],
        },
    }

    // Toggle lesson
    const toggleLesson = (lessonId) => {
        if (openLesson === lessonId) {
            setOpenLesson(null)
        } else {
            setOpenLesson(lessonId)
        }
    }

    

    return (
        <div className="bg-gray-50 min-h-screen">
            {/* Header Section */}
            <div
                className="relative w-full h-72 bg-cover bg-center text-white p-8 flex flex-col justify-end"
                style={{ backgroundImage: "url('/placeholder.svg?height=400&width=1200')" }}
            >
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-bold mb-2">{courseData.title}</h1>
                    <p className="text-lg mb-6 max-w-2xl">{courseData.description}</p>
                    <div className="flex items-center">
                        <img
                        src={courseData.instructorImage || "/placeholder.svg"}
                        alt={courseData.instructor}
                        className="w-12 h-12 rounded-full bg-gray-200"
                        />
                        <span className="ml-3 text-lg">{courseData.instructor}</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Navigation Tabs */}
                <div className="border-b border-gray-200">
                    <div className="flex space-x-8">
                        {courseData.tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`py-4 px-1 relative ${
                            activeTab === tab
                                ? "text-blue-600 border-b-2 border-blue-600 font-medium"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                        ))}
                    </div>
                </div>

                {/* Content Grid */}
                <div className="grid md:grid-cols-3 gap-8 py-6">
                    {/* Course Content */}
                    <div className="md:col-span-2">
                        {/* Deskripsi Tab */}
                        {activeTab === "Deskripsi" && (
                            <div className="py-8">
                                <div className="mb-12">
                                    <h2 className="text-3xl font-bold mb-6">Tentang Kursus Ini</h2>
                                    <p className="text-gray-600 leading-relaxed">{courseData.aboutCourse}</p>
                                </div>

                                <div>
                                    <h2 className="text-3xl font-bold mb-6">Disini Anda Akan Belajar</h2>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        {courseData.learningPoints.map((point, index) => (
                                            <div key={index} className="flex items-start">
                                                <div className="flex-shrink-0 mt-1">
                                                <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                                                </div>
                                                <p className="ml-4 text-gray-600">{point}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                {/* Kontent Kursus Tab */}
                {activeTab === "Kontent Kursus" && (
                    <div className="py-8">
                        <h2 className="text-3xl font-bold mb-6">Konten Kursus</h2>
                        <div className="space-y-4">
                            {courseData.lessons.map((lesson) => (
                                <div key={lesson.id} className="border rounded-md overflow-hidden">
                                    <button
                                        className={`w-full flex items-center justify-between p-4 text-left ${
                                        openLesson === lesson.id ? "bg-blue-50" : "bg-white"
                                        }`}
                                        onClick={() => toggleLesson(lesson.id)}
                                    >
                                        <div className="flex items-center">
                                            <span
                                                className={`transform transition-transform ${openLesson === lesson.id ? "rotate-180" : ""}`}
                                            >
                                                <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className="h-5 w-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            </span>
                                            <span className="ml-2 font-medium">{lesson.title}</span>
                                        </div>
                                    </button>
                                    {openLesson === lesson.id && (
                                        <div className="bg-white border-t p-4">
                                            <ul className="space-y-3">
                                                {lesson.subLessons.map((subLesson, index) => (
                                                    <li key={index} className="flex items-center text-gray-600">
                                                        <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5 mr-3 text-gray-400"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                            />
                                                        </svg>
                                                        {subLesson}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Guru Tab */}
                {activeTab === "Guru" && (
                    <div className="py-8">
                        <h2 className="text-3xl font-bold mb-6">Tentang Guru</h2>
                        <div className="flex flex-col md:flex-row gap-6 mb-8">
                            <div className="flex-shrink-0">
                                <img
                                src="/placeholder.svg?height=200&width=200"
                                alt={courseData.guru.name}
                                className="w-48 h-48 rounded-full object-cover"
                                />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">{courseData.guru.name}</h3>
                                <p className="text-gray-600 mb-4">{courseData.guru.bio}</p>
                                <p className="text-gray-600 mb-4">{courseData.guru.additionalInfo}</p>
                                <div className="flex items-center text-gray-600">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5 mr-2"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                                        />
                                    </svg>
                                    <span>{courseData.guru.courseCount} Courses</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-2xl font-bold mb-6">Kursus Lain Dari Guru Ini</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {courseData.guru.otherCourses.map((course) => (
                                    <div key={course.id} className="group relative overflow-hidden rounded-lg">
                                        <img
                                            src={course.image || "/placeholder.svg"}
                                            alt={course.title}
                                            className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end">
                                            <h4 className="text-white font-medium p-4">{course.title}</h4>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Course Sidebar */}
            <div className="md:col-span-1">
                <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
                <div className="flex justify-center mb-6">
                    <img src="/placeholder.svg?height=200&width=200" alt="Student illustration" className="w-full h-auto" />
                </div>

                <h3 className="font-medium text-lg mb-4">This Course Include :</h3>

                <div className="flex items-center mb-6">
                    <div className="mr-3">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    </div>
                    <span>{courseData.moduleCount} Module</span>
                </div>

                <Link
                    to="/course-ui"
                    className="block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-md transition duration-200 text-center"
                >
                    Start Course
                </Link>
                </div>
            </div>
            </div>
        </div>
        </div>
    )
}

