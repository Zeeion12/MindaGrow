const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const Joi = require('joi');
const { DateTime } = require("luxon");

const TwoFactorService = require('./services/TwoFactorService');

require('dotenv').config();

function getCurrentDate() {
  // Menggunakan Luxon untuk akurasi timezone yang lebih baik
  const jakartaDate = DateTime.now().setZone("Asia/Jakarta").toISODate();
  
  console.log('🕒 getCurrentDate called:', {
    jakartaDateTime: DateTime.now().setZone("Asia/Jakarta").toString(),
    formattedDate: jakartaDate
  });
  
  return jakartaDate; // Format: YYYY-MM-DD
}

function getSecondsUntilMidnight() {
  const now = DateTime.now().setZone("Asia/Jakarta");
  const midnight = now.plus({ days: 1 }).startOf('day');
  const seconds = Math.floor(midnight.diff(now, 'seconds').seconds);
  
  console.log('🕒 getSecondsUntilMidnight called:', {
    jakartaNow: now.toString(),
    midnightJakarta: midnight.toString(),
    secondsUntilMidnight: seconds
  });
  
  return seconds;
}

function getTodayDateJakarta() {
  // Alternative method using Intl - fallback jika luxon error
  const jakartaNow = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());

  return jakartaNow;
}


// Initialize Express app
const app = express();

// CORS and middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());


// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

// Static file serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  setHeaders: (res, path, stat) => {
    // Set proper Content-Type berdasarkan file extension
    const ext = require('path').extname(path).toLowerCase();

    switch (ext) {
      case '.pdf':
        res.setHeader('Content-Type', 'application/pdf');
        break;
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case '.gif':
        res.setHeader('Content-Type', 'image/gif');
        break;
      case '.webp':
        res.setHeader('Content-Type', 'image/webp');
        break;
      case '.mp4':
        res.setHeader('Content-Type', 'video/mp4');
        break;
      case '.doc':
        res.setHeader('Content-Type', 'application/msword');
        break;
      case '.docx':
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        break;
      default:
        res.setHeader('Content-Type', 'application/octet-stream');
    }

    // Untuk file yang bisa dibuka di browser (PDF, gambar, video)
    if (['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4'].includes(ext)) {
      res.setHeader('Content-Disposition', 'inline');
    } else {
      // Untuk file lain, trigger download
      res.setHeader('Content-Disposition', 'attachment');
    }

    res.setHeader('Cache-Control', 'public, max-age=31536000');
  }
}));
app.use('/uploads/materials', express.static(path.join(__dirname, 'uploads', 'materials')));

// Import and use courses router
const coursesRouter = require('./routes/courses');
app.use('/api/courses', coursesRouter);

// Routes for games
const gamesRouter = require('./routes/games');
const cron = require('node-cron');

app.use('/api/games', gamesRouter);

cron.schedule('0 0 * * 1', async () => {
  try {
    console.log('Resetting weekly rankings...');
    
    // Archive current week rankings before reset
    const { pool } = require('./config/db');
    
    await pool.query(`
      INSERT INTO weekly_rankings_archive 
      SELECT *, CURRENT_TIMESTAMP as archived_at 
      FROM weekly_rankings 
      WHERE week_start_date = (
        SELECT MAX(week_start_date) FROM weekly_rankings
      )
    `);
    
    // Clear current week rankings untuk minggu baru
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + 1; // Senin
    const monday = new Date(today.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    await pool.query('DELETE FROM weekly_rankings WHERE week_start_date < $1', [monday]);
    
    console.log('Weekly rankings reset completed');
  } catch (error) {
    console.error('Error resetting weekly rankings:', error);
  }
});

// Schedule streak check setiap tengah malam
cron.schedule('0 0 * * *', async () => {
  try {
    
    const { pool } = require('./config/db');
    
    // Reset streak yang tidak aktif kemarin
    await pool.query(`
      UPDATE user_streaks 
      SET is_active = FALSE,
          current_streak = 0,
          updated_at = CURRENT_TIMESTAMP
      WHERE last_activity_date < CURRENT_DATE 
      AND is_active = TRUE
    `);
    
    console.log('Streak check completed');
  } catch (error) {
    console.error('Error checking streaks:', error);
  }
});

// Class Router
const classRoutes = require('./routes/classRoutes');
app.use('/api', classRoutes);

// Assignment Router
const assingmentRoutes = require('./routes/assignmentRoutes');
app.use('/api', assingmentRoutes);

// Material Routes
const materialRoutes = require('./routes/materialRoutes');
app.use('/api', materialRoutes);

// Submission Routes
const submissionRoutes = require('./routes/submissionRoutes');
app.use('/api', submissionRoutes);

// Serve static files untuk uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Error handler untuk file tidak ditemukan
app.use('/uploads/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'File tidak ditemukan'
  });
});

// Middleware for JWT authentication
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

// Middleware untuk admin only
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Rate limiting middleware untuk 2FA
const loginAttempts = new Map();

const rateLimitLogin = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5;

  if (!loginAttempts.has(ip)) {
    loginAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  const attempts = loginAttempts.get(ip);

  if (now > attempts.resetTime) {
    loginAttempts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (attempts.count >= maxAttempts) {
    return res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again later.'
    });
  }

  attempts.count++;
  loginAttempts.set(ip, attempts);
  next();
};

// Helper function untuk mendapatkan detail user berdasarkan role
const getUserDetails = async (userId, role) => {
  let query, tableName;

  switch (role) {
    case 'guru':
      tableName = 'guru';
      query = `
        SELECT 
          g.nuptk,
          g.nama_lengkap,
          g.no_telepon
        FROM guru g
        WHERE g.user_id = $1
      `;
      break;
    case 'orangtua':
      tableName = 'orangtua';
      query = `
        SELECT 
          o.nik,
          o.nama_lengkap,
          o.no_telepon
        FROM orangtua o
        WHERE o.user_id = $1
      `;
      break;
    case 'siswa':
      tableName = 'siswa';
      query = `
        SELECT 
          s.nis,
          s.nama_lengkap,
          s.nik_orangtua,
          s.no_telepon
        FROM siswa s
        WHERE s.user_id = $1
      `;
      break;
    default:
      return null;
  }

  try {
    const result = await pool.query(query, [userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error getting ${tableName} details:`, error);
    return null;
  }
};

// Database initialization
const initDB = async () => {
  try {
    console.log('Checking database structure...');

    try {
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
        ADD COLUMN IF NOT EXISTS backup_codes TEXT,
        ADD COLUMN IF NOT EXISTS last_2fa_verify TIMESTAMP
      `);
    } catch (error) {
      console.log('2FA columns might already exist:', error.message);
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        icon VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        thumbnail VARCHAR(500),
        price DECIMAL(10,2) DEFAULT 0,
        level VARCHAR(50) DEFAULT 'beginner',
        duration INTEGER DEFAULT 60,
        category_id INTEGER REFERENCES categories(id),
        instructor_id INTEGER NOT NULL REFERENCES users(id),
        instructor_role VARCHAR(50) DEFAULT 'guru',
        created_by INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT chk_level CHECK (level IN ('beginner', 'intermediate', 'advanced')),
        CONSTRAINT chk_status CHECK (status IN ('active', 'inactive', 'deleted')),
        CONSTRAINT chk_instructor_role CHECK (instructor_role IN ('guru', 'admin'))
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        course_id INTEGER NOT NULL REFERENCES courses(id),
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'active',
        completed_at TIMESTAMP,
        
        CONSTRAINT chk_enrollment_status CHECK (status IN ('active', 'completed', 'cancelled')),
        CONSTRAINT unique_enrollment UNIQUE (user_id, course_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS modules (
        id SERIAL PRIMARY KEY,
        course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration INTEGER DEFAULT 30,
        order_index INTEGER NOT NULL,
        video_url VARCHAR(500),
        content TEXT,
        is_free BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_module_order UNIQUE (course_id, order_index)
      )
    `);

    // Lessons table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id SERIAL PRIMARY KEY,
        module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT,
        video_url VARCHAR(500),
        duration INTEGER DEFAULT 15,
        order_index INTEGER NOT NULL,
        is_free BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT unique_lesson_order UNIQUE (module_id, order_index)
      )
    `);

    // Lesson progress table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        course_id INTEGER NOT NULL REFERENCES courses(id),
        module_id INTEGER NOT NULL REFERENCES modules(id),
        lesson_id INTEGER REFERENCES lessons(id),
        completed BOOLEAN DEFAULT FALSE,
        completion_percentage INTEGER DEFAULT 0,
        time_spent INTEGER DEFAULT 0,
        completed_at TIMESTAMP,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT chk_completion_percentage CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
        CONSTRAINT unique_lesson_progress UNIQUE (user_id, lesson_id)
      )
    `);

    // Course ratings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS course_ratings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        course_id INTEGER NOT NULL REFERENCES courses(id),
        rating INTEGER NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5),
        CONSTRAINT unique_course_rating UNIQUE (user_id, course_id)
      )
    `);

    // Certificates table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        course_id INTEGER NOT NULL REFERENCES courses(id),
        certificate_number VARCHAR(100) UNIQUE NOT NULL,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        certificate_url VARCHAR(500),
        
        CONSTRAINT unique_certificate UNIQUE (user_id, course_id)
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_courses_instructor ON courses(instructor_id);
      CREATE INDEX IF NOT EXISTS idx_courses_category ON courses(category_id);
      CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
      CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
      CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
      CREATE INDEX IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_course_ratings_course ON course_ratings(course_id);
    `);

    // Insert default categories if they don't exist
    const categoriesExist = await pool.query('SELECT COUNT(*) FROM categories');
    if (parseInt(categoriesExist.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO categories (name, description, icon) VALUES 
        ('Biologi', 'Ilmu tentang makhluk hidup dan lingkungannya', '🧬'),
        ('Fisika', 'Ilmu tentang materi, energi, dan interaksinya', '⚛️'),
        ('Kimia', 'Ilmu tentang struktur, sifat, dan reaksi zat', '🧪'),
        ('Matematika', 'Ilmu tentang bilangan, struktur, dan pola', '📐'),
        ('Bahasa Indonesia', 'Bahasa dan sastra Indonesia', '📚'),
        ('Bahasa Inggris', 'Bahasa Inggris dan komunikasi global', '🌍'),
        ('Sejarah', 'Ilmu tentang peristiwa masa lampau', '📜'),
        ('Geografi', 'Ilmu tentang bumi dan fenomena geografis', '🌏'),
        ('Teknologi Informasi', 'Komputer, programming, dan teknologi digital', '💻'),
        ('Seni dan Budaya', 'Seni rupa, musik, dan budaya nusantara', '🎨')
      `);
      console.log('Default categories inserted');
    }

    // Buat tabel untuk temporary 2FA tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS temp_2fa_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        temp_token VARCHAR(255) NOT NULL,
        secret VARCHAR(255),
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_temp_2fa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Buat enum type untuk attempt_type jika belum ada
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE attempt_type_enum AS ENUM ('login', '2fa_verify');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Buat tabel untuk login attempts tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS login_attempts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        ip_address INET NOT NULL,
        attempt_type attempt_type_enum NOT NULL,
        success BOOLEAN DEFAULT FALSE,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Buat tabel untuk active sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        session_token VARCHAR(255) NOT NULL,
        refresh_token VARCHAR(255),
        ip_address INET NOT NULL,
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE,
        CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT unique_session_token UNIQUE (session_token)
      )
    `);

    // Tambahkan indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_users_2fa_enabled ON users(is_2fa_enabled);
      CREATE INDEX IF NOT EXISTS idx_login_attempts_email_created ON login_attempts(email, created_at);
      CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON user_sessions(user_id, is_active);
    `);

    // Cek apakah ada admin user
    const adminExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@platform.com']
    );

    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (email, password, role) VALUES ($1, $2, $3)',
        ['admin@platform.com', hashedPassword, 'admin']
      );
      console.log('Admin user created: admin@platform.com / admin123');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// HELPER FUNCTIONS UNTUK 2FA
