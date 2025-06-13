"use client"

import { useState, useEffect } from "react"

// Pattern data
const patterns = [
    {
        id: "1",
        type: "shapes",
        sequence: ["🔴", "🔵", "🔴", "🔵", "🔴"],
        options: ["🔵", "🔴", "🟡", "🟢"],
        correctAnswer: "🔵",
        difficulty: 1,
    },
    {
        id: "2",
        type: "numbers",
        sequence: ["2", "4", "6", "8"],
        options: ["9", "10", "11", "12"],
        correctAnswer: "10",
        difficulty: 1,
    },
    {
        id: "3",
        type: "shapes",
        sequence: ["⭐", "⭐", "🔺", "⭐", "⭐"],
        options: ["🔺", "⭐", "🔴", "🔵"],
        correctAnswer: "🔺",
        difficulty: 2,
    },
    {
        id: "4",
        type: "colors",
        sequence: ["🟥", "🟨", "🟩", "🟥", "🟨"],
        options: ["🟩", "🟥", "🟨", "🟦"],
        correctAnswer: "🟩",
        difficulty: 2,
    },
    {
        id: "5",
        type: "numbers",
        sequence: ["1", "3", "5", "7"],
        options: ["8", "9", "10", "11"],
        correctAnswer: "9",
        difficulty: 2,
    },
    {
        id: "6",
        type: "shapes",
        sequence: ["🔴", "🔴", "🔵", "🔴", "🔴", "🔵", "🔴", "🔴"],
        options: ["🔵", "🔴", "🟡", "🟢"],
        correctAnswer: "🔵",
        difficulty: 3,
    },
    {
        id: "7",
        type: "numbers",
        sequence: ["2", "6", "18", "54"],
        options: ["108", "162", "216", "270"],
        correctAnswer: "162",
        difficulty: 3,
    },
    {
        id: "8",
        type: "shapes",
        sequence: ["🔺", "🔴", "🔺", "🔺", "🔴", "🔺", "🔺", "🔺"],
        options: ["🔴", "🔺", "🟡", "🟢"],
        correctAnswer: "🔴",
        difficulty: 3,
    },
]

