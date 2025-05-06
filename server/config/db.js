const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

// Konfigurasi koneksi database
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mindagrow',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

// Ekspor query helper untuk memudahkan akses database
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};