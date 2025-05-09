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
    'lg': 'h-16 w-16 text-xl'
  };
  
  // Warna background berdasarkan initial (untuk konsistensi)
  const getColorClass = (initial) => {
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
      'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-teal-500'
    ];
    
    // Gunakan kode ASCII dari initial untuk memilih warna
    const index = initial ? initial.charCodeAt(0) % colors.length : 0;
    return colors[index];
  };
  
  const initial = getInitial(user?.nama_lengkap);
  const colorClass = getColorClass(initial);
  
  const hasProfilePicture = user?.profile_picture && (
    typeof user.profile_picture === 'string' && 
    (user.profile_picture.startsWith('data:image') || user.profile_picture.startsWith('http'))
  );
  
  if (hasProfilePicture) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${className}`}>
        <img 
          src={user.profile_picture} 
          alt={`Foto profil ${user?.nama_lengkap}`}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} ${colorClass} rounded-full flex items-center justify-center text-white font-medium ${className}`}>
      {initial}
    </div>
  );
};

export default ProfilePicture;