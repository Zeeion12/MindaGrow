const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv'); // Pastikan dotenv sudah diinstall

// Load .env file from the root project directory (one level up)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('Testing database connection...');
console.log('Connection details:');
console.log('- User:', process.env.DB_USER);
console.log('- Host:', process.env.DB_HOST);
console.log('- Database:', process.env.DB_NAME);
console.log('- Port:', process.env.DB_PORT);
console.log('- Password:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');

// Create a connection pool
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mindagrow',
  password: process.env.DB_PASSWORD || 'manut123',
  port: process.env.DB_PORT || 5432,
  // Add connection timeout to fail fast
  connectionTimeoutMillis: 5000,
});

// Test simple query
pool.query('SELECT NOW() as current_time', (err, res) => {
  if (err) {
    console.error('❌ Database connection ERROR:', err.message);
    console.error('Details:', err);
    
    // Check common issues
    if (err.code === 'ECONNREFUSED') {
      console.error('\nPossible solutions:');
      console.error('1. Make sure PostgreSQL service is running');
      console.error('2. Check if port is correct (default is 5432)');
      console.error('3. Verify the host is correct (usually localhost)');
    } else if (err.code === '28P01') {
      console.error('\nPossible solutions:');
      console.error('1. Check if password is correct in .env file');
      console.error('2. Verify the username has proper permissions');
    } else if (err.code === '3D000') {
      console.error('\nPossible solutions:');
      console.error('1. Database "mindagrow" does not exist. Create it with:');
      console.error('   CREATE DATABASE mindagrow;');
    }
  } else {
    console.log('✅ Database connection SUCCESSFUL!');
    console.log('Current time from database:', res.rows[0].current_time);
    
    // If successful, check if tables exist
    pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `, (tableErr, tableRes) => {
      if (tableErr) {
        console.error('Error checking tables:', tableErr.message);
      } else {
        if (tableRes.rows.length === 0) {
          console.log('❌ No tables found. You need to run initDb.js to create tables.');
        } else {
          console.log('\nExisting tables:');
          tableRes.rows.forEach(row => {
            console.log(`- ${row.table_name}`);
          });
          
          // Check if the required tables exist
          const requiredTables = ['siswa', 'orangtua', 'guru'];
          const missingTables = requiredTables.filter(
            table => !tableRes.rows.some(row => row.table_name === table)
          );
          
          if (missingTables.length > 0) {
            console.log('\n❌ Missing required tables:', missingTables.join(', '));
            console.log('Run initDb.js to create these tables.');
          } else {
            console.log('\n✅ All required tables exist!');
          }
        }
      }
      pool.end();
    });
  }
});