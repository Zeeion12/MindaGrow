// src/components/layout/GameCard/Scoreboard.jsx
import { useState, useEffect } from 'react';
import { gameAPI } from '../../../service/api';

export default function Scoreboard() {
    const [activeTab, setActiveTab] = useState('weekly');
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchLeaderboard(activeTab);
    }, [activeTab]);

    const fetchLeaderboard = async (type) => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await gameAPI.getLeaderboard(type);
            setLeaderboard(response.data || []);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setError('Gagal memuat leaderboard');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    const getRankIcon = (rank) => {
        switch (rank) {
            case 1: return '🥇';
            case 2: return '🥈';
            case 3: return '🥉';
            default: return `#${rank}`;
        }
    };

    const getRankColor = (rank) => {
        switch (rank) {
            case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
            case 2: return 'bg-gradient-to-r from-gray-400 to-gray-600 text-white';
            case 3: return 'bg-gradient-to-r from-orange-400 to-orange-600 text-white';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const getNextResetInfo = () => {
        if (activeTab === 'weekly') {
            const now = new Date();
            const nextMonday = new Date();
            nextMonday.setDate(now.getDate() + (7 - now.getDay() + 1) % 7);
            nextMonday.setHours(0, 0, 0, 0);
            
            const diffTime = nextMonday.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return `Reset ${diffDays === 0 ? 'hari ini' : `${diffDays} hari lagi`}`;
        }
        return 'Ranking keseluruhan';
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Leaderboard</h2>
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="animate-pulse flex items-center space-x-3 p-3 bg-gray-100 rounded-lg">
                            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                            <div className="flex-1">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                            <div className="w-12 h-4 bg-gray-200 rounded"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">🏆 Leaderboard</h2>
                <div className="text-center">
                    <div className="text-red-500 text-sm mb-4">⚠️ {error}</div>
                    <button 
                        onClick={() => fetchLeaderboard(activeTab)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                        Coba Lagi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-6 text-white">
                <h2 className="text-xl font-bold mb-4">🏆 Leaderboard</h2>
                
                {/* Tab Navigation */}
                <div className="flex space-x-1 bg-white/20 backdrop-blur-sm rounded-lg p-1">
                    <button
                        onClick={() => handleTabChange('weekly')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'weekly'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        Mingguan
                    </button>
                    <button
                        onClick={() => handleTabChange('overall')}
                        className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                            activeTab === 'overall'
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-white/80 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        Keseluruhan
                    </button>
                </div>
                
                <div className="mt-3 text-center text-white/80 text-xs">
                    {getNextResetInfo()}
                </div>
            </div>

            {/* Leaderboard List */}
            <div className="p-6">
                {leaderboard.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="text-4xl mb-2">📊</div>
                        <div className="text-gray-500 text-sm">
                            Belum ada data ranking untuk {activeTab === 'weekly' ? 'minggu ini' : 'saat ini'}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {leaderboard.map((player, index) => (
                            <div
                                key={player.id}
                                className={`flex items-center space-x-4 p-3 rounded-lg transition-all duration-300 hover:shadow-md ${
                                    index < 3 ? 'border-2 border-opacity-50' : 'border border-gray-100'
                                } ${
                                    index === 0 ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50' :
                                    index === 1 ? 'border-gray-300 bg-gradient-to-r from-gray-50 to-gray-100' :
                                    index === 2 ? 'border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50' :
                                    'bg-white hover:bg-gray-50'
                                }`}
                            >
                                {/* Rank Badge */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getRankColor(player.rank)}`}>
                                    {getRankIcon(player.rank)}
                                </div>

                                {/* Player Info */}
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                                        {player.name}
                                    </h3>
                                    <div className="flex items-center space-x-3 text-xs text-gray-600">
                                        <span className="flex items-center">
                                            <span className="mr-1">🎮</span>
                                            {player.games_played || 0} games
                                        </span>
                                        {activeTab === 'overall' && player.level && (
                                            <span className="flex items-center">
                                                <span className="mr-1">⭐</span>
                                                Level {player.level}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* XP Score */}
                                <div className="text-right">
                                    <div className="text-lg font-bold text-blue-600">
                                        {formatNumber(player.total_xp)}
                                    </div>
                                    <div className="text-xs text-gray-500">XP</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer Info */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="text-center text-xs text-gray-500">
                        {activeTab === 'weekly' ? (
                            <>
                                📅 Ranking mingguan direset setiap hari Senin pukul 00:00
                                <br />
                                🏃‍♂️ Main game sekarang untuk naik peringkat!
                            </>
                        ) : (
                            <>
                                🌟 Ranking berdasarkan total XP yang dikumpulkan
                                <br />
                                💪 Terus kumpulkan XP untuk naik peringkat!
                            </>
                        )}
                    </div>
                </div>

                {/* Quick Stats */}
                {leaderboard.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="text-lg font-bold text-blue-600">
                                {leaderboard.length}
                            </div>
                            <div className="text-xs text-blue-600 font-medium">
                                Total Peserta
                            </div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="text-lg font-bold text-green-600">
                                {formatNumber(leaderboard[0]?.total_xp || 0)}
                            </div>
                            <div className="text-xs text-green-600 font-medium">
                                XP Tertinggi
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}