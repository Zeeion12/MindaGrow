import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function StreakCard() {
    const [streakData, setStreakData] = useState({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStreakData();
    }, []);

    const fetchStreakData = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await axios.get('http://localhost:5000/api/users/streak', {
                headers: { Authorization: `Bearer ${token}` }
            });

            setStreakData({
                currentStreak: response.data.current_streak || 0,
                longestStreak: response.data.longest_streak || 0,
                lastActivityDate: response.data.last_activity_date
            });
        } catch (error) {
            console.error('Error fetching streak data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStreakEmoji = (streak) => {
        if (streak === 0) return "💤";
        if (streak < 3) return "🔥";
        if (streak < 7) return "🚀";
        if (streak < 14) return "⚡";
        if (streak < 30) return "🏆";
        return "👑";
    };

    const getStreakLevel = (streak) => {
        if (streak === 0) return { level: "Inactive", color: "gray" };
        if (streak < 3) return { level: "Starter", color: "orange" };
        if (streak < 7) return { level: "Consistent", color: "blue" };
        if (streak < 14) return { level: "Dedicated", color: "purple" };
        if (streak < 30) return { level: "Master", color: "green" };
        return { level: "Legend", color: "yellow" };
    };

    const getNextMilestone = (streak) => {
        if (streak < 3) return { target: 3, reward: "🎯 +20 XP" };
        if (streak < 7) return { target: 7, reward: "🏅 +50 XP" };
        if (streak < 14) return { target: 14, reward: "⭐ +100 XP" };
        if (streak < 30) return { target: 30, reward: "👑 +200 XP" };
        return { target: 100, reward: "🏆 Hall of Fame" };
    };

    const isActiveToday = () => {
        if (!streakData.lastActivityDate) return false;
        const today = new Date().toISOString().split('T')[0];
        const lastActivity = new Date(streakData.lastActivityDate).toISOString().split('T')[0];
        return today === lastActivity;
    };

    const streakLevel = getStreakLevel(streakData.currentStreak);
    const nextMilestone = getNextMilestone(streakData.currentStreak);
    const progressToNext = streakData.currentStreak >= 30 ? 100 : 
        (streakData.currentStreak / nextMilestone.target) * 100;

    if (loading) {
        return (
            <div className="w-full bg-white rounded-lg shadow-md p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="h-16 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-md overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${
                streakLevel.color === 'gray' ? 'from-gray-400 to-gray-500' :
                streakLevel.color === 'orange' ? 'from-orange-400 to-orange-500' :
                streakLevel.color === 'blue' ? 'from-blue-400 to-blue-500' :
                streakLevel.color === 'purple' ? 'from-purple-400 to-purple-500' :
                streakLevel.color === 'green' ? 'from-green-400 to-green-500' :
                'from-yellow-400 to-yellow-500'
            } text-white p-4`}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-bold">Streak Harian</h3>
                        <p className="text-sm opacity-90">Konsistensi Bermain</p>
                    </div>
                    <div className="text-3xl">
                        {getStreakEmoji(streakData.currentStreak)}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6">
                {/* Current Streak */}
                <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-gray-800 mb-2">
                        {streakData.currentStreak}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                        HARI BERTURUT-TURUT
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        streakLevel.color === 'gray' ? 'bg-gray-100 text-gray-800' :
                        streakLevel.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                        streakLevel.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        streakLevel.color === 'purple' ? 'bg-purple-100 text-purple-800' :
                        streakLevel.color === 'green' ? 'bg-green-100 text-green-800' :
                        'bg-yellow-100 text-yellow-800'
                    }`}>
                        {streakLevel.level}
                    </div>
                </div>

                {/* Status Today */}
                <div className="mb-6">
                    <div className={`flex items-center justify-center p-3 rounded-lg ${
                        isActiveToday() 
                            ? 'bg-green-50 border border-green-200' 
                            : 'bg-orange-50 border border-orange-200'
                    }`}>
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                            isActiveToday() ? 'bg-green-500' : 'bg-orange-500'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                            isActiveToday() ? 'text-green-700' : 'text-orange-700'
                        }`}>
                            {isActiveToday() 
                                ? '✅ Sudah aktif hari ini!' 
                                : '⏰ Belum bermain hari ini'}
                        </span>
                    </div>
                </div>

                {/* Progress to Next Milestone */}
                <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Menuju {nextMilestone.target} hari
                        </span>
                        <span className="text-sm text-gray-500">
                            {nextMilestone.reward}
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                                streakLevel.color === 'gray' ? 'bg-gray-400' :
                                streakLevel.color === 'orange' ? 'bg-orange-400' :
                                streakLevel.color === 'blue' ? 'bg-blue-400' :
                                streakLevel.color === 'purple' ? 'bg-purple-400' :
                                streakLevel.color === 'green' ? 'bg-green-400' :
                                'bg-yellow-400'
                            }`}
                            style={{ width: `${Math.min(progressToNext, 100)}%` }}
                        ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                        {streakData.currentStreak >= 30 ? 'Max Level Reached!' : 
                         `${streakData.currentStreak}/${nextMilestone.target} hari`}
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">
                            {streakData.longestStreak}
                        </div>
                        <div className="text-xs text-gray-600">Streak Terpanjang</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-800">
                            {streakData.currentStreak > 0 ? 
                                Math.floor((streakData.currentStreak / 30) * 100) + '%' : '0%'}
                        </div>
                        <div className="text-xs text-gray-600">Progress Legend</div>
                    </div>
                </div>

                {/* Action */}
                {!isActiveToday() && (
                    <div className="mt-4">
                        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-3 rounded-lg text-center">
                            <div className="text-sm font-medium">
                                🎮 Main game sekarang untuk lanjutkan streak!
                            </div>
                        </div>
                    </div>
                )}

                {/* Streak Milestones */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Milestone Streak</h4>
                    <div className="space-y-2">
                        {[
                            { days: 3, reward: '20 XP', icon: '🎯' },
                            { days: 7, reward: '50 XP', icon: '🏅' },
                            { days: 14, reward: '100 XP', icon: '⭐' },
                            { days: 30, reward: '200 XP', icon: '👑' }
                        ].map((milestone) => (
                            <div key={milestone.days} className={`flex items-center justify-between p-2 rounded ${
                                streakData.currentStreak >= milestone.days 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-gray-50 text-gray-500'
                            }`}>
                                <div className="flex items-center">
                                    <span className="mr-2">{milestone.icon}</span>
                                    <span className="text-sm">{milestone.days} hari</span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm mr-2">+{milestone.reward}</span>
                                    {streakData.currentStreak >= milestone.days && (
                                        <span className="text-green-500">✓</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}