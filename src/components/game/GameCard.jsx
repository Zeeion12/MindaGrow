// src/components/game/GameCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const GameCard = ({ game, onGameComplete }) => {
  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  return (
    <Link to={`/game/${game.gameId || game.type}`} className="block">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
        <div className="relative">
          <img 
            src={game.image_url || '/images/default-game.jpg'} 
            alt={game.name}
            className="w-full h-48 object-cover"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x200/4F46E5/white?text=' + encodeURIComponent(game.name);
            }}
          />
          <div className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-full px-3 py-1">
            <span className="text-sm font-bold text-purple-600">
              Lv {game.user_level || 1}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 rounded-full px-3 py-1">
            <span className="text-sm font-medium text-gray-700">
              {game.user_progress || 0}%
            </span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-gray-800 mb-2 text-lg">{game.name}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{game.description}</p>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(game.user_progress || 0)}`}
              style={{ width: `${game.user_progress || 0}%` }}
            ></div>
          </div>
          
          {/* XP Reward */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Reward</span>
            <span className="text-sm font-medium text-yellow-600">+{game.xp_reward} XP</span>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-md text-center font-medium">
            {(game.user_progress || 0) > 0 ? 'Lanjutkan' : 'Mulai Bermain'}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default GameCard;