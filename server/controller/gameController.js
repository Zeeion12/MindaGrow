// server/controller/gameController.js - REAL DATABASE VERSION
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

// Update atau create user streak
const updateUserStreak = async (client, userId) => {
    try {
        // FIXED: Use proper timezone for today's date
        const now = new Date();
        const today = now.toISOString().split('T')[0]; // YYYY-MM-DD format
        
        console.log(`🔥 Updating streak for user ${userId} on ${today}`);
        
        // Check if user streak exists
        const streakResult = await client.query(
            'SELECT * FROM user_streaks WHERE user_id = $1',
            [userId]
        );
        
        if (streakResult.rows.length === 0) {
            // Create new streak
            console.log('🔥 Creating new streak record');
            await client.query(
                'INSERT INTO user_streaks (user_id, current_streak, longest_streak, is_active, last_activity_date, streak_start_date) VALUES ($1, 1, 1, true, $2, $2)',
                [userId, today]
            );
            return;
        }
        
        const streak = streakResult.rows[0];
        const lastActivityDate = streak.last_activity_date?.toISOString().split('T')[0];
        
        console.log(`🔥 Current streak data:`, { lastActivityDate, today, current_streak: streak.current_streak });
        
        if (lastActivityDate === today) {
            // Already played today, just ensure is_active is true
            console.log('🔥 Already played today, ensuring active status');
            await client.query(
                'UPDATE user_streaks SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
                [userId]
            );
            return;
        }
        
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastActivityDate === yesterdayStr) {
            // Consecutive day, increment streak
            const newStreak = streak.current_streak + 1;
            const longestStreak = Math.max(newStreak, streak.longest_streak);
            
            console.log(`🔥 Consecutive day! Incrementing streak: ${streak.current_streak} → ${newStreak}`);
            
            await client.query(
                'UPDATE user_streaks SET current_streak = $1, longest_streak = $2, is_active = true, last_activity_date = $3, updated_at = CURRENT_TIMESTAMP WHERE user_id = $4',
                [newStreak, longestStreak, today, userId]
            );
        } else {
            // Streak broken, start new streak
            console.log(`🔥 Streak broken (last: ${lastActivityDate}, today: ${today}). Starting new streak.`);
            
            await client.query(
                'UPDATE user_streaks SET current_streak = 1, is_active = true, last_activity_date = $1, streak_start_date = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
                [today, userId]
            );
        }
    } catch (error) {
        console.error('Error updating user streak:', error);
    }
};

// Update atau create user level
const updateUserLevel = async (client, userId, xpGained) => {
    try {
        // Check if user level exists
        const levelResult = await client.query(
            'SELECT * FROM user_levels WHERE user_id = $1',
            [userId]
        );
        
        if (levelResult.rows.length === 0) {
            // Create new level record
            await client.query(
                'INSERT INTO user_levels (user_id, current_xp, total_xp, current_level, xp_to_next_level) VALUES ($1, $2, $2, 1, $3)',
                [userId, xpGained, 100 - xpGained]
            );
            return;
        }
        
        const level = levelResult.rows[0];
        let newCurrentXp = level.current_xp + xpGained;
        let newTotalXp = level.total_xp + xpGained;
        let newLevel = level.current_level;
        let xpToNext = level.xp_to_next_level;
        
        // Check for level up
        while (newCurrentXp >= xpToNext) {
            newCurrentXp -= xpToNext;
            newLevel++;
            xpToNext = 100 + ((newLevel - 1) * 50); // XP requirement increases by 50 each level
        }
        
        xpToNext = xpToNext - newCurrentXp;
        
        await client.query(
            'UPDATE user_levels SET current_level = $1, current_xp = $2, total_xp = $3, xp_to_next_level = $4, updated_at = CURRENT_TIMESTAMP WHERE user_id = $5',
            [newLevel, newCurrentXp, newTotalXp, xpToNext, userId]
        );
        
    } catch (error) {
        console.error('Error updating user level:', error);
    }
};

// ============================================
// GAME PROGRESS CONTROLLERS
// ============================================

