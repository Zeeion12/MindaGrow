import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaGoogle, FaEye, FaEyeSlash, FaUser, FaLock } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    // Redirect ke dashboard jika sudah login
    if (currentUser) {
      // Redirect based on user role
      if (currentUser.role === 'siswa') {
        navigate('/dashboard/student');
      } else if (currentUser.role === 'guru') {
        navigate('/dashboard/teacher');
      } else if (currentUser.role === 'orangtua') {
        navigate('/dashboard/parent');
      } else {
        navigate('/dashboard');
      }
      return;
    }
    
    // Tampilkan pesan dari state location (misalnya dari halaman register)
    if (location.state && location.state.message) {
      setMessage(location.state.message);
      // Bersihkan state agar pesan tidak muncul lagi setelah refresh
      window.history.replaceState({}, document.title);
    }
  }, [location, currentUser, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      console.log('Mencoba login dengan username:', formData.username);
      
      // Gunakan fungsi login dari AuthContext
      const result = await login(formData.username, formData.password);
      
      if (result.success) {
        // Redirect berdasarkan role akan ditangani oleh useEffect di atas
        console.log('Login berhasil');
      } else {
        setError(result.message || 'Username atau password salah');
      }
    } catch (err) {
      console.error("Error saat login:", err);
      setError('Terjadi kesalahan saat login. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Implementasi login dengan Google
    console.log("Login dengan Google");
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-1/2 bg-blue-50 flex items-center justify-center">
        <div className="w-4/5 max-w-xl px-10 py-8">
          <h1 className="text-3xl font-bold text-center mb-10">Login</h1>
          
          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6 text-base">
              {message}
            </div>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6 text-base">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-gray-700 mb-2 text-base">NIS/NIK/NUPTK</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500">
                  <FaUser className="text-lg" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Masukkan NIS/NIK/NUPTK"
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-gray-700 text-base">Password</label>
                <Link to="/forgot-password" className="text-blue-600 hover:underline text-base">
                  Lupa password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-500">
                  <FaLock className="text-lg" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  placeholder="••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash className="text-lg" /> : <FaEye className="text-lg" />}
                </button>
              </div>
            </div>
            
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="h-5 w-5 text-blue-600 rounded"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span className="ml-2 text-gray-700 text-base">Ingatkan saya</span>
              </label>
            </div>
            
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 px-5 rounded-full hover:bg-blue-600 transition duration-200 font-semibold text-lg"
              disabled={loading}
            >
              {loading ? 'Sedang memproses...' : 'Masuk'}
            </button>
          
            <div className="flex items-center justify-center my-6">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="mx-4 text-gray-500 text-base">Atau</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex justify-center items-center bg-white text-gray-700 border border-gray-300 rounded-full py-3 px-6 hover:bg-gray-50 transition duration-200 text-base mt-4"
            >
              <FaGoogle className="text-blue-500 mr-3 text-xl" />
            </button>
          
            <div className="text-center mt-8">
              <p className="text-gray-600 text-base">
                Belum punya akun? {' '}
                <Link to="/role-selection" className="text-blue-500 font-medium hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
      
      {/* Right Side - Image */}
      <div className="w-1/2 bg-red-500 overflow-hidden">
        <img
          src="/images/login mindagrow.jpg"
          alt="Students looking up"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://source.unsplash.com/random/1080x1920/?students,education";
          }}
        />
      </div>
    </div>
  );
};

export default Login;