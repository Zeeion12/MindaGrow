// server/controllers/gameController.js
const pool = require('../config/database');

// Get all available games with user progress
exports.getAllGames = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting games for user:', userId);
    
    const gamesQuery = `
      SELECT 
        g.id,
        g.name,
        g.description,
        g.type,
        g.difficulty_level,
        g.xp_reward,
        g.image_url,
        g.is_active,
        COALESCE(ugp.current_progress, 0) as user_progress,
        COALESCE(ugp.level, 1) as user_level,
        COALESCE(ugp.high_score, 0) as user_high_score,
        COALESCE(ugp.times_played, 0) as times_played,
        ugp.last_played,
        -- Map game types to frontend gameId
        CASE 
          WHEN g.type = 'pattern_puzzle' THEN 'patternpuzzle'
          WHEN g.type = 'yes_no' THEN 'yesorno'
          WHEN g.type = 'maze' THEN 'mazechallenge'
          ELSE g.type
        END as gameId
      FROM games g
      LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ugp.user_id = $1
      WHERE g.is_active = true
      ORDER BY g.id
    `;
    
    const result = await pool.query(gamesQuery, [userId]);
    console.log('✅ Games fetched from database:', result.rows.length);
    
    // Add default image if missing
    const gamesWithImages = result.rows.map(game => ({
      ...game,
      image_url: game.image_url || `/assets/GameImage/Game${game.id}.png`
    }));
    
    res.json(gamesWithImages);
  } catch (error) {
    console.error('❌ Error fetching games:', error.message);
    
    // Fallback data
    const fallbackGames = [
      {
        id: 1,
        name: "Tebak Pola (Pattern Puzzle)",
        description: "Asah kemampuan pengenalan pola",
        type: "pattern_puzzle",
        difficulty_level: 2,
        xp_reward: 25,
        user_progress: 0,
        user_level: 1,
        user_high_score: 0,
        times_played: 0,
        gameId: "patternpuzzle",
        image_url: "/assets/GameImage/Game1.png"
      },
      {
        id: 2,
        name: "Yes or No",
        description: "Game pertanyaan cepat",
        type: "yes_no",
        difficulty_level: 1,
        xp_reward: 20,
        user_progress: 0,
        user_level: 1,
        user_high_score: 0,
        times_played: 0,
        gameId: "yesorno",
        image_url: "/assets/GameImage/Game2.png"
      },
      {
        id: 3,
        name: "Maze Challenge",
        description: "Tantangan labirin",
        type: "maze",
        difficulty_level: 3,
        xp_reward: 35,
        user_progress: 0,
        user_level: 1,
        user_high_score: 0,
        times_played: 0,
        gameId: "mazechallenge",
        image_url: "/assets/GameImage/Game3.png"
      }
    ];
    
    console.log('Returning fallback games');
    res.json(fallbackGames);
  }
};

