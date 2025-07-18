// server/controller/gameController.js
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// Get user's game progress
exports.getGameProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        gp.game_id,
        gp.total_questions,
        gp.correct_answers,
        gp.percentage,
        gp.is_completed,
        gp.last_played_at,
        g.name,
        g.description,
        g.difficulty,
        g.max_questions
      FROM game_progress gp
      JOIN games g ON gp.game_id = g.game_id
      WHERE gp.user_id = $1
    `, [userId]);
    
    // Convert array to object with game_id as keys
    const progressData = {};
    result.rows.forEach(row => {
      progressData[row.game_id] = {
        totalQuestions: row.total_questions,
        correctAnswers: row.correct_answers,
        percentage: parseFloat(row.percentage),
        isCompleted: row.is_completed,
        lastPlayedAt: row.last_played_at,
        gameInfo: {
          name: row.name,
          description: row.description,
          difficulty: row.difficulty,
          maxQuestions: row.max_questions
        }
      };
    });
    
    res.json({ success: true, data: progressData });
  } catch (error) {
    console.error('Error getting game progress:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update game progress after playing
exports.updateGameProgress = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.user.id;
    const { gameId, questionsAnswered, correctAnswers, sessionData } = req.body;
    
    if (!gameId || questionsAnswered === undefined || correctAnswers === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'gameId, questionsAnswered, and correctAnswers are required' 
      });
    }
    
    // Get game info
    const gameResult = await client.query(
      'SELECT * FROM games WHERE game_id = $1',
      [gameId]
    );
    
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Game not found' });
    }
    
    const game = gameResult.rows[0];
    
    // Check if progress exists
    const existingProgress = await client.query(
      'SELECT * FROM game_progress WHERE user_id = $1 AND game_id = $2',
      [userId, gameId]
    );
    
    let totalQuestions, totalCorrect, newPercentage;
    
    if (existingProgress.rows.length === 0) {
      // Create new progress
      totalQuestions = questionsAnswered;
      totalCorrect = correctAnswers;
      newPercentage = questionsAnswered > 0 ? (correctAnswers / questionsAnswered) * 100 : 0;
      
      await client.query(`
        INSERT INTO game_progress (
          user_id, game_id, total_questions, correct_answers, percentage, 
          is_completed, last_played_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
      `, [
        userId, gameId, totalQuestions, totalCorrect, newPercentage,
        newPercentage >= 100
      ]);
    } else {
      // Update existing progress
      const existing = existingProgress.rows[0];
      totalQuestions = existing.total_questions + questionsAnswered;
      totalCorrect = existing.correct_answers + correctAnswers;
      newPercentage = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;
      
      // Cap at 100%
      newPercentage = Math.min(newPercentage, 100);
      
      await client.query(`
        UPDATE game_progress 
        SET 
          total_questions = $1,
          correct_answers = $2,
          percentage = $3,
          is_completed = $4,
          last_played_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $5 AND game_id = $6
      `, [
        totalQuestions, totalCorrect, newPercentage, 
        newPercentage >= 100, userId, gameId
      ]);
    }
    
    // Calculate XP earned
    let xpEarned = correctAnswers * 10; // Base XP per correct answer
    
    // Bonus XP for completion
    if (newPercentage >= 100) {
      xpEarned += 50; // Completion bonus
    }
    
    // Difficulty multiplier
    switch (game.difficulty.toLowerCase()) {
      case 'easy':
        xpEarned = Math.floor(xpEarned * 1);
        break;
      case 'medium':
        xpEarned = Math.floor(xpEarned * 1.2);
        break;
      case 'hard':
        xpEarned = Math.floor(xpEarned * 1.5);
        break;
    }
    
    // Create game session record
    await client.query(`
      INSERT INTO game_sessions (
        user_id, game_id, questions_answered, correct_answers, 
        xp_earned, completed_at, session_data
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6)
    `, [userId, gameId, questionsAnswered, correctAnswers, xpEarned, JSON.stringify(sessionData || {})]);
    
    // Update user level and XP
    await client.query('SELECT update_user_level($1, $2)', [userId, xpEarned]);
    
    // Update streak
    await updateUserStreak(client, userId);
    
    // Update weekly ranking
    await updateWeeklyRanking(client, userId, xpEarned);
    
    // Update daily missions
    await updateDailyMissions(client, userId, 'play_game');
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      data: {
        totalQuestions,
        correctAnswers: totalCorrect,
        percentage: newPercentage,
        isCompleted: newPercentage >= 100,
        xpEarned
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating game progress:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  } finally {
    client.release();
  }
};

// Get user streak data
exports.getUserStreak = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT 
        current_streak, 
        longest_streak, 
        is_active,
        last_activity_date,
        EXTRACT(EPOCH FROM (CURRENT_DATE + INTERVAL '1 day' - CURRENT_TIMESTAMP)) as seconds_until_reset
      FROM user_streaks 
      WHERE user_id = $1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      // Create initial streak record
      await pool.query(
        'INSERT INTO user_streaks (user_id) VALUES ($1)',
        [userId]
      );
      
      return res.json({ 
        success: true, 
        data: { 
          current_streak: 0, 
          longest_streak: 0, 
          is_active: false,
          seconds_until_reset: 86400 // 24 hours
        } 
      });
    }
    
    const streak = result.rows[0];
    res.json({ 
      success: true, 
      data: {
        current_streak: streak.current_streak,
        longest_streak: streak.longest_streak,
        is_active: streak.is_active,
        seconds_until_reset: Math.max(0, streak.seconds_until_reset || 0)
      }
    });
    
  } catch (error) {
    console.error('Error getting user streak:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get daily missions
exports.getDailyMissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    
    const result = await pool.query(`
      SELECT 
        dm.id,
        dm.mission_type,
        dm.title,
        dm.description,
        dm.target_count,
        dm.xp_reward,
        dm.icon,
        COALESCE(udm.current_progress, 0) as current_progress,
        COALESCE(udm.is_completed, false) as is_completed,
        udm.completed_at
      FROM daily_missions dm
      LEFT JOIN user_daily_missions udm ON (
        dm.id = udm.mission_id 
        AND udm.user_id = $1 
        AND udm.mission_date = $2
      )
      WHERE dm.is_active = true
      ORDER BY dm.id
    `, [userId, today]);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getting daily missions:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { type = 'weekly' } = req.query;
    
    let query, params = [];
    
    if (type === 'weekly') {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      query = `
        SELECT 
          u.id,
          s.nama_lengkap as name,
          COALESCE(wr.weekly_xp, 0) as total_xp,
          COALESCE(wr.games_played, 0) as games_played,
          ROW_NUMBER() OVER (ORDER BY COALESCE(wr.weekly_xp, 0) DESC) as rank
        FROM users u
        LEFT JOIN weekly_rankings wr ON (
          u.id = wr.user_id 
          AND wr.week_start_date = $1
        )
        WHERE u.role = 'student'
        ORDER BY total_xp DESC, u.name ASC
        LIMIT 20
      `;
      params = [weekStartStr];
    } else {
      query = `
        SELECT 
          u.id,
          s.nama_lengkap as name,
          COALESCE(ul.total_xp, 0) as total_xp,
          COALESCE(ul.current_level, 1) as level,
          (
            SELECT COUNT(*) 
            FROM game_sessions gs 
            WHERE gs.user_id = u.id
          ) as games_played,
          ROW_NUMBER() OVER (ORDER BY COALESCE(ul.total_xp, 0) DESC) as rank
        FROM users u
        LEFT JOIN user_levels ul ON u.id = ul.user_id
        WHERE u.role = 'student'
        ORDER BY total_xp DESC, u.name ASC
        LIMIT 20
      `;
    }
    
    const result = await pool.query(query, params);
    
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get user level info
exports.getUserLevel = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT 
        current_level,
        current_xp,
        total_xp,
        xp_to_next_level
      FROM user_levels 
      WHERE user_id = $1
    `, [userId]);
    
    if (result.rows.length === 0) {
      // Create initial level record
      await pool.query(
        'INSERT INTO user_levels (user_id) VALUES ($1)',
        [userId]
      );
      
      return res.json({ 
        success: true, 
        data: { 
          current_level: 1, 
          current_xp: 0, 
          total_xp: 0,
          xp_to_next_level: 100
        } 
      });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error getting user level:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Helper functions
async function updateUserStreak(client, userId) {
  const today = new Date().toISOString().split('T')[0];
  
  // Check current streak
  const streakResult = await client.query(
    'SELECT * FROM user_streaks WHERE user_id = $1',
    [userId]
  );
  
  if (streakResult.rows.length === 0) {
    // Create new streak
    await client.query(`
      INSERT INTO user_streaks (
        user_id, current_streak, longest_streak, is_active, 
        last_activity_date, streak_start_date
      ) VALUES ($1, 1, 1, true, $2, $2)
    `, [userId, today]);
    return;
  }
  
  const streak = streakResult.rows[0];
  const lastActivity = streak.last_activity_date ? 
    new Date(streak.last_activity_date).toISOString().split('T')[0] : null;
  
  if (lastActivity === today) {
    // Already played today, just make sure it's active
    await client.query(
      'UPDATE user_streaks SET is_active = true WHERE user_id = $1',
      [userId]
    );
    return;
  }
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  
  if (lastActivity === yesterdayStr) {
    // Continue streak
    const newStreak = streak.current_streak + 1;
    const longestStreak = Math.max(newStreak, streak.longest_streak);
    
    await client.query(`
      UPDATE user_streaks 
      SET 
        current_streak = $1,
        longest_streak = $2,
        is_active = true,
        last_activity_date = $3
      WHERE user_id = $4
    `, [newStreak, longestStreak, today, userId]);
  } else {
    // Reset streak
    await client.query(`
      UPDATE user_streaks 
      SET 
        current_streak = 1,
        is_active = true,
        last_activity_date = $1,
        streak_start_date = $1
      WHERE user_id = $2
    `, [today, userId]);
  }
}

async function updateWeeklyRanking(client, userId, xpGained) {
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Monday
  const weekStartStr = weekStart.toISOString().split('T')[0];
  
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekEndStr = weekEnd.toISOString().split('T')[0];
  
  // Check if record exists
  const existingResult = await client.query(
    'SELECT * FROM weekly_rankings WHERE user_id = $1 AND week_start_date = $2',
    [userId, weekStartStr]
  );
  
  if (existingResult.rows.length === 0) {
    // Create new record
    await client.query(`
      INSERT INTO weekly_rankings (
        user_id, week_start_date, week_end_date, weekly_xp, games_played
      ) VALUES ($1, $2, $3, $4, 1)
    `, [userId, weekStartStr, weekEndStr, xpGained]);
  } else {
    // Update existing record
    await client.query(`
      UPDATE weekly_rankings 
      SET 
        weekly_xp = weekly_xp + $1,
        games_played = games_played + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND week_start_date = $3
    `, [xpGained, userId, weekStartStr]);
  }
}

async function updateDailyMissions(client, userId, missionType) {
  const today = new Date().toISOString().split('T')[0];
  
  // Get mission
  const missionResult = await client.query(
    'SELECT * FROM daily_missions WHERE mission_type = $1 AND is_active = true',
    [missionType]
  );
  
  if (missionResult.rows.length === 0) return;
  
  const mission = missionResult.rows[0];
  
  // Check user progress
  const progressResult = await client.query(`
    SELECT * FROM user_daily_missions 
    WHERE user_id = $1 AND mission_id = $2 AND mission_date = $3
  `, [userId, mission.id, today]);
  
  if (progressResult.rows.length === 0) {
    // Create new progress
    const isCompleted = 1 >= mission.target_count;
    await client.query(`
      INSERT INTO user_daily_missions (
        user_id, mission_id, current_progress, is_completed, 
        completed_at, mission_date
      ) VALUES ($1, $2, 1, $3, $4, $5)
    `, [
      userId, mission.id, isCompleted, 
      isCompleted ? new Date() : null, today
    ]);
    
    if (isCompleted) {
      // Award XP
      await client.query(`
        UPDATE user_levels 
        SET total_xp = total_xp + $1, current_xp = current_xp + $1
        WHERE user_id = $2
      `, [mission.xp_reward, userId]);
      
      // Update user level
      await client.query('SELECT update_user_level($1, $2)', [userId, mission.xp_reward]);
    }
  }
}