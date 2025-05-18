
import { useState } from "react"
import { Link } from 'react-router-dom';

export default function CourseUI() {

    // State and navigate hooks
    const [activeTab, setActiveTab] = useState("Detail Kursus")
    const [expandedLessons, setExpandedLessons] = useState({ 1: true })
    const [completedItems, setCompletedItems] = useState([1, 2])

    //Data kursus
    const courseData = {
        title: "Biologi - Reproduksi Manusia",
        description:
            "Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi non accusamus excepturi consequuntur placeat minima sit esse numquam deserunt delectus, totam velit beatae, officiis expedita aliquid dignissimos qui maxime vero?",
        progress: {
            percentage: 35,
            completed: 26,
            total: 75,
        },
        lessons: [
            {
                id: 1,
                title: "Lesson 1: Introduction",
                content: "1/5 Content",
                items: [
                    { id: 1, title: "1. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 2, title: "2. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 3, title: "3. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 4, title: "4. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 5, title: "5. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                ],
            },
            {
                id: 2,
                title: "Lesson 2: Lorem Ipsum",
                content: "1/5 Content",
                items: [
                    { id: 6, title: "1. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 7, title: "2. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                ],
            },
            {
                id: 3,
                title: "Lesson 3: Lorem Ipsum",
                content: "1/5 Content",
                items: [
                    { id: 8, title: "1. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 9, title: "2. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                ],
            },
            {
                id: 4,
                title: "Lesson 4: Lorem Ipsum",
                content: "1/5 Content",
                items: [
                    { id: 10, title: "1. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 11, title: "2. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                ],
            },
            {
                id: 5,
                title: "Lesson 5: Lorem Ipsum",
                content: "1/5 Content",
                items: [
                    { id: 12, title: "1. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 13, title: "2. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                ],
            },
            {
                id: 6,
                title: "Lesson 6: Lorem Ipsum",
                content: "1/5 Content",
                items: [
                    { id: 14, title: "1. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 15, title: "2. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                ],
            },
            {
                id: 7,
                title: "Lesson 7: Lorem Ipsum",
                content: "1/5 Content",
                items: [
                    { id: 16, title: "1. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 17, title: "2. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                ],
            },
            {
                id: 8,
                title: "Lesson 8: Lorem Ipsum",
                content: "1/5 Content",
                items: [
                    { id: 18, title: "1. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 19, title: "2. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                ],
            },
            {
                id: 9,
                title: "Lesson 9: Lorem Ipsum",
                content: "1/5 Content",
                items: [
                    { id: 20, title: "1. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 21, title: "2. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                ],
            },
            {
                id: 10,
                title: "Lesson 10: Lorem Ipsum",
                content: "1/5 Content",
                items: [
                    { id: 22, title: "1. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                    { id: 23, title: "2. Lorem Ipsum Cenat Simat", description: "Lorem Ipsum Cenat Simat" },
                ],
            },
        ],
    } 

    // Untuk mengubah tab aktif
    const toggleLesson = (lessonId) => {
        setExpandedLessons((prev) => ({
            ...prev,
            [lessonId]: !prev[lessonId],
        }))
    }

    // Untuk toggle completion
    const toggleCompletion = (itemId) => {
        setCompletedItems((prev) => {
            if (prev.includes(itemId)) {
                return prev.filter((id) => id !== itemId)
            } else {
                return [...prev, itemId]
            }
        })
    }


    return(
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="bg-blue-500 text-white py-3 px-6 flex justify-between items-center">
                <div className="flex items-center">
                    <img src="/public/Logo.png?height=40&width=40" alt="MindaGrow Logo" className="h-10 w-10 mr-2" />
                    <h1 className="text-xl font-bold">MindaGrow</h1>
                </div>
                <Link to="/course-siswa" className="text-white">
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
                            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                        />
                    </svg>
                </Link>
            </header>


            {/* Main Content */}
            <div className="flex flex-1">
                {/* Main Content Area */}
                <div className="flex-1 p-8 flex items-center justify-center bg-gray-100">
                    <div className="text-center">
                        <h1 className="text-9xl font-bold text-gray-800">MATERI</h1>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto">
                    {/* Progress Bar */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">Your Progress</span>
                            <span className="text-sm font-medium text-blue-600">{courseData.progress.percentage}%</span>
                        </div>
                        <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${courseData.progress.percentage}%` }}></div>
                        </div>
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {courseData.progress.completed}/{courseData.progress.total}
                        </div>
                    </div>

                    {/* Course Details */}
                    <div className="divide-y divide-gray-200">
                        {courseData.lessons.map((lesson) => (
                            <div key={lesson.id} className="border-b border-gray-200">
                                <button
                                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                                    onClick={() => toggleLesson(lesson.id)}
                                >
                                    <div>
                                        <h3 className="font-medium">{lesson.title}</h3>
                                        <p className="text-xs text-gray-500">{lesson.content}</p>
                                    </div>
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className={`h-5 w-5 text-gray-400 transition-transform ${
                                        expandedLessons[lesson.id] ? "transform rotate-180" : ""
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {expandedLessons[lesson.id] && (
                                    <div className="bg-gray-50 px-4 py-2">
                                        <ul className="space-y-2">
                                            {lesson.items.map((item) => (
                                                <li key={item.id} className="flex items-start py-2">
                                                    <button
                                                        className={`flex-shrink-0 w-6 h-6 rounded border ${
                                                            completedItems.includes(item.id)
                                                                ? "bg-blue-500 border-blue-500 text-white"
                                                                : "border-gray-300"
                                                        } flex items-center justify-center mr-3`}
                                                        onClick={() => toggleCompletion(item.id)}
                                                    >
                                                        {completedItems.includes(item.id) && (
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="h-4 w-4"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                stroke="currentColor"
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                    <div>
                                                        <p className="font-medium text-sm">{item.title}</p>
                                                        <p className="text-xs text-gray-500">{item.description}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="border-t border-gray-200 bg-white">
                <div className="flex">
                    {["Detail Kursus", "Catatan", "Hubungi Guru"].map((tab) => (
                        <button
                            key={tab}
                            className={`flex-1 py-4 px-4 text-center ${
                                activeTab === tab ? "text-blue-600 border-t-2 border-blue-600" : "text-gray-600"
                            }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="p-4">
                    {activeTab === "Detail Kursus" && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4">{courseData.title}</h2>
                            <p className="text-gray-600">{courseData.description}</p>
                        </div>
                    )}
                    {activeTab === "Catatan" && (
                        <div>
                            <textarea
                                className="w-full border border-gray-300 rounded-md p-3 h-32"
                                placeholder="Tulis catatan Anda di sini..."
                            ></textarea>
                        </div>
                    )}
                    {activeTab === "Hubungi Guru" && (
                        <div>
                            <div className="bg-gray-100 rounded-md p-4 mb-4">
                                <h3 className="font-medium mb-2">Senia Willingtion S</h3>
                                <p className="text-sm text-gray-600 mb-4">
                                    Silahkan hubungi saya jika ada pertanyaan terkait materi kursus ini.
                                </p>
                                <button className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm">Kirim Pesan</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}