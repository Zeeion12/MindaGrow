// src/components/layout/GameCard/Dailymission.jsx
import { useState, useEffect } from 'react';
import { gameAPI } from '../../../service/api';

export default function Dailymission({ onRefresh }) {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDailyMissions();
    }, []);

    const fetchDailyMissions = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await gameAPI.getDailyMissions();
            // Ensure missions is always an array
            const missionsData = Array.isArray(response.data) ? response.data : [];
            setMissions(missionsData);
        } catch (error) {
            console.error('Error fetching daily missions:', error);
            setError('Gagal memuat daily missions');
            setMissions([]); // Set empty array on error
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchDailyMissions();
        if (onRefresh) onRefresh();
    };

    const getMissionIcon = (missionType) => {
        switch (missionType) {
            case 'complete_quizzes':
                return '🧠';
            case 'watch_videos':
                return '📺';
            case 'solve_problems':
                return '🧮';
            case 'play_game':
                return '🎮';
            default:
                return '📋';
        }
    };

    const getProgressColor = (isCompleted, progress, target) => {
        if (isCompleted) return 'from-green-400 to-green-600';
        if (progress / target >= 0.7) return 'from-yellow-400 to-orange-500';
        return 'from-blue-400 to-blue-600';
    };

    const getStatusBadge = (isCompleted) => {
        if (isCompleted) {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    ✅ Selesai
                </span>
            );
        }
        return (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
                ⏳ Pending
            </span>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Daily Mission</h2>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="animate-pulse">
                            <div className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
                                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                                <div className="w-16 h-6 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <div className="text-center">
                    <div className="text-red-500 text-sm mb-4">⚠️ {error}</div>
                    <button 
                        onClick={handleRefresh}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    // Safely filter missions - ensure missions is an array
    const safeMissions = Array.isArray(missions) ? missions : [];
    const completedMissions = safeMissions.filter(m => m.is_completed).length;
    const totalXpAvailable = safeMissions.reduce((total, m) => total + (m.xp_reward || 0), 0);
    const earnedXp = safeMissions.filter(m => m.is_completed).reduce((total, m) => total + (m.xp_reward || 0), 0);

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold mb-1">Daily Mission</h2>
                        <p className="text-white/90 text-sm">
                            Selesaikan misi harian untuk mendapat XP bonus
                        </p>
                    </div>
                    <button 
                        onClick={handleRefresh}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg p-2 transition-colors"
                        title="Refresh"
                    >
                        🔄
                    </button>
                </div>
                
                {/* Summary Stats */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <div className="text-lg font-bold">{completedMissions}/{safeMissions.length}</div>
                        <div className="text-xs text-white/80">Misi Selesai</div>
                    </div>
                    <div className="text-center p-3 bg-white/10 backdrop-blur-sm rounded-lg">
                        <div className="text-lg font-bold">{earnedXp}/{totalXpAvailable} XP</div>
                        <div className="text-xs text-white/80">XP Didapat</div>
                    </div>
                </div>
            </div>

            {/* Missions List */}
            <div className="p-6">
                {safeMissions.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">🎯</div>
                        <div className="text-gray-500 text-sm">
                            Belum ada misi harian tersedia
                        </div>
                        <button 
                            onClick={handleRefresh}
                            className="mt-3 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                        >
                            Muat Ulang
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {safeMissions.map((mission) => {
                            const currentProgress = Number(mission.current_progress) || 0;
                            const targetCount = Number(mission.target_count) || 1;
                            const progressPercentage = Math.min((currentProgress / targetCount) * 100, 100);
                            
                            return (
                                <div 
                                    key={mission.id}
                                    className={`p-4 border rounded-lg transition-all duration-300 ${
                                        mission.is_completed 
                                            ? 'border-green-200 bg-green-50' 
                                            : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-start space-x-4">
                                        {/* Mission Icon */}
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${
                                            mission.is_completed 
                                                ? 'bg-green-100 border border-green-200' 
                                                : 'bg-blue-100 border border-blue-200'
                                        }`}>
                                            {getMissionIcon(mission.mission_type)}
                                        </div>

                                        {/* Mission Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-gray-900 text-sm mb-1">
                                                        {mission.title || 'Untitled Mission'}
                                                    </h3>
                                                    <p className="text-gray-600 text-xs mb-3">
                                                        {mission.description || 'No description available'}
                                                    </p>
                                                </div>
                                                
                                                <div className="flex items-center space-x-3 ml-4">
                                                    <div className="text-right">
                                                        <div className="text-sm font-bold text-blue-600">
                                                            +{mission.xp_reward || 0} XP
                                                        </div>
                                                    </div>
                                                    {getStatusBadge(mission.is_completed)}
                                                </div>
                                            </div>

                                            {/* Progress */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-xs text-gray-600">
                                                    <span>Progress: {currentProgress}/{targetCount}</span>
                                                    <span>{Math.round(progressPercentage)}% Complete</span>
                                                </div>
                                                
                                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <div 
                                                        className={`h-2 rounded-full transition-all duration-500 bg-gradient-to-r ${
                                                            getProgressColor(mission.is_completed, currentProgress, targetCount)
                                                        }`}
                                                        style={{ width: `${progressPercentage}%` }}
                                                    >
                                                        {mission.is_completed && (
                                                            <div className="h-full w-full bg-white/20 rounded-full animate-pulse"></div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Completion Time */}
                                            {mission.is_completed && mission.completed_at && (
                                                <div className="mt-2 text-xs text-green-600 font-medium">
                                                    ✅ Selesai pada {new Date(mission.completed_at).toLocaleTimeString('id-ID', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Overall Progress */}
                {safeMissions.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2">
                                Progress Harian Keseluruhan
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div 
                                    className="h-3 rounded-full transition-all duration-500 bg-gradient-to-r from-purple-400 to-blue-600"
                                    style={{ width: `${safeMissions.length > 0 ? (completedMissions / safeMissions.length) * 100 : 0}%` }}
                                ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                                {completedMissions === safeMissions.length 
                                    ? '🎉 Semua misi hari ini telah selesai!' 
                                    : `${safeMissions.length - completedMissions} misi tersisa`}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}