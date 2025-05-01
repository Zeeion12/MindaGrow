const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Middleware function
const authMiddleware = async (req, res, next) => {
  try {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Tidak terautentikasi'
      });
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user info from database based on user type
    let user;
    let query;
    let params;
    
    switch (decoded.userType) {
      case 'siswa':
        query = 'SELECT * FROM siswa WHERE nis = $1';
        params = [decoded.id];
        break;
      case 'orangtua':
        query = 'SELECT * FROM orangtua WHERE nik = $1';
        params = [decoded.id];
        break;
      case 'guru':
        query = 'SELECT * FROM guru WHERE nuptk = $1';
        params = [decoded.id];
        break;
      default:
        return res.status(401).json({
          success: false,
          message: 'Tipe pengguna tidak valid'
        });
    }
    
    const result = await db.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Pengguna tidak ditemukan'
      });
    }
    
    user = result.rows[0];
    
    // Remove sensitive information
    delete user.password_hash;
    
    // Add user data to request
    req.user = {
      ...user,
      userType: decoded.userType
    };
    
    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid atau telah kedaluwarsa'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memverifikasi autentikasi'
    });
  }
};

// Export the middleware function
module.exports = authMiddleware;