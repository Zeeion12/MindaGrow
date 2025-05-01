const { Pool } = require('pg');
const path = require('path');
const dotenv = require('dotenv');

// Load .env dari beberapa kemungkinan lokasi
const envPaths = [
  path.resolve(__dirname, '../../.env'),
  path.resolve(__dirname, '../.env'),
  path.resolve(__dirname, './.env')
];

let envLoaded = false;
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath });
    if (result.parsed) {
      console.log(`Loaded .env from ${envPath}`);
      envLoaded = true;
      break;
    }
  } catch (error) {
    // Gagal memuat .env dari path ini, coba path berikutnya
  }
}

if (!envLoaded) {
  console.log('No .env file found. Using default database credentials.');
}

// Gunakan default jika tidak ada di .env
const dbConfig = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'mindagrow',
  password: process.env.DB_PASSWORD || 'manut123',
  port: process.env.DB_PORT || 5432,
};

console.log('Database connection config:');
console.log('- User:', dbConfig.user);
console.log('- Host:', dbConfig.host);
console.log('- Database:', dbConfig.database);
console.log('- Port:', dbConfig.port);
console.log('- Password:', dbConfig.password ? '[SET]' : '[NOT SET]');

// Buat koneksi pool
const pool = new Pool(dbConfig);

// Fungsi utama
async function inspectDatabase() {
  try {
    console.log('\n🔍 CHECKING DATABASE CONNECTION...');
    
    const connectionResult = await pool.query('SELECT NOW() as current_time');
    console.log('✅ Database connection successful!');
    console.log('Current server time:', connectionResult.rows[0].current_time);
    
    // Cek database ada
    console.log('\n🔍 CHECKING DATABASE EXISTENCE...');
    const databaseResult = await pool.query('SELECT current_database()');
    console.log(`✅ Connected to database: ${databaseResult.rows[0].current_database}`);
    
    // Cek tabel yang tersedia
    console.log('\n🔍 CHECKING AVAILABLE TABLES...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tablesResult.rows.length === 0) {
      console.log('❌ No tables found in the database.');
      console.log('Run initDb.js to create the required tables.');
    } else {
      console.log(`✅ Found ${tablesResult.rows.length} tables:`);
      tablesResult.rows.forEach(row => {
        console.log(`- ${row.table_name}`);
      });
      
      // Cek tabel yang diperlukan
      console.log('\n🔍 CHECKING REQUIRED TABLES...');
      const requiredTables = ['siswa', 'orangtua', 'guru'];
      const availableTables = tablesResult.rows.map(row => row.table_name);
      
      const missingTables = requiredTables.filter(table => !availableTables.includes(table));
      if (missingTables.length > 0) {
        console.log(`❌ Missing required tables: ${missingTables.join(', ')}`);
        console.log('Run initDb.js to create these tables.');
      } else {
        console.log('✅ All required tables exist!');
        
        // Periksa struktur tabel
        console.log('\n🔍 CHECKING TABLE STRUCTURES...');
        
        for (const table of requiredTables) {
          console.log(`\nTable: ${table}`);
          const columnsResult = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [table]);
          
          columnsResult.rows.forEach(col => {
            console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(required)'}`);
          });
          
          // Periksa jumlah data
          const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
          console.log(`Total records: ${countResult.rows[0].count}`);
        }
      }
    }
    
    // Cek trigger atau constraint khusus
    console.log('\n🔍 CHECKING DATABASE CONSTRAINTS...');
    const constraintsResult = await pool.query(`
      SELECT conname as constraint_name, contype as constraint_type,
             conrelid::regclass as table_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
    `);
    
    if (constraintsResult.rows.length > 0) {
      console.log(`Found ${constraintsResult.rows.length} constraints:`);
      constraintsResult.rows.forEach(constraint => {
        const constraintType = {
          'c': 'CHECK',
          'f': 'FOREIGN KEY',
          'p': 'PRIMARY KEY',
          'u': 'UNIQUE',
          't': 'TRIGGER',
          'x': 'EXCLUSION'
        }[constraint.constraint_type] || constraint.constraint_type;
        
        console.log(`- ${constraint.constraint_name}: ${constraintType} on ${constraint.table_name}`);
      });
    } else {
      console.log('No specific constraints found.');
    }
    
    console.log('\n✅ DATABASE INSPECTION COMPLETE');
    
  } catch (error) {
    console.error('❌ ERROR DURING DATABASE INSPECTION:', error.message);
    console.error(error);
  } finally {
    // Tutup koneksi
    await pool.end();
  }
}

// Jalankan inspeksi
inspectDatabase();