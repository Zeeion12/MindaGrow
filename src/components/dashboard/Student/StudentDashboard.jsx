import React from 'react';
import { Link } from 'react-router-dom';
import { BiCrown } from 'react-icons/bi';
import { useAuth } from '../../../context/authContext';
import SideBar from '../../layout/SideBar';

// Card Import
import CardKursus from '../../layout/TaskCard/CardKursus';

const StudentDashboard = () => {
  const { currentUser } = useAuth();
  const userName = currentUser?.name || "User";

  return (
    <div className="flex h-screen">
      <SideBar />

      {/* Main Content */}
      <main className="flex-1 bg-blue-50">
        {/* Header */}
        <header className="bg-blue-50 p-4 flex justify-between items-center">
          <h1 className="text-lg">
            👋 Selamat datang, {userName}! Siap belajar seru hari ini?
          </h1>
          
          {/* User Avatar */}
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {currentUser?.profileImage ? (
              <img 
                src={currentUser.profileImage} 
                alt="Profile" 
                className="w-full h-full rounded-full object-cover"
              />
            ) : null}
          </div>
        </header>

        {/* Dashboard Content - Empty for now */}
        <div className="p-4">
          {/* Dashboard content will go here */}
          
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;