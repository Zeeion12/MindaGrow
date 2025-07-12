"use client"

import { useState, useEffect } from "react"
import axios from 'axios';

// Expanded question bank - 25 questions
const questions = [
    { statement: "Matahari terbit dari timur.", isTrue: true },
    { statement: "Kucing memiliki 3 kaki.", isTrue: false },
    { statement: "Air mendidih pada suhu 100 derajat Celsius.", isTrue: true },
    { statement: "Bumi berbentuk datar.", isTrue: false },
    { statement: "Manusia bernapas dengan paru-paru.", isTrue: true },
    { statement: "Jeruk berwarna biru.", isTrue: false },
    { statement: "Ayam bertelur.", isTrue: true },
    { statement: "Ikan bisa hidup di darat.", isTrue: false },
    { statement: "2 + 2 = 4", isTrue: true },
    { statement: "Bulan lebih besar dari matahari.", isTrue: false },
    { statement: "Indonesia adalah negara kepulauan.", isTrue: true },
    { statement: "Es lebih berat dari air.", isTrue: false },
    { statement: "Satu hari ada 24 jam.", isTrue: true },
    { statement: "Semua burung bisa terbang.", isTrue: false },
    { statement: "Api membutuhkan oksigen untuk menyala.", isTrue: true },
    { statement: "Gajah adalah hewan terkecil di dunia.", isTrue: false },
    { statement: "Musik dapat mempengaruhi suasana hati.", isTrue: true },
    { statement: "Semua planet memiliki cincin.", isTrue: false },
    { statement: "Olahraga baik untuk kesehatan.", isTrue: true },
    { statement: "Madu dibuat oleh lebah.", isTrue: true },
    { statement: "Semua ular berbisa.", isTrue: false },
    { statement: "Daun pada umumnya berwarna hijau.", isTrue: true },
    { statement: "Manusia bisa hidup tanpa air.", isTrue: false },
    { statement: "Buku dapat menambah pengetahuan.", isTrue: true },
    { statement: "Semua makanan yang manis pasti tidak sehat.", isTrue: false }
]