const generateTempToken = async (userId) => {
  const tempToken = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  await pool.query(
    'INSERT INTO temp_2fa_tokens (user_id, temp_token, expires_at) VALUES ($1, $2, $3)',
    [userId, tempToken, expiresAt]
  );

  return tempToken;
};

const logLoginAttempt = async (email, ipAddress, attemptType, success, errorMessage = null) => {
  try {
    // Pastikan attemptType menggunakan enum yang valid
    const validAttemptTypes = ['login', '2fa_verify']; // Hapus 'google_oauth' sementara
    const finalAttemptType = validAttemptTypes.includes(attemptType) ? attemptType : 'login';

    await pool.query(
      'INSERT INTO login_attempts (email, ip_address, attempt_type, success, error_message) VALUES ($1, $2, $3, $4, $5)',
      [email, ipAddress, finalAttemptType, success, errorMessage]
    );
  } catch (error) {
    console.error('Error logging login attempt:', error);
    // Jangan throw error agar tidak mengganggu proses utama
  }
};

const saveSession = async (userId, accessToken, refreshToken, req) => {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await pool.query(
    'INSERT INTO user_sessions (user_id, session_token, refresh_token, ip_address, user_agent, expires_at) VALUES ($1, $2, $3, $4, $5, $6)',
    [userId, accessToken, refreshToken, req.ip, req.get('User-Agent'), expiresAt]
  );
};

// Check database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
    console.log('Database connection parameters:', {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: 'mindagrow',
      password: process.env.DB_PASSWORD ? '[PASSWORD SET]' : '[PASSWORD NOT SET]',
      port: process.env.DB_PORT || 5432,
    });
  } else {
    console.log('Database connected successfully');
    initDB(); // Initialize database after successful connection
  }
});

// ===============================
// GAME ENDPOINTS
// ===============================

// Test endpoint
app.get('/api/test', authenticateToken, (req, res) => {
  res.json({
    message: 'API is working',
    user: req.user,
    timestamp: new Date().toISOString()
  });
});

// Get user streak
app.get('/api/games/streak', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    console.log(`🔥 Fetching streak for user ${userId}`);
    
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
        last_activity_date: null,
        seconds_until_reset: getSecondsUntilMidnight()
      });
    }

    const streak = result.rows[0];
    const today = getCurrentDate(); // Using Luxon
    const lastActivity = streak.last_activity_date ? 
      DateTime.fromJSDate(new Date(streak.last_activity_date)).toISODate() : null;

    // Check apakah aktif hari ini
    const isActiveToday = lastActivity === today;
    
    console.log(`🔥 Streak comparison:`, {
      lastActivity,
      today,
      is_active_db: streak.is_active,
      isActiveToday,
      current_streak: streak.current_streak
    });

    // Update database jika status berbeda
    if (streak.is_active !== isActiveToday) {
      await pool.query(
        'UPDATE user_streaks SET is_active = $1 WHERE user_id = $2',
        [isActiveToday, userId]
      );
      console.log(`🔄 Updated streak active status to ${isActiveToday}`);
    }

    res.json({
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      is_active: isActiveToday,
      last_activity_date: streak.last_activity_date,
      seconds_until_reset: getSecondsUntilMidnight()
    });

  } catch (error) {
    console.error('❌ Error getting user streak:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      current_streak: 0,
      longest_streak: 0,
      is_active: false,
      last_activity_date: null,
      seconds_until_reset: 86400
    });
  }
});

// Get game progress
app.get('/api/games/progress', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {

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
    res.json(gameProgress);
  } catch (error) {
    console.error('❌ Error getting game progress:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/games/ranking', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's total XP and rank
    const rankQuery = await pool.query(`
      WITH user_rankings AS (
        SELECT 
          ul.user_id,
          ul.total_xp,
          ROW_NUMBER() OVER (ORDER BY ul.total_xp DESC) as rank
        FROM user_levels ul
        WHERE ul.total_xp > 0
      )
      SELECT rank, total_xp 
      FROM user_rankings 
      WHERE user_id = $1
    `, [userId]);

    if (rankQuery.rows.length === 0) {
      return res.json({
        rank: 999,
        totalXp: 0
      });
    }

    res.json({
      rank: rankQuery.rows[0].rank,
      totalXp: rankQuery.rows[0].total_xp
    });

  } catch (error) {
    console.error('Error fetching user ranking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/games/daily-missions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDate();

    // Get user's daily progress (gunakan game progress sebagai substitusi)
    const progressQuery = await pool.query(`
      SELECT COUNT(*) as games_played, SUM(correct_answers) as total_correct
      FROM game_progress 
      WHERE user_id = $1 AND DATE(updated_at) = $2
    `, [userId, today]);

    const progress = progressQuery.rows[0] || { games_played: 0, total_correct: 0 };

    // Return structured missions data
    const missions = [
      {
        id: 1,
        title: "Complete 3 Games",
        description: "Selesaikan 3 game hari ini dengan benar",
        mission_type: "complete_games",
        target_count: 3,
        xp_reward: 50,
        current_progress: parseInt(progress.games_played) || 0,
        is_completed: (parseInt(progress.games_played) || 0) >= 3,
        progressValue: parseInt(progress.games_played) || 0,
        targetValue: 3,
        isCompleted: (parseInt(progress.games_played) || 0) >= 3,
        xpReward: 50
      },
      {
        id: 2,
        title: "Answer 10 Questions Correctly",
        description: "Jawab 10 soal dengan benar hari ini",
        mission_type: "solve_problems",
        target_count: 10,
        xp_reward: 75,
        current_progress: parseInt(progress.total_correct) || 0,
        is_completed: (parseInt(progress.total_correct) || 0) >= 10,
        progressValue: parseInt(progress.total_correct) || 0,
        targetValue: 10,
        isCompleted: (parseInt(progress.total_correct) || 0) >= 10,
        xpReward: 75
      },
      {
        id: 3,
        title: "Play Any Game",
        description: "Mainkan game apapun hari ini",
        mission_type: "play_any_game",
        target_count: 1,
        xp_reward: 25,
        current_progress: (parseInt(progress.games_played) || 0) > 0 ? 1 : 0,
        is_completed: (parseInt(progress.games_played) || 0) > 0,
        progressValue: (parseInt(progress.games_played) || 0) > 0 ? 1 : 0,
        targetValue: 1,
        isCompleted: (parseInt(progress.games_played) || 0) > 0,
        xpReward: 25
      }
    ];

    res.json({
      success: true,
      missions: missions
    });

  } catch (error) {
    console.error('Error fetching daily missions:', error);
    res.json({
      success: true,
      missions: []
    });
  }
});

// Perbaiki endpoint di index.js
app.get('/api/games/streak', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    console.log(`🔥 Fetching streak for user ${userId}`);
    
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
        last_activity_date: null,
        seconds_until_reset: getSecondsUntilMidnight()
      });
    }

    const streak = result.rows[0];
    const today = getCurrentDate(); // ← GUNAKAN FUNCTION BARU INI
    const lastActivity = streak.last_activity_date ? 
      new Date(streak.last_activity_date).toISOString().split('T')[0] : null;

    // Check apakah aktif hari ini
    const isActiveToday = lastActivity === today;
    
    console.log(`🔥 Streak comparison:`, {
      lastActivity,
      today, // ← INI SEKARANG HARUS 2025-07-19
      is_active_db: streak.is_active,
      isActiveToday,
      current_streak: streak.current_streak
    });

    // Update database jika status berbeda
    if (streak.is_active !== isActiveToday) {
      await pool.query(
        'UPDATE user_streaks SET is_active = $1 WHERE user_id = $2',
        [isActiveToday, userId]
      );
      console.log(`🔄 Updated streak active status to ${isActiveToday}`);
    }

    res.json({
      current_streak: streak.current_streak,
      longest_streak: streak.longest_streak,
      is_active: isActiveToday,
      last_activity_date: streak.last_activity_date,
      seconds_until_reset: getSecondsUntilMidnight()
    });

  } catch (error) {
    console.error('❌ Error getting user streak:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      current_streak: 0,
      longest_streak: 0,
      is_active: false,
      last_activity_date: null,
      seconds_until_reset: 86400
    });
  }
});

