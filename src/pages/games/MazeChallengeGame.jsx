// src/pages/games/MazeChallengeGame.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../../service/api';

export default function MazeChallengeGame() {
    const navigate = useNavigate();
    const [currentMaze, setCurrentMaze] = useState(0);
    const [playerPosition, setPlayerPosition] = useState({ x: 1, y: 1 });
    const [gameComplete, setGameComplete] = useState(false);
    const [gameStarted, setGameStarted] = useState(false);
    const [moves, setMoves] = useState(0);
    const [timeLeft, setTimeLeft] = useState(480); // 8 minutes
    const [completedMazes, setCompletedMazes] = useState(0);

    // Maze definitions (0 = wall, 1 = path, 2 = start, 3 = finish)
    const mazes = [
        {
            id: 1,
            difficulty: "Easy",
            size: 8,
            grid: [
                [0,0,0,0,0,0,0,0],
                [0,2,1,0,1,1,1,0],
                [0,1,1,0,1,0,1,0],
                [0,1,0,0,1,0,1,0],
                [0,1,1,1,1,0,1,0],
                [0,0,0,0,1,0,1,0],
                [0,1,1,1,1,0,3,0],
                [0,0,0,0,0,0,0,0]
            ],
            start: { x: 1, y: 1 },
            finish: { x: 6, y: 6 }
        },
        {
            id: 2,
            difficulty: "Medium",
            size: 10,
            grid: [
                [0,0,0,0,0,0,0,0,0,0],
                [0,2,1,1,0,1,1,1,1,0],
                [0,0,0,1,0,1,0,0,1,0],
                [0,1,1,1,1,1,1,0,1,0],
                [0,1,0,0,0,0,1,0,1,0],
                [0,1,1,1,1,0,1,0,1,0],
                [0,0,0,0,1,0,1,1,1,0],
                [0,1,1,1,1,0,0,0,1,0],
                [0,1,0,0,0,0,1,1,3,0],
                [0,0,0,0,0,0,0,0,0,0]
            ],
            start: { x: 1, y: 1 },
            finish: { x: 8, y: 8 }
        },
        {
            id: 3,
            difficulty: "Hard",
            size: 12,
            grid: [
                [0,0,0,0,0,0,0,0,0,0,0,0],
                [0,2,1,1,0,1,1,1,0,1,1,0],
                [0,0,0,1,0,1,0,1,0,1,0,0],
                [0,1,1,1,1,1,0,1,1,1,1,0],
                [0,1,0,0,0,0,0,0,0,0,1,0],
                [0,1,1,1,1,1,1,1,1,0,1,0],
                [0,0,0,0,0,0,0,0,1,0,1,0],
                [0,1,1,1,1,1,1,0,1,0,1,0],
                [0,1,0,0,0,0,1,0,1,1,1,0],
                [0,1,1,1,1,0,1,0,0,0,1,0],
                [0,0,0,0,1,1,1,1,1,1,3,0],
                [0,0,0,0,0,0,0,0,0,0,0,0]
            ],
            start: { x: 1, y: 1 },
            finish: { x: 10, y: 10 }
        },
        {
            id: 4,
            difficulty: "Expert",
            size: 14,
            grid: [
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0],
                [0,2,1,1,0,1,1,1,0,1,1,1,1,0],
                [0,0,0,1,0,1,0,1,0,1,0,0,1,0],
                [0,1,1,1,1,1,0,1,1,1,1,0,1,0],
                [0,1,0,0,0,0,0,0,0,0,1,0,1,0],
                [0,1,1,1,1,1,1,1,1,0,1,0,1,0],
                [0,0,0,0,0,0,0,0,1,0,1,1,1,0],
                [0,1,1,1,1,1,1,0,1,0,0,0,1,0],
                [0,1,0,0,0,0,1,0,1,1,1,0,1,0],
                [0,1,1,1,1,0,1,0,0,0,1,0,1,0],
                [0,0,0,0,1,0,1,1,1,0,1,1,1,0],
                [0,1,1,1,1,0,0,0,1,0,0,0,1,0],
                [0,1,0,0,0,0,1,1,1,1,1,1,3,0],
                [0,0,0,0,0,0,0,0,0,0,0,0,0,0]
            ],
            start: { x: 1, y: 1 },
            finish: { x: 12, y: 12 }
        }
    ];

    // Timer effect
    useEffect(() => {
        if (gameStarted && timeLeft > 0 && !gameComplete) {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timer);
        } else if (timeLeft === 0) {
            handleGameEnd();
        }
    }, [timeLeft, gameStarted, gameComplete]);

    // Keyboard controls
    const handleKeyPress = useCallback((event) => {
        if (!gameStarted || gameComplete) return;

        const { key } = event;
        const currentMazeData = mazes[currentMaze];
        let newX = playerPosition.x;
        let newY = playerPosition.y;

        switch (key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                newY = Math.max(0, playerPosition.y - 1);
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                newY = Math.min(currentMazeData.size - 1, playerPosition.y + 1);
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                newX = Math.max(0, playerPosition.x - 1);
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                newX = Math.min(currentMazeData.size - 1, playerPosition.x + 1);
                break;
            default:
                return;
        }

        // Check if new position is valid (not a wall)
        if (currentMazeData.grid[newY][newX] !== 0) {
            setPlayerPosition({ x: newX, y: newY });
            setMoves(moves + 1);

            // Check if reached finish
            if (newX === currentMazeData.finish.x && newY === currentMazeData.finish.y) {
                handleMazeComplete();
            }
        }
    }, [gameStarted, gameComplete, playerPosition, currentMaze, moves]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyPress);
        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [handleKeyPress]);

    const startGame = () => {
        setGameStarted(true);
        setCurrentMaze(0);
        setPlayerPosition(mazes[0].start);
        setMoves(0);
        setCompletedMazes(0);
        setGameComplete(false);
        setTimeLeft(480);
    };

    const handleMazeComplete = () => {
        const newCompletedMazes = completedMazes + 1;
        setCompletedMazes(newCompletedMazes);

        if (currentMaze + 1 < mazes.length) {
            // Move to next maze
            setTimeout(() => {
                setCurrentMaze(currentMaze + 1);
                setPlayerPosition(mazes[currentMaze + 1].start);
            }, 1000);
        } else {
            // All mazes completed
            setTimeout(() => {
                handleGameEnd();
            }, 1000);
        }
    };

    const handleGameEnd = async () => {
        setGameComplete(true);
        
        const gameResult = {
            questionsAnswered: mazes.length,
            correctAnswers: completedMazes,
            wrongAnswers: mazes.length - completedMazes,
            score: Math.round((completedMazes / mazes.length) * 100),
            timeSpent: 480 - timeLeft,
            isCompleted: completedMazes === mazes.length
        };

        console.log('🌀 Maze Challenge Game Result:', gameResult);

        try {
            const response = await gameAPI.updateGameProgress('mazechallenge', gameResult);
            console.log('✅ Update Progress Response:', response);
            
            // Force refresh parent component
            window.dispatchEvent(new CustomEvent('gameProgressUpdated'));
            
        } catch (error) {
            console.error('❌ Error updating game progress:', error);
            console.error('Error details:', error.response?.data);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const goHome = () => {
        navigate('/game');
    };

    const movePlayer = (direction) => {
        const event = { key: direction };
        handleKeyPress(event);
    };

    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">🌀</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Maze Challenge</h1>
                    <p className="text-gray-600 mb-6">
                        Temukan jalan keluar dari 4 labirin yang semakin menantang! 
                        Gunakan arrow keys atau WASD untuk bergerak.
                    </p>
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-gray-800 mb-2">Cara Bermain:</h3>
                        <ul className="text-sm text-gray-700 text-left space-y-1">
                            <li>• Gunakan ⬅️ ➡️ ⬆️ ⬇️ untuk bergerak</li>
                            <li>• Atau gunakan tombol W A S D</li>
                            <li>• Temukan jalan ke titik finish 🏁</li>
                            <li>• Selesaikan 4 labirin berbeda</li>
                            <li>• Waktu: 8 menit</li>
                        </ul>
                    </div>
                    <button 
                        onClick={startGame}
                        className="bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        Mulai Permainan
                    </button>
                    <button 
                        onClick={goHome}
                        className="ml-4 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg transition-colors"
                    >
                        Kembali
                    </button>
                </div>
            </div>
        );
    }

    if (gameComplete) {
        const percentage = Math.round((completedMazes / mazes.length) * 100);
        const isExcellent = percentage >= 100;
        const isGood = percentage >= 75;

        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">
                        {isExcellent ? '🏆' : isGood ? '🎉' : '💪'}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        {isExcellent ? 'Master Navigator!' : isGood ? 'Great Job!' : 'Keep Trying!'}
                    </h1>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                            <span>Labirin Selesai:</span>
                            <span className="font-bold">{completedMazes}/{mazes.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total Langkah:</span>
                            <span className="font-bold">{moves}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Waktu:</span>
                            <span className="font-bold">{formatTime(480 - timeLeft)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Persentase:</span>
                            <span className="font-bold">{percentage}%</span>
                        </div>
                    </div>
                    <div className="flex space-x-4">
                        <button 
                            onClick={startGame}
                            className="flex-1 bg-gray-700 hover:bg-gray-800 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            Main Lagi
                        </button>
                        <button 
                            onClick={goHome}
                            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded-lg transition-colors"
                        >
                            Kembali
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentMazeData = mazes[currentMaze];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-600 p-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Maze Challenge</h1>
                            <p className="text-sm text-gray-600">
                                Labirin {currentMaze + 1} dari {mazes.length} - {currentMazeData.difficulty}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-gray-700">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="text-sm text-gray-600">
                                Langkah: {moves} | Selesai: {completedMazes}
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-gray-700 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentMaze + 1) / mazes.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Maze */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="flex justify-center">
                        <div className="inline-block">
                            {currentMazeData.grid.map((row, y) => (
                                <div key={y} className="flex">
                                    {row.map((cell, x) => (
                                        <div
                                            key={`${x}-${y}`}
                                            className={`w-8 h-8 border border-gray-300 flex items-center justify-center text-lg ${
                                                cell === 0 ? 'bg-gray-800' : 'bg-white'
                                            }`}
                                        >
                                            {playerPosition.x === x && playerPosition.y === y ? (
                                                <span className="text-blue-600 font-bold">🚶</span>
                                            ) : cell === 2 ? (
                                                <span className="text-green-600">🏁</span>
                                            ) : cell === 3 ? (
                                                <span className="text-red-600">🎯</span>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Controls */}
                <div className="bg-white rounded-lg shadow-lg p-6 md:hidden">
                    <h3 className="text-center font-semibold mb-4">Kontrol</h3>
                    <div className="flex flex-col items-center space-y-2">
                        <button 
                            onClick={() => movePlayer('ArrowUp')}
                            className="bg-gray-700 hover:bg-gray-800 text-white w-12 h-12 rounded-lg"
                        >
                            ⬆️
                        </button>
                        <div className="flex space-x-2">
                            <button 
                                onClick={() => movePlayer('ArrowLeft')}
                                className="bg-gray-700 hover:bg-gray-800 text-white w-12 h-12 rounded-lg"
                            >
                                ⬅️
                            </button>
                            <button 
                                onClick={() => movePlayer('ArrowDown')}
                                className="bg-gray-700 hover:bg-gray-800 text-white w-12 h-12 rounded-lg"
                            >
                                ⬇️
                            </button>
                            <button 
                                onClick={() => movePlayer('ArrowRight')}
                                className="bg-gray-700 hover:bg-gray-800 text-white w-12 h-12 rounded-lg"
                            >
                                ➡️
                            </button>
                        </div>
                    </div>
                </div>

                {/* Instructions */}
                <div className="bg-white rounded-lg shadow-lg p-4 text-center text-sm text-gray-600">
                    <p>🚶 = Kamu | 🏁 = Start | 🎯 = Finish</p>
                    <p className="mt-1">Gunakan arrow keys (⬅️ ➡️ ⬆️ ⬇️) atau WASD untuk bergerak</p>
                </div>
            </div>
        </div>
    );
}