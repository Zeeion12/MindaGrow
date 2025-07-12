import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DailyMission() {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState({});

    useEffect(() => {
        fetchDailyMissions();
    }, []);

    const fetchDailyMissions = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const response = await axios.get('http://localhost:5000/api/daily-missions', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                setMissions(response.data.missions);
            }
        } catch (error) {
            console.error('Error fetching daily missions:', error);
            // Fallback to dummy data
            setMissions([
                {
                    id: 1,
                    title: "Complete 3 quizzes",
                    description: "Selesaikan 3 kuis dalam berbagai mata pelajaran",
                    current_progress: 2,
                    target_count: 3,
                    xp_reward: 50,
                    is_completed: false
                },
                {
                    id: 2,
                    title: "Watch 5 tutorial videos", 
                    description: "Tonton 5 video pembelajaran untuk menambah wawasan",
                    current_progress: 3,
                    target_count: 5,
                    xp_reward: 30,
                    is_completed: false
                },
                {
                    id: 3,
                    title: "Solve 10 practice problems",
                    description: "Kerjakan 10 soal latihan untuk mengasah kemampuan", 
                    current_progress: 4,
                    target_count: 10,
                    xp_reward: 100,
                    is_completed: false
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const updateMissionProgress = async (missionType, progress = 1) => {
        try {
            setUpdating(prev => ({ ...prev, [missionType]: true }));
            
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.post('http://localhost:5000/api/daily-missions/progress', {
                missionType,
                progress
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh missions data
            await fetchDailyMissions();
            
            // Show success notification
            showNotification('Mission progress updated! 🎉');
            
        } catch (error) {
            console.error('Error updating mission progress:', error);
            showNotification('Failed to update mission progress', 'error');
        } finally {
            setUpdating(prev => ({ ...prev, [missionType]: false }));
        }
    };

    const showNotification = (message, type = 'success') => {
        // Simple notification - you can replace with a proper toast library
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : '#EF4444'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            animation: slideIn 0.3s ease-out;
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    };

    const calculateProgress = (current, total) => {
        return Math.min(Math.round((current / total) * 100), 100);
    };

    const getMissionIcon = (missionType) => {
        switch (missionType) {
            case 'quiz': return '📝';
            case 'video': return '📺';
            case 'practice': return '🧮';
            case 'game': return '🎮';
            case 'assignment': return '📋';
            default: return '✅';
        }
    };

    const getMissionTypeFromTitle = (title) => {
        if (title.toLowerCase().includes('quiz')) return 'quiz';
        if (title.toLowerCase().includes('video')) return 'video';
        if (title.toLowerCase().includes('practice') || title.toLowerCase().includes('problem')) return 'practice';
        if (title.toLowerCase().includes('game')) return 'game';
        if (title.toLowerCase().includes('assignment')) return 'assignment';
        return 'other';
    };

    if (loading) {
        return (
            <div className="w-full bg-white rounded-lg shadow-md p-4">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i}>
                                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                                <div className="h-3 bg-gray-200 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Daily Mission</h2>
                <button 
                    onClick={fetchDailyMissions}
                    className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                    🔄 Refresh
                </button>
            </div>

            <div className="space-y-4">
                {missions.map((mission) => {
                    const progress = calculateProgress(mission.current_progress, mission.target_count);
                    const missionType = getMissionTypeFromTitle(mission.title);
                    const isUpdating = updating[missionType];
                    
                    return (
                        <div key={mission.id} className="w-full">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center flex-1">
                                    <span className="text-lg mr-2">
                                        {getMissionIcon(missionType)}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="text-md font-medium">{mission.title}</h3>
                                        {mission.description && (
                                            <p className="text-xs text-gray-500">{mission.description}</p>
                                        )}
                                        <span className="text-sm text-gray-500">
                                            ({mission.current_progress}/{mission.target_count})
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-green-600 font-medium">+{mission.xp_reward} XP</span>
                                    {mission.is_completed ? (
                                        <span className="text-green-600 text-lg">✅</span>
                                    ) : (
                                        <button
                                            onClick={() => updateMissionProgress(missionType)}
                                            disabled={isUpdating}
                                            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                                        >
                                            {isUpdating ? '⏳' : '▶️'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="relative">
                                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${
                                            mission.is_completed 
                                                ? 'bg-green-500' 
                                                : 'bg-[#4778EC]'
                                        } rounded-full relative`}
                                        style={{ width: `${progress}%` }}
                                    >
                                        {mission.is_completed && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Progress percentage */}
                                <div className="text-xs text-gray-500 text-center mt-1">
                                    {progress}% Complete
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Mission completion summary */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">
                        Completed: {missions.filter(m => m.is_completed).length}/{missions.length}
                    </span>
                    <span className="font-medium text-green-600">
                        Total XP: {missions.filter(m => m.is_completed).reduce((sum, m) => sum + m.xp_reward, 0)}
                    </span>
                </div>
                
                {missions.every(m => m.is_completed) && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg text-center">
                        <span className="text-green-800 font-medium">🏆 All missions completed! Great job!</span>
                    </div>
                )}
            </div>
        </div>
    );
}