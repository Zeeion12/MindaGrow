const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

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

app.get('/api/users/streak', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT current_streak, longest_streak, last_activity_date FROM user_streaks WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({ current_streak: 0, longest_streak: 0, last_activity_date: null });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting user streak:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/daily-missions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        dm.*,
        COALESCE(udm.current_progress, 0) as current_progress,
        COALESCE(udm.is_completed, false) as is_completed,
        udm.completed_at
      FROM daily_missions dm
      LEFT JOIN user_daily_missions udm ON dm.id = udm.mission_id 
        AND udm.user_id = $1 AND udm.mission_date = $2
      WHERE dm.is_active = true
      ORDER BY dm.id
    `;
    
    const result = await pool.query(query, [userId, today]);
    
    res.json({
      success: true,
      missions: result.rows
    });
  } catch (error) {
    console.error('Error fetching daily missions:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/daily-missions/progress', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { missionType, progress = 1 } = req.body;
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    // Get active missions of this type
    const missionsQuery = `
      SELECT id, target_count, xp_reward, title 
      FROM daily_missions 
      WHERE mission_type = $1 AND is_active = true
    `;
    const missions = await client.query(missionsQuery, [missionType]);
    
    for (const mission of missions.rows) {
      // Update or insert user mission progress
      const upsertQuery = `
        INSERT INTO user_daily_missions (user_id, mission_id, current_progress, mission_date, is_completed, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (user_id, mission_id, mission_date)
        DO UPDATE SET 
          current_progress = LEAST(user_daily_missions.current_progress + $3, $7),
          is_completed = (user_daily_missions.current_progress + $3) >= $7,
          completed_at = CASE 
            WHEN (user_daily_missions.current_progress + $3) >= $7 AND user_daily_missions.completed_at IS NULL 
            THEN CURRENT_TIMESTAMP 
            ELSE user_daily_missions.completed_at 
          END
        RETURNING is_completed, current_progress
      `;
      
      const newProgress = Math.min(progress, mission.target_count);
      const isCompleted = newProgress >= mission.target_count;
      
      const result = await client.query(upsertQuery, [
        userId, mission.id, progress, today, isCompleted, 
        isCompleted ? new Date() : null, mission.target_count
      ]);
      
      // Award XP if mission just completed
      if (result.rows[0]?.is_completed && result.rows[0]?.current_progress >= mission.target_count) {
        await client.query(`
          UPDATE siswa 
          SET total_xp = total_xp + $1,
              current_level = FLOOR((total_xp + $1) / 100) + 1
          WHERE user_id = $2
        `, [mission.xp_reward, userId]);
        
        // Update weekly leaderboard
        await updateWeeklyLeaderboard(userId, mission.xp_reward, client);
        
        console.log(`Mission completed: ${mission.title} - ${mission.xp_reward} XP awarded`);
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Mission progress updated'
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating mission progress:', error);
    res.status(500).json({ message: 'Server error' });
  } finally {
    client.release();
  }
});

app.get('/api/leaderboard/weekly', authenticateToken, async (req, res) => {
  try {
    const weekStartDate = getWeekStartDate();
    
    const query = `
      SELECT 
        s.nama_lengkap,
        s.total_xp,
        COALESCE(wl.total_xp, 0) as weekly_xp,
        COALESCE(wl.games_played, 0) as games_played,
        COALESCE(wl.missions_completed, 0) as missions_completed,
        ROW_NUMBER() OVER (ORDER BY COALESCE(wl.total_xp, 0) DESC, s.total_xp DESC) as rank
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN weekly_leaderboard wl ON s.user_id = wl.user_id AND wl.week_start_date = $1
      WHERE u.role = 'siswa'
      ORDER BY weekly_xp DESC, s.total_xp DESC
      LIMIT 20
    `;
    
    const result = await pool.query(query, [weekStartDate]);
    
    res.json({
      success: true,
      leaderboard: result.rows,
      weekStartDate
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get overall leaderboard (all time)
app.get('/api/leaderboard/overall', authenticateToken, async (req, res) => {
  try {
    const query = `
      SELECT 
        s.nama_lengkap,
        s.total_xp,
        s.current_level,
        ROW_NUMBER() OVER (ORDER BY s.total_xp DESC) as rank
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      WHERE u.role = 'siswa'
      ORDER BY s.total_xp DESC
      LIMIT 20
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      leaderboard: result.rows
    });
  } catch (error) {
    console.error('Error fetching overall leaderboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

function getWeekStartDate() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek); // Start from Sunday
  startDate.setHours(0, 0, 0, 0);
  return startDate.toISOString().split('T')[0];
}

async function updateWeeklyLeaderboard(userId, xpGained, client) {
  const weekStartDate = getWeekStartDate();
  
  await client.query(`
    INSERT INTO weekly_leaderboard (user_id, week_start_date, total_xp, missions_completed)
    VALUES ($1, $2, $3, 1)
    ON CONFLICT (user_id, week_start_date)
    DO UPDATE SET 
      total_xp = weekly_leaderboard.total_xp + $3,
      missions_completed = weekly_leaderboard.missions_completed + 1,
      updated_at = CURRENT_TIMESTAMP
  `, [userId, weekStartDate, xpGained]);
}

app.get('/api/games/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user info and XP
    const userQuery = await pool.query(`
      SELECT s.nama_lengkap, s.total_xp, s.current_level 
      FROM siswa s 
      JOIN users u ON s.user_id = u.id 
      WHERE u.id = $1
    `, [userId]);
    
    // Get user streak
    const streakQuery = await pool.query(`
      SELECT current_streak, longest_streak 
      FROM user_streaks 
      WHERE user_id = $1
    `, [userId]);
    
    // Get game progress
    const gamesQuery = await pool.query(`
      SELECT g.*, COALESCE(ugp.completion_percentage, 0) as progress
      FROM games g
      LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ugp.user_id = $1
      WHERE g.is_active = true
      ORDER BY g.id
    `, [userId]);
    
    // Get daily missions
    const today = new Date().toISOString().split('T')[0];
    const missionsQuery = await pool.query(`
      SELECT dm.*, COALESCE(udm.current_progress, 0) as current_progress,
             COALESCE(udm.is_completed, false) as is_completed
      FROM daily_missions dm
      LEFT JOIN user_daily_missions udm ON dm.id = udm.mission_id 
        AND udm.user_id = $1 AND udm.mission_date = $2
      WHERE dm.is_active = true
      ORDER BY dm.id
    `, [userId, today]);
    
    // Get weekly leaderboard
    const weekStartDate = getWeekStartDate();
    const leaderboardQuery = await pool.query(`
      SELECT s.nama_lengkap, COALESCE(wl.total_xp, 0) as weekly_xp,
             ROW_NUMBER() OVER (ORDER BY COALESCE(wl.total_xp, 0) DESC) as rank
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN weekly_leaderboard wl ON s.user_id = wl.user_id AND wl.week_start_date = $1
      WHERE u.role = 'siswa'
      ORDER BY weekly_xp DESC
      LIMIT 10
    `, [weekStartDate]);
    
    const userData = userQuery.rows[0] || { nama_lengkap: '', total_xp: 0, current_level: 1 };
    const streakData = streakQuery.rows[0] || { current_streak: 0, longest_streak: 0 };
    
    res.json({
      success: true,
      user: userData,
      streak: streakData,
      games: gamesQuery.rows,
      dailyMissions: missionsQuery.rows,
      leaderboard: leaderboardQuery.rows
    });
    
  } catch (error) {
    console.error('Error fetching game dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;