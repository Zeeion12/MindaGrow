// src/components/layout/GameCard/Expcard.jsx
import { useState, useEffect } from 'react';

export default function Expcard({ progress = 0, level = 1, totalXp = 0, xpToNext = 100 }) {
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [isLevelUp, setIsLevelUp] = useState(false);

    // Safety checks untuk memastikan values tidak undefined/null
    const safeProgress = Math.max(0, progress || 0);
    const safeLevel = Math.max(1, level || 1);
    const safeTotalXp = Math.max(0, totalXp || 0);
    const safeXpToNext = Math.max(1, xpToNext || 100);

    // Calculate current level XP and next level XP requirement
    const currentLevelXp = safeProgress;
    const nextLevelXp = safeXpToNext;
    const progressPercentage = nextLevelXp > 0 ? (currentLevelXp / (currentLevelXp + nextLevelXp)) * 100 : 0;

    useEffect(() => {
        const timer = setTimeout(() => {
            setAnimatedProgress(progressPercentage);
        }, 100);

        return () => clearTimeout(timer);
    }, [progressPercentage]);

    useEffect(() => {
        // Trigger level up animation if level changed
        if (safeLevel > 1) {
            setIsLevelUp(true);
            const timer = setTimeout(() => setIsLevelUp(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [safeLevel]);

    const formatNumber = (num) => {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    };

    const getLevelColor = (level) => {
        if (level >= 50) return 'from-purple-500 to-pink-500';
        if (level >= 30) return 'from-red-500 to-orange-500';
        if (level >= 20) return 'from-orange-500 to-yellow-500';
        if (level >= 10) return 'from-green-500 to-blue-500';
        if (level >= 5) return 'from-blue-500 to-indigo-500';
        return 'from-gray-400 to-gray-600';
    };

    const getLevelTitle = (level) => {
        if (level >= 50) return '🔮 Master';
        if (level >= 30) return '👑 Expert';
        if (level >= 20) return '⭐ Advanced';
        if (level >= 10) return '🚀 Intermediate';
        if (level >= 5) return '📚 Beginner';
        return '🌱 Newbie';
    };

    const getNextMilestone = (level) => {
        if (level < 5) return { level: 5, title: 'Beginner', emoji: '📚' };
        if (level < 10) return { level: 10, title: 'Intermediate', emoji: '🚀' };
        if (level < 20) return { level: 20, title: 'Advanced', emoji: '⭐' };
        if (level < 30) return { level: 30, title: 'Expert', emoji: '👑' };
        if (level < 50) return { level: 50, title: 'Master', emoji: '🔮' };
        return { level: 100, title: 'Legend', emoji: '🏆' };
    };

    const nextMilestone = getNextMilestone(safeLevel);

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Level Up Animation */}
            {isLevelUp && (
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-80 animate-pulse z-10 rounded-lg flex items-center justify-center">
                    <div className="text-white text-center">
                        <div className="text-4xl mb-2">🎉</div>
                        <div className="text-xl font-bold">LEVEL UP!</div>
                        <div className="text-lg">Level {safeLevel}</div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className={`bg-gradient-to-r ${getLevelColor(safeLevel)} text-white p-4`}>
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-semibold">Level Siswa</h3>
                        <p className="text-white/90 text-sm flex items-center">
                            {getLevelTitle(safeLevel)}
                        </p>
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

                    {/* Milestone Section */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">🎯 Milestone Berikutnya</h4>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <span className="text-2xl">{nextMilestone.emoji}</span>
                                <div>
                                    <div className="font-medium text-gray-800">Level {nextMilestone.level}: {nextMilestone.title}</div>
                                    <div className="text-xs text-gray-600">{nextMilestone.level - safeLevel} level lagi</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{safeLevel}</div>
                            <div className="text-xs text-gray-500">Level</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{formatNumber(safeTotalXp)}</div>
                            <div className="text-xs text-gray-500">Total XP</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{currentLevelXp}</div>
                            <div className="text-xs text-gray-500">XP Saat Ini</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}