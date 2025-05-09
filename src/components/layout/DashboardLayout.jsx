import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../../components/layout/layoutParts/SideBar';

const DashboardLayout = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Callback function to receive sidebar state changes
  const handleSidebarToggle = (expanded) => {
    setSidebarExpanded(expanded);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar onToggle={handleSidebarToggle} />
      
      {/* Main Content - Dynamically adjust padding based on sidebar state */}
      <div 
        className={`flex-1 transition-all duration-300 ease-in-out ${
          sidebarExpanded ? 'ml-64' : 'ml-20'
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;