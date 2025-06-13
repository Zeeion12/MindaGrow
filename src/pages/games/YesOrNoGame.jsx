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

export default function YesOrNoGame() {
    const [gameState, setGameState] = useState("start")
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [score, setScore] = useState(0)
    const [totalExp, setTotalExp] = useState(0)
    const [showFeedback, setShowFeedback] = useState(null)
    const [progress, setProgress] = useState(0)
    const [timeLeft, setTimeLeft] = useState(15)
    const [isTimerActive, setIsTimerActive] = useState(false)
    const [fadeIn, setFadeIn] = useState(true)

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
                    setGameState("result")
                }
            }, 1000)
        }

        return () => clearTimeout(timer)
    }, [timeLeft, isTimerActive, gameState, showFeedback, currentQuestion])

    const handleStart = () => {
        setGameState("playing")
        setCurrentQuestion(0)
        setScore(0)
        setShowFeedback(null)
        setProgress(0)
        setTimeLeft(15)
        setIsTimerActive(true)
        setFadeIn(true)
    }

    const handleAnswer = (answer) => {
        setIsTimerActive(false)
        const isCorrect = answer === questions[currentQuestion].isTrue

        if (isCorrect) {
            setScore(score + 1)
            setTotalExp(totalExp + 10)
            setShowFeedback("correct")
        } else {
            setShowFeedback("wrong")
        }

        // Show feedback for 1 second before moving to next question
        setTimeout(() => {
            setShowFeedback(null)
            if (currentQuestion < questions.length - 1) {
                setFadeIn(false)
                setTimeout(() => {
                setCurrentQuestion(currentQuestion + 1)
                }, 300)
            } else {
                setGameState("result")
            }
        }, 1000)
    }

    const renderStartScreen = () => (
        <div className="flex flex-col items-center justify-center h-full space-y-8 py-10">
            <div className="relative w-full max-w-md opacity-0 animate-fade-in">
                <div className="bg-gradient-to-br from-blue-600 to-blue-400  rounded-2xl shadow-2xl p-8 text-center">
                    <h1 className="text-4xl font-extrabold text-white mb-4">Yes or No Game</h1>
                    <p className="text-lg text-purple-100 mb-6">Uji pengetahuanmu dengan menjawab benar atau salah!</p>

                    <div className="flex justify-center space-x-6 my-8">
                        <div className="bg-white p-6 rounded-md shadow-lg transform -rotate-6 transition-transform duration-300 hover:rotate-[-12deg] hover:scale-110">
                            <span className="text-4xl font-bold text-green-500">YES</span>
                        </div>
                        <div className="bg-white p-6 rounded-md shadow-lg transform rotate-6 transition-transform duration-300 hover:rotate-[12deg] hover:scale-110">
                            <span className="text-4xl font-bold text-red-500">NO</span>
                        </div>
                    </div>

                    <div className="bg-white/10 rounded-lg p-4 mb-8">
                        <p className="text-white text-sm">
                            • 10 pertanyaan benar atau salah
                            <br />• Dapatkan 10 EXP untuk setiap jawaban benar
                            <br />• Waktu terbatas untuk setiap pertanyaan
                        </p>
                    </div>

                    <button
                        onClick={handleStart}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-10 rounded-full text-xl shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                    >
                        Mulai Bermain
                    </button>
                </div>
            </div>

            <div className="text-center text-gray-600">
                <p>Total EXP Kamu: {totalExp}</p>
            </div>
        </div>
    )

    const renderPlayingScreen = () => (
        <div
            className={`flex flex-col items-center justify-center h-full space-y-6 py-8 transition-opacity duration-300 ${fadeIn ? "opacity-100" : "opacity-0"}`}
        >
            <div className="w-full max-w-md">
                <div className="flex justify-between mb-2 text-sm font-medium">
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full">
                        Pertanyaan {currentQuestion + 1}/{questions.length}
                    </span>
                    <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full">Skor: {score}</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-blue-600 to-blue-400  h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>

                <div className="flex justify-center mt-2">
                    <div
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                        timeLeft > 5
                            ? "bg-green-100 text-green-800"
                            : timeLeft > 2
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800 animate-pulse"
                        }`}
                    >
                        Waktu: {timeLeft} detik
                    </div>
                </div>
            </div>

            <div
                key={currentQuestion}
                className="w-full max-w-md p-8 bg-white shadow-xl rounded-2xl border-t-4 border-blue-600 transition-all duration-300"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">🤔</span>
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-8 text-gray-800">{questions[currentQuestion].statement}</h2>

                <div className="flex justify-center space-x-6">
                    <button
                        onClick={() => handleAnswer(true)}
                        className={`bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-md transition-transform duration-200 hover:scale-105 active:scale-95 ${
                        showFeedback ? "pointer-events-none opacity-50" : ""
                        }`}
                        disabled={showFeedback !== null}
                    >
                        YA
                    </button>
                    <button
                        onClick={() => handleAnswer(false)}
                        className={`bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-md transition-transform duration-200 hover:scale-105 active:scale-95 ${
                        showFeedback ? "pointer-events-none opacity-50" : ""
                        }`}
                        disabled={showFeedback !== null}
                    >
                        TIDAK
                    </button>
                </div>
            </div>

            {showFeedback && (
                <div
                    className={`text-center p-6 rounded-xl shadow-lg animate-slide-up ${
                        showFeedback === "correct"
                        ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                        : showFeedback === "timeout"
                            ? "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500"
                            : "bg-red-100 text-red-800 border-l-4 border-red-500"
                    }`}
                >
                {showFeedback === "correct" && (
                    <div className="flex items-center justify-center space-x-2">
                        <span className="text-3xl">✅</span>
                        <p className="text-xl font-bold">Benar! +10 EXP</p>
                    </div>
                )}
                {showFeedback === "wrong" && (
                    <div className="flex items-center justify-center space-x-2">
                        <span className="text-3xl">❌</span>
                        <p className="text-xl font-bold">Salah!</p>
                    </div>
                )}
                {showFeedback === "timeout" && (
                    <div className="flex items-center justify-center space-x-2">
                        <span className="text-3xl">⏰</span>
                        <p className="text-xl font-bold">Waktu Habis!</p>
                    </div>
                )}
                </div>
            )}
        </div>
    )

    const renderResultScreen = () => {
        const percentage = Math.round((score / questions.length) * 100)
        let message, emoji

        if (percentage === 100) {
            message = "Sempurna! Kamu jenius!"
            emoji = "🏆"
        } else if (percentage >= 80) {
            message = "Hebat! Pengetahuanmu luar biasa!"
            emoji = "🎉"
        } else if (percentage >= 60) {
            message = "Bagus! Kamu cukup berpengetahuan!"
            emoji = "👍"
        } else if (percentage >= 40) {
            message = "Lumayan! Terus belajar ya!"
            emoji = "📚"
        } else {
            message = "Jangan menyerah! Coba lagi!"
            emoji = "💪"
        }

        return (
            <div className="flex flex-col items-center justify-center h-full space-y-8 py-10 animate-fade-in">
                <div className="w-full max-w-md p-8 bg-gradient-to-br from-blue-600 to-blue-400 shadow-2xl rounded-2xl text-center text-white">
                    <div className="text-6xl mb-4 animate-bounce-once">{emoji}</div>
                    <h2 className="text-3xl font-bold mb-4">Permainan Selesai!</h2>
                    <p className="text-lg mb-6">{message}</p>

                    <div className="bg-white/10 rounded-xl p-6 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span>Skor:</span>
                            <span className="text-2xl font-bold">
                                {score}/{questions.length}
                            </span>
                        </div>

                        <div className="w-full bg-white/20 rounded-full h-4 mb-4">
                            <div
                                className="bg-yellow-400 h-4 rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>

                        <div className="text-center">
                            <span className="text-xl">{percentage}%</span>
                        </div>
                    </div>

                    <div className="bg-green-400/20 rounded-lg p-4 mb-6">
                        <p className="text-xl">
                            Total EXP: <span className="font-bold">+{score * 10}</span>
                        </p>
                    </div>

                    <button
                        onClick={handleStart}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-10 rounded-full text-xl shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                    >
                        Main Lagi
                    </button>
                </div>

                <div className="flex space-x-4">
                    <button className="text-blue-400 hover:text-blue-600 font-medium transition-colors duration-200">
                        Bagikan Skor
                    </button>
                    <button className="text-blue-400 hover:text-blue-600 font-medium transition-colors duration-200">
                        Lihat Peringkat
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[600px] w-full max-w-2xl mx-auto p-4 bg-gradient-to-b from-purple-50 to-white rounded-3xl shadow-lg">
            {gameState === "start" && renderStartScreen()}
            {gameState === "playing" && renderPlayingScreen()}
            {gameState === "result" && renderResultScreen()}
        </div>
    )
}
