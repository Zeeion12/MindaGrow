// server/controller/userController.js - PASTIKAN METHOD INI ADA
exports.getUserStreak = async (req, res) => {
  const userId = req.user.id;
  
  try {
    console.log(`🔥 Getting streak for user ${userId}`);
    
    const result = await pool.query(
      'SELECT current_streak, longest_streak, last_activity_date, is_active FROM user_streaks WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      console.log('📭 No streak data found, returning defaults');
      return res.json({ 
        current_streak: 0, 
        longest_streak: 0, 
        is_active: false,
        last_activity_date: null 
      });
    }
    
    const streak = result.rows[0];
    console.log('✅ Streak data retrieved:', streak);
    
    // Check if streak should be deactivated (setelah jam 12 malam)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastActivity = new Date(streak.last_activity_date);
    lastActivity.setHours(0, 0, 0, 0);
    
    const isActiveToday = lastActivity.getTime() === today.getTime();
    
    // Update is_active status jika berbeda dari database
    if (streak.is_active !== isActiveToday) {
      await pool.query(
        'UPDATE user_streaks SET is_active = $1 WHERE user_id = $2',
        [isActiveToday, userId]
      );
      streak.is_active = isActiveToday;
      console.log(`🔄 Updated streak active status to ${isActiveToday}`);
    }
    
    res.json(streak);
  } catch (error) {
    console.error('❌ Error getting user streak:', error);
    res.status(500).json({ message: 'Server error' });
  }
};