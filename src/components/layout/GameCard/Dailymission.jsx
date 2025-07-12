import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DailyMission() {
    const [missions, setMissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completedMissions, setCompletedMissions] = useState(new Set());

    useEffect(() => {
        fetchDailyMissions();
        // Auto refresh every 30 seconds to check for mission completion
        const interval = setInterval(fetchDailyMissions, 30000);
        return () => clearInterval(interval);
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
                
                // Track newly completed missions for celebration
                response.data.missions.forEach(mission => {
                    if (mission.is_completed && !completedMissions.has(mission.id)) {
                        setCompletedMissions(prev => new Set([...prev, mission.id]));
                        showCompletionCelebration(mission);
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching daily missions:', error);
            // Fallback missions
            setMissions([
                {
                    id: 1,
                    title: "Complete 3 quizzes",
                    description: "Selesaikan 3 kuis hari ini dengan benar",
                    mission_type: "quiz",
                    target_count: 3,
                    xp_reward: 50,
                    current_progress: 0,
                    is_completed: false,
                    condition_met: false
                },
                {
                    id: 2,
                    title: "Watch 5 tutorial videos",
                    description: "Tonton 5 video pembelajaran untuk menambah wawasan",
                    mission_type: "video",
                    target_count: 5,
                    xp_reward: 30,
                    current_progress: 0,
                    is_completed: false,
                    condition_met: false
                },
                {
                    id: 3,
                    title: "Solve 10 practice problems",
                    description: "Selesaikan 10 soal latihan dengan benar",
                    mission_type: "practice",
                    target_count: 10,
                    xp_reward: 100,
                    current_progress: 0,
                    is_completed: false,
                    condition_met: false
                },
                {
                    id: 4,
                    title: "Play any game",
                    description: "Mainkan game apapun hari ini",
                    mission_type: "game",
                    target_count: 1,
                    xp_reward: 25,
                    current_progress: 0,
                    is_completed: false,
                    condition_met: false
                }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const showCompletionCelebration = (mission) => {
        // Create celebration notification
        const celebration = document.createElement('div');
        celebration.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            padding: 20px 30px;
            border-radius: 15px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            text-align: center;
            animation: celebrationPop 0.6s ease-out;
        `;
        
        celebration.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 10px;">🎉</div>
            <div style="font-size: 18px; margin-bottom: 5px;">Mission Completed!</div>
            <div style="font-size: 16px; margin-bottom: 10px;">${mission.title}</div>
            <div style="font-size: 14px; color: #D1FAE5;">+${mission.xp_reward} XP Earned!</div>
        `;

        // Add celebration CSS
        const style = document.createElement('style');
        style.textContent = `
            @keyframes celebrationPop {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(celebration);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.parentNode.removeChild(celebration);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
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

    const getMissionCondition = (mission) => {
        switch (mission.id) {
            case 1:
                return {
                    condition: `IF completed_quizzes >= 3`,
                    status: mission.condition_met ? 'MET' : 'NOT MET',
                    description: 'Condition: Complete 3 quiz games'
                };
            case 2:
                return {
                    condition: `IF videos_watched >= 5`,
                    status: mission.condition_met ? 'MET' : 'NOT MET',
                    description: 'Condition: Watch 5 tutorial videos'
                };
            case 3:
                return {
                    condition: `IF correct_answers >= 10`,
                    status: mission.condition_met ? 'MET' : 'NOT MET',
                    description: 'Condition: Answer 10 questions correctly'
                };
            case 4:
                return {
                    condition: `IF games_played >= 1`,
                    status: mission.condition_met ? 'MET' : 'NOT MET',
                    description: 'Condition: Play any game today'
                };
            default:
                return {
                    condition: 'IF condition_met = true',
                    status: 'UNKNOWN',
                    description: 'Default condition'
                };
        }
    };

    if (loading) {
        return (
            <div className="w-full bg-white rounded-lg shadow-md p-4">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded mb-4"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map(i => (
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
                    const condition = getMissionCondition(mission);
                    
                    return (
                        <div key={mission.id} className={`w-full border-2 rounded-lg p-4 transition-all duration-300 ${
                            mission.is_completed 
                                ? 'border-green-300 bg-green-50' 
                                : mission.condition_met 
                                ? 'border-blue-300 bg-blue-50'
                                : 'border-gray-200 bg-gray-50'
                        }`}>
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-start flex-1">
                                    <span className="text-2xl mr-3">
                                        {getMissionIcon(mission.mission_type)}
                                    </span>
                                    <div className="flex-1">
                                        <h3 className="text-md font-medium">{mission.title}</h3>
                                        <p className="text-xs text-gray-500 mb-2">{mission.description}</p>
                                        
                                        
                                        <span className="text-sm text-gray-500">
                                            Progress: {mission.current_progress}/{mission.target_count}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 ml-4">
                                    <span className={`font-medium ${
                                        mission.is_completed ? 'text-green-600' : 'text-blue-600'
                                    }`}>
                                        +{mission.xp_reward} XP
                                    </span>
                                    {mission.is_completed ? (
                                        <div className="flex items-center">
                                            <span className="text-green-600 text-xl">✅</span>
                                        </div>
                                    ) : mission.condition_met ? (
                                        <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                                            Ready!
                                        </div>
                                    ) : (
                                        <div className="bg-gray-400 text-white text-xs px-2 py-1 rounded">
                                            Pending
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="relative">
                                <div className="h-3 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${
                                            mission.is_completed 
                                                ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                                : mission.condition_met
                                                ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                                                : 'bg-gradient-to-r from-gray-400 to-gray-500'
                                        } rounded-full relative`}
                                        style={{ width: `${progress}%` }}
                                    >
                                        {mission.is_completed && (
                                            <div className="absolute inset-0 bg-gradient-to-r from-green-300/50 to-green-500/50 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="text-xs text-gray-500 text-center mt-1">
                                    {progress}% Complete
                                    {mission.condition_met && !mission.is_completed && (
                                        <span className="text-blue-600 font-medium"> • Condition Met!</span>
                                    )}
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
                        Today's XP: {missions.filter(m => m.is_completed).reduce((sum, m) => sum + m.xp_reward, 0)}
                    </span>
                </div>
                
                {/* Condition Status Overview */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-50 border border-green-200 rounded p-2 text-center">
                        <div className="font-bold text-green-800">
                            {missions.filter(m => m.condition_met).length}
                        </div>
                        <div className="text-green-600">Conditions Met</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded p-2 text-center">
                        <div className="font-bold text-orange-800">
                            {missions.filter(m => !m.condition_met).length}
                        </div>
                        <div className="text-orange-600">Conditions Pending</div>
                    </div>
                </div>
                
                {/* All missions completed celebration */}
                {missions.every(m => m.is_completed) && missions.length > 0 && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg text-center text-white">
                        <div className="text-2xl mb-2">🏆</div>
                        <div className="font-bold">All Daily Missions Completed!</div>
                        <div className="text-sm opacity-90">Amazing work! Come back tomorrow for new challenges.</div>
                    </div>
                )}
            </div>
        </div>
    );
}