// Ambil progress semua game user
exports.getUserGameProgress = async (req, res) => {
    try {
        const userId = req.user.id;
        
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
        res.status(500).json({ message: 'Server error', error: error.message });
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
        
        console.log(`🎮 Updating game progress - User: ${userId}, Game: ${gameId}`, req.body);
        
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
        
        // Hitung completion percentage berdasarkan correct answers vs total questions game
        const completionPercentage = game.total_questions > 0 
            ? Math.min((correctAnswers / game.total_questions) * 100, 100) 
            : Math.min((correctAnswers / questionsAnswered) * 100, 100);
        
        const isGameCompleted = completionPercentage >= 100;
        
        console.log(`📊 Calculated - XP: ${xpEarned}, Completion: ${completionPercentage}%, Completed: ${isGameCompleted}`);
        
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
            
            const insertResult = await client.query(insertQuery, [
                userId, gameId, questionsAnswered, correctAnswers, wrongAnswers,
                completionPercentage, isGameCompleted, xpEarned, score, 1
            ]);
            
            console.log('✅ Inserted new progress:', insertResult.rows[0]);
            
        } else {
            // Update progress yang sudah ada
            const existing = existingResult.rows[0];
            const newTotalQuestions = existing.total_questions_answered + questionsAnswered;
            const newCorrectAnswers = existing.correct_answers + correctAnswers;
            const newWrongAnswers = existing.wrong_answers + wrongAnswers;
            const newTotalXp = existing.total_xp_earned + xpEarned;
            const newBestScore = Math.max(existing.best_score, score);
            const newTimesPlayed = existing.times_played + 1;
            
            // Recalculate completion percentage based on total correct answers
            const newCompletionPercentage = game.total_questions > 0 
                ? Math.min((newCorrectAnswers / game.total_questions) * 100, 100) 
                : Math.min((newCorrectAnswers / newTotalQuestions) * 100, 100);
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
            
            const updateResult = await client.query(updateQuery, [
                userId, gameId, newTotalQuestions, newCorrectAnswers, newWrongAnswers,
                newCompletionPercentage, newIsCompleted, newTotalXp, newBestScore, newTimesPlayed
            ]);
            
            console.log('✅ Updated existing progress:', updateResult.rows[0]);
        }
        
        // Update user XP and level
        if (xpEarned > 0) {
            await updateUserLevel(client, userId, xpEarned);
            console.log(`📈 Updated user level with ${xpEarned} XP`);
        }
        
        // Update streak
        await updateUserStreak(client, userId);
        
        await client.query('COMMIT');
        
        res.json({
            message: 'Game progress updated successfully',
            data: {
                xpEarned,
                completionPercentage: isGameCompleted ? 100 : completionPercentage,
                isCompleted: isGameCompleted
            }
        });
        
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating game progress:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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
            console.log('🔥 No streak record found, returning default');
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
        
        // FIXED: Proper timezone handling
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const lastActivity = streak.last_activity_date?.toISOString().split('T')[0];
        
        // Check if active today
        const isActiveToday = lastActivity === today && streak.is_active;
        
        res.json({
            data: {
                current_streak: streak.current_streak,
                longest_streak: streak.longest_streak,
                is_active: isActiveToday, // FIXED: Use calculated value
                seconds_until_reset: getSecondsUntilMidnight()
            }
        });
        
    } catch (error) {
        console.error('Error fetching user streak:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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
            console.log('📈 No level record found, returning default');
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============================================
// DAILY MISSION CONTROLLERS (simplified)
// ============================================

exports.getDailyMissions = async (req, res) => {
    try {
        // Return simple mock missions for now
        const mockMissions = [
            {
                id: 1,
                missionType: 'complete_games',
                title: 'Complete 3 quizzes',
                description: 'Selesaikan 3 kuis hari ini dengan benar',
                targetValue: 3,
                xpReward: 50,
                icon: '📚',
                progressValue: 1,
                isCompleted: false,
                xpEarned: 0,
                completionPercentage: 33.33
            },
            {
                id: 2,
                missionType: 'play_any_game',
                title: 'Play any game',
                description: 'Mainkan game apapun hari ini',
                targetValue: 1,
                xpReward: 25,
                icon: '🎮',
                progressValue: 1,
                isCompleted: true,
                xpEarned: 25,
                completionPercentage: 100
            }
        ];
        
        res.json({ data: mockMissions });
        
    } catch (error) {
        console.error('Error fetching daily missions:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// ============================================
// LEADERBOARD CONTROLLERS (simplified)
// ============================================

exports.getWeeklyLeaderboard = async (req, res) => {
    try {
        // Return mock leaderboard for now
        const mockLeaderboard = [
            {
                userId: 1,
                username: 'Muhamad Dimas',
                weeklyXp: 476,
                gamesPlayed: 5,
                streakDays: 3,
                missionsCompleted: 2,
                rank: 1
            }
        ];
        
        res.json({ data: mockLeaderboard });
        
    } catch (error) {
        console.error('Error fetching weekly leaderboard:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getOverallLeaderboard = async (req, res) => {
    try {
        // Return mock leaderboard for now
        const mockLeaderboard = [
            {
                userId: 1,
                username: 'Muhamad Dimas',
                totalXp: 2028,
                totalGamesPlayed: 25,
                currentLevel: 19,
                rank: 1
            }
        ];
        
        res.json({ data: mockLeaderboard });
        
    } catch (error) {
        console.error('Error fetching overall leaderboard:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
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
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Jika ada yang undefined, tambahkan fallback
if (!exports.getGameProgress) {
    exports.getGameProgress = exports.getUserGameProgress;
}

if (!exports.updateStreak) {
    exports.updateStreak = (req, res) => {
        res.json({ message: 'Streak updated via game progress' });
    };
}

if (!exports.updateDailyMissionProgress) {
    exports.updateDailyMissionProgress = (req, res) => {
        res.json({ message: 'Daily mission progress updated' });
    };
}

if (!exports.getUserRanking) {
    exports.getUserRanking = (req, res) => {
        res.json({ data: { weeklyRank: 1, overallRank: 1 } });
    };
}

if (!exports.startGameSession) {
    exports.startGameSession = (req, res) => {
        res.json({ data: { sessionId: Math.floor(Math.random() * 1000) } });
    };
}

if (!exports.endGameSession) {
    exports.endGameSession = (req, res) => {
        res.json({ message: 'Game session ended' });
    };
}

if (!exports.getGameDetail) {
    exports.getGameDetail = exports.getGames;
}

if (!exports.getUserGameStats) {
    exports.getUserGameStats = (req, res) => {
        res.json({ data: { totalGames: 0, totalXP: 0 } });
    };
}

if (!exports.getGameHistory) {
    exports.getGameHistory = (req, res) => {
        res.json({ data: [] });
    };
}