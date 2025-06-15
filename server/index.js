const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Middleware untuk admin only
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
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
      console.log('Admin user already exists');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
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
      'SELECT id, email, password, role FROM users WHERE email = $1 AND role = $2',
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
    
    // Update last login
    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [admin.id]);
    
    // Generate JWT token
    const expiresIn = remember ? '7d' : '1d';
    const token = jwt.sign(
      { 
        id: admin.id, 
        role: admin.role,
        email: admin.email 
      },
      process.env.JWT_SECRET || 'your_jwt_secret_key',
      { expiresIn }
    );
    
    console.log('Admin login successful');
    res.json({ 
      token, 
      user: {
        id: admin.id,
        email: admin.email,
        role: admin.role
      }
    });
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

    res.json({
      totalUsers: parseInt(totalUsersResult.rows[0].count),
      todayLogins: parseInt(todayLoginsResult.rows[0].count),
      weekLogins: parseInt(weekLoginsResult.rows[0].count),
      roleStats: roleStatsResult.rows
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
      'SELECT id, email, role, last_login, created_at FROM users WHERE id = $1 AND role != $2',
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
app.post('/api/login', async (req, res) => {
  const { identifier, password, remember } = req.body;
  
  try {
    console.log('Login attempt with identifier:', identifier);

    // BARU: Cek dulu apakah ini admin login
    if (identifier.includes('@')) {
      // Kemungkinan email admin
      const adminResult = await pool.query(
        'SELECT id, email, password, role FROM users WHERE email = $1 AND role = $2',
        [identifier, 'admin']
      );
      
      if (adminResult.rows.length > 0) {
        const admin = adminResult.rows[0];
        
        // Validate password
        const validPassword = await bcrypt.compare(password, admin.password);
        
        if (!validPassword) {
          return res.status(400).json({ message: 'Email atau password tidak valid' });
        }
        
        // Update last login
        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [admin.id]);
        
        // Generate JWT token
        const expiresIn = remember ? '7d' : '1d';
        const token = jwt.sign(
          { 
            id: admin.id, 
            role: admin.role,
            email: admin.email 
          },
          process.env.JWT_SECRET || 'your_jwt_secret_key',
          { expiresIn }
        );
        
        console.log('Admin login successful via /api/login');
        return res.json({ 
          token, 
          user: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            nama_lengkap: 'Administrator'
          }
        });
      }
    }
    
    let user;
    let roleInfo;
    
    // Check in siswa table
    const siswaResult = await pool.query(
      'SELECT s.*, u.email, u.password, u.role FROM siswa s JOIN users u ON s.user_id = u.id WHERE s.nis = $1',
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
        'SELECT g.*, u.email, u.password, u.role FROM guru g JOIN users u ON g.user_id = u.id WHERE g.nuptk = $1',
        [identifier]
      );
      
      if (guruResult.rows.length > 0) {
        user = guruResult.rows[0];
        console.log('User found in guru table with role:', user.role);
        roleInfo = {
          nama_lengkap: user.nama_lengkap,
          role: 'guru',
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
          console.log('User found in orangtua table with role:', user.role);
          roleInfo = {
            nama_lengkap: user.nama_lengkap,
            role: 'orangtua',
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
      { id: user.user_id, role: roleInfo.role, ...roleInfo },
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

// Get dashboard data
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    // Ambil data user dari database
    const userResult = await pool.query(
      'SELECT id, email, role, profile_picture FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    let userData = userResult.rows[0];
    
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
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File harus berupa gambar'), false);
    }
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint untuk upload dan update foto profil
app.post('/api/users/profile-picture', authenticateToken, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Tidak ada file yang diupload' });
    }
    
    const fileBuffer = req.file.buffer;
    const base64Image = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
    
    // Update profile_picture di database
    const result = await pool.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING id',
      [base64Image, req.user.id]
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
      profile_picture: base64Image,
      user: userData
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ===============================
// UTILITY FUNCTIONS (COMMENTED OUT AS THEY'RE ONE-TIME USE)
// ===============================

/*
async function fixParentRoles() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const parentNiksResult = await client.query('SELECT nik FROM orangtua');
    
    if (parentNiksResult.rows.length === 0) {
      console.log('Tidak ada data orangtua ditemukan.');
      return;
    }
    
    for (const row of parentNiksResult.rows) {
      const parentResult = await client.query('SELECT user_id FROM orangtua WHERE nik = $1', [row.nik]);
      
      if (parentResult.rows.length > 0) {
        const userId = parentResult.rows[0].user_id;
        await client.query('UPDATE users SET role = $1 WHERE id = $2', ['orangtua', userId]);
      }
    }
    
    await client.query('COMMIT');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saat memperbaiki role orangtua:', error);
  } finally {
    client.release();
  }
}

async function updateProfilePictureColumn() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN profile_picture TYPE BYTEA USING profile_picture::BYTEA;
    `);
    
    await client.query('COMMIT');
    
    console.log('Kolom profile_picture berhasil diubah menjadi tipe BYTEA');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saat mengubah kolom profile_picture:', error);
  } finally {
    client.release();
  }
}

async function addProfilePictureColumn() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_picture TEXT DEFAULT NULL;
    `);
    
    await client.query('COMMIT');
    
    console.log('Kolom profile_picture berhasil ditambahkan ke tabel users');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error saat menambahkan kolom profile_picture:', error);
  } finally {
    client.release();
  }
}
*/

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});