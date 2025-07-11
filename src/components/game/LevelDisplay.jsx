// src/components/game/LevelDisplay.jsx
import React from 'react';

const LevelDisplay = ({ userLevel }) => {
  if (!userLevel) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-md">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  // Calculate XP needed for next level (100 XP per level)
  const xpPerLevel = 100;
  const currentLevelXp = userLevel.current_xp % xpPerLevel;
  const xpToNextLevel = xpPerLevel - currentLevelXp;
  const progressPercentage = (currentLevelXp / xpPerLevel) * 100;

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center space-x-4 mb-4">
        {/* XP Icon */}
        <div className="bg-blue-100 rounded-full p-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">XP</span>
          </div>
        </div>
        
        {/* Level Info */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Level Siswa</h3>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-blue-600">Lv {userLevel.current_level}</span>
            <span className="text-sm text-gray-500">
              ({userLevel.total_xp} Total XP)
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress ke Level {userLevel.current_level + 1}</span>
          <span>{currentLevelXp}/{xpPerLevel} XP</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Next Level Info */}
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">
          {xpToNextLevel} XP lagi untuk level up
        </span>
        <div className="flex items-center space-x-1">
          <span className="text-yellow-500">⭐</span>
          <span className="text-gray-600">Keep going!</span>
        </div>
      </div>

      {/* Level Benefits (Optional) */}
      {userLevel.current_level >= 5 && (
        <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-500">🏆</span>
            <span className="text-sm text-yellow-700 font-medium">
              {userLevel.current_level >= 10 ? 'Master Player!' : 'Intermediate Player!'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelDisplay;