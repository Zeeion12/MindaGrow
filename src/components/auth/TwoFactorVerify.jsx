// components/auth/TwoFactorVerify.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, ArrowLeft, Key, Smartphone, HelpCircle, RefreshCw } from 'lucide-react';

const TwoFactorVerify = ({ 
  userId, 
  userRole,
  userEmail,
  onSuccess, 
  onBack,
  rememberDevice = false 
}) => {
  const [token, setToken] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showBackupCode, setShowBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState('');
  const [remember, setRemember] = useState(rememberDevice);
  const [attempts, setAttempts] = useState(0);
  const maxAttempts = 3;

  // Refs for input focus management
  const inputRefs = useRef([]);

  // Timer for TOTP refresh
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          return 30; // Reset to 30 seconds
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle token input changes
  const handleTokenChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newToken = [...token];
    newToken[index] = value;
    setToken(newToken);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newToken.every(digit => digit !== '') && newToken.join('').length === 6) {
      setTimeout(() => verifyToken(newToken.join('')), 100);
    }
  };

  // Handle backspace and arrow keys
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !token[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    
    if (pastedData.length === 6) {
      const newToken = pastedData.split('');
      setToken(newToken);
      verifyToken(pastedData);
    }
  };

  // Verify 2FA token
  const verifyToken = async (tokenValue = token.join('')) => {
    if (tokenValue.length !== 6) {
      setError('Please enter a complete 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          token: tokenValue,
          remember: remember
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess && onSuccess(data);
      } else {
        setAttempts(prev => prev + 1);
        setError(data.message || 'Invalid token. Please try again.');
        clearToken();
        
        // Focus first input after error
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('2FA verification error:', error);
      setError('Failed to verify token. Please check your connection.');
      clearToken();
    } finally {
      setLoading(false);
    }
  };

  // Verify backup code
  const verifyBackupCode = async () => {
    if (!backupCode.trim()) {
      setError('Please enter a backup code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-backup-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          backupCode: backupCode.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        onSuccess && onSuccess(data);
      } else {
        setError(data.message || 'Invalid backup code');
        setBackupCode('');
      }
    } catch (error) {
      console.error('Backup code verification error:', error);
      setError('Failed to verify backup code');
    } finally {
      setLoading(false);
    }
  };

  // Clear token inputs
  const clearToken = () => {
    setToken(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  // Progress bar for time remaining
  const progressPercentage = (timeRemaining / 30) * 100;

  if (showBackupCode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="w-8 h-8 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Use Backup Code
            </h1>
            <p className="text-gray-600">
              Enter one of your backup codes to access your account
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            </div>
          )}

          {/* Backup Code Input */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Backup Code
              </label>
              <input
                type="text"
                value={backupCode}
                onChange={(e) => {
                  setBackupCode(e.target.value.toUpperCase());
                  setError('');
                }}
                placeholder="Enter backup code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                maxLength={8}
              />
              <div className="mt-2 text-xs text-gray-500 text-center">
                Backup codes are 8 characters long
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={verifyBackupCode}
                disabled={loading || !backupCode.trim()}
                className="w-full bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify Backup Code'
                )}
              </button>

              <button
                onClick={() => setShowBackupCode(false)}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Back to Authenticator
              </button>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <p>Each backup code can only be used once. Make sure to generate new backup codes after using this one.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Two-Factor Authentication
          </h1>
          <p className="text-gray-600">
            Enter the 6-digit code from your authenticator app
          </p>
          {userEmail && (
            <p className="text-sm text-gray-500 mt-2">
              {userEmail}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          </div>
        )}

        {/* Attempts Warning */}
        {attempts > 0 && attempts < maxAttempts && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="text-yellow-800 text-sm">
                {maxAttempts - attempts} attempt{maxAttempts - attempts !== 1 ? 's' : ''} remaining
              </span>
            </div>
          </div>
        )}

        {/* Token Input Grid */}
        <div className="space-y-6">
          <div>
            <div className="flex justify-center space-x-3 mb-4">
              {token.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  value={digit}
                  onChange={(e) => handleTokenChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  maxLength={1}
                  disabled={loading}
                />
              ))}
            </div>

            {/* Time Remaining Indicator */}
            <div className="text-center mb-4">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                <Smartphone className="w-4 h-4" />
                <span>Code refreshes in {timeRemaining}s</span>
                <RefreshCw className={`w-4 h-4 ${timeRemaining <= 5 ? 'animate-spin' : ''}`} />
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                <div 
                  className={`h-1 rounded-full transition-all duration-1000 ${
                    timeRemaining <= 10 ? 'bg-red-500' : 
                    timeRemaining <= 20 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Remember Device Option */}
          <div className="flex items-center">
            <input
              id="remember-device"
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-device" className="ml-2 block text-sm text-gray-700">
              Ingatkan perangkat ini untuk 7 hari
            </label>
          </div>

          {/* Manual Verify Button */}
          <button
            onClick={() => verifyToken()}
            disabled={loading || token.join('').length !== 6}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Verifying...
              </div>
            ) : (
              'Verifikasi kode'
            )}
          </button>

          {/* Alternative Options */}
          <div className="space-y-3">
            <button
              onClick={() => setShowBackupCode(true)}
              disabled={loading}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm"
            >
              Gunakan kode cadangan sebagai gantinya
            </button>

            <button
              onClick={clearToken}
              disabled={loading}
              className="w-full text-gray-500 py-2 px-4 text-sm hover:text-gray-700 transition-colors"
            >
              Bersihkan dan coba lagi
            </button>
          </div>
        </div>
        {/* Back Button */}
        {onBack && (
          <div className="mt-6">
            <button
              onClick={onBack}
              disabled={loading}
              className="flex items-center justify-center w-full text-gray-500 py-2 px-4 text-sm hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke login
            </button>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <Shield className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Pemberitahuan keamanan:</p>
              <p>Jangan pernah membagikan kode autentikasi Anda kepada siapa pun. MindaGrow tidak akan pernah meminta kode 2FA Anda.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerify;