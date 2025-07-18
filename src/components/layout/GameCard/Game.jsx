// src/components/layout/GameCard/Game.jsx
import { useNavigate } from 'react-router-dom';

export default function Game({ 
    title, 
    progress, 
    image, 
    gameId, 
    description, 
    difficulty, 
    stats,
    isCompleted = false,
    onGameComplete 
}) {
    const navigate = useNavigate();

    const getDifficultyColor = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'hard':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getDifficultyStars = (difficulty) => {
        switch (difficulty?.toLowerCase()) {
            case 'easy':
                return '⭐';
            case 'medium':
                return '⭐⭐';
            case 'hard':
                return '⭐⭐⭐';
            default:
                return '⭐⭐';
        }
    };

    const handlePlayGame = () => {
        // Navigate to specific game
        navigate(`/game/${gameId}`);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            {/* Game Image */}
            <div className="relative h-48 overflow-hidden">
                <img 
                    src={image} 
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
                
                {/* Difficulty Badge */}
                <div className="absolute top-3 right-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(difficulty)}`}>
                        {getDifficultyStars(difficulty)} {difficulty}
                    </span>
                </div>

                {/* Completion Badge */}
                {isCompleted && (
                    <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            ✅ Selesai
                        </span>
                    </div>
                )}

                {/* Not Started Badge */}
                {progress === 0 && (
                    <div className="absolute top-3 left-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                            🆕 Belum Dimulai
                        </span>
                    </div>
                )}
            </div>

            {/* Card Content */}
            <div className="p-6">
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {description}
                </p>

                {/* Stats */}
                <div className="space-y-3 mb-4">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Soal Benar:</span>
                        <span className="font-semibold">
                            {stats.correctAnswers}/{stats.totalQuestions}
                        </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm font-bold text-blue-600">
                                {Math.round(progress)}%
                            </span>
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div 
                                className={`h-3 rounded-full transition-all duration-500 ${
                                    isCompleted 
                                        ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                        : 'bg-gradient-to-r from-blue-400 to-blue-600'
                                }`}
                                style={{ width: `${Math.min(progress, 100)}%` }}
                            ></div>
                        </div>
                        
                        {/* Completion Label */}
                        {isCompleted && (
                            <div className="text-center text-green-600 text-xs font-medium mt-1">
                                ✨ SELESAI ✨
                            </div>
                        )}
                    </div>
                </div>

                {/* Play Button */}
                <button
                    onClick={handlePlayGame}
                    className={`w-full py-3 px-4 rounded-lg font-semibold text-white transition-all duration-300 flex items-center justify-center space-x-2 ${
                        isCompleted
                            ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-green-200'
                            : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-blue-200'
                    }`}
                >
                    <span className="text-lg">🎮</span>
                    <span>
                        {isCompleted ? 'Mainkan Lagi' : 'Mainkan'}
                    </span>
                </button>

                {/* Additional Info */}
                {stats.totalQuestions > 0 && (
                    <div className="mt-3 text-center text-xs text-gray-500">
                        Akurasi: {Math.round((stats.correctAnswers / stats.totalQuestions) * 100)}%
                    </div>
                )}
            </div>
        </div>
    );
}