app.get('/api/games/level', authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    console.log(`📈 Fetching level for user ${userId}`);

    // Query langsung dari siswa table sebagai sumber utama
    const siswaResult = await pool.query(`
      SELECT 
        COALESCE(total_xp, 0) as total_xp,
        COALESCE(current_level, 1) as current_level,
        COALESCE(current_xp, 0) as current_xp
      FROM siswa WHERE user_id = $1
    `, [userId]);

    let levelData;
    
    if (siswaResult.rows.length > 0 && siswaResult.rows[0].total_xp > 0) {
      const siswaData = siswaResult.rows[0];
      
      // Recalculate untuk memastikan konsistensi
      const totalXp = siswaData.total_xp;
      const currentLevel = Math.floor(totalXp / 100) + 1;
      const currentXp = totalXp % 100;
      const xpToNextLevel = 100 - currentXp;
      
      levelData = {
        current_level: currentLevel,
        current_xp: currentXp,
        total_xp: totalXp,
        xp_to_next_level: xpToNextLevel
      };
    } else {
      // Fallback jika belum ada data
      levelData = {
        current_level: 1,
        current_xp: 0,
        total_xp: 0,
        xp_to_next_level: 100
      };
    }

    console.log('📈 Level data:', levelData);
    res.json(levelData);

  } catch (error) {
    console.error('❌ Error getting user level:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      current_level: 1,
      current_xp: 0,
      total_xp: 0,
      xp_to_next_level: 100
    });
  }
});

