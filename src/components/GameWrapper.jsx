import React, { useState, useEffect } from 'react';
import axios from 'axios';

const GameWrapper = ({ children, gameId, gameName }) => {
  const [gameSession, setGameSession] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Start game session when component mounts
    startGameSession();
    setStartTime(Date.now());
    
    return () => {
      // Cleanup on unmount - end session if user quits without completing
      if (gameSession && startTime) {
        endGameSession(false, 0, { reason: 'quit' });
      }
    };
  }, []);

  const startGameSession = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await axios.post('http://localhost:5000/api/games/start-session', {
        gameId,
        gameName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setGameSession(response.data.sessionId);
      console.log('Game session started:', response.data.sessionId);
    } catch (error) {
      console.error('Error starting game session:', error);
      // Continue anyway - game can still be played without database tracking
    } finally {
      setIsLoading(false);
    }
  };

  const endGameSession = async (completed = true, score = 0, additionalData = {}) => {
    if (!gameSession || !startTime) {
      console.warn('No active game session to end');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const playTime = Math.floor((Date.now() - startTime) / 1000); // in seconds
      
      const payload = {
        sessionId: gameSession,
        gameId,
        completed,
        score,
        playTime,
        ...additionalData
      };

      console.log('Ending game session with data:', payload);

      const response = await axios.post('http://localhost:5000/api/games/complete-session', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Game session completed:', response.data);
      
      // Show XP gained notification if successful
      if (response.data.success && response.data.xpGained > 0) {
        showXPNotification(response.data.xpGained);
      }

      setGameSession(null);
      setStartTime(null);
      
      return response.data;
    } catch (error) {
      console.error('Error ending game session:', error);
      // Don't throw error - let game finish normally
      return null;
    }
  };

  const showXPNotification = (xpGained) => {
    // Create a simple XP notification
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-weight: bold;
      z-index: 9999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">⭐</span>
        <span>+${xpGained} XP Earned!</span>
      </div>
    `;

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
          style.parentNode.removeChild(style);
        }
      }, 300);
    }, 3000);
  };

  // Show loading state while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Mempersiapkan permainan...</p>
        </div>
      </div>
    );
  }

  // Clone the children element and pass the endGameSession function as props
  return React.cloneElement(children, { 
    onGameComplete: endGameSession,
    gameId: gameId,
    sessionId: gameSession
  });
};

export default GameWrapper;