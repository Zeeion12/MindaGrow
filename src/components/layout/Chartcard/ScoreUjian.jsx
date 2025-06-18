import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { FiDownload, FiBarChart2, FiList, FiInfo } from "react-icons/fi"

// Data untuk rata-rata skor siswa per mata pelajaran dalam satu bulan
const subjectScores = [
    { subject: "Matematika", score: 76, color: "#3b82f6" },
    { subject: "Bahasa Indonesia", score: 86, color: "#10b981" },
    { subject: "Bahasa Inggris", score: 71, color: "#f59e0b" },
    { subject: "IPA", score: 81, color: "#8b5cf6" },
    { subject: "IPS", score: 75, color: "#ec4899" },
    { subject: "Seni dan Kerajinan", score: 92, color: "#06b6d4" },
    { subject: "Pendidikan Jasmani", score: 90, color: "#84cc16" },
]

// Custom Tooltip untuk Recharts
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-2 border border-slate-200 shadow-lg rounded-lg text-xs">
                <p className="font-medium text-slate-800">{payload[0].payload.subject}</p>
                <p className=" text-slate-600">
                    Skor: <span className="font-medium">{payload[0].value}</span>
                </p>
            </div>
        )
    }
    return null
}

export default function ScoreUjian() {
    const [view, setView] = useState("chart")

    // Fungsi untuk menentukan warna berdasarkan skor
    const getScoreColor = (score) => {
        if (score >= 85) return "bg-emerald-100 text-emerald-800 border-l-emerald-500"
        if (score >= 75) return "bg-blue-100 text-blue-800 border-l-blue-500"
        if (score >= 65) return "bg-amber-100 text-amber-800 border-l-amber-500"
        return "bg-rose-100 text-rose-800 border-l-rose-500"
    }

    // Fungsi untuk mengunduh data sebagai CSV
    const downloadCSV = () => {
        const csvContent =
            "Mata Pelajaran,Rata-Rata Skor\n" + subjectScores.map((item) => `${item.subject},${item.score}`).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", "rata-rata-skor-siswa.csv")
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200">
            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 border-b p-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl text-red-50 font-bold">Rata-Rata Skor Ujian Anda</h2>
                        <p className="text-white mt-1">Data rata-rata skor untuk 7 mata pelajaran dalam satu bulan</p>
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
                            onClick={downloadCSV}
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50
                            hover:text-slate-900 shadow-sm rounded-md px-3 py-1.5 text-sm font-medium 
                            flex items-center gap-1.5 transition-colors"
                        >
                            <FiDownload className="size-4" />
                            Unduh Data
                        </button>
                    </div>
                </div>
            </div>

            {/* Card Content */}
            <div className="p-4">
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
                                        className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase tracking-wider"
                                    >
                                        Rata-Rata Skor
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-200">
                                {subjectScores.map((item, index) => (
                                    <tr key={item.subject} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">{index + 1}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{item.subject}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span
                                                className={`inline-block px-3 py-1 rounded-full text-sm font-medium border-l-4 ${getScoreColor(item.score)}`}
                                            >
                                                {item.score}
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
            </div>
        </div>
    )
}