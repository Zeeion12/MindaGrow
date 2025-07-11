// src/components/game/Leaderboard.jsx
import React from 'react';

const Leaderboard = ({ leaderboard, currentUser }) => {
  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return '🏅';
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 2:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 3:
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const isCurrentUser = (user) => {
    return currentUser && user.id === currentUser.id;
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">🏆</span>
        <h3 className="text-lg font-semibold text-gray-800">Top Skor Mingguan</h3>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">📊</span>
          <p className="text-gray-500">Belum ada data leaderboard</p>
          <p className="text-sm text-gray-400 mt-2">Mulai bermain untuk masuk ranking!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((user, index) => {
            const rank = index + 1;
            const isCurrentUserEntry = isCurrentUser(user);
            
            return (
              <div 
                key={user.id || index}
                className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 ${
                  isCurrentUserEntry 
                    ? 'bg-blue-100 border-blue-300 ring-2 ring-blue-200' 
                    : getRankColor(rank)
                }`}
              >
                {/* Rank */}
                <div className="flex items-center justify-center w-8 h-8">
                  {rank <= 3 ? (
                    <span className="text-xl">{getRankIcon(rank)}</span>
                  ) : (
                    <span className="text-sm font-bold text-gray-600">#{rank}</span>
                  )}
                </div>

                {/* Profile Picture */}
                <div className="relative">
                  <img
                    src={user.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_lengkap || 'User')}&background=random`}
                    alt={user.nama_lengkap || 'User'}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama_lengkap || 'User')}&background=random`;
                    }}
                  />
                  {isCurrentUserEntry && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">•</span>
                    </div>
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className={`font-medium truncate ${
                      isCurrentUserEntry ? 'text-blue-700' : 'text-gray-800'
                    }`}>
                      {user.nama_lengkap || 'Anonymous'}
                      {isCurrentUserEntry && (
                        <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full ml-2">
                          Kamu
                        </span>
                      )}
                    </h4>
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-1">
                    <span className="text-sm text-gray-600">
                      Level {user.current_level || 1}
                    </span>
                    <span className="text-sm font-medium text-yellow-600">
                      {user.total_xp || 0} XP
                    </span>
                  </div>
                </div>

                {/* Rank Badge for Top 3 */}
                {rank <= 3 && (
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                    rank === 1 ? 'bg-yellow-200 text-yellow-800' :
                    rank === 2 ? 'bg-gray-200 text-gray-800' :
                    'bg-orange-200 text-orange-800'
                  }`}>
                    #{rank}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Current User Position (if not in top 10) */}
      {currentUser && !leaderboard.some(user => isCurrentUser(user)) && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Posisi kamu saat ini:</p>
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-center space-x-3">
                <img
                  src={currentUser.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.nama_lengkap || 'User')}&background=random`}
                  alt={currentUser.nama_lengkap}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <p className="text-sm font-medium text-blue-700">#{currentUser.rank || '?'}</p>
                  <p className="text-xs text-blue-600">{currentUser.total_xp || 0} XP</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Reset Info */}
      <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2">
          <span className="text-purple-500">📅</span>
          <span className="text-sm text-purple-700">
            Ranking direset setiap Senin pukul 00:00
          </span>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;