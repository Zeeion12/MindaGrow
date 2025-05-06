import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    nis: '',  // Field nis
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [backendStatus, setBackendStatus] = useState({checked: false, available: false});
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // API configuration
  const API_URL = 'http://localhost:3000/api';

  // Check backend availability on component mount
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        await axios.get(`${API_URL}/health`, { 
          timeout: 3000,
        });
        setBackendStatus({checked: true, available: true});
        console.log('Backend available');
      } catch (err) {
        console.log('Backend unavailable:', err.message);
        setBackendStatus({checked: true, available: false});
      }
    };
    
    checkBackendStatus();
  }, []);

  // Check for any success message passed from registration
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
    }
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Fungsi pembantu untuk mengkonversi tipe pengguna
  const mapUserTypeForNavigation = (backendUserType) => {
    // Pemetaan dari nama tabel backend ke format yang digunakan oleh frontend
    const userTypeMapping = {
      'siswa': 'siswa',
      'orangtua': 'orangtua',
      'guru': 'guru',
      'Student': 'siswa',
      'Parent': 'orangtua',
      'Teacher': 'guru'
    };
    
    return userTypeMapping[backendUserType] || backendUserType;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      console.log('Mengirim data login:', {nis: formData.nis, password: '******'});
      
      // Jika backend tidak tersedia, gunakan fallback authentication
      if (!backendStatus.available) {
        console.log('Using fallback authentication (backend unavailable)');
        
        // Ambil data pengguna dari localStorage
        const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
        
        // Cari pengguna berdasarkan NIS
        const user = mockUsers.find(u => u.nis === formData.nis);
        
        if (user && user.password === formData.password) {
          // Buat data pengguna
          const userData = {
            id: Date.now(),
            nis: user.nis,
            nama: user.namaLengkap,
            userType: user.userType || 'siswa',  // Ubah dari Student menjadi siswa
            email: user.surel,
            token: 'mock-token-' + Date.now()
          };
          
          await login(userData, formData.rememberMe);
          navigate(`/dashboard/${mapUserTypeForNavigation(userData.userType)}`);
        } else {
          throw new Error('NIS atau password salah');
        }
        return;
      }
      
      // Jika backend tersedia, gunakan API dengan parameter nis
      const response = await axios.post(`${API_URL}/auth/login`, {
        nis: formData.nis,  // Parameter nis sesuai dengan backend yang diperbarui
        password: formData.password
      });
      
      console.log('Login response:', response.data);
      
      if (response.data.success) {
        const userData = response.data.user;
        
        // Simpan data pengguna melalui AuthContext
        const loginSuccess = await login(userData, formData.rememberMe);
        
        if (loginSuccess) {
          // Gunakan fungsi pemetaan untuk mendapatkan tipe pengguna yang benar
          const userType = mapUserTypeForNavigation(userData.userType);
          
          // Redirect ke dashboard sesuai tipe pengguna
          navigate(`/dashboard/${userType}`);
        } else {
          throw new Error('Gagal menyimpan sesi pengguna');
        }
      } else {
        throw new Error(response.data.message || 'Login gagal');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.code === 'ENOBUFS') {
        setError('Network buffer overflow. Coba lagi setelah beberapa saat.');
      } else if (err.response) {
        // Handle kode status HTTP error
        const status = err.response.status;
        const message = err.response.data?.message || 'Terjadi kesalahan';
        
        if (status === 401) {
          setError('NIS atau password salah');
        } else if (status === 404) {
          setError('Pengguna tidak ditemukan');
        } else {
          setError(`Error ${status}: ${message}`);
        }
      } else if (err.request) {
        // Request dibuat tapi tidak ada respons
        setError('Server tidak merespon. Menggunakan mode offline.');
        
        // Coba fallback login
        try {
          const mockUsers = JSON.parse(localStorage.getItem('mockUsers') || '[]');
          const user = mockUsers.find(u => u.nis === formData.nis);
          
          if (user && user.password === formData.password) {
            const userData = {
              id: Date.now(),
              nis: user.nis,
              nama: user.namaLengkap,
              userType: user.userType || 'siswa',  // Ubah dari Student menjadi siswa
              email: user.surel,
              token: 'mock-token-' + Date.now()
            };
            
            await login(userData, formData.rememberMe);
            navigate(`/dashboard/${mapUserTypeForNavigation(userData.userType)}`);
            return;
          }
        } catch (fallbackErr) {
          console.error('Fallback login failed:', fallbackErr);
        }
      } else {
        // Error dalam setup request
        setError(err.message || 'Login gagal. Silahkan periksa kredensial Anda.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left Side - Login Form */}
      <div className="w-1/2 bg-blue-50 flex items-center justify-center">
        <div className="w-4/5 max-w-xl px-10 py-8">
          <h1 className="text-3xl font-bold text-center mb-10">Login</h1>

          {!backendStatus.available && backendStatus.checked && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6 text-base">
              Server API tidak tersedia. Login akan menggunakan mode offline.
            </div>
          )}

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
              <label htmlFor="nis" className="block text-gray-700 mb-2 text-base">NIS/NIK/NUPTK</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                  <FaUser className="text-lg" />
                </div>
                <input
                  type="text"
                  id="nis"
                  name="nis"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  value={formData.nis}
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
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-500">
                  <FaLock className="text-lg" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
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

            <div className="text-center mt-8">
              <p className="text-gray-600 text-base">
                Belum punya akun?{' '}
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
          src="/images/login-mindagrow.jpg"
          alt="Students looking up"
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://source.unsplash.com/random/1080x1920/?students,education';
          }}
        />
      </div>
    </div>
  );
};

export default Login;