import React from "react";
import { Bell, BookOpen, Gamepad2Icon as GameController2, Home, Settings, Award } from 'lucide-react';

export default function SideBar() {
  return (
    <div className="h-screen w-56 bg-biru-dasar flex flex-col items-center py-6">
      {/* Logo and Title */}
      <div className="flex items-center mb-10">
        <div className="bg-white rounded-full p-1 mr-2">
          <img src="/public/Logo.png" className="w-10" alt="" />
        </div>
        <h1 className="text-2xl font-bold text-black">MindaGrow</h1>
      </div>

      {/* Navigation Menu */}
      <div className="w-full px-4 space-y-6 flex-1">
        {/* Dashboard - Yellow Button */}
        <button className="w-full py-3 bg-white rounded-md font-medium text-black hover:bg-gold-first hover:text-white">
          Dashboard
        </button>

        {/* Kursus */}
        <button className="w-full py-3 bg-white rounded-md font-medium text-black flex items-center justify-center hover:bg-gold-first hover:text-white">
          Kursus
        </button>

        {/* Kelas saya */}
        <button className="w-full py-3 bg-white rounded-md font-medium text-black flex items-center justify-center hover:bg-gold-first hover:text-white">
          Kelas saya
        </button>

        {/* Game */}
        <button className="w-full py-3 bg-white rounded-md font-medium text-black flex items-center justify-center hover:bg-gold-first hover:text-white">
          Game
        </button>

        {/* Notifikasi with red dot */}
        <div className="relative w-full">
          <button className="w-full py-3 bg-white rounded-md font-medium text-black flex items-center justify-center hover:bg-gold-first hover:text-white">
            Notifikasi
          </button>
          
        </div>

        {/* Pengaturan */}
        <button className="w-full py-3 bg-white rounded-md font-medium text-black flex items-center justify-center hover:bg-gold-first hover:text-white">
          Pengaturan
        </button>
      </div>

      {/* Pro Upgrade Section */}
      <div className="w-full px-4 mt-auto">
        <div className="bg-yellow-400 rounded-lg p-4 relative">
          <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full p-3 border-4 border-biru-dasar">
            <Award className="text-yellow-400 w-6 h-6" />
          </div>
          <div className="mt-4 text-center">
            <p className="font-medium">Tingkatkan <span className="font-bold">Pro</span></p>
            <p className="text-sm">untuk fitur lebih</p>
          </div>
        </div>
      </div>
    </div>
  );
};
