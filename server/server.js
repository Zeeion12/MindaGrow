const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection setup
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mindagrow',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
});

// Database init function
async function initializeDatabase() {
  try {
    // Check if the 'users' table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM pg_tables
        WHERE tablename = 'users'
      );
    `);
    
    // If 'users' table doesn't exist, create it
    if (!tableCheck.rows[0].exists) {
      console.log('Creating users table...');
      
      // Create users table
      await pool.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          role VARCHAR(20) NOT NULL,
          username VARCHAR(50) UNIQUE NOT NULL,
          nama_lengkap VARCHAR(100) NOT NULL,
          password VARCHAR(100) NOT NULL,
          email VARCHAR(100),
          no_telepon VARCHAR(20),
          gender VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          profile_image VARCHAR(255)
        );
      `);
      
      console.log('Users table created successfully');
    } else {
      console.log('Users table already exists');
    }
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on server startup
initializeDatabase();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// Registration endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { role, namaLengkap, nis, noTelepon, surel, gender, password } = req.body;
    
    // Check if username already exists
    const userCheck = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [nis]
    );
    
    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'NIS/username sudah terdaftar'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Insert user into database
    const newUser = await pool.query(
      `INSERT INTO users (role, username, nama_lengkap, password, email, no_telepon, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, role, username, nama_lengkap`,
      [role, nis, namaLengkap, hashedPassword, surel, noTelepon, gender]
    );
    
    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      user: newUser.rows[0]
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// Login endpoint
// Di server.js, pastikan endpoint login mengembalikan data lengkap

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username (NIS/NIK/NUPTK)
    const result = await pool.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }
    
    const user = result.rows[0];
    
    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    }
    
    // Create JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Remove password from user object
    delete user.password;
    
    // Log data yang dikirim ke client untuk debugging
    console.log('Sending login response:', {
      success: true,
      token: token.substring(0, 10) + '...',
      user: {
        id: user.id,
        role: user.role,
        username: user.username,
        nama_lengkap: user.nama_lengkap
      }
    });
    
    res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// Check auth status endpoint
app.get('/api/auth/check-status', authenticateToken, async (req, res) => {
  try {
    // User is already authenticated from the middleware
    const userId = req.user.id;
    
    // Get user data from database
    const result = await pool.query(
      'SELECT id, role, username, nama_lengkap, email, no_telepon, gender, profile_image FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Check status error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// Update user profile endpoint
app.put('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { nama_lengkap, email, no_telepon, gender, profile_image } = req.body;
    
    // Update user profile in database
    const result = await pool.query(
      `UPDATE users 
       SET 
        nama_lengkap = COALESCE($1, nama_lengkap),
        email = COALESCE($2, email),
        no_telepon = COALESCE($3, no_telepon),
        gender = COALESCE($4, gender),
        profile_image = COALESCE($5, profile_image)
       WHERE id = $6
       RETURNING id, role, username, nama_lengkap, email, no_telepon, gender, profile_image`,
      [nama_lengkap, email, no_telepon, gender, profile_image, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    res.json({
      success: true,
      message: 'Profil berhasil diperbarui',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// Change password endpoint
app.post('/api/user/change-password', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    // Validate request
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password saat ini dan password baru diperlukan'
      });
    }
    
    // Get user from database
    const userResult = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan'
      });
    }
    
    const user = userResult.rows[0];
    
    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Password saat ini tidak sesuai'
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password in database
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedNewPassword, userId]
    );
    
    res.json({
      success: true,
      message: 'Password berhasil diubah'
    });
    
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server'
    });
  }
});

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Autentikasi diperlukan'
    });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
    
    req.user = user;
    next();
  });
}

  // Tambahkan middleware ini di atas middleware lainnya di server.js

// Logging middleware untuk debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Tambahkan listener untuk log response
  const originalSend = res.send;
  res.send = function (body) {
    console.log(`[${new Date().toISOString()}] Response Status: ${res.statusCode}`);
    
    // Jika response adalah JSON dan bukan binary/file
    if (typeof body === 'string' && body.startsWith('{')) {
      try {
        const data = JSON.parse(body);
        // Sembunyikan data sensitif (token) dan log hanya struktur response
        if (data.token) {
          data.token = data.token.substring(0, 10) + '...';
        }
        console.log('Response data structure:', Object.keys(data));
      } catch (e) {
        // Jika bukan JSON valid, abaikan
      }
    }
    
    return originalSend.call(this, body);
  };
  
  next();
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});