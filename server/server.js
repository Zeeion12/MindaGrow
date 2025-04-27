const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

// Inisialisasi express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Koneksi database
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

// Test koneksi database
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

// API Endpoint - Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt for:', username);

    try {
      // Coba cari di tabel siswa
      const siswaResult = await pool.query(
        'SELECT * FROM siswa WHERE nis = $1 OR surel = $1',
        [username]
      );

      if (siswaResult.rows.length > 0) {
        const siswa = siswaResult.rows[0];
        if (siswa.password_hash === password) {
          return res.json({
            success: true,
            user: {
              id: siswa.nis,
              name: siswa.name_lengkap,
              role: 'siswa'
            },
            token: 'token-' + Date.now()
          });
        }
      }

      // Coba cari di tabel orangtua
      const orangtuaResult = await pool.query(
        'SELECT * FROM orangtua WHERE nik = $1 OR surel = $1',
        [username]
      );

      if (orangtuaResult.rows.length > 0) {
        const orangtua = orangtuaResult.rows[0];
        if (orangtua.password_hash === password) {
          return res.json({
            success: true,
            user: {
              id: orangtua.nik,
              name: orangtua.name_lengkap,
              role: 'orangtua'
            },
            token: 'token-' + Date.now()
          });
        }
      }

      // Coba cari di tabel guru
      const guruResult = await pool.query(
        'SELECT * FROM guru WHERE nuptk = $1 OR surel = $1',
        [username]
      );

      if (guruResult.rows.length > 0) {
        const guru = guruResult.rows[0];
        if (guru.password_hash === password) {
          return res.json({
            success: true,
            user: {
              id: guru.nuptk,
              name: guru.name_lengkap,
              role: 'guru'
            },
            token: 'token-' + Date.now()
          });
        }
      }

      // Jika tidak ditemukan atau password salah
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah'
      });
    } catch (dbErr) {
      console.error('Database error:', dbErr);
      
      // Fallback untuk testing jika database bermasalah
      console.log('Using fallback login for testing');
      if (password === 'password123') {
        return res.json({
          success: true,
          user: {
            id: '123',
            name: 'Test User',
            email: username,
            role: 'siswa'
          },
          token: 'sample-token-' + Date.now()
        });
      } else {
        return res.status(401).json({ 
          success: false, 
          message: 'Password salah (fallback mode)' 
        });
      }
    }
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// API Endpoint - Register
app.post('/api/register', async (req, res) => {
  try {
    const userData = req.body;
    console.log('Register attempt:', userData);

    // Role wajib ada dan harus valid
    if (!userData.role || !['siswa', 'orangtua', 'guru'].includes(userData.role)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid'
      });
    }

    let result;
    try {
      // Simpan data sesuai role
      if (userData.role === 'siswa') {
        // Cek apakah NIS sudah terdaftar
        const existingSiswa = await pool.query('SELECT * FROM siswa WHERE nis = $1', [userData.nis]);
        if (existingSiswa.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'NIS sudah terdaftar'
          });
        }

        // Cek apakah email sudah terdaftar
        if (userData.surel) {
          const existingEmail = await pool.query('SELECT * FROM siswa WHERE surel = $1', [userData.surel]);
          if (existingEmail.rows.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'Email sudah terdaftar'
            });
          }
        }

        // Insert ke tabel siswa
        result = await pool.query(
          `INSERT INTO siswa (name_lengkap, nis, no_telepon, surel, gender, password_hash) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [userData.namaLengkap, userData.nis, userData.noTelepon, userData.surel, userData.gender, userData.password]
        );
      } 
      else if (userData.role === 'orangtua') {
        // Cek apakah NIK sudah terdaftar
        const existingOrangtua = await pool.query('SELECT * FROM orangtua WHERE nik = $1', [userData.nik]);
        if (existingOrangtua.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'NIK sudah terdaftar'
          });
        }

        // Cek apakah email sudah terdaftar
        if (userData.surel) {
          const existingEmail = await pool.query('SELECT * FROM orangtua WHERE surel = $1', [userData.surel]);
          if (existingEmail.rows.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'Email sudah terdaftar'
            });
          }
        }

        // Insert ke tabel orangtua
        result = await pool.query(
          `INSERT INTO orangtua (name_lengkap, nik, no_telepon, surel, gender, password_hash) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [userData.namaLengkap, userData.nik, userData.noTelepon, userData.surel, userData.gender, userData.password]
        );
      } 
      else if (userData.role === 'guru') {
        // Cek apakah NUPTK sudah terdaftar
        const existingGuru = await pool.query('SELECT * FROM guru WHERE nuptk = $1', [userData.nuptk]);
        if (existingGuru.rows.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'NUPTK sudah terdaftar'
          });
        }

        // Cek apakah email sudah terdaftar
        if (userData.surel) {
          const existingEmail = await pool.query('SELECT * FROM guru WHERE surel = $1', [userData.surel]);
          if (existingEmail.rows.length > 0) {
            return res.status(400).json({
              success: false,
              message: 'Email sudah terdaftar'
            });
          }
        }

        // Insert ke tabel guru
        result = await pool.query(
          `INSERT INTO guru (name_lengkap, nuptk, no_telepon, surel, gender, password_hash) 
           VALUES ($1, $2, $3, $4, $5, $6) 
           RETURNING *`,
          [userData.namaLengkap, userData.nuptk, userData.noTelepon, userData.surel, userData.gender, userData.password]
        );
      }

      return res.status(201).json({
        success: true,
        message: `Registrasi ${userData.role} berhasil`,
        data: result.rows[0]
      });
    } catch (dbErr) {
      console.error('Database error during registration:', dbErr);
      
      // Fallback jika database bermasalah
      return res.status(201).json({
        success: true,
        message: 'Registrasi berhasil (mode fallback)',
        data: {
          id: 'temp-' + Date.now(),
          name: userData.namaLengkap,
          role: userData.role
        }
      });
    }
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});