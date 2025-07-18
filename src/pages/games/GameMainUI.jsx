// src/pages/games/GameMainUI.jsx
import { useState, useEffect } from 'react';
import Dailymission from '../../components/layout/GameCard/Dailymission';
import Expcard from '../../components/layout/GameCard/Expcard';
import Game from '../../components/layout/GameCard/Game';
import Scoreboard from '../../components/layout/GameCard/Scoreboard';
import StreakCountdown from '../../components/layout/GameCard/StreakCountdown';
import { gameAPI } from '../../service/api';

import game1Image from '../../assets/GameImage/Game1.png'
import game2Image from '../../assets/GameImage/Game2.png'
import game3Image from '../../assets/GameImage/Game3.png'

export default function GameMainUI() {
    const [gameProgress, setGameProgress] = useState({});
    const [streakData, setStreakData] = useState({
        current_streak: 0,
        longest_streak: 0,
        is_active: false,
        seconds_until_reset: 86400
    });
    const [userLevel, setUserLevel] = useState({
        current_level: 1,
        current_xp: 0,
        total_xp: 0,
        xp_to_next_level: 100
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showStreakAlert, setShowStreakAlert] = useState(false);

    // Static game data template
    const gameData = [
        {
            id: 1,
            title: "Tebak Pola (Pattern Puzzle)",
            image: game1Image,
            gameId: "patternpuzzle",
            description: "Asah logika dengan menebak pola yang tersembunyi",
            difficulty: "Medium"
        },
        {
            id: 2,
            title: "Yes or No",
            image: game2Image,
            gameId: "yesorno",
            description: "Tes pengetahuan dengan pertanyaan ya atau tidak",
            difficulty: "Easy"
        },
        {
            id: 3,
            title: "Maze Challenge",
            image: game3Image,
            gameId: "mazechallenge",
            description: "Temukan jalan keluar dari labirin yang menantang",
            difficulty: "Hard"
        },
    ];

    useEffect(() => {
        fetchAllData();
        
        // Set up interval to check streak countdown
        const interval = setInterval(() => {
            checkStreakCountdown();
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Fetch all data secara parallel
            const [progressResponse, streakResponse, levelResponse] = await Promise.all([
                gameAPI.getProgress().catch(err => {
                    console.error('Error fetching game progress:', err);
                    return { data: {} };
                }),
                gameAPI.getUserStreak().catch(err => {
                    console.error('Error fetching streak data:', err);
                    return { 
                        data: { 
                            current_streak: 0, 
                            longest_streak: 0, 
                            is_active: false,
                            seconds_until_reset: 86400
                        } 
                    };
                }),
                gameAPI.getUserLevel().catch(err => {
                    console.error('Error fetching user level:', err);
                    return { 
                        data: { 
                            current_level: 1, 
                            current_xp: 0, 
                            total_xp: 0,
                            xp_to_next_level: 100
                        } 
                    };
                })
            ]);

            setGameProgress(progressResponse.data || {});
            setStreakData(streakResponse.data || {
                current_streak: 0,
                longest_streak: 0,
                is_active: false,
                seconds_until_reset: 86400
            });
            setUserLevel(levelResponse.data || {
                current_level: 1,
                current_xp: 0,
                total_xp: 0,
                xp_to_next_level: 100
            });

        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Gagal memuat data game. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const checkStreakCountdown = () => {
        const secondsUntilReset = streakData.seconds_until_reset || 86400;
        const hoursUntilReset = secondsUntilReset / 3600;
        
        // Show alert if less than 1.5 hours and streak is not active
        if (hoursUntilReset <= 1.5 && !streakData.is_active) {
            setShowStreakAlert(true);
        } else {
            setShowStreakAlert(false);
        }
    };

    const getGameProgress = (gameId) => {
        if (gameProgress[gameId]) {
            return Math.min(gameProgress[gameId].percentage || 0, 100);
        }
        return 0;
    };

    const getGameStats = (gameId) => {
        if (gameProgress[gameId]) {
            return {
                totalQuestions: gameProgress[gameId].totalQuestions || 0,
                correctAnswers: gameProgress[gameId].correctAnswers || 0,
                percentage: Math.min(gameProgress[gameId].percentage || 0, 100),
                isCompleted: gameProgress[gameId].percentage >= 100
            };
        }
        return {
            totalQuestions: 0,
            correctAnswers: 0,
            percentage: 0,
            isCompleted: false
        };
    };

    const handleRefresh = () => {
        fetchAllData();
    };

    const handleGameComplete = (gameId, gameResult) => {
        // Update progress setelah game selesai
        fetchAllData();
    };

    if (loading) {
        return (
            <div className="h-screen flex flex-col">
                <main className="container mx-auto px-4 py-6 flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <div className="text-lg text-gray-600">Memuat data game...</div>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex flex-col">
                <main className="container mx-auto px-4 py-6 flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="text-red-500 text-xl mb-4">⚠️ {error}</div>
                        <button 
                            onClick={handleRefresh}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                        >
                            Coba Lagi
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Streak Alert Countdown */}
            {showStreakAlert && (
                <StreakCountdown 
                    secondsUntilReset={streakData.seconds_until_reset}
                    onClose={() => setShowStreakAlert(false)}
                />
            )}

            <main className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div className="mb-4 md:mb-0">
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                🧠 Asah logikamu lewat permainan seru dan menantang!
                            </h1>
                            <p className="text-gray-600">
                                Tingkatkan kemampuan berpikir dengan berbagai mini game edukatif
                            </p>
                        </div>
                        
                        {/* Streak Display in Header */}
                        <div className={`rounded-lg p-4 shadow-md min-w-[200px] ${
                            streakData.is_active 
                                ? 'bg-gradient-to-r from-yellow-400 to-orange-600' 
                                : 'bg-gradient-to-r from-gray-400 to-gray-600'
                        }`}>
                            <div className="flex items-center justify-center space-x-3 mb-2">
                                <div className={`text-5xl transition-all duration-300 ${
                                    streakData.is_active 
                                        ? 'animate-pulse filter drop-shadow-lg' 
                                        : 'grayscale opacity-60'
                                }`}>
                                    {streakData.is_active ? '🔥' : '🌙'}
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-white">
                                        {streakData.current_streak}
                                    </div>
                                    <div className="text-md text-white">
                                        Hari berturut-turut
                                    </div>
                                </div>
                            </div>
                            {!streakData.is_active && (
                                <div className="text-center text-white text-sm opacity-80">
                                    Main 1 game untuk mengaktifkan!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Game Cards */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className='text-xl font-poppins font-semibold'>Lanjutkan Progress Game-mu!</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gameData.map((game) => {
                            const stats = getGameStats(game.gameId);
                            return (
                                <Game
                                    key={game.id}
                                    title={game.title}
                                    progress={getGameProgress(game.gameId)}
                                    image={game.image}
                                    gameId={game.gameId}
                                    description={game.description}
                                    difficulty={game.difficulty}
                                    stats={stats}
                                    isCompleted={stats.isCompleted}
                                    onGameComplete={handleGameComplete}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Achievement & Motivation Section */}
                <div className="mt-8 bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold mb-2">🎯 Target Harian</h3>
                        <p className="text-gray-600 mb-4">
                            {streakData.is_active 
                                ? `Mantap! Kamu sudah aktif ${streakData.current_streak} hari berturut-turut!`
                                : 'Ayo main minimal 1 game untuk mengaktifkan streak harian!'}
                        </p>
                        
                        {/* Progress toward next milestone */}
                        <div className="max-w-md mx-auto">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Menuju 7 hari</span>
                                <span>{Math.min(streakData.current_streak, 7)}/7</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                    className="bg-gradient-to-r from-green-400 to-blue-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min((streakData.current_streak / 7) * 100, 100)}%` }}
                                ></div>
                            </div>
                            {streakData.current_streak >= 7 && (
                                <div className="text-green-600 text-sm mt-2 font-medium">
                                    🏆 Target 7 hari tercapai! +50 XP Bonus
                                </div>
                            )}
                        </div>

                        {/* Longest Streak Display */}
                        {streakData.longest_streak > 0 && (
                            <div className="mt-4 text-sm text-gray-600">
                                🏆 Rekor terpanjang: {streakData.longest_streak} hari
                            </div>
                        )}
                    </div>
                </div>

                {/* EXP & Daily Mission */}
                <div className='mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2 space-y-6'>
                        <Expcard 
                            progress={userLevel.current_xp} 
                            level={userLevel.current_level}
                            totalXp={userLevel.total_xp}
                            xpToNext={userLevel.xp_to_next_level}
                        />
                        <Dailymission onRefresh={handleRefresh} />
                    </div>
                    <div className='lg:col-span-1'>
                        <Scoreboard />
                    </div>
                </div>

                {/* Tips Section */}
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-3">💡 Tips</h3>
                    <ul className="text-yellow-700 space-y-2">
                        <li>• Main minimal 1 game setiap hari untuk menjaga streak api</li>                    
                        <li>• Selesaikan game 100% untuk mendapat bonus XP maksimal</li>
                        <li>• Challenge diri sendiri dengan tingkat kesulitan yang berbeda</li>
                        <li>• Selesaikan daily mission untuk XP tambahan</li>
                        <li>• Lihat leaderboard untuk membandingkan progressmu dengan teman</li>
                    </ul>
                </div>
            </main>
        </div>
    );
}