export default function PatternPuzzleGame() {
    const [gameState, setGameState] = useState("start")
    const [currentPattern, setCurrentPattern] = useState(0)
    const [score, setScore] = useState(0)
    const [totalExp, setTotalExp] = useState(0)
    const [showFeedback, setShowFeedback] = useState(null)
    const [progress, setProgress] = useState(0)
    const [timeLeft, setTimeLeft] = useState(20)
    const [isTimerActive, setIsTimerActive] = useState(false)
    const [fadeIn, setFadeIn] = useState(true)
    const [difficultyLevel, setDifficultyLevel] = useState("all") // "easy", "medium", "hard", "all"
    const [filteredPatterns, setFilteredPatterns] = useState(patterns)

    // Filter patterns based on difficulty
    useEffect(() => {
        if (difficultyLevel === "all") {
            setFilteredPatterns(patterns)
        } else {
            const difficultyMap = { easy: 1, medium: 2, hard: 3 }
            const level = difficultyMap[difficultyLevel]
            setFilteredPatterns(patterns.filter((pattern) => pattern.difficulty === level))
        }
    }, [difficultyLevel])

    // Update progress when current pattern changes
    useEffect(() => {
        if (gameState === "playing") {
            setProgress((currentPattern / filteredPatterns.length) * 100)
            setTimeLeft(20)
            setIsTimerActive(true)
            setFadeIn(true)
        }
    }, [currentPattern, gameState, filteredPatterns.length])

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
                if (currentPattern < filteredPatterns.length - 1) {
                    setFadeIn(false)
                    setTimeout(() => {
                        setCurrentPattern(currentPattern + 1)
                    }, 300)
                } else {
                    setGameState("result")
                }
            }, 1500)
        }

        return () => clearTimeout(timer)
    }, [timeLeft, isTimerActive, gameState, showFeedback, currentPattern, filteredPatterns.length])

    const handleStart = () => {
        setGameState("playing")
        setCurrentPattern(0)
        setScore(0)
        setShowFeedback(null)
        setProgress(0)
        setTimeLeft(20)
        setIsTimerActive(true)
        setFadeIn(true)
    }

    const handleAnswer = (answer) => {
        setIsTimerActive(false)
        const isCorrect = answer === filteredPatterns[currentPattern].correctAnswer
        const expGain = filteredPatterns[currentPattern].difficulty * 10

        if (isCorrect) {
            setScore(score + 1)
            setTotalExp(totalExp + expGain)
            setShowFeedback("correct")
        } else {
            setShowFeedback("wrong")
        }

        setTimeout(() => {
            setShowFeedback(null)
            if (currentPattern < filteredPatterns.length - 1) {
                setFadeIn(false)
                setTimeout(() => {
                    setCurrentPattern(currentPattern + 1)
                }, 300)
            } else {
                setGameState("result")
            }
        }, 1500)
    }

    const handleDifficultyChange = (level) => {
        setDifficultyLevel(level)
    }

    const getDifficultyLabel = (difficulty) => {
        switch (difficulty) {
            case 1:
                return "Mudah"
            case 2:
                return "Sedang"
            case 3:
                return "Sulit"
            default:
                return ""
        }
    }

    const renderStartScreen = () => (
        <div className="flex flex-col items-center justify-center h-full space-y-8 py-10">
            <div className="relative w-full max-w-md opacity-0 animate-fade-in">
                <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl shadow-2xl p-8 text-center">
                    <div className="text-6xl mb-4 animate-float">🧩</div>
                    <h1 className="text-4xl font-extrabold text-white mb-4">Tebak Pola</h1>
                    <p className="text-lg text-indigo-100 mb-8">Temukan pola yang tepat dan lanjutkan urutan!</p>

                    <div className="bg-white/10 rounded-lg p-4 mb-8">
                        <p className="text-white text-sm">
                            • Temukan pola dalam urutan
                            <br />• Pilih item berikutnya yang tepat
                            <br />• Dapatkan EXP berdasarkan tingkat kesulitan
                            <br />• Waktu terbatas untuk setiap soal
                        </p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-white text-lg font-semibold mb-3">Pilih Tingkat Kesulitan:</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                onClick={() => handleDifficultyChange("all")}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${difficultyLevel === "all" ? "bg-white text-blue-400 " : "bg-white/20 text-white hover:bg-white/30"
                                    }`}
                            >
                                Semua
                            </button>
                            <button
                                onClick={() => handleDifficultyChange("easy")}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${difficultyLevel === "easy" ? "bg-white text-blue-400 " : "bg-white/20 text-white hover:bg-white/30"
                                    }`}
                            >
                                Mudah
                            </button>
                            <button
                                onClick={() => handleDifficultyChange("medium")}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${difficultyLevel === "medium" ? "bg-white text-blue-400" : "bg-white/20 text-white hover:bg-white/30"
                                    }`}
                            >
                                Sedang
                            </button>
                            <button
                                onClick={() => handleDifficultyChange("hard")}
                                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${difficultyLevel === "hard" ? "bg-white text-blue-400 " : "bg-white/20 text-white hover:bg-white/30"
                                    }`}
                            >
                                Sulit
                            </button>
                        </div>
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

    const renderPlayingScreen = () => {
        const pattern = filteredPatterns[currentPattern]

        return (
            <div
                className={`flex flex-col items-center justify-center h-full space-y-6 py-8 transition-opacity duration-300 ${fadeIn ? "opacity-100" : "opacity-0"
                    }`}
            >
                <div className="w-full max-w-2xl">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                        <span className="bg-indigo-100 text-blue-600  px-3 py-1 rounded-full text-sm font-medium">
                            Pola {currentPattern + 1}/{filteredPatterns.length}
                        </span>
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                            Skor: {score}
                        </span>
                        <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${timeLeft > 10
                                    ? "bg-green-100 text-green-800"
                                    : timeLeft > 5
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-red-100 text-red-800 animate-pulse"
                                }`}
                        >
                            ⏱️ {timeLeft}s
                        </span>
                        <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                            {getDifficultyLabel(pattern.difficulty)}
                        </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                        <div
                            className="bg-gradient-to-r from-blue-600 to-blue-400  h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="w-full p-8 bg-white shadow-xl rounded-2xl border-t-4 border-blue-600">
                        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Apa yang selanjutnya dalam pola ini?</h2>

                        {/* Pattern Display */}
                        <div className="flex justify-center items-center mb-8 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl overflow-x-auto">
                            <div className="flex items-center space-x-3">
                                {pattern.sequence.map((item, index) => (
                                    <div
                                        key={index}
                                        className="text-4xl p-4 bg-white rounded-lg shadow-md border-2 border-indigo-100 transition-transform hover:scale-105"
                                    >
                                        {item}
                                    </div>
                                ))}
                                <div className="text-4xl p-4 bg-yellow-50 rounded-lg shadow-md border-2 border-dashed border-yellow-400 animate-pulse">
                                    ?
                                </div>
                            </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
                            {pattern.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(option)}
                                    className={`text-3xl p-6 h-auto bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 
                                    text-gray-800 border-2 border-indigo-200 rounded-xl shadow-md transition-all duration-200 
                                    hover:shadow-lg hover:scale-105 active:scale-95 ${showFeedback ? "pointer-events-none" : ""}`}
                                    disabled={showFeedback !== null}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {showFeedback && (
                    <div
                        className={`text-center p-6 rounded-xl shadow-lg animate-slide-up ${showFeedback === "correct"
                                ? "bg-green-100 text-green-800 border-l-4 border-green-500"
                                : showFeedback === "timeout"
                                    ? "bg-yellow-100 text-yellow-800 border-l-4 border-yellow-500"
                                    : "bg-red-100 text-red-800 border-l-4 border-red-500"
                            }`}
                    >
                        {showFeedback === "correct" && (
                            <div className="flex items-center justify-center space-x-2">
                                <span className="text-3xl">✅</span>
                                <p className="text-xl font-bold">Benar! +{pattern.difficulty * 10} EXP</p>
                            </div>
                        )}
                        {showFeedback === "wrong" && (
                            <div className="flex items-center justify-center space-x-2">
                                <span className="text-3xl">❌</span>
                                <p className="text-xl font-bold">Salah! Jawaban yang benar: {pattern.correctAnswer}</p>
                            </div>
                        )}
                        {showFeedback === "timeout" && (
                            <div className="flex items-center justify-center space-x-2">
                                <span className="text-3xl">⏰</span>
                                <p className="text-xl font-bold">Waktu Habis! Jawaban yang benar: {pattern.correctAnswer}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )
    }

    const renderResultScreen = () => {
        const percentage = Math.round((score / filteredPatterns.length) * 100)
        let message, emoji

        if (percentage === 100) {
            message = "Sempurna! Kamu jenius!"
            emoji = "🏆"
        } else if (percentage >= 80) {
            message = "Hebat! Kemampuan analisis pola kamu luar biasa!"
            emoji = "🎉"
        } else if (percentage >= 60) {
            message = "Bagus! Kamu cukup pandai menganalisis pola!"
            emoji = "👍"
        } else if (percentage >= 40) {
            message = "Lumayan! Terus latih kemampuan analisis kamu!"
            emoji = "📚"
        } else {
            message = "Jangan menyerah! Coba lagi untuk meningkatkan kemampuan analisis pola!"
            emoji = "💪"
        }

        return (
            <div className="flex flex-col items-center justify-center h-full space-y-8 py-10 animate-fade-in">
                <div className="w-full max-w-md p-8 bg-gradient-to-br from-blue-600 to-blue-400  shadow-2xl rounded-2xl text-center text-white">
                    <div className="text-6xl mb-4 animate-bounce-once">{emoji}</div>
                    <h2 className="text-3xl font-bold mb-4">Permainan Selesai!</h2>
                    <p className="text-lg mb-6">{message}</p>

                    <div className="bg-white/10 rounded-xl p-6 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span>Skor:</span>
                            <span className="text-2xl font-bold">
                                {score}/{filteredPatterns.length}
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
                            Total EXP: <span className="font-bold">+{totalExp}</span>
                        </p>
                    </div>

                    <div className="flex flex-col space-y-4">
                        <button
                            onClick={handleStart}
                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-10 rounded-full text-xl shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                        >
                            Main Lagi
                        </button>

                        <button
                            onClick={() => setGameState("start")}
                            className="bg-white/20 hover:bg-white/30 text-white font-medium py-2 px-6 rounded-full transition-colors duration-200"
                        >
                            Ubah Tingkat Kesulitan
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[600px] w-full max-w-4xl mx-auto p-4 bg-gradient-to-b from-indigo-50 to-white rounded-3xl shadow-lg">
            {gameState === "start" && renderStartScreen()}
            {gameState === "playing" && renderPlayingScreen()}
            {gameState === "result" && renderResultScreen()}
        </div>
    )
}