// Get specific game by ID
exports.getGameById = async (req, res) => {
  try {
    const gameId = req.params.id;
    const userId = req.user.id;
    console.log('Getting game:', gameId, 'for user:', userId);
    
    const query = `
      SELECT 
        g.*,
        COALESCE(ugp.current_progress, 0) as user_progress,
        COALESCE(ugp.level, 1) as user_level,
        COALESCE(ugp.high_score, 0) as user_high_score,
        COALESCE(ugp.times_played, 0) as times_played,
        ugp.last_played
      FROM games g
      LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ugp.user_id = $2
      WHERE g.id = $1 AND g.is_active = true
    `;
    
    const result = await pool.query(query, [gameId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error fetching game:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Complete game and save session
exports.completeGame = async (req, res) => {
  try {
    const userId = req.user.id;
    const gameId = parseInt(req.params.id);
    const { 
      score, 
      totalTime, 
      hintsUsed = 0, 
      moves = 0, 
      correctAnswers = 0, 
      totalQuestions = 0,
      metadata = {} 
    } = req.body;
    
    console.log('🎮 Game completion:', { userId, gameId, score, totalTime });
    
    // Validation
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return res.status(400).json({ message: 'Invalid score. Must be between 0-100' });
    }
    
    // Get game info for XP calculation
    let gameXP = 20; // default
    try {
      const gameResult = await pool.query('SELECT xp_reward FROM games WHERE id = $1', [gameId]);
      if (gameResult.rows.length > 0) {
        gameXP = gameResult.rows[0].xp_reward;
      }
    } catch (gameError) {
      console.log('⚠️ Could not get game XP, using default');
    }
    
    try {
      // Save game session
      const sessionResult = await pool.query(`
        INSERT INTO game_sessions (
          user_id, game_id, session_end, score, max_score, 
          duration_seconds, questions_answered, correct_answers, 
          hints_used, moves_made, metadata, is_completed
        )
        VALUES ($1, $2, NOW(), $3, 100, $4, $5, $6, $7, $8, $9, true)
        RETURNING id
      `, [
        userId, gameId, score, Math.floor(totalTime / 1000), 
        totalQuestions, correctAnswers, hintsUsed, moves, JSON.stringify(metadata)
      ]);

      console.log('✅ Game session saved:', sessionResult.rows[0].id);
      
      // Calculate XP earned based on performance
      const performanceMultiplier = score / 100;
      const xpEarned = Math.round(gameXP * performanceMultiplier);
      
      // Update user progress
      try {
        await pool.query(`
          INSERT INTO user_game_progress (user_id, game_id, current_progress, high_score, times_played, last_played)
          VALUES ($1, $2, $3, $4, 1, NOW())
          ON CONFLICT (user_id, game_id)
          DO UPDATE SET
            current_progress = GREATEST(user_game_progress.current_progress, $3),
            high_score = GREATEST(user_game_progress.high_score, $4),
            times_played = user_game_progress.times_played + 1,
            last_played = NOW()
        `, [userId, gameId, Math.min(100, score), score]);
        
        console.log('✅ User progress updated');
      } catch (progressError) {
        console.log('⚠️ Could not update user progress:', progressError.message);
      }

      // Award XP and handle level up
      try {
        // Get current level data
        let currentLevel = 1, currentXP = 0, totalXP = 0;
        
        const levelResult = await pool.query('SELECT * FROM user_levels WHERE user_id = $1', [userId]);
        
        if (levelResult.rows.length > 0) {
          const level = levelResult.rows[0];
          currentLevel = level.current_level;
          currentXP = level.current_xp;
          totalXP = level.total_xp;
        }
        
        // Calculate new values
        const newCurrentXP = currentXP + xpEarned;
        const newTotalXP = totalXP + xpEarned;
        const newLevel = Math.floor(newCurrentXP / 100) + 1;
        
        // Update or insert user level
        await pool.query(`
          INSERT INTO user_levels (user_id, current_level, current_xp, total_xp)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id)
          DO UPDATE SET
            current_level = $2,
            current_xp = $3,
            total_xp = $4,
            updated_at = NOW()
        `, [userId, newLevel, newCurrentXP, newTotalXP]);
        
        console.log('✅ XP awarded:', xpEarned, '| New Level:', newLevel, '| Total XP:', newTotalXP);
        
        // Check if leveled up
        const leveledUp = newLevel > currentLevel;
        
        res.json({ 
          message: 'Game completed successfully',
          xp_earned: xpEarned,
          score: score,
          session_id: sessionResult.rows[0].id,
          level_up: leveledUp,
          new_level: newLevel,
          total_xp: newTotalXP
        });
        
      } catch (xpError) {
        console.log('⚠️ Could not award XP:', xpError.message);
        res.json({ 
          message: 'Game completed (no XP awarded)',
          xp_earned: 0,
          score: score,
          session_id: sessionResult.rows[0].id
        });
      }

    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
      
      // Fallback response
      const xpEarned = Math.round(gameXP * (score / 100));
      
      res.json({ 
        message: 'Game completed (fallback mode)',
        xp_earned: xpEarned,
        score: score,
        session_id: 'fallback'
      });
    }
    
  } catch (error) {
    console.error('❌ Error completing game:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get user level and XP
exports.getUserLevel = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting level for user:', userId);
    
    let result = await pool.query(
      'SELECT * FROM user_levels WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      console.log('Creating initial level record for user:', userId);
      
      try {
        await pool.query(
          'INSERT INTO user_levels (user_id, current_level, current_xp, total_xp) VALUES ($1, 1, 0, 0)',
          [userId]
        );
        
        result = await pool.query(
          'SELECT * FROM user_levels WHERE user_id = $1',
          [userId]
        );
      } catch (insertError) {
        console.error('Error creating user level:', insertError.message);
        return res.json({
          user_id: userId,
          current_level: 1,
          current_xp: 0,
          total_xp: 0
        });
      }
    }
    
    console.log('✅ User level data:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error getting user level:', error.message);
    
    // Fallback response
    res.json({
      user_id: req.user.id,
      current_level: 1,
      current_xp: 0,
      total_xp: 0
    });
  }
};

// Get user game progress
exports.getUserGameProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting game progress for user:', userId);
    
    const result = await pool.query(`
      SELECT 
        ugp.*,
        g.name as game_name,
        g.type as game_type
      FROM user_game_progress ugp
      JOIN games g ON ugp.game_id = g.id
      WHERE ugp.user_id = $1
      ORDER BY ugp.last_played DESC
    `, [userId]);
    
    console.log('✅ Game progress fetched:', result.rows.length, 'records');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error getting user game progress:', error.message);
    res.json([]);
  }
};

// Get daily missions
exports.getDailyMissions = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    console.log('Getting daily missions for user:', userId, 'date:', today);
    
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
    console.log('✅ Daily missions fetched:', result.rows.length);
    
    // Auto-update mission progress based on game sessions
    for (const mission of result.rows) {
      if (!mission.is_completed && mission.mission_type === 'game') {
        try {
          const gameCount = await pool.query(`
            SELECT COUNT(*) as count
            FROM game_sessions 
            WHERE user_id = $1 AND DATE(session_end) = $2 AND is_completed = true
          `, [userId, today]);
          
          const currentCount = parseInt(gameCount.rows[0].count);
          
          if (currentCount > mission.current_count) {
            await pool.query(`
              INSERT INTO user_daily_progress (user_id, mission_id, current_count, target_count, date)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (user_id, mission_id, date)
              DO UPDATE SET current_count = GREATEST(user_daily_progress.current_count, $3)
            `, [userId, mission.id, currentCount, mission.target_count, today]);
            
            mission.current_count = currentCount;
          }
        } catch (updateError) {
          console.log('⚠️ Could not update mission progress:', updateError.message);
        }
      }
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching daily missions:', error.message);
    
    // Fallback missions
    const fallbackMissions = [
      {
        id: 1,
        title: "Complete 2 games",
        description: "Selesaikan 2 game hari ini",
        mission_type: "game",
        target_count: 2,
        current_count: 0,
        xp_reward: 40,
        is_completed: false
      },
      {
        id: 2,
        title: "Get high score",
        description: "Capai score di atas 80",
        mission_type: "high_score",
        target_count: 1,
        current_count: 0,
        xp_reward: 50,
        is_completed: false
      },
      {
        id: 3,
        title: "Play consistently",
        description: "Bermain game setiap hari",
        mission_type: "daily_play",
        target_count: 1,
        current_count: 0,
        xp_reward: 30,
        is_completed: false
      }
    ];
    
    console.log('Returning fallback missions');
    res.json(fallbackMissions);
  }
};

// Complete daily mission
exports.completeDailyMission = async (req, res) => {
  try {
    const userId = req.user.id;
    const missionId = req.params.id;
    const today = new Date().toISOString().split('T')[0];
    
    console.log('Completing mission:', missionId, 'for user:', userId);
    
    // Get mission details
    const missionResult = await pool.query(
      'SELECT * FROM daily_missions WHERE id = $1 AND is_active = true',
      [missionId]
    );
    
    if (missionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Mission not found' });
    }
    
    const mission = missionResult.rows[0];
    
    // Check current progress
    const progressResult = await pool.query(
      'SELECT * FROM user_daily_progress WHERE user_id = $1 AND mission_id = $2 AND date = $3',
      [userId, missionId, today]
    );
    
    let currentProgress = progressResult.rows[0];
    
    if (!currentProgress) {
      return res.status(400).json({ message: 'Mission progress not found' });
    }
    
    if (currentProgress.is_completed) {
      return res.status(400).json({ message: 'Mission already completed today' });
    }
    
    if (currentProgress.current_count < currentProgress.target_count) {
      return res.status(400).json({ 
        message: 'Mission requirements not met',
        current: currentProgress.current_count,
        required: currentProgress.target_count
      });
    }
    
    // Complete mission
    await pool.query(`
      UPDATE user_daily_progress 
      SET is_completed = true, completed_at = NOW()
      WHERE user_id = $1 AND mission_id = $2 AND date = $3
    `, [userId, missionId, today]);
    
    // Award XP
    try {
      await pool.query(`
        UPDATE user_levels 
        SET 
          current_xp = current_xp + $2,
          total_xp = total_xp + $2,
          current_level = GREATEST(1, ((current_xp + $2) / 100) + 1),
          updated_at = NOW()
        WHERE user_id = $1
      `, [userId, mission.xp_reward]);
      
      console.log('✅ Mission completed, XP awarded:', mission.xp_reward);
    } catch (xpError) {
      console.log('⚠️ Could not award mission XP:', xpError.message);
    }
    
    res.json({
      message: 'Mission completed successfully',
      xp_earned: mission.xp_reward,
      mission_title: mission.title
    });
  } catch (error) {
    console.error('❌ Error completing mission:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get weekly leaderboard
exports.getWeeklyLeaderboard = async (req, res) => {
  try {
    console.log('Getting weekly leaderboard');
    
    const query = `
      SELECT 
        u.id,
        u.nama_lengkap,
        u.profile_picture,
        COALESCE(ul.current_level, 1) as current_level,
        COALESCE(ul.total_xp, 0) as total_xp,
        ROW_NUMBER() OVER (ORDER BY COALESCE(ul.total_xp, 0) DESC, u.nama_lengkap ASC) as rank
      FROM users u
      LEFT JOIN user_levels ul ON u.id = ul.user_id
      WHERE u.role = 'siswa'
      ORDER BY COALESCE(ul.total_xp, 0) DESC, u.nama_lengkap ASC
      LIMIT 10
    `;
    
    const result = await pool.query(query);
    console.log('✅ Leaderboard fetched:', result.rows.length, 'entries');
    res.json(result.rows);
  } catch (error) {
    console.error('❌ Error fetching leaderboard:', error.message);
    
    // Fallback leaderboard
    try {
      const usersQuery = `
        SELECT id, nama_lengkap, profile_picture
        FROM users 
        WHERE role = 'siswa'
        ORDER BY nama_lengkap
        LIMIT 10
      `;
      const usersResult = await pool.query(usersQuery);
      
      const fallbackLeaderboard = usersResult.rows.map((user, index) => ({
        id: user.id,
        nama_lengkap: user.nama_lengkap || `Student ${user.id}`,
        profile_picture: user.profile_picture,
        current_level: Math.floor(Math.random() * 3) + 1,
        total_xp: Math.floor(Math.random() * 200) + 50,
        rank: index + 1
      }));
      
      console.log('Returning fallback leaderboard with real users');
      res.json(fallbackLeaderboard);
    } catch (userError) {
      console.log('Could not get users, returning static fallback');
      res.json([
        { id: 1, nama_lengkap: "Top Student", profile_picture: null, current_level: 3, total_xp: 150, rank: 1 },
        { id: 2, nama_lengkap: "Good Student", profile_picture: null, current_level: 2, total_xp: 100, rank: 2 }
      ]);
    }
  }
};

// Get user streak
exports.getUserStreak = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Getting streak for user:', userId);
    
    let result = await pool.query(
      'SELECT * FROM user_streaks WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      console.log('Creating initial streak record for user:', userId);
      
      try {
        await pool.query(
          'INSERT INTO user_streaks (user_id, current_streak, longest_streak) VALUES ($1, 0, 0)',
          [userId]
        );
        
        result = await pool.query(
          'SELECT * FROM user_streaks WHERE user_id = $1',
          [userId]
        );
      } catch (insertError) {
        console.error('Error creating user streak:', insertError.message);
        return res.json({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null
        });
      }
    }
    
    // Check if user has activity today
    const today = new Date().toISOString().split('T')[0];
    try {
      const activityResult = await pool.query(`
        SELECT COUNT(*) as count
        FROM game_sessions 
        WHERE user_id = $1 AND DATE(session_end) = $2 AND is_completed = true
      `, [userId, today]);
      
      const hasActivityToday = parseInt(activityResult.rows[0].count) > 0;
      
      // Update streak if needed
      if (hasActivityToday) {
        const lastActivity = result.rows[0].last_activity_date;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (!lastActivity || lastActivity.toISOString().split('T')[0] === yesterdayStr) {
          // Consecutive day or first activity
          const newStreak = (result.rows[0].current_streak || 0) + 1;
          const longestStreak = Math.max(newStreak, result.rows[0].longest_streak || 0);
          
          await pool.query(`
            UPDATE user_streaks 
            SET current_streak = $1, longest_streak = $2, last_activity_date = $3
            WHERE user_id = $4
          `, [newStreak, longestStreak, today, userId]);
          
          result.rows[0].current_streak = newStreak;
          result.rows[0].longest_streak = longestStreak;
          result.rows[0].last_activity_date = today;
        }
      }
    } catch (streakError) {
      console.log('⚠️ Could not update streak:', streakError.message);
    }
    
    console.log('✅ User streak data:', result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('❌ Error getting user streak:', error.message);
    
    // Fallback response
    res.json({
      user_id: req.user.id,
      current_streak: 0,
      longest_streak: 0,
      last_activity_date: null
    });
  }
};