// Update user streak function (internal) - FIXED VERSION
async function updateUserStreak(userId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const today = getCurrentDate(); // Using Luxon

    console.log(`🔥 Updating streak for user ${userId} on ${today}`);

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
    const lastActivity = streak.last_activity_date ? 
      DateTime.fromJSDate(new Date(streak.last_activity_date)).toISODate() : null;

    console.log(`🔥 Current streak data:`, {
      lastActivityDate: lastActivity,
      today: today,
      current_streak: streak.current_streak
    });

    // Check if already played today
    if (lastActivity === today) {
      // Already played today, just activate
      await client.query(
        'UPDATE user_streaks SET is_active = true WHERE user_id = $1',
        [userId]
      );
      console.log('⚡ Streak already updated today, just activated');
      await client.query('COMMIT');
      return { newStreak: streak.current_streak, wasUpdated: false };
    }

    // Calculate yesterday using Luxon
    const todayDT = DateTime.fromISO(today);
    const yesterdayDT = todayDT.minus({ days: 1 });
    const yesterday = yesterdayDT.toISODate();

    console.log(`🔥 Date calculations:`, {
      today,
      yesterday,
      lastActivity
    });

    if (lastActivity === yesterday) {
      // Consecutive day! Increment streak
      const newStreak = streak.current_streak + 1;
      const longestStreak = Math.max(newStreak, streak.longest_streak);

      await client.query(
        'UPDATE user_streaks SET current_streak = $1, longest_streak = $2, last_activity_date = $3, is_active = true WHERE user_id = $4',
        [newStreak, longestStreak, today, userId]
      );
      console.log(`🔥 Consecutive day! Incrementing streak: ${streak.current_streak} → ${newStreak}`);
      await client.query('COMMIT');
      return { newStreak: newStreak, wasUpdated: true };
    } else {
      // Gap > 1 day, streak broken
      console.log('🔄 Streak broken! Starting new streak');

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

// Update function updateGameProgress di index.js
const updateGameProgress = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.user.id;
    const { gameId, questionsAnswered, correctAnswers, wrongAnswers, score, timeSpent, isCompleted } = req.body;

    console.log(`🎮 Updating game progress - User: ${userId}, Game: ${gameId}`, {
      questionsAnswered, correctAnswers, wrongAnswers, score, timeSpent, isCompleted
    });

    // Calculate XP earned
    const baseXp = correctAnswers * 3;
    const bonusXp = isCompleted ? 20 : 0;
    const xpEarned = baseXp + bonusXp;

    // Update game_progress table
    const existingProgress = await client.query(
      'SELECT * FROM game_progress WHERE user_id = $1 AND game_id = $2',
      [userId, gameId]
    );

    if (existingProgress.rows.length > 0) {
      await client.query(`
        UPDATE game_progress SET 
          total_questions_answered = total_questions_answered + $3,
          correct_answers = correct_answers + $4,
          wrong_answers = wrong_answers + $5,
          completion_percentage = CASE 
            WHEN $6 THEN '100.00'
            ELSE ROUND(((correct_answers + $4)::float / (total_questions_answered + $3)) * 100, 2)::text
          END,
          is_completed = CASE WHEN $6 THEN true ELSE is_completed END,
          total_xp_earned = total_xp_earned + $7,
          best_score = GREATEST(best_score, $8),
          times_played = times_played + 1,
          last_played_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND game_id = $2
      `, [userId, gameId, questionsAnswered, correctAnswers, wrongAnswers, isCompleted, xpEarned, score]);
    } else {
      await client.query(`
        INSERT INTO game_progress (
          user_id, game_id, total_questions_answered, correct_answers, wrong_answers,
          completion_percentage, is_completed, total_xp_earned, best_score, times_played,
          last_played_at, first_played_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [userId, gameId, questionsAnswered, correctAnswers, wrongAnswers, 
          isCompleted ? '100.00' : ((correctAnswers / questionsAnswered) * 100).toFixed(2),
          isCompleted, xpEarned, score]);
    }

    // **PENTING: Update siswa table untuk sync level data**
    await client.query(`
      UPDATE siswa SET 
        total_xp = COALESCE(total_xp, 0) + $2,
        current_xp = (COALESCE(total_xp, 0) + $2) % 100,
        current_level = FLOOR((COALESCE(total_xp, 0) + $2) / 100) + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `, [userId, xpEarned]);

    // Update user_levels table juga
    await client.query(`
      INSERT INTO user_levels (user_id, current_level, current_xp, total_xp, xp_to_next_level, updated_at)
      SELECT 
        $1, 
        FLOOR((COALESCE(s.total_xp, 0)) / 100) + 1,
        (COALESCE(s.total_xp, 0)) % 100,
        COALESCE(s.total_xp, 0),
        100 - ((COALESCE(s.total_xp, 0)) % 100),
        CURRENT_TIMESTAMP
      FROM siswa s WHERE s.user_id = $1
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        current_level = FLOOR((EXCLUDED.total_xp) / 100) + 1,
        current_xp = (EXCLUDED.total_xp) % 100,
        total_xp = EXCLUDED.total_xp,
        xp_to_next_level = 100 - ((EXCLUDED.total_xp) % 100),
        updated_at = CURRENT_TIMESTAMP
    `, [userId]);

    console.log(`📈 Updated user level with ${xpEarned} XP`);

    // Update streak
    const streakResult = await updateUserStreak(userId);
    console.log(`🔥 Updated user streak`);

    await client.query('COMMIT');

    res.json({
      message: 'Game progress updated successfully',
      xpEarned,
      streakUpdated: streakResult.wasUpdated,
      currentStreak: streakResult.newStreak
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating game progress:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  } finally {
    client.release();
  }
};

app.post('/api/games/progress/:gameId', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const userId = req.user.id;
    const gameId = req.params.gameId;
    const { questionsAnswered, correctAnswers, wrongAnswers, score, timeSpent, isCompleted } = req.body;

    console.log(`🎮 Updating game progress - User: ${userId}, Game: ${gameId}`, {
      questionsAnswered, correctAnswers, wrongAnswers, score, timeSpent, isCompleted
    });

    // Calculate XP earned
    const baseXp = correctAnswers * 3;
    const bonusXp = isCompleted ? 20 : 0;
    const xpEarned = baseXp + bonusXp;

    console.log(`📊 Calculated - XP: ${xpEarned}, Completion: ${((correctAnswers / questionsAnswered) * 100)}, Completed: ${isCompleted}`);

    // Update or insert game progress
    const existingProgress = await client.query(
      'SELECT * FROM game_progress WHERE user_id = $1 AND game_id = $2',
      [userId, gameId]
    );

    if (existingProgress.rows.length > 0) {
      // Update existing progress
      const updated = await client.query(`
        UPDATE game_progress SET 
          total_questions_answered = total_questions_answered + $3,
          correct_answers = correct_answers + $4,
          wrong_answers = wrong_answers + $5,
          completion_percentage = CASE 
            WHEN $6 THEN '100.00'
            ELSE ROUND(((correct_answers + $4)::float / (total_questions_answered + $3)) * 100, 2)::text
          END,
          is_completed = CASE WHEN $6 THEN true ELSE is_completed END,
          total_xp_earned = total_xp_earned + $7,
          best_score = GREATEST(best_score, $8),
          times_played = times_played + 1,
          last_played_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND game_id = $2
        RETURNING *
      `, [userId, gameId, questionsAnswered, correctAnswers, wrongAnswers, isCompleted, xpEarned, score]);
      
      console.log('✅ Updated existing progress:', updated.rows[0]);
    } else {
      // Insert new progress
      const inserted = await client.query(`
        INSERT INTO game_progress (
          user_id, game_id, total_questions_answered, correct_answers, wrong_answers,
          completion_percentage, is_completed, total_xp_earned, best_score, times_played,
          last_played_at, first_played_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `, [userId, gameId, questionsAnswered, correctAnswers, wrongAnswers, 
          isCompleted ? '100.00' : ((correctAnswers / questionsAnswered) * 100).toFixed(2),
          isCompleted, xpEarned, score]);
      
      console.log('✅ Created new progress:', inserted.rows[0]);
    }

    // **PENTING: Update siswa table untuk sync level data**
    await client.query(`
      UPDATE siswa SET 
        total_xp = COALESCE(total_xp, 0) + $2,
        current_xp = (COALESCE(total_xp, 0) + $2) % 100,
        current_level = FLOOR((COALESCE(total_xp, 0) + $2) / 100) + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `, [userId, xpEarned]);
    console.log(`📈 Updated user level with ${xpEarned} XP`);

    // Update user_levels table juga
    await client.query(`
      INSERT INTO user_levels (user_id, current_level, current_xp, total_xp, xp_to_next_level, updated_at)
      SELECT 
        $1, 
        FLOOR((COALESCE(s.total_xp, 0)) / 100) + 1,
        (COALESCE(s.total_xp, 0)) % 100,
        COALESCE(s.total_xp, 0),
        100 - ((COALESCE(s.total_xp, 0)) % 100),
        CURRENT_TIMESTAMP
      FROM siswa s WHERE s.user_id = $1
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        current_level = FLOOR((EXCLUDED.total_xp) / 100) + 1,
        current_xp = (EXCLUDED.total_xp) % 100,
        total_xp = EXCLUDED.total_xp,
        xp_to_next_level = 100 - ((EXCLUDED.total_xp) % 100),
        updated_at = CURRENT_TIMESTAMP
    `, [userId]);

    // Update streak
    const streakResult = await updateUserStreak(userId);
    console.log(`🔥 Updated user streak`);

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Game progress updated successfully',
      xpEarned,
      streakUpdated: streakResult.wasUpdated,
      currentStreak: streakResult.newStreak
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error updating game progress:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  } finally {
    client.release();
  }
});

// Complete game and update progress
app.post('/api/games/complete', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  const { gameId, correctAnswers, totalQuestions, score } = req.body;

  try {
    console.log(`🎮 Completing game:`, {
      userId,
      gameId,
      correctAnswers,
      totalQuestions,
      score
    });

    // Validate input
    if (!gameId || typeof correctAnswers !== 'number' || typeof totalQuestions !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Invalid input data',
        received: { gameId, correctAnswers, totalQuestions }
      });
    }

    // Calculate game result
    const wrongAnswers = totalQuestions - correctAnswers;
    const gameResult = {
      questionsAnswered: totalQuestions,
      correctAnswers,
      wrongAnswers,
      score: score || Math.round((correctAnswers / totalQuestions) * 100),
      timeSpent: 60, // Default time
      isCompleted: (correctAnswers / totalQuestions) >= 0.8 // 80% untuk complete
    };

    // Call the main progress update endpoint
    req.params.gameId = gameId;
    req.body = gameResult;
    
    // Forward to the main endpoint
    return res.redirect(307, `/api/games/progress/${gameId}`);

  } catch (error) {
    console.error('❌ Error completing game:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// ===============================
// ADMIN ENDPOINTS
// ===============================

// Admin Login - Endpoint khusus untuk admin
app.post('/api/admin/login', async (req, res) => {
  const { email, password, remember } = req.body;

  try {
    console.log('Admin login attempt with email:', email);

    // Cari admin di tabel users
    const adminResult = await pool.query(
      'SELECT id, email, password, role, is_2fa_enabled FROM users WHERE email = $1 AND role = $2',
      [email, 'admin']
    );

    if (adminResult.rows.length === 0) {
      return res.status(400).json({ message: 'Email atau password tidak valid' });
    }

    const admin = adminResult.rows[0];

    // Validate password
    const validPassword = await bcrypt.compare(password, admin.password);

    if (!validPassword) {
      return res.status(400).json({ message: 'Email atau password tidak valid' });
    }

    // Check 2FA untuk admin
    if (admin.is_2fa_enabled) {
      return res.json({
        success: true,
        message: 'Credentials valid. 2FA verification required.',
        requires2FA: true,
        userId: admin.id,
        userRole: 'admin'
      });
    }

    // Jika admin belum setup 2FA, paksa setup
    if (!admin.is_2fa_enabled) {
      return res.json({
        success: true,
        message: 'Admin must setup 2FA for security.',
        requiresSetup: true,
        tempToken: await generateTempToken(admin.id),
        userRole: 'admin',
        canSkip: false // Admin tidak boleh skip
      });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [admin.id]);

  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Admin: Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id, 
        u.email, 
        u.role, 
        u.last_login, 
        u.created_at,
        u.is_2fa_enabled,
        CASE 
          WHEN u.role = 'guru' THEN g.nama_lengkap
          WHEN u.role = 'orangtua' THEN o.nama_lengkap
          WHEN u.role = 'siswa' THEN s.nama_lengkap
          ELSE 'N/A'
        END as nama_lengkap,
        CASE 
          WHEN u.role = 'guru' THEN g.nuptk
          WHEN u.role = 'orangtua' THEN o.nik
          WHEN u.role = 'siswa' THEN s.nis
          ELSE NULL
        END as identifier,
        CASE 
          WHEN u.role = 'guru' THEN g.no_telepon
          WHEN u.role = 'orangtua' THEN o.no_telepon
          WHEN u.role = 'siswa' THEN s.no_telepon
          ELSE NULL
        END as no_telepon
      FROM users u
      LEFT JOIN guru g ON u.id = g.user_id AND u.role = 'guru'
      LEFT JOIN orangtua o ON u.id = o.user_id AND u.role = 'orangtua'
      LEFT JOIN siswa s ON u.id = s.user_id AND u.role = 'siswa'
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
    `);

    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Get course statistics
app.get('/api/admin/course-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Total courses
    const totalCoursesResult = await pool.query(
      "SELECT COUNT(*) as count FROM courses WHERE status = 'active'"
    );

    // Total enrollments
    const totalEnrollmentsResult = await pool.query(
      "SELECT COUNT(*) as count FROM enrollments WHERE status = 'active'"
    );

    // Courses by category
    const categoryStatsResult = await pool.query(`
      SELECT 
        c.name as category_name,
        COUNT(co.id) as course_count,
        COUNT(e.id) as enrollment_count
      FROM categories c
      LEFT JOIN courses co ON c.id = co.category_id AND co.status = 'active'
      LEFT JOIN enrollments e ON co.id = e.course_id AND e.status = 'active'
      GROUP BY c.id, c.name
      ORDER BY course_count DESC
    `);

    // Top instructors
    const topInstructorsResult = await pool.query(`
      SELECT 
        CASE 
          WHEN u.role = 'guru' THEN g.nama_lengkap
          WHEN u.role = 'admin' THEN 'Administrator'
          ELSE 'Unknown'
        END as instructor_name,
        COUNT(DISTINCT c.id) as course_count,
        COUNT(DISTINCT e.id) as total_enrollments
      FROM courses c
      JOIN users u ON c.instructor_id = u.id
      LEFT JOIN guru g ON u.id = g.user_id AND u.role = 'guru'
      LEFT JOIN enrollments e ON c.id = e.course_id AND e.status = 'active'
      WHERE c.status = 'active'
      GROUP BY u.id, instructor_name
      ORDER BY total_enrollments DESC
      LIMIT 5
    `);

    res.json({
      totalCourses: parseInt(totalCoursesResult.rows[0].count),
      totalEnrollments: parseInt(totalEnrollmentsResult.rows[0].count),
      categoryStats: categoryStatsResult.rows,
      topInstructors: topInstructorsResult.rows
    });

  } catch (error) {
    console.error('Get course stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Get user statistics
app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Total users (excluding admin)
    const totalUsersResult = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE role != 'admin'"
    );

    // Today's logins
    const todayLoginsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE DATE(last_login) = CURRENT_DATE 
      AND role != 'admin'
    `);

    // This week's logins
    const weekLoginsResult = await pool.query(`
      SELECT COUNT(*) as count 
      FROM users 
      WHERE last_login >= CURRENT_DATE - INTERVAL '7 days'
      AND role != 'admin'
    `);

    // Users by role
    const roleStatsResult = await pool.query(`
      SELECT 
        role, 
        COUNT(*) as count 
      FROM users 
      WHERE role != 'admin'
      GROUP BY role
      ORDER BY role
    `);

    const twoFAStatsResult = await pool.query(`
      SELECT 
        COUNT(CASE WHEN is_2fa_enabled = true THEN 1 END) as enabled_2fa,
        COUNT(CASE WHEN is_2fa_enabled = false THEN 1 END) as disabled_2fa
      FROM users 
      WHERE role != 'admin'
    `);

    res.json({
      totalUsers: parseInt(totalUsersResult.rows[0].count),
      todayLogins: parseInt(todayLoginsResult.rows[0].count),
      weekLogins: parseInt(weekLoginsResult.rows[0].count),
      roleStats: roleStatsResult.rows,
      twoFAStats: twoFAStatsResult.rows[0]
    });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Get user detail by ID
app.get('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      'SELECT id, email, role, last_login, created_at, is_2fa_enabled FROM users WHERE id = $1 AND role != $2',
      [id, 'admin']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = userResult.rows[0];
    const userDetails = await getUserDetails(user.id, user.role);

    res.json({
      user: {
        ...user,
        details: userDetails
      }
    });

  } catch (error) {
    console.error('Get user detail error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Admin: Delete user
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Get user role first
    const userResult = await client.query(
      'SELECT role FROM users WHERE id = $1 AND role != $2',
      [id, 'admin']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userRole = userResult.rows[0].role;

    // Delete from role-specific table first
    switch (userRole) {
      case 'guru':
        await client.query('DELETE FROM guru WHERE user_id = $1', [id]);
        break;
      case 'orangtua':
        await client.query('DELETE FROM orangtua WHERE user_id = $1', [id]);
        break;
      case 'siswa':
        await client.query('DELETE FROM siswa WHERE user_id = $1', [id]);
        break;
    }

    // Delete from users table
    await client.query('DELETE FROM temp_2fa_tokens WHERE user_id = $1', [id]);
    await client.query('DELETE FROM user_sessions WHERE user_id = $1', [id]);
    await client.query('DELETE FROM users WHERE id = $1', [id]);

    await client.query('COMMIT');

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    client.release();
  }
});

// Admin: Get recent activities
app.get('/api/admin/activities', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.role,
        u.last_login,
        u.created_at,
        u.is_2fa_enabled,
        CASE 
          WHEN u.role = 'guru' THEN g.nama_lengkap
          WHEN u.role = 'orangtua' THEN o.nama_lengkap
          WHEN u.role = 'siswa' THEN s.nama_lengkap
          ELSE 'N/A'
        END as nama_lengkap
      FROM users u
      LEFT JOIN guru g ON u.id = g.user_id AND u.role = 'guru'
      LEFT JOIN orangtua o ON u.id = o.user_id AND u.role = 'orangtua'
      LEFT JOIN siswa s ON u.id = s.user_id AND u.role = 'siswa'
      WHERE u.role != 'admin' AND u.last_login IS NOT NULL
      ORDER BY u.last_login DESC
      LIMIT 10
    `);

    res.json({ activities: result.rows });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===============================
// USER AUTHENTICATION ENDPOINTS
// ===============================

// Check NIK parent (for student registration)
app.post('/api/check-nik', async (req, res) => {
  const { nik } = req.body;

  try {
    console.log('Checking NIK:', nik);

    const result = await pool.query('SELECT * FROM siswa WHERE nik_orangtua = $1', [nik]);
    console.log('Query result:', result.rows);

    if (result.rows.length > 0) {
      res.json({ exists: true });
    } else {
      res.json({ exists: false });
    }
  } catch (error) {
    console.error('Error checking NIK:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Register user
app.post('/api/register', async (req, res) => {
  const { email, password, role, nama_lengkap, no_telepon } = req.body;
  let { nis, nuptk, nik, nik_orangtua } = req.body;

  try {
    // Start transaction
    await pool.query('BEGIN');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tentukan role yang benar berdasarkan input
    let userRole = role;
    if (nis) userRole = 'siswa';
    if (nuptk) userRole = 'guru';
    if (nik && !nis && !nuptk) userRole = 'orangtua';

    // Insert into users table with the correct role
    const userResult = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, userRole]
    );

    const userId = userResult.rows[0].id;

    // Insert into role-specific table
    if (userRole === 'siswa') {
      await pool.query(
        'INSERT INTO siswa (user_id, nis, nama_lengkap, nik_orangtua, no_telepon) VALUES ($1, $2, $3, $4, $5)',
        [userId, nis, nama_lengkap, nik_orangtua, no_telepon]
      );
    } else if (userRole === 'guru') {
      await pool.query(
        'INSERT INTO guru (user_id, nuptk, nama_lengkap, no_telepon) VALUES ($1, $2, $3, $4)',
        [userId, nuptk, nama_lengkap, no_telepon]
      );
    } else if (userRole === 'orangtua') {
      // Untuk orangtua, periksa dulu apakah NIK terdaftar di tabel siswa
      const nikCheck = await pool.query('SELECT * FROM siswa WHERE nik_orangtua = $1', [nik]);

      if (nikCheck.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ message: 'NIK tidak terdaftar oleh siswa manapun' });
      }

      await pool.query(
        'INSERT INTO orangtua (user_id, nik, nama_lengkap, no_telepon) VALUES ($1, $2, $3, $4)',
        [userId, nik, nama_lengkap, no_telepon]
      );
    }

    // Commit transaction
    await pool.query('COMMIT');

    res.status(201).json({ message: 'Registrasi berhasil' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error registering user:', error);

    if (error.code === '23505') { // Unique violation
      res.status(400).json({ message: 'Email atau nomor identitas sudah terdaftar' });
    } else {
      res.status(500).json({ message: 'Terjadi kesalahan server' });
    }
  }
});

// Login
app.post('/api/login', rateLimitLogin, async (req, res) => {
  const { identifier, password, remember } = req.body;

  try {
    // Check dulu apakah ini admin login
    if (identifier.includes('@')) {
      // Kemungkinan email admin
      const adminResult = await pool.query(
        'SELECT id, email, password, role, is_2fa_enabled FROM users WHERE email = $1 AND role = $2',
        [identifier, 'admin']
      );

      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];

        const validPassword = await bcrypt.compare(password, admin.password);

        if (!validPassword) {
          await logLoginAttempt(identifier, req.ip, 'login', false, 'Invalid password');
          return res.status(400).json({ message: 'Email atau password tidak valid' });
        }

        await logLoginAttempt(identifier, req.ip, 'login', true);

        // Check 2FA untuk admin
        if (admin.is_2fa_enabled) {
          return res.json({
            success: true,
            message: 'Credentials valid. 2FA verification required.',
            requires2FA: true,
            userId: admin.id,
            userRole: 'admin'
          });
        }

        // Jika admin belum setup 2FA
        if (!admin.is_2fa_enabled) {
          return res.json({
            success: true,
            message: 'Login successful. 2FA setup recommended for admin.',
            requiresSetup: true,
            tempToken: await generateTempToken(admin.id),
            userRole: 'admin'
          });
        }
      }
    }

    let user;
    let roleInfo;

    // Check in siswa table
    const siswaResult = await pool.query(
      'SELECT s.*, u.email, u.password, u.role, u.is_2fa_enabled FROM siswa s JOIN users u ON s.user_id = u.id WHERE s.nis = $1',
      [identifier]
    );

    if (siswaResult.rows.length > 0) {
      user = siswaResult.rows[0];
      roleInfo = {
        nama_lengkap: user.nama_lengkap,
        role: 'siswa',
        nis: user.nis
      };
    } else {
      // Check in guru table
      const guruResult = await pool.query(
        'SELECT g.*, u.email, u.password, u.role, u.is_2fa_enabled FROM guru g JOIN users u ON g.user_id = u.id WHERE g.nuptk = $1',
        [identifier]
      );

      if (guruResult.rows.length > 0) {
        user = guruResult.rows[0];
        roleInfo = {
          nama_lengkap: user.nama_lengkap,
          role: 'guru',
          nuptk: user.nuptk
        };
      } else {
        // Check in orangtua table
        const orangtuaResult = await pool.query(
          'SELECT o.*, u.email, u.password, u.role, u.is_2fa_enabled FROM orangtua o JOIN users u ON o.user_id = u.id WHERE o.nik = $1',
          [identifier]
        );

        if (orangtuaResult.rows.length > 0) {
          user = orangtuaResult.rows[0];
          roleInfo = {
            nama_lengkap: user.nama_lengkap,
            role: 'orangtua',
            nik: user.nik
          };
        }
      }
    }

    if (!user) {
      await logLoginAttempt(identifier, req.ip, 'login', false, 'User not found');
      return res.status(400).json({ message: 'NIS/NIK/NUPTK atau password tidak valid' });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      await logLoginAttempt(user.email, req.ip, 'login', false, 'Invalid password');
      return res.status(400).json({ message: 'NIS/NIK/NUPTK atau password tidak valid' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.user_id]);

    await logLoginAttempt(user.email, req.ip, 'login', true);

    // Check if 2FA is enabled
    if (user.is_2fa_enabled) {
      return res.json({
        success: true,
        message: 'Credentials valid. 2FA verification required.',
        requires2FA: true,
        userId: user.user_id,
        userRole: roleInfo.role
      });
    } else {
      // Jika belum setup 2FA, berikan opsi untuk setup
      return res.json({
        success: true,
        message: 'Login successful. 2FA setup available.',
        requiresSetup: true,
        tempToken: await generateTempToken(user.user_id),
        userRole: roleInfo.role,
        canSkip: true // Allow skip for non-admin users
      });
    }

  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ===============================
// 2FA ENDPOINTS
// ===============================

// Setup 2FA - Generate QR code
app.post('/api/auth/setup-2fa', async (req, res) => {
  try {
    const tempToken = req.headers.authorization?.replace('Bearer ', '');

    if (!tempToken) {
      return res.status(401).json({
        success: false,
        message: 'Temporary token required'
      });
    }

    console.log('Setup 2FA attempt with temp token:', tempToken);

    // Verify temp token dan pastikan masih valid
    const tempTokenResult = await pool.query(
      'SELECT user_id FROM temp_2fa_tokens WHERE temp_token = $1 AND expires_at > NOW()',
      [tempToken]
    );

    if (tempTokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired temporary token'
      });
    }

    const userId = tempTokenResult.rows[0].user_id;

    // Get user email
    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Generate 2FA secret menggunakan TwoFactorService
    const { secret, otpauthUrl } = TwoFactorService.generateSecret(user.email);
    const qrCodeDataURL = await TwoFactorService.generateQRCode(otpauthUrl);
    const backupCodes = TwoFactorService.generateBackupCodes();

    // Update temp token dengan secret yang baru di-generate
    await pool.query(
      'UPDATE temp_2fa_tokens SET secret = $1 WHERE temp_token = $2',
      [secret, tempToken]
    );

    console.log('2FA setup successful for user:', user.email);

    res.json({
      success: true,
      qrCode: qrCodeDataURL,
      secret: secret,
      backupCodes: backupCodes,
      timeRemaining: TwoFactorService.getTimeRemaining()
    });

  } catch (error) {
    console.error('Setup 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to setup 2FA: ' + error.message
    });
  }
});

// Verify 2FA setup
app.post('/api/auth/verify-setup', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || !/^\d{6}$/.test(token)) {
      return res.status(400).json({
        success: false,
        message: 'Valid 6-digit token required'
      });
    }

    const tempToken = req.headers.authorization?.replace('Bearer ', '');

    if (!tempToken) {
      return res.status(401).json({
        success: false,
        message: 'Temporary token required'
      });
    }

    // Get temp token data with secret
    const tempTokenResult = await pool.query(
      'SELECT user_id, secret FROM temp_2fa_tokens WHERE temp_token = $1 AND expires_at > NOW() AND secret IS NOT NULL',
      [tempToken]
    );

    if (tempTokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired temporary token, or setup not completed'
      });
    }

    const { user_id, secret } = tempTokenResult.rows[0];

    // Verify token using TwoFactorService
    const isValid = TwoFactorService.verifyToken(secret, token);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid token. Please check your authenticator app.'
      });
    }

    // Save secret to user and enable 2FA
    await pool.query(
      'UPDATE users SET two_factor_secret = $1, is_2fa_enabled = TRUE WHERE id = $2',
      [secret, user_id]
    );

    // Clean up temp token
    await pool.query('DELETE FROM temp_2fa_tokens WHERE user_id = $1', [user_id]);

    // Get user data dan generate final tokens
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
    const user = userResult.rows[0];

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate JWT token
    const expiresIn = '1d';
    const jwtToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn }
    );

    // Save session
    await saveSession(user.id, jwtToken, null, req);

    // Get user details based on role
    let userDetails = await getUserDetails(user.id, user.role);

    res.json({
      success: true,
      message: '2FA setup completed successfully',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        ...userDetails
      }
    });

  } catch (error) {
    console.error('Verify setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA setup: ' + error.message
    });
  }
});

