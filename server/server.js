// server.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');

// Import config
const db = require('./config/db');  // Ubah dari dbConnection menjadi db

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

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

// In your server.js, add this to serve the frontend
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Add this at the bottom of your routes to handle SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// API Routes
app.use('/api/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Middleware untuk logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
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
    // Tidak perlu memanggil db sebagai fungsi, karena tampaknya
    // db.js hanya mengekspor koneksi database, bukan fungsi
    
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