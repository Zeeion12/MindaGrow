"use client"

import { useState, useEffect } from "react"

// Data Buat gamenya
const questions = [
    {
        statement: "Matahari terbit dari timur.",
        isTrue: true,
    },
    {
        statement: "Kucing memiliki 3 kaki.",
        isTrue: false,
    },
    {
        statement: "Air mendidih pada suhu 100 derajat Celsius.",
        isTrue: true,
    },
    {
        statement: "Bumi berbentuk datar.",
        isTrue: false,
    },
    {
        statement: "Manusia bernapas dengan paru-paru.",
        isTrue: true,
    },
    {
        statement: "Jeruk berwarna biru.",
        isTrue: false,
    },
    {
        statement: "Ayam bertelur.",
        isTrue: true,
    },
    {
        statement: "Ikan bisa hidup di darat.",
        isTrue: false,
    },
    {
        statement: "2 + 2 = 4",
        isTrue: true,
    },
    {
        statement: "Bulan lebih besar dari matahari.",
        isTrue: false,
    },
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
    }

    const handleAnswer = (answer) => {
        if (showFeedback) return
        
        setIsTimerActive(false)
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

    const handleGameEnd = () => {
        const finalScore = score;
        const completionPercentage = Math.round((score / questions.length) * 100);
        const correctAnswers = score;
        const totalQuestions = questions.length;
        
        // Send data to database
        if (onGameComplete) {
            onGameComplete(true, finalScore, {
                correctAnswers,
                totalQuestions,
                completionPercentage,
                gameType: 'yesorno'
            });
        }
        
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
                            </ul>
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
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Timer */}
                    <div className="text-center mb-6">
                        <div
                            className={`inline-flex items-center justify-center w-16 h-16 rounded-full text-2xl font-bold ${
                                timeLeft <= 5 ? "bg-red-500 text-white animate-pulse" : "bg-yellow-400 text-gray-800"
                            }`}
                        >
                            {timeLeft}
                        </div>
                    </div>

                    {/* Question Card */}
                    <div className={`bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 ${fadeIn ? "opacity-100 transform translate-y-0" : "opacity-50 transform translate-y-4"}`}>
                        <div className="text-center">
                            <div className="text-4xl mb-6">
                                {questions[currentQuestion].isTrue ? "💯" : "❌"}
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-8">
                                {questions[currentQuestion].statement}
                            </h2>

                            {/* Answer Buttons */}
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => handleAnswer(true)}
                                    disabled={showFeedback !== null}
                                    className={`py-6 px-8 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 ${
                                        showFeedback === "correct" && questions[currentQuestion].isTrue
                                            ? "bg-green-500 text-white"
                                            : showFeedback === "incorrect" && questions[currentQuestion].isTrue
                                            ? "bg-green-200 text-green-800"
                                            : showFeedback === "incorrect" && !questions[currentQuestion].isTrue
                                            ? "bg-red-500 text-white"
                                            : "bg-green-100 hover:bg-green-200 text-green-800"
                                    }`}
                                >
                                    👍 YA
                                </button>
                                <button
                                    onClick={() => handleAnswer(false)}
                                    disabled={showFeedback !== null}
                                    className={`py-6 px-8 rounded-xl font-bold text-xl transition-all duration-200 transform hover:scale-105 ${
                                        showFeedback === "correct" && !questions[currentQuestion].isTrue
                                            ? "bg-green-500 text-white"
                                            : showFeedback === "incorrect" && !questions[currentQuestion].isTrue
                                            ? "bg-green-200 text-green-800"
                                            : showFeedback === "incorrect" && questions[currentQuestion].isTrue
                                            ? "bg-red-500 text-white"
                                            : "bg-red-100 hover:bg-red-200 text-red-800"
                                    }`}
                                >
                                    👎 TIDAK
                                </button>
                            </div>

                            {/* Feedback */}
                            {showFeedback && (
                                <div className="mt-6 animate-fade-in">
                                    {showFeedback === "correct" && (
                                        <div className="bg-green-100 text-green-800 p-4 rounded-lg">
                                            <div className="text-2xl mb-2">🎉</div>
                                            <p className="font-bold">Benar!</p>
                                            <p className="text-sm">+{10 + (timeLeft > 10 ? 5 : 0)} XP</p>
                                        </div>
                                    )}
                                    {showFeedback === "incorrect" && (
                                        <div className="bg-red-100 text-red-800 p-4 rounded-lg">
                                            <div className="text-2xl mb-2">😞</div>
                                            <p className="font-bold">Salah!</p>
                                        </div>
                                    )}
                                    {showFeedback === "timeout" && (
                                        <div className="bg-orange-100 text-orange-800 p-4 rounded-lg">
                                            <div className="text-2xl mb-2">⏰</div>
                                            <p className="font-bold">Waktu Habis!</p>
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
                                    <div className="text-2xl font-bold text-blue-600">{score}</div>
                                    <div className="text-sm text-gray-600">Benar</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{percentage}%</div>
                                    <div className="text-sm text-gray-600">Akurasi</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-yellow-600">{totalExp}</div>
                                    <div className="text-sm text-gray-600">XP</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={restartGame}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200"
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