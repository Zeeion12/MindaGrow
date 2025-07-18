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

    // Static game data template dengan data yang lebih lengkap
    const gameData = [
        {
            id: 1,
            title: "Tebak Pola (Pattern Puzzle)",
            image: game1Image,
            gameId: "patternpuzzle",
            description: "Asah logika dengan menebak pola yang tersembunyi",
            difficulty: "Medium",
            totalQuestions: 10,
            maxXpReward: 25,
            completionBonusXp: 50
        },
        {
            id: 2,
            title: "Yes or No",
            image: game2Image,
            gameId: "yesorno",
            description: "Tes pengetahuan dengan pertanyaan ya atau tidak",
            difficulty: "Easy",
            totalQuestions: 15,
            maxXpReward: 20,
            completionBonusXp: 30
        },
        {
            id: 3,
            title: "Maze Challenge",
            image: game3Image,
            gameId: "mazechallenge",
            description: "Temukan jalan keluar dari labirin yang menantang",
            difficulty: "Hard",
            totalQuestions: 8,
            maxXpReward: 30,
            completionBonusXp: 75
        },
    ];

    useEffect(() => {
        fetchAllData();
        
        // Set up interval to check streak countdown
        const interval = setInterval(() => {
            checkStreakCountdown();
            updateSecondsUntilReset();
        }, 1000); // Check every second for real-time countdown

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

    const updateSecondsUntilReset = () => {
        setStreakData(prev => ({
            ...prev,
            seconds_until_reset: Math.max(0, prev.seconds_until_reset - 1)
        }));
    };

    const checkStreakCountdown = () => {
        const secondsUntilReset = streakData.seconds_until_reset || 86400;
        const hoursUntilReset = secondsUntilReset / 3600;
        
        // Show alert if less than 1.5 hours and streak is not active
        if (hoursUntilReset <= 1.5 && !streakData.is_active && streakData.current_streak > 0) {
            setShowStreakAlert(true);
        } else {
            setShowStreakAlert(false);
        }
    };

    const formatCountdown = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;
        
        if (hours > 0) {
            return `${hours}j ${minutes}m ${remainingSeconds}d`;
        } else if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}d`;
        } else {
            return `${remainingSeconds}d`;
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
                isCompleted: gameProgress[gameId].percentage >= 100,
                timesPlayed: gameProgress[gameId].timesPlayed || 0,
                totalXpEarned: gameProgress[gameId].totalXpEarned || 0,
                bestScore: gameProgress[gameId].bestScore || 0
            };
        }
        return {
            totalQuestions: 0,
            correctAnswers: 0,
            percentage: 0,
            isCompleted: false,
            timesPlayed: 0,
            totalXpEarned: 0,
            bestScore: 0
        };
    };

    const handleRefresh = () => {
        fetchAllData();
    };

    const handleGameComplete = async (gameId, gameResult) => {
        try {
            // Update progress di backend
            await gameAPI.updateGameProgress(gameId, gameResult);
            
            // Refresh semua data setelah game selesai
            await fetchAllData();
            
        } catch (error) {
            console.error('Error updating game progress:', error);
        }
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
                <div className="fixed top-4 right-4 z-50 bg-red-500 text-white p-4 rounded-lg shadow-lg max-w-sm">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <span className="text-xl">⚠️</span>
                            <span className="font-semibold">Streak akan reset!</span>
                        </div>
                        <button 
                            onClick={() => setShowStreakAlert(false)}
                            className="text-white hover:text-gray-200"
                        >
                            ✕
                        </button>
                    </div>
                    <div className="text-sm mb-2">
                        Streak {streakData.current_streak} hari akan hilang dalam:
                    </div>
                    <div className="text-lg font-mono font-bold text-center bg-red-600 rounded px-2 py-1">
                        {formatCountdown(streakData.seconds_until_reset)}
                    </div>
                    <div className="text-xs mt-2 text-center">
                        Main 1 game untuk menjaga streak!
                    </div>
                </div>
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
                        <div className={`rounded-lg p-4 shadow-md min-w-[220px] transition-all duration-300 ${
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
                            
                            {!streakData.is_active && streakData.current_streak === 0 && (
                                <div className="text-center text-white text-sm opacity-80">
                                    Main 1 game untuk mengaktifkan!
                                </div>
                            )}
                            
                            {!streakData.is_active && streakData.current_streak > 0 && (
                                <div className="text-center text-white text-xs opacity-90">
                                    <div>Streak nonaktif hari ini</div>
                                    <div className="font-mono text-yellow-200">
                                        Reset dalam: {formatCountdown(streakData.seconds_until_reset)}
                                    </div>
                                </div>
                            )}
                            
                            {streakData.is_active && (
                                <div className="text-center text-white text-xs opacity-90">
                                    <div>✅ Aktif hari ini!</div>
                                    <div className="font-mono">
                                        Reset dalam: {formatCountdown(streakData.seconds_until_reset)}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Game Cards */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className='text-xl font-poppins font-semibold'>Lanjutkan Progress Game-mu!</h2>
                        <button 
                            onClick={handleRefresh}
                            className="text-blue-500 hover:text-blue-700 text-sm font-medium transition-colors"
                        >
                            🔄 Refresh
                        </button>
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
                                    gameInfo={{
                                        totalQuestions: game.totalQuestions,
                                        maxXpReward: game.maxXpReward,
                                        completionBonusXp: game.completionBonusXp
                                    }}
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
                                : streakData.current_streak > 0
                                    ? `Streak ${streakData.current_streak} hari belum aktif hari ini. Main 1 game untuk melanjutkan!`
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
                        <li>• Jaga streak untuk naik ke level yang lebih tinggi</li>
                    </ul>
                </div>

                {/* Game Statistics */}
                {Object.keys(gameProgress).length > 0 && (
                    <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                        <h3 className="text-lg font-semibold mb-4">📊 Statistik Game</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="text-2xl font-bold text-blue-600">
                                    {Object.values(gameProgress).reduce((sum, prog) => sum + (prog.timesPlayed || 0), 0)}
                                </div>
                                <div className="text-sm text-blue-800">Total Game Dimainkan</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="text-2xl font-bold text-green-600">
                                    {Object.values(gameProgress).reduce((sum, prog) => sum + (prog.totalXpEarned || 0), 0)}
                                </div>
                                <div className="text-sm text-green-800">Total XP dari Game</div>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="text-2xl font-bold text-purple-600">
                                    {Object.values(gameProgress).filter(prog => prog.isCompleted).length}
                                </div>
                                <div className="text-sm text-purple-800">Game Diselesaikan</div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}