import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Periksa apakah ada pesan dari halaman lain (misalnya setelah register)
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    // Ambil pesan dari state location jika ada
    if (location.state && location.state.message) {
      setMessage(location.state.message);
      // Bersihkan state location
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log("Login dimulai dengan email:", formData.email);

    try {
      // Panggil fungsi login dari AuthContext
      const result = await login(formData.email, formData.password);
      
      console.log("Hasil login:", result);
      
      if (!result.success) {
        setError(result.message || 'Login gagal. Silakan periksa email dan password Anda.');
      }
      // Tidak perlu redirect manual karena AuthContext sudah menanganinya
      
    } catch (err) {
      console.error("Error saat login:", err);
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-gray-600 mt-1">Masuk ke akun Anda</p>
        </div>
        
        {message && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 mb-2">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="flex justify-end mb-6">
            <Link to="/forgot-password" className="text-blue-500 hover:underline">
              Lupa password?
            </Link>
          </div>
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Sedang memproses...' : 'Login'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Belum memiliki akun?{' '}
            <Link to="/role-selection" className="text-blue-500 hover:underline">
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;