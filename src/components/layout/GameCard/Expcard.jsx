import React, { useState, useEffect } from 'react';

export default function Expcard({ progress = 0, level = 1, totalXp = 0, showDetailedProgress = false }) {
    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [animatedXp, setAnimatedXp] = useState(0);

    useEffect(() => {
        // Animate progress bar
        const timer = setTimeout(() => {
            setAnimatedProgress(progress);
            setAnimatedXp(totalXp);
        }, 100);
        
        return () => clearTimeout(timer);
    }, [progress, totalXp]);

    const xpForCurrentLevel = (level - 1) * 100;
    const xpForNextLevel = level * 100;
    const xpProgress = totalXp - xpForCurrentLevel;
    const xpNeeded = xpForNextLevel - totalXp;

    return (
        <div className="w-full bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Level Siswa</h2>
                <div className="text-right">
                    <div className="text-sm text-gray-600">Total XP</div>
                    <div className="text-lg font-bold text-green-600">{animatedXp}</div>
                </div>
            </div>

            {/* Level Circle */}
            <div className="flex items-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mr-4 shadow-lg">
                    <div className="text-center text-white">
                        <div className="text-xs font-medium">Level</div>
                        <div className="text-2xl font-bold">{level}</div>
                    </div>
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Progress ke Level {level + 1}
                        </span>
                        <span className="text-sm text-gray-500">
                            {xpProgress}/100 XP
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-1000 ease-out relative"
                            style={{ width: `${animatedProgress}%` }}
                        >
                            {/* Shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shine"></div>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Level {level}</span>
                        <span>{xpNeeded} XP lagi</span>
                        <span>Level {level + 1}</span>
                    </div>
                </div>
            </div>

            {/* Detailed Progress */}
            {showDetailedProgress && (
                <div className="border-t border-gray-200 pt-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-lg font-bold text-blue-600">{level}</div>
                            <div className="text-xs text-blue-600">Level Saat Ini</div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-lg font-bold text-green-600">{totalXp}</div>
                            <div className="text-xs text-green-600">Total XP</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-lg font-bold text-purple-600">{xpNeeded}</div>
                            <div className="text-xs text-purple-600">XP ke Level Selanjutnya</div>
                        </div>
                    </div>
                    
                    {/* Level Milestones */}
                    <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Milestone Level</h4>
                        <div className="space-y-1">
                            {[
                                { level: 5, reward: 'Badge Pemula', achieved: level >= 5 },
                                { level: 10, reward: 'Badge Konsisten', achieved: level >= 10 },
                                { level: 20, reward: 'Badge Master', achieved: level >= 20 },
                                { level: 50, reward: 'Badge Legend', achieved: level >= 50 }
                            ].map((milestone) => (
                                <div key={milestone.level} className={`flex items-center justify-between p-2 rounded ${
                                    milestone.achieved ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                                }`}>
                                    <span className="text-sm">Level {milestone.level}</span>
                                    <span className="text-sm">{milestone.reward}</span>
                                    {milestone.achieved && <span className="text-green-500">✓</span>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}