import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const RegisterGuru = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nuptk: '',
    noTelepon: '',
    surel: '',
    gender: '',
    password: '',
    konfirmasiPassword: '',
    persetujuan: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [konfirmasiPasswordVisible, setKonfirmasiPasswordVisible] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleKonfirmasiPasswordVisibility = () => {
    setKonfirmasiPasswordVisible(!konfirmasiPasswordVisible);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.konfirmasiPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }
    
    if (!formData.persetujuan) {
      setError('Anda harus menyetujui syarat dan ketentuan');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // Panggil API register
      console.log('Mengirim data registrasi siswa ke server');
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'siswa',
          namaLengkap: formData.namaLengkap,
          nis: formData.nis,
          noTelepon: formData.noTelepon,
          surel: formData.surel,
          gender: formData.gender,
          password: formData.password
        }),
      });

      // Handle response
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Terjadi kesalahan saat registrasi');
      }

      const data = await response.json();
      
      if (data.success) {
        // Redirect ke halaman login
        navigate('/login', { 
          state: { message: 'Registrasi berhasil! Silakan login dengan akun Anda.' } 
        });
      } else {
        setError(data.message || 'Registrasi gagal. Silakan coba lagi.');
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat melakukan registrasi.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-10">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">REGISTER - Guru</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="namaLengkap" className="block text-gray-700 font-medium mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              id="namaLengkap"
              name="namaLengkap"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.namaLengkap}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="nuptk" className="block text-gray-700 font-medium mb-2">
              NUPTK
            </label>
            <input
              type="text"
              id="nuptk"
              name="nuptk"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.nuptk}
              onChange={handleChange}
              required
              pattern="[0-9]{16}"
              title="NUPTK harus terdiri dari 16 digit angka"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="noTelepon" className="block text-gray-700 font-medium mb-2">
              No Telepon
            </label>
            <input
              type="tel"
              id="noTelepon"
              name="noTelepon"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.noTelepon}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="surel" className="block text-gray-700 font-medium mb-2">
              Surel
            </label>
            <input
              type="email"
              id="surel"
              name="surel"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.surel}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Gender</label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="laki-laki"
                  className="form-radio h-4 w-4 text-blue-600"
                  checked={formData.gender === 'laki-laki'}
                  onChange={handleChange}
                  required
                />
                <span className="ml-2">Laki-laki</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="perempuan"
                  className="form-radio h-4 w-4 text-blue-600"
                  checked={formData.gender === 'perempuan'}
                  onChange={handleChange}
                />
                <span className="ml-2">Perempuan</span>
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={passwordVisible ? "text" : "password"}
                id="password"
                name="password"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.password}
                onChange={handleChange}
                minLength="8"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={togglePasswordVisibility}
              >
                {passwordVisible ? (
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

          <div className="mb-4">
            <label htmlFor="konfirmasiPassword" className="block text-gray-700 font-medium mb-2">
              Konfirmasi Password
            </label>
            <div className="relative">
              <input
                type={konfirmasiPasswordVisible ? "text" : "password"}
                id="konfirmasiPassword"
                name="konfirmasiPassword"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.konfirmasiPassword}
                onChange={handleChange}
                minLength="8"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                onClick={toggleKonfirmasiPasswordVisibility}
              >
                {konfirmasiPasswordVisible ? (
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

          <div className="mb-6">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                name="persetujuan"
                className="form-checkbox h-4 w-4 text-blue-600"
                checked={formData.persetujuan}
                onChange={handleChange}
                required
              />
              <span className="ml-2 text-sm text-gray-600">
                Periksa kembali data-data anda dan pastikan sesuai
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200 font-medium"
            disabled={loading}
          >
            {loading ? 'Sedang memproses...' : 'Daftar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Sudah memiliki akun?{' '}
            <Link to="/login" className="text-blue-600 font-medium hover:text-blue-800">
              Login Disini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterGuru;