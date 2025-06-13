"use client"

import { useState, useEffect, useCallback } from "react"

// Maze configurations
const mazes = [
    {
        id: 1,
        name: "Maze Mudah",
        difficulty: 1,
        size: 8,
        maze: [
            [1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 1],
            [1, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [1, 1, 1, 1, 1, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1],
        ],
        start: { x: 1, y: 1 },
        end: { x: 6, y: 6 },
    },
    {
        id: 2,
        name: "Maze Sedang",
        difficulty: 2,
        size: 10,
        maze: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 1, 1, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ],
        start: { x: 1, y: 1 },
        end: { x: 8, y: 8 },
    },
    {
        id: 3,
        name: "Maze Sulit",
        difficulty: 3,
        size: 12,
        maze: [
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1],
            [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
            [1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1],
            [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        ],
        start: { x: 1, y: 1 },
        end: { x: 10, y: 10 },
    },
]

export default function MazeGame() {
    const [gameState, setGameState] = useState("start")
    const [currentMaze, setCurrentMaze] = useState(0)
    const [playerPos, setPlayerPos] = useState({ x: 1, y: 1 })
    const [score, setScore] = useState(0)
    const [totalExp, setTotalExp] = useState(0)
    const [moves, setMoves] = useState(0)
    const [timeElapsed, setTimeElapsed] = useState(0)
    const [gameStartTime, setGameStartTime] = useState(0)
    const [selectedMazeIndex, setSelectedMazeIndex] = useState(0)
    const [showSuccess, setShowSuccess] = useState(false)
    const [path, setPath] = useState([])
    const [showHint, setShowHint] = useState(false)
    const [hintsUsed, setHintsUsed] = useState(0)

    // Timer effect
    useEffect(() => {
        let interval
        if (gameState === "playing") {
            interval = setInterval(() => {
                setTimeElapsed(Date.now() - gameStartTime)
            }, 100)
        }
        return () => clearInterval(interval)
    }, [gameState, gameStartTime])

    const handleStart = () => {
        setGameState("playing")
        setCurrentMaze(selectedMazeIndex)
        setPlayerPos(mazes[selectedMazeIndex].start)
        setScore(0)
        setMoves(0)
        setTimeElapsed(0)
        setGameStartTime(Date.now())
        setPath([])
        setShowHint(false)
        setHintsUsed(0)
    }

    const movePlayer = useCallback(
        (direction) => {
            if (gameState !== "playing") return

            const maze = mazes[currentMaze]
            let newX = playerPos.x
            let newY = playerPos.y

            switch (direction) {
                case "up":
                    newY = Math.max(0, playerPos.y - 1)
                    break
                case "down":
                    newY = Math.min(maze.size - 1, playerPos.y + 1)
                    break
                case "left":
                    newX = Math.max(0, playerPos.x - 1)
                    break
                case "right":
                    newX = Math.min(maze.size - 1, playerPos.x + 1)
                    break
            }

            // Check if the new position is not a wall
            if (maze.maze[newY][newX] === 0) {
                // Add current position to path
                setPath([...path, { x: playerPos.x, y: playerPos.y }])

                setPlayerPos({ x: newX, y: newY })
                setMoves(moves + 1)

                // Check if player reached the end
                if (newX === maze.end.x && newY === maze.end.y) {
                    setShowSuccess(true)
                    const timeBonus = Math.max(0, 30 - Math.floor(timeElapsed / 1000))
                    const moveBonus = Math.max(0, 50 - moves)
                    const hintPenalty = hintsUsed * 5
                    const expGain = maze.difficulty * 20 + timeBonus + moveBonus - hintPenalty

                    setScore(score + 1)
                    setTotalExp(totalExp + expGain)

                    setTimeout(() => {
                        setShowSuccess(false)
                        if (currentMaze < mazes.length - 1) {
                            setCurrentMaze(currentMaze + 1)
                            setPlayerPos(mazes[currentMaze + 1].start)
                            setMoves(0)
                            setGameStartTime(Date.now())
                            setPath([])
                            setShowHint(false)
                        } else {
                            setGameState("result")
                        }
                    }, 1500)
                }
            }
        },
        [gameState, playerPos, currentMaze, moves, timeElapsed, score, totalExp, path, hintsUsed],
    )

    const showPathHint = () => {
        setShowHint(true)
        setHintsUsed(hintsUsed + 1)

        // Hide hint after 3 seconds
        setTimeout(() => {
            setShowHint(false)
        }, 3000)
    }

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e) => {
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
                case "h":
                case "H":
                    e.preventDefault()
                    showPathHint()
                    break
            }
        }

        if (gameState === "playing") {
            window.addEventListener("keydown", handleKeyPress)
        }

        return () => {
            window.removeEventListener("keydown", handleKeyPress)
        }
    }, [gameState, movePlayer])

    const formatTime = (ms) => {
        const seconds = Math.floor(ms / 1000)
        const minutes = Math.floor(seconds / 60)
        const remainingSeconds = seconds % 60
        return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
    }

    const renderStartScreen = () => (
        <div className="flex flex-col items-center justify-center h-full space-y-8 py-10">
            <div className="relative w-full max-w-md opacity-0 animate-fade-in">
                <div className="bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl shadow-2xl p-8 text-center">
                    <div className="text-6xl mb-4 animate-float">🧩</div>
                    <h1 className="text-4xl font-extrabold text-white mb-4">Maze Challenge</h1>
                    <p className="text-lg text-emerald-100 mb-8">Navigasi melalui labirin dan capai tujuan!</p>

                    <div className="bg-white/10 rounded-lg p-4 mb-8">
                        <p className="text-white text-sm">
                            • Gunakan tombol panah atau WASD untuk bergerak
                            <br />• Temukan jalan keluar secepat mungkin
                            <br />• Dapatkan bonus EXP untuk waktu dan langkah yang efisien
                            <br />• Tekan H untuk petunjuk (akan mengurangi EXP)
                        </p>
                    </div>

                    <div className="mb-8">
                        <h3 className="text-white text-lg font-semibold mb-3">Pilih Tingkat Kesulitan:</h3>
                        <div className="flex flex-wrap justify-center gap-2">
                            {mazes.map((maze, index) => (
                                <button
                                    key={maze.id}
                                    onClick={() => setSelectedMazeIndex(index)}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedMazeIndex === index
                                        ? "bg-white text-blue-700"
                                        : "bg-white/20 text-white hover:bg-white/30"
                                        }`}
                                >
                                    {maze.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleStart}
                        className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-4 px-10 rounded-full text-xl shadow-lg transition-transform duration-200 hover:scale-105 active:scale-95"
                    >
                        Mulai Petualangan
                    </button>
                </div>
            </div>

            <div className="text-center text-gray-600">
                <p>Total EXP Kamu: {totalExp}</p>
            </div>
        </div>
    )

    const renderPlayingScreen = () => {
        const maze = mazes[currentMaze]
        const cellSize = Math.min(400 / maze.size, 30)

        return (
            <div className="flex flex-col items-center justify-center h-full space-y-6 py-8">
                <div className="w-full max-w-2xl">
                    <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            {maze.name} ({currentMaze + 1}/{mazes.length})
                        </span>
                        <span className="bg-yellow-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            Langkah: {moves}
                        </span>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                            ⏱️ {formatTime(timeElapsed)}
                        </span>
                        {hintsUsed > 0 && (
                            <span className="bg-purple-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                Petunjuk: {hintsUsed}
                            </span>
                        )}
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
                        <div
                            className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${(currentMaze / mazes.length) * 100}%` }}
                        ></div>
                    </div>

                    <div className="p-6 bg-white shadow-xl rounded-2xl border-t-4 border-blue-500">
                        <div
                            className="grid gap-1 mx-auto relative"
                            style={{
                                gridTemplateColumns: `repeat(${maze.size}, ${cellSize}px)`,
                                width: `${maze.size * (cellSize + 4)}px`,
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

                            {showSuccess && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-20 animate-fade-in">
                                    <div className="bg-white p-4 rounded-lg shadow-lg text-center">
                                        <div className="text-3xl mb-2">🎉</div>
                                        <p className="text-lg font-bold text-blue-600">Level Selesai!</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-between items-center">
                            <div className="flex space-x-2">
                                <div className="flex items-center">
                                    <div className="w-4 h-4 bg-green-200 mr-1"></div>
                                    <span className="text-xs">Start</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-4 h-4 bg-red-200 mr-1"></div>
                                    <span className="text-xs">Finish</span>
                                </div>
                                <div className="flex items-center">
                                    <div className="w-4 h-4 bg-emerald-100 mr-1"></div>
                                    <span className="text-xs">Path</span>
                                </div>
                            </div>

                            <button
                                onClick={showPathHint}
                                disabled={showHint}
                                className={`text-xs px-3 py-1 rounded-full ${showHint
                                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                                    : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    }`}
                            >
                                Petunjuk (H)
                            </button>
                        </div>
                    </div>

                    {/* Mobile Controls */}
                    <div className="mt-6 grid grid-cols-3 gap-2 max-w-xs mx-auto">
                        <div></div>
                        <button
                            onClick={() => movePlayer("up")}
                            className="p-4 border rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 shadow-sm transition-colors"
                        >
                            ↑
                        </button>
                        <div></div>
                        <button
                            onClick={() => movePlayer("left")}
                            className="p-4 border rounded-md bg-blue-50 hover:bg-emerald-100 text-blue-600 shadow-sm transition-colors"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => movePlayer("down")}
                            className="p-4 border rounded-md bg-blue-50 hover:bg-emerald-100 text-blue-600 shadow-sm transition-colors"
                        >
                            ↓
                        </button>
                        <button
                            onClick={() => movePlayer("right")}
                            className="p-4 border rounded-md bg-blue-50 hover:bg-emerald-100 text-blue-600 shadow-sm transition-colors"
                        >
                            →
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const renderResultScreen = () => {
        const percentage = Math.round((score / mazes.length) * 100)
        let message, emoji

        if (percentage === 100) {
            message = "Sempurna! Kamu adalah master labirin!"
            emoji = "🏆"
        } else if (percentage >= 80) {
            message = "Hebat! Kemampuan navigasi kamu luar biasa!"
            emoji = "🎉"
        } else if (percentage >= 60) {
            message = "Bagus! Kamu cukup pandai menemukan jalan!"
            emoji = "👍"
        } else if (percentage >= 40) {
            message = "Lumayan! Terus latih kemampuan navigasi kamu!"
            emoji = "📚"
        } else {
            message = "Jangan menyerah! Coba lagi untuk meningkatkan kemampuan navigasi!"
            emoji = "💪"
        }

        return (
            <div className="flex flex-col items-center justify-center h-full space-y-8 py-10 animate-fade-in">
                <div className="w-full max-w-md p-8 bg-gradient-to-br from-blue-600 to-blue-400 shadow-2xl rounded-2xl text-center text-white">
                    <div className="text-6xl mb-4 animate-bounce-once">{emoji}</div>
                    <h2 className="text-3xl font-bold mb-4">Petualangan Selesai!</h2>
                    <p className="text-lg mb-6">{message}</p>

                    <div className="bg-white/10 rounded-xl p-6 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span>Maze Selesai:</span>
                            <span className="text-2xl font-bold">
                                {score}/{mazes.length}
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
                            Pilih Level
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[700px] w-full max-w-4xl mx-auto p-4 bg-gradient-to-b from-emerald-50 to-white rounded-3xl shadow-lg">
            {gameState === "start" && renderStartScreen()}
            {gameState === "playing" && renderPlayingScreen()}
            {gameState === "result" && renderResultScreen()}
        </div>
    )
}
