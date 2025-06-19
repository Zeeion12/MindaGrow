import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import TwoFactorSetup from './TwoFactorSetup';

const SecuritySettings = () => {
  const [user2FAStatus, setUser2FAStatus] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch2FAStatus();
  }, []);

  const fetch2FAStatus = async () => {
    try {
      const response = await fetch('/api/auth/2fa-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setUser2FAStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    const password = prompt('Enter your password to disable 2FA:');
    const token = prompt('Enter current 2FA code:');
    
    if (!password || !token) return;

    try {
      const response = await fetch('/api/auth/disable-2fa', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password, token })
      });

      const data = await response.json();
      if (data.success) {
        fetch2FAStatus(); // Refresh status
        alert('2FA has been disabled');
      } else {
        alert(data.message);
      }
    } catch (error) {
      alert('Failed to disable 2FA');
    }
  };

  if (loading) {
    return <div>Loading security settings...</div>;
  }

  if (showSetup) {
    return (
      <TwoFactorSetup
        tempToken="setup-existing-user" // Handle this in backend
        userRole="user"
        canSkip={false}
        onComplete={() => {
          setShowSetup(false);
          fetch2FAStatus();
        }}
        onCancel={() => setShowSetup(false)}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Security Settings</h2>
      
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold">Two-Factor Authentication</h3>
              <p className="text-gray-600 text-sm">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          
          <div className="flex items-center">
            {user2FAStatus?.is2FAEnabled ? (
              <div className="flex items-center text-green-600 mr-4">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Enabled</span>
              </div>
            ) : (
              <div className="flex items-center text-red-600 mr-4">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">Disabled</span>
              </div>
            )}
            
            {user2FAStatus?.is2FAEnabled ? (
              <button
                onClick={disable2FA}
                className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-700"
              >
                Disable
              </button>
            ) : (
              <button
                onClick={() => setShowSetup(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
              >
                Enable
              </button>
            )}
          </div>
        </div>
        
        {user2FAStatus?.lastVerify && (
          <div className="mt-4 text-sm text-gray-500">
            Last verified: {new Date(user2FAStatus.lastVerify).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  );
};

export default SecuritySettings;