"use client"

import { useState, useEffect, useCallback } from "react"

// Maze data
const mazes = [
    {
        id: 1,
        difficulty: "Mudah",
        maze: [
            [0, 0, 0, 1, 0],
            [1, 1, 0, 1, 0],
            [0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0]
        ],
        start: { x: 0, y: 0 },
        end: { x: 4, y: 4 }
    },
    {
        id: 2,
        difficulty: "Sedang",
        maze: [
            [0, 1, 0, 0, 0, 0, 1],
            [0, 1, 0, 1, 1, 0, 0],
            [0, 0, 0, 1, 0, 1, 0],
            [1, 1, 0, 0, 0, 1, 0],
            [0, 0, 0, 1, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0]
        ],
        start: { x: 0, y: 0 },
        end: { x: 6, y: 6 }
    },
    {
        id: 3,
        difficulty: "Sulit",
        maze: [
            [0, 0, 1, 0, 0, 0, 1, 0, 0],
            [1, 0, 1, 0, 1, 0, 1, 0, 1],
            [0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0],
            [1, 1, 0, 1, 1, 1, 0, 1, 1],
            [0, 0, 0, 0, 1, 0, 0, 0, 0],
            [0, 1, 1, 0, 1, 0, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0]
        ],
        start: { x: 0, y: 0 },
        end: { x: 8, y: 8 }
    }
]

