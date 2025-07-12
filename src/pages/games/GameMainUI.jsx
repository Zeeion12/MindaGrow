import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Dailymission from '../../components/layout/GameCard/Dailymission';
import Expcard from '../../components/layout/GameCard/Expcard';
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
    const navigate = useNavigate();

    const gameImages = {
        1: game1Image,
        2: game2Image, 
        3: game3Image
    };

    useEffect(() => {
        fetchGameData();
        // Auto refresh every 30 seconds
        const interval = setInterval(fetchGameData, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchGameData = async () => {
        try {
            const token = localStorage.getItem('token');
            
            if (!token) {
                setGameData([
                    { id: 1, name: 'Pattern Puzzle', progress: 0, questions_completed: 0, total_questions: 20 },
                    { id: 2, name: 'Yes or No', progress: 0, questions_completed: 0, total_questions: 25 },
                    { id: 3, name: 'Maze Challenge', progress: 0, questions_completed: 0, total_questions: 15 }
                ]);
                setLoading(false);
                return;
            }

            // Fetch real game progress
            const response = await axios.get('http://localhost:5000/api/games/progress', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                const mappedGames = response.data.games.map(game => ({
                    id: game.id,
                    title: game.name === 'Pattern Puzzle' ? 'Tebak Pola (Pattern Puzzle)' :
                           game.name === 'Yes or No' ? 'Yes or No' :
                           game.name === 'Maze Challenge' ? 'Maze Challenge' : game.name,
                    progress: game.progress_percentage.toString(),
                    questions_completed: game.questions_completed,
                    total_questions: game.total_questions,
                    image: gameImages[game.id],
                    gameId: game.id === 1 ? 'patternpuzzle' :
                            game.id === 2 ? 'yesorno' :
                            game.id === 3 ? 'mazechallenge' : `game${game.id}`
                }));

                setGameData(mappedGames);
            }

            // Fetch user stats
            const userResponse = await axios.get('http://localhost:5000/api/games/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (userResponse.data.success) {
                setUserStats({
                    level: userResponse.data.user?.current_level || 1,
                    totalXp: userResponse.data.user?.total_xp || 0,
                    currentStreak: userResponse.data.streak?.current_streak || 0,
                    longestStreak: userResponse.data.streak?.longest_streak || 0
                });
            }

        } catch (error) {
            console.error('Error fetching game data:', error);
            // Fallback to default data with 0% progress
            setGameData([
                { id: 1, title: 'Tebak Pola (Pattern Puzzle)', progress: '0', image: game1Image, gameId: 'patternpuzzle', questions_completed: 0, total_questions: 20 },
                { id: 2, title: 'Yes or No', progress: '0', image: game2Image, gameId: 'yesorno', questions_completed: 0, total_questions: 25 },
                { id: 3, title: 'Maze Challenge', progress: '0', image: game3Image, gameId: 'mazechallenge', questions_completed: 0, total_questions: 15 }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleGameClick = (gameId) => {
        navigate(`/game/${gameId}`);
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
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-100 via-purple-50 to-pink-100 rounded-lg p-6 mb-8 relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                    🧠 Asah logikamu lewat permainan seru dan menantang!
                                </h1>
                                <p className="text-gray-600">
                                    Progress game akan tersimpan setiap kali kamu bermain!
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

                {/* Progress Notice */}
                {gameData.some(game => parseInt(game.progress) > 0) && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                        <div className="flex items-center">
                            <div className="text-green-600 text-xl mr-3">📈</div>
                            <div>
                                <div className="font-bold text-green-800">Progress Tersimpan!</div>
                                <div className="text-sm text-green-600">
                                    Kamu sudah menyelesaikan beberapa soal. Lanjutkan untuk menyelesaikan semua game!
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
                            <div 
                                key={game.id} 
                                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300 cursor-pointer transform"
                                onClick={() => handleGameClick(game.gameId)}
                            >
                                <div className="relative h-48">
                                    <img 
                                        src={game.image} 
                                        alt={game.title}
                                        className="w-full h-full object-cover"
                                    />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <h3 className="text-white text-lg font-bold mb-2 drop-shadow-lg">
                                            {game.title}
                                        </h3>
                                        <div className="bg-black bg-opacity-50 rounded-full px-3 py-1 text-white text-sm">
                                            {game.progress}%
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-sm text-gray-600">
                                            Progress: {game.questions_completed || 0}/{game.total_questions || 0} soal
                                        </span>
                                        <span className="text-xs text-blue-600 font-medium">
                                            {parseInt(game.progress) === 100 ? '✅ Selesai' : 'Berlanjut'}
                                        </span>
                                    </div>
                                    
                                    <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                                        <div 
                                            className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                                            style={{ width: `${game.progress}%` }}
                                        ></div>
                                    </div>
                                    
                                    <button 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleGameClick(game.gameId);
                                        }}
                                    >
                                        {parseInt(game.progress) === 100 ? 'Main Lagi' : 'Berlanjut'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cards Section */}
                <div className='mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2 space-y-6'>
                        <Expcard 
                            progress={userStats.totalXp % 100} 
                            level={userStats.level} 
                            totalXp={userStats.totalXp}
                            showDetailedProgress={true}
                        />
                        <Dailymission />
                    </div>
                    <div className='lg:col-span-1 space-y-6'>
                        <StreakCard />
                        <Scoreboard />
                    </div>
                </div>
            </main>
        </div>
    )
}