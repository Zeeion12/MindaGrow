const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: 'mindagrow',
  password: process.env.DB_PASSWORD || '',
  port: process.env.DB_PORT || 5432,
});

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

    // Get user from database dengan struktur PostgreSQL
    const userResult = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Opsional: Periksa apakah sesi masih aktif di database
    const sessionCheck = await pool.query(
      'SELECT * FROM user_sessions WHERE user_id = $1 AND session_token = $2 AND is_active = TRUE AND expires_at > NOW()',
      [decoded.id, token]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Session not valid or expired. Please login again.'
      });
    }

    req.user = {
      ...decoded,
      ...userResult.rows[0]
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.'
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication',
      error: error.message
    });
  }
};

// Optional auth middleware - doesn't require token but adds user if available
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');

      const userResult = await pool.query(
        'SELECT id, email, role FROM users WHERE id = $1',
        [decoded.id]
      );

      if (userResult.rows.length > 0) {
        req.user = {
          ...decoded,
          ...userResult.rows[0]
        };
      }
    }

    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
};

module.exports = authenticateToken;
module.exports.optionalAuth = optionalAuth;