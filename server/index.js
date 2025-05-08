const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors({
    origin: 'http://localhost:3000', // Your frontend URL
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
  }
});
// Middleware for JWT authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Akses ditolak' });
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token tidak valid' });
    req.user = user;
    next();
  });
};

// Check NIK parent (for student registration)
app.post('/api/check-nik', async (req, res) => {
  const { nik } = req.body;
  
  try {
    const result = await pool.query('SELECT * FROM siswa WHERE nik_orangtua = $1', [nik]);
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
    
    // Insert into users table
    const userResult = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id',
      [email, hashedPassword, role]
    );
    
    const userId = userResult.rows[0].id;
    
    // Insert into role-specific table
    if (role === 'siswa') {
      await pool.query(
        'INSERT INTO siswa (user_id, nis, nama_lengkap, nik_orangtua, no_telepon) VALUES ($1, $2, $3, $4, $5)',
        [userId, nis, nama_lengkap, nik_orangtua, no_telepon]
      );
    } else if (role === 'guru') {
      await pool.query(
        'INSERT INTO guru (user_id, nuptk, nama_lengkap, no_telepon) VALUES ($1, $2, $3, $4)',
        [userId, nuptk, nama_lengkap, no_telepon]
      );
    } else if (role === 'orangtua') {
      // Periksa dulu apakah NIK terdaftar di tabel siswa
      const nikCheck = await pool.query('SELECT * FROM siswa WHERE nik_orangtua = $1', [nik]);
      
      if (nikCheck.rows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ message: 'NIK tidak terdaftar oleh siswa manapun' });
      }
      
      // Jika NIK valid, lanjutkan proses registrasi
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
app.post('/api/login', async (req, res) => {
  console.log('Login request received:', req.body);
  const { identifier, password, remember } = req.body;
  
  try {
    // Check if the identifier is NIS, NIK, or NUPTK
    let user;
    let roleInfo;
    
    // Check in siswa table
    const siswaResult = await pool.query(
      'SELECT s.*, u.email, u.password, u.role FROM siswa s JOIN users u ON s.user_id = u.id WHERE s.nis = $1',
      [identifier]
    );
    
    if (siswaResult.rows.length > 0) {
      user = siswaResult.rows[0];
      roleInfo = {
        nama_lengkap: user.nama_lengkap,
        role: user.role,
        nis: user.nis
      };
    } else {
      // Check in guru table
      const guruResult = await pool.query(
        'SELECT g.*, u.email, u.password, u.role FROM guru g JOIN users u ON g.user_id = u.id WHERE g.nuptk = $1',
        [identifier]
      );
      
      if (guruResult.rows.length > 0) {
        user = guruResult.rows[0];
        roleInfo = {
          nama_lengkap: user.nama_lengkap,
          role: user.role,
          nuptk: user.nuptk
        };
      } else {
        // Check in orangtua table
        const orangtuaResult = await pool.query(
          'SELECT o.*, u.email, u.password, u.role FROM orangtua o JOIN users u ON o.user_id = u.id WHERE o.nik = $1',
          [identifier]
        );
        
        if (orangtuaResult.rows.length > 0) {
          user = orangtuaResult.rows[0];
          roleInfo = {
            nama_lengkap: user.nama_lengkap,
            role: user.role,
            nik: user.nik
          };
        }
      }
    }
    
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return res.status(400).json({ message: 'NIS/NIK/NUPTK atau password tidak valid' });
    }
    
    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword);
    
    if (!validPassword) {
      return res.status(400).json({ message: 'NIS/NIK/NUPTK atau password tidak valid' });
    }
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.user_id]);
    
    // Generate JWT token
    const expiresIn = remember ? '7d' : '1d';
    const token = jwt.sign(
      { id: user.user_id, role: user.role, ...roleInfo },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn }
    );
    
    console.log('Sending response with token and user info');
    res.json({ token, user: roleInfo });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Protected route example
app.get('/api/dashboard', authenticateToken, (req, res) => {
  res.json({ 
    message: 'Data berhasil diambil',
    user: req.user 
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});