// middleware/authenticate.js
const JWTUtils = require('../utils/jwt');
const pool = require('../config/db');

/**
 * Main authentication middleware
 * Verifies JWT token and checks active session
 */
const authenticate = async (req, res, next) => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = JWTUtils.verifyToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Check if session is still active in database
    const sessionResult = await pool.query(
      'SELECT * FROM user_sessions WHERE session_token = $1 AND is_active = TRUE AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Session expired or invalid'
      });
    }

    // Get fresh user data from database
    const userResult = await pool.query(
      'SELECT id, email, role, is_2fa_enabled FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Set user data in request object
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      is_2fa_enabled: user.is_2fa_enabled,
      ...decoded // Include any additional data from JWT
    };

    // Update last activity
    await pool.query(
      'UPDATE user_sessions SET last_activity = NOW() WHERE session_token = $1',
      [token]
    );

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user data to request if token is valid, but doesn't block access
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = JWTUtils.verifyToken(token);
    if (!decoded) {
      req.user = null;
      return next();
    }

    // Check session
    const sessionResult = await pool.query(
      'SELECT * FROM user_sessions WHERE session_token = $1 AND is_active = TRUE AND expires_at > NOW()',
      [token]
    );

    if (sessionResult.rows.length === 0) {
      req.user = null;
      return next();
    }

    // Get user data
    const userResult = await pool.query(
      'SELECT id, email, role, is_2fa_enabled FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length > 0) {
      const user = userResult.rows[0];
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        is_2fa_enabled: user.is_2fa_enabled,
        ...decoded
      };

      // Update last activity
      await pool.query(
        'UPDATE user_sessions SET last_activity = NOW() WHERE session_token = $1',
        [token]
      );
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    req.user = null;
    next();
  }
};

/**
 * Role-based authorization middleware
 * Requires specific role(s) to access endpoint
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
      });
    }

    next();
  };
};

/**
 * Admin-only authorization middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

/**
 * 2FA verification middleware
 * Ensures user has completed 2FA if enabled
 */
const require2FA = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if user has 2FA enabled
    if (!req.user.is_2fa_enabled) {
      return next(); // 2FA not required
    }

    // Check if user has completed 2FA verification recently
    const userResult = await pool.query(
      'SELECT last_2fa_verify FROM users WHERE id = $1',
      [req.user.id]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = userResult.rows[0];
    const lastVerify = user.last_2fa_verify;

    // If no 2FA verification or verification is older than session duration
    if (!lastVerify) {
      return res.status(403).json({
        success: false,
        message: '2FA verification required',
        requires2FA: true
      });
    }

    // Check if 2FA verification is still valid (within last 24 hours)
    const verifyAge = Date.now() - new Date(lastVerify).getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (verifyAge > maxAge) {
      return res.status(403).json({
        success: false,
        message: '2FA re-verification required',
        requires2FA: true
      });
    }

    next();
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify 2FA status'
    });
  }
};

/**
 * Rate limiting middleware for sensitive operations
 */
const sensitiveOperationLimit = (maxAttempts = 3, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.ip}_${req.user?.id || 'anonymous'}`;
    const now = Date.now();

    if (!attempts.has(key)) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const userAttempts = attempts.get(key);

    if (now > userAttempts.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please try again later.',
        retryAfter: Math.ceil((userAttempts.resetTime - now) / 1000)
      });
    }

    userAttempts.count++;
    attempts.set(key, userAttempts);
    next();
  };
};

/**
 * Middleware to check if user owns the resource
 * Compares req.user.id with req.params.userId or req.body.userId
 */
const requireOwnership = (userIdParam = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const resourceUserId = req.params[userIdParam] || req.body[userIdParam];
    
    if (!resourceUserId) {
      return res.status(400).json({
        success: false,
        message: 'User ID parameter required'
      });
    }

    // Admin can access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // User can only access their own resources
    if (parseInt(resourceUserId) !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.'
      });
    }

    next();
  };
};

/**
 * Middleware to validate session and update activity
 */
const validateSession = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      return next();
    }

    // Check if session exists and is active
    const sessionResult = await pool.query(
      'SELECT id, created_at, last_activity FROM user_sessions WHERE session_token = $1 AND user_id = $2 AND is_active = TRUE',
      [token, req.user.id]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session'
      });
    }

    const session = sessionResult.rows[0];

    // Add session info to request
    req.session = {
      id: session.id,
      createdAt: session.created_at,
      lastActivity: session.last_activity
    };

    next();
  } catch (error) {
    console.error('Session validation error:', error);
    next(); // Continue even if session validation fails
  }
};

/**
 * Middleware to log API access for audit purposes
 */
const auditLog = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - User: ${req.user?.id || 'anonymous'} - IP: ${req.ip}`);

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] Response: ${res.statusCode} - Duration: ${duration}ms`);
    
    // Log to database for important operations
    if (req.method !== 'GET' && req.user) {
      logAuditEvent(req, res, data, duration).catch(console.error);
    }
    
    return originalJson.call(this, data);
  };

  next();
};

/**
 * Log audit events to database
 */
const logAuditEvent = async (req, res, responseData, duration) => {
  try {
    await pool.query(`
      INSERT INTO audit_logs (
        user_id, action, endpoint, method, ip_address, 
        user_agent, status_code, duration_ms, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      req.user.id,
      `${req.method} ${req.path}`,
      req.path,
      req.method,
      req.ip,
      req.get('User-Agent'),
      res.statusCode,
      duration
    ]);
  } catch (error) {
    // Don't let audit logging failures break the application
    console.error('Audit logging error:', error.message);
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requireRole,
  requireAdmin,
  require2FA,
  sensitiveOperationLimit,
  requireOwnership,
  validateSession,
  auditLog
};