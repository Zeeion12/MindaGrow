import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Data contoh untuk 12 bulan terakhir
const courseData = [
    { month: "Jan", completed: 5 },
    { month: "Feb", completed: 8 },
    { month: "Mar", completed: 12 },
    { month: "Apr", completed: 6 },
    { month: "May", completed: 15 },
    { month: "Jun", completed: 10 },
    { month: "Jul", completed: 18 },
    { month: "Aug", completed: 14 },
    { month: "Sep", completed: 20 },
    { month: "Oct", completed: 16 },
    { month: "Nov", completed: 22 },
    { month: "Dec", completed: 25 },
]

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                <p className="text-gray-600 text-sm">{`Bulan: ${label}`}</p>
                <p className="text-blue-600 font-semibold">{`Kursus Selesai: ${payload[0].value}`}</p>
            </div>
        )
    }
    return null
}

export default function CourseAchivement () {
    // Hitung total kursus yang diselesaikan
    const totalCompleted = courseData.reduce((sum, item) => sum + item.completed, 0)

    return (
        <div className="w-full h-full">
            {/* Stats Summary */}
            <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600">{totalCompleted}</div>
                    <div className="text-sm text-blue-500">Total Kursus Selesai</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600">{Math.round(totalCompleted / 12)}</div>
                    <div className="text-sm text-green-500">Rata-rata per Bulan</div>
                </div>
            </div>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart
                data={courseData}
                margin={{
                    top: 10,
                    right: 30,
                    left: 3,
                    bottom: 5,
                }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6b7280" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="completed" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    )
}