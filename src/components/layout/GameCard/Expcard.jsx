export default function Expcard({ 
    progress = 0, 
    level = 1, 
    totalXp = 0, 
    xpToNext = 100 
}) {
    // Safely handle undefined or null values
    const safeProgress = Number(progress) || 0;
    const safeLevel = Number(level) || 1;
    const safeTotalXp = Number(totalXp) || 0;
    const safeXpToNext = Number(xpToNext) || 100;

    // Calculate progress percentage for current level
    const currentLevelXp = safeProgress;
    const nextLevelXp = safeXpToNext;
    const progressPercentage = nextLevelXp > 0 ? (currentLevelXp / (currentLevelXp + nextLevelXp)) * 100 : 0;

    const getLevelTitle = (level) => {
        const levelNum = Number(level) || 1;
        if (levelNum >= 50) return "🏆 Grand Master";
        if (levelNum >= 40) return "👑 Master";
        if (levelNum >= 30) return "🎖️ Expert";
        if (levelNum >= 20) return "🌟 Advanced";
        if (levelNum >= 10) return "⚡ Intermediate";
        if (levelNum >= 5) return "🌱 Beginner";
        return "🥚 Newbie";
    };

    const getLevelColor = (level) => {
        const levelNum = Number(level) || 1;
        if (levelNum >= 50) return "from-purple-500 to-pink-500";
        if (levelNum >= 40) return "from-yellow-400 to-orange-500";
        if (levelNum >= 30) return "from-red-400 to-red-600";
        if (levelNum >= 20) return "from-blue-400 to-blue-600";
        if (levelNum >= 10) return "from-green-400 to-green-600";
        if (levelNum >= 5) return "from-teal-400 to-teal-600";
        return "from-gray-400 to-gray-600";
    };

    const formatNumber = (num) => {
        const safeNum = Number(num) || 0;
        if (safeNum >= 1000000) return (safeNum / 1000000).toFixed(1) + 'M';
        if (safeNum >= 1000) return (safeNum / 1000).toFixed(1) + 'K';
        return safeNum.toString();
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${getLevelColor(safeLevel)} p-6 text-white`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Level Siswa</h2>
                        <p className="text-white/90 text-sm">{getLevelTitle(safeLevel)}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold">Level {safeLevel}</div>
                        <div className="text-white/90 text-sm">Total: {formatNumber(safeTotalXp)} XP</div>
                    </div>
                </div>
            </div>

            {/* Progress Section */}
            <div className="p-6">
                <div className="space-y-4">
                    {/* Current Level Progress */}
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Progress ke Level {safeLevel + 1}
                            </span>
                            <span className="text-sm font-bold text-blue-600">
                                {currentLevelXp}/{currentLevelXp + nextLevelXp} XP
                            </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                            <div 
                                className={`h-4 rounded-full transition-all duration-1000 bg-gradient-to-r ${getLevelColor(safeLevel)}`}
                                style={{ width: `${Math.min(Math.max(progressPercentage, 0), 100)}%` }}
                            >
                                <div className="h-full w-full bg-white/20 rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        
                        <div className="text-center mt-2 text-xs text-gray-500">
                            {nextLevelXp} XP lagi untuk level berikutnya
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-800">
                                {formatNumber(currentLevelXp)}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">XP Saat Ini</div>
                        </div>
                        
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-800">
                                {Math.round(Math.max(progressPercentage, 0))}%
                            </div>
                            <div className="text-xs text-gray-600 font-medium">Progress Level</div>
                        </div>
                    </div>

                    {/* Level Milestones */}
                    <div className="pt-4 border-t border-gray-100">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">🎯 Milestone Berikutnya</h4>
                        <div className="space-y-2">
                            {[5, 10, 20, 30, 40, 50].map(milestone => {
                                if (milestone <= safeLevel) return null;
                                const isNext = milestone === Math.ceil(safeLevel / 5) * 5 || 
                                              (safeLevel < 5 && milestone === 5) ||
                                              (safeLevel >= 5 && safeLevel < 10 && milestone === 10) ||
                                              (safeLevel >= 10 && safeLevel < 20 && milestone === 20) ||
                                              (safeLevel >= 20 && safeLevel < 30 && milestone === 30) ||
                                              (safeLevel >= 30 && safeLevel < 40 && milestone === 40) ||
                                              (safeLevel >= 40 && safeLevel < 50 && milestone === 50);
                                
                                if (!isNext) return null;
                                
                                return (
                                    <div key={milestone} className="flex items-center justify-between p-2 bg-blue-50 rounded-lg border border-blue-200">
                                        <span className="text-sm font-medium text-blue-800">
                                            Level {milestone}: {getLevelTitle(milestone)}
                                        </span>
                                        <span className="text-xs text-blue-600 font-medium">
                                            {milestone - safeLevel} level lagi
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Motivational Message */}
                    <div className="pt-4 border-t border-gray-100">
                        <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                            <div className="text-sm font-medium text-gray-700 mb-1">
                                💪 Terus Semangat!
                            </div>
                            <div className="text-xs text-gray-600">
                                {progressPercentage >= 80 
                                    ? "Sedikit lagi mencapai level berikutnya!" 
                                    : progressPercentage >= 50 
                                    ? "Kamu sudah setengah jalan ke level berikutnya!"
                                    : "Mainkan lebih banyak game untuk naik level!"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}