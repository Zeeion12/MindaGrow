const fs = require('fs');
const path = require('path');

// Path ke file .env di root project
const rootEnvPath = path.resolve(__dirname, '../../.env');

// Path ke file .env di folder server
const serverEnvPath = path.resolve(__dirname, '../.env');

// Konten untuk file .env
const envContent = `# Database Configuration
DB_USER=postgres
DB_HOST=localhost
DB_NAME=mindagrow
DB_PASSWORD=manut123
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# Server Configuration
PORT=3000

UPLOAD_DIR=uploads

VITE_API_URL=http://localhost:3000
`;

// Fungsi untuk menulis file .env
function writeEnvFile(filePath) {
  try {
    fs.writeFileSync(filePath, envContent);
    console.log(`✅ File .env berhasil dibuat di: ${filePath}`);
  } catch (error) {
    console.error(`❌ Gagal membuat file .env di ${filePath}:`, error.message);
  }
}

// Cek apakah file .env sudah ada di root project
if (fs.existsSync(rootEnvPath)) {
  console.log(`File .env sudah ada di root project: ${rootEnvPath}`);
  console.log('Isi file .env saat ini:');
  console.log('-------------------------------------------');
  console.log(fs.readFileSync(rootEnvPath, 'utf8'));
  console.log('-------------------------------------------');
  
  const overwrite = process.argv.includes('--force');
  if (overwrite) {
    console.log('Menimpa file .env yang sudah ada karena flag --force diberikan');
    writeEnvFile(rootEnvPath);
  } else {
    console.log('File tidak ditimpa. Gunakan flag --force jika ingin menimpa file yang sudah ada.');
  }
} else {
  console.log('File .env tidak ditemukan di root project, membuat file baru...');
  writeEnvFile(rootEnvPath);
}

// Buat juga file .env di folder server sebagai cadangan
console.log('\nMembuat file .env di folder server sebagai cadangan...');
writeEnvFile(serverEnvPath);

console.log('\n⚠️ PENTING: Setelah membuat file .env, restart server Anda untuk menggunakan konfigurasi baru');