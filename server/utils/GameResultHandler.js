// src/utils/GameResultHandler.js
class GameResultHandler {
  static async saveGameResult(gameData) {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`/api/games/${gameData.gameId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          score: gameData.score,
          totalTime: gameData.totalTime,
          hintsUsed: gameData.hintsUsed || 0,
          moves: gameData.moves || 0,
          difficulty: gameData.difficulty || 1,
          metadata: gameData.metadata || {}
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save game result');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error saving game result:', error);
      throw error;
    }
  }

  static async updateMissionProgress(missionType, count = 1) {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch('/api/games/missions/progress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mission_type: missionType,
          increment: count
        })
      });
    } catch (error) {
      console.error('Error updating mission progress:', error);
    }
  }

  static calculateScore(gameType, gameData) {
    switch (gameType) {
      case 'pattern_puzzle':
        return this.calculatePatternScore(gameData);
      case 'yes_no':
        return this.calculateYesNoScore(gameData);
      case 'maze':
        return this.calculateMazeScore(gameData);
      default:
        return 0;
    }
  }

  static calculatePatternScore(data) {
    const { correctAnswers, totalQuestions, timeLeft, difficulty } = data;
    const baseScore = (correctAnswers / totalQuestions) * 100;
    const timeBonus = timeLeft > 0 ? (timeLeft / 20) * 10 : 0;
    const difficultyMultiplier = difficulty || 1;
    
    return Math.round(baseScore + timeBonus) * difficultyMultiplier;
  }

  static calculateYesNoScore(data) {
    const { correctAnswers, totalQuestions, avgTimePerQuestion } = data;
    const baseScore = (correctAnswers / totalQuestions) * 100;
    const speedBonus = avgTimePerQuestion < 10 ? 20 : avgTimePerQuestion < 15 ? 10 : 0;
    
    return Math.round(baseScore + speedBonus);
  }

  static calculateMazeScore(data) {
    const { completed, moves, timeElapsed, hintsUsed, difficulty } = data;
    if (!completed) return 0;
    
    const baseScore = 100;
    const timeBonus = Math.max(0, 30 - Math.floor(timeElapsed / 1000));
    const moveBonus = Math.max(0, 50 - moves);
    const hintPenalty = hintsUsed * 5;
    const difficultyMultiplier = difficulty || 1;
    
    return Math.round((baseScore + timeBonus + moveBonus - hintPenalty) * difficultyMultiplier);
  }

  static showResultModal(gameResult) {
    return new Promise((resolve) => {
      // Create modal element
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4 text-center">
          <div class="text-4xl mb-4">${gameResult.score >= 80 ? '🎉' : gameResult.score >= 60 ? '👍' : '📚'}</div>
          <h3 class="text-xl font-bold mb-2">Game Selesai!</h3>
          <p class="text-gray-600 mb-4">Score: ${gameResult.score}/100</p>
          <p class="text-green-600 font-semibold mb-4">+${gameResult.xp_earned} XP</p>
          <button id="close-modal" class="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600">
            Tutup
          </button>
        </div>
      `;

      document.body.appendChild(modal);

      const closeButton = modal.querySelector('#close-modal');
      closeButton.onclick = () => {
        document.body.removeChild(modal);
        resolve();
      };

      modal.onclick = (e) => {
        if (e.target === modal) {
          document.body.removeChild(modal);
          resolve();
        }
      };
    });
  }
}

export default GameResultHandler;