const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const http = require('http');

// Load .env file from the root project directory (one level up)
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
    // Skip if can't load from this path
  }
}

if (!envLoaded) {
  console.log('No .env file found. Using default values.');
}

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Konfigurasi server untuk mengatasi masalah ENOBUFS
const serverOptions = {
  maxHeaderSize: 16384, // 16KB header size
  keepAliveTimeout: 5000, // 5 seconds keep-alive timeout
  connectionsCheckingInterval: 30000 // 30 seconds interval to check for defunct connections
};

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handling large request bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('dev'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOAD_DIR || 'uploads')));

// Import routes - make sure to require the module that exports the router
const authRoutes = require('./routes/authRoutes');

// Health check endpoint for debugging connection issues
app.get('/api/health', (req, res) => {
  // Also check database connection
  try {
    const db = require('./config/db');
    
    db.query('SELECT NOW()', (err, result) => {
      if (err) {
        return res.status(500).json({
          status: 'error',
          message: 'Database connection error',
          error: err.message,
          timestamp: new Date().toISOString()
        });
      }
      
      res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        database: 'connected',
        dbTime: result.rows[0].now,
        timestamp: new Date().toISOString(),
        env: {
          nodeEnv: process.env.NODE_ENV || 'development',
          port: PORT
        }
      });
    });
  } catch (error) {
    res.status(200).json({
      status: 'partial',
      message: 'Server is running, but database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes - make sure authRoutes is a router
app.use('/api/auth', authRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to MindaGrow API',
    status: 'Server is running'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Create HTTP server with options
const server = http.createServer(serverOptions, app);

// Configure event handlers for server
server.on('error', (error) => {
  console.error('Server error:', error);
  
  // Handle specific error types
  if (error.code === 'ENOBUFS' || error.code === 'EMFILE') {
    console.error('Network buffer/file descriptor issue. Restarting server...');
    setTimeout(() => {
      server.close(() => {
        server.listen(PORT);
      });
    }, 1000);
  }
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check endpoint: http://localhost:${PORT}/api/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});