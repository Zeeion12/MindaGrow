import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function StreakCard() {
    const [streakData, setStreakData] = useState({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        isActiveToday: false
    });
    const [loading, setLoading] = useState(true);
    const [timeUntilReset, setTimeUntilReset] = useState('');
    const [isStreakActive, setIsStreakActive] = useState(false);

    useEffect(() => {
        fetchStreakData();
        
        // Update every 30 seconds to check for activity
        const interval = setInterval(() => {
            fetchStreakData();
            updateTimeUntilReset();
        }, 30000);
        
        // Update countdown every second
        const countdownInterval = setInterval(updateTimeUntilReset, 1000);
        
        return () => {
            clearInterval(interval);
            clearInterval(countdownInterval);
        };
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
                lastActivityDate: response.data.last_activity_date,
                isActiveToday: response.data.is_active_today || false
            });

            setIsStreakActive(response.data.is_active_today || false);

        } catch (error) {
            console.error('Error fetching streak data:', error);
        } finally {
            setLoading(false);
        }
    };

    const updateTimeUntilReset = () => {
        const now = new Date();
        const midnight = new Date();
        midnight.setHours(24, 0, 0, 0); // Next midnight
        
        const timeDiff = midnight.getTime() - now.getTime();
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
        
        setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        
        // Check if it's close to midnight (within 5 minutes)
        const minutesUntilMidnight = Math.floor(timeDiff / (1000 * 60));
        if (minutesUntilMidnight <= 5 && minutesUntilMidnight > 0) {
            // Show warning about streak reset
            showMidnightWarning(minutesUntilMidnight);
        }
    };

    const showMidnightWarning = (minutesLeft) => {
        // Only show warning once per session
        if (sessionStorage.getItem('midnightWarningShown')) return;
        
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #F59E0B, #D97706);
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 6px 20px rgba(0,0,0,0.3);
            animation: warningPulse 0.5s ease-out;
            max-width: 300px;
        `;
        
        warning.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">⚠️</span>
                <div>
                    <div style="font-size: 14px;">Streak akan reset dalam ${minutesLeft} menit!</div>
                    <div style="font-size: 12px; opacity: 0.9;">Main game sekarang untuk mempertahankan streak</div>
                </div>
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes warningPulse {
                0% { transform: scale(0.8); opacity: 0; }
                50% { transform: scale(1.05); opacity: 1; }
                100% { transform: scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(warning);
        sessionStorage.setItem('midnightWarningShown', 'true');
        
        setTimeout(() => {
            if (warning.parentNode) {
                warning.parentNode.removeChild(warning);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 10000);
    };

    const getStreakEmoji = (streak, isActive) => {
        if (!isActive) return "💤";
        if (streak === 0) return "🆕";
        if (streak < 3) return "🔥";
        if (streak < 7) return "🚀";
        if (streak < 14) return "⚡";
        if (streak < 30) return "🏆";
        return "👑";
    };

    const getStreakLevel = (streak, isActive) => {
        if (!isActive) return { level: "Inactive", color: "gray", bgColor: "bg-gray-100" };
        if (streak === 0) return { level: "Starter", color: "blue", bgColor: "bg-blue-100" };
        if (streak < 3) return { level: "Beginner", color: "orange", bgColor: "bg-orange-100" };
        if (streak < 7) return { level: "Consistent", color: "green", bgColor: "bg-green-100" };
        if (streak < 14) return { level: "Dedicated", color: "purple", bgColor: "bg-purple-100" };
        if (streak < 30) return { level: "Master", color: "indigo", bgColor: "bg-indigo-100" };
        return { level: "Legend", color: "yellow", bgColor: "bg-yellow-100" };
    };

    const getNextMilestone = (streak) => {
        if (streak < 3) return { target: 3, reward: "🎯 +20 XP Bonus" };
        if (streak < 7) return { target: 7, reward: "🏅 +50 XP Bonus" };
        if (streak < 14) return { target: 14, reward: "⭐ +100 XP Bonus" };
        if (streak < 30) return { target: 30, reward: "👑 +200 XP Bonus" };
        return { target: 100, reward: "🏆 Hall of Fame" };
    };

    const streakLevel = getStreakLevel(streakData.currentStreak, isStreakActive);
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
                !isStreakActive ? 'from-gray-400 to-gray-500' :
                streakLevel.color === 'orange' ? 'from-orange-400 to-orange-500' :
                streakLevel.color === 'green' ? 'from-green-400 to-green-500' :
                streakLevel.color === 'blue' ? 'from-blue-400 to-blue-500' :
                streakLevel.color === 'purple' ? 'from-purple-400 to-purple-500' :
                streakLevel.color === 'indigo' ? 'from-indigo-400 to-indigo-500' :
                'from-yellow-400 to-yellow-500'
            } text-white p-4 relative overflow-hidden`}>
                <div className="flex items-center justify-between relative z-10">
                    <div>
                        <h3 className="text-lg font-bold">Streak Harian</h3>
                        <p className="text-sm opacity-90">Konsistensi Bermain</p>
                    </div>
                    <div className="text-3xl">
                        {getStreakEmoji(streakData.currentStreak, isStreakActive)}
                    </div>
                </div>
                
                {/* Animated background for active streaks */}
                {isStreakActive && streakData.currentStreak > 0 && (
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shine"></div>
                    </div>
                )}
            </div>

            {/* Main Content */}
            <div className="p-6">
                {/* Current Streak */}
                <div className="text-center mb-6">
                    <div className={`text-4xl font-bold mb-2 ${
                        isStreakActive ? 'text-gray-800' : 'text-gray-400'
                    }`}>
                        {streakData.currentStreak}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                        HARI BERTURUT-TURUT
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        streakLevel.bgColor
                    } ${
                        streakLevel.color === 'gray' ? 'text-gray-800' :
                        streakLevel.color === 'orange' ? 'text-orange-800' :
                        streakLevel.color === 'green' ? 'text-green-800' :
                        streakLevel.color === 'blue' ? 'text-blue-800' :
                        streakLevel.color === 'purple' ? 'text-purple-800' :
                        streakLevel.color === 'indigo' ? 'text-indigo-800' :
                        'text-yellow-800'
                    }`}>
                        {streakLevel.level}
                    </div>
                </div>

                {/* Status Today with Real-time Update */}
                <div className="mb-6">
                    <div className={`flex items-center justify-center p-3 rounded-lg border-2 ${
                        isStreakActive 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                    } transition-all duration-300`}>
                        <div className={`w-3 h-3 rounded-full mr-2 ${
                            isStreakActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                        }`}></div>
                        <span className={`text-sm font-medium ${
                            isStreakActive ? 'text-green-700' : 'text-red-700'
                        }`}>
                            {isStreakActive 
                                ? '🔥 Streak aktif hari ini!' 
                                : '💤 Belum bermain hari ini'}
                        </span>
                    </div>
                    
                    {/* Countdown to Reset */}
                    <div className="mt-3 text-center">
                        <div className="text-xs text-gray-500 mb-1">Reset dalam:</div>
                        <div className="font-mono text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded">
                            {timeUntilReset}
                        </div>
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
                            className={`h-2 rounded-full transition-all duration-1000 ${
                                !isStreakActive ? 'bg-gray-400' :
                                streakLevel.color === 'orange' ? 'bg-orange-400' :
                                streakLevel.color === 'green' ? 'bg-green-400' :
                                streakLevel.color === 'blue' ? 'bg-blue-400' :
                                streakLevel.color === 'purple' ? 'bg-purple-400' :
                                streakLevel.color === 'indigo' ? 'bg-indigo-400' :
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
                <div className="grid grid-cols-2 gap-4 mb-6">
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

                {/* Action Button */}
                {!isStreakActive && (
                    <div className="mb-4">
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-3 rounded-lg text-center">
                            <div className="text-sm font-medium">
                                🎮 Main game sekarang untuk aktifkan streak!
                            </div>
                        </div>
                    </div>
                )}

                {/* Streak Milestones */}
                <div className="pt-4 border-t border-gray-200">
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

                {/* Midnight Reset Info */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-xs text-blue-700">
                        <div className="font-semibold mb-1">⏰ Auto Reset System:</div>
                        <div>• Streak reset otomatis jam 12 malam WIB</div>
                        <div>• Status menjadi abu-abu jika belum main hari ini</div>
                        <div>• Main minimal 1 game untuk aktifkan streak</div>
                    </div>
                </div>
            </div>
        </div>
    );
}