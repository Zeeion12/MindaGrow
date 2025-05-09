// File: client/src/pages/ProfileSettings.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/layout/layoutParts/Header';
import ProfilePicture from '../../components/ProfilePicture';
import axios from 'axios';

const ProfileSettings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  
  // Tab state
  const [activeTab, setActiveTab] = useState('profile');
  
  // Aktifkan file input ketika tombol upload diklik
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }
    
    // Validasi file (hanya gambar, max 2MB)
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, atau GIF)');
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }
    
    if (file.size > 2 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 2MB');
      setSelectedFile(null);
      setPreviewUrl('');
      return;
    }
    
    setError('');
    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle save button click
  const handleSaveClick = async () => {
    if (!selectedFile) {
      setError('Silakan pilih foto terlebih dahulu');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Buat form data
      const formData = new FormData();
      formData.append('profilePicture', selectedFile);
      
      // Kirim ke server
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/users/profile-picture`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update user context dengan data terbaru
      if (updateUser) {
        updateUser({
          ...user,
          profile_picture: response.data.profile_picture
        });
      }
      
      setSuccess('Foto profil berhasil diperbarui');
      setSelectedFile(null); // Reset selected file after successful upload
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setError(error.response?.data?.message || 'Terjadi kesalahan saat mengupload foto profil');
    } finally {
      setLoading(false);
    }
  };
  
  // Bersihkan preview URL saat component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900 flex items-center">
                <svg className="h-5 w-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Atur preferensimu di sini
              </h2>
            </div>
            
            <div className="flex flex-col sm:flex-row">
              {/* Tab Navigation */}
              <div className="w-full sm:w-1/4 bg-gray-50 p-4">
                <div className="flex flex-col">
                  <button 
                    className={`mb-2 py-2 px-4 rounded-md w-full text-left font-medium ${
                      activeTab === 'profile' 
                        ? 'bg-yellow-400 text-yellow-800' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    Profile
                  </button>
                  <button 
                    className={`mb-2 py-2 px-4 rounded-md w-full text-left font-medium ${
                      activeTab === 'security' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => setActiveTab('security')}
                  >
                    Keamanan
                  </button>
                </div>
              </div>
              
              {/* Tab Content */}
              <div className="w-full sm:w-3/4 p-6">
                {activeTab === 'profile' && (
                  <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center">
                    {/* Profile Preview Section */}
                    <div className="relative mb-6">
                      {previewUrl ? (
                        <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-gray-200">
                          <img 
                            src={previewUrl} 
                            alt="Preview foto profil" 
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-gray-200">
                          {user?.profile_picture ? (
                            <img 
                              src={user.profile_picture} 
                              alt={`Foto profil ${user?.nama_lengkap}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ProfilePicture user={user} size="lg" className="h-full w-full" />
                          )}
                        </div>
                      )}
                      <button 
                        className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-200 hover:bg-gray-100"
                        onClick={handleUploadClick}
                      >
                        <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                      
                      {/* Hidden file input */}
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                    </div>
                    
                    {/* User Info Section */}
                    <h3 className="text-xl font-medium text-gray-900 mb-1">
                      {user?.nama_lengkap}
                    </h3>
                    
                    <div className="flex items-center text-gray-500 mb-1">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-14a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V4z" clipRule="evenodd" />
                      </svg>
                      Level 99
                    </div>
                    
                    <div className="flex items-center text-gray-500 mb-1">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                      </svg>
                      Grade 4th
                    </div>
                    
                    <div className="flex items-center text-gray-500 mb-4">
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      9 Achievements
                    </div>
                    
                    {/* Save Button - Only show when a file is selected */}
                    {selectedFile && (
                      <button
                        onClick={handleSaveClick}
                        disabled={loading}
                        className="mt-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 disabled:bg-green-300"
                      >
                        {loading ? 'Menyimpan...' : 'Simpan Foto'}
                      </button>
                    )}
                    
                    {/* Success/Error Messages */}
                    {success && (
                      <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-md text-sm w-full">
                        {success}
                      </div>
                    )}
                    
                    {error && (
                      <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md text-sm w-full">
                        {error}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'security' && (
                  <div className="bg-white rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Pengaturan Keamanan</h3>
                    <div className="border-t border-gray-200 pt-4">
                      <form className="space-y-4">
                        <div>
                          <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                            Password Saat Ini
                          </label>
                          <input
                            type="password"
                            id="current-password"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                            Password Baru
                          </label>
                          <input
                            type="password"
                            id="new-password"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                            Konfirmasi Password Baru
                          </label>
                          <input
                            type="password"
                            id="confirm-password"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>
                        
                        <div className="pt-4">
                          <button
                            type="submit"
                            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Ubah Password
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProfileSettings;