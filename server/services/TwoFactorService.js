// services/TwoFactorService.js
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');

class TwoFactorService {
  /**
   * Generate 2FA secret for new user
   * @param {string} userName - User's display name (nama_lengkap)
   * @param {string} appName - Application name
   * @returns {Object} - Secret and OTP auth URL
   */
  static generateSecret(userName, appName = 'MindaGrow:') {
    const secret = speakeasy.generateSecret({
      name: `${appName} (${userName})`,
      issuer: appName,
      length: 32
    });
    
    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrcode: secret.qr_code_ascii,
      backupSecret: secret.hex // For backup purposes
    };
  }

  /**
   * Generate QR code image from OTP auth URL
   * @param {string} otpauthUrl - OTP auth URL
   * @param {Object} options - QR code options
   * @returns {Promise<string>} - Base64 QR code image
   */
  static async generateQRCode(otpauthUrl, options = {}) {
    try {
      const defaultOptions = {
        type: 'image/png',
        quality: 0.92,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        width: 256,
        ...options
      };

      return await QRCode.toDataURL(otpauthUrl, defaultOptions);
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify TOTP token
   * @param {string} secret - Base32 secret
   * @param {string} token - 6-digit token from authenticator
   * @param {number} window - Time window tolerance (default: 2)
   * @returns {boolean} - True if token is valid
   */
  static verifyToken(secret, token, window = 2) {
    try {
      if (!secret || !token) {
        return false;
      }

      // Remove any spaces or formatting from token
      const cleanToken = token.replace(/\s/g, '');
      
      if (!/^\d{6}$/.test(cleanToken)) {
        return false;
      }

      return speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: window, // Allow 2 steps before/after current time
        step: 30 // 30-second time step
      });
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  /**
   * Generate backup codes for account recovery
   * @param {number} count - Number of backup codes to generate
   * @returns {Array<string>} - Array of backup codes
   */
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify backup code
   * @param {Array<string>} backupCodes - Array of valid backup codes
   * @param {string} inputCode - Code entered by user
   * @returns {Object} - Verification result and remaining codes
   */
  static verifyBackupCode(backupCodes, inputCode) {
    if (!backupCodes || !Array.isArray(backupCodes) || !inputCode) {
      return { valid: false, remainingCodes: backupCodes };
    }

    const cleanInputCode = inputCode.replace(/\s/g, '').toUpperCase();
    const codeIndex = backupCodes.indexOf(cleanInputCode);
    
    if (codeIndex === -1) {
      return { valid: false, remainingCodes: backupCodes };
    }

    // Remove used backup code
    const remainingCodes = backupCodes.filter((_, index) => index !== codeIndex);
    
    return { 
      valid: true, 
      remainingCodes,
      usedCode: cleanInputCode
    };
  }

  /**
   * Generate current TOTP token (for testing purposes)
   * @param {string} secret - Base32 secret
   * @returns {string} - Current 6-digit token
   */
  static generateCurrentToken(secret) {
    try {
      return speakeasy.totp({
        secret: secret,
        encoding: 'base32',
        step: 30
      });
    } catch (error) {
      console.error('Token generation error:', error);
      return null;
    }
  }

  /**
   * Get time remaining until next token
   * @returns {number} - Seconds remaining until next token
   */
  static getTimeRemaining() {
    const now = Math.floor(Date.now() / 1000);
    const step = 30;
    return step - (now % step);
  }

  /**
   * Validate secret format
   * @param {string} secret - Secret to validate
   * @returns {boolean} - True if secret is valid base32
   */
  static isValidSecret(secret) {
    if (!secret || typeof secret !== 'string') {
      return false;
    }

    // Check if it's valid base32 (A-Z, 2-7, no padding for speakeasy)
    const base32Regex = /^[A-Z2-7]+$/;
    return base32Regex.test(secret) && secret.length >= 16;
  }

  /**
   * Format secret for display (with spaces for readability)
   * @param {string} secret - Base32 secret
   * @returns {string} - Formatted secret
   */
  static formatSecretForDisplay(secret) {
    if (!secret) return '';
    
    // Add space every 4 characters for readability
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  }

  /**
   * Encrypt secret for database storage
   * @param {string} secret - Plain secret
   * @param {string} key - Encryption key
   * @returns {string} - Encrypted secret
   */
  static encryptSecret(secret, key = process.env.ENCRYPTION_KEY) {
    if (!key) {
      console.warn('No encryption key provided, storing secret in plain text');
      return secret;
    }

    try {
      const cipher = crypto.createCipher('aes192', key);
      let encrypted = cipher.update(secret, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      console.error('Secret encryption error:', error);
      return secret; // Fallback to plain text
    }
  }

  /**
   * Decrypt secret from database
   * @param {string} encryptedSecret - Encrypted secret
   * @param {string} key - Encryption key
   * @returns {string} - Decrypted secret
   */
  static decryptSecret(encryptedSecret, key = process.env.ENCRYPTION_KEY) {
    if (!key) {
      return encryptedSecret; // Assume it's plain text
    }

    try {
      const decipher = crypto.createDecipher('aes192', key);
      let decrypted = decipher.update(encryptedSecret, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (error) {
      console.error('Secret decryption error:', error);
      return encryptedSecret; // Fallback to original
    }
  }

  /**
   * Generate recovery information
   * @param {string} userName - User's display name
   * @returns {Object} - Recovery information
   */
  static generateRecoveryInfo(userName) {
    const backupCodes = this.generateBackupCodes();
    const recoveryCode = crypto.randomBytes(16).toString('hex');
    
    return {
      backupCodes,
      recoveryCode,
      generatedAt: new Date().toISOString(),
      userName
    };
  }

  /**
   * Validate 2FA setup data
   * @param {Object} setupData - Setup data to validate
   * @returns {Object} - Validation result
   */
  static validateSetupData(setupData) {
    const errors = [];

    if (!setupData.secret || !this.isValidSecret(setupData.secret)) {
      errors.push('Invalid secret format');
    }

    if (!setupData.token || !/^\d{6}$/.test(setupData.token)) {
      errors.push('Token must be 6 digits');
    }

    if (!setupData.userName || setupData.userName.trim().length === 0) {
      errors.push('Valid user name is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get user display name for 2FA
   * @param {Object} user - User object with role-specific data
   * @returns {string} - Display name for 2FA
   */
  static getUserDisplayName(user) {
    // For admin users
    if (user.role === 'admin') {
      return user.email || 'Administrator';
    }
    
    // For other users, try to get nama_lengkap
    if (user.nama_lengkap) {
      return user.nama_lengkap;
    }
    
    // Fallback to email or role
    return user.email || user.role || 'User';
  }

  /**
   * Generate secret with user context
   * @param {Object} user - Complete user object
   * @param {string} appName - Application name
   * @returns {Object} - Secret and OTP auth URL with user context
   */
  static generateSecretForUser(user, appName = 'MindaGrow') {
    const userName = this.getUserDisplayName(user);
    
    // Add role context to the issuer for better identification
    const issuerWithRole = `${appName} (${user.role.charAt(0).toUpperCase() + user.role.slice(1)})`;
    
    const secret = speakeasy.generateSecret({
      name: `${issuerWithRole} - ${userName}`,
      issuer: appName,
      length: 32
    });
    
    return {
      secret: secret.base32,
      otpauthUrl: secret.otpauth_url,
      qrcode: secret.qr_code_ascii,
      backupSecret: secret.hex,
      userName: userName,
      userRole: user.role
    };
  }
}

module.exports = TwoFactorService;