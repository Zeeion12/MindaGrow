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

const TwoFactorService = require('./services/TwoFactorService');
const courseRoutes = require('./routes/courses');

require('dotenv').config();

const app = express();
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
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

app.use('/api/courses', courseRoutes);

// Middleware untuk admin only
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Rate limiting middleware untuk 2FA (BARU)
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
  
  switch(role) {
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

    // Create sample course for testing (hanya jika ada guru)
    const guruExists = await pool.query("SELECT id FROM users WHERE role = 'guru' LIMIT 1");
    if (guruExists.rows.length > 0) {
      const courseExists = await pool.query("SELECT id FROM courses WHERE title LIKE '%Biologi%' LIMIT 1");
      if (courseExists.rows.length === 0) {
        const biologiCategory = await pool.query("SELECT id FROM categories WHERE name = 'Biologi' LIMIT 1");
        if (biologiCategory.rows.length > 0) {
          await pool.query(`
            INSERT INTO courses (
              title, description, category_id, level, price, duration, 
              instructor_id, instructor_role, created_by
            ) VALUES (
              'Biologi - Reproduksi Manusia',
              'Pada modul ini anda akan belajar mengenai organ reproduksi yang ada pada manusia serta belajar mengenai kegunaanya. Lorem ipsum dolor sit amet consectetur adipisicing elit.',
              $1, 'beginner', 0, 120, $2, 'guru', $2
            )
          `, [biologiCategory.rows[0].id, guruExists.rows[0].id]);

          // Add sample modules
          const courseResult = await pool.query("SELECT id FROM courses WHERE title = 'Biologi - Reproduksi Manusia' LIMIT 1");
          if (courseResult.rows.length > 0) {
            const courseId = courseResult.rows[0].id;
            await pool.query(`
              INSERT INTO modules (course_id, title, description, duration, order_index) VALUES
              ($1, 'Pengenalan Sistem Reproduksi', 'Memahami dasar-dasar sistem reproduksi manusia', 30, 1),
              ($1, 'Organ Reproduksi Pria', 'Mempelajari anatomi dan fungsi organ reproduksi pria', 30, 2),
              ($1, 'Organ Reproduksi Wanita', 'Mempelajari anatomi dan fungsi organ reproduksi wanita', 30, 3),
              ($1, 'Proses Fertilisasi', 'Memahami proses pembuahan dan kehamilan', 30, 4)
            `, [courseId]);
          }
          
          console.log('Sample course "Biologi - Reproduksi Manusia" created');
        }
      }
    }

    // Buat tabel untuk temporary 2FA tokens
    await pool.query(`
      CREATE TABLE IF NOT EXISTS temp_2fa_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        temp_token VARCHAR(255) NOT NULL,
        secret VARCHAR(255) NOT NULL,
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
    } else {
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
};

// HELPER FUNCTIONS UNTUK 2FA (BARU)
// ===============================

const generateTempToken = async (userId) => {
  const tempToken = require('crypto').randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // PERBAIKAN: Hanya insert user_id, temp_token, dan expires_at
  // Secret akan di-set nanti saat setup 2FA
  await pool.query(
    'INSERT INTO temp_2fa_tokens (user_id, temp_token, expires_at) VALUES ($1, $2, $3)',
    [userId, tempToken, expiresAt]
  );

  return tempToken;
};

const logLoginAttempt = async (email, ipAddress, attemptType, success, errorMessage = null) => {
  try {
    await pool.query(
      'INSERT INTO login_attempts (email, ip_address, attempt_type, success, error_message) VALUES ($1, $2, $3, $4, $5)',
      [email, ipAddress, attemptType, success, errorMessage]
    );
  } catch (error) {
    console.error('Error logging login attempt:', error);
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

    // BARU: Cek 2FA untuk admin
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

// Search courses (enhanced search)
app.get('/api/courses/search', async (req, res) => {
  try {
    const { q, category, level, instructor, sort = 'newest' } = req.query;
    
    let query = `
      SELECT 
        c.id,
        c.title,
        c.description,
        c.thumbnail,
        c.price,
        c.level,
        c.created_at,
        cat.name as category_name,
        CASE 
          WHEN c.instructor_role = 'guru' THEN g.nama_lengkap
          WHEN c.instructor_role = 'admin' THEN 'Administrator'
          ELSE 'Unknown'
        END as instructor_name,
        COUNT(DISTINCT e.id) as enrolled_count,
        AVG(cr.rating) as average_rating
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      LEFT JOIN guru g ON c.instructor_id = g.user_id AND c.instructor_role = 'guru'
      LEFT JOIN enrollments e ON c.id = e.course_id
      LEFT JOIN course_ratings cr ON c.id = cr.course_id
      WHERE c.status = 'active'
    `;

    const params = [];
    let paramCount = 0;

    if (q) {
      paramCount++;
      query += ` AND (c.title ILIKE $${paramCount} OR c.description ILIKE $${paramCount + 1})`;
      params.push(`%${q}%`, `%${q}%`);
      paramCount++;
    }

    if (category) {
      paramCount++;
      query += ` AND c.category_id = $${paramCount}`;
      params.push(category);
    }

    if (level) {
      paramCount++;
      query += ` AND c.level = $${paramCount}`;
      params.push(level);
    }

    if (instructor) {
      paramCount++;
      query += ` AND c.instructor_id = $${paramCount}`;
      params.push(instructor);
    }

    query += ' GROUP BY c.id, cat.name, g.nama_lengkap';

    // Add sorting
    switch (sort) {
      case 'popular':
        query += ' ORDER BY enrolled_count DESC, average_rating DESC NULLS LAST';
        break;
      case 'rating':
        query += ' ORDER BY average_rating DESC NULLS LAST, enrolled_count DESC';
        break;
      case 'price_low':
        query += ' ORDER BY c.price ASC';
        break;
      case 'price_high':
        query += ' ORDER BY c.price DESC';
        break;
      default: // newest
        query += ' ORDER BY c.created_at DESC';
    }

    query += ' LIMIT 50'; // Limit results

    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });

  } catch (error) {
    console.error('Search courses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching courses',
      error: error.message
    });
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
    switch(userRole) {
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
// EXISTING USER ENDPOINTS
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
    console.log('Login attempt with identifier:', identifier);

    // BARU: Cek dulu apakah ini admin login
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
        
        // BARU: Cek 2FA untuk admin
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
      console.log('User found in siswa table with role:', user.role);
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
    
    // BARU: Check if 2FA is enabled
    if (user.is_2fa_enabled) {
      return res.json({
        success: true,
        message: 'Credentials valid. 2FA verification required.',
        requires2FA: true,
        userId: user.user_id,
        userRole: roleInfo.role
      });
    } else {
      // BARU: Jika belum setup 2FA, berikan opsi untuk setup
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
    
    console.log('2FA setup verification successful for user:', user.email);

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

    console.log('2FA verification successful for user:', user.email);

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

app.use('/uploads/profile-pictures', express.static(path.join(__dirname, 'uploads', 'profile-pictures')));

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

app.delete('/api/users/profile-picture', authenticateToken, async (req, res) => {
  try {
    // Dapatkan data user untuk menghapus file foto
    const userResult = await pool.query(
      'SELECT profile_picture FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    const currentPicture = userResult.rows[0].profile_picture;
    
    // Hapus file foto jika ada
    if (currentPicture && !currentPicture.startsWith('data:')) {
      const filePath = path.join(__dirname, currentPicture);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    // Update database, set profile_picture ke NULL
    await pool.query(
      'UPDATE users SET profile_picture = NULL WHERE id = $1',
      [req.user.id]
    );
    
    res.json({ message: 'Foto profil berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { id: userId } = req.user;
    const token = req.headers.authorization?.replace('Bearer ', '');

    // Deactivate current session
    await pool.query(
      'UPDATE user_sessions SET is_active = FALSE WHERE user_id = $1 AND session_token = $2',
      [userId, token]
    );

    console.log('User logged out:', userId);

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

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});