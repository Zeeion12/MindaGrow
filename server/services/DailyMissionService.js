// server/services/DailyMissionService.js
const pool = require('../config/database');

class DailyMissionService {
  // Reset daily missions setiap hari (call via cron job)
  static async resetDailyMissions() {
    try {
      console.log('Starting daily mission reset...');
      
      // Clear yesterday's progress
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      await pool.query(
        'DELETE FROM user_daily_progress WHERE date < $1',
        [yesterdayStr]
      );
      
      console.log('Daily missions reset completed');
    } catch (error) {
      console.error('Error resetting daily missions:', error);
    }
  }

  // Generate weekly leaderboard (call setiap Senin)
  static async updateWeeklyLeaderboard() {
    try {
      console.log('Updating weekly leaderboard...');
      await pool.query('SELECT generate_weekly_leaderboard()');
      console.log('Weekly leaderboard updated');
    } catch (error) {
      console.error('Error updating weekly leaderboard:', error);
    }
  }

  // Auto-complete missions berdasarkan aktivitas
  static async autoCompleteMissions(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check game-related missions
      const gameCount = await pool.query(`
        SELECT COUNT(*) as count
        FROM game_sessions 
        WHERE user_id = $1 AND DATE(session_end) = $2 AND is_completed = true
      `, [userId, today]);
      
      const gamesPlayed = parseInt(gameCount.rows[0].count);
      
      // Update "Play X games" missions
      await pool.query(`
        UPDATE user_daily_progress 
        SET current_count = $3
        WHERE user_id = $1 
        AND date = $2
        AND mission_id IN (
          SELECT id FROM daily_missions 
          WHERE mission_type = 'game' AND is_active = true
        )
      `, [userId, today, gamesPlayed]);
      
      // Check for high score achievements
      const highScores = await pool.query(`
        SELECT COUNT(*) as count
        FROM game_sessions 
        WHERE user_id = $1 AND DATE(session_end) = $2 
        AND is_completed = true AND score >= 80
      `, [userId, today]);
      
      const highScoreCount = parseInt(highScores.rows[0].count);
      
      // Update "Get high score" missions
      await pool.query(`
        UPDATE user_daily_progress 
        SET current_count = $3
        WHERE user_id = $1 
        AND date = $2
        AND mission_id IN (
          SELECT id FROM daily_missions 
          WHERE mission_type = 'high_score' AND is_active = true
        )
      `, [userId, today, highScoreCount]);
      
      // Auto-complete missions that reached target
      await pool.query('SELECT check_mission_completion($1)', [userId]);
      
    } catch (error) {
      console.error('Error auto-completing missions:', error);
    }
  }

  // Generate dynamic missions berdasarkan user behavior
  static async generatePersonalizedMissions(userId) {
    try {
      // Analyze user's favorite game type
      const favGameResult = await pool.query(`
        SELECT g.type, COUNT(*) as play_count
        FROM game_sessions gs
        JOIN games g ON gs.game_id = g.id
        WHERE gs.user_id = $1 AND gs.is_completed = true
        AND gs.session_end >= NOW() - INTERVAL '7 days'
        GROUP BY g.type
        ORDER BY play_count DESC
        LIMIT 1
      `, [userId]);
      
      // Analyze user's weak areas (low scores)
      const weakAreaResult = await pool.query(`
        SELECT g.type, AVG(gs.score) as avg_score
        FROM game_sessions gs
        JOIN games g ON gs.game_id = g.id
        WHERE gs.user_id = $1 AND gs.is_completed = true
        GROUP BY g.type
        HAVING AVG(gs.score) < 70
        ORDER BY avg_score ASC
        LIMIT 1
      `, [userId]);
      
      // Generate missions berdasarkan analysis
      const suggestions = [];
      
      if (favGameResult.rows.length > 0) {
        const favGame = favGameResult.rows[0];
        suggestions.push({
          title: `Master ${favGame.type.replace('_', ' ')}`,
          description: `Capai score 90+ dalam ${favGame.type} game`,
          target_type: 'score_in_game',
          target_count: 1,
          xp_reward: 100
        });
      }
      
      if (weakAreaResult.rows.length > 0) {
        const weakGame = weakAreaResult.rows[0];
        suggestions.push({
          title: `Improve ${weakGame.type.replace('_', ' ')} Skills`,
          description: `Mainkan ${weakGame.type} 5 kali untuk meningkatkan skill`,
          target_type: 'play_specific_game',
          target_count: 5,
          xp_reward: 75
        });
      }
      
      return suggestions;
    } catch (error) {
      console.error('Error generating personalized missions:', error);
      return [];
    }
  }

  // Streak maintenance
  static async updateAllUserStreaks() {
    try {
      console.log('Updating all user streaks...');
      
      const users = await pool.query(
        'SELECT id FROM users WHERE role = \'siswa\''
      );
      
      for (const user of users.rows) {
        // Check if user had activity today
        const today = new Date().toISOString().split('T')[0];
        const activityResult = await pool.query(`
          SELECT COUNT(*) as count
          FROM user_activity_log 
          WHERE user_id = $1 AND activity_date = $2
        `, [user.id, today]);
        
        const hasActivity = parseInt(activityResult.rows[0].count) > 0;
        
        if (!hasActivity) {
          // Break streak if no activity
          await pool.query(`
            UPDATE user_streaks 
            SET current_streak = 0
            WHERE user_id = $1
            AND last_activity_date < $2
          `, [user.id, today]);
        }
      }
      
      console.log('All user streaks updated');
    } catch (error) {
      console.error('Error updating user streaks:', error);
    }
  }
}

module.exports = DailyMissionService;