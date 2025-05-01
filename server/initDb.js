const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Load .env file from the root project directory (one level up)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Now load the database configuration, which will use the environment variables
const db = require('./config/db');

async function initializeDatabase() {
  try {
    console.log('Initializing database...');
    
    // SQL for creating tables
    const createTablesSql = `
    -- Create siswa table
    CREATE TABLE IF NOT EXISTS siswa (
      nis VARCHAR(50) PRIMARY KEY,
      name_lengkap VARCHAR(100) NOT NULL,
      no_telepon VARCHAR(20),
      surel VARCHAR(100),
      gender VARCHAR(10),
      password_hash VARCHAR(255) NOT NULL,
      kelas VARCHAR(10),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create orangtua table
    CREATE TABLE IF NOT EXISTS orangtua (
      nik VARCHAR(16) PRIMARY KEY,
      name_lengkap VARCHAR(100) NOT NULL,
      no_telepon VARCHAR(20),
      surel VARCHAR(100),
      gender VARCHAR(10),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Create guru table
    CREATE TABLE IF NOT EXISTS guru (
      nuptk VARCHAR(20) PRIMARY KEY,
      name_lengkap VARCHAR(100) NOT NULL,
      no_telepon VARCHAR(20),
      surel VARCHAR(100),
      gender VARCHAR(10),
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Create indices for email lookups
    CREATE INDEX IF NOT EXISTS idx_siswa_surel ON siswa(surel);
    CREATE INDEX IF NOT EXISTS idx_orangtua_surel ON orangtua(surel);
    CREATE INDEX IF NOT EXISTS idx_guru_surel ON guru(surel);
    `;
    
    // Execute the SQL
    await db.query(createTablesSql);
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, process.env.UPLOAD_DIR || 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log(`Created uploads directory: ${uploadsDir}`);
    }
    
    console.log('Database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();