// src/pages/games/PatternPuzzleGame.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../../service/api';

export default function PatternPuzzleGame() {
    const navigate = useNavigate();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [gameComplete, setGameComplete] = useState(false);
    const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
    const [gameStarted, setGameStarted] = useState(false);

    // Sample pattern puzzle questions
    const questions = [
        {
            id: 1,
            pattern: ['🔴', '🔵', '🔴', '🔵', '?'],
            options: ['🔴', '🔵', '🟢', '🟡'],
            correct: 0, // 🔴
            explanation: 'Pola berulang: merah, biru, merah, biru...'
        },
        {
            id: 2,
            pattern: ['1', '2', '4', '8', '?'],
            options: ['12', '16', '10', '6'],
            correct: 1, // 16
            explanation: 'Setiap angka dikali 2: 1×2=2, 2×2=4, 4×2=8, 8×2=16'
        },
        {
            id: 3,
            pattern: ['A', 'B', 'D', 'G', '?'],
            options: ['H', 'I', 'K', 'L'],
            correct: 2, // K
            explanation: 'Jarak huruf bertambah: A+1=B, B+2=D, D+3=G, G+4=K'
        },
        {
            id: 4,
            pattern: ['🔺', '🔻', '🔺🔺', '🔻🔻', '?'],
            options: ['🔺🔺🔺', '🔻🔻🔻', '🔺🔻', '🔻🔺'],
            correct: 0, // 🔺🔺🔺
            explanation: 'Pola: 1 segitiga, 1 terbalik, 2 segitiga, 2 terbalik, 3 segitiga'
        },
        {
            id: 5,
            pattern: ['3', '6', '12', '24', '?'],
            options: ['36', '48', '30', '42'],
            correct: 1, // 48
            explanation: 'Setiap angka dikali 2: 3×2=6, 6×2=12, 12×2=24, 24×2=48'
        },
        {
            id: 6,
            pattern: ['🟥', '🟧', '🟨', '🟩', '?'],
            options: ['🟦', '🟪', '⬜', '⬛'],
            correct: 0, // 🟦
            explanation: 'Urutan warna pelangi: merah, oranye, kuning, hijau, biru'
        },
        {
            id: 7,
            pattern: ['Z', 'Y', 'X', 'W', '?'],
            options: ['V', 'U', 'T', 'S'],
            correct: 0, // V
            explanation: 'Urutan huruf mundur: Z, Y, X, W, V'
        },
        {
            id: 8,
            pattern: ['2', '3', '5', '8', '?'],
            options: ['11', '13', '12', '10'],
            correct: 1, // 13
            explanation: 'Deret Fibonacci: 2+3=5, 3+5=8, 5+8=13'
        },
        {
            id: 9,
            pattern: ['⭐', '⭐⭐', '⭐', '⭐⭐⭐', '?'],
            options: ['⭐', '⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐'],
            correct: 0, // ⭐
            explanation: 'Pola: 1, 2, 1, 3, 1 (kembali ke 1 bintang)'
        },
        {
            id: 10,
            pattern: ['🌕', '🌖', '🌗', '🌘', '?'],
            options: ['🌑', '🌒', '🌓', '🌔'],
            correct: 0, // 🌑
            explanation: 'Fase bulan: purnama → sabit kanan → setengah → sabit kiri → bulan baru'
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

    const startGame = () => {
        setGameStarted(true);
        setCurrentQuestion(0);
        setScore(0);
        setSelectedAnswer(null);
        setGameComplete(false);
        setTimeLeft(300);
    };

    const handleAnswerSelect = (answerIndex) => {
        setSelectedAnswer(answerIndex);
    };

    const handleNextQuestion = () => {
        const isCorrect = selectedAnswer === questions[currentQuestion].correct;
        if (isCorrect) {
            setScore(score + 1);
        }

        if (currentQuestion + 1 < questions.length) {
            setCurrentQuestion(currentQuestion + 1);
            setSelectedAnswer(null);
        } else {
            handleGameEnd();
        }
    };

    const handleGameEnd = async () => {
        setGameComplete(true);
        
        const gameResult = {
            questionsAnswered: currentQuestion + 1,
            correctAnswers: score,
            wrongAnswers: (currentQuestion + 1) - score,
            score: Math.round((score / questions.length) * 100),
            timeSpent: 300 - timeLeft,
            isCompleted: currentQuestion + 1 === questions.length
        };

        console.log('🎮 Pattern Puzzle Game Result:', gameResult);

        try {
            const response = await gameAPI.updateGameProgress('patternpuzzle', gameResult);
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

    if (!gameStarted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">🧩</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Tebak Pola</h1>
                    <p className="text-gray-600 mb-6">
                        Asah logika dengan menebak pola yang tersembunyi! 
                        Kamu punya 5 menit untuk menyelesaikan 10 soal.
                    </p>
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-blue-800 mb-2">Cara Bermain:</h3>
                        <ul className="text-sm text-blue-700 text-left space-y-1">
                            <li>• Perhatikan pola yang diberikan</li>
                            <li>• Pilih jawaban yang melengkapi pola</li>
                            <li>• Setiap jawaban benar = 10 poin</li>
                            <li>• Waktu: 5 menit</li>
                        </ul>
                    </div>
                    <button 
                        onClick={startGame}
                        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
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
        const percentage = Math.round((score / questions.length) * 100);
        const isExcellent = percentage >= 80;
        const isGood = percentage >= 60;

        return (
            <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">
                        {isExcellent ? '🏆' : isGood ? '🎉' : '💪'}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        {isExcellent ? 'Luar Biasa!' : isGood ? 'Bagus!' : 'Terus Berlatih!'}
                    </h1>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between">
                            <span>Skor Akhir:</span>
                            <span className="font-bold">{score}/{questions.length}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Persentase:</span>
                            <span className="font-bold">{percentage}%</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Waktu:</span>
                            <span className="font-bold">{formatTime(300 - timeLeft)}</span>
                        </div>
                    </div>
                    <div className="flex space-x-4">
                        <button 
                            onClick={startGame}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
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

    const question = questions[currentQuestion];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-500 p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Tebak Pola</h1>
                            <p className="text-sm text-gray-600">
                                Soal {currentQuestion + 1} dari {questions.length}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                                {formatTime(timeLeft)}
                            </div>
                            <div className="text-sm text-gray-600">
                                Skor: {score}/{currentQuestion + (selectedAnswer !== null ? 1 : 0)}
                            </div>
                        </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold mb-4 text-center">
                        Lengkapi pola berikut:
                    </h2>
                    
                    {/* Pattern Display */}
                    <div className="flex justify-center items-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
                        {question.pattern.map((item, index) => (
                            <div key={index} className="text-3xl font-bold">
                                {item === '?' ? (
                                    <span className="text-purple-600 animate-pulse">?</span>
                                ) : (
                                    item
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Answer Options */}
                    <div className="grid grid-cols-2 gap-4">
                        {question.options.map((option, index) => (
                            <button
                                key={index}
                                onClick={() => handleAnswerSelect(index)}
                                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                    selectedAnswer === index
                                        ? 'border-purple-600 bg-purple-100'
                                        : 'border-gray-300 hover:border-purple-300 hover:bg-purple-50'
                                }`}
                            >
                                <div className="text-2xl font-bold">{option}</div>
                            </button>
                        ))}
                    </div>

                    {/* Next Button */}
                    <div className="mt-6 text-center">
                        <button
                            onClick={handleNextQuestion}
                            disabled={selectedAnswer === null}
                            className={`px-8 py-3 rounded-lg font-bold transition-all duration-200 ${
                                selectedAnswer !== null
                                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {currentQuestion + 1 === questions.length ? 'Selesai' : 'Soal Berikutnya'}
                        </button>
                    </div>
                </div>

                {/* Show explanation after answer */}
                {selectedAnswer !== null && (
                    <div className="bg-white rounded-lg shadow-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xl">
                                {selectedAnswer === question.correct ? '✅' : '❌'}
                            </span>
                            <span className="font-semibold">
                                {selectedAnswer === question.correct ? 'Benar!' : 'Salah!'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">
                            <strong>Penjelasan:</strong> {question.explanation}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}