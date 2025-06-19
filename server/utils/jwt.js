// utils/jwt.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

class JWTUtils {
  /**
   * Generate JWT tokens
   * @param {Object} payload - User data to encode
   * @param {string} expiresIn - Token expiration time
   * @returns {Object} - Access token and refresh token
   */
  static generateTokens(payload, expiresIn = '1d') {
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn });
    
    // Generate refresh token with longer expiration
    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Generate single access token
   * @param {Object} payload - User data to encode
   * @param {string} expiresIn - Token expiration time
   * @returns {string} - JWT token
   */
  static generateAccessToken(payload, expiresIn = '1d') {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  /**
   * Verify JWT token
   * @param {string} token - JWT token to verify
   * @returns {Object} - Decoded payload or null if invalid
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return null;
    }
  }

  /**
   * Decode JWT token without verification (for debugging)
   * @param {string} token - JWT token to decode
   * @returns {Object} - Decoded payload or null
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      console.error('JWT decode error:', error.message);
      return null;
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token to check
   * @returns {boolean} - True if expired
   */
  static isTokenExpired(token) {
    try {
      const decoded = jwt.decode(token);
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {string} refreshToken - Refresh token
   * @returns {Object} - New access token or null
   */
  static refreshAccessToken(refreshToken) {
    try {
      const decoded = this.verifyToken(refreshToken);
      
      if (!decoded || decoded.type !== 'refresh') {
        return null;
      }

      // Remove type from payload and generate new access token
      const { type, iat, exp, ...payload } = decoded;
      return this.generateAccessToken(payload);
    } catch (error) {
      console.error('Token refresh error:', error.message);
      return null;
    }
  }

  /**
   * Extract token from Authorization header
   * @param {string} authHeader - Authorization header value
   * @returns {string|null} - Extracted token or null
   */
  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7); // Remove 'Bearer ' prefix
  }

  /**
   * Generate temporary token for 2FA setup
   * @param {number} userId - User ID
   * @param {string} purpose - Token purpose (setup, reset, etc.)
   * @returns {string} - Temporary token
   */
  static generateTempToken(userId, purpose = 'setup') {
    return jwt.sign(
      { 
        userId, 
        purpose, 
        type: 'temp' 
      }, 
      JWT_SECRET, 
      { expiresIn: '10m' } // 10 minutes for temp tokens
    );
  }

  /**
   * Verify temporary token
   * @param {string} token - Temporary token to verify
   * @param {string} expectedPurpose - Expected token purpose
   * @returns {Object|null} - Decoded payload or null
   */
  static verifyTempToken(token, expectedPurpose = 'setup') {
    try {
      const decoded = this.verifyToken(token);
      
      if (!decoded || decoded.type !== 'temp' || decoded.purpose !== expectedPurpose) {
        return null;
      }

      return decoded;
    } catch (error) {
      return null;
    }
  }
}

module.exports = JWTUtils;