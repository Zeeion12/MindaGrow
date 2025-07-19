import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { FiDownload, FiBarChart2, FiList, FiInfo, FiRefreshCw, FiAlertCircle, FiCpu } from "react-icons/fi"
import AIInsights from "../../AIInsights"

// Custom Tooltip untuk Recharts
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
                <p className="font-medium text-slate-800">{payload[0].payload.subject}</p>
                <p className="text-slate-600">
                    Rata-rata Skor: <span className="font-medium">{payload[0].value}</span>
                </p>
                <p className="text-slate-500 text-xs mt-1">
                    Total Tugas: {payload[0].payload.total_assignments}
                </p>
            </div>
        )
    }
    return null
}

export default function ScoreChartSiswa() {
    const [view, setView] = useState("chart")
    const [subjectScores, setSubjectScores] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [aiInsights, setAiInsights] = useState(null)
    const [aiLoading, setAiLoading] = useState(false)
    const [showAI, setShowAI] = useState(false)

    // Fungsi untuk mengambil data dari API
    const fetchStudentScores = async () => {
        try {
            setLoading(true)
            setError(null)

            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Token tidak ditemukan. Silakan login kembali.')
            }

            const response = await fetch('/api/student-scores/subjects', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error('Sesi telah berakhir. Silakan login kembali.')
                }
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (!result.success) {
                throw new Error(result.message || 'Gagal mengambil data')
            }

            // Transform data untuk chart
            const transformedData = result.data.map((item, index) => ({
                subject: item.subject_name,
                score: parseFloat(item.average_score) || 0,
                total_assignments: item.total_assignments,
                color: getSubjectColor(index),
                all_scores: item.all_scores || []
            }))

            setSubjectScores(transformedData)

        } catch (err) {
            console.error('Error fetching student scores:', err)
            setError(err.message)

            // Set data dummy jika error untuk development
            setSubjectScores([
                { subject: "Belum ada data", score: 0, color: "#e2e8f0", total_assignments: 0 }
            ])
        } finally {
            setLoading(false)
        }
    }

    // Fungsi untuk mendapatkan warna berdasarkan index
    const getSubjectColor = (index) => {
        const colors = [
            "#3b82f6", // blue
            "#10b981", // emerald
            "#f59e0b", // amber
            "#8b5cf6", // violet
            "#ec4899", // pink
            "#06b6d4", // cyan
            "#84cc16", // lime
            "#f97316", // orange
            "#6366f1", // indigo
            "#14b8a6"  // teal
        ]
        return colors[index % colors.length]
    }

    // Fungsi untuk menentukan warna berdasarkan skor
    const getScoreColor = (score) => {
        if (score >= 85) return "bg-emerald-100 text-emerald-800 border-l-emerald-500"
        if (score >= 75) return "bg-blue-100 text-blue-800 border-l-blue-500"
        if (score >= 65) return "bg-amber-100 text-amber-800 border-l-amber-500"
        return "bg-rose-100 text-rose-800 border-l-rose-500"
    }

    // Fungsi untuk mengunduh data sebagai CSV
    const downloadCSV = () => {
        if (!subjectScores || subjectScores.length === 0) {
            alert('Tidak ada data untuk diunduh')
            return
        }

        const csvContent =
            "Mata Pelajaran,Rata-Rata Skor,Total Tugas\n" +
            subjectScores.map((item) =>
                `${item.subject},${item.score},${item.total_assignments}`
            ).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", `rata-rata-skor-tugas-${new Date().toISOString().split('T')[0]}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    // Load data saat component mount
    useEffect(() => {
        fetchStudentScores()
    }, [])

    const handleRefresh = () => {
        fetchStudentScores()
    }

    // Tambahkan fungsi ini setelah handleRefresh
    const handleAIAnalysis = () => {
        fetchAIInsights()
    }

    // Fungsi untuk mengambil AI insights
    const fetchAIInsights = async () => {
        try {
            setAiLoading(true)

            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Token tidak ditemukan. Silakan login kembali.')
            }

            const response = await fetch('/api/analytics/score-insights', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const result = await response.json()

            if (result.success) {
                setAiInsights(result.data.insights)
                setShowAI(true)
            } else {
                throw new Error(result.message || 'Gagal mengambil AI insights')
            }

        } catch (err) {
            console.error('Error fetching AI insights:', err)
            setError('Gagal mengambil AI insights: ' + err.message)
        } finally {
            setAiLoading(false)
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 border-b p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl text-white font-bold">Rata-Rata Skor Tugas Anda</h2>
                        <p className="text-blue-100 mt-1">
                            {loading ? 'Memuat data...' :
                                error ? 'Data tidak dapat dimuat' :
                                    `Data rata-rata skor untuk ${subjectScores.length} mata pelajaran`}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <div className="bg-white rounded-lg shadow-sm p-1 flex">
                            <button
                                onClick={() => setView("chart")}
                                className={`rounded-md flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors
                                ${view === "chart" ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100"}`}
                            >
                                <FiBarChart2 className="size-4" />Chart
                            </button>
                            <button
                                onClick={() => setView("table")}
                                className={`rounded-md flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors
                                ${view === "table" ? "bg-sky-100 text-sky-700" : "text-slate-600 hover:bg-slate-100"}`}
                            >
                                <FiList className="size-4" />Tabel
                            </button>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={loading}
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50
                            hover:text-slate-900 shadow-sm rounded-md px-3 py-1.5 text-sm font-medium 
                            flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            <FiRefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        <button
                            onClick={handleAIAnalysis}
                            disabled={loading || subjectScores.length === 0 || aiLoading}
                            className="bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 
                            hover:to-purple-600 shadow-sm rounded-md px-3 py-1.5 text-sm font-medium 
                            flex items-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <FiCpu className={`size-4 ${aiLoading ? 'animate-pulse' : ''}`} />
                            {aiLoading ? 'Menganalisis...' : 'AI Analysis'}
                        </button>

                        <button
                            onClick={downloadCSV}
                            disabled={loading || error || subjectScores.length === 0}
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50
                            hover:text-slate-900 shadow-sm rounded-md px-3 py-1.5 text-sm font-medium 
                            flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                            <FiDownload className="size-4" />
                            Unduh Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
                {/* AI Insights Section */}
                {showAI && aiInsights && (
                    <div className="mb-4">
                        <AIInsights
                            insights={aiInsights}
                            loading={aiLoading}
                            onClose={() => setShowAI(false)}
                        />
                    </div>
                )}
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <FiAlertCircle className="text-red-500 size-5" />
                            <div>
                                <h3 className="font-medium text-red-800">Gagal Memuat Data</h3>
                                <p className="text-red-600 text-sm mt-1">{error}</p>
                                <button
                                    onClick={handleRefresh}
                                    className="mt-2 text-red-700 underline text-sm hover:text-red-800"
                                >
                                    Coba lagi
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {loading && (
                    <div className="flex items-center justify-center py-12">
                        <div className="flex items-center gap-3">
                            <FiRefreshCw className="animate-spin text-blue-500 size-5" />
                            <span className="text-slate-600">Memuat data skor tugas...</span>
                        </div>
                    </div>
                )}

                {!loading && !error && subjectScores.length === 0 && (
                    <div className="text-center py-12">
                        <FiInfo className="mx-auto text-slate-400 size-12 mb-4" />
                        <h3 className="text-slate-600 font-medium mb-2">Belum Ada Data Tugas</h3>
                        <p className="text-slate-500 text-sm">
                            Anda belum memiliki nilai tugas untuk mata pelajaran apapun.
                        </p>
                    </div>
                )}

                {!loading && !error && subjectScores.length > 0 && (
                    <>
                        {view === "chart" ? (
                            <div className="mt-4 bg-white rounded-xl p-2 border border-slate-100">
                                <div className="h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={subjectScores} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="subject"
                                                tick={{ fill: "#64748b", fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={{ stroke: "#e2e8f0" }}
                                                angle={-35}
                                                textAnchor="end"
                                                height={50}
                                            />
                                            <YAxis
                                                domain={[0, 100]}
                                                tick={{ fill: "#64748b", fontSize: 10 }}
                                                tickLine={false}
                                                axisLine={{ stroke: "#e2e8f0" }}
                                                label={{
                                                    value: "Skor",
                                                    angle: -90,
                                                    position: "insideLeft",
                                                    offset: -5,
                                                    style: { fill: "#64748b", fontSize: 10 },
                                                }}
                                            />
                                            <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(236, 240, 244, 0.5)" }} />
                                            <Bar dataKey="score" radius={[3, 3, 0, 0]} maxBarSize={40} animationDuration={1500}>
                                                {subjectScores.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                        fillOpacity={0.9}
                                                        stroke={entry.color}
                                                        strokeWidth={1}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                                <table className="min-w-full divide-y divide-slate-200">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider w-16"
                                            >
                                                No
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider"
                                            >
                                                Mata Pelajaran
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-center text-xs font-semibold text-slate-700 uppercase tracking-wider"
                                            >
                                                Total Tugas
                                            </th>
                                            <th
                                                scope="col"
                                                className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider"
                                            >
                                                Rata-Rata Skor
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-slate-200">
                                        {subjectScores.map((item, index) => (
                                            <tr key={`${item.subject}-${index}`} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">
                                                    {index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">
                                                    {item.subject}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-slate-600">
                                                    {item.total_assignments} tugas
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <span
                                                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium border-l-4 ${getScoreColor(item.score)}`}
                                                    >
                                                        {item.score.toFixed(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-1.5 mb-2">
                                <FiInfo className="size-3.5 text-slate-700" />
                                <p className="font-semibold text-slate-700 text-xs">Keterangan Skor:</p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                                    <div className="size-2.5 rounded-full bg-emerald-500"></div>
                                    <span className="text-sm text-slate-700">≥ 85: Sangat Baik</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                                    <div className="size-2.5 rounded-full bg-blue-500"></div>
                                    <span className="text-sm text-slate-700">75-84: Baik</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                                    <div className="size-2.5 rounded-full bg-amber-500"></div>
                                    <span className="text-sm text-slate-700">65-74: Cukup</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                                    <div className="size-2.5 rounded-full bg-rose-500"></div>
                                    <span className="text-sm text-slate-700">&lt; 65: Perlu Perbaikan</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}