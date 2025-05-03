function ScoreItem ({ namaKursus, subject, skor, color }) {
    // Warna Background
    const colorList = {
        red: "bg-red-600",
        yellow: "bg-amber-400",
        green: "bg-green-500",
        default: "bg-[#D9D9D9]"
    }

    // Ngambil class warna background
    const bgColorClass = colorList[color] || colorList.default

    return (
        <div className="flex justify-between items-start py-4">
            <div className="flex flex-col">
                <h3 className="text-xl font-bold truncate">{namaKursus}</h3>
                <p className="text-gray-700">{subject}</p>
            </div>
            <div className={`w-20 h-20 ${bgColorClass} rounded-2xl flex flex-col items-center justify-center`}>
                <p className="text-white text-sm font-semibold">Skor</p>
                <h2 className="text-white text-4xl font-bold">{skor}</h2>
            </div>
        </div>
    )
}

export default function CardSkor({ scores = [], title = "Skor kursus kamu" }) {

    return (
        <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-6">
            <h2 className="text-center font-bold text-3xl mb-6">{title}</h2>

            {/* Kalo ga ada skor buat warnanya pake warna default */}
            {scores.length === 0 ? (
                <div className="flex justify-center items-center h-32 bg-[#D9D9D9] rounded-2xl">
                    <p className="text-gray-500 text-lg">Belum ada skor</p>
                </div>
            ) : (
                // Buat ngerender semua skor yang ada
                scores.map((score, index) => (
                <ScoreItem
                    key={index}
                    namaKursus={score.namaKursus}
                    subject={score.subject}
                    skor={score.skor}
                    color={score.color}
                />
                ))
            )}

            <p className="text-end text-biru-dasar text-[15px] hover:text-blue-900 mt-4">Lihat Selengkapnya...</p>
        </div>
    )
}