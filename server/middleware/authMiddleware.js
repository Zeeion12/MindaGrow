const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Tidak ada token, otorisasi ditolak'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      let user = null;
      let userType = decoded.userType;
      
      // Determine which table to query based on user type
      let table = '';
      let idField = '';
      
      switch (userType) {
        case 'siswa':
          table = 'siswa';
          idField = 'nis';
          break;
        case 'orangtua':
          table = 'orangtua';
          idField = 'nik';
          break;
        case 'guru':
          table = 'guru';
          idField = 'nuptk';
          break;
        default:
          return res.status(401).json({
            success: false,
            message: 'Token tidak valid'
          });
      }
      
      // Query database for user
      const query = `SELECT * FROM ${table} WHERE ${idField} = $1`;
      const result = await db.query(query, [decoded.id]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Token tidak valid'
        });
      }
      
      user = result.rows[0];
      delete user.password_hash; // Don't send password hash
      
      // Add user to request
      req.user = { ...user, userType };
      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Token tidak valid'
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};