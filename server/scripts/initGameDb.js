// server/scripts/initGameDb.js
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

async function initializeGameDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🎮 Initializing game database...');
    
    // Execute the SQL schema manually since we don't have separate file
    const schemaSql = `
-- Tabel untuk games
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) DEFAULT 'Medium',
    max_questions INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk menyimpan progress game setiap siswa
CREATE TABLE IF NOT EXISTS game_progress (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(50) REFERENCES games(game_id) ON DELETE CASCADE,
    total_questions INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0.00,
    is_completed BOOLEAN DEFAULT FALSE,
    last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, game_id)
);

-- Tabel untuk streak api beruntun
CREATE TABLE IF NOT EXISTS user_streaks (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT FALSE,
    last_activity_date DATE,
    streak_start_date DATE,
    streak_end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk daily missions
CREATE TABLE IF NOT EXISTS daily_missions (
    id SERIAL PRIMARY KEY,
    mission_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    target_count INTEGER DEFAULT 1,
    xp_reward INTEGER DEFAULT 25,
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk progress daily missions setiap user
CREATE TABLE IF NOT EXISTS user_daily_missions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    mission_id INTEGER REFERENCES daily_missions(id) ON DELETE CASCADE,
    current_progress INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    mission_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, mission_id, mission_date)
);

-- Tabel untuk user XP dan level
CREATE TABLE IF NOT EXISTS user_levels (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    current_level INTEGER DEFAULT 1,
    current_xp INTEGER DEFAULT 0,
    total_xp INTEGER DEFAULT 0,
    xp_to_next_level INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk weekly rankings
CREATE TABLE IF NOT EXISTS weekly_rankings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    weekly_xp INTEGER DEFAULT 0,
    games_played INTEGER DEFAULT 0,
    rank_position INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_start_date)
);

-- Tabel untuk game sessions
CREATE TABLE IF NOT EXISTS game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    game_id VARCHAR(50) REFERENCES games(game_id) ON DELETE CASCADE,
    questions_answered INTEGER DEFAULT 0,
    correct_answers INTEGER DEFAULT 0,
    xp_earned INTEGER DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    session_data JSONB
);
    `;
    
    // Split by semicolon and execute each statement
    const statements = schemaSql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
        } catch (error) {
          // Ignore errors for existing tables/functions
          if (!error.message.includes('already exists')) {
            console.error('Error executing statement:', error.message);
          }
        }
      }
    }
    
    console.log('✅ Game database schema initialized successfully!');
    
    // Insert data awal untuk games
    await client.query(`
      INSERT INTO games (game_id, name, description, difficulty, max_questions) 
      VALUES 
        ('patternpuzzle', 'Tebak Pola (Pattern Puzzle)', 'Asah logika dengan menebak pola yang tersembunyi', 'Medium', 10),
        ('yesorno', 'Yes or No', 'Tes pengetahuan dengan pertanyaan ya atau tidak', 'Easy', 15),
        ('mazechallenge', 'Maze Challenge', 'Temukan jalan keluar dari labirin yang menantang', 'Hard', 8)
      ON CONFLICT (game_id) DO NOTHING
    `);
    
    // Insert data awal untuk daily missions
    await client.query(`
      INSERT INTO daily_missions (mission_type, title, description, target_count, xp_reward, icon) 
      VALUES 
        ('complete_quizzes', 'Complete 3 quizzes', 'Selesaikan 3 kuis hari ini dengan benar', 3, 50, '🧠'),
        ('watch_videos', 'Watch 5 tutorial videos', 'Tonton 5 video pembelajaran untuk menambah wawasan', 5, 30, '📺'),
        ('solve_problems', 'Solve 10 practice problems', 'Selesaikan 10 soal latihan dengan benar', 10, 100, '🧮'),
        ('play_game', 'Play any game', 'Mainkan game apapun hari ini', 1, 25, '🎮')
      ON CONFLICT DO NOTHING
    `);
    
    // Function untuk menghitung XP yang dibutuhkan untuk level berikutnya
    await client.query(`
      CREATE OR REPLACE FUNCTION calculate_xp_for_level(level INTEGER)
      RETURNS INTEGER AS $
      BEGIN
          RETURN level * 100 + (level - 1) * 50;
      END;
      $ LANGUAGE plpgsql;
    `);
    
    // Function untuk update level user berdasarkan XP
    await client.query(`
      CREATE OR REPLACE FUNCTION update_user_level(p_user_id INTEGER, p_xp_gained INTEGER)
      RETURNS void AS $
      DECLARE
          current_data RECORD;
          new_level INTEGER;
          xp_needed INTEGER;
      BEGIN
          SELECT * INTO current_data 
          FROM user_levels 
          WHERE user_id = p_user_id;
          
          IF NOT FOUND THEN
              INSERT INTO user_levels (user_id, current_xp, total_xp) 
              VALUES (p_user_id, p_xp_gained, p_xp_gained);
              RETURN;
          END IF;
          
          UPDATE user_levels 
          SET 
              current_xp = current_xp + p_xp_gained,
              total_xp = total_xp + p_xp_gained,
              updated_at = CURRENT_TIMESTAMP
          WHERE user_id = p_user_id;
          
          SELECT current_xp, current_level INTO current_data
          FROM user_levels 
          WHERE user_id = p_user_id;
          
          new_level := current_data.current_level;
          
          WHILE current_data.current_xp >= calculate_xp_for_level(new_level + 1) LOOP
              new_level := new_level + 1;
          END LOOP;
          
          IF new_level > current_data.current_level THEN
              xp_needed := calculate_xp_for_level(new_level + 1);
              
              UPDATE user_levels 
              SET 
                  current_level = new_level,
                  xp_to_next_level = xp_needed - current_xp,
                  updated_at = CURRENT_TIMESTAMP
              WHERE user_id = p_user_id;
          END IF;
      END;
      $ LANGUAGE plpgsql;
    `);
    
    // Function untuk update streak setiap hari
    await client.query(`
      CREATE OR REPLACE FUNCTION update_daily_streaks()
      RETURNS void AS $
      BEGIN
          UPDATE user_streaks 
          SET 
              current_streak = 0,
              is_active = FALSE,
              streak_end_date = CURRENT_DATE - INTERVAL '1 day'
          WHERE 
              last_activity_date < CURRENT_DATE - INTERVAL '1 day'
              AND is_active = TRUE;
      END;
      $ LANGUAGE plpgsql;
    `);
    
    // Function untuk reset weekly rankings
    await client.query(`
      CREATE OR REPLACE FUNCTION reset_weekly_rankings()
      RETURNS void AS $
      BEGIN
          IF EXTRACT(DOW FROM CURRENT_DATE) = 1 THEN
              WITH ranked_users AS (
                  SELECT 
                      user_id,
                      weekly_xp,
                      ROW_NUMBER() OVER (ORDER BY weekly_xp DESC) as rank_pos
                  FROM weekly_rankings 
                  WHERE week_start_date = CURRENT_DATE - INTERVAL '7 days'
              )
              UPDATE weekly_rankings 
              SET rank_position = ranked_users.rank_pos
              FROM ranked_users 
              WHERE weekly_rankings.user_id = ranked_users.user_id
              AND weekly_rankings.week_start_date = CURRENT_DATE - INTERVAL '7 days';
              
              INSERT INTO weekly_rankings (user_id, week_start_date, week_end_date)
              SELECT DISTINCT 
                  ul.user_id,
                  CURRENT_DATE,
                  CURRENT_DATE + INTERVAL '6 days'
              FROM user_levels ul
              WHERE NOT EXISTS (
                  SELECT 1 FROM weekly_rankings wr 
                  WHERE wr.user_id = ul.user_id 
                  AND wr.week_start_date = CURRENT_DATE
              );
          END IF;
      END;
      $ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Game functions created successfully!');
    
    // Create initial user levels for existing students from siswa table
    const students = await client.query('SELECT id FROM siswa');
    
    for (const student of students.rows) {
      await client.query(`
        INSERT INTO user_levels (siswa_id) 
        VALUES ($1) 
        ON CONFLICT (siswa_id) DO NOTHING
      `, [student.id]);
      
      await client.query(`
        INSERT INTO user_streaks (siswa_id) 
        VALUES ($1) 
        ON CONFLICT (siswa_id) DO NOTHING
      `, [student.id]);
    }
    
    console.log('✅ Initial student data created!');
    
    // Create this week's ranking entries for students
    const currentDate = new Date();
    const weekStart = new Date(currentDate);
    weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    
    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    
    for (const student of students.rows) {
      await client.query(`
        INSERT INTO weekly_rankings (siswa_id, week_start_date, week_end_date) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (siswa_id, week_start_date) DO NOTHING
      `, [student.id, weekStartStr, weekEndStr]);
    }
    
    console.log('✅ Weekly rankings initialized!');
    console.log('🎉 Game system is ready to use!');
    
    // Display game info
    console.log('\n📊 Game System Features:');
    console.log('• 🔥 Daily streak fire system');
    console.log('• 📊 Game progress tracking');
    console.log('• 🎯 Daily missions with XP rewards');
    console.log('• 🏆 Weekly and overall leaderboards');
    console.log('• ⭐ Level system based on XP');
    console.log('• ⏰ Automatic resets and countdowns');
    
    console.log('\n🎮 Available Games:');
    const games = await client.query('SELECT * FROM games ORDER BY id');
    games.rows.forEach(game => {
      console.log(`• ${game.name} (${game.difficulty}) - ${game.description}`);
    });
    
    console.log('\n🎯 Daily Missions:');
    const missions = await client.query('SELECT * FROM daily_missions WHERE is_active = true ORDER BY id');
    missions.rows.forEach(mission => {
      console.log(`• ${mission.icon} ${mission.title} - ${mission.xp_reward} XP`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing game database:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  initializeGameDatabase()
    .then(() => {
      console.log('\n✅ Game database initialization completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Game database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeGameDatabase };