// src/components/game/DailyMissions.jsx
import React from 'react';

const DailyMissions = ({ missions, onMissionComplete }) => {
  const handleCompleteMission = async (missionId) => {
    try {
      const response = await fetch(`/api/games/daily-missions/${missionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Mission completed! You earned ${result.xp_earned} XP!`);
        onMissionComplete();
      } else {
        throw new Error('Failed to complete mission');
      }
    } catch (error) {
      console.error('Error completing mission:', error);
      alert('Terjadi kesalahan saat menyelesaikan misi');
    }
  };

  const getMissionIcon = (type) => {
    switch (type) {
      case 'quiz':
        return '📝';
      case 'video':
        return '📹';
      case 'practice':
        return '💪';
      default:
        return '🎯';
    }
  };

  const getProgressColor = (current, target) => {
    const percentage = (current / target) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">🎯</span>
        <h3 className="text-lg font-semibold text-gray-800">Daily Mission</h3>
      </div>

      {missions.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-4xl mb-4 block">🎉</span>
          <p className="text-gray-500">Semua misi hari ini sudah selesai!</p>
          <p className="text-sm text-gray-400 mt-2">Kembali besok untuk misi baru</p>
        </div>
      ) : (
        <div className="space-y-4">
          {missions.map((mission) => {
            const progressPercentage = (mission.current_count / mission.target_count) * 100;
            const isCompleted = mission.is_completed;

            return (
              <div 
                key={mission.id} 
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{getMissionIcon(mission.mission_type)}</span>
                    <div>
                      <h4 className={`font-medium ${isCompleted ? 'text-green-700' : 'text-gray-800'}`}>
                        {mission.title}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">{mission.description}</p>
                    </div>
                  </div>
                  
                  {isCompleted && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <span className="text-lg">✅</span>
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isCompleted ? 'text-green-600' : 'text-gray-600'}>
                      Progress: {mission.current_count}/{mission.target_count}
                    </span>
                    <span className="text-yellow-600 font-medium">+{mission.xp_reward} XP</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(mission.current_count, mission.target_count)}`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Action Button */}
                {!isCompleted && (
                  <button
                    onClick={() => handleCompleteMission(mission.id)}
                    disabled={mission.current_count < mission.target_count}
                    className={`w-full py-2 px-4 rounded-md transition-colors duration-200 ${
                      mission.current_count >= mission.target_count
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {mission.current_count >= mission.target_count 
                      ? 'Klaim Reward' 
                      : `${mission.target_count - mission.current_count} lagi`
                    }
                  </button>
                )}

                {isCompleted && (
                  <div className="text-center py-2">
                    <span className="text-green-600 font-medium">✨ Mission Completed! ✨</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Daily Reset Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <span className="text-blue-500">ℹ️</span>
          <span className="text-sm text-blue-700">
            Misi akan direset setiap hari pada pukul 00:00
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyMissions;