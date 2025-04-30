const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, // HARUS terbaca sebagai string biasa
  port: Number(process.env.DB_PORT),
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch((err) => console.error('❌ PostgreSQL Connection Error:', err));

module.exports = pool;