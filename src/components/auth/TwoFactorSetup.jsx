// components/auth/TwoFactorSetup.jsx
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Download, Copy, Shield, Smartphone, AlertTriangle, CheckCircle, X } from 'lucide-react';

const TwoFactorSetup = ({ 
  tempToken, 
  userRole, 
  canSkip = false, 
  onComplete, 
  onSkip,
  onCancel 
}) => {
  const [step, setStep] = useState(1); // 1: Generate QR, 2: Verify Token
  const [qrCode, setQRCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [verificationToken, setVerificationToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodesSaved, setBackupCodesSaved] = useState(false);

  // Timer for TOTP refresh
  useEffect(() => {
    if (step === 2) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            return 30; // Reset to 30 seconds
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step]);

  // Generate QR Code and setup 2FA
  const generateQRCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setQRCode(data.qrCode);
        setSecret(data.secret);
        setBackupCodes(data.backupCodes);
        setTimeRemaining(data.timeRemaining || 30);
        setStep(2);
      } else {
        setError(data.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Setup 2FA error:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Verify setup token
  const verifySetup = async () => {
    if (!verificationToken || verificationToken.length !== 6) {
      setError('Please enter a valid 6-digit token');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        },
        body: JSON.stringify({
          token: verificationToken
        })
      });

      const data = await response.json();

      if (data.success) {
        // Setup completed successfully
        onComplete && onComplete(data);
      } else {
        setError(data.message || 'Invalid token');
      }
    } catch (error) {
      console.error('Verify setup error:', error);
      setError('Failed to verify token');
    } finally {
      setLoading(false);
    }
  };

  // Skip 2FA setup
  const skipSetup = async () => {
    if (!canSkip) {
      setError('2FA setup is required for your role');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/skip-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}`
        }
      });

      const data = await response.json();

      if (data.success) {
        onSkip && onSkip(data);
      } else {
        setError(data.message || 'Failed to skip 2FA setup');
      }
    } catch (error) {
      console.error('Skip 2FA error:', error);
      setError('Failed to skip setup');
    } finally {
      setLoading(false);
    }
  };

  // Copy to clipboard
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      // Could add a toast notification here
      console.log('Copied to clipboard');
    });
  };

  // Download backup codes
  const downloadBackupCodes = () => {
    const content = `MindaGrow Platform - Backup Codes\n\nGenerated: ${new Date().toLocaleString()}\n\nBackup Codes:\n${backupCodes.join('\n')}\n\nKeep these codes safe! Each code can only be used once.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mindagrow-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setBackupCodesSaved(true);
  };

  // Format token input
  const handleTokenChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setVerificationToken(value);
    setError('');
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Setup Two-Factor Authentication
            </h1>
            <p className="text-gray-600">
              {userRole === 'admin' 
                ? 'Two-factor authentication is required for admin accounts' 
                : 'Add an extra layer of security to your account'
              }
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

          {/* Setup Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What you'll need:</h3>
            <div className="space-y-2 text-sm text-blue-800">
              <div className="flex items-center">
                <Smartphone className="w-4 h-4 mr-2" />
                <span>Google Authenticator or similar app</span>
              </div>
              <div className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                <span>Safe place to store backup codes</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={generateQRCode}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Setting up...
                </div>
              ) : (
                'Start Setup'
              )}
            </button>

            {canSkip && (
              <button
                onClick={skipSetup}
                disabled={loading}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                Skip for now
              </button>
            )}

            {onCancel && (
              <button
                onClick={onCancel}
                disabled={loading}
                className="w-full text-gray-500 py-2 px-4 text-sm hover:text-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Smartphone className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Scan QR Code
          </h1>
          <p className="text-gray-600">
            Use your authenticator app to scan the QR code below
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

        <div className="grid md:grid-cols-2 gap-8">
          {/* QR Code Section */}
          <div className="text-center">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-4">
              {qrCode ? (
                <img 
                  src={qrCode} 
                  alt="2FA QR Code" 
                  className="w-48 h-48 mx-auto"
                />
              ) : (
                <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Manual Entry Option */}
            <div className="mt-4">
              <button
                onClick={() => setShowSecret(!showSecret)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center mx-auto"
              >
                {showSecret ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showSecret ? 'Hide' : 'Show'} manual entry key
              </button>
              
              {showSecret && (
                <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                  <div className="text-xs text-gray-600 mb-1">Manual entry key:</div>
                  <div className="flex items-center justify-between">
                    <code className="text-sm font-mono break-all">{secret}</code>
                    <button
                      onClick={() => copyToClipboard(secret)}
                      className="ml-2 p-1 text-gray-500 hover:text-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Verification Section */}
          <div className="space-y-6">
            {/* Token Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter 6-digit code from your app
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={verificationToken}
                  onChange={handleTokenChange}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={6}
                />
                <div className="absolute right-3 top-3 text-sm text-gray-500">
                  {timeRemaining}s
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                Code refreshes every 30 seconds
              </div>
            </div>

            {/* Backup Codes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-yellow-800">Backup Codes</h3>
                <button
                  onClick={() => setShowBackupCodes(!showBackupCodes)}
                  className="text-yellow-600 hover:text-yellow-800"
                >
                  {showBackupCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              
              <p className="text-xs text-yellow-700 mb-3">
                Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
              </p>

              {showBackupCodes && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-white p-2 rounded border">
                        {code}
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={downloadBackupCodes}
                    className="w-full bg-yellow-100 text-yellow-800 py-2 px-3 rounded text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Backup Codes
                  </button>
                  
                  {backupCodesSaved && (
                    <div className="flex items-center text-green-600 text-sm">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Backup codes downloaded
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={verifySetup}
                disabled={loading || verificationToken.length !== 6}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Verifying...
                  </div>
                ) : (
                  'Verify and Complete Setup'
                )}
              </button>

              <button
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-full text-gray-500 py-2 px-4 text-sm hover:text-gray-700 transition-colors"
              >
                Back to setup
              </button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Instructions:</h3>
          <ol className="text-sm text-gray-600 space-y-1">
            <li>1. Open Google Authenticator or similar app on your phone</li>
            <li>2. Tap "+" to add a new account</li>
            <li>3. Scan the QR code or enter the manual key</li>
            <li>4. Enter the 6-digit code from your app</li>
            <li>5. Download and save your backup codes</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;