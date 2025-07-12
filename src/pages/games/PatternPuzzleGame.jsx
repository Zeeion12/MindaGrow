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

export default function PatternPuzzleGame(props) {
    const [gameState, setGameState] = useState("start")
    const [currentPattern, setCurrentPattern] = useState(0)
    const [score, setScore] = useState(0)
    const [totalExp, setTotalExp] = useState(0)
    const [lives, setLives] = useState(3)
    const [showFeedback, setShowFeedback] = useState(null)
    const [progress, setProgress] = useState(0)
    const [selectedAnswer, setSelectedAnswer] = useState(null)
    const [answeredCorrectly, setAnsweredCorrectly] = useState([])
    const [onGameComplete, setOnGameComplete] = useState(null)

    // Receive props from GameWrapper
    useEffect(() => {
        if (props.onGameComplete) {
            setOnGameComplete(() => props.onGameComplete);
        }
    }, [props.onGameComplete]);

    // Update progress when current pattern changes
    useEffect(() => {
        if (gameState === "playing") {
            setProgress((currentPattern / patterns.length) * 100)
        }
    }, [currentPattern, gameState])

    const startGame = () => {
        setGameState("playing")
        setCurrentPattern(0)
        setScore(0)
        setTotalExp(0)
        setLives(3)
        setShowFeedback(null)
        setProgress(0)
        setSelectedAnswer(null)
        setAnsweredCorrectly([])
    }

    const restartGame = () => {
        setGameState("start")
        setCurrentPattern(0)
        setScore(0)
        setTotalExp(0)
        setLives(3)
        setShowFeedback(null)
        setProgress(0)
        setSelectedAnswer(null)
        setAnsweredCorrectly([])
    }

    const handleAnswer = (answer) => {
        if (showFeedback) return
        
        setSelectedAnswer(answer)
        const pattern = patterns[currentPattern]
        const isCorrect = answer === pattern.correctAnswer
        
        if (isCorrect) {
            setScore(score + 1)
            const expGained = pattern.difficulty * 15 // More XP for harder patterns
            setTotalExp(totalExp + expGained)
            setShowFeedback("correct")
            setAnsweredCorrectly([...answeredCorrectly, currentPattern])
        } else {
            setLives(lives - 1)
            setShowFeedback("incorrect")
        }

        setTimeout(() => {
            setShowFeedback(null)
            setSelectedAnswer(null)
            
            if (isCorrect) {
                if (currentPattern < patterns.length - 1) {
                    setCurrentPattern(currentPattern + 1)
                } else {
                    handleGameEnd()
                }
            } else if (lives <= 1) {
                handleGameEnd()
            }
        }, 1500)
    }

    const handleGameEnd = () => {
        const finalScore = score;
        const completionPercentage = Math.round((currentPattern / patterns.length) * 100);
        const correctAnswers = score;
        const totalPatterns = patterns.length;
        
        if (onGameComplete) {
            onGameComplete(true, finalScore, {
                correctAnswers,
                totalPatterns,
                completionPercentage,
                gameType: 'pattern',
                difficulty: currentPattern < patterns.length ? patterns[currentPattern].difficulty : 3
            });
        }
        
        setGameState("result");
    };

    const getDifficultyColor = (difficulty) => {
        switch (difficulty) {
            case 1: return "bg-green-100 text-green-800"
            case 2: return "bg-yellow-100 text-yellow-800"
            case 3: return "bg-red-100 text-red-800"
            default: return "bg-gray-100 text-gray-800"
        }
    }

    const getDifficultyText = (difficulty) => {
        switch (difficulty) {
            case 1: return "Mudah"
            case 2: return "Sedang"
            case 3: return "Sulit"
            default: return "Unknown"
        }
    }

    if (gameState === "start") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                <div className="max-w-2xl mx-auto pt-20">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-6xl mb-6">🧩</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Pattern Puzzle</h1>
                        <p className="text-gray-600 mb-6 text-lg">
                            Temukan pola selanjutnya dalam urutan yang diberikan!
                        </p>
                        
                        <div className="bg-purple-50 rounded-lg p-6 mb-6">
                            <h3 className="font-bold text-purple-800 mb-3">Cara Bermain:</h3>
                            <ul className="text-purple-700 text-left space-y-2">
                                <li>• Perhatikan urutan pola yang ditampilkan</li>
                                <li>• Pilih jawaban yang melengkapi pola tersebut</li>
                                <li>• Kamu punya 3 kesempatan (nyawa)</li>
                                <li>• Pola akan semakin sulit seiring berjalannya permainan</li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                            <div className="bg-green-100 text-green-800 p-3 rounded-lg">
                                <div className="font-bold">Mudah</div>
                                <div>+15 XP</div>
                            </div>
                            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg">
                                <div className="font-bold">Sedang</div>
                                <div>+30 XP</div>
                            </div>
                            <div className="bg-red-100 text-red-800 p-3 rounded-lg">
                                <div className="font-bold">Sulit</div>
                                <div>+45 XP</div>
                            </div>
                        </div>

                        <button
                            onClick={startGame}
                            className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-200 transform hover:scale-105"
                        >
                            Mulai Bermain 🎮
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (gameState === "playing") {
        const pattern = patterns[currentPattern]

        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                <div className="max-w-3xl mx-auto pt-10">
                    {/* Header Info */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-4">
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${getDifficultyColor(pattern.difficulty)}`}>
                                {getDifficultyText(pattern.difficulty)}
                            </div>
                            <div className="text-sm font-medium text-gray-600">
                                Pola {currentPattern + 1} dari {patterns.length}
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                                {[...Array(3)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-6 h-6 rounded-full ${
                                            i < lives ? "bg-red-500" : "bg-gray-300"
                                        }`}
                                    >
                                        {i < lives && <span className="text-white text-sm flex items-center justify-center h-full">❤️</span>}
                                    </div>
                                ))}
                            </div>
                            <div className="text-sm font-medium text-gray-600">Skor: {score}</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-purple-500 h-3 rounded-full transition-all duration-500"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Pattern Display */}
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">
                            Temukan pola selanjutnya:
                        </h2>
                        
                        <div className="flex items-center justify-center space-x-3 mb-8">
                            {pattern.sequence.map((item, index) => (
                                <div
                                    key={index}
                                    className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center text-2xl font-bold border-2 border-gray-200"
                                >
                                    {item}
                                </div>
                            ))}
                            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center text-3xl border-2 border-purple-300 border-dashed">
                                ?
                            </div>
                        </div>

                        {/* Options */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {pattern.options.map((option, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswer(option)}
                                    disabled={showFeedback !== null}
                                    className={`w-16 h-16 mx-auto rounded-lg text-2xl font-bold transition-all duration-200 transform hover:scale-110 border-2 ${
                                        selectedAnswer === option
                                            ? showFeedback === "correct"
                                                ? "bg-green-500 text-white border-green-600"
                                                : "bg-red-500 text-white border-red-600"
                                            : option === pattern.correctAnswer && showFeedback === "incorrect"
                                            ? "bg-green-200 border-green-400"
                                            : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>

                        {/* Feedback */}
                        {showFeedback && (
                            <div className="mt-6 text-center animate-fade-in">
                                {showFeedback === "correct" && (
                                    <div className="bg-green-100 text-green-800 p-4 rounded-lg">
                                        <div className="text-3xl mb-2">🎉</div>
                                        <p className="font-bold text-lg">Benar!</p>
                                        <p className="text-sm">+{pattern.difficulty * 15} XP</p>
                                    </div>
                                )}
                                {showFeedback === "incorrect" && (
                                    <div className="bg-red-100 text-red-800 p-4 rounded-lg">
                                        <div className="text-3xl mb-2">😞</div>
                                        <p className="font-bold text-lg">Salah!</p>
                                        <p className="text-sm">Jawaban yang benar: {pattern.correctAnswer}</p>
                                        <p className="text-sm">Nyawa tersisa: {lives - 1}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    if (gameState === "result") {
        const percentage = Math.round((score / patterns.length) * 100)
        let message = ""
        let emoji = ""

        if (percentage >= 80) {
            message = "Master Pola!"
            emoji = "🏆"
        } else if (percentage >= 60) {
            message = "Detektif Pola!"
            emoji = "🕵️"
        } else if (percentage >= 40) {
            message = "Pemula Pola!"
            emoji = "👍"
        } else {
            message = "Tetap Berlatih!"
            emoji = "💪"
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
                <div className="max-w-2xl mx-auto pt-20">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-6xl mb-6">{emoji}</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">{message}</h1>
                        
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-purple-600">{score}</div>
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

                        {/* Pattern Summary */}
                        <div className="bg-purple-50 rounded-lg p-4 mb-6">
                            <h3 className="font-bold text-purple-800 mb-3">Ringkasan Pola:</h3>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                <div className="text-green-600">
                                    <div className="font-bold">{answeredCorrectly.filter(i => patterns[i].difficulty === 1).length}</div>
                                    <div>Mudah</div>
                                </div>
                                <div className="text-yellow-600">
                                    <div className="font-bold">{answeredCorrectly.filter(i => patterns[i].difficulty === 2).length}</div>
                                    <div>Sedang</div>
                                </div>
                                <div className="text-red-600">
                                    <div className="font-bold">{answeredCorrectly.filter(i => patterns[i].difficulty === 3).length}</div>
                                    <div>Sulit</div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={restartGame}
                                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200"
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