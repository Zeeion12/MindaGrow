// src/components/game/StreakDisplay.jsx
import React from 'react';

const StreakDisplay = ({ streak }) => {
  if (!streak) {
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

  const getStreakLevel = (streakCount) => {
    if (streakCount >= 30) return { level: 'Master', color: 'purple', emoji: '👑' };
    if (streakCount >= 21) return { level: 'Expert', color: 'indigo', emoji: '🔥' };
    if (streakCount >= 14) return { level: 'Advanced', color: 'blue', emoji: '⚡' };
    if (streakCount >= 7) return { level: 'Intermediate', color: 'green', emoji: '🌟' };
    if (streakCount >= 3) return { level: 'Beginner', color: 'yellow', emoji: '✨' };
    return { level: 'Starter', color: 'gray', emoji: '🌱' };
  };

  const getStreakMessage = (streakCount) => {
    if (streakCount === 0) return "Mulai streak pertamamu!";
    if (streakCount === 1) return "Hari pertama! Terus lanjutkan!";
    if (streakCount < 7) return "Kamu dalam jalur yang baik!";
    if (streakCount < 14) return "Streak yang hebat! Pertahankan!";
    if (streakCount < 30) return "Luar biasa! Kamu konsisten!";
    return "Wow! Kamu adalah master consistency!";
  };

  const currentStreak = streak.current_streak || 0;
  const longestStreak = streak.longest_streak || 0;
  const streakInfo = getStreakLevel(currentStreak);

  // Calculate days until next milestone
  const nextMilestone = currentStreak < 3 ? 3 : 
                       currentStreak < 7 ? 7 : 
                       currentStreak < 14 ? 14 : 
                       currentStreak < 21 ? 21 : 
                       currentStreak < 30 ? 30 : 
                       Math.ceil((currentStreak + 1) / 10) * 10;
  
  const daysToNextMilestone = nextMilestone - currentStreak;

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">🔥</span>
        <h3 className="text-lg font-semibold text-gray-800">Streak Api Harian</h3>
      </div>

      {/* Current Streak Display */}
      <div className="text-center mb-4">
        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full bg-${streakInfo.color}-100 border-4 border-${streakInfo.color}-200 mb-3`}>
          <span className="text-3xl">{streakInfo.emoji}</span>
        </div>
        
        <h4 className={`text-3xl font-bold text-${streakInfo.color}-600 mb-1`}>
          {currentStreak}
        </h4>
        <p className="text-gray-600 text-sm">Hari berturut-turut</p>
        
        <div className={`mt-2 inline-block px-3 py-1 rounded-full text-xs font-medium bg-${streakInfo.color}-100 text-${streakInfo.color}-700`}>
          {streakInfo.level} Level
        </div>
      </div>

      {/* Streak Message */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <p className="text-center text-gray-700 text-sm">
          {getStreakMessage(currentStreak)}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-lg font-bold text-orange-600">{longestStreak}</div>
          <div className="text-xs text-gray-500">Streak Terpanjang</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-600">{daysToNextMilestone}</div>
          <div className="text-xs text-gray-500">Hari ke Milestone</div>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      {currentStreak < 30 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress ke {nextMilestone} hari</span>
            <span>{currentStreak}/{nextMilestone}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`bg-gradient-to-r from-${streakInfo.color}-400 to-${streakInfo.color}-600 h-2 rounded-full transition-all duration-500`}
              style={{ width: `${(currentStreak / nextMilestone) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Required */}
      {currentStreak === 0 || !streak.last_activity_date || 
       new Date(streak.last_activity_date).toDateString() !== new Date().toDateString() ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-red-500">⚠️</span>
            <div>
              <p className="text-sm text-red-700 font-medium">
                {currentStreak === 0 ? 'Mulai streak baru!' : 'Jangan putus streakmu!'}
              </p>
              <p className="text-xs text-red-600">
                Mainkan salah satu game untuk melanjutkan streak
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center space-x-2">
            <span className="text-green-500">✅</span>
            <div>
              <p className="text-sm text-green-700 font-medium">
                Streak hari ini sudah terpenuhi!
              </p>
              <p className="text-xs text-green-600">
                Kembali besok untuk melanjutkan
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Streak Tips */}
      {currentStreak > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start space-x-2">
            <span className="text-blue-500">💡</span>
            <div>
              <p className="text-sm text-blue-700 font-medium">Tips menjaga streak:</p>
              <ul className="text-xs text-blue-600 mt-1 space-y-1">
                <li>• Mainkan minimal 1 game setiap hari</li>
                <li>• Set reminder harian di ponselmu</li>
                <li>• Ajak teman untuk berkompetisi</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakDisplay;