// components/auth/Login.jsx - Quick Fix
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext';
import TwoFactorSetup from './TwoFactorSetup';
import TwoFactorVerify from './TwoFactorVerify';
import LoginImage from '../../assets/login mindagrow.jpg';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Form states
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 2FA states
  const [loginStep, setLoginStep] = useState('login'); // 'login', 'setup', 'verify'
  const [authData, setAuthData] = useState({
    tempToken: null,
    userId: null,
    userRole: null,
    userEmail: null,
    canSkip: false
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      setError('Email dan password wajib diisi');
      return;
    }

    try {
      setIsLoading(true);
      setError('');

      console.log('🔄 Frontend: Attempting login with:', identifier);

      // FIXED: Use the existing endpoint that's already working
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          identifier,
          password,
          remember
        })
      });

      // Check if response is HTML (404 page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned non-JSON response. Check if backend is running on port 5000.');
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Login gagal');
        return;
      }

      console.log('✅ Frontend: Login response:', data);

      // Handle different response types based on your current backend
      if (data.success === false) {
        setError(data.message || 'Login gagal');
        return;
      }

      // Check for 2FA responses (new system)
      if (data.requires2FA) {
        // User needs 2FA verification
        setAuthData({
          userId: data.userId,
          userRole: data.userRole,
          userEmail: identifier.includes('@') ? identifier : null,
          canSkip: false
        });
        setLoginStep('verify');
        return;
      } 
      
      if (data.requiresSetup) {
        // User needs 2FA setup
        setAuthData({
          tempToken: data.tempToken,
          userRole: data.userRole,
          canSkip: data.canSkip,
          userEmail: identifier.includes('@') ? identifier : null
        });
        setLoginStep('setup');
        return;
      } 
      
      // Direct login success (current working system)
      if (data.token && data.user) {
        await handleLoginSuccess(data);
      } else {
        // Handle old system response format
        await handleLoginSuccess(data);
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      
      // Better error handling for network issues
      if (error.message.includes('fetch')) {
        setError('Tidak dapat terhubung ke server. Pastikan server berjalan di port 5000.');
      } else if (error.message.includes('Unexpected token')) {
        setError('Server mengembalikan response yang tidak valid. Periksa console untuk detail.');
      } else {
        setError(error.message || 'Terjadi kesalahan saat login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle successful login (after 2FA verification or direct login)
  const handleLoginSuccess = async (data) => {
    try {
      // Use authContext login to save token and user data
      let result;
      
      if (data.token && data.user) {
        // New format: {token, user}
        result = await login(data.token, data.user);
      } else {
        // Legacy format or direct user object
        result = await login(identifier, password, remember);
      }

      console.log('✅ Frontend: Login successful, user role:', result.user.role);

      // Navigate based on role
      if (result.user.role === 'admin') {
        console.log('🔑 Admin detected! Redirecting to admin dashboard...');
        navigate('/dashboard/admin');
      } else if (result.user.role === 'siswa') {
        console.log('👨‍🎓 Student detected! Redirecting to student dashboard...');
        navigate('/dashboard/siswa');
      } else if (result.user.role === 'guru') {
        console.log('👨‍🏫 Teacher detected! Redirecting to teacher dashboard...');
        navigate('/dashboard/guru');
      } else if (result.user.role === 'orangtua') {
        console.log('👨‍👩‍👧‍👦 Parent detected! Redirecting to parent dashboard...');
        navigate('/dashboard/orangtua');
      } else {
        console.warn('⚠️  Unknown role:', result.user.role);
        setError('Role tidak dikenali: ' + result.user.role);
      }
    } catch (error) {
      console.error('❌ Login success handler error:', error);
      setError('Terjadi kesalahan setelah login');
    }
  };

  // Handle 2FA setup completion
  const handle2FASetupComplete = (data) => {
    console.log('✅ 2FA Setup completed:', data);
    handleLoginSuccess(data);
  };

  // Handle 2FA setup skip
  const handle2FASetupSkip = (data) => {
    console.log('⏭️ 2FA Setup skipped:', data);
    handleLoginSuccess(data);
  };

  // Handle 2FA verification success
  const handle2FAVerifySuccess = (data) => {
    console.log('✅ 2FA Verification successful:', data);
    handleLoginSuccess(data);
  };

  // Reset to login form
  const handleBackToLogin = () => {
    setLoginStep('login');
    setAuthData({
      tempToken: null,
      userId: null,
      userRole: null,
      userEmail: null,
      canSkip: false
    });
    setError('');
  };

  // Render 2FA Setup component
  if (loginStep === 'setup') {
    return (
      <TwoFactorSetup
        tempToken={authData.tempToken}
        userRole={authData.userRole}
        canSkip={authData.canSkip}
        onComplete={handle2FASetupComplete}
        onSkip={handle2FASetupSkip}
        onCancel={handleBackToLogin}
      />
    );
  }

  // Render 2FA Verify component
  if (loginStep === 'verify') {
    return (
      <TwoFactorVerify
        userId={authData.userId}
        userRole={authData.userRole}
        userEmail={authData.userEmail}
        onSuccess={handle2FAVerifySuccess}
        onBack={handleBackToLogin}
        rememberDevice={remember}
      />
    );
  }

  // Render login form
  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Section - Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md">
          <h2 className="text-3xl font-normal text-center text-gray-800 mb-8">
            Login
          </h2>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
                {identifier.includes('@') ? 'Email Admin' : 'NIS/NIK/NUPTK'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {identifier.includes('@') ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={identifier.includes('@') ? 'Email admin' : 'NIS/NIK/NUPTK'}
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              {identifier.includes('@') && (
                <p className="mt-1 text-xs text-gray-500">
                  Mode Admin
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="text-sm">
                  <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-500">
                    Lupa password?
                  </Link>
                </div>
              </div>
              <div className="mt-1 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg bg-white shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember" className="ml-2 block text-sm text-gray-700">
                Ingatkan saya
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${identifier.includes('admin@')
                    ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                  } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Masuk...
                  </div>
                ) : (
                  <>
                    {identifier.includes('admin@') ? 'Masuk sebagai Admin' : 'Masuk'}
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Atau
                </span>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-gray-300 rounded-full shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" className="h-5 w-5 mr-2" />
                Masuk dengan Google
              </button>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Belum punya akun?{' '}
                <Link to="/role-selection" className="font-medium text-indigo-600 hover:text-indigo-500">
                  Register
                </Link>
              </p>
            </div>

            {/* 2FA Info */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Keamanan Tingkat Tinggi</p>
                  <p>Akun dilindungi dengan Two-Factor Authentication (2FA) untuk keamanan maksimal.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Section - Image */}
      <div className="hidden md:block md:w-1/2 bg-red-500">
        <img
          src={LoginImage}
          alt="login image"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
};

export default Login;