// src/components/layout/GameCard/Dailymission.jsx
import { useState, useEffect } from 'react';
import { gameAPI } from '../../../service/api';

export default function Dailymission({ onRefresh }) {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [completedToday, setCompletedToday] = useState(0);
    const [totalXpEarned, setTotalXpEarned] = useState(0);

    useEffect(() => {
        fetchDailyMissions();
        
        // Refresh missions setiap 30 detik
        const interval = setInterval(fetchDailyMissions, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchDailyMissions = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await gameAPI.getDailyMissions();
            const missionsData = response.data || [];
            
            setMissions(missionsData);
            
            // Hitung statistik
            const completed = missionsData.filter(mission => mission.isCompleted).length;
            const totalXp = missionsData.reduce((sum, mission) => sum + (mission.xpEarned || 0), 0);
            
            setCompletedToday(completed);
            setTotalXpEarned(totalXp);

        } catch (error) {
            console.error('Error fetching daily missions:', error);
            setError('Gagal memuat daily missions');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchDailyMissions();
        if (onRefresh) {
            onRefresh();
        }
    };

    const getTimeUntilMidnight = () => {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0);
        
        const diff = midnight - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        return `${hours}j ${minutes}m`;
    };

    const getMissionIcon = (missionType) => {
        switch (missionType) {
            case 'complete_games': return '📚';
            case 'watch_videos': return '📺';
            case 'solve_problems': return '🧮';
            case 'play_any_game': return '🎮';
            default: return '📋';
        }
    };

    const getProgressColor = (percentage) => {
        if (percentage >= 100) return 'bg-green-500';
        if (percentage >= 75) return 'bg-blue-500';
        if (percentage >= 50) return 'bg-yellow-500';
        return 'bg-gray-400';
    };

    if (loading && missions.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-40">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <div className="text-sm text-gray-500">Memuat daily missions...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Daily Mission</h3>
                    <button 
                        onClick={handleRefresh}
                        className="text-white hover:text-blue-200 transition-colors"
                        disabled={loading}
                    >
                        <span className={`text-sm ${loading ? 'animate-spin' : ''}`}>
                            🔄 Refresh
                        </span>
                    </button>
                </div>
                
                {/* Stats */}
                <div className="flex justify-between items-center text-sm">
                    <div>
                        <span className="opacity-90">Selesai hari ini: </span>
                        <span className="font-semibold">{completedToday}/{missions.length}</span>
                    </div>
                    <div>
                        <span className="opacity-90">XP: </span>
                        <span className="font-semibold">+{totalXpEarned}</span>
                    </div>
                </div>
                
                {/* Reset Timer */}
                <div className="mt-2 text-xs opacity-75">
                    📅 Reset dalam: {getTimeUntilMidnight()}
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Error State */}
                {error && (
                    <div className="text-center py-6">
                        <div className="text-red-500 text-sm mb-2">⚠️ {error}</div>
                        <button 
                            onClick={handleRefresh}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!error && missions.length === 0 && !loading && (
                    <div className="text-center py-6">
                        <div className="text-gray-400 text-4xl mb-2">📋</div>
                        <div className="text-gray-500 text-sm">Belum ada daily mission</div>
                    </div>
                )}

                {/* Missions List */}
                {!error && missions.length > 0 && (
                    <div className="space-y-4">
                        {missions.map((mission) => {
                            const progressPercentage = Math.min((mission.progressValue / mission.targetValue) * 100, 100);
                            
                            return (
                                <div 
                                    key={mission.id}
                                    className={`border rounded-lg p-4 transition-all duration-200 ${
                                        mission.isCompleted 
                                            ? 'border-green-200 bg-green-50' 
                                            : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                    }`}
                                >
                                    {/* Mission Header */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start space-x-3">
                                            <div className="text-2xl">
                                                {mission.icon || getMissionIcon(mission.missionType)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className={`font-medium text-sm ${
                                                    mission.isCompleted ? 'text-green-800' : 'text-gray-800'
                                                }`}>
                                                    {mission.title}
                                                </h4>
                                                <p className={`text-xs mt-1 ${
                                                    mission.isCompleted ? 'text-green-600' : 'text-gray-600'
                                                }`}>
                                                    {mission.description}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {/* Status Badge */}
                                        <div className="flex flex-col items-end">
                                            {mission.isCompleted ? (
                                                <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full mb-1">
                                                    ✅ Selesai
                                                </span>
                                            ) : (
                                                <span className="bg-gray-500 text-white text-xs font-semibold px-2 py-1 rounded-full mb-1">
                                                    🔄 Pending
                                                </span>
                                            )}
                                            
                                            {/* XP Reward */}
                                            <span className={`text-xs font-medium ${
                                                mission.isCompleted ? 'text-green-600' : 'text-purple-600'
                                            }`}>
                                                +{mission.xpReward} XP
                                            </span>
                                        </div>
                                    </div>

                                    {/* Progress */}
                                    <div className="mb-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs text-gray-600">Progress:</span>
                                            <span className="text-xs font-semibold text-gray-800">
                                                {mission.progressValue}/{mission.targetValue}
                                            </span>
                                        </div>
                                        
                                        {/* Progress Bar */}
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-300 ${
                                                    getProgressColor(progressPercentage)
                                                }`}
                                                style={{ width: `${progressPercentage}%` }}
                                            ></div>
                                        </div>
                                        
                                        {/* Progress Percentage */}
                                        <div className="text-right mt-1">
                                            <span className="text-xs text-gray-500">
                                                {Math.round(progressPercentage)}% Complete
                                            </span>
                                        </div>
                                    </div>

                                    {/* Completion Message */}
                                    {mission.isCompleted && (
                                        <div className="bg-green-100 border border-green-200 rounded-md p-2 mt-2">
                                            <div className="text-green-800 text-xs text-center font-medium">
                                                🎉 Mission completed! +{mission.xpEarned} XP earned
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Daily Progress Summary */}
                {missions.length > 0 && (
                    <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                        <div className="text-center">
                            <div className="text-sm font-semibold text-blue-800 mb-1">
                                📊 Progress Hari Ini
                            </div>
                            <div className="flex justify-center space-x-6 text-xs text-blue-700">
                                <div>
                                    <span className="font-medium">{completedToday}</span>
                                    <span className="opacity-75">/{missions.length} Mission</span>
                                </div>
                                <div>
                                    <span className="font-medium">{totalXpEarned}</span>
                                    <span className="opacity-75"> XP Earned</span>
                                </div>
                                <div>
                                    <span className="font-medium">{Math.round((completedToday / missions.length) * 100)}</span>
                                    <span className="opacity-75">% Complete</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Motivational Message */}
                {missions.length > 0 && (
                    <div className="mt-4 text-center">
                        {completedToday === missions.length ? (
                            <div className="text-green-600 text-sm font-medium">
                                🏆 Semua mission hari ini selesai! Keren!
                            </div>
                        ) : completedToday > 0 ? (
                            <div className="text-blue-600 text-sm">
                                💪 {missions.length - completedToday} mission lagi menuju target harian!
                            </div>
                        ) : (
                            <div className="text-gray-600 text-sm">
                                🎯 Ayo selesaikan mission untuk mendapat XP bonus!
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}