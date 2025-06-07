import { useState } from "react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { FiDownload, FiBarChart2, FiList, FiInfo } from "react-icons/fi"

// Data Dummy untuk chart
const subjectAccesses = [
    { subject: "Matematika", accesses: 1250, color: "#3b82f6" },
    { subject: "IPA", accesses: 980, color: "#10b981" },
    { subject: "Bahasa Indonesia", accesses: 850, color: "#f59e0b" },
    { subject: "Bahasa Inggris", accesses: 720, color: "#8b5cf6" },
    { subject: "IPS", accesses: 650, color: "#ec4899" },
    { subject: "PKN", accesses: 420, color: "#06b6d4" },
    { subject: "Seni Budaya", accesses: 380, color: "#84cc16" },
    { subject: "Olahraga", accesses: 290, color: "#ef4444" },
]

// Custom Tooltip untuk Recharts
const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
        <div className="bg-white p-2 border border-slate-200 shadow-lg rounded-lg text-xs">
            <p className="font-medium text-slate-800">{payload[0].payload.subject}</p>
            <p className=" text-slate-600">
                Akses: <span className="font-medium">{payload[0].value.toLocaleString()}</span>
            </p>
        </div>
        )
    }
    return null
}

export default function FavoriteSubjectChart() {
    // State untuk mengatur tampilan chart atau daftar
    const [view, setView] = useState("chart")

    // Fungsi untuk menentukan warna berdasarkan jumlah akses
    const getAccessColor = (accesses) => {
        if (accesses >= 1000) return "bg-emerald-100 text-emerald-800 border-l-emerald-500"
        if (accesses >= 700) return "bg-blue-100 text-blue-800 border-l-blue-500"
        if (accesses >= 400) return "bg-amber-100 text-amber-800 border-l-amber-500"
        return "bg-rose-100 text-rose-800 border-l-rose-500"
    }

    // Fungsi untuk mengunduh data sebagai CSV
    const downloadCSV = () => {
        const csvContent =
            "Mata Pelajaran,Jumlah Akses\n" + subjectAccesses.map((item) => `${item.subject},${item.accesses}`).join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.setAttribute("href", url)
        link.setAttribute("download", "data-akses-mata-pelajaran.csv")
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
                        <h2 className="text-2xl text-white font-bold">Mata Pelajaran Paling Sering Diakses</h2>
                        <p className="text-blue-100 mt-1">
                            Data akses modul dan kelas untuk 8 mata pelajaran dalam 30 hari terakhir
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
                            onClick={downloadCSV}
                            className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50
                            hover:text-slate-900 shadow-sm rounded-md px-3 py-1.5 text-sm font-medium 
                            flex items-center gap-1.5 transition-colors"
                        >
                            <FiDownload className="size-4" />Unduh Data
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
                                <BarChart data={subjectAccesses} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
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
                                        domain={[0, "dataMax + 200"]}
                                        tick={{ fill: "#64748b", fontSize: 10 }}
                                        tickLine={false}
                                        axisLine={{ stroke: "#e2e8f0" }}
                                        label={{
                                            value: "Jumlah Akses",
                                            angle: -90,
                                            position: "insideLeft",
                                            offset: -5,
                                            style: { fill: "#64748b", fontSize: 10 },
                                        }}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(236, 240, 244, 0.5)" }} />
                                    <Bar dataKey="accesses" radius={[3, 3, 0, 0]} maxBarSize={40} animationDuration={1500}>
                                        {subjectAccesses.map((entry, index) => (
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
                                        Jumlah Akses
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-slate-200">
                                {subjectAccesses
                                    .sort((a, b) => b.accesses - a.accesses)
                                    .map((item, index) => (
                                        <tr key={item.subject} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600">{index + 1}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-800">{item.subject}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <span
                                                    className={`inline-block px-3 py-1 rounded-full text-sm font-medium border-l-4 ${getAccessColor(item.accesses)}`}
                                                >
                                                    {item.accesses.toLocaleString()}
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
                        <p className="font-semibold text-slate-700 text-xs">Kategori Popularitas:</p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                            <div className="size-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-sm text-slate-700">≥ 1000: Sangat Populer</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                            <div className="size-2.5 rounded-full bg-blue-500"></div>
                            <span className="text-sm text-slate-700">700-999: Populer</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                            <div className="size-2.5 rounded-full bg-amber-500"></div>
                            <span className="text-sm text-slate-700">400-699: Cukup Populer</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-slate-200">
                            <div className="size-2.5 rounded-full bg-rose-500"></div>
                            <span className="text-sm text-slate-700">&lt; 400: Kurang Populer</span>
                        </div>
                    </div>
                </div>

                {/* Rangkuman Statik */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                        <div className="text-lg font-bold text-blue-700">
                            {subjectAccesses.reduce((total, item) => total + item.accesses, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-blue-600 font-medium">Total Akses</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                        <div className="text-lg font-bold text-green-700">
                            {Math.max(...subjectAccesses.map((item) => item.accesses)).toLocaleString()}
                        </div>
                        <div className="text-xs text-green-600 font-medium">Akses Tertinggi</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                        <div className="text-lg font-bold text-purple-700"> {subjectAccesses.length}</div>
                        <div className="text-xs text-purple-600 font-medium">Mata Pelajaran</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                        <div className="text-lg font-bold text-orange-700">
                            {Math.round(
                                subjectAccesses.reduce((total, item) => total + item.accesses, 0) / subjectAccesses.length,
                            ).toLocaleString()}
                        </div>
                        <div className="text-xs text-orange-600 font-medium">Rata-rata Akses</div>
                    </div>
                </div>
            </div>
        </div>
    )
}