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

async function fixParentRoles() {
  const client = await pool.connect();
  
  try {
    // Mulai transaksi
    await client.query('BEGIN');
    
    // Temukan semua NIK dari tabel orangtua
    const parentNiksResult = await client.query('SELECT nik FROM orangtua');
    
    if (parentNiksResult.rows.length === 0) {
      console.log('Tidak ada data orangtua ditemukan.');
      return;
    }
    
    // Untuk setiap NIK orangtua, periksa user_id dan update role di tabel users
    for (const row of parentNiksResult.rows) {
      const parentResult = await client.query('SELECT user_id FROM orangtua WHERE nik = $1', [row.nik]);
      
      if (parentResult.rows.length > 0) {
        const userId = parentResult.rows[0].user_id;
        
        // Update role di tabel users menjadi 'orangtua'
        await client.query('UPDATE users SET role = $1 WHERE id = $2', ['orangtua', userId]);
      }
    }
    
    // Commit transaksi
    await client.query('COMMIT');
    
  } catch (error) {
    // Rollback jika terjadi error
    await client.query('ROLLBACK');
    console.error('Error saat memperbaiki role orangtua:', error);
  } finally {
    // Lepaskan client
    client.release();
  }
}

async function updateProfilePictureColumn() {
  const client = await pool.connect();
  
  try {
    // Mulai transaksi
    await client.query('BEGIN');
    
    // Ubah tipe kolom profile_picture menjadi BYTEA
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN profile_picture TYPE BYTEA USING profile_picture::BYTEA;
    `);
    
    // Commit transaksi
    await client.query('COMMIT');
    
    console.log('Kolom profile_picture berhasil diubah menjadi tipe BYTEA');
  } catch (error) {
    // Rollback jika terjadi error
    await client.query('ROLLBACK');
    console.error('Error saat mengubah kolom profile_picture:', error);
  } finally {
    // Lepaskan client
    client.release();
  }
}

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

async function addProfilePictureColumn() {
  const client = await pool.connect();
  
  try {
    // Mulai transaksi
    await client.query('BEGIN');
    
    // Tambahkan kolom profile_picture ke tabel users
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_picture TEXT DEFAULT NULL;
    `);
    
    // Commit transaksi
    await client.query('COMMIT');
    
    console.log('Kolom profile_picture berhasil ditambahkan ke tabel users');
  } catch (error) {
    // Rollback jika terjadi error
    await client.query('ROLLBACK');
    console.error('Error saat menambahkan kolom profile_picture:', error);
  } finally {
    // Lepaskan client
    client.release();
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, 'uploads');
    
    // Buat direktori jika belum ada
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate nama file unik dengan timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// Filter untuk menerima hanya file gambar
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('File harus berupa gambar'), false);
  }
};

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
    
    // Baca file sebagai binary data
    const fileBuffer = req.file.buffer; // Jika menggunakan multer memory storage
    
    // Jika menggunakan disk storage, baca file dari disk
    // const fileBuffer = fs.readFileSync(req.file.path);
    
    // Convert buffer to base64 for easier storage and retrieval
    const base64Image = `data:${req.file.mimetype};base64,${fileBuffer.toString('base64')}`;
    
    // Update profile_picture di database
    const result = await pool.query(
      'UPDATE users SET profile_picture = $1 WHERE id = $2 RETURNING id',
      [base64Image, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    
    // Jika menggunakan disk storage, hapus file setelah disimpan di database
    // if (req.file.path) {
    //   fs.unlinkSync(req.file.path);
    // }
    
    // Update user data in response
    const userResult = await pool.query(
      'SELECT id, email, role, profile_picture FROM users WHERE id = $1',
      [req.user.id]
    );
    
    let userData = null;
    if (userResult.rows.length > 0) {
      userData = userResult.rows[0];
      
      // Jika kita menyimpan role-specific info di tabel terpisah, gabungkan datanya
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

// Check NIK parent (for student registration)
app.post('/api/check-nik', async (req, res) => {
  const { nik } = req.body;
  
  try {
    console.log('Checking NIK:', nik);
    
    // Perbaikan query - cari di tabel siswa, bukan orangtua
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
    // Tambahkan log untuk debug
    console.log('Login attempt with identifier:', identifier);
    
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
      console.log('User found in siswa table with role:', user.role);
      roleInfo = {
        nama_lengkap: user.nama_lengkap,
        role: 'siswa', // Pastikan role diset dengan benar
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
          role: 'guru', // Pastikan role diset dengan benar
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
            role: 'orangtua', // Pastikan role diset dengan benar
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});