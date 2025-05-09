import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

// Icons - Anda bisa menggunakan icon dari library seperti react-icons atau buat sendiri
import { 
  RiDashboardLine, 
  RiTeamLine, 
  RiGamepadLine,
  RiSettings4Line,
  RiGraduationCapLine,
  RiBellLine,
  RiCoinLine
} from 'react-icons/ri';

// Logo
import logoImg from '../../../assets/Logo.png'; // Ganti dengan path logo Anda

const Sidebar = () => {
  const [expanded, setExpanded] = useState(false);
  const location = useLocation();

  // Menu items
  const menuItems = [
    {
      path: '/dashboard/siswa',
      name: 'Dashboard',
      icon: <RiDashboardLine size={24} />,
      exact: true
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

  // Sidebar icons for collapsed mode
  const sidebarIcons = [
    { icon: <RiDashboardLine size={24} />, path: '/dashboard' },
    { icon: <RiGraduationCapLine size={24} />, path: '/kursus' },
    { icon: <RiTeamLine size={24} />, path: '/kelas' },
    { icon: <RiGamepadLine size={24} />, path: '/game' },
    { icon: <RiBellLine size={24} />, path: '/notifikasi' },
    { icon: <RiSettings4Line size={24} />, path: '/pengaturan' }
  ];

  const toggleSidebar = () => {
    const newExpandedState = !expanded;
    setExpanded(newExpandedState);
    // Panggil callback onToggle untuk memberi tahu parent komponen tentang perubahan status
    if (onToggle) {
      onToggle(newExpandedState);
    }
  };

  // Check if a menu item is active
  const isActive = (path) => {
    return location.pathname === path;
  };

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