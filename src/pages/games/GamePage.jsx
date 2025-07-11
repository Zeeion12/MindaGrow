// src/pages/game/GamePage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import GameCard from '../../components/game/GameCard';
import LevelDisplay from '../../components/game/LevelDisplay';
import DailyMissions from '../../components/game/DailyMissions';
import Leaderboard from '../../components/game/Leaderboard';
import StreakDisplay from '../../components/game/StreakDisplay';

const GamePage = () => {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [userLevel, setUserLevel] = useState(null);
  const [dailyMissions, setDailyMissions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [userStreak, setUserStreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchGameData();
  }, []);

  const fetchGameData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Fetch data with individual error handling
      const fetchWithFallback = async (url, fallback = []) => {
        try {
          const response = await fetch(url, { headers });
          if (response.ok) {
            return await response.json();
          }
          console.warn(`Failed to fetch ${url}:`, response.status);
          return fallback;
        } catch (error) {
          console.warn(`Error fetching ${url}:`, error);
          return fallback;
        }
      };

      // Fetch all game-related data with fallbacks
      const [gamesData, levelData, missionsData, leaderboardData, streakData] = await Promise.all([
        fetchWithFallback('/api/games', []),
        fetchWithFallback('/api/games/level', { current_level: 1, current_xp: 0, total_xp: 0 }),
        fetchWithFallback('/api/games/daily-missions', []),
        fetchWithFallback('/api/games/leaderboard', []),
        fetchWithFallback('/api/games/streak', { current_streak: 0, longest_streak: 0 })
      ]);

      setGames(gamesData || []);
      setUserLevel(levelData);
      setDailyMissions(missionsData || []);
      setLeaderboard(leaderboardData || []);
      setUserStreak(streakData);
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchGameData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat data game...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <p className="text-red-600 mb-4">Gagal memuat data game</p>
            <button 
              onClick={handleRefresh}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      {/* Header with brain logo */}
      <div className="bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 rounded-lg p-6 mb-6 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-4xl">🧠</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Asah logikamu lewat permainan seru dan menantang!
              </h1>
              <p className="text-gray-600 mt-1">
                Kumpulkan XP, naik level, dan bersaing dengan teman-teman!
              </p>
            </div>
          </div>
          
          {/* Quick Stats */}
          <div className="hidden md:flex items-center space-x-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {userLevel?.current_level || 1}
              </div>
              <div className="text-sm text-gray-600">Level</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {userLevel?.total_xp || 0}
              </div>
              <div className="text-sm text-gray-600">Total XP</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {userStreak?.current_streak || 0}
              </div>
              <div className="text-sm text-gray-600">Streak</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Game Section */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Lanjutkan Progress Game-mu!
            </h2>
            <button
              onClick={handleRefresh}
              className="text-blue-600 hover:text-blue-800 transition-colors text-sm flex items-center space-x-1"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
          
          {/* Games Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {games.length > 0 ? (
              games.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onGameComplete={fetchGameData}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <span className="text-4xl mb-4 block">🎮</span>
                <p className="text-gray-500">Belum ada game tersedia</p>
                <p className="text-sm text-gray-400 mt-2">Game sedang dalam pengembangan</p>
              </div>
            )}
          </div>

          {/* Level and Daily Missions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <LevelDisplay userLevel={userLevel} />
            <DailyMissions 
              missions={dailyMissions} 
              onMissionComplete={fetchGameData}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <StreakDisplay streak={userStreak} />
          <Leaderboard leaderboard={leaderboard} currentUser={user} />
          
          {/* Achievement Preview */}
          <div className="bg-white rounded-lg p-6 shadow-md">
            <div className="flex items-center space-x-3 mb-4">
              <span className="text-2xl">🏆</span>
              <h3 className="text-lg font-semibold text-gray-800">Achievements</h3>
            </div>
            <div className="text-center py-4">
              <span className="text-3xl mb-2 block">🔒</span>
              <p className="text-gray-500 text-sm">Coming Soon!</p>
              <p className="text-xs text-gray-400 mt-1">
                Sistem achievement sedang dikembangkan
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Tips */}
      <div className="mt-8 bg-white rounded-lg p-6 shadow-md">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 Tips Gaming</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <span className="text-blue-500">🎯</span>
              <span>Mainkan game setiap hari untuk menjaga streak</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-green-500">📈</span>
              <span>Selesaikan daily mission untuk bonus XP</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-purple-500">🏆</span>
              <span>Bersaing dengan teman di leaderboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePage;