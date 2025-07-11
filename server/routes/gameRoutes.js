// server/routes/gameRoutes.js
const express = require('express');
const router = express.Router();
const gameController = require('../controller/gameController');
const auth = require('../middleware/auth');

// Game routes
router.get('/', auth, gameController.getAllGames);
router.get('/level', auth, gameController.getUserLevel);
router.get('/daily-missions', auth, gameController.getDailyMissions);
router.get('/leaderboard', auth, gameController.getWeeklyLeaderboard);
router.get('/streak', auth, gameController.getUserStreak);

// Game actions
router.post('/:id/complete', auth, gameController.completeGame);
router.post('/daily-missions/:id/complete', auth, gameController.completeDailyMission);

module.exports = router;