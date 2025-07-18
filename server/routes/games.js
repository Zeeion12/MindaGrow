// server/routes/games.js
const express = require('express');
const jwt = require('jsonwebtoken');
const gameController = require('../controller/gameController');

const router = express.Router();

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Akses ditolak' });
  
  jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid' });
    req.user = user;
    next();
  });
};

// Get user's game progress
router.get('/progress', authenticateToken, gameController.getGameProgress);

// Update game progress after playing (supports both endpoints for compatibility)
router.post('/progress', authenticateToken, gameController.updateGameProgress);
router.post('/complete', authenticateToken, gameController.updateGameProgress);

// Get user streak data
router.get('/streak', authenticateToken, gameController.getUserStreak);

// Get daily missions
router.get('/daily-missions', authenticateToken, gameController.getDailyMissions);

// Get leaderboard (weekly or overall)
router.get('/leaderboard', authenticateToken, gameController.getLeaderboard);

// Get user level info
router.get('/level', authenticateToken, gameController.getUserLevel);

module.exports = router;