export default function MazeChallengeGame(props) {
    const [gameState, setGameState] = useState("start")
    const [currentMazeIndex, setCurrentMazeIndex] = useState(0)
    const [playerPos, setPlayerPos] = useState({ x: 0, y: 0 })
    const [path, setPath] = useState([])
    const [showSuccess, setShowSuccess] = useState(false)
    const [showHint, setShowHint] = useState(false)
    const [hintsUsed, setHintsUsed] = useState(0)
    const [moves, setMoves] = useState(0)
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [isGameActive, setIsGameActive] = useState(false)
    const [completedMazes, setCompletedMazes] = useState([])
    const [totalScore, setTotalScore] = useState(0)
    const [onGameComplete, setOnGameComplete] = useState(null)

    const maze = mazes[currentMazeIndex]
    const cellSize = maze.maze.length <= 5 ? 60 : maze.maze.length <= 7 ? 45 : 35

    // Receive props from GameWrapper
    useEffect(() => {
        if (props.onGameComplete) {
            setOnGameComplete(() => props.onGameComplete);
        }
    }, [props.onGameComplete]);

    // Timer effect
    useEffect(() => {
        let interval
        if (isGameActive) {
            interval = setInterval(() => {
                setTimeElapsed(prev => prev + 1)
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [isGameActive])

    const startGame = () => {
        setGameState("playing")
        setCurrentMazeIndex(0)
        setPlayerPos(mazes[0].start)
        setPath([mazes[0].start])
        setShowSuccess(false)
        setShowHint(false)
        setHintsUsed(0)
        setMoves(0)
        setTimeElapsed(0)
        setIsGameActive(true)
        setCompletedMazes([])
        setTotalScore(0)
    }

    const restartCurrentMaze = () => {
        setPlayerPos(maze.start)
        setPath([maze.start])
        setShowSuccess(false)
        setShowHint(false)
        setMoves(0)
    }

    const restartGame = () => {
        setGameState("start")
        setCurrentMazeIndex(0)
        setPlayerPos({ x: 0, y: 0 })
        setPath([])
        setShowSuccess(false)
        setShowHint(false)
        setHintsUsed(0)
        setMoves(0)
        setTimeElapsed(0)
        setIsGameActive(false)
        setCompletedMazes([])
        setTotalScore(0)
    }

    const movePlayer = useCallback((direction) => {
        if (!isGameActive || showSuccess) return

        const newPos = { ...playerPos }
        
        switch (direction) {
            case "up":
                newPos.y = Math.max(0, playerPos.y - 1)
                break
            case "down":
                newPos.y = Math.min(maze.maze.length - 1, playerPos.y + 1)
                break
            case "left":
                newPos.x = Math.max(0, playerPos.x - 1)
                break
            case "right":
                newPos.x = Math.min(maze.maze[0].length - 1, playerPos.x + 1)
                break
        }

        // Check if new position is valid (not a wall)
        if (maze.maze[newPos.y][newPos.x] === 0) {
            setPlayerPos(newPos)
            setPath(prev => [...prev, newPos])
            setMoves(prev => prev + 1)
            setShowHint(false)

            // Check if reached the end
            if (newPos.x === maze.end.x && newPos.y === maze.end.y) {
                handleMazeComplete()
            }
        }
    }, [playerPos, maze, isGameActive, showSuccess])

    const handleMazeComplete = () => {
        setShowSuccess(true)
        setIsGameActive(false)
        
        // Calculate score based on efficiency
        const optimalMoves = Math.abs(maze.end.x - maze.start.x) + Math.abs(maze.end.y - maze.start.y)
        const efficiency = Math.max(0, (optimalMoves / moves) * 100)
        const timeBonus = Math.max(0, 100 - timeElapsed)
        const hintPenalty = hintsUsed * 10
        const mazeScore = Math.round(efficiency + timeBonus - hintPenalty)
        
        setTotalScore(prev => prev + mazeScore)
        setCompletedMazes(prev => [...prev, {
            mazeId: maze.id,
            difficulty: maze.difficulty,
            moves,
            timeElapsed,
            hintsUsed,
            score: mazeScore
        }])

        setTimeout(() => {
            if (currentMazeIndex < mazes.length - 1) {
                // Next maze
                setCurrentMazeIndex(prev => prev + 1)
                const nextMaze = mazes[currentMazeIndex + 1]
                setPlayerPos(nextMaze.start)
                setPath([nextMaze.start])
                setShowSuccess(false)
                setMoves(0)
                setIsGameActive(true)
            } else {
                // All mazes completed
                handleGameEnd()
            }
        }, 2000)
    }

    const handleGameEnd = () => {
        const finalScore = totalScore;
        const completionPercentage = Math.round((completedMazes.length / mazes.length) * 100);
        const allCompleted = completedMazes.length === mazes.length;
        
        if (onGameComplete) {
            onGameComplete(allCompleted, finalScore, {
                completed: allCompleted,
                completionPercentage,
                gameType: 'maze',
                hintsUsed: hintsUsed,
                totalMoves: completedMazes.reduce((sum, maze) => sum + maze.moves, 0),
                totalTime: timeElapsed,
                mazesCompleted: completedMazes.length
            });
        }
        
        setGameState("result");
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (gameState !== "playing") return
            
            switch (e.key) {
                case "ArrowUp":
                case "w":
                case "W":
                    e.preventDefault()
                    movePlayer("up")
                    break
                case "ArrowDown":
                case "s":
                case "S":
                    e.preventDefault()
                    movePlayer("down")
                    break
                case "ArrowLeft":
                case "a":
                case "A":
                    e.preventDefault()
                    movePlayer("left")
                    break
                case "ArrowRight":
                case "d":
                case "D":
                    e.preventDefault()
                    movePlayer("right")
                    break
            }
        }

        window.addEventListener("keydown", handleKeyPress)
        return () => window.removeEventListener("keydown", handleKeyPress)
    }, [gameState, movePlayer])

    const showPathHint = () => {
        if (!showHint) {
            setShowHint(true)
            setHintsUsed(prev => prev + 1)
            setTimeout(() => setShowHint(false), 3000)
        }
    }

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    if (gameState === "start") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
                <div className="max-w-2xl mx-auto pt-20">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-6xl mb-6">🏃‍♂️</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">Maze Challenge</h1>
                        <p className="text-gray-600 mb-6 text-lg">
                            Temukan jalan keluar dari labirin yang menantang!
                        </p>
                        
                        <div className="bg-green-50 rounded-lg p-6 mb-6">
                            <h3 className="font-bold text-green-800 mb-3">Cara Bermain:</h3>
                            <ul className="text-green-700 text-left space-y-2">
                                <li>• Gunakan tombol panah atau WASD untuk bergerak</li>
                                <li>• Hindari dinding (kotak gelap)</li>
                                <li>• Capai bendera finish (🏁) untuk menyelesaikan level</li>
                                <li>• Semakin efisien pergerakan, semakin tinggi skor</li>
                                <li>• Gunakan hint jika terjebak (akan mengurangi skor)</li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6 text-sm">
                            <div className="bg-green-100 text-green-800 p-3 rounded-lg">
                                <div className="font-bold">Level 1</div>
                                <div>Mudah</div>
                                <div>5x5</div>
                            </div>
                            <div className="bg-yellow-100 text-yellow-800 p-3 rounded-lg">
                                <div className="font-bold">Level 2</div>
                                <div>Sedang</div>
                                <div>7x7</div>
                            </div>
                            <div className="bg-red-100 text-red-800 p-3 rounded-lg">
                                <div className="font-bold">Level 3</div>
                                <div>Sulit</div>
                                <div>9x9</div>
                            </div>
                        </div>

                        <button
                            onClick={startGame}
                            className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-full text-xl transition-all duration-200 transform hover:scale-105"
                        >
                            Mulai Petualangan 🎮
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (gameState === "playing") {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
                <div className="max-w-4xl mx-auto pt-6">
                    {/* Header Info */}
                    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
                        <div className="flex flex-wrap justify-between items-center gap-4">
                            <div className="flex items-center space-x-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">{currentMazeIndex + 1}</div>
                                    <div className="text-xs text-gray-600">Level</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-blue-600">{maze.difficulty}</div>
                                    <div className="text-xs text-gray-600">Tingkat</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-purple-600">{moves}</div>
                                    <div className="text-xs text-gray-600">Langkah</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-orange-600">{formatTime(timeElapsed)}</div>
                                    <div className="text-xs text-gray-600">Waktu</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xl font-bold text-yellow-600">{totalScore}</div>
                                <div className="text-xs text-gray-600">Total Skor</div>
                            </div>
                        </div>
                    </div>

                    {/* Maze Container */}
                    <div className="bg-white rounded-2xl shadow-xl p-8">
                        <div className="flex flex-col items-center">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">
                                Level {currentMazeIndex + 1}: {maze.difficulty}
                            </h2>
                            
                            {/* Maze Grid */}
                            <div 
                                className="relative bg-gray-100 rounded-lg p-4 mb-6"
                                style={{
                                    width: `${maze.maze[0].length * cellSize + 32}px`,
                                    height: `${maze.maze.length * cellSize + 32}px`,
                                }}
                            >
                                <div
                                    className="grid gap-1"
                                    style={{
                                        gridTemplateColumns: `repeat(${maze.maze[0].length}, ${cellSize}px)`,
                                        gridTemplateRows: `repeat(${maze.maze.length}, ${cellSize}px)`,
                                    }}
                                >
                                    {maze.maze.map((row, y) =>
                                        row.map((cell, x) => {
                                            const isPlayer = playerPos.x === x && playerPos.y === y
                                            const isStart = maze.start.x === x && maze.start.y === y
                                            const isEnd = maze.end.x === x && maze.end.y === y
                                            const isPath = path.some((pos) => pos.x === x && pos.y === y)
                                            const isHint =
                                                showHint &&
                                                ((x === playerPos.x + 1 && y === playerPos.y && maze.maze[y][x] === 0) ||
                                                    (x === playerPos.x - 1 && y === playerPos.y && maze.maze[y][x] === 0) ||
                                                    (x === playerPos.x && y === playerPos.y + 1 && maze.maze[y][x] === 0) ||
                                                    (x === playerPos.x && y === playerPos.y - 1 && maze.maze[y][x] === 0))

                                            return (
                                                <div
                                                    key={`${x}-${y}`}
                                                    className={`
                                                        flex items-center justify-center text-xs font-bold transition-all duration-200
                                                        ${cell === 1 ? "bg-gray-800 shadow-inner" : "bg-gray-100"}
                                                        ${isPlayer ? "bg-blue-500 text-white shadow-md z-10" : ""}
                                                        ${isStart && !isPlayer ? "bg-blue-200" : ""}
                                                        ${isEnd ? "bg-red-200 animate-pulse" : ""}
                                                        ${isPath && !isPlayer && !isStart && !isEnd ? "bg-emerald-100" : ""}
                                                        ${isHint ? "bg-yellow-200 animate-pulse" : ""}
                                                    `}
                                                    style={{
                                                        width: `${cellSize}px`,
                                                        height: `${cellSize}px`,
                                                        borderRadius: cell === 1 ? "2px" : "0",
                                                    }}
                                                >
                                                    {isPlayer ? "🏃‍♂️" : isEnd ? "🏁" : isStart ? "🚩" : ""}
                                                </div>
                                            )
                                        }),
                                    )}
                                </div>

                                {showSuccess && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-20 animate-fade-in">
                                        <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                                            <div className="text-4xl mb-3">🎉</div>
                                            <p className="text-xl font-bold text-green-600 mb-2">Level Selesai!</p>
                                            <p className="text-sm text-gray-600">
                                                {currentMazeIndex < mazes.length - 1 ? "Bersiap untuk level berikutnya..." : "Semua level selesai!"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col items-center space-y-4">
                                <div className="flex justify-between items-center w-full max-w-md">
                                    <div className="flex space-x-2">
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 bg-blue-200 mr-1 rounded"></div>
                                            <span className="text-xs">Start</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 bg-red-200 mr-1 rounded"></div>
                                            <span className="text-xs">Finish</span>
                                        </div>
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 bg-emerald-100 mr-1 rounded"></div>
                                            <span className="text-xs">Path</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={showPathHint}
                                        disabled={showHint}
                                        className={`text-xs px-3 py-1 rounded-full transition-all ${
                                            showHint
                                                ? "bg-gray-300 text-gray-500"
                                                : "bg-yellow-400 hover:bg-yellow-500 text-yellow-800"
                                        }`}
                                    >
                                        {showHint ? "Hint Aktif" : `Hint (${hintsUsed})`}
                                    </button>
                                </div>

                                {/* Mobile Controls */}
                                <div className="grid grid-cols-3 gap-2 md:hidden">
                                    <div></div>
                                    <button
                                        onClick={() => movePlayer("up")}
                                        className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xl hover:bg-blue-600 transition-all"
                                    >
                                        ↑
                                    </button>
                                    <div></div>
                                    <button
                                        onClick={() => movePlayer("left")}
                                        className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xl hover:bg-blue-600 transition-all"
                                    >
                                        ←
                                    </button>
                                    <div></div>
                                    <button
                                        onClick={() => movePlayer("right")}
                                        className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xl hover:bg-blue-600 transition-all"
                                    >
                                        →
                                    </button>
                                    <div></div>
                                    <button
                                        onClick={() => movePlayer("down")}
                                        className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center text-xl hover:bg-blue-600 transition-all"
                                    >
                                        ↓
                                    </button>
                                    <div></div>
                                </div>

                                <div className="text-xs text-gray-600 text-center">
                                    <p className="hidden md:block">Gunakan tombol panah atau WASD untuk bergerak</p>
                                    <p className="md:hidden">Gunakan tombol di atas untuk bergerak</p>
                                </div>

                                <button
                                    onClick={restartCurrentMaze}
                                    className="text-sm bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-all"
                                >
                                    🔄 Restart Level
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (gameState === "result") {
        const averageScore = completedMazes.length > 0 ? Math.round(totalScore / completedMazes.length) : 0
        const totalMoves = completedMazes.reduce((sum, maze) => sum + maze.moves, 0)
        
        let message = ""
        let emoji = ""

        if (completedMazes.length === mazes.length) {
            if (averageScore >= 80) {
                message = "Maze Master!"
                emoji = "🏆"
            } else if (averageScore >= 60) {
                message = "Pathfinder!"
                emoji = "🗺️"
            } else {
                message = "Explorer!"
                emoji = "🧭"
            }
        } else {
            message = "Tetap Semangat!"
            emoji = "💪"
        }

        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
                <div className="max-w-2xl mx-auto pt-20">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-6xl mb-6">{emoji}</div>
                        <h1 className="text-3xl font-bold text-gray-800 mb-4">{message}</h1>
                        
                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                <div>
                                    <div className="text-2xl font-bold text-green-600">{completedMazes.length}</div>
                                    <div className="text-sm text-gray-600">Level Selesai</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-blue-600">{totalScore}</div>
                                    <div className="text-sm text-gray-600">Total Skor</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-purple-600">{totalMoves}</div>
                                    <div className="text-sm text-gray-600">Total Langkah</div>
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-orange-600">{formatTime(timeElapsed)}</div>
                                    <div className="text-sm text-gray-600">Waktu</div>
                                </div>
                            </div>
                        </div>

                        {/* Level Details */}
                        {completedMazes.length > 0 && (
                            <div className="bg-green-50 rounded-lg p-4 mb-6">
                                <h3 className="font-bold text-green-800 mb-3">Detail Level:</h3>
                                <div className="space-y-2">
                                    {completedMazes.map((mazeData, index) => (
                                        <div key={mazeData.mazeId} className="flex justify-between items-center text-sm">
                                            <span className="text-green-700">
                                                Level {index + 1} ({mazeData.difficulty})
                                            </span>
                                            <div className="flex space-x-4 text-green-600">
                                                <span>{mazeData.moves} langkah</span>
                                                <span>{mazeData.score} poin</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Performance Analysis */}
                        <div className="bg-blue-50 rounded-lg p-4 mb-6">
                            <h3 className="font-bold text-blue-800 mb-3">Analisis Performa:</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="text-blue-700">
                                    <div className="font-semibold">Efisiensi Rata-rata:</div>
                                    <div className="text-lg font-bold">{averageScore}%</div>
                                </div>
                                <div className="text-blue-700">
                                    <div className="font-semibold">Hint Digunakan:</div>
                                    <div className="text-lg font-bold">{hintsUsed}</div>
                                </div>
                            </div>
                        </div>

                        {/* Achievement Badges */}
                        <div className="flex justify-center space-x-2 mb-6">
                            {completedMazes.length === mazes.length && (
                                <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-bold">
                                    🏅 All Levels Complete
                                </div>
                            )}
                            {hintsUsed === 0 && completedMazes.length > 0 && (
                                <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
                                    🧠 No Hints Used
                                </div>
                            )}
                            {averageScore >= 90 && (
                                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                                    ⚡ Speed Runner
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            <button
                                onClick={restartGame}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-full transition-all duration-200"
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