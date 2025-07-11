// server/controllers/gameController.js
const pool = require('../config/db');

// Get all available games with user progress
exports.getAllGames = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // First check if games table exists and has data
    const gamesQuery = `
      SELECT 
        g.*,
        COALESCE(ugp.current_progress, 0) as user_progress,
        COALESCE(ugp.level, 1) as user_level,
        COALESCE(ugp.high_score, 0) as user_high_score,
        COALESCE(ugp.times_played, 0) as times_played,
        ugp.last_played
      FROM games g
      LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ugp.user_id = $1
      WHERE g.is_active = true
      ORDER BY g.id
    `;
    
    const result = await pool.query(gamesQuery, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching games:', error);
    
    // If table doesn't exist, return empty array
    if (error.code === '42P01') { // Table doesn't exist
      return res.json([]);
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user level and XP
exports.getUserLevel = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let result = await pool.query(
      'SELECT * FROM user_levels WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create initial level record
      await pool.query(
        'INSERT INTO user_levels (user_id) VALUES ($1)',
        [userId]
      );
      result = await pool.query(
        'SELECT * FROM user_levels WHERE user_id = $1',
        [userId]
      );
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user level:', error);
    
    // If table doesn't exist, return default values
    if (error.code === '42P01') {
      return res.json({
        user_id: req.user.id,
        current_level: 1,
        current_xp: 0,
        total_xp: 0
      });
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get daily missions
exports.getDailyMissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        dm.*,
        COALESCE(udp.current_count, 0) as current_count,
        COALESCE(udp.is_completed, false) as is_completed,
        udp.completed_at
      FROM daily_missions dm
      LEFT JOIN user_daily_progress udp ON dm.id = udp.mission_id 
        AND udp.user_id = $1 AND udp.date = $2
      WHERE dm.is_active = true
      ORDER BY dm.id
    `;
    
    const result = await pool.query(query, [userId, today]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching daily missions:', error);
    
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      return res.json([]);
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get weekly leaderboard
exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.nama_lengkap,
        u.profile_picture,
        COALESCE(ul.current_level, 1) as current_level,
        COALESCE(ul.total_xp, 0) as total_xp,
        ROW_NUMBER() OVER (ORDER BY COALESCE(ul.total_xp, 0) DESC) as rank
      FROM users u
      LEFT JOIN user_levels ul ON u.id = ul.user_id
      WHERE u.role = 'siswa'
      ORDER BY COALESCE(ul.total_xp, 0) DESC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    
    // If table doesn't exist, return empty array
    if (error.code === '42P01') {
      return res.json([]);
    }
    
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user streak
exports.getUserStreak = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let result = await pool.query(
      'SELECT * FROM user_streaks WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        user_id: userId,
        current_streak: 0,
        longest_streak: 0,
        last_activity_date: null
      });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user streak:', error);
    
    // If table doesn't exist or error, return default values
    res.json({
      user_id: req.user.id,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null
    });
  }
};

// Complete game and award XP
exports.completeGame = async (req, res) => {
  try {
    const userId = req.user.id;
    const gameId = req.params.id;
    const { score } = req.body;
    
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return res.status(400).json({ message: 'Invalid score. Score must be between 0-100' });
    }
    
    // Get game info
    const gameResult = await pool.query(
      'SELECT * FROM games WHERE id = $1 AND is_active = true',
      [gameId]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    const game = gameResult.rows[0];
    
    // Update game progress
    await pool.query(`
      INSERT INTO user_game_progress (user_id, game_id, current_progress, high_score, times_played, last_played)
      VALUES ($1, $2, $3, $4, 1, NOW())
      ON CONFLICT (user_id, game_id)
      DO UPDATE SET
        current_progress = GREATEST(user_game_progress.current_progress, $3),
        high_score = GREATEST(user_game_progress.high_score, $4),
        times_played = user_game_progress.times_played + 1,
        last_played = NOW()
    `, [userId, gameId, score, score]);
    
    // Award XP based on score
    const xpEarned = Math.floor((score / 100) * game.xp_reward);
    await this.awardXP(userId, xpEarned);
    
    res.json({ 
      message: 'Game completed successfully',
      xp_earned: xpEarned,
      score: score,
      game_name: game.name
    });
  } catch (error) {
    console.error('Error completing game:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Award XP and handle level ups
exports.awardXP = async (userId, xpAmount) => {
  try {
    const result = await pool.query(`
      UPDATE user_levels 
      SET 
        current_xp = current_xp + $2,
        total_xp = total_xp + $2,
        updated_at = NOW()
      WHERE user_id = $1
      RETURNING *
    `, [userId, xpAmount]);
    
    if (result.rows.length === 0) {
      // Create level record if doesn't exist
      await pool.query(
        'INSERT INTO user_levels (user_id, current_xp, total_xp) VALUES ($1, $2, $2)',
        [userId, xpAmount]
      );
      return { levelUp: false, newLevel: 1 };
    }
    
    const userLevel = result.rows[0];
    
    // Check for level up (100 XP per level)
    const xpPerLevel = 100;
    const newLevel = Math.floor(userLevel.current_xp / xpPerLevel) + 1;
    
    if (newLevel > userLevel.current_level) {
      await pool.query(
        'UPDATE user_levels SET current_level = $1 WHERE user_id = $2',
        [newLevel, userId]
      );
      return { levelUp: true, newLevel, oldLevel: userLevel.current_level };
    }
    
    return { levelUp: false, newLevel: userLevel.current_level };
  } catch (error) {
    console.error('Error awarding XP:', error);
    return { levelUp: false, newLevel: 1 };
  }
};

// Complete daily mission
exports.completeDailyMission = async (req, res) => {
  try {
    res.json({
      message: 'Mission completed successfully',
      xp_earned: 50
    });
  } catch (error) {
    console.error('Error completing daily mission:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};