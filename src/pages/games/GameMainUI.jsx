import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Dailymission from '../../components/layout/GameCard/Dailymission';
import Expcard from '../../components/layout/GameCard/Expcard';
import Game from '../../components/layout/GameCard/Game';
import Scoreboard from '../../components/layout/GameCard/Scoreboard';
import StreakCard from '../../components/layout/GameCard/StreakCard';

import game1Image from '../../assets/GameImage/Game1.png'
import game2Image from '../../assets/GameImage/Game2.png'
import game3Image from '../../assets/GameImage/Game3.png'

export default function GameMainUI() {
    const [gameData, setGameData] = useState([]);
    const [userStats, setUserStats] = useState({
        level: 1,
        totalXp: 0,
        currentStreak: 0,
        longestStreak: 0
    });
    const [loading, setLoading] = useState(true);

    // Static game data with default progress
    const staticGameData = [
        {
            id: 1,
            title: "Tebak Pola (Pattern Puzzle)",
            progress: "0",
            image: game1Image,
            gameId: "patternpuzzle"
        },
        {
            id: 2,
            title: "Yes or No",
            progress: "0",
            image: game2Image,
            gameId: "yesorno"
        },
        {
            id: 3,
            title: "Maze Challenge",
            progress: "0",
            image: game3Image,
            gameId: "mazechallenge"
        },
    ];

    useEffect(() => {
        fetchGameData();
        // Auto refresh every 30 seconds to keep data fresh
        const interval = setInterval(fetchGameData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchGameData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                // Use static data if no token
                setGameData(staticGameData);
                setLoading(false);
                return;
            }

            // Try to fetch dynamic data
            const response = await axios.get('http://localhost:5000/api/games/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                // Map response to game data
                const dynamicGameData = staticGameData.map(game => {
                    const foundGame = response.data.games?.find(g => g.id === game.id);
                    return {
                        ...game,
                        progress: foundGame?.progress?.toString() || "0"
                    };
                });

                setGameData(dynamicGameData);
                setUserStats({
                    level: response.data.user?.current_level || 1,
                    totalXp: response.data.user?.total_xp || 0,
                    currentStreak: response.data.streak?.current_streak || 0,
                    longestStreak: response.data.streak?.longest_streak || 0
                });
            } else {
                // Fallback to static data
                setGameData(staticGameData);
            }
        } catch (error) {
            console.error('Error fetching game data:', error);
            // Fallback to static data
            setGameData(staticGameData);
            
            // Try to fetch at least user stats separately
            try {
                const token = localStorage.getItem('token');
                if (token) {
                    // Try to get user XP from profile or another endpoint
                    const userResponse = await axios.get('http://localhost:5000/api/profile', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    
                    if (userResponse.data.success) {
                        setUserStats(prev => ({
                            ...prev,
                            level: userResponse.data.user?.current_level || 1,
                            totalXp: userResponse.data.user?.total_xp || 0
                        }));
                    }
                }
            } catch (userError) {
                console.error('Error fetching user data:', userError);
            }
        } finally {
            setLoading(false);
        }
    };

    const updateMissionProgress = async (missionType, progress = 1) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            await axios.post('http://localhost:5000/api/daily-missions/progress', {
                missionType,
                progress
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Refresh game data to get updated XP and stats
            await fetchGameData();
            
        } catch (error) {
            console.error('Error updating mission progress:', error);
        }
    };

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data game...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            <main className="container mx-auto px-4 py-6">
                {/* Header - Simple Version */}
                <div className="bg-gradient-to-r from-blue-100 via-purple-50 to-pink-100 rounded-lg p-6 mb-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                    🧠 Asah logikamu lewat permainan seru dan menantang!
                                </h1>
                                <p className="text-gray-600">
                                    Bermain game setiap hari untuk meningkatkan streak dan mendapat XP bonus!
                                </p>
                            </div>
                            
                            {/* Quick Stats */}
                            <div className="mt-4 md:mt-0 flex space-x-4">
                                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                                    <div className="text-lg font-bold text-blue-600">{userStats.level}</div>
                                    <div className="text-xs text-gray-600">Level</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                                    <div className="text-lg font-bold text-green-600">{userStats.totalXp}</div>
                                    <div className="text-xs text-gray-600">Total XP</div>
                                </div>
                                <div className="bg-white rounded-lg p-3 shadow-sm text-center">
                                    <div className="text-lg font-bold text-orange-600">{userStats.currentStreak}</div>
                                    <div className="text-xs text-gray-600">Streak</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 opacity-10">
                        <div className="text-8xl">🎮</div>
                    </div>
                </div>

                {/* Daily Challenge Notice */}
                {userStats.currentStreak === 0 && (
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 rounded-lg p-4 mb-6 text-white">
                        <div className="flex items-center">
                            <div className="text-2xl mr-3">🔥</div>
                            <div>
                                <div className="font-bold">Mulai Streak Harian!</div>
                                <div className="text-sm opacity-90">
                                    Main game hari ini untuk memulai streak dan dapatkan XP bonus setiap hari!
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Content */}
                <div>
                    <h2 className='text-xl font-poppins font-semibold mb-4'>Daftar Game</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gameData.map((game) => (
                            <Game
                                key={game.id}
                                title={game.title}
                                subject={game.subject}
                                progress={game.progress}
                                image={game.image}
                                gameId={game.gameId}
                                onGameComplete={updateMissionProgress}
                            />
                        ))}
                    </div>
                </div>

                {/* Cards Section with Dynamic Components */}
                <div className='mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2 space-y-6'>
                        <Expcard 
                            progress={userStats.totalXp % 100} 
                            level={userStats.level} 
                            totalXp={userStats.totalXp}
                        />
                        <Dailymission />
                    </div>
                    <div className='lg:col-span-1 space-y-6'>
                        <StreakCard />
                        <Scoreboard />
                    </div>
                </div>

                {/* Motivational Footer */}
                <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <h3 className="text-lg font-bold text-blue-800 mb-4">💡 Tips Meningkatkan XP</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-2">🎯</div>
                            <div>
                                <div className="font-semibold text-blue-800">Selesaikan Daily Mission</div>
                                <div className="text-blue-600">Dapatkan XP ekstra dari misi harian</div>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-2">🔥</div>
                            <div>
                                <div className="font-semibold text-blue-800">Pertahankan Streak</div>
                                <div className="text-blue-600">Main setiap hari untuk bonus streak</div>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="text-blue-600 mr-2">🏆</div>
                            <div>
                                <div className="font-semibold text-blue-800">Kompetisi Leaderboard</div>
                                <div className="text-blue-600">Saingi teman untuk peringkat teratas</div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}