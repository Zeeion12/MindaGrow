// src/components/layout/GameCard/Game.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Game({ 
    title, 
    progress, 
    image, 
    gameId, 
    description, 
    difficulty,
    stats,
    isCompleted,
    onGameComplete,
    gameInfo
}) {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);

    // Difficulty color mapping
    const getDifficultyColor = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'easy': return 'bg-green-500';
            case 'medium': return 'bg-yellow-500';
            case 'hard': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Difficulty stars
    const getDifficultyStars = (diff) => {
        switch (diff?.toLowerCase()) {
            case 'easy': return '⭐';
            case 'medium': return '⭐⭐';
            case 'hard': return '⭐⭐⭐';
            default: return '⭐';
        }
    };

    const handleGameFinish = async (gameResult) => {
        try {
            // Call parent's handleGameComplete function
            if (onGameComplete) {
                await onGameComplete(gameId, gameResult);
            }
            
            // Navigate back to main game UI
            navigate('/games');
        } catch (error) {
            console.error('Error finishing game:', error);
        }
    };

    const handleGameClick = () => {
        navigate(`/games/${gameId}`);
    };

    const progressPercentage = Math.min(progress || 0, 100);
    const correctAnswers = stats?.correctAnswers || 0;
    const totalQuestions = stats?.totalQuestions || 0;
    const timesPlayed = stats?.timesPlayed || 0;
    const totalXpEarned = stats?.totalXpEarned || 0;
    const bestScore = stats?.bestScore || 0;

    return (
        <div 
            className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 cursor-pointer
                ${isHovered ? 'transform scale-105 shadow-xl' : ''}
                ${isCompleted ? 'ring-2 ring-green-400' : ''}
            `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={handleGameClick}
        >
            {/* Game Image */}
            <div className="relative h-48 overflow-hidden">
                <img 
                    src={image} 
                    alt={title}
                    className={`w-full h-full object-cover transition-transform duration-300
                        ${isHovered ? 'scale-110' : 'scale-100'}
                    `}
                />
                
                {/* Status Badge */}
                <div className="absolute top-3 left-3">
                    {isCompleted ? (
                        <span className="bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                            ✅ Selesai
                        </span>
                    ) : timesPlayed > 0 ? (
                        <span className="bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                            🎮 Dalam Progress
                        </span>
                    ) : (
                        <span className="bg-gray-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                            🆕 Belum Dimulai
                        </span>
                    )}
                </div>

                {/* Difficulty Badge */}
                <div className="absolute top-3 right-3">
                    <span className={`${getDifficultyColor(difficulty)} text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg`}>
                        {getDifficultyStars(difficulty)} {difficulty}
                    </span>
                </div>

                {/* XP Badge */}
                {totalXpEarned > 0 && (
                    <div className="absolute bottom-3 right-3">
                        <span className="bg-purple-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-lg">
                            +{totalXpEarned} XP
                        </span>
                    </div>
                )}
            </div>

            {/* Game Content */}
            <div className="p-6">
                {/* Title */}
                <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {description}
                </p>

                {/* Stats Row */}
                <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                    <span>Soal Benar: {correctAnswers}/{gameInfo?.totalQuestions || totalQuestions}</span>
                    {timesPlayed > 0 && (
                        <span>Dimainkan: {timesPlayed}x</span>
                    )}
                </div>

                {/* Progress Section */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            {isCompleted ? '🏆 Selesai' : 'Progress'}
                        </span>
                        <span className="text-sm font-semibold text-gray-800">
                            {Math.round(progressPercentage)}%
                        </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`h-full transition-all duration-500 ease-out
                                ${isCompleted 
                                    ? 'bg-gradient-to-r from-green-400 to-green-600' 
                                    : progressPercentage > 0 
                                        ? 'bg-gradient-to-r from-blue-400 to-blue-600'
                                        : 'bg-gray-300'
                                }
                            `}
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    
                    {/* Completion Label */}
                    {isCompleted && (
                        <div className="text-center mt-2">
                            <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">
                                🎉 100% Complete!
                            </span>
                        </div>
                    )}
                </div>

                {/* Additional Stats for Completed Games */}
                {isCompleted && bestScore > 0 && (
                    <div className="mb-4 p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                        <div className="text-xs text-yellow-800 text-center">
                            🏆 Skor Terbaik: {bestScore}
                        </div>
                    </div>
                )}

                {/* Potential XP Info */}
                {!isCompleted && gameInfo && (
                    <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-xs text-blue-800 text-center">
                            💎 Potensi XP: {gameInfo.maxXpReward} + {gameInfo.completionBonusXp} (bonus)
                        </div>
                    </div>
                )}

                {/* Play Button */}
                <button 
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2
                        ${isCompleted 
                            ? 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg' 
                            : progressPercentage > 0
                                ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg'
                        }
                    `}
                    onClick={handleGameClick}
                >
                    <span>🎮</span>
                    <span>
                        {isCompleted 
                            ? 'Mainkan Lagi' 
                            : progressPercentage > 0 
                                ? 'Lanjutkan' 
                                : 'Mainkan'
                        }
                    </span>
                </button>

                {/* Game Info Footer */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{gameInfo?.totalQuestions || 10} soal</span>
                        <span>Max {gameInfo?.maxXpReward || 25} XP</span>
                    </div>
                </div>
            </div>
        </div>
    );
}