const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });
console.log(`Using .env from server directory: ${envPath}`);

// Import routes
const authRoutes = require('./routes/authRoutes');

// Import config
const db = require('./config/db');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Tampilkan konfigurasi database
console.log('Database configuration:');
console.log(`- User: ${process.env.DB_USER || 'postgres'}`);
console.log(`- Host: ${process.env.DB_HOST || 'localhost'}`);
console.log(`- Database: ${process.env.DB_NAME || 'mindagrow'}`);
console.log(`- Port: ${process.env.DB_PORT || 5432}`);
console.log(`- Password: [SET]`);

// Middleware
app.use(cors({
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date(),
    server: 'MindaGrow API',
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);

// Serve frontend from dist folder
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan'
  });
});

// Start the server
const startServer = async () => {
  try {
    // Cek koneksi database
    await db.query('SELECT NOW()');
    console.log(`Database connected successfully at: ${new Date().toISOString()}`);
    
    // Start listening on specified port
    app.listen(PORT, () => {
      console.log(`Server berjalan pada http://localhost:${PORT}`);
      console.log('Tekan CTRL+C untuk menghentikan server');
    });
  } catch (error) {
    console.error('Gagal menjalankan server:', error);
    process.exit(1);
  }
};

// Run the server
startServer();