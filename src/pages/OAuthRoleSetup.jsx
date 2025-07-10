import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, User, GraduationCap, Users, Search, Check, X } from 'lucide-react';

const OAuthRoleSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState('role'); // 'role', 'confirm', 'details'
  const [selectedRole, setSelectedRole] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    namaLengkap: '',
    nomorInduk: '',
    nikOrangtua: '' // Untuk siswa
  });

  // NIK validation state
  const [nikValidation, setNikValidation] = useState({
    checking: false,
    valid: null,
    message: '',
    siswaList: []
  });

  useEffect(() => {
    const token = searchParams.get('tempToken');
    const userEmail = searchParams.get('email');
    const isReturning = searchParams.get('returning') === 'true';
    
    if (!token) {
      navigate('/login?error=invalid_oauth_token');
      return;
    }

    setTempToken(token);
    setEmail(userEmail || '');
    
    // Jika user returning, tetap ke role selection
    if (isReturning) {
      setStep('role');
    }
  }, [searchParams, navigate]);

  const roles = [
    {
      id: 'siswa',
      title: 'Siswa',
      description: 'Saya adalah siswa yang ingin belajar di platform ini',
      icon: <GraduationCap className="w-8 h-8" />,
      color: 'blue',
      fieldLabel: 'NIS (Nomor Induk Siswa)',
      fieldPlaceholder: 'Masukkan NIS Anda'
    },
    {
      id: 'guru',
      title: 'Guru',
      description: 'Saya adalah guru yang ingin mengajar dan mengelola kelas',
      icon: <User className="w-8 h-8" />,
      color: 'green',
      fieldLabel: 'NUPTK (Nomor Unik Pendidik dan Tenaga Kependidikan)',
      fieldPlaceholder: 'Masukkan NUPTK Anda'
    },
    {
      id: 'orangtua',
      title: 'Orang Tua',
      description: 'Saya adalah orang tua yang ingin memantau perkembangan anak',
      icon: <Users className="w-8 h-8" />,
      color: 'purple',
      fieldLabel: 'NIK (Nomor Induk Kependudukan)',
      fieldPlaceholder: 'Masukkan NIK Anda'
    }
  ];

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setStep('confirm');
  };

  const handleConfirmRole = () => {
    setStep('details');
  };

  const handleBackToRole = () => {
    setStep('role');
    setSelectedRole('');
    setFormData({
      namaLengkap: '',
      nomorInduk: '',
      nikOrangtua: ''
    });
    setNikValidation({
      checking: false,
      valid: null,
      message: '',
      siswaList: []
    });
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Reset NIK validation when NIK value changes
    if (name === 'nikOrangtua' || name === 'nomorInduk') {
      setNikValidation({
        checking: false,
        valid: null,
        message: '',
        siswaList: []
      });
    }
  };

  // Check NIK untuk siswa (NIK orang tua)
  const checkNikOrangtua = async () => {
    if (!formData.nikOrangtua) {
      setError('NIK Orang Tua wajib diisi');
      return;
    }

    setNikValidation(prev => ({ ...prev, checking: true }));
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/check-nik-orangtua', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nik: formData.nikOrangtua
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Error checking NIK');
        setNikValidation(prev => ({ ...prev, checking: false }));
        return;
      }

      setNikValidation({
        checking: false,
        valid: data.exists,
        message: data.message,
        siswaList: data.siswa || []
      });

    } catch (error) {
      console.error('Error checking NIK:', error);
      setError('Terjadi kesalahan saat mengecek NIK');
      setNikValidation(prev => ({ ...prev, checking: false }));
    }
  };

  // Check NIK untuk orang tua
  const checkNikForOrangtua = async () => {
    if (!formData.nomorInduk) {
      setError('NIK wajib diisi');
      return;
    }

    setNikValidation(prev => ({ ...prev, checking: true }));
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/check-nik-orangtua', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nik: formData.nomorInduk
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Error checking NIK');
        setNikValidation(prev => ({ ...prev, checking: false }));
        return;
      }

      setNikValidation({
        checking: false,
        valid: data.exists,
        message: data.message,
        siswaList: data.siswa || []
      });

    } catch (error) {
      console.error('Error checking NIK:', error);
      setError('Terjadi kesalahan saat mengecek NIK');
      setNikValidation(prev => ({ ...prev, checking: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validasi form berdasarkan role
    if (selectedRole === 'siswa') {
      if (!formData.namaLengkap || !formData.nomorInduk || !formData.nikOrangtua) {
        setError('Semua field harus diisi');
        return;
      }
      
      // Validasi panjang NIK orang tua
      if (formData.nikOrangtua.length !== 16) {
        setError('NIK Orang Tua harus 16 digit');
        return;
      }
      
      // Validasi hanya angka
      if (!/^\d+$/.test(formData.nikOrangtua)) {
        setError('NIK Orang Tua hanya boleh berisi angka');
        return;
      }
      
    } else if (selectedRole === 'orangtua') {
      if (!formData.namaLengkap || !formData.nomorInduk) {
        setError('Nama lengkap dan NIK harus diisi');
        return;
      }
      
      // Validasi panjang NIK
      if (formData.nomorInduk.length !== 16) {
        setError('NIK harus 16 digit');
        return;
      }
      
      // Validasi hanya angka
      if (!/^\d+$/.test(formData.nomorInduk)) {
        setError('NIK hanya boleh berisi angka');
        return;
      }
      
      if (nikValidation.valid !== true) {
        setError('NIK harus sudah terdaftar oleh siswa. Silakan cek terlebih dahulu.');
        return;
      }
      
    } else {
      if (!formData.namaLengkap || !formData.nomorInduk) {
        setError('Semua field harus diisi');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const submitData = {
        tempToken,
        role: selectedRole,
        nomorInduk: formData.nomorInduk.trim(),
        namaLengkap: formData.namaLengkap.trim()
      };

      // Tambahkan NIK orang tua untuk siswa
      if (selectedRole === 'siswa') {
        submitData.nikOrangtua = formData.nikOrangtua.trim();
      }

      console.log('Submitting data:', {
        ...submitData,
        nikOrangtua: submitData.nikOrangtua ? '***' + submitData.nikOrangtua.slice(-4) : undefined
      });

      const response = await fetch('http://localhost:5000/api/auth/oauth-complete-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      console.log('Response:', { success: data.success, message: data.message });

      if (!response.ok) {
        setError(data.message || 'Setup gagal');
        return;
      }

      // Simpan token dan redirect
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('userRole', data.role);

      // Redirect ke success page
      navigate(`/oauth-success?token=${data.token}&refreshToken=${data.refreshToken}&role=${data.role}&setup=true`);

    } catch (error) {
      console.error('Setup error:', error);
      setError('Terjadi kesalahan saat setup');
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleData = roles.find(role => role.id === selectedRole);

  // Role Selection Step
  if (step === 'role') {
    const isReturning = searchParams.get('returning') === 'true';
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto py-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isReturning ? 'Selamat Datang Kembali!' : 'Selamat Datang di MindaGrow!'}
            </h1>
            <p className="text-gray-600">
              Akun Google Anda ({email}) telah terhubung. 
              {isReturning 
                ? ' Silakan lengkapi setup profil Anda.'
                : ' Silakan pilih peran Anda:'
              }
            </p>
            {isReturning && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-md mx-auto">
                <p className="text-sm text-yellow-800">
                  📝 Profil Anda belum lengkap. Silakan pilih peran dan lengkapi data untuk melanjutkan.
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div
                key={role.id}
                onClick={() => handleRoleSelect(role.id)}
                className={`
                  bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-200
                  hover:shadow-xl hover:scale-105 border-2 border-transparent
                  hover:border-${role.color}-200
                `}
              >
                <div className={`text-${role.color}-600 mb-4 flex justify-center`}>
                  {role.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">
                  {role.title}
                </h3>
                <p className="text-gray-600 text-center text-sm">
                  {role.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Butuh bantuan? <a href="mailto:support@mindagrow.com" className="text-blue-600 hover:underline">Hubungi Support</a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Step
  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 bg-${selectedRoleData.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <div className={`text-${selectedRoleData.color}-600`}>
                {selectedRoleData.icon}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Konfirmasi Peran
            </h2>
            <p className="text-gray-600">
              Anda yakin memilih peran sebagai <strong>{selectedRoleData.title}</strong>?
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">Perhatian!</p>
                <p className="text-sm text-yellow-700">
                  Pemilihan peran hanya dapat dilakukan sekali. Gunakan pilihan Anda dengan bijak.
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleBackToRole}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Kembali
            </button>
            <button
              onClick={handleConfirmRole}
              className={`flex-1 px-4 py-2 bg-${selectedRoleData.color}-600 text-white rounded-lg hover:bg-${selectedRoleData.color}-700 transition-colors`}
            >
              Ya, Saya Yakin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Details Form Step
  if (step === 'details') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className={`w-16 h-16 bg-${selectedRoleData.color}-100 rounded-full flex items-center justify-center mx-auto mb-4`}>
              <div className={`text-${selectedRoleData.color}-600`}>
                {selectedRoleData.icon}
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Lengkapi Data {selectedRoleData.title}
            </h2>
            <p className="text-gray-600">
              Langkah terakhir untuk menyelesaikan pendaftaran
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nama Lengkap *
              </label>
              <input
                type="text"
                name="namaLengkap"
                value={formData.namaLengkap}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Masukkan nama lengkap Anda"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {selectedRoleData.fieldLabel} *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="nomorInduk"
                  value={formData.nomorInduk}
                  onChange={handleInputChange}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={selectedRoleData.fieldPlaceholder}
                  required
                />
                {selectedRole === 'orangtua' && (
                  <button
                    type="button"
                    onClick={checkNikForOrangtua}
                    disabled={nikValidation.checking || !formData.nomorInduk}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cek apakah NIK sudah terdaftar oleh siswa"
                  >
                    {nikValidation.checking ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
              
              {/* NIK Validation Result untuk Orang Tua */}
              {selectedRole === 'orangtua' && nikValidation.valid !== null && (
                <div className={`mt-2 p-3 rounded-md ${nikValidation.valid ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                  <div className="flex items-center">
                    {nikValidation.valid ? (
                      <Check className="w-4 h-4 text-green-600 mr-2" />
                    ) : (
                      <X className="w-4 h-4 text-red-600 mr-2" />
                    )}
                    <span className={`text-sm ${nikValidation.valid ? 'text-green-800' : 'text-red-800'}`}>
                      {nikValidation.message}
                    </span>
                  </div>
                  {nikValidation.valid && nikValidation.siswaList.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-green-700 font-medium">Anak yang terdaftar:</p>
                      <ul className="text-sm text-green-600 ml-4">
                        {nikValidation.siswaList.map((siswa, index) => (
                          <li key={index}>• {siswa.nama}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Field NIK Orang Tua untuk Siswa */}
            {selectedRole === 'siswa' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  NIK Orang Tua *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="nikOrangtua"
                    value={formData.nikOrangtua}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Masukkan NIK orang tua"
                    maxLength="16"
                    required
                  />
                  <button
                    type="button"
                    onClick={checkNikOrangtua}
                    disabled={nikValidation.checking || !formData.nikOrangtua}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cek ketersediaan NIK"
                  >
                    {nikValidation.checking ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  NIK orang tua (16 digit) - akan digunakan untuk verifikasi orang tua
                </p>
                
                {/* NIK Validation Result untuk Siswa */}
                {nikValidation.valid !== null && (
                  <div className={`mt-2 p-3 rounded-md ${nikValidation.valid ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                    <div className="flex items-center">
                      {nikValidation.valid ? (
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                      ) : (
                        <svg className="w-4 h-4 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className={`text-sm ${nikValidation.valid ? 'text-green-800' : 'text-yellow-800'}`}>
                        {nikValidation.valid 
                          ? 'NIK sudah terdaftar oleh siswa lain. Anda dapat menggunakan NIK ini.'
                          : 'NIK belum terdaftar. Anda dapat menggunakan NIK ini sebagai siswa baru.'
                        }
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-2 px-4 rounded-md text-white font-medium
                bg-${selectedRoleData.color}-600 hover:bg-${selectedRoleData.color}-700
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-${selectedRoleData.color}-500
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              `}
            >
              {loading ? 'Menyimpan...' : 'Selesaikan Pendaftaran'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleBackToRole}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Kembali ke pilihan peran
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return null;
};

export default OAuthRoleSetup;