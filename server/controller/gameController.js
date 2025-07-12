// server/controller/gameController.js - BUAT FILE BARU
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// Update user streak function
async function updateUserStreak(userId) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`🔥 Updating streak for user ${userId} on ${today.toISOString()}`);
    
    // Check if user streak exists
    const streakResult = await client.query(
      'SELECT * FROM user_streaks WHERE user_id = $1',
      [userId]
    );
    
    if (streakResult.rows.length === 0) {
      // Create new streak
      await client.query(
        'INSERT INTO user_streaks (user_id, current_streak, longest_streak, last_activity_date, streak_start_date, is_active) VALUES ($1, 1, 1, $2, $2, true)',
        [userId, today]
      );
      console.log('✅ Created new streak for user');
      await client.query('COMMIT');
      return { newStreak: 1, wasUpdated: true };
    }
    
    const streak = streakResult.rows[0];
    let lastActivityDate = new Date(streak.last_activity_date);
    lastActivityDate.setHours(0, 0, 0, 0);
    
    console.log(`📅 Last activity: ${lastActivityDate.toISOString()}, Today: ${today.toISOString()}`);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // KUNCI: Cek apakah sudah main hari ini
    if (lastActivityDate.getTime() === today.getTime()) {
      // Sudah main hari ini, JANGAN update streak lagi, hanya aktifkan
      await client.query(
        'UPDATE user_streaks SET is_active = true WHERE user_id = $1',
        [userId]
      );
      console.log('⚡ Streak already updated today, just activated');
      await client.query('COMMIT');
      return { newStreak: streak.current_streak, wasUpdated: false };
    }
    
    if (lastActivityDate.getTime() === yesterday.getTime()) {
      // Kemarin main, hari ini main = consecutive day, increment streak
      const newStreak = streak.current_streak + 1;
      const longestStreak = Math.max(newStreak, streak.longest_streak);
      
      await client.query(
        'UPDATE user_streaks SET current_streak = $1, longest_streak = $2, last_activity_date = $3, is_active = true WHERE user_id = $4',
        [newStreak, longestStreak, today, userId]
      );
      console.log(`🚀 Streak incremented to ${newStreak}`);
      await client.query('COMMIT');
      return { newStreak: newStreak, wasUpdated: true };
    } else {
      // Streak broken atau gap lebih dari 1 hari, start new streak
      await client.query(
        'UPDATE user_streaks SET current_streak = 1, last_activity_date = $1, streak_start_date = $1, is_active = true WHERE user_id = $2',
        [today, userId]
      );
      console.log('🔄 Streak reset to 1');
      await client.query('COMMIT');
      return { newStreak: 1, wasUpdated: true };
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating user streak:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Get game progress
exports.getGameProgress = async (req, res) => {
  const userId = req.user.id;
  
  try {
    console.log(`📊 Getting game progress for user ${userId}`);
    
    const result = await pool.query(
      'SELECT * FROM game_progress WHERE user_id = $1',
      [userId]
    );
    
    const gameProgress = {};
    result.rows.forEach(row => {
      const percentage = row.total_questions > 0 ? 
        Math.min(Math.round((row.correct_answers / row.total_questions) * 100), 100) : 0;
      
      gameProgress[row.game_id] = {
        totalQuestions: row.total_questions,
        correctAnswers: row.correct_answers,
        percentage: percentage
      };
    });
    
    console.log('✅ Game progress retrieved:', gameProgress);
    res.json(gameProgress);
  } catch (error) {
    console.error('❌ Error getting game progress:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update game progress when completing a game
exports.updateGameProgress = async (req, res) => {
  const userId = req.user.id;
  const { gameId, correctAnswers, totalQuestions } = req.body;
  
  try {
    console.log(`🎮 Updating game progress:`, {
      userId,
      gameId,
      correctAnswers,
      totalQuestions
    });
    
    // Validate input
    if (!gameId || typeof correctAnswers !== 'number' || typeof totalQuestions !== 'number') {
      return res.status(400).json({ 
        message: 'Invalid input data',
        received: { gameId, correctAnswers, totalQuestions }
      });
    }
    
    // Update or insert game progress
    await pool.query(`
      INSERT INTO game_progress (user_id, game_id, total_questions, correct_answers, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, game_id)
      DO UPDATE SET 
        total_questions = game_progress.total_questions + $3,
        correct_answers = game_progress.correct_answers + $4,
        updated_at = CURRENT_TIMESTAMP
    `, [userId, gameId, totalQuestions, correctAnswers]);
    
    console.log('✅ Game progress updated in database');
    
    // Update streak HANYA SEKALI PER HARI
    const streakResult = await updateUserStreak(userId);
    
    console.log('✅ Streak update result:', streakResult);
    
    // Log activity
    await pool.query(
      'INSERT INTO activity_logs (user_id, activity_type, entity_type, entity_id) VALUES ($1, $2, $3, $4)',
      [userId, 'game_complete', 'game', gameId]
    );
    
    res.json({ 
      message: 'Game progress updated successfully',
      streakUpdated: streakResult.wasUpdated,
      currentStreak: streakResult.newStreak
    });
  } catch (error) {
    console.error('❌ Error updating game progress:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message 
    });
  }
};

module.exports = exports;