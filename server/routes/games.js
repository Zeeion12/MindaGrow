// server/routes/games.js - FIXED VERSION
const express = require('express');
const jwt = require('jsonwebtoken');
const gameController = require('../controller/gameController');

const router = express.Router();

// Auth middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// ============================================
// GAME PROGRESS ROUTES
// ============================================

// GET /api/games/progress - Ambil progress semua game user
router.get('/progress', authenticateToken, gameController.getUserGameProgress);

// GET /api/games/progress/:gameId - Ambil progress game tertentu
router.get('/progress/:gameId', authenticateToken, (req, res) => {
    // For now, redirect to general progress
    gameController.getUserGameProgress(req, res);
});

// POST /api/games/progress/:gameId - Update progress setelah main game
router.post('/progress/:gameId', authenticateToken, gameController.updateGameProgress);

// ============================================
// STREAK ROUTES
// ============================================

// GET /api/games/streak - Ambil data streak user
router.get('/streak', authenticateToken, gameController.getUserStreak);

// ============================================
// LEVEL & XP ROUTES
// ============================================

// GET /api/games/level - Ambil level dan XP user
router.get('/level', authenticateToken, gameController.getUserLevel);

// ============================================
// DAILY MISSION ROUTES
// ============================================

// GET /api/games/daily-missions - Ambil daily missions user hari ini
router.get('/daily-missions', authenticateToken, gameController.getDailyMissions);

// ============================================
// LEADERBOARD ROUTES
// ============================================

// GET /api/games/leaderboard/weekly - Ambil weekly leaderboard
router.get('/leaderboard/weekly', authenticateToken, gameController.getWeeklyLeaderboard);

// GET /api/games/leaderboard/overall - Ambil overall leaderboard
router.get('/leaderboard/overall', authenticateToken, gameController.getOverallLeaderboard);

// ============================================
// GAME DATA ROUTES
// ============================================

// GET /api/games - Ambil daftar semua game
router.get('/', authenticateToken, gameController.getGames);

module.exports = router;