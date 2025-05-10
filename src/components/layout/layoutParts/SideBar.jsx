import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

// Icons - Anda bisa menggunakan icon dari library seperti react-icons atau buat sendiri
import { 
  // Umum icons
  RiDashboardLine, 
  RiSettings4Line,
  RiBellLine,
  RiCoinLine,

  // Siswa icons
  RiGraduationCapLine,
  RiTeamLine, 
  RiGamepadLine,

  // Guru icons
  RiUser3Line,
  RiBookletLine,
  RiFileList3Line,
  
  // Orangtua icons
  RiUserHeartLine,
  RiMessage3Line,
  RiParentLine

} from 'react-icons/ri';

// Logo
import logoImg from '../../../assets/Logo.png'; // Ganti dengan path logo Anda

const Sidebar = ({ onToggle }) => {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const userRole = user?.role || 'siswa';

  const toggleSidebar = () => {
    const newExpandedState = !expanded;
    setExpanded(newExpandedState);
    // Panggil callback onToggle untuk memberi tahu parent komponen tentang perubahan status
    if (onToggle) {
      onToggle(newExpandedState);
    }
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const getMenuItems = () => {
    // Menu untuk Siswa
    if (userRole === 'siswa') {
      return [
        {
          path: '/dashboard/siswa',
          name: 'Dashboard',
          icon: <RiDashboardLine size={24} />,
        },
        {
          path: '/kursus',
          name: 'Kursus',
          icon: <RiGraduationCapLine size={24} />
        },
        {
          path: '/kelas',
          name: 'Kelas saya',
          icon: <RiTeamLine size={24} />
        },
        {
          path: '/game',
          name: 'Game',
          icon: <RiGamepadLine size={24} />
        },
        {
          path: '/notifikasi',
          name: 'Notifikasi',
          icon: <RiBellLine size={24} />
        },
        {
          path: '/pengaturan',
          name: 'Pengaturan',
          icon: <RiSettings4Line size={24} />
        }
      ];
    }

    if (userRole === 'guru') {
      return [
        {
          path: '/dashboard/guru',
          name: 'Dashboard',
          icon: <RiDashboardLine size={24} />,
        },
        {
          path: '/kelas-diajar',
          name: 'Kelas yang Diajar',
          icon: <RiUser3Line size={24} />
        },
        {
          path: '/buat-kursus',
          name: 'Buat Kursus',
          icon: <RiBookletLine size={24} />
        },
        {
          path: '/manajemen-kelas',
          name: 'Manajemen Kelas',
          icon: <RiFileList3Line size={24} />
        },
        {
          path: '/notifikasi',
          name: 'Notifikasi',
          icon: <RiBellLine size={24} />
        },
        {
          path: '/pengaturan',
          name: 'Pengaturan',
          icon: <RiSettings4Line size={24} />
        }
      ];
    }

    if (userRole === 'orangtua') {
      return [
        {
          path: '/dashboard/orangtua',
          name: 'Dashboard',
          icon: <RiDashboardLine size={24} />,
        },
        {
          path: '/pemantauan-anak',
          name: 'Pemantauan Anak',
          icon: <RiUserHeartLine size={24} />
        },
        {
          path: '/chat-guru',
          name: 'Chat dengan Guru',
          icon: <RiMessage3Line size={24} />
        },
        {
          path: '/laporan-anak',
          name: 'Laporan Perkembangan',
          icon: <RiParentLine size={24} />
        },
        {
          path: '/notifikasi',
          name: 'Notifikasi',
          icon: <RiBellLine size={24} />
        },
        {
          path: '/pengaturan',
          name: 'Pengaturan',
          icon: <RiSettings4Line size={24} />
        }
      ];
    }
    
    // Fallback jika role tidak dikenali
    return [
      {
        path: '/dashboard',
        name: 'Dashboard',
        icon: <RiDashboardLine size={24} />,
      },
      {
        path: '/pengaturan',
        name: 'Pengaturan',
        icon: <RiSettings4Line size={24} />
      }
    ];
  };
  
  const menuItems = getMenuItems();
  
  return (
    <div 
      className={`h-screen bg-blue-500 fixed left-0 top-0 transition-all duration-300 ease-in-out z-10 ${
        expanded ? 'w-64' : 'w-20'
      } flex flex-col items-center py-4`}
    >
      {/* Logo - Toggles sidebar on click */}
      <div 
        className="flex justify-center items-center mb-6 cursor-pointer"
        onClick={toggleSidebar}
      >
        <img src={logoImg} alt="MindaGrow Logo" className="h-10 w-10" />
        {expanded && (
          <span className="ml-2 text-white font-bold text-xl">MindaGrow</span>
        )}
      </div>

      {/* Navigation Menu */}
      <div className="flex flex-col items-center w-full flex-grow px-3">
        {menuItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`w-full py-3 mb-2 rounded-md flex items-center transition-colors ${
              isActive(item.path)
                ? 'bg-yellow-400 text-blue-800'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            } ${expanded ? 'px-4 justify-start' : 'px-0 justify-center'}`}
          >
            <span>{item.icon}</span>
            {expanded && (
              <span className="ml-3 text-sm font-medium">{item.name}</span>
            )}
          </Link>
        ))}
      </div>

      {/* Pro Upgrade Button */}
      <div className={`mt-auto mb-4 px-3 w-full`}>
        <div className={`bg-yellow-400 text-blue-800 rounded-md p-2 flex ${expanded ? 'flex-col items-center' : 'justify-center'}`}>
          <div className="bg-white p-2 rounded-full mb-1">
            <RiCoinLine size={20} className="text-yellow-400" />
          </div>
          {expanded && (
            <span className="text-sm font-medium text-center">Tingkatkan Pro untuk fitur lebih</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;