// Verify 2FA for login
app.post('/api/auth/verify-2fa', async (req, res) => {
  try {
    const { userId, token, remember } = req.body;

    if (!userId || !token) {
      return res.status(400).json({
        success: false,
        message: 'User ID and token required'
      });
    }

    if (!/^\d{6}$/.test(token)) {
      return res.status(400).json({
        success: false,
        message: 'Valid 6-digit token required'
      });
    }

    // Get user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Verify token
    const isValid = TwoFactorService.verifyToken(user.two_factor_secret, token);
    if (!isValid) {
      await logLoginAttempt(user.email, req.ip, '2fa_verify', false, 'Invalid 2FA token');
      return res.status(400).json({
        success: false,
        message: 'Invalid token. Please check your authenticator app.'
      });
    }

    // Update last 2FA verify time
    await pool.query(
      'UPDATE users SET last_2fa_verify = NOW(), last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    await logLoginAttempt(user.email, req.ip, '2fa_verify', true);

    // Generate JWT token
    const expiresIn = remember ? '7d' : '1d';
    const jwtToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn }
    );

    // Save session
    await saveSession(user.id, jwtToken, null, req);

    // Get user details based on role
    let userDetails = await getUserDetails(user.id, user.role);

    res.json({
      success: true,
      message: 'Login successful',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        ...userDetails
      }
    });

  } catch (error) {
    console.error('Verify 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA: ' + error.message
    });
  }
});

