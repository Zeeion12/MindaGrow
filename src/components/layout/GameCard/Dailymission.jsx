export default function DailyMission() {

    // Sample data 
    const dailyMissions = [
        {
        id: 1,
        mission: "Complete 3 quizzes",
        currentProgress: 2,
        totalRequired: 3,
        exp: 50,
        },
        {
        id: 2,
        mission: "Watch 5 tutorial videos",
        currentProgress: 3,
        totalRequired: 5,
        exp: 30,
        },
        {
        id: 3,
        mission: "Solve 10 practice problems",
        currentProgress: 4,
        totalRequired: 10,
        exp: 100,
        },
    ]

    // Buat ngekalkulasi progress
    const calculateProgress = (current, total) => {
        return Math.min(Math.round((current / total) * 100), 100)
    }

    return (
        <div className="w-full max-w-lg bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-bold mb-4">Daily Mission</h2>

            <div className="space-y-4">
                {dailyMissions.map((mission) => (
                <div key={mission.id} className="w-full">
                    <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                        <h3 className="text-md font-medium">{mission.mission}</h3>
                        <span className="text-sm text-gray-500 ml-2">
                            ({mission.currentProgress}/{mission.totalRequired})
                        </span>
                    </div>
                    <span className="">+{mission.exp} XP</span>
                    </div>
                    <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#4778EC] rounded-full transition-all duration-300"
                        style={{ width: `${calculateProgress(mission.currentProgress, mission.totalRequired)}%` }}
                    ></div>
                    </div>
                </div>
                ))}
            </div>
        </div>
    )
}
