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
    const [userRank, setUserRank] = useState(null);

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

            const [weeklyResponse, overallResponse, rankResponse] = await Promise.all([
                gameAPI.getWeeklyLeaderboard(10).catch(err => {
                    console.error('Error fetching weekly leaderboard:', err);
                    return { data: [] };
                }),
                gameAPI.getOverallLeaderboard(10).catch(err => {
                    console.error('Error fetching overall leaderboard:', err);
                    return { data: [] };
                }),
                gameAPI.getUserRanking().catch(err => {
                    console.error('Error fetching user ranking:', err);
                    return { data: { rank: 999, totalXp: 0 } };
                })
            ]);

            setWeeklyLeaderboard(weeklyResponse.data || []);
            setOverallLeaderboard(overallResponse.data || []);
            setUserRank(rankResponse.data || { rank: 999, totalXp: 0 });
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

    const formatXP = (xp) => {
        if (xp >= 1000000) return (xp / 1000000).toFixed(1) + 'M';
        if (xp >= 1000) return (xp / 1000).toFixed(1) + 'K';
        return xp.toString();
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
                                ? 'bg-white text-purple-600'
                                : 'text-white hover:bg-white/10'
                        }`}
                    >
                        Mingguan
                    </button>
                    <button
                        onClick={() => setActiveTab('overall')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                            activeTab === 'overall'
                                ? 'bg-white text-purple-600'
                                : 'text-white hover:bg-white/10'
                        }`}
                    >
                        Keseluruhan
                    </button>
                </div>

                {/* Reset Timer for Weekly */}
                {activeTab === 'weekly' && (
                    <div className="mt-2 text-xs opacity-75">
                        🕒 Reset: {getWeeklyResetTime()}
                    </div>
                )}
            </div>

            {/* User's Rank */}
            {userRank && (
                <div className="bg-blue-50 border-b border-blue-100 p-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {userRank.rank > 999 ? '999+' : userRank.rank}
                            </div>
                            <div>
                                <div className="font-medium text-gray-800">Peringkatmu</div>
                                <div className="text-sm text-gray-600">
                                    {formatXP(userRank.totalXp)} XP
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                            Kamu
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                {/* Error State */}
                {error && (
                    <div className="text-center py-6">
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
                    <div className="text-center py-6">
                        <div className="text-gray-400 text-4xl mb-2">🏆</div>
                        <div className="text-gray-500 text-sm">Belum ada data leaderboard</div>
                    </div>
                )}

                {/* Leaderboard List */}
                {!error && currentData.length > 0 && (
                    <div className="space-y-3">
                        {currentData.map((player, index) => {
                            const rank = index + 1;
                            const isTopThree = rank <= 3;
                            
                            return (
                                <div 
                                    key={player.id || index}
                                    className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                        isTopThree 
                                            ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' 
                                            : 'bg-gray-50 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                            isTopThree 
                                                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' 
                                                : 'bg-gray-300 text-gray-700'
                                        }`}>
                                            {typeof getRankIcon(rank) === 'string' && getRankIcon(rank).includes('🥇') ? 
                                                getRankIcon(rank) : 
                                                rank
                                            }
                                        </div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {(player.username || player.name || 'User').charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-800">
                                                    {player.username || player.name || `User ${player.id}`}
                                                </div>
                                                <div className="text-sm text-gray-600">
                                                    Level {player.level || 1}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="font-bold text-gray-800">
                                            {formatXP(player.totalXp || player.total_xp || 0)} XP
                                        </div>
                                        {activeTab === 'weekly' && player.gamesPlayed && (
                                            <div className="text-xs text-gray-500">
                                                {player.gamesPlayed} games
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Last Update Info */}
                {lastUpdate && (
                    <div className="mt-4 text-center text-xs text-gray-500">
                        Terakhir diperbarui: {formatLastUpdate()}
                    </div>
                )}

                {/* Quick Stats */}
                {currentData.length > 0 && (
                    <div className="mt-4 bg-gray-50 rounded-lg p-3">
                        <div className="text-center">
                            <div className="text-sm font-medium text-gray-700 mb-2">
                                📊 Statistik {activeTab === 'weekly' ? 'Mingguan' : 'Keseluruhan'}
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <div className="font-bold text-blue-600">
                                        {currentData.length}
                                    </div>
                                    <div className="text-gray-600">Total Player</div>
                                </div>
                                <div>
                                    <div className="font-bold text-green-600">
                                        {formatXP(Math.max(...currentData.map(p => p.totalXp || p.total_xp || 0)))}
                                    </div>
                                    <div className="text-gray-600">Tertinggi</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}