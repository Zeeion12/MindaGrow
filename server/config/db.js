const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// Tentukan paths untuk file .env
const rootEnvPath = path.resolve(__dirname, '../../../.env');
const serverEnvPath = path.resolve(__dirname, '../../.env');
const configEnvPath = path.resolve(__dirname, '../.env');

// Cek dan gunakan file .env yang tersedia
let envPath = null;
if (fs.existsSync(rootEnvPath)) {
  envPath = rootEnvPath;
  console.log(`Using .env from root directory: ${rootEnvPath}`);
} else if (fs.existsSync(serverEnvPath)) {
  envPath = serverEnvPath;
  console.log(`Using .env from server directory: ${serverEnvPath}`);
} else if (fs.existsSync(configEnvPath)) {
  envPath = configEnvPath;
  console.log(`Using .env from config directory: ${configEnvPath}`);
} else {
  console.warn('No .env file found. Using default values.');
}

// Load .env file jika ditemukan
if (envPath) {
  dotenv.config({ path: envPath });
}

// Hardcoded defaults sebagai fallback
const dbUser = process.env.DB_USER || 'postgres';
const dbHost = process.env.DB_HOST || 'localhost';
const dbName = process.env.DB_NAME || 'mindagrow';
const dbPassword = process.env.DB_PASSWORD || 'manut123';
const dbPort = process.env.DB_PORT || 5432;

// Log konfigurasi database
console.log('Database configuration:');
console.log('- User:', dbUser);
console.log('- Host:', dbHost);
console.log('- Database:', dbName);
console.log('- Port:', dbPort);
console.log('- Password:', dbPassword ? '[SET]' : '[NOT SET]');

// Create connection pool
const pool = new Pool({
  user: dbUser,
  host: dbHost,
  database: dbName,
  password: dbPassword,
  port: dbPort,
  // Tambahkan opsi untuk menangani koneksi lebih baik
  connectionTimeoutMillis: 10000, // 10 seconds
  idleTimeoutMillis: 30000, // 30 seconds
  max: 20 // maximum connection pool size
});

// Test the database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Database connected successfully at:', res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};