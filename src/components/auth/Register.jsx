import React, { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const { role } = useParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    no_telepon: '',
    password: '',
    confirm_password: '',
    agree: false
  });
  
  // Role specific fields
  const [nis, setNis] = useState('');
  const [nik_orangtua, setNikOrangtua] = useState('');
  const [nuptk, setNuptk] = useState('');
  const [nik, setNik] = useState('');
  
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [nikExists, setNikExists] = useState(null);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const checkNik = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/check-nik`, { nik });
      setNikExists(response.data.exists);

      if (response.data.exists) {
        // Jika NIK ada, hapus error nik jika ada
        setErrors(prev => ({...prev, nik: null}));
      } else {
        setErrors(prev => ({...prev, nik: null}));
      }
    } catch (error) {
      console.error('Error checking NIK:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const validate = () => {
    const newErrors = {};
    
    if (!formData.nama_lengkap) newErrors.nama_lengkap = 'Nama lengkap wajib diisi';
    if (!formData.email) newErrors.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Format email tidak valid';
    
    if (!formData.no_telepon) newErrors.no_telepon = 'Nomor telepon wajib diisi';
    else if (!/^[0-9]+$/.test(formData.no_telepon)) newErrors.no_telepon = 'Nomor telepon hanya boleh berisi angka';
    
    if (!formData.password) newErrors.password = 'Password wajib diisi';
    else if (formData.password.length < 8) newErrors.password = 'Password minimal 8 karakter';
    
    if (!formData.confirm_password) newErrors.confirm_password = 'Konfirmasi password wajib diisi';
    else if (formData.password !== formData.confirm_password) newErrors.confirm_password = 'Password tidak cocok';
    
    if (!formData.agree) newErrors.agree = 'Anda harus menyetujui ketentuan';
    
    // Role specific validations
    if (role === 'siswa') {
      if (!nis) newErrors.nis = 'NIS wajib diisi';
      if (!nik_orangtua) newErrors.nik_orangtua = 'NIK orang tua wajib diisi';
    } else if (role === 'guru') {
      if (!nuptk) newErrors.nuptk = 'NUPTK wajib diisi';
    } else if (role === 'orangtua') {
      if (!nik) newErrors.nik = 'NIK wajib diisi';
      if (nikExists === false) newErrors.nik = '';
    }
    
    return newErrors;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    try {
      setIsLoading(true);
      
      const userData = {
        ...formData,
        role,
        ...(role === 'siswa' ? { nis, nik_orangtua } : {}),
        ...(role === 'guru' ? { nuptk } : {}),
        ...(role === 'orangtua' ? { nik } : {})
      };
      
      await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, userData);
      
      alert('Registrasi berhasil! Silahkan login.');
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      alert(error.response?.data?.message || 'Terjadi kesalahan saat registrasi');
    } finally {
      setIsLoading(false);
    }
  };
  
  const getRoleTitle = () => {
    if (role === 'siswa') return 'Siswa';
    if (role === 'guru') return 'Guru';
    if (role === 'orangtua') return 'Orang Tua';
    return '';
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Daftar sebagai {getRoleTitle()}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          <Link to="/role-selection" className="font-medium text-indigo-600 hover:text-indigo-500">
            &larr; Kembali ke pilihan peran
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="nama_lengkap" className="block text-sm font-medium text-gray-700">
                Nama Lengkap
              </label>
              <div className="mt-1">
                <input
                  id="nama_lengkap"
                  name="nama_lengkap"
                  type="text"
                  value={formData.nama_lengkap}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.nama_lengkap && (
                  <p className="mt-2 text-sm text-red-600">{errors.nama_lengkap}</p>
                )}
              </div>
            </div>

            {role === 'siswa' && (
              <>
                <div>
                  <label htmlFor="nis" className="block text-sm font-medium text-gray-700">
                    NIS
                  </label>
                  <div className="mt-1">
                    <input
                      id="nis"
                      name="nis"
                      type="text"
                      value={nis}
                      onChange={(e) => setNis(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.nis && (
                      <p className="mt-2 text-sm text-red-600">{errors.nis}</p>
                    )}
                  </div>
                </div>
                <div>
                  <label htmlFor="nik_orangtua" className="block text-sm font-medium text-gray-700">
                    NIK Orang Tua
                  </label>
                  <div className="mt-1">
                    <input
                      id="nik_orangtua"
                      name="nik_orangtua"
                      type="text"
                      value={nik_orangtua}
                      onChange={(e) => setNikOrangtua(e.target.value)}
                      className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    {errors.nik_orangtua && (
                      <p className="mt-2 text-sm text-red-600">{errors.nik_orangtua}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {role === 'guru' && (
              <div>
                <label htmlFor="nuptk" className="block text-sm font-medium text-gray-700">
                  NUPTK
                </label>
                <div className="mt-1">
                  <input
                    id="nuptk"
                    name="nuptk"
                    type="text"
                    value={nuptk}
                    onChange={(e) => setNuptk(e.target.value)}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  {errors.nuptk && (
                    <p className="mt-2 text-sm text-red-600">{errors.nuptk}</p>
                  )}
                </div>
              </div>
            )}

            {role === 'orangtua' && (
              <div>
                <label htmlFor="nik" className="block text-sm font-medium text-gray-700">
                  NIK
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <input
                    id="nik"
                    name="nik"
                    type="text"
                    value={nik}
                    onChange={(e) => setNik(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-l-md border border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                  <button
                    type="button"
                    onClick={checkNik}
                    disabled={isLoading || !nik}
                    className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                    {isLoading ? 'Memeriksa...' : 'Periksa'}
                  </button>
                </div>
                {nikExists === true && (
                  <p className="mt-2 text-sm text-green-600">NIK telah terdaftar oleh siswa</p>
                )}
                {nikExists === false && (
                  <p className="mt-2 text-sm text-red-600">NIK belum didaftar oleh siswa</p>
                )}
                {errors.nik && (
                  <p className="mt-2 text-sm text-red-600">{errors.nik}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-2 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="no_telepon" className="block text-sm font-medium text-gray-700">
                Nomor Telepon
              </label>
              <div className="mt-1">
                <input
                  id="no_telepon"
                  name="no_telepon"
                  type="text"
                  value={formData.no_telepon}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.no_telepon && (
                  <p className="mt-2 text-sm text-red-600">{errors.no_telepon}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-2 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700">
                Konfirmasi Password
              </label>
              <div className="mt-1">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.confirm_password && (
                  <p className="mt-2 text-sm text-red-600">{errors.confirm_password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="agree"
                name="agree"
                type="checkbox"
                checked={formData.agree}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="agree" className="ml-2 block text-sm text-gray-900">
                Saya setuju dengan semua ketentuan dan kebijakan privasi
              </label>
            </div>
            {errors.agree && (
              <p className="text-sm text-red-600">{errors.agree}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {isLoading ? 'Mendaftar...' : 'Daftar'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Atau
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sudah memiliki akun? Masuk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;