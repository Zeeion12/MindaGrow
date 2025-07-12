// server/index.js - Tambahkan routes game
const gameController = require('./controller/gameController');

// Game routes
app.get('/api/games/progress', authenticateToken, gameController.getGameProgress);
app.post('/api/games/complete', authenticateToken, gameController.updateGameProgress);
app.get('/api/users/streak', authenticateToken, userController.getUserStreak);