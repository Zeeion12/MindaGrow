import React from 'react';

const ProfilePicture = ({ user, size = 'md', className = '' }) => {
  // Mendapatkan initial dari nama user
  const getInitial = (name) => {
    if (!name) return '';
    return name.charAt(0).toUpperCase();
  };
  
  // Size classes
  const sizeClasses = {
    'sm': 'h-8 w-8 text-sm',
    'md': 'h-10 w-10 text-md',
    'lg': 'h-16 w-16 text-xl',
    'xl': 'h-20 w-20 text-2xl'
  };
  
  // Warna background berdasarkan initial (untuk konsistensi)
  const getColorClass = (initial) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500',
      'bg-orange-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-rose-500'
    ];
    
    // Gunakan kode ASCII dari initial untuk memilih warna
    const index = initial ? initial.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };
  
  // Check apakah user memiliki profile picture yang valid
  const hasValidProfilePicture = () => {
    if (!user?.profile_picture) return false;
    
    // Cek apakah ini URL yang valid (baik base64 lama atau file URL baru)
    return (
      typeof user.profile_picture === 'string' && 
      (
        user.profile_picture.startsWith('data:image') || // Base64 (legacy)
        user.profile_picture.startsWith('http') || // Full URL
        user.profile_picture.startsWith('/uploads') // Relative path
      )
    );
  };
  
  // Handle error loading image
  const handleImageError = (e) => {
    console.warn('Error loading profile picture:', user?.profile_picture);
    // Hide the image and show initial instead
    e.target.style.display = 'none';
    e.target.nextSibling?.classList.remove('hidden');
  };
  
  // Get image source URL
  const getImageSrc = () => {
    if (!user?.profile_picture) return null;
    
    // Jika sudah full URL atau base64, gunakan langsung
    if (user.profile_picture.startsWith('http') || user.profile_picture.startsWith('data:')) {
      return user.profile_picture;
    }
    
    // Jika relative path, tambahkan base URL
    if (user.profile_picture.startsWith('/uploads') || user.profile_picture.startsWith('uploads')) {
      const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const path = user.profile_picture.startsWith('/') ? user.profile_picture : `/${user.profile_picture}`;
      return `${baseURL}${path}`;
    }
    
    return null;
  };
  
  const initial = getInitial(user?.nama_lengkap);
  const colorClass = getColorClass(initial);
  const imageSrc = getImageSrc();
  const hasProfilePicture = hasValidProfilePicture();
  
  return (
    <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
      {hasProfilePicture && imageSrc ? (
        <>
          <img 
            src={imageSrc}
            alt={`Foto profil ${user?.nama_lengkap || 'User'}`}
            className="h-full w-full object-cover"
            onError={handleImageError}
            loading="lazy"
          />
          {/* Fallback initial (hidden by default, shown on error) */}
          <div className={`hidden absolute inset-0 ${colorClass} rounded-full flex items-center justify-center text-white font-medium`}>
            {initial}
          </div>
        </>
      ) : (
        // Default initial avatar
        <div className={`${colorClass} rounded-full flex items-center justify-center text-white font-medium h-full w-full`}>
          {initial}
        </div>
      )}
    </div>
  );
};

export default ProfilePicture;