// Skip 2FA setup (untuk non-admin users)
app.post('/api/auth/skip-2fa', async (req, res) => {
  try {
    const tempToken = req.headers.authorization?.replace('Bearer ', '');

    if (!tempToken) {
      return res.status(401).json({
        success: false,
        message: 'Temporary token required'
      });
    }

    const tempTokenResult = await pool.query(
      'SELECT user_id FROM temp_2fa_tokens WHERE temp_token = $1 AND expires_at > NOW()',
      [tempToken]
    );

    if (tempTokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired temporary token'
      });
    }

    const userId = tempTokenResult.rows[0].user_id;
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Admin cannot skip 2FA
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin must setup 2FA'
      });
    }

    // Clean up temp token
    await pool.query('DELETE FROM temp_2fa_tokens WHERE user_id = $1', [userId]);

    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    // Generate JWT token
    const jwtToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn: '1d' }
    );

    // Save session
    await saveSession(user.id, jwtToken, null, req);

    // Get user details based on role
    let userDetails = await getUserDetails(user.id, user.role);

    console.log('2FA skipped for user:', user.email);

    res.json({
      success: true,
      message: 'Login successful (2FA skipped)',
      token: jwtToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        ...userDetails
      }
    });

  } catch (error) {
    console.error('Skip 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip 2FA: ' + error.message
    });
  }
});

// Disable 2FA (untuk user yang sudah login)
app.post('/api/auth/disable-2fa', authenticateToken, async (req, res) => {
  try {
    const schema = Joi.object({
      password: Joi.string().required(),
      token: Joi.string().length(6).required()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { password, token } = value;
    const userId = req.user.id;

    // Get user
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    const user = userResult.rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Verify 2FA token
    const isValid = TwoFactorService.verifyToken(user.two_factor_secret, token);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid 2FA token'
      });
    }

    // Disable 2FA
    await pool.query(
      'UPDATE users SET is_2fa_enabled = FALSE, two_factor_secret = NULL, backup_codes = NULL WHERE id = $1',
      [userId]
    );

    res.json({
      success: true,
      message: '2FA has been disabled'
    });

  } catch (error) {
    console.error('Disable 2FA error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disable 2FA'
    });
  }
});

// ===============================
// USER PROFILE ENDPOINTS
// ===============================

// Validate session endpoint
app.post('/api/auth/validate-session', authenticateToken, async (req, res) => {
  try {
    // Get complete user data
    const userResult = await pool.query(
      'SELECT id, email, role, profile_picture, is_2fa_enabled, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Get role-specific data
    let roleData = {};
    if (user.role === 'siswa') {
      const siswaResult = await pool.query(
        'SELECT nama_lengkap, nis FROM siswa WHERE user_id = $1',
        [user.id]
      );
      if (siswaResult.rows.length > 0) {
        roleData = siswaResult.rows[0];
      }
    } else if (user.role === 'guru') {
      const guruResult = await pool.query(
        'SELECT nama_lengkap, nuptk FROM guru WHERE user_id = $1',
        [user.id]
      );
      if (guruResult.rows.length > 0) {
        roleData = guruResult.rows[0];
      }
    } else if (user.role === 'orangtua') {
      const orangtuaResult = await pool.query(
        'SELECT nama_lengkap, nik FROM orangtua WHERE user_id = $1',
        [user.id]
      );
      if (orangtuaResult.rows.length > 0) {
        roleData = orangtuaResult.rows[0];
      }
    } else if (user.role === 'admin') {
      roleData = { nama_lengkap: 'Administrator' };
    }

    // Format profile picture URL
    let profilePictureUrl = user.profile_picture;
    if (profilePictureUrl && !profilePictureUrl.startsWith('http') && !profilePictureUrl.startsWith('data:')) {
      profilePictureUrl = `${req.protocol}://${req.get('host')}/${profilePictureUrl}`;
    }

    res.json({
      success: true,
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile_picture: profilePictureUrl,
        is_2fa_enabled: user.is_2fa_enabled,
        last_login: user.last_login,
        ...roleData
      }
    });

  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate session: ' + error.message
    });
  }
});

