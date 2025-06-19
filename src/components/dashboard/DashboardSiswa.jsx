import React from 'react';
import { useAuth } from '../../context/authContext';
import { useState } from "react"
import { RiBarChartFill } from 'react-icons/ri';
import Header from '../layout/layoutParts/Header';
import LearnDurationChart from '../layout/Chartcard/LearnDurationChart'
import ScoreChartSiswa from '../layout/Chartcard/ScoreChartSiswa'
import ChatbotCard from '../layout/TaskCard/ChatbotCard';

const DashboardSiswa = () => {

  const [activeTab, setActiveTab] = useState("overview")
  const { user, logout } = useAuth();

  const achievements = [
    { title: "Perfect Score", description: "Mendapat nilai 100", icon: "🏆", date: "2 hari lalu" },
    { title: "Study Streak", description: "Belajar 7 hari berturut", icon: "🔥", date: "Hari ini" },
    { title: "Quick Learner", description: "Menyelesaikan 5 materi", icon: "⚡", date: "1 minggu lalu" },
    { title: "Team Player", description: "Aktif dalam diskusi", icon: "🤝", date: "3 hari lalu" },
  ]

  const upcomingTasks = [
    { subject: "Matematika", task: "Ujian Trigonometri", deadline: "2024-05-15", priority: "high" },
    { subject: "Fisika", task: "Laporan Praktikum", deadline: "2024-05-18", priority: "medium" },
    { subject: "Kimia", task: "Tugas Reaksi Redoks", deadline: "2024-05-20", priority: "low" },
    { subject: "Biologi", task: "Presentasi Genetika", deadline: "2024-05-22", priority: "high" },
  ]

  const studySchedule = [
    { time: "07:30", subject: "Matematika", room: "Lab 1", type: "Kelas" },
    { time: "09:00", subject: "Fisika", room: "Lab 2", type: "Praktikum" },
    { time: "10:30", subject: "Istirahat", room: "-", type: "Break" },
    { time: "11:00", subject: "Kimia", room: "Kelas A", type: "Kelas" },
    { time: "12:30", subject: "Makan Siang", room: "-", type: "Break" },
    { time: "13:30", subject: "B. Indonesia", room: "Kelas B", type: "Kelas" },
  ]

  const recentActivities = [
    {
      subject: "Matematika",
      activity: "Menyelesaikan Quiz Aljabar",
      score: "95/100",
      time: "2 jam lalu",
      type: "quiz",
    },
    {
      subject: "Fisika",
      activity: "Mengumpulkan Tugas Gerak",
      score: "88/100",
      time: "1 hari lalu",
      type: "assignment",
    },
    {
      subject: "Kimia",
      activity: "Diskusi Forum Asam Basa",
      score: "+15 poin",
      time: "2 hari lalu",
      type: "discussion",
    },
    {
      subject: "Biologi",
      activity: "Menonton Video Fotosintesis",
      score: "Selesai",
      time: "3 hari lalu",
      type: "video",
    },
  ]



  return (
    <div className="h-screen flex flex-col">
      <Header />

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Welcome Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-400 rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">Selamat datang kembali, {user.nama_lengkap}! 👋</h2>
                <p className="text-blue-100 mb-4">
                  Hari ini adalah hari yang tepat untuk belajar. Mari capai target belajar Anda!
                </p>
                <div className="flex items-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-500 p-1 rounded text-xl">🔥</span>
                    <span className='font-bold text-xl'>Streak: 7 hari</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-500 p-1 rounded text-xl">⭐</span>
                    <span className='font-bold text-xl'>Level: 12</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-500 p-1 rounded text-xl">🎯</span>
                    <span className='font-bold text-xl'>Target harian: 4/6 selesai</span>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <div className="bg-white bg-opacity-20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold">85%</div>
                  <div className="text-sm text-blue-100">Progress Mingguan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Chatbot Card */}
            <ChatbotCard />

            {/* Kemajuan Belajar Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-blue-500 p-3 rounded-lg mr-4">
                  <RiBarChartFill className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-gray-600">Kemajuan Belajar</p>
                  <h3 className="text-2xl font-bold text-gray-800">72%</h3>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: "72%" }}></div>
              </div>
            </div>

            {/* Points Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-yellow-400 p-3 rounded-lg mr-4">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600">Total Poin</p>
                  <h3 className="text-2xl font-bold text-gray-800">1,250</h3>
                </div>
              </div>
              <div className="text-sm text-green-500 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    clipRule="evenodd"
                  />
                </svg>
                +25 hari ini
              </div>
            </div>

            {/* Tasks Card */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="bg-green-500 p-3 rounded-lg mr-4">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600">Tugas</p>
                  <h3 className="text-2xl font-bold text-gray-800">5</h3>
                </div>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-500">3 selesai</span>
                <span className="text-yellow-500">2 baru</span>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Seksion Aktivitas */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`px-3 py-1 text-sm rounded-md ${activeTab === "overview" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => setActiveTab("assignments")}
                      className={`px-3 py-1 text-sm rounded-md ${activeTab === "assignments" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Tugas
                    </button>
                    <button
                      onClick={() => setActiveTab("quizzes")}
                      className={`px-3 py-1 text-sm rounded-md ${activeTab === "quizzes" ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:text-gray-700"}`}
                    >
                      Quiz
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div
                        className={`p-2 rounded-lg mr-4 ${activity.type === "quiz"
                          ? "bg-blue-100"
                          : activity.type === "assignment"
                            ? "bg-green-100"
                            : activity.type === "discussion"
                              ? "bg-purple-100"
                              : "bg-yellow-100"
                          }`}
                      >
                        {activity.type === "quiz" && <span className="text-blue-600">📝</span>}
                        {activity.type === "assignment" && <span className="text-green-600">📋</span>}
                        {activity.type === "discussion" && <span className="text-purple-600">💬</span>}
                        {activity.type === "video" && <span className="text-yellow-600">🎥</span>}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">{activity.subject}</h4>
                          <span className="text-sm text-gray-500">{activity.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{activity.activity}</p>
                        <p className="text-sm font-medium text-green-600 mt-1">{activity.score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full min-h-[400px]">
                <LearnDurationChart />
              </div>

              <div className="w-full min-h-[400px]">
                <ScoreChartSiswa />
              </div>
            </div>

            {/* Right Content */}
            <div className='space-y-6'>
              {/* Schedule Hari ini */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Jadwal Hari Ini</h3>
                  <span className="text-sm text-gray-500">Senin, 13 Mei</span>
                </div>
                <div className="space-y-3">
                  {studySchedule.map((schedule, index) => (
                    <div
                      key={index}
                      className={`flex items-center p-3 rounded-lg ${schedule.type === "Break" ? "bg-gray-50" : "bg-blue-50 border-l-4 border-blue-500"
                        }`}
                    >
                      <div className="text-sm font-medium text-gray-900 w-16">{schedule.time}</div>
                      <div className="flex-1 ml-3">
                        <p className="text-sm font-medium text-gray-900">{schedule.subject}</p>
                        {schedule.room !== "-" && <p className="text-xs text-gray-500">{schedule.room}</p>}
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${schedule.type === "Kelas"
                          ? "bg-blue-100 text-blue-700"
                          : schedule.type === "Praktikum"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700"
                          }`}
                      >
                        {schedule.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tugas Mendatang */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Tugas Mendatang</h3>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Lihat Semua</button>
                </div>
                <div className="space-y-3">
                  {upcomingTasks.map((task, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm">{task.subject}</h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${task.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : task.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                            }`}
                        >
                          {task.priority === "high" ? "Urgent" : task.priority === "medium" ? "Sedang" : "Rendah"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{task.task}</p>
                      <p className="text-xs text-gray-500">
                        Deadline: {new Date(task.deadline).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pencapaian */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Pencapaian Terbaru</h3>
                  <button className="text-blue-600 text-sm font-medium hover:text-blue-700">Lihat Semua</button>
                </div>
                <div className="space-y-3">
                  {achievements.map((achievement, index) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                    >
                      <div className="text-2xl mr-3">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{achievement.title}</h4>
                        <p className="text-xs text-gray-600">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{achievement.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>




        </div>
      </main>
    </div>
  );
};

export default DashboardSiswa;