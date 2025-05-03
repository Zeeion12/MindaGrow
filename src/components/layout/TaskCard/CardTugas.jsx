function TaskItem ({ namaTugas, tanggal, status, color, colorBgCard}){

    // Warna background status
    const colorList = {
        red: "bg-red-600",
        green: "bg-green-500"
    }

    // Status tugas
    const statusTugas = {
        done: "Selesai",
        notDone: "Belum Selesai"
    }

    // Warna background card tugas
    const colorCard = {
        cdGreen: "bg-[#e8f5e9]", // Light green
        cdRed: "bg-[#ffebee]", // Light red/pink
    }

    // Ngambil class warna background
    const bgColorClass = colorList[color] || colorList.red
    // Ngambil status tugas
    const statusTugasAnda = statusTugas[status] || statusTugas.notDone
    // Ngambil warna card tugas
    const bgColorCard = colorCard[colorBgCard] || colorCard.cdRed


    return (
        <div className={`flex justify-between items-center py-4 px-5 rounded-3xl mb-4 ${bgColorCard}`}>
            <div className="flex flex-col">
                <h3 className="text-xl font-bold truncate">{namaTugas}</h3>
                <p className="text-gray-700">Tenggat: {tanggal}</p>
            </div>
            <div className={`w-28 ${bgColorClass} rounded-2xl flex flex-col items-center justify-center`}>
                <h2 className="text-white text-[15px] font-bold text-center p-1">{statusTugasAnda}</h2>
            </div>
        </div>
    )
}

export default function CardTugas({ title = "Tugas kamu", task = [] }) {
    return (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-center font-bold text-3xl mb-6">{title}</h2>

            {/* Kalo ga ada skor buat warnanya pake warna default */}
            {task.length === 0 ? (
                <div className="flex justify-center items-center h-32 bg-[#D9D9D9] rounded-2xl">
                    <p className="text-gray-500 text-lg">Belum ada tugas</p>
                </div>
                ) : (
                // Buat ngerender semua skor yang ada
                task.map((task, index) => (
                    <TaskItem
                        key={index}
                        namaTugas={task.namaTugas}
                        tanggal={task.tanggal}
                        status={task.status}
                        colorBgCard={task.colorBgCard}
                        color={task.color}
                    />
                ))
            )}

            <p className="text-end text-biru-dasar text-[15px] hover:text-blue-900 mt-4">Lihat Selengkapnya...</p>
        </div>
    )
}
