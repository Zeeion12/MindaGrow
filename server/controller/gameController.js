// server/controller/gameController.js - FIXED for Siswa Table Structure
const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// ============================================
// HELPER FUNCTIONS
// ============================================

// Hitung detik sampai reset streak (12 malam)
const getSecondsUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    return Math.floor((midnight - now) / 1000);
};

// Hitung start dan end date untuk minggu ini
const getWeekDates = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    return { weekStart: monday, weekEnd: sunday };
};

// ============================================
// GAME PROGRESS CONTROLLERS
// ============================================

// Ambil progress semua game user
exports.getUserGameProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // FIXED: Proper JOIN with games table
        const query = `
            SELECT 
                ugp.*,
                g.title,
                g.description,
                g.difficulty,
                g.total_questions as game_total_questions
            FROM user_game_progress ugp
            JOIN games g ON ugp.game_id = g.game_id
            WHERE ugp.user_id = $1
            ORDER BY ugp.last_played_at DESC
        `;
        
        const result = await pool.query(query, [userId]);
        
        // Transform data ke format yang diharapkan frontend
        const progressData = {};
        result.rows.forEach(row => {
            progressData[row.game_id] = {
                totalQuestions: row.total_questions_answered,
                correctAnswers: row.correct_answers,
                wrongAnswers: row.wrong_answers,
                percentage: parseFloat(row.completion_percentage),
                isCompleted: row.is_completed,
                timesPlayed: row.times_played,
                lastPlayedAt: row.last_played_at,
                totalXpEarned: row.total_xp_earned,
                bestScore: row.best_score
            };
        });
        
        res.json({ data: progressData });
    } catch (error) {
        console.error('Error fetching user game progress:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Ambil progress game tertentu
exports.getGameProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { gameId } = req.params;
        
        const query = `
            SELECT 
                ugp.*,
                g.title,
                g.description,
                g.difficulty,
                g.total_questions as game_total_questions
            FROM user_game_progress ugp
            JOIN games g ON ugp.game_id = g.game_id
            WHERE ugp.user_id = $1 AND ugp.game_id = $2
        `;
        
        const result = await pool.query(query, [userId, gameId]);
        
        if (result.rows.length === 0) {
            return res.json({ 
                data: {
                    totalQuestions: 0,
                    correctAnswers: 0,
                    wrongAnswers: 0,
                    percentage: 0,
                    isCompleted: false,
                    timesPlayed: 0,
                    totalXpEarned: 0,
                    bestScore: 0
                }
            });
        }
        
        const row = result.rows[0];
        res.json({
            data: {
                totalQuestions: row.total_questions_answered,
                correctAnswers: row.correct_answers,
                wrongAnswers: row.wrong_answers,
                percentage: parseFloat(row.completion_percentage),
                isCompleted: row.is_completed,
                timesPlayed: row.times_played,
                lastPlayedAt: row.last_played_at,
                totalXpEarned: row.total_xp_earned,
                bestScore: row.best_score
            }
        });
    } catch (error) {
        console.error('Error fetching game progress:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update progress setelah main game
exports.updateGameProgress = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const userId = req.user.id;
        const { gameId } = req.params;
        const { 
            questionsAnswered, 
            correctAnswers, 
            wrongAnswers, 
            score, 
            timeSpent,
            isCompleted = false 
        } = req.body;
        
        // Get game data
        const gameQuery = `SELECT * FROM games WHERE game_id = $1`;
        const gameResult = await client.query(gameQuery, [gameId]);
        
        if (gameResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Game not found' });
        }
        
        const game = gameResult.rows[0];
        
        // Hitung XP yang didapat
        let xpEarned = 0;
        if (correctAnswers > 0) {
            xpEarned = Math.floor((correctAnswers / questionsAnswered) * game.max_xp_reward);
            if (isCompleted) {
                xpEarned += game.completion_bonus_xp;
            }
        }
        
        // Hitung completion percentage
        const completionPercentage = game.total_questions > 0 
            ? Math.min((correctAnswers / game.total_questions) * 100, 100) 
            : 0;
        
        const isGameCompleted = completionPercentage >= 100;
        
        // Check existing progress
        const existingQuery = `
            SELECT * FROM user_game_progress 
            WHERE user_id = $1 AND game_id = $2
        `;
        const existingResult = await client.query(existingQuery, [userId, gameId]);
        
        if (existingResult.rows.length === 0) {
            // Insert progress baru
            const insertQuery = `
                INSERT INTO user_game_progress (
                    user_id, game_id, total_questions_answered, correct_answers, 
                    wrong_answers, completion_percentage, is_completed, total_xp_earned, 
                    best_score, times_played, last_played_at, first_played_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                RETURNING *
            `;
            
            await client.query(insertQuery, [
                userId, gameId, questionsAnswered, correctAnswers, wrongAnswers,
                completionPercentage, isGameCompleted, xpEarned, score, 1
            ]);
        } else {
            // Update existing progress
            const existing = existingResult.rows[0];
            const newTotalQuestions = existing.total_questions_answered + questionsAnswered;
            const newCorrectAnswers = existing.correct_answers + correctAnswers;
            const newWrongAnswers = existing.wrong_answers + wrongAnswers;
            const newTotalXp = existing.total_xp_earned + xpEarned;
            const newBestScore = Math.max(existing.best_score, score);
            const newTimesPlayed = existing.times_played + 1;
            
            const newCompletionPercentage = game.total_questions > 0 
                ? Math.min((newCorrectAnswers / game.total_questions) * 100, 100) 
                : 0;
            const newIsCompleted = newCompletionPercentage >= 100;
            
            const updateQuery = `
                UPDATE user_game_progress SET
                    total_questions_answered = $3,
                    correct_answers = $4,
                    wrong_answers = $5,
                    completion_percentage = $6,
                    is_completed = $7,
                    total_xp_earned = $8,
                    best_score = $9,
                    times_played = $10,
                    last_played_at = CURRENT_TIMESTAMP,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND game_id = $2
                RETURNING *
            `;
            
            await client.query(updateQuery, [
                userId, gameId, newTotalQuestions, newCorrectAnswers, newWrongAnswers,
                newCompletionPercentage, newIsCompleted, newTotalXp, newBestScore, newTimesPlayed
            ]);
        }
        
        // Insert game session record
        const sessionQuery = `
            INSERT INTO game_sessions (
                user_id, game_id, questions_answered, correct_answers, wrong_answers,
                score, xp_earned, completion_percentage, time_spent, is_completed
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING id
        `;
        
        const sessionResult = await client.query(sessionQuery, [
            userId, gameId, questionsAnswered, correctAnswers, wrongAnswers,
            score, xpEarned, completionPercentage, timeSpent || 0, isCompleted
        ]);
        
        // Update user XP and level if functions exist
        try {
            if (xpEarned > 0) {
                await client.query('SELECT update_user_xp_and_level($1, $2)', [userId, xpEarned]);
            }
        } catch (funcError) {
            console.log('XP function not available, skipping XP update');
        }
        
        // Update streak if function exists
        try {
            await client.query('SELECT update_user_streak($1)', [userId]);
        } catch (funcError) {
            console.log('Streak function not available, skipping streak update');
        }
        
        await client.query('COMMIT');
        
        res.json({
            message: 'Game progress updated successfully',
            data: {
                sessionId: sessionResult.rows[0].id,
                xpEarned,
                completionPercentage: isGameCompleted ? 100 : completionPercentage,
                isCompleted: isGameCompleted
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating game progress:', error);
        res.status(500).json({ message: 'Server error' });
    } finally {
        client.release();
    }
};

// ============================================
// USER STREAK CONTROLLERS
// ============================================

exports.getUserStreak = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                current_streak,
                longest_streak,
                is_active,
                last_activity_date,
                streak_start_date
            FROM user_streaks 
            WHERE user_id = $1
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
            return res.json({
                data: {
                    current_streak: 0,
                    longest_streak: 0,
                    is_active: false,
                    seconds_until_reset: getSecondsUntilMidnight()
                }
            });
        }
        
        const streak = result.rows[0];
        const today = new Date().toISOString().split('T')[0];
        const lastActivity = streak.last_activity_date?.toISOString().split('T')[0];
        
        const isActiveToday = lastActivity === today;
        
        res.json({
            data: {
                current_streak: streak.current_streak,
                longest_streak: streak.longest_streak,
                is_active: isActiveToday,
                seconds_until_reset: getSecondsUntilMidnight()
            }
        });
        
    } catch (error) {
        console.error('Error fetching user streak:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// USER LEVEL CONTROLLERS
// ============================================

exports.getUserLevel = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                current_level,
                current_xp,
                total_xp,
                xp_to_next_level
            FROM user_levels 
            WHERE user_id = $1
        `;
        
        const result = await pool.query(query, [userId]);
        
        if (result.rows.length === 0) {
            return res.json({
                data: {
                    current_level: 1,
                    current_xp: 0,
                    total_xp: 0,
                    xp_to_next_level: 100
                }
            });
        }
        
        const level = result.rows[0];
        res.json({
            data: {
                current_level: level.current_level,
                current_xp: level.current_xp,
                total_xp: level.total_xp,
                xp_to_next_level: level.xp_to_next_level
            }
        });
        
    } catch (error) {
        console.error('Error fetching user level:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// DAILY MISSION CONTROLLERS
// ============================================

exports.getDailyMissions = async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date().toISOString().split('T')[0];
        
        // FIXED: Use correct column names and check if tables exist
        const query = `
            SELECT 
                dm.id,
                dm.mission_type,
                dm.title,
                dm.description,
                dm.target_value,
                dm.xp_reward,
                dm.icon,
                COALESCE(udm.progress_value, 0) as progress_value,
                COALESCE(udm.is_completed, false) as is_completed,
                COALESCE(udm.xp_earned, 0) as xp_earned
            FROM daily_missions dm
            LEFT JOIN user_daily_missions udm ON dm.id = udm.mission_id 
                AND udm.user_id = $1 AND udm.mission_date = $2
            WHERE dm.is_active = true
            ORDER BY dm.id
        `;
        
        const result = await pool.query(query, [userId, today]);
        
        res.json({
            data: result.rows.map(row => ({
                id: row.id,
                missionType: row.mission_type,
                title: row.title,
                description: row.description,
                targetValue: row.target_value,
                xpReward: row.xp_reward,
                icon: row.icon,
                progressValue: row.progress_value,
                isCompleted: row.is_completed,
                xpEarned: row.xp_earned,
                completionPercentage: Math.min((row.progress_value / row.target_value) * 100, 100)
            }))
        });
        
    } catch (error) {
        console.error('Error fetching daily missions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// LEADERBOARD CONTROLLERS
// ============================================

exports.getWeeklyLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const { weekStart } = getWeekDates();
        
        // FIXED: Use siswa table instead of users for nama_lengkap
        const query = `
            SELECT 
                wr.user_id,
                s.nama_lengkap as username,
                wr.weekly_xp,
                wr.games_played,
                wr.streak_maintained_days,
                wr.missions_completed,
                ROW_NUMBER() OVER (ORDER BY wr.weekly_xp DESC, wr.games_played DESC) as rank_position
            FROM weekly_rankings wr
            JOIN users u ON wr.user_id = u.id
            JOIN siswa s ON u.id = s.user_id
            WHERE wr.week_start_date = $1
            ORDER BY wr.weekly_xp DESC, wr.games_played DESC
            LIMIT $2
        `;
        
        const result = await pool.query(query, [weekStart.toISOString().split('T')[0], limit]);
        
        res.json({
            data: result.rows.map(row => ({
                userId: row.user_id,
                username: row.username,
                weeklyXp: row.weekly_xp,
                gamesPlayed: row.games_played,
                streakDays: row.streak_maintained_days,
                missionsCompleted: row.missions_completed,
                rank: row.rank_position
            }))
        });
        
    } catch (error) {
        console.error('Error fetching weekly leaderboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getOverallLeaderboard = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // FIXED: Use siswa table instead of users for nama_lengkap
        const query = `
            SELECT 
                orr.user_id,
                s.nama_lengkap as username,
                orr.total_xp,
                orr.total_games_played,
                orr.total_streak_days,
                orr.total_missions_completed,
                orr.current_level,
                ROW_NUMBER() OVER (ORDER BY orr.total_xp DESC, orr.current_level DESC) as rank_position
            FROM overall_rankings orr
            JOIN users u ON orr.user_id = u.id
            JOIN siswa s ON u.id = s.user_id
            ORDER BY orr.total_xp DESC, orr.current_level DESC
            LIMIT $1
        `;
        
        const result = await pool.query(query, [limit]);
        
        res.json({
            data: result.rows.map(row => ({
                userId: row.user_id,
                username: row.username,
                totalXp: row.total_xp,
                totalGamesPlayed: row.total_games_played,
                totalStreakDays: row.total_streak_days,
                totalMissionsCompleted: row.total_missions_completed,
                currentLevel: row.current_level,
                rank: row.rank_position
            }))
        });
        
    } catch (error) {
        console.error('Error fetching overall leaderboard:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ============================================
// GAME DATA CONTROLLERS
// ============================================

exports.getGames = async (req, res) => {
    try {
        const query = `
            SELECT 
                game_id,
                title,
                description,
                difficulty,
                total_questions,
                max_xp_reward,
                completion_bonus_xp
            FROM games
            ORDER BY id
        `;
        
        const result = await pool.query(query);
        
        res.json({
            data: result.rows.map(row => ({
                gameId: row.game_id,
                title: row.title,
                description: row.description,
                difficulty: row.difficulty,
                totalQuestions: row.total_questions,
                maxXpReward: row.max_xp_reward,
                completionBonusXp: row.completion_bonus_xp
            }))
        });
        
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ message: 'Server error' });
    }
};