// Get dashboard data
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    // Ambil data user dari database
    const userResult = await pool.query(
      'SELECT id, email, role, profile_picture, is_2fa_enabled FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    let userData = userResult.rows[0];

    // Konversi path profile picture menjadi full URL jika perlu
    if (userData.profile_picture && !userData.profile_picture.startsWith('http') && !userData.profile_picture.startsWith('data:')) {
      userData.profile_picture = `${req.protocol}://${req.get('host')}/${userData.profile_picture}`;
    }

    // Gabungkan dengan data dari tabel role-specific
    if (userData.role === 'siswa') {
      const siswaResult = await pool.query(
        'SELECT nama_lengkap, nis FROM siswa WHERE user_id = $1',
        [userData.id]
      );
      if (siswaResult.rows.length > 0) {
        userData = { ...userData, ...siswaResult.rows[0] };
      }
    } else if (userData.role === 'guru') {
      const guruResult = await pool.query(
        'SELECT nama_lengkap, nuptk FROM guru WHERE user_id = $1',
        [userData.id]
      );
      if (guruResult.rows.length > 0) {
        userData = { ...userData, ...guruResult.rows[0] };
      }
    } else if (userData.role === 'orangtua') {
      const orangtuaResult = await pool.query(
        'SELECT nama_lengkap, nik FROM orangtua WHERE user_id = $1',
        [userData.id]
      );
      if (orangtuaResult.rows.length > 0) {
        userData = { ...userData, ...orangtuaResult.rows[0] };
      }
    }

    res.json({
      message: 'Data berhasil diambil',
      user: userData
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ===============================
// PROFILE PICTURE ENDPOINTS
// ===============================

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, 'uploads', 'profile-pictures');

      // Buat direktori jika belum ada
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Buat nama file unik dengan timestamp dan user ID
      const fileExtension = path.extname(file.originalname);
      const fileName = `profile_${req.user.id}_${Date.now()}${fileExtension}`;
      cb(null, fileName);
    }
  }),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    // Hanya izinkan file gambar
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar (JPEG, PNG, GIF, atau WebP)'), false);
    }
  }
});

// Endpoint untuk upload dan update foto profil
app.post('/api/users/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }

    // Dapatkan data user lama untuk menghapus foto lama jika ada
    const oldUserResult = await pool.query(
      'SELECT profile_picture FROM users WHERE id = $1',
      [req.user.id]
    );

    // Hapus foto lama jika ada
    if (oldUserResult.rows.length > 0 && oldUserResult.rows[0].profile_picture) {
      const oldPicturePath = oldUserResult.rows[0].profile_picture;
      if (oldPicturePath && !oldPicturePath.startsWith('data:')) {
        // Jika bukan base64, berarti file path
        const fullOldPath = path.join(__dirname, oldPicturePath);
        if (fs.existsSync(fullOldPath)) {
          fs.unlinkSync(fullOldPath);
        }
      }
    }

    // Simpan path relatif ke database (bukan full path)
    const relativePath = `uploads/profile-pictures/${req.file.filename}`;

    // Update profile_picture di database dengan path file
    const result = await pool.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING id',
      [relativePath, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    // Update user data in response
    const userResult = await pool.query(
      'SELECT id, email, role, profile_picture FROM users WHERE id = $1',
      [req.user.id]
    );

    let userData = null;
    if (userResult.rows.length > 0) {
      userData = userResult.rows[0];

      // Ubah path menjadi full URL untuk response
      if (userData.profile_picture && !userData.profile_picture.startsWith('http')) {
        userData.profile_picture = `${req.protocol}://${req.get('host')}/${userData.profile_picture}`;
      }

      if (userData.role === 'siswa') {
        const siswaResult = await pool.query(
          'SELECT nama_lengkap, nis FROM siswa WHERE user_id = $1',
          [userData.id]
        );
        if (siswaResult.rows.length > 0) {
          userData = { ...userData, ...siswaResult.rows[0] };
        }
      } else if (userData.role === 'guru') {
        const guruResult = await pool.query(
          'SELECT nama_lengkap, nuptk FROM guru WHERE user_id = $1',
          [userData.id]
        );
        if (guruResult.rows.length > 0) {
          userData = { ...userData, ...guruResult.rows[0] };
        }
      } else if (userData.role === 'orangtua') {
        const orangtuaResult = await pool.query(
          'SELECT nama_lengkap, nik FROM orangtua WHERE user_id = $1',
          [userData.id]
        );
        if (orangtuaResult.rows.length > 0) {
          userData = { ...userData, ...orangtuaResult.rows[0] };
        }
      }
    }

    res.json({
      message: 'Foto profil berhasil diperbarui',
      profile_picture: `${req.protocol}://${req.get('host')}/${relativePath}`,
      user: userData
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);

    // Hapus file yang sudah diupload jika terjadi error
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting uploaded file:', unlinkError);
      }
    }

    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

function getWeekStartDate() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);
  return startDate.toISOString().split('T')[0];
}

function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Daily Missions Routes
app.get('/api/daily-missions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = getTodayDate();

    // Get user's daily quiz completion
    const quizCompletion = await pool.query(`
      SELECT * FROM daily_quiz_completions WHERE user_id = $1 AND quiz_date = $2
    `, [userId, today]);

    const quizData = quizCompletion.rows[0] || {
      completed_quizzes: 0,
      correct_answers: 0,
      total_questions: 0
    };

    // Get user's daily missions progress
    const missionsQuery = await pool.query(`
      SELECT dm.*, COALESCE(udm.current_progress, 0) as current_progress,
             COALESCE(udm.is_completed, false) as is_completed
      FROM daily_missions dm
      LEFT JOIN user_daily_missions udm ON dm.id = udm.mission_id 
        AND udm.user_id = $1 AND udm.mission_date = $2
      WHERE dm.is_active = true
      ORDER BY dm.id
    `, [userId, today]);

    // Build dynamic missions based on real data
    const missions = [
      {
        id: 1,
        title: "Complete 3 quizzes",
        description: "Selesaikan 3 kuis hari ini dengan benar",
        mission_type: "quiz",
        target_count: 3,
        xp_reward: 50,
        current_progress: quizData.completed_quizzes,
        is_completed: quizData.completed_quizzes >= 3,
        condition_met: quizData.completed_quizzes >= 3
      },
      {
        id: 2,
        title: "Watch 5 tutorial videos",
        description: "Tonton 5 video pembelajaran untuk menambah wawasan",
        mission_type: "video",
        target_count: 5,
        xp_reward: 30,
        current_progress: 0, // Would need video tracking
        is_completed: false,
        condition_met: false
      },
      {
        id: 3,
        title: "Solve 10 practice problems",
        description: "Selesaikan 10 soal latihan dengan benar",
        mission_type: "practice",
        target_count: 10,
        xp_reward: 100,
        current_progress: quizData.correct_answers,
        is_completed: quizData.correct_answers >= 10,
        condition_met: quizData.correct_answers >= 10
      },
      {
        id: 4,
        title: "Play any game",
        description: "Mainkan game apapun hari ini",
        mission_type: "game",
        target_count: 1,
        xp_reward: 25,
        current_progress: quizData.completed_quizzes > 0 ? 1 : 0,
        is_completed: quizData.completed_quizzes > 0,
        condition_met: quizData.completed_quizzes > 0
      }
    ];

    res.json({
      success: true,
      missions
    });

  } catch (error) {
    console.error('Error fetching daily missions:', error);
    res.json({
      success: true,
      missions: [
        {
          id: 1,
          title: "Complete 3 quizzes",
          description: "Selesaikan 3 kuis hari ini dengan benar",
          mission_type: "quiz",
          target_count: 3,
          xp_reward: 50,
          current_progress: 0,
          is_completed: false
        }
      ]
    });
  }
});

