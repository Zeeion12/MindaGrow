// src/pages/games/PatternPuzzleGame.jsx - Example dengan API call
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../../service/api';

// Patterns data (keep existing patterns)
const patterns = [
    // Your existing patterns array
    {
        id: 1,
        sequence: [1, 2, 3, 4, 5],
        missing: 6,
        options: [5, 6, 7, 8],
        difficulty: 1
    },
    {
        id: 2,
        sequence: [2, 4, 6, 8, 10],
        missing: 12,
        options: [11, 12, 13, 14],
        difficulty: 1
    },
    // ... add more patterns
];

export default function PatternPuzzleGame() {
    const navigate = useNavigate();
    
    // Game state
    const [gameState, setGameState] = useState("start");
    const [currentPattern, setCurrentPattern] = useState(0);
    const [score, setScore] = useState(0);
    const [totalExp, setTotalExp] = useState(0);
    const [showFeedback, setShowFeedback] = useState(null);
    const [progress, setProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState(20);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [fadeIn, setFadeIn] = useState(true);
    const [difficultyLevel, setDifficultyLevel] = useState("all");
    const [filteredPatterns, setFilteredPatterns] = useState(patterns);
    
    // Game completion tracking
    const [gameStats, setGameStats] = useState({
        correctAnswers: 0,
        totalQuestions: 0,
        gameStartTime: null
    });
    const [isSubmittingResult, setIsSubmittingResult] = useState(false);

    // Filter patterns based on difficulty
    useEffect(() => {
        if (difficultyLevel === "all") {
            setFilteredPatterns(patterns);
        } else {
            const difficultyMap = { easy: 1, medium: 2, hard: 3 };
            const level = difficultyMap[difficultyLevel];
            setFilteredPatterns(patterns.filter((pattern) => pattern.difficulty === level));
        }
    }, [difficultyLevel]);

    // Update progress when current pattern changes
    useEffect(() => {
        if (gameState === "playing") {
            setProgress((currentPattern / filteredPatterns.length) * 100);
            setTimeLeft(20);
            setIsTimerActive(true);
            setFadeIn(true);
        }
    }, [currentPattern, gameState, filteredPatterns.length]);

    // Timer effect
    useEffect(() => {
        let timer;
        if (isTimerActive && timeLeft > 0 && gameState === "playing" && !showFeedback) {
            timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1);
            }, 1000);
        } else if (timeLeft === 0 && !showFeedback) {
            // Time's up - mark as wrong
            handleAnswer(null, true); // Pass true for timeout
        }
        return () => clearTimeout(timer);
    }, [timeLeft, isTimerActive, gameState, showFeedback]);

    const handleStart = () => {
        setGameState("playing");
        setCurrentPattern(0);
        setScore(0);
        setTotalExp(0);
        setProgress(0);
        setTimeLeft(20);
        setIsTimerActive(true);
        setFadeIn(true);
        
        // Initialize game stats
        setGameStats({
            correctAnswers: 0,
            totalQuestions: filteredPatterns.length,
            gameStartTime: Date.now()
        });
    };

    const handleAnswer = async (selectedAnswer, isTimeout = false) => {
        if (showFeedback || isSubmittingResult) return;

        setIsTimerActive(false);
        
        const currentPatternData = filteredPatterns[currentPattern];
        const isCorrect = !isTimeout && selectedAnswer === currentPatternData.missing;
        
        // Update game stats
        setGameStats(prev => ({
            ...prev,
            correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0)
        }));

        if (isCorrect) {
            setScore(score + 1);
            setTotalExp(totalExp + 10);
            setShowFeedback("correct");
        } else {
            setShowFeedback(isTimeout ? "timeout" : "wrong");
        }

        setTimeout(() => {
            setShowFeedback(null);
            setFadeIn(false);
            
            setTimeout(() => {
                if (currentPattern + 1 >= filteredPatterns.length) {
                    // Game finished - submit results
                    handleGameComplete();
                } else {
                    setCurrentPattern(currentPattern + 1);
                }
            }, 300);
        }, 1500);
    };

    const handleGameComplete = async () => {
        console.log('🎮 Pattern Puzzle Game completed!');
        setGameState("gameOver");
        setIsSubmittingResult(true);
        
        try {
            const finalStats = {
                ...gameStats,
                correctAnswers: gameStats.correctAnswers + (showFeedback === "correct" ? 1 : 0)
            };
            
            console.log('📊 Final game stats:', finalStats);
            
            // Submit game results to backend
            const response = await gameAPI.completeGame({
                gameId: 'patternpuzzle',
                correctAnswers: finalStats.correctAnswers,
                totalQuestions: finalStats.totalQuestions
            });
            
            console.log('✅ Game completion response:', response.data);
            
            // Show success message
            if (response.data.streakUpdated) {
                console.log(`🔥 Streak updated! Current streak: ${response.data.currentStreak}`);
            }
            
        } catch (error) {
            console.error('❌ Error submitting game results:', error);
            // Continue with game over screen even if API fails
        } finally {
            setIsSubmittingResult(false);
        }
    };

    const handleRestart = () => {
        setGameState("start");
        setCurrentPattern(0);
        setScore(0);
        setTotalExp(0);
        setShowFeedback(null);
        setProgress(0);
        setTimeLeft(20);
        setIsTimerActive(false);
        setFadeIn(true);
        setGameStats({
            correctAnswers: 0,
            totalQuestions: 0,
            gameStartTime: null
        });
    };

    const handleBackToMenu = () => {
        navigate('/game');
    };

    const getDifficultyColor = (difficulty) => {
        switch(difficulty) {
            case 1: return "bg-green-100 text-green-600";
            case 2: return "bg-yellow-100 text-yellow-600";
            case 3: return "bg-red-100 text-red-600";
            default: return "bg-gray-100 text-gray-600";
        }
    };

    const getDifficultyText = (difficulty) => {
        switch(difficulty) {
            case 1: return "Mudah";
            case 2: return "Sedang";
            case 3: return "Sulit";
            default: return "Unknown";
        }
    };

    if (gameState === "start") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="mb-6">
                        <div className="text-6xl mb-4">🧩</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-2">Pattern Puzzle</h1>
                        <p className="text-gray-600">Asah logika dengan menebak pola yang tersembunyi!</p>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Pilih Tingkat Kesulitan:
                        </label>
                        <select 
                            value={difficultyLevel} 
                            onChange={(e) => setDifficultyLevel(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="all">Semua Level ({patterns.length} soal)</option>
                            <option value="easy">Mudah ({patterns.filter(p => p.difficulty === 1).length} soal)</option>
                            <option value="medium">Sedang ({patterns.filter(p => p.difficulty === 2).length} soal)</option>
                            <option value="hard">Sulit ({patterns.filter(p => p.difficulty === 3).length} soal)</option>
                        </select>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleStart}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
                        >
                            🚀 Mulai Bermain
                        </button>
                        
                        <button
                            onClick={handleBackToMenu}
                            className="w-full bg-gray-500 text-white py-2 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                        >
                            ← Kembali ke Menu
                        </button>
                    </div>

                    <div className="mt-6 text-sm text-gray-500">
                        <p>• Setiap soal memiliki waktu 20 detik</p>
                        <p>• Jawab dengan benar untuk mendapat poin</p>
                        <p>• Selesaikan game untuk update streak harian!</p>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === "playing") {
        const currentPatternData = filteredPatterns[currentPattern];
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-2xl w-full shadow-2xl">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Pattern Puzzle</h2>
                            <p className="text-gray-600">Soal {currentPattern + 1} dari {filteredPatterns.length}</p>
                        </div>
                        <div className="text-right">
                            <div className="text-3xl font-bold text-purple-600">{score}</div>
                            <div className="text-sm text-gray-600">Skor</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="text-center mb-6">
                        <div className={`text-4xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>
                            {timeLeft}s
                        </div>
                        <div className="text-gray-600">Waktu tersisa</div>
                    </div>

                    {/* Pattern Display */}
                    <div className={`transition-opacity duration-300 ${fadeIn ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="mb-6">
                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-4 ${getDifficultyColor(currentPatternData.difficulty)}`}>
                                {getDifficultyText(currentPatternData.difficulty)}
                            </div>
                            
                            <div className="text-center mb-6">
                                <p className="text-lg text-gray-700 mb-4">Lengkapi pola berikut:</p>
                                <div className="flex justify-center items-center space-x-4 mb-6">
                                    {currentPatternData.sequence.map((num, index) => (
                                        <div key={index} className="w-16 h-16 bg-purple-100 border-2 border-purple-300 rounded-lg flex items-center justify-center text-xl font-bold text-purple-700">
                                            {num}
                                        </div>
                                    ))}
                                    <div className="w-16 h-16 bg-pink-100 border-2 border-pink-300 border-dashed rounded-lg flex items-center justify-center text-2xl font-bold text-pink-500">
                                        ?
                                    </div>
                                </div>
                            </div>

                            {/* Answer Options */}
                            <div className="grid grid-cols-2 gap-4">
                                {currentPatternData.options.map((option, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleAnswer(option)}
                                        disabled={showFeedback}
                                        className="w-full h-16 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xl font-bold rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                    >
                                        {option}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Feedback */}
                    {showFeedback && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-2xl p-8 text-center max-w-sm mx-4">
                                {showFeedback === "correct" && (
                                    <>
                                        <div className="text-6xl mb-4">🎉</div>
                                        <h3 className="text-2xl font-bold text-green-600 mb-2">Benar!</h3>
                                        <p className="text-gray-600">+10 XP</p>
                                    </>
                                )}
                                {showFeedback === "wrong" && (
                                    <>
                                        <div className="text-6xl mb-4">😔</div>
                                        <h3 className="text-2xl font-bold text-red-600 mb-2">Salah!</h3>
                                        <p className="text-gray-600">Jawaban yang benar: {currentPatternData.missing}</p>
                                    </>
                                )}
                                {showFeedback === "timeout" && (
                                    <>
                                        <div className="text-6xl mb-4">⏰</div>
                                        <h3 className="text-2xl font-bold text-orange-600 mb-2">Waktu Habis!</h3>
                                        <p className="text-gray-600">Jawaban yang benar: {currentPatternData.missing}</p>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (gameState === "gameOver") {
        const finalScore = (score / filteredPatterns.length) * 100;
        
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
                    <div className="mb-6">
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Game Selesai!</h2>
                        <p className="text-gray-600">Selamat! Kamu telah menyelesaikan semua pola.</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-6 mb-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <div className="text-2xl font-bold text-purple-600">{score}</div>
                                <div className="text-sm text-gray-600">Jawaban Benar</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-pink-600">{filteredPatterns.length}</div>
                                <div className="text-sm text-gray-600">Total Soal</div>
                            </div>
                        </div>
                        
                        <div className="mb-4">
                            <div className="text-3xl font-bold text-green-600">{Math.round(finalScore)}%</div>
                            <div className="text-sm text-gray-600">Akurasi</div>
                        </div>

                        <div className="mb-4">
                            <div className="text-2xl font-bold text-blue-600">+{totalExp}</div>
                            <div className="text-sm text-gray-600">Total XP</div>
                        </div>

                        {isSubmittingResult && (
                            <div className="text-sm text-gray-600 italic">
                                📡 Menyimpan hasil game...
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={handleRestart}
                            disabled={isSubmittingResult}
                            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            🔄 Main Lagi
                        </button>
                        
                        <button
                            onClick={handleBackToMenu}
                            disabled={isSubmittingResult}
                            className="w-full bg-gray-500 text-white py-2 px-6 rounded-lg font-medium hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            ← Kembali ke Menu
                        </button>
                    </div>

                    <div className="mt-6 text-sm text-gray-500">
                        <p>🔥 Game selesai akan mengupdate streak harian!</p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}