import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function Scoreboard() {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'overall'
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        fetchLeaderboard();
        getCurrentUser();
    }, [activeTab]);

    const getCurrentUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            // Get current user info
            const response = await axios.get('http://localhost:5000/api/games/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setCurrentUser(response.data.user);
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const endpoint = activeTab === 'weekly' 
                ? 'http://localhost:5000/api/leaderboard/weekly'
                : 'http://localhost:5000/api/leaderboard/overall';

            const response = await axios.get(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setLeaderboard(response.data.leaderboard);
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            // Fallback to dummy data
            setLeaderboard([
                { nama_lengkap: 'ITO', weekly_xp: 1250, total_xp: 5420, rank: 1 },
                { nama_lengkap: 'Tio', weekly_xp: 1180, total_xp: 4890, rank: 2 },
                { nama_lengkap: 'Fonsi', weekly_xp: 1050, total_xp: 4320, rank: 3 },
                { nama_lengkap: 'Selenia', weekly_xp: 890, total_xp: 3980, rank: 4 },
                { nama_lengkap: 'Dimas', weekly_xp: 750, total_xp: 3650, rank: 5 },
                { nama_lengkap: 'Raka', weekly_xp: 680, total_xp: 3200, rank: 6 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getRankBadge = (rank) => {
        switch (rank) {
            case 1: return { emoji: '🥇', color: 'text-yellow-600', bg: 'bg-yellow-100' };
            case 2: return { emoji: '🥈', color: 'text-gray-600', bg: 'bg-gray-100' };
            case 3: return { emoji: '🥉', color: 'text-orange-600', bg: 'bg-orange-100' };
            default: return { emoji: `#${rank}`, color: 'text-blue-600', bg: 'bg-blue-100' };
        }
    };

    const getXpDisplay = (player) => {
        return activeTab === 'weekly' ? player.weekly_xp || 0 : player.total_xp || 0;
    };

    const formatXP = (xp) => {
        if (xp >= 1000) {
            return `${(xp / 1000).toFixed(1)}k`;
        }
        return xp.toString();
    };

    const getCurrentUserRank = () => {
        if (!currentUser) return null;
        return leaderboard.findIndex(player => 
            player.nama_lengkap === currentUser.nama_lengkap
        ) + 1;
    };

    if (loading) {
        return (
            <div className="w-full bg-white rounded-lg shadow-md p-4">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                <div className="flex-1 h-4 bg-gray-200 rounded"></div>
                                <div className="w-12 h-4 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header with Tabs */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold">🏆 Leaderboard</h3>
                    <button 
                        onClick={fetchLeaderboard}
                        className="text-white/80 hover:text-white transition-colors"
                    >
                        🔄
                    </button>
                </div>
                
                {/* Tab Buttons */}
                <div className="flex space-x-2">
                    <button
                        onClick={() => setActiveTab('weekly')}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            activeTab === 'weekly'
                                ? 'bg-white text-blue-600'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        Mingguan
                    </button>
                    <button
                        onClick={() => setActiveTab('overall')}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                            activeTab === 'overall'
                                ? 'bg-white text-blue-600'
                                : 'bg-white/20 text-white hover:bg-white/30'
                        }`}
                    >
                        Keseluruhan
                    </button>
                </div>
            </div>

            {/* Top 3 Podium */}
            {leaderboard.length >= 3 && (
                <div className="p-4 bg-gradient-to-b from-blue-50 to-white">
                    <div className="flex items-end justify-center space-x-2 mb-4">
                        {/* 2nd Place */}
                        <div className="text-center">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-1">
                                <span className="text-lg">🥈</span>
                            </div>
                            <div className="bg-gray-300 w-16 h-12 rounded-t-lg flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-xs font-bold text-gray-700">
                                        {leaderboard[1]?.nama_lengkap.length > 6 
                                            ? leaderboard[1]?.nama_lengkap.substring(0, 6) + '...'
                                            : leaderboard[1]?.nama_lengkap}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        {formatXP(getXpDisplay(leaderboard[1]))} XP
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 1st Place */}
                        <div className="text-center">
                            <div className="w-14 h-14 bg-yellow-200 rounded-full flex items-center justify-center mb-1">
                                <span className="text-xl">🥇</span>
                            </div>
                            <div className="bg-yellow-400 w-18 h-16 rounded-t-lg flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-sm font-bold text-yellow-800">
                                        {leaderboard[0]?.nama_lengkap.length > 6 
                                            ? leaderboard[0]?.nama_lengkap.substring(0, 6) + '...'
                                            : leaderboard[0]?.nama_lengkap}
                                    </div>
                                    <div className="text-xs text-yellow-700">
                                        {formatXP(getXpDisplay(leaderboard[0]))} XP
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3rd Place */}
                        <div className="text-center">
                            <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center mb-1">
                                <span className="text-lg">🥉</span>
                            </div>
                            <div className="bg-orange-300 w-16 h-10 rounded-t-lg flex items-center justify-center">
                                <div className="text-center">
                                    <div className="text-xs font-bold text-orange-800">
                                        {leaderboard[2]?.nama_lengkap.length > 6 
                                            ? leaderboard[2]?.nama_lengkap.substring(0, 6) + '...'
                                            : leaderboard[2]?.nama_lengkap}
                                    </div>
                                    <div className="text-xs text-orange-700">
                                        {formatXP(getXpDisplay(leaderboard[2]))} XP
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Leaderboard List */}
            <div className="p-4">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                    {leaderboard.map((player, index) => {
                        const rank = player.rank || index + 1;
                        const badge = getRankBadge(rank);
                        const isCurrentUser = currentUser && player.nama_lengkap === currentUser.nama_lengkap;
                        
                        return (
                            <div
                                key={index}
                                className={`flex items-center justify-between p-3 rounded-lg transition-all hover:bg-gray-50 ${
                                    isCurrentUser ? 'bg-blue-50 border-2 border-blue-200' : 'bg-white'
                                } ${rank <= 3 ? 'shadow-sm' : ''}`}
                            >
                                <div className="flex items-center space-x-3">
                                    {/* Rank Badge */}
                                    <div className={`w-8 h-8 rounded-full ${badge.bg} flex items-center justify-center`}>
                                        <span className={`text-sm font-bold ${badge.color}`}>
                                            {rank <= 3 ? badge.emoji : rank}
                                        </span>
                                    </div>
                                    
                                    {/* Player Info */}
                                    <div>
                                        <div className={`font-medium ${isCurrentUser ? 'text-blue-700' : 'text-gray-800'}`}>
                                            {player.nama_lengkap}
                                            {isCurrentUser && <span className="text-blue-500 ml-2">👤</span>}
                                        </div>
                                        {activeTab === 'weekly' && player.games_played > 0 && (
                                            <div className="text-xs text-gray-500">
                                                {player.games_played} games played
                                            </div>
                                        )}
                                        {activeTab === 'overall' && player.current_level && (
                                            <div className="text-xs text-gray-500">
                                                Level {player.current_level}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* XP Display */}
                                <div className="text-right">
                                    <div className={`font-bold ${
                                        rank === 1 ? 'text-yellow-600' :
                                        rank === 2 ? 'text-gray-600' :
                                        rank === 3 ? 'text-orange-600' :
                                        'text-blue-600'
                                    }`}>
                                        {formatXP(getXpDisplay(player))} XP
                                    </div>
                                    {activeTab === 'weekly' && player.total_xp && (
                                        <div className="text-xs text-gray-500">
                                            Total: {formatXP(player.total_xp)}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Current User Rank if not in top list */}
                {currentUser && getCurrentUserRank() === 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="text-center text-sm text-gray-600">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                                🎯 Kamu belum masuk ranking. Ayo main game untuk naik peringkat!
                            </span>
                        </div>
                    </div>
                )}

                {/* Footer Info */}
                <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                    <div className="text-xs text-gray-500">
                        {activeTab === 'weekly' ? (
                            <>📅 Ranking mingguan • Reset setiap hari Minggu</>
                        ) : (
                            <>🏆 Ranking keseluruhan • Berdasarkan total XP</>
                        )}
                    </div>
                    {leaderboard.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                            Terakhir update: {new Date().toLocaleTimeString('id-ID', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}