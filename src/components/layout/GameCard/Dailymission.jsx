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
            console.log('📋 Daily missions response:', response.data);
            
            // Handle different response structures
            let missionsData = [];
            if (response.data && response.data.missions) {
                missionsData = response.data.missions;
            } else if (response.data && Array.isArray(response.data)) {
                missionsData = response.data;
            } else {
                missionsData = [];
            }
            
            setMissions(missionsData);
            
            // Hitung statistik dengan safe access
            const completed = missionsData.filter(mission => 
                mission.isCompleted || mission.is_completed
            ).length;
            const totalXp = missionsData.reduce((sum, mission) => 
                sum + (mission.xpEarned || mission.xp_reward || 0), 0
            );
            
            setCompletedToday(completed);
            setTotalXpEarned(totalXp);

        } catch (error) {
            console.error('Error fetching daily missions:', error);
            setError('Gagal memuat daily missions');
            // Set fallback empty missions
            setMissions([]);
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

    const getMissionDescription = (missionType, targetValue) => {
        switch (missionType) {
            case 'complete_games':
                return `Selesaikan ${targetValue} game`;
            case 'watch_videos':
                return `Tonton ${targetValue} video pembelajaran`;
            case 'solve_problems':
                return `Jawab ${targetValue} soal dengan benar`;
            case 'play_any_game':
                return `Main ${targetValue} game apapun`;
            default:
                return `Selesaikan target: ${targetValue}`;
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">🎯 Daily Mission</h3>
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
                {/* Loading State */}
                {loading && missions.length === 0 && (
                    <div className="text-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <div className="text-sm text-gray-500">Memuat daily missions...</div>
                    </div>
                )}

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
                            const progressPercentage = Math.min(
                                ((mission.progressValue || mission.current_progress || 0) / 
                                (mission.targetValue || mission.target_count || 1)) * 100, 
                                100
                            );
                            const isCompleted = mission.isCompleted || mission.is_completed || false;
                            
                            return (
                                <div 
                                    key={mission.id}
                                    className={`border rounded-lg p-4 transition-all duration-200 ${
                                        isCompleted 
                                            ? 'bg-green-50 border-green-200' 
                                            : 'bg-white border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start space-x-3">
                                            <div className="text-2xl">
                                                {isCompleted ? '✅' : getMissionIcon(mission.missionType || mission.mission_type)}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-800">
                                                    {mission.title || getMissionDescription(
                                                        mission.missionType || mission.mission_type, 
                                                        mission.targetValue || mission.target_count
                                                    )}
                                                </h4>
                                                {mission.description && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {mission.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="text-right flex-shrink-0">
                                            <div className="text-lg font-bold text-blue-600">
                                                +{mission.xpReward || mission.xp_reward || 10} XP
                                            </div>
                                            {isCompleted && (
                                                <div className="text-xs text-green-600">
                                                    Selesai!
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">
                                                Progress: {mission.progressValue || mission.current_progress || 0}/
                                                {mission.targetValue || mission.target_count || 1}
                                            </span>
                                            <span className="font-medium">
                                                {Math.round(progressPercentage)}%
                                            </span>
                                        </div>
                                        
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(progressPercentage)}`}
                                                style={{ width: `${progressPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Completion Status */}
                                    {isCompleted && (
                                        <div className="mt-3 flex items-center justify-between text-sm">
                                            <span className="text-green-600 font-medium">
                                                ✨ Mission selesai!
                                            </span>
                                            <span className="text-green-700">
                                                +{mission.xpEarned || mission.xp_reward || 0} XP didapat
                                            </span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Quick Stats */}
                {missions.length > 0 && (
                    <div className="mt-6 bg-gray-50 rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <div className="text-lg font-bold text-blue-600">
                                    {Math.round((completedToday / missions.length) * 100)}%
                                </div>
                                <div className="text-xs text-gray-600">Completed</div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-green-600">
                                    +{totalXpEarned}
                                </div>
                                <div className="text-xs text-gray-600">XP Earned</div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}