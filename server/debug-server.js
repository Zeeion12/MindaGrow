const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Buat express app untuk test
const app = express();

// Middleware dasar
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Pastikan kita memiliki database yang dikonfigurasi dengan benar
const db = require('./config/db');

// Route test untuk memeriksa koneksi database
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW() as server_time');
    res.json({
      success: true,
      message: 'Database connection successful',
      time: result.rows[0].server_time
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Route test untuk register dengan lebih banyak debug info
app.post('/api/debug-register', async (req, res) => {
  try {
    console.log('DEBUG: Received registration request');
    console.log('DEBUG: Request body:', JSON.stringify(req.body, null, 2));
    
    // Validasi request body
    if (!req.body.userType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing userType' 
      });
    }
    
    if (!req.body.namaLengkap) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing namaLengkap' 
      });
    }
    
    // Cek untuk ID field berdasarkan userType
    const userType = req.body.userType;
    let idField;
    
    switch (userType) {
      case 'siswa':
        idField = 'nis';
        break;
      case 'orangtua':
        idField = 'nik';
        break;
      case 'guru':
        idField = 'nuptk';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: `Invalid userType: ${userType}`
        });
    }
    
    // Cek apakah ID field ada
    if (!req.body[idField]) {
      return res.status(400).json({
        success: false,
        message: `Missing ${idField} for ${userType}`
      });
    }
    
    // Simulasi query database
    console.log(`DEBUG: Would insert into ${userType} table with ${idField}: ${req.body[idField]}`);
    
    // Tampilkan nama tabel yang ada di database untuk debugging
    try {
      const tablesResult = await db.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
      `);
      
      console.log('DEBUG: Available tables:', tablesResult.rows.map(row => row.table_name));
      
      // Cek apakah tabel yang dibutuhkan ada
      const requiredTables = ['siswa', 'orangtua', 'guru'];
      const availableTables = tablesResult.rows.map(row => row.table_name);
      
      const missingTables = requiredTables.filter(table => !availableTables.includes(table));
      if (missingTables.length > 0) {
        console.log('DEBUG: Missing tables:', missingTables);
        return res.status(500).json({
          success: false,
          message: `Missing required tables: ${missingTables.join(', ')}. Run initDb.js to create them.`
        });
      }
      
      // Cek struktur tabel untuk table yang sesuai dengan userType
      if (availableTables.includes(userType)) {
        const tableInfoResult = await db.query(`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = $1
        `, [userType]);
        
        console.log(`DEBUG: ${userType} table structure:`, tableInfoResult.rows);
      }
      
    } catch (dbError) {
      console.error('DEBUG: Error checking database tables:', dbError);
    }
    
    // Cek passwords
    if (!req.body.password) {
      return res.status(400).json({
        success: false,
        message: 'Missing password'
      });
    }
    
    // Simulasi keberhasilan
    res.status(200).json({
      success: true,
      message: 'Registration data validated successfully (debug mode)',
      userData: {
        userType: req.body.userType,
        idField: idField,
        idValue: req.body[idField],
        namaLengkap: req.body.namaLengkap
      }
    });
    
  } catch (error) {
    console.error('DEBUG: Error in debug-register:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error in debug endpoint',
      error: error.message
    });
  }
});

// Start server di port debug
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Debug server running on port ${PORT}`);
  console.log(`Test database connection: http://localhost:${PORT}/api/test-db`);
  console.log(`Send test registration to: http://localhost:${PORT}/api/debug-register`);
});