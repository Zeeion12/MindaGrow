// src/components/layout/GameCard/Scoreboard.jsx
import { useState, useEffect } from 'react';
import { gameAPI } from '../../../service/api';

export default function Scoreboard() {
    const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'overall'
    const [weeklyLeaderboard, setWeeklyLeaderboard] = useState([]);
    const [overallLeaderboard, setOverallLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdate, setLastUpdate] = useState(null);

    useEffect(() => {
        fetchLeaderboards();
        
        // Auto refresh setiap 5 menit
        const interval = setInterval(fetchLeaderboards, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchLeaderboards = async () => {
        try {
            setLoading(true);
            setError(null);

            const [weeklyResponse, overallResponse] = await Promise.all([
                gameAPI.getWeeklyLeaderboard(10).catch(err => {
                    console.error('Error fetching weekly leaderboard:', err);
                    return { data: [] };
                }),
                gameAPI.getOverallLeaderboard(10).catch(err => {
                    console.error('Error fetching overall leaderboard:', err);
                    return { data: [] };
                })
            ]);

            setWeeklyLeaderboard(weeklyResponse.data || []);
            setOverallLeaderboard(overallResponse.data || []);
            setLastUpdate(new Date());

        } catch (error) {
            console.error('Error fetching leaderboards:', error);
            setError('Gagal memuat leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const formatLastUpdate = () => {
        if (!lastUpdate) return '';
        const now = new Date();
        const diff = Math.floor((now - lastUpdate) / 1000 / 60); // minutes
        if (diff < 1) return 'Baru saja';
        if (diff === 1) return '1 menit lalu';
        if (diff < 60) return `${diff} menit lalu`;
        return lastUpdate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const getWeeklyResetTime = () => {
        const now = new Date();
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        const nextMonday = new Date(now);
        nextMonday.setDate(now.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0);
        
        const diff = nextMonday - now;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (days > 0) {
            return `${days} hari ${hours} jam`;
        } else {
            return `${hours} jam`;
        }
    };

    const currentData = activeTab === 'weekly' ? weeklyLeaderboard : overallLeaderboard;

    if (loading && currentData.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <div className="text-sm text-gray-500">Memuat leaderboard...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center">
                        🏆 Leaderboard
                    </h3>
                    <button 
                        onClick={fetchLeaderboards}
                        className="text-white hover:text-purple-200 transition-colors"
                        disabled={loading}
                    >
                        <span className={`text-sm ${loading ? 'animate-spin' : ''}`}>
                            🔄
                        </span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex space-x-1 bg-white/20 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('weekly')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'weekly'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        Mingguan
                    </button>
                    <button
                        onClick={() => setActiveTab('overall')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'overall'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        Keseluruhan
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Info Bar */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-center text-xs text-gray-600">
                        <span>
                            {activeTab === 'weekly' 
                                ? `📅 Reset setiap Senin • ${getWeeklyResetTime()} lagi`
                                : '📊 Total akumulasi sejak bergabung'
                            }
                        </span>
                        {lastUpdate && (
                            <span>• Update: {formatLastUpdate()}</span>
                        )}
                    </div>
                </div>

                {/* Error State */}
                {error && (
                    <div className="text-center py-8">
                        <div className="text-red-500 text-sm mb-2">⚠️ {error}</div>
                        <button 
                            onClick={fetchLeaderboards}
                            className="text-blue-500 hover:text-blue-700 text-xs"
                        >
                            Coba lagi
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!error && currentData.length === 0 && !loading && (
                    <div className="text-center py-8">
                        <div className="text-gray-400 text-6xl mb-3">🎯</div>
                        <div className="text-gray-500 text-sm">
                            {activeTab === 'weekly' 
                                ? 'Belum ada data minggu ini' 
                                : 'Belum ada data leaderboard'
                            }
                        </div>
                    </div>
                )}

                {/* Leaderboard List */}
                {!error && currentData.length > 0 && (
                    <div className="space-y-2">
                        {currentData.map((user, index) => (
                            <div 
                                key={user.userId} 
                                className={`flex items-center justify-between p-3 rounded-lg transition-colors hover:bg-gray-50 ${
                                    index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                                }`}
                            >
                                {/* Rank & User Info */}
                                <div className="flex items-center space-x-3">
                                    <div className={`text-lg font-bold ${index < 3 ? 'text-orange-600' : 'text-gray-600'}`}>
                                        {getRankIcon(user.rank || index + 1)}
                                    </div>
                                    
                                    <div className="flex-1">
                                        <div className={`font-medium text-sm ${index < 3 ? 'text-orange-800' : 'text-gray-800'}`}>
                                            {user.username || 'Anonymous'}
                                        </div>
                                        
                                        {/* Additional Info based on tab */}
                                        <div className="text-xs text-gray-500 space-x-2">
                                            {activeTab === 'weekly' ? (
                                                <>
                                                    <span>🎮 {user.gamesPlayed || 0} game</span>
                                                    {user.streakDays > 0 && <span>🔥 {user.streakDays} hari</span>}
                                                    {user.missionsCompleted > 0 && <span>✅ {user.missionsCompleted} misi</span>}
                                                </>
                                            ) : (
                                                <>
                                                    <span>🎮 {user.totalGamesPlayed || 0} game</span>
                                                    <span>📊 Level {user.currentLevel || 1}</span>
                                                    {user.totalStreakDays > 0 && <span>🔥 {user.totalStreakDays} hari</span>}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* XP Score */}
                                <div className="text-right">
                                    <div className={`font-bold ${index < 3 ? 'text-orange-600' : 'text-blue-600'}`}>
                                        {activeTab === 'weekly' 
                                            ? (user.weeklyXp || 0).toLocaleString()
                                            : (user.totalXp || 0).toLocaleString()
                                        }
                                    </div>
                                    <div className="text-xs text-gray-500">XP</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="text-center">
                        <div className="text-xs text-gray-500 mb-2">
                            {activeTab === 'weekly' 
                                ? '🎯 Main game untuk masuk ranking mingguan!'
                                : '🚀 Kumpulkan XP untuk naik peringkat!'
                            }
                        </div>
                        
                        {/* Current User Rank (if available) */}
                        <div className="text-xs font-medium text-blue-600">
                            Rank kamu: Loading...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}