export default function YesOrNoGame(props) {
    const [gameState, setGameState] = useState("start")
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [score, setScore] = useState(0)
    const [totalExp, setTotalExp] = useState(0)
    const [showFeedback, setShowFeedback] = useState(null)
    const [progress, setProgress] = useState(0)
    const [timeLeft, setTimeLeft] = useState(15)
    const [isTimerActive, setIsTimerActive] = useState(false)
    const [fadeIn, setFadeIn] = useState(true)
    const [onGameComplete, setOnGameComplete] = useState(null)
    const [startTime, setStartTime] = useState(null)
    const [questionsAttempted, setQuestionsAttempted] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Receive props from GameWrapper
    useEffect(() => {
        if (props.onGameComplete) {
            setOnGameComplete(() => props.onGameComplete);
        }
    }, [props.onGameComplete]);

    // Update progress when current question changes
    useEffect(() => {
        if (gameState === "playing") {
            setProgress((currentQuestion / questions.length) * 100)
            setTimeLeft(15)
            setIsTimerActive(true)
            setFadeIn(true)
        }
    }, [currentQuestion, gameState])

    // Timer effect
    useEffect(() => {
        let timer
        if (isTimerActive && timeLeft > 0 && gameState === "playing" && !showFeedback) {
            timer = setTimeout(() => {
                setTimeLeft(timeLeft - 1)
            }, 1000)
        } else if (timeLeft === 0 && !showFeedback) {
            // Time's up - mark as wrong
            setShowFeedback("timeout")
            setIsTimerActive(false)
            setQuestionsAttempted(prev => prev + 1)

            setTimeout(() => {
                setShowFeedback(null)
                if (currentQuestion < questions.length - 1) {
                    setFadeIn(false)
                    setTimeout(() => {
                        setCurrentQuestion(currentQuestion + 1)
                    }, 300)
                } else {
                    handleGameEnd()
                }
            }, 1000)
        }

        return () => clearTimeout(timer)
    }, [timeLeft, isTimerActive, gameState, showFeedback, currentQuestion])

    const startGame = () => {
        setGameState("playing")
        setCurrentQuestion(0)
        setScore(0)
        setTotalExp(0)
        setShowFeedback(null)
        setProgress(0)
        setTimeLeft(15)
        setIsTimerActive(true)
        setFadeIn(true)
        setStartTime(Date.now())
        setQuestionsAttempted(0)
        setIsSubmitting(false)
    }

    const restartGame = () => {
        setGameState("start")
        setCurrentQuestion(0)
        setScore(0)
        setTotalExp(0)
        setShowFeedback(null)
        setProgress(0)
        setTimeLeft(15)
        setIsTimerActive(false)
        setFadeIn(true)
        setStartTime(null)
        setQuestionsAttempted(0)
        setIsSubmitting(false)
    }

    const handleAnswer = (answer) => {
        if (showFeedback || isSubmitting) return
        
        setIsTimerActive(false)
        setQuestionsAttempted(prev => prev + 1)
        const correct = answer === questions[currentQuestion].isTrue
        
        if (correct) {
            setScore(score + 1)
            const expGained = 10 + (timeLeft > 10 ? 5 : 0) // Bonus for quick answer
            setTotalExp(totalExp + expGained)
            setShowFeedback("correct")
        } else {
            setShowFeedback("incorrect")
        }

        setTimeout(() => {
            setShowFeedback(null)
            if (currentQuestion < questions.length - 1) {
                setFadeIn(false)
                setTimeout(() => {
                    setCurrentQuestion(currentQuestion + 1)
                }, 300)
            } else {
                handleGameEnd()
            }
        }, 1000)
    }

    const sendGameCompletion = async (gameId, questionsAnswered, correctAnswers, score) => {
        if (isSubmitting) return; // Prevent double submission
        
        try {
            setIsSubmitting(true);
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('No token found, progress will not be saved');
                return;
            }

            console.log('Sending game completion:', {
                gameId,
                questionsAnswered,
                correctAnswers,
                score,
                completionTime: Date.now() - startTime
            });

            const response = await axios.post('http://localhost:5000/api/games/complete', {
                gameId,
                questionsAnswered,
                correctAnswers,
                score,
                completionTime: Date.now() - startTime
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.success) {
                console.log('✅ Game completion sent successfully:', response.data);
                showXPNotification(response.data.xpEarned || 0);
                
                // Also show completion celebration
                showCompletionCelebration(correctAnswers, questionsAnswered);
            } else {
                console.error('❌ Game completion failed:', response.data);
            }
        } catch (error) {
            console.error('❌ Error sending game completion:', error);
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    const showXPNotification = (xpEarned) => {
        if (xpEarned <= 0) return;
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #10B981, #059669);
            color: white;
            padding: 15px 25px;
            border-radius: 12px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3);
            animation: slideInRight 0.5s ease-out;
            border: 2px solid #34D399;
        `;
        
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 24px;">⭐</span>
                <div>
                    <div style="font-size: 16px;">XP Earned!</div>
                    <div style="font-size: 18px; font-weight: bold;">+${xpEarned} XP</div>
                </div>
            </div>
        `;

        // Add CSS for animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => {
                    notification.parentNode.removeChild(notification);
                }, 300);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 4000);
    };

    const showCompletionCelebration = (correct, total) => {
        const percentage = Math.round((correct / total) * 100);
        
        const celebration = document.createElement('div');
        celebration.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #3B82F6, #1D4ED8);
            color: white;
            padding: 30px;
            border-radius: 20px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 20px 50px rgba(0,0,0,0.4);
            text-align: center;
            animation: celebrationBounce 0.8s ease-out;
            border: 3px solid #60A5FA;
            min-width: 300px;
        `;
        
        celebration.innerHTML = `
            <div style="font-size: 60px; margin-bottom: 15px;">🎉</div>
            <div style="font-size: 24px; margin-bottom: 10px;">Game Completed!</div>
            <div style="font-size: 18px; margin-bottom: 15px;">Yes or No Challenge</div>
            <div style="font-size: 16px; color: #BFDBFE; margin-bottom: 10px;">
                ${correct}/${total} Correct (${percentage}%)
            </div>
            <div style="font-size: 14px; color: #DBEAFE;">
                Progress saved automatically! 📊
            </div>
        `;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes celebrationBounce {
                0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
                50% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(celebration);
        
        setTimeout(() => {
            if (celebration.parentNode) {
                celebration.style.animation = 'celebrationBounce 0.5s ease-out reverse';
                setTimeout(() => {
                    celebration.parentNode.removeChild(celebration);
                }, 500);
            }
            if (style.parentNode) {
                style.parentNode.removeChild(style);
            }
        }, 3500);
    };

    const handleGameEnd = () => {
        const finalScore = score;
        const questionsAnswered = questionsAttempted;
        const correctAnswers = score;
        const completionPercentage = Math.round((score / questions.length) * 100);
        
        console.log('Game ended with stats:', {
            finalScore,
            questionsAnswered,
            correctAnswers,
            completionPercentage
        });
        
        // Send data to GameWrapper if available
        if (onGameComplete) {
            onGameComplete(true, finalScore, {
                questionsAnswered,
                correctAnswers,
                completionPercentage,
                gameType: 'yesorno'
            });
        }
        
        // Send to our dynamic backend
        sendGameCompletion(2, questionsAnswered, correctAnswers, finalScore);
        
        setGameState("result");
    };

    if (gameState === "start") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
                <div className="max-w-2xl mx-auto pt-20">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-6xl mb-6">🤔</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Yes or No Game</h1>
                        <p className="text-gray-600 mb-6 text-lg">
                            Jawab pertanyaan dengan <span className="font-bold text-green-600">YA</span> atau{" "}
                            <span className="font-bold text-red-600">TIDAK</span>
                        </p>
                        <div className="bg-blue-50 rounded-lg p-6 mb-6">
                            <h3 className="font-bold text-blue-800 mb-2">Cara Bermain:</h3>
                            <ul className="text-blue-700 text-left space-y-1">
                                <li>• Kamu punya 15 detik untuk setiap pertanyaan</li>
                                <li>• Jawab dengan cepat untuk mendapat bonus poin</li>
                                <li>• Total ada {questions.length} pertanyaan</li>
                                <li>• Progress akan tersimpan otomatis</li>
                                <li>• Dapatkan XP untuk setiap jawaban benar</li>
                            </ul>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center">
                                <span className="text-green-600 text-lg mr-2">📊</span>
                                <span className="text-green-800 font-medium">
                                    Progress game akan tersimpan secara real-time!
                                </span>
                            </div>
                        </div>
                        
                        <button
                            onClick={startGame}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-200 transform hover:scale-105"
                        >
                            Mulai Bermain 🎮
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (gameState === "playing") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
                <div className="max-w-2xl mx-auto pt-10">
                    {/* Progress Bar */}
                    <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-600">
                                Pertanyaan {currentQuestion + 1} dari {questions.length}
                            </span>
                            <span className="text-sm font-medium text-gray-600">Skor: {score}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine"></div>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500 text-center mt-1">
                            {Math.round(progress)}% Selesai
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="text-center mb-6">
                        <div
                            className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold transition-all duration-300 ${
                                timeLeft <= 5 ? "bg-red-500 text-white animate-pulse scale-110" : 
                                timeLeft <= 10 ? "bg-yellow-400 text-gray-800" :
                                "bg-green-400 text-white"
                            }`}
                        >
                            {timeLeft}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                            {timeLeft > 10 ? "Cepat = Bonus XP!" : timeLeft > 5 ? "Waktu hampir habis!" : "Segera jawab!"}
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className={`bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 ${
                        fadeIn ? "opacity-100 transform translate-y-0" : "opacity-50 transform translate-y-4"
                    }`}>
                        <div className="text-center">
                            <div className="text-5xl mb-6">
                                {questions[currentQuestion].isTrue ? "💭" : "🤔"}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-8 leading-relaxed">
                                {questions[currentQuestion].statement}
                            </h2>

                            {/* Answer Buttons */}
                            <div className="grid grid-cols-2 gap-6">
                                <button
                                    onClick={() => handleAnswer(true)}
                                    disabled={showFeedback !== null}
                                    className={`py-8 px-6 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 ${
                                        showFeedback === "correct" && questions[currentQuestion].isTrue
                                            ? "bg-green-500 text-white shadow-lg"
                                            : showFeedback === "incorrect" && questions[currentQuestion].isTrue
                                            ? "bg-green-200 text-green-800"
                                            : showFeedback === "incorrect" && !questions[currentQuestion].isTrue
                                            ? "bg-red-500 text-white shadow-lg"
                                            : "bg-green-100 hover:bg-green-200 text-green-800 hover:shadow-md"
                                    }`}
                                >
                                    <div className="text-3xl mb-2">👍</div>
                                    <div>YA</div>
                                </button>
                                <button
                                    onClick={() => handleAnswer(false)}
                                    disabled={showFeedback !== null}
                                    className={`py-8 px-6 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 ${
                                        showFeedback === "correct" && !questions[currentQuestion].isTrue
                                            ? "bg-green-500 text-white shadow-lg"
                                            : showFeedback === "incorrect" && !questions[currentQuestion].isTrue
                                            ? "bg-green-200 text-green-800"
                                            : showFeedback === "incorrect" && questions[currentQuestion].isTrue
                                            ? "bg-red-500 text-white shadow-lg"
                                            : "bg-red-100 hover:bg-red-200 text-red-800 hover:shadow-md"
                                    }`}
                                >
                                    <div className="text-3xl mb-2">👎</div>
                                    <div>TIDAK</div>
                                </button>
                            </div>

                            {/* Feedback */}
                            {showFeedback && (
                                <div className="mt-8 animate-fade-in">
                                    {showFeedback === "correct" && (
                                        <div className="bg-green-100 text-green-800 p-6 rounded-lg border border-green-200">
                                            <div className="text-4xl mb-3">🎉</div>
                                            <p className="font-bold text-lg">Benar!</p>
                                            <p className="text-sm">+{10 + (timeLeft > 10 ? 5 : 0)} XP</p>
                                            {timeLeft > 10 && (
                                                <p className="text-xs text-green-600 mt-1">Bonus untuk jawaban cepat!</p>
                                            )}
                                        </div>
                                    )}
                                    {showFeedback === "incorrect" && (
                                        <div className="bg-red-100 text-red-800 p-6 rounded-lg border border-red-200">
                                            <div className="text-4xl mb-3">😞</div>
                                            <p className="font-bold text-lg">Kurang Tepat!</p>
                                            <p className="text-sm">Jawaban yang benar: {questions[currentQuestion].isTrue ? "YA" : "TIDAK"}</p>
                                        </div>
                                    )}
                                    {showFeedback === "timeout" && (
                                        <div className="bg-orange-100 text-orange-800 p-6 rounded-lg border border-orange-200">
                                            <div className="text-4xl mb-3">⏰</div>
                                            <p className="font-bold text-lg">Waktu Habis!</p>
                                            <p className="text-sm">Jawaban yang benar: {questions[currentQuestion].isTrue ? "YA" : "TIDAK"}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (gameState === "result") {
        const percentage = Math.round((score / questions.length) * 100)
        let message = ""
        let emoji = ""

        if (percentage >= 80) {
            message = "Luar Biasa!"
            emoji = "🏆"
        } else if (percentage >= 60) {
            message = "Bagus!"
            emoji = "👏"
        } else {
            message = "Tetap Semangat!"
            emoji = "💪"
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 p-4">
                <div className="max-w-2xl mx-auto pt-20">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-6xl mb-6">{emoji}</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">{message}</h1>
                        
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-3xl font-bold text-blue-600">{score}</div>
                                    <div className="text-sm text-gray-600">Benar</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-green-600">{percentage}%</div>
                                    <div className="text-sm text-gray-600">Akurasi</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-yellow-600">{totalExp}</div>
                                    <div className="text-sm text-gray-600">XP Sesi</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-center text-blue-800">
                                <span className="text-2xl mr-3">📊</span>
                                <div>
                                    <div className="font-bold">Progress Tersimpan!</div>
                                    <div className="text-sm">XP telah ditambahkan ke akun kamu</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={restartGame}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-105"
                            >
                                Main Lagi 🔄
                            </button>
                            <button
                                onClick={() => window.history.back()}
                                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200"
                            >
                                Kembali ke Menu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}