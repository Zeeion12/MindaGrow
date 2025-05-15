
export default function Scoreboard() {

    // Sample data for the scoreboard
    const topPlayers = [
        { id: 1, name: "ITO", position: 1, avatar: "/placeholder.svg?height=40&width=40" },
        { id: 2, name: "Tio", position: 2, avatar: "/placeholder.svg?height=40&width=40" },
        { id: 3, name: "Fonsi", position: 3, avatar: "/placeholder.svg?height=40&width=40" },
        { id: 4, name: "Selenia", position: 4, avatar: "/placeholder.svg?height=40&width=40" },
        { id: 5, name: "Dimas", position: 5, avatar: "/placeholder.svg?height=40&width=40" },
        { id: 6, name: "Raka", position: 6, avatar: "/placeholder.svg?height=40&width=40" },
        { id: 7, name: "Budi", position: 7, avatar: "/placeholder.svg?height=40&width=40" },
        { id: 8, name: "Sinta", position: 8, avatar: "/placeholder.svg?height=40&width=40" },
        { id: 9, name: "Joko", position: 9, avatar: "/placeholder.svg?height=40&width=40" },
        { id: 10, name: "Maya", position: 10, avatar: "/placeholder.svg?height=40&width=40" },
    ]

    // Get 3 orang buat podium
    const podiumPlayers = topPlayers.filter((player) => player.position <= 3)

    // Get 7 orang buat leaderboard
    const otherPlayers = topPlayers.filter((player) => player.position > 3)

    // Function untuk ngatur tinggi podium
    const getPodiumHeight = (position) => {
        switch (position) {
            case 1:
                return "h-40"
            case 2:
                return "h-32"
            case 3:
                return "h-24"
            default:
                return "h-20"
        }
    }

    // Function buat ngatur warna podium
    const getPodiumColor = (position) => {
        switch (position) {
            case 1:
                return "bg-[#FBBF24]" // Yellow for 1st place
            case 2:
                return "bg-[#4778EC]" // Blue for 2nd place
            case 3:
                return "bg-[#4778EC]/70" // Lighter blue for 3rd place
            default:
                return "bg-gray-600"
        }
    }

    return(
        <div className="max-w-md bg-white rounded-3xl shadow-lg p-6 font-sans border-2 border-[#4778EC]/20">
            <h1 className="text-2xl font-bold text-center mb-15 text-[#4778EC]">Top Skor Mingguan</h1>

            {/* Bagian podium */}
            <div className="relative flex items-end justify-center h-52 mb-4 gap-2">
                {podiumPlayers.map((player) => {

                    // Buat ngatur urutan (2-1-3)
                    const orderMap = { 1: 2, 2: 1, 3: 3}
                    const order = orderMap[player.position]

                    return (
                        <div key={player.id} className="flex flex-col items-center" style={{ order }}>
                            {/* Mahkota buat yang nomor 1 */}
                            {player.position === 1 && (
                                <div className="absolute -top-5 transform translate-y-[-100%]">
                                    <span className="text-4xl">👑</span>
                                </div>
                            )}

                            {/* Player avatar */}
                            <div className="relative mb-2">
                                <div className="w-16 h-16 rounded-full bg-[#4778EC]/10 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                                    <img
                                        src={player.avatar || "/placeholder.svg"}
                                        alt={player.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>

                            {/* Podium */}
                            <div
                                className={`w-24 ${getPodiumHeight(player.position)} ${getPodiumColor(player.position)} rounded-t-lg flex items-center justify-center`}
                            >
                                <span className="font-bold text-xl text-white">{player.name}</span>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Untuk player rangking 4 - 10 */}
            <div className="mt-6">
                <div className="h-40 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#4778EC] scrollbar-track-[#4778EC]/10">
                    {otherPlayers.map((player) => (
                        <div key={player.id} className="bg-gradient-to-r from-[#4778EC] to-[#4778EC]/90 rounded-lg p-3 flex items-center mb-2 shadow-sm">
                            <span className="text-white font-bold mr-4 text-lg">{player.position}</span>
                            <div className="w-8 h-8 rounded-full bg-[#FBBF24]/20 mr-3 flex items-center justify-center overflow-hidden border border-white">
                                <img src={player.avatar || "/placeholder.svg"} alt={player.name} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-white font-medium">{player.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}