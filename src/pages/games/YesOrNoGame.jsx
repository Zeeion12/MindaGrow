// src/pages/games/YesOrNoGame.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gameAPI } from '../../service/api';

export default function YesOrNoGame() {
    const navigate = useNavigate();
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [gameComplete, setGameComplete] = useState(false);
    const [timeLeft, setTimeLeft] = useState(240); // 4 minutes
    const [gameStarted, setGameStarted] = useState(false);

    // Sample Yes/No questions
    const questions = [
        {
            id: 1,
            question: "Apakah matahari terbit dari arah timur?",
            correct: true,
            explanation: "Ya, matahari selalu terbit dari arah timur dan tenggelam di barat."
        },
        {
            id: 2,
            question: "Apakah ikan dapat hidup di luar air?",
            correct: false,
            explanation: "Tidak, ikan membutuhkan air untuk bernapas melalui insangnya."
        },
        {
            id: 3,
            question: "Apakah Indonesia adalah negara kepulauan terbesar di dunia?",
            correct: true,
            explanation: "Ya, Indonesia memiliki lebih dari 17.000 pulau dan merupakan negara kepulauan terbesar."
        },
        {
            id: 4,
            question: "Apakah bulan memiliki atmosfer seperti Bumi?",
            correct: false,
            explanation: "Tidak, bulan tidak memiliki atmosfer yang signifikan seperti Bumi."
        },
        {
            id: 5,
            question: "Apakah air mendidih pada suhu 100°C?",
            correct: true,
            explanation: "Ya, air mendidih pada suhu 100°C di permukaan laut (tekanan 1 atm)."
        },
        {
            id: 6,
            question: "Apakah semua burung bisa terbang?",
            correct: false,
            explanation: "Tidak, ada beberapa burung yang tidak bisa terbang seperti penguin dan burung unta."
        },
        {
            id: 7,
            question: "Apakah 1 jam sama dengan 60 menit?",
            correct: true,
            explanation: "Ya, 1 jam = 60 menit adalah konversi waktu yang benar."
        },
        {
            id: 8,
            question: "Apakah gajah adalah mamalia terbesar di dunia?",
            correct: false,
            explanation: "Tidak, paus biru adalah mamalia terbesar di dunia. Gajah adalah mamalia darat terbesar."
        },
        {
            id: 9,
            question: "Apakah Jakarta adalah ibu kota Indonesia?",
            correct: true,
            explanation: "Ya, Jakarta adalah ibu kota Republik Indonesia."
        },
        {
            id: 10,
            question: "Apakah semua planet di tata surya memiliki cincin?",
            correct: false,
            explanation: "Tidak, hanya beberapa planet seperti Saturnus, Jupiter, Uranus, dan Neptunus yang memiliki cincin."
        },
        {
            id: 11,
            question: "Apakah manusia memiliki 5 panca indera?",
            correct: true,
            explanation: "Ya, manusia memiliki 5 panca indera: penglihatan, pendengaran, penciuman, perasa, dan peraba."
        },
        {
            id: 12,
            question: "Apakah emas lebih berat dari perak?",
            correct: true,
            explanation: "Ya, emas memiliki densitas yang lebih tinggi dibanding perak, sehingga lebih berat."
        },
        {
            id: 13,
            question: "Apakah semua segitiga memiliki 4 sisi?",
            correct: false,
            explanation: "Tidak, segitiga memiliki 3 sisi. Yang memiliki 4 sisi adalah segi empat."
        },
        {
            id: 14,
            question: "Apakah vitamin C baik untuk sistem kekebalan tubuh?",
            correct: true,
            explanation: "Ya, vitamin C membantu meningkatkan sistem kekebalan tubuh dan melawan infeksi."
        },
        {
            id: 15,
            question: "Apakah lumba-lumba adalah ikan?",
            correct: false,
            explanation: "Tidak, lumba-lumba adalah mamalia laut yang bernapas dengan paru-paru, bukan insang."
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
        setTimeLeft(240);
    };

    const handleAnswerSelect = (answer) => {
        setSelectedAnswer(answer);
        
        // Auto advance after short delay to show result
        setTimeout(() => {
            handleNextQuestion(answer);
        }, 1500);
    };

    const handleNextQuestion = (answer = selectedAnswer) => {
        const isCorrect = answer === questions[currentQuestion].correct;
        if (isCorrect) {
            setScore(score + 1);
        }

        if (currentQuestion + 1 < questions.length) {
            setTimeout(() => {
                setCurrentQuestion(currentQuestion + 1);
                setSelectedAnswer(null);
            }, 500);
        } else {
            setTimeout(() => {
                handleGameEnd();
            }, 500);
        }
    };

    const handleGameEnd = async () => {
        setGameComplete(true);
        
        const gameResult = {
            questionsAnswered: currentQuestion + 1,
            correctAnswers: score,
            wrongAnswers: (currentQuestion + 1) - score,
            score: Math.round((score / questions.length) * 100),
            timeSpent: 240 - timeLeft,
            isCompleted: currentQuestion + 1 === questions.length
        };

        console.log('🤔 Yes or No Game Result:', gameResult);

        try {
            const response = await gameAPI.updateGameProgress('yesorno', gameResult);
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
            <div className="min-h-screen bg-gradient-to-br from-green-500 to-blue-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">🤔</div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Yes or No</h1>
                    <p className="text-gray-600 mb-6">
                        Tes pengetahuan dengan menjawab pertanyaan sederhana! 
                        Jawab dengan YA atau TIDAK dalam 4 menit.
                    </p>
                    <div className="mb-6 p-4 bg-green-50 rounded-lg">
                        <h3 className="font-semibold text-green-800 mb-2">Cara Bermain:</h3>
                        <ul className="text-sm text-green-700 text-left space-y-1">
                            <li>• Baca pertanyaan dengan teliti</li>
                            <li>• Pilih YA atau TIDAK</li>
                            <li>• Setiap jawaban benar = poin</li>
                            <li>• Waktu: 4 menit untuk semua soal</li>
                        </ul>
                    </div>
                    <button 
                        onClick={startGame}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
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
        const isExcellent = percentage >= 85;
        const isGood = percentage >= 70;

        return (
            <div className="min-h-screen bg-gradient-to-br from-yellow-500 to-green-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
                    <div className="text-6xl mb-4">
                        {isExcellent ? '🏆' : isGood ? '🎉' : '💪'}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">
                        {isExcellent ? 'Fantastis!' : isGood ? 'Hebat!' : 'Terus Belajar!'}
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
                            <span className="font-bold">{formatTime(240 - timeLeft)}</span>
                        </div>
                    </div>
                    <div className="flex space-x-4">
                        <button 
                            onClick={startGame}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors"
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
    const showResult = selectedAnswer !== null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-500 to-green-500 p-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-gray-800">Yes or No</h1>
                            <p className="text-sm text-gray-600">
                                Soal {currentQuestion + 1} dari {questions.length}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
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
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question */}
                <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                    <div className="text-center mb-8">
                        <div className="text-4xl mb-4">🤔</div>
                        <h2 className="text-xl font-semibold text-gray-800 leading-relaxed">
                            {question.question}
                        </h2>
                    </div>

                    {/* Answer Buttons */}
                    <div className="flex space-x-6 justify-center">
                        <button
                            onClick={() => handleAnswerSelect(true)}
                            disabled={selectedAnswer !== null}
                            className={`flex-1 max-w-xs py-6 px-8 rounded-xl font-bold text-xl transition-all duration-200 ${
                                selectedAnswer === true
                                    ? selectedAnswer === question.correct 
                                        ? 'bg-green-500 text-white transform scale-105' 
                                        : 'bg-red-500 text-white transform scale-105'
                                    : selectedAnswer === false && question.correct === true
                                        ? 'bg-green-200 border-2 border-green-500'
                                        : 'bg-blue-500 hover:bg-blue-600 text-white hover:transform hover:scale-105'
                            } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex flex-col items-center">
                                <div className="text-3xl mb-2">✅</div>
                                <div>YA</div>
                            </div>
                        </button>

                        <button
                            onClick={() => handleAnswerSelect(false)}
                            disabled={selectedAnswer !== null}
                            className={`flex-1 max-w-xs py-6 px-8 rounded-xl font-bold text-xl transition-all duration-200 ${
                                selectedAnswer === false
                                    ? selectedAnswer === question.correct 
                                        ? 'bg-green-500 text-white transform scale-105' 
                                        : 'bg-red-500 text-white transform scale-105'
                                    : selectedAnswer === true && question.correct === false
                                        ? 'bg-green-200 border-2 border-green-500'
                                        : 'bg-red-500 hover:bg-red-600 text-white hover:transform hover:scale-105'
                            } ${selectedAnswer !== null ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                            <div className="flex flex-col items-center">
                                <div className="text-3xl mb-2">❌</div>
                                <div>TIDAK</div>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Result and Explanation */}
                {showResult && (
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <div className="text-center mb-4">
                            <div className="text-4xl mb-2">
                                {selectedAnswer === question.correct ? '🎉' : '😔'}
                            </div>
                            <h3 className={`text-xl font-bold ${
                                selectedAnswer === question.correct ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {selectedAnswer === question.correct ? 'Benar!' : 'Salah!'}
                            </h3>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                            <h4 className="font-semibold mb-2">Penjelasan:</h4>
                            <p className="text-gray-700">{question.explanation}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}