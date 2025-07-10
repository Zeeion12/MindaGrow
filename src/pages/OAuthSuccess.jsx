import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');
    const role = searchParams.get('role');
    const isSetup = searchParams.get('setup') === 'true';
    const isReturning = searchParams.get('returning') === 'true';

    if (token && role) {
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      localStorage.setItem('userRole', role);

      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            if (role === 'admin') {
              navigate('/dashboard/admin');
            } else {
              navigate('/dashboard');
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else {
      navigate('/login?error=oauth_token_missing');
    }
  }, [searchParams, navigate]);

  const isSetup = searchParams.get('setup') === 'true';
  const isReturning = searchParams.get('returning') === 'true';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {isSetup ? 'Pendaftaran Berhasil!' : isReturning ? 'Selamat Datang Kembali!' : 'Login Berhasil!'}
        </h1>

        <p className="text-gray-600 mb-6">
          {isSetup 
            ? 'Selamat! Akun Anda telah berhasil didaftarkan dengan Google dan data Anda telah tersimpan.'
            : isReturning
            ? 'Anda telah berhasil masuk kembali dengan akun Google.'
            : 'Anda telah berhasil masuk dengan akun Google.'
          }
        </p>

        <div className="flex items-center justify-center gap-2 text-blue-600">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Mengalihkan dalam {countdown} detik...</span>
        </div>
      </div>
    </div>
  );
};

export default OAuthSuccess;