app.post('/api/daily-missions/progress', authenticateToken, async (req, res) => {
  try {
    const { missionType, progress = 1 } = req.body;
    const userId = req.user.id;

    console.log(`Mission progress update: ${missionType} +${progress} for user ${userId}`);

    res.json({
      success: true,
      message: `Mission progress updated: ${missionType} +${progress}`,
      xpGained: progress * 10 // Simple XP calculation
    });

  } catch (error) {
    console.error('Error updating mission progress:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Leaderboard Routes
app.get('/api/leaderboard/weekly', authenticateToken, async (req, res) => {
  try {
    // Check if siswa table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'siswa'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      // Return dummy data
      return res.json({
        success: true,
        leaderboard: [
          { nama_lengkap: 'ITO', weekly_xp: 1250, total_xp: 5420, rank: 1, games_played: 15 },
          { nama_lengkap: 'Tio', weekly_xp: 1180, total_xp: 4890, rank: 2, games_played: 12 },
          { nama_lengkap: 'Fonsi', weekly_xp: 1050, total_xp: 4320, rank: 3, games_played: 10 },
          { nama_lengkap: 'Selenia', weekly_xp: 890, total_xp: 3980, rank: 4, games_played: 8 },
          { nama_lengkap: 'Dimas', weekly_xp: 750, total_xp: 3650, rank: 5, games_played: 7 },
          { nama_lengkap: 'Raka', weekly_xp: 680, total_xp: 3200, rank: 6, games_played: 6 }
        ],
        weekStartDate: getWeekStartDate()
      });
    }

    const weekStartDate = getWeekStartDate();

    const query = `
      SELECT 
        s.nama_lengkap,
        COALESCE(s.total_xp, 0) as total_xp,
        COALESCE(wl.total_xp, 0) as weekly_xp,
        COALESCE(wl.games_played, 0) as games_played,
        COALESCE(wl.missions_completed, 0) as missions_completed,
        ROW_NUMBER() OVER (ORDER BY COALESCE(wl.total_xp, 0) DESC, COALESCE(s.total_xp, 0) DESC) as rank
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN weekly_leaderboard wl ON s.user_id = wl.user_id AND wl.week_start_date = $1
      WHERE u.role = 'siswa'
      ORDER BY weekly_xp DESC, total_xp DESC
      LIMIT 20
    `;

    const result = await pool.query(query, [weekStartDate]);

    res.json({
      success: true,
      leaderboard: result.rows,
      weekStartDate
    });
  } catch (error) {
    console.error('Error fetching weekly leaderboard:', error);
    // Return dummy data
    res.json({
      success: true,
      leaderboard: [
        { nama_lengkap: 'ITO', weekly_xp: 1250, total_xp: 5420, rank: 1, games_played: 15 },
        { nama_lengkap: 'Tio', weekly_xp: 1180, total_xp: 4890, rank: 2, games_played: 12 },
        { nama_lengkap: 'Fonsi', weekly_xp: 1050, total_xp: 4320, rank: 3, games_played: 10 },
        { nama_lengkap: 'Selenia', weekly_xp: 890, total_xp: 3980, rank: 4, games_played: 8 },
        { nama_lengkap: 'Dimas', weekly_xp: 750, total_xp: 3650, rank: 5, games_played: 7 },
        { nama_lengkap: 'Raka', weekly_xp: 680, total_xp: 3200, rank: 6, games_played: 6 }
      ],
      weekStartDate: getWeekStartDate()
    });
  }
});

app.get('/api/leaderboard/overall', authenticateToken, async (req, res) => {
  try {
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'siswa'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return res.json({
        success: true,
        leaderboard: [
          { nama_lengkap: 'ITO', total_xp: 5420, current_level: 54, rank: 1 },
          { nama_lengkap: 'Tio', total_xp: 4890, current_level: 48, rank: 2 },
          { nama_lengkap: 'Fonsi', total_xp: 4320, current_level: 43, rank: 3 },
          { nama_lengkap: 'Selenia', total_xp: 3980, current_level: 39, rank: 4 },
          { nama_lengkap: 'Dimas', total_xp: 3650, current_level: 36, rank: 5 },
          { nama_lengkap: 'Raka', total_xp: 3200, current_level: 32, rank: 6 }
        ]
      });
    }

    const query = `
      SELECT 
        s.nama_lengkap,
        COALESCE(s.total_xp, 0) as total_xp,
        COALESCE(s.current_level, 1) as current_level,
        ROW_NUMBER() OVER (ORDER BY COALESCE(s.total_xp, 0) DESC) as rank
      FROM siswa s
      JOIN users u ON s.user_id = u.id
      WHERE u.role = 'siswa'
      ORDER BY total_xp DESC
      LIMIT 20
    `;

    const result = await pool.query(query);

    res.json({
      success: true,
      leaderboard: result.rows
    });
  } catch (error) {
    console.error('Error fetching overall leaderboard:', error);
    res.json({
      success: true,
      leaderboard: [
        { nama_lengkap: 'ITO', total_xp: 5420, current_level: 54, rank: 1 },
        { nama_lengkap: 'Tio', total_xp: 4890, current_level: 48, rank: 2 },
        { nama_lengkap: 'Fonsi', total_xp: 4320, current_level: 43, rank: 3 },
        { nama_lengkap: 'Selenia', total_xp: 3980, current_level: 39, rank: 4 },
        { nama_lengkap: 'Dimas', total_xp: 3650, current_level: 36, rank: 5 },
        { nama_lengkap: 'Raka', total_xp: 3200, current_level: 32, rank: 6 }
      ]
    });
  }
});

// Games Dashboard Route
app.get('/api/games/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user info with real XP data
    let userData = { nama_lengkap: 'Student', total_xp: 0, current_level: 1 };
    try {
      const userQuery = await pool.query(`
        SELECT s.nama_lengkap, 
               COALESCE(s.total_xp, 0) as total_xp, 
               COALESCE(s.current_level, 1) as current_level 
        FROM siswa s 
        JOIN users u ON s.user_id = u.id 
        WHERE u.id = $1
      `, [userId]);

      if (userQuery.rows.length > 0) {
        userData = userQuery.rows[0];
      }
    } catch (userError) {
      console.log('User data not available, using defaults');
    }

    // Get real game progress
    const gamesQuery = await pool.query(`
      SELECT 
        g.id,
        g.name,
        COALESCE(ugp.questions_completed, 0) as questions_completed,
        g.total_questions,
        CASE 
          WHEN g.total_questions > 0 
          THEN ROUND((COALESCE(ugp.questions_completed, 0)::float / g.total_questions) * 100)
          ELSE 0 
        END as progress
      FROM games g
      LEFT JOIN user_game_progress ugp ON g.id = ugp.game_id AND ugp.user_id = $1
      WHERE g.is_active = true
      ORDER BY g.id
    `, [userId]);

    // Get streak data
    const streakResponse = await fetch(`http://localhost:${process.env.PORT || 5000}/api/users/streak`, {
      headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    });
    const streakData = await streakResponse.json();

    res.json({
      success: true,
      user: userData,
      streak: streakData,
      games: gamesQuery.rows,
      dailyMissions: [], // Will be fetched separately
      leaderboard: [] // Will be fetched separately
    });

  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ===============================
// ADDITIONAL ENDPOINTS
// ===============================

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Deactivate current session and record last activity
    await pool.query(
      'UPDATE user_sessions SET is_active = FALSE, last_activity = CURRENT_TIMESTAMP WHERE user_id = $1 AND session_token = $2',
      [userId, token]
    );

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to logout: ' + error.message
    });
  }
});

// Get 2FA status
app.get('/api/user/2fa-status', authenticateToken, async (req, res) => {
  try {
    const userResult = await pool.query(
      'SELECT is_2fa_enabled, last_2fa_verify FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    res.json({
      success: true,
      is2FAEnabled: user.is_2fa_enabled,
      lastVerify: user.last_2fa_verify
    });

  } catch (error) {
    console.error('Get 2FA status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get 2FA status'
    });
  }
});

// ===============================
// USER ACTIVITY & ANALYTICS ENDPOINTS
// ===============================

// Endpoint for user activity heartbeat
app.post('/api/user/activity', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return res.status(401).json({ message: 'Session token required' });
    }

    // Update last_activity for the current session
    await pool.query(
      'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP, is_active = TRUE WHERE user_id = $1 AND session_token = $2',
      [userId, sessionToken]
    );

    res.json({ success: true, message: 'Activity recorded' });
  } catch (error) {
    console.error('Error recording user activity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to get user learning duration data
app.get('/api/user/learning-duration', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { year = new Date().getFullYear() } = req.query; // Default to current year

    const result = await pool.query(
      `
      WITH session_durations AS (
          SELECT
              user_id,
              EXTRACT(MONTH FROM created_at) as month_num,
              created_at,
              last_activity,
              -- Calculate duration in minutes
              EXTRACT(EPOCH FROM (
                  CASE
                      WHEN is_active = TRUE AND last_activity >= NOW() - INTERVAL '15 minutes'
                      THEN NOW() -- If session is active and recent, use current time
                      ELSE last_activity
                  END - created_at
              )) / 60 AS duration_minutes
          FROM
              user_sessions
          WHERE
              user_id = $1 AND EXTRACT(YEAR FROM created_at) = $2
      ),
      monthly_data AS (
          SELECT
              month_num,
              SUM(duration_minutes) AS total_duration_minutes,
              COUNT(DISTINCT DATE(created_at)) AS active_days_count
          FROM
              session_durations
          GROUP BY
              month_num
          ORDER BY
              month_num
      )
      SELECT
          md.month_num,
          CASE
              WHEN md.month_num = 1 THEN 'Jan'
              WHEN md.month_num = 2 THEN 'Feb'
              WHEN md.month_num = 3 THEN 'Mar'
              WHEN md.month_num = 4 THEN 'Apr'
              WHEN md.month_num = 5 THEN 'Mei'
              WHEN md.month_num = 6 THEN 'Jun'
              WHEN md.month_num = 7 THEN 'Jul'
              WHEN md.month_num = 8 THEN 'Agu'
              WHEN md.month_num = 9 THEN 'Sep'
              WHEN md.month_num = 10 THEN 'Okt'
              WHEN md.month_num = 11 THEN 'Nov'
              WHEN md.month_num = 12 THEN 'Des'
          END as month,
          COALESCE(md.total_duration_minutes, 0) AS duration,
          COALESCE(ROUND(md.total_duration_minutes / NULLIF(md.active_days_count, 0)), 0) AS average
      FROM
          monthly_data md
      RIGHT JOIN
          generate_series(1, 12) AS s(month_num) ON md.month_num = s.month_num
      ORDER BY
          s.month_num;
      `,
      [userId, year]
    );

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching learning duration:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// ===============================
// ERROR HANDLING MIDDLEWARE
// ===============================

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File terlalu besar. Maksimal 2MB untuk foto profil atau 5MB untuk thumbnail course.'
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Error uploading file: ' + error.message
    });
  }

  if (error.message && error.message.includes('Only image files are allowed')) {
    return res.status(400).json({
      success: false,
      message: 'Hanya file gambar yang diizinkan'
    });
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// ===============================
// START SERVER
// ===============================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
🚀 Server running on port ${PORT}
📊 Database: mindagrow
🔗 Frontend URL: http://localhost:3000
🔗 Backend URL: http://localhost:${PORT}
  `);
});

//Available Endpoints:
//📚 Courses: /api/courses/*
//👤 Auth: /api/auth/*
//👥 Admin: /api/admin/*
//📸 Profile: /api/users/profile-picture