const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'mindagrow',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Helper function untuk execute query
const execute = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return [result.rows, result.fields];
  } finally {
    client.release();
  }
};

module.exports = { pool, execute };