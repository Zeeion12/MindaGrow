import { useState, useEffect } from "react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts"
import { FiDownload, FiCalendar, FiClock, FiTrendingUp, FiInfo } from "react-icons/fi"
import axios from 'axios'; // Pastikan Anda sudah menginstal axios (npm install axios)

// Fungsi untuk memformat durasi dari menit ke jam dan menit
const formatDuration = (minutes) => {
    if (minutes === null || isNaN(minutes)) return "0 jam 0 menit";
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60); // Round minutes to nearest integer
    return `${hours} jam ${mins} menit`;
};

// Custom Tooltip untuk Recharts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const durationData = payload.find(p => p.dataKey === 'duration');
        const averageData = payload.find(p => p.dataKey === 'average');

        return (
            <div className="bg-white p-3 border border-slate-200 shadow-lg rounded-lg text-xs">
                <p className="font-semibold text-slate-800 mb-1">{label}</p>
                {durationData && (
                    <div className="flex items-center gap-1.5 text-blue-600">
                        <FiClock className="size-3.5" />
                        <span>Total: {formatDuration(durationData.value)}</span>
                    </div>
                )}
                {averageData && (
                    <div className="flex items-center gap-1.5 text-emerald-600 mt-1">
                        <FiTrendingUp className="size-3.5" />
                        <span>Rata-rata: {averageData.value} menit/hari</span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

export default function LearnDurationChart() {
    const [year, setYear] = useState(new Date().getFullYear().toString());
    const [monthlyLearningData, setMonthlyLearningData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch data from backend
    useEffect(() => {
        const fetchLearningData = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('token'); // Asumsi token disimpan di localStorage
                if (!token) {
                    setError("Authentication token not found. Please log in.");
                    setLoading(false);
                    return;
                }

                const response = await axios.get(`http://localhost:5000/api/user/learning-duration?year=${year}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                setMonthlyLearningData(response.data.data);
            } catch (err) {
                console.error("Error fetching learning data:", err);
                setError("Failed to load learning data. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchLearningData();
    }, [year]); // Re-fetch when year changes

    // Implement heartbeat to update user activity
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    await axios.post('http://localhost:5000/api/user/activity', {}, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                }
            } catch (err) {
                console.warn("Failed to send heartbeat:", err);
                // Handle token expiration or other errors if necessary
            }
        };

        // Send heartbeat every 1 minute (60000 ms)
        const intervalId = setInterval(sendHeartbeat, 60000);

        // Clear interval on component unmount
        return () => clearInterval(intervalId);
    }, []); // Run once on component mount

    // Menghitung total durasi belajar dalam tahun ini
    const totalYearlyDuration = monthlyLearningData.reduce((total, item) => total + item.duration, 0);

    // Menghitung rata-rata durasi belajar per bulan
    const averageMonthlyDuration = monthlyLearningData.length > 0
        ? Math.round(totalYearlyDuration / monthlyLearningData.filter(item => item.duration > 0).length) // Only count months with activity
        : 0;

    // Menghitung bulan dengan durasi tertinggi
    const maxDurationMonth = monthlyLearningData.reduce(
        (max, item) => (item.duration > max.duration ? item : max),
        monthlyLearningData[0] || { month: "N/A", duration: 0, average: 0 },
    );

    // Fungsi untuk mengunduh data sebagai CSV
    const downloadCSV = () => {
        const csvContent =
            "Bulan,Durasi (menit),Rata-rata Harian (menit)\n" +
            monthlyLearningData.map((item) => `${item.month},${item.duration},${item.average}`).join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `durasi-belajar-${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return <div className="text-center p-4">Loading learning data...</div>;
    }

    if (error) {
        return <div className="text-center p-4 text-red-500">{error}</div>;
    }

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 ">

            {/* Card Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-400 border-b p-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                    <div>
                        <h2 className="text-xl text-red-50 font-bold">Total Durasi Belajar</h2>
                        <p className="text-white text-sm mt-1">Waktu belajar siswa per bulan sepanjang tahun</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                            className="bg-white border border-slate-200 text-slate-700 rounded-md px-3 py-1.5 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {/* Generate options for current year and a few past years */}
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
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
                {/* Stat Linechartnya */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-md">
                                <FiClock className="size-4 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-xs text-blue-700 font-medium">Total Durasi Tahun {year}</p>
                                <p className="text-lg font-bold text-blue-800">{formatDuration(totalYearlyDuration)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                        <div className="flex items-center gap-2">
                            <div className="bg-emerald-100 p-2 rounded-md">
                                <FiTrendingUp className="size-4 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs text-emerald-700 font-medium">Rata-rata Per Bulan</p>
                                <p className="text-lg font-bold text-emerald-800">{formatDuration(averageMonthlyDuration)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <div className="flex items-center gap-2">
                            <div className="bg-purple-100 p-2 rounded-md">
                                <FiCalendar className="size-4 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-xs text-purple-700 font-medium">Bulan Terbanyak</p>
                                <p className="text-lg font-bold text-purple-800">
                                    {maxDurationMonth.month} ({formatDuration(maxDurationMonth.duration)})
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Line Chart */}
                <div className="mt-4 bg-white rounded-xl p-3 border border-slate-100">
                    <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyLearningData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fill: "#64748b", fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#e2e8f0" }}
                                />
                                <YAxis
                                    yAxisId="left"
                                    tick={{ fill: "#64748b", fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#e2e8f0" }}
                                    tickFormatter={(value) => `${Math.floor(value / 60)}j`}
                                    label={{
                                        value: "Durasi (jam)",
                                        angle: -90,
                                        position: "insideLeft",
                                        offset: -5,
                                        style: { fill: "#64748b", fontSize: 10 },
                                    }}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tick={{ fill: "#64748b", fontSize: 10 }}
                                    tickLine={false}
                                    axisLine={{ stroke: "#e2e8f0" }}
                                    tickFormatter={(value) => `${value}m`}
                                    label={{
                                        value: "Rata-rata/hari",
                                        angle: 90,
                                        position: "insideRight",
                                        offset: 0,
                                        style: { fill: "#64748b", fontSize: 10 },
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="top"
                                    height={36}
                                    formatter={(value) => {
                                        return (
                                            <span className="text-xs font-medium">
                                                {value === "duration" ? "Total Durasi (menit)" : "Rata-rata Harian (menit)"}
                                            </span>
                                        );
                                    }}
                                />
                                <ReferenceLine
                                    y={averageMonthlyDuration}
                                    yAxisId="left"
                                    stroke="#94a3b8"
                                    strokeDasharray="3 3"
                                    label={{
                                        value: "Rata-rata",
                                        position: "insideBottomRight",
                                        fill: "#94a3b8",
                                        fontSize: 10,
                                    }}
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="duration"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#3b82f6", strokeWidth: 1, stroke: "#2563eb" }}
                                    activeDot={{ r: 5, fill: "#2563eb", strokeWidth: 1, stroke: "#ffffff" }}
                                    animationDuration={1500}
                                    name="duration"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="average"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    dot={{ r: 3, fill: "#10b981", strokeWidth: 1, stroke: "#059669" }}
                                    activeDot={{ r: 5, fill: "#059669", strokeWidth: 1, stroke: "#ffffff" }}
                                    animationDuration={1500}
                                    name="average"
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Penjelasan */}
                <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-1.5 mb-2">
                        <FiInfo className="size-3.5 text-slate-700" />
                        <p className="font-semibold text-slate-700 text-xs">Tentang Data:</p>
                    </div>
                    <ul className="text-xs text-slate-600 space-y-1.5">
                        <li className="flex items-start gap-1.5">
                            <div className="size-2.5 rounded-full bg-blue-500 mt-1"></div>
                            <span>Total durasi belajar dihitung dari waktu login hingga aktivitas terakhir yang tercatat.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                            <div className="size-2.5 rounded-full bg-emerald-500 mt-1"></div>
                            <span>Rata-rata harian dihitung berdasarkan total durasi dibagi jumlah hari aktif dalam bulan.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                            <div className="size-2.5 rounded-full bg-slate-400 mt-1"></div>
                            <span>Garis putus-putus menunjukkan rata-rata durasi belajar sepanjang tahun.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
