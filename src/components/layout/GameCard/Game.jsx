import { Link } from 'react-router-dom';

export default function Game({ 
    title, 
    progress, 
    image, 
    gameId, 
    description, 
    difficulty, 
    stats 
}) {
    // Pastikan progress tidak melebihi 100%
    const safeProgress = Math.min(Number(progress) || 0, 100);
    
    // Determine status berdasarkan progress
    const getStatus = () => {
        if (safeProgress >= 100) return 'Selesai';
        if (safeProgress > 0) return 'Berlanjut';
        return 'Belum Dimulai';
    };
    
    const getStatusColor = () => {
        if (safeProgress >= 100) return 'text-green-600';
        if (safeProgress > 0) return 'text-blue-600';
        return 'text-gray-600';
    };

    const getDifficultyColor = () => {
        switch(difficulty?.toLowerCase()) {
            case 'easy': return 'bg-green-100 text-green-600';
            case 'medium': return 'bg-yellow-100 text-yellow-600';
            case 'hard': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getDifficultyIcon = () => {
        switch(difficulty?.toLowerCase()) {
            case 'easy': return '⭐';
            case 'medium': return '⭐⭐';
            case 'hard': return '⭐⭐⭐';
            default: return '⭐';
        }
    };

    return (
        <Link to={`/game/${gameId}`} className="block">
            <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-lg 
            transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl
            cursor-pointer group bg-white">
                
                {/* Game Image */}
                <div className="relative h-48 w-full">
                    <div className="absolute inset-0 bg-black/30 z-10" />
                    <img
                        src={image || "https://via.placeholder.com/400x200"}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Difficulty Badge */}
                    <div className="absolute top-3 right-3 z-20">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor()}`}>
                            {getDifficultyIcon()} {difficulty}
                        </span>
                    </div>

                    {/* Status Badge */}
                    <div className="absolute top-3 left-3 z-20">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium bg-white/90 ${getStatusColor()}`}>
                            {getStatus()}
                        </span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Title */}
                    <div className="mb-3">
                        <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
                        {description && (
                            <p className="text-sm text-gray-600 line-clamp-2">{description}</p>
                        )}
                    </div>

                    {/* Stats */}
                    {stats && (
                        <div className="mb-3 text-sm text-gray-600">
                            <div className="flex justify-between items-center">
                                <span>Soal Benar:</span>
                                <span className="font-medium">{stats.correctAnswers}/{stats.totalQuestions}</span>
                            </div>
                        </div>
                    )}

                    {/* Progress Bar */}
                    <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Progress</span>
                            <span className="text-sm font-bold text-gray-800">{safeProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                                className={`h-2.5 rounded-full transition-all duration-500 ${
                                    safeProgress >= 100 
                                        ? 'bg-gradient-to-r from-green-400 to-green-500' 
                                        : 'bg-gradient-to-r from-blue-400 to-blue-500'
                                }`}
                                style={{ width: `${safeProgress}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200">
                        {safeProgress >= 100 ? '🎉 Main Lagi' : '🎮 Mainkan'}
                    </button>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
        </Link>
    );
}