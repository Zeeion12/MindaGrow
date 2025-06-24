import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Footer from '../components/layout/layoutParts/Footer';

import heroImg from '../assets/HeroSection.png'; // Gambar hero dengan 2 anak
import aiIcon from '../assets/icons/ai-icon.svg'; // Icon untuk AI Personalized
import gameIcon from '../assets/icons/game-icon.svg'; // Icon untuk Gamifikasi
import reportIcon from '../assets/icons/report-icon.svg'; // Icon untuk Laporan
import dashboardIcon from '../assets/icons/dashboard-icon.svg'; // Icon untuk Dashboard
import avatar1 from '../assets/avatars/JokoAnwar.jpg'; // Avatar untuk testimonial
import avatar2 from '../assets/avatars/MariaZoe.jpg';
import avatar3 from '../assets/avatars/AliceGrace.jpg';
import avatar4 from '../assets/avatars/BunnyChua.jpg';
import logoImg from '../assets/Logo.png';

const LandingPage = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: aiIcon,
      title: 'AI Personalized Learning',
      description: 'Pembelajaran yang disesuaikan dengan kecerdasan buatan'
    },
    {
      icon: gameIcon,
      title: 'Gamifikasi & Tantangan',
      description: 'Belajar sambil bermain lewat tantangan dan poin.'
    },
    {
      icon: reportIcon,
      title: 'Laporan Perkembangan',
      description: 'Pantau perkembangan anak secara langsung dan mudah.'
    },
    {
      icon: dashboardIcon,
      title: 'Dashboard Orang Tua & guru',
      description: 'Kontrol penuh untuk memantau dan mendukung anak belajar.'
    },
  ];

  const testimonials = [
    {
      avatar: avatar1,
      name: 'Joko Anwar',
      text: 'Platform ini sangat membantu anak saya belajar dengan cara yang menyenangkan. Perkembangannya jadi lebih cepat!'
    },
    {
      avatar: avatar2,
      name: 'Maria Zoe',
      text: 'Fitur gamifikasi membuat anak saya jadi semangat belajar. Tidak lagi merasa terpaksa untuk belajar.'
    },
    {
      avatar: avatar3,
      name: 'Alice Grace',
      text: 'Dashboard orangtua memudahkan saya memantau perkembangan anak. Rekomendasi aktivitas juga sangat membantu.'
    },
    {
      avatar: avatar4,
      name: 'Bunny Chua',
      text: 'Sebagai guru, saya sangat terbantu dengan laporan detail di platform ini. Memudahkan personalisasi pembelajaran.'
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header/Navbar */}
      <header className="bg-blue-500 py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center">
            <img src={logoImg} alt="MindaGrow Logo" className="h-8 w-8 mr-2" />
            <span className="text-white text-xl font-bold">MindaGrow</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-blue-500 py-16">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-white text-4xl font-bold leading-tight mb-4">
              Belajar Jadi Menyenangkan dan Personal dari setiap anak
            </h1>
            <p className="text-blue-100 text-lg mb-6">
              platform edukasi berbasis AI & gamifikasi untuk anak usia 5-12 tahun.
            </p>
            <div className="flex space-x-4">
              <Link
                to="/role-selection"
                className="bg-yellow-400 text-blue-800 px-6 py-3 rounded-md font-medium hover:bg-yellow-300"
              >
                Daftar sekarang
              </Link>
              <Link
                to="/login"
                className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-md font-medium hover:bg-white hover:bg-opacity-10"
              >
                Masuk
              </Link>
            </div>
          </div>
          <div className="md:w-1/2">
            <div className="rounded-3xl overflow-hidden bg-gradient-to-r from-yellow-300 to-red-500">
              <img
                src={heroImg}
                alt="Children learning"
                className="w-full h-auto object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-blue-600 font-bold text-center mb-12">
            Fitur Unggulan
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 flex items-center justify-center text-blue-500">
                    {/* Fallback icon if SVG import doesn't work */}
                    {feature.icon ? (
                      <img src={feature.icon} alt={feature.title} className="w-8 h-8" />
                    ) : (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-center mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-center">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">
            Apa kata orang tua mengenai website kami?
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-300 mr-4">
                    {testimonial.avatar ? (
                      <img src={testimonial.avatar} alt={testimonial.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-400"></div>
                    )}
                  </div>
                  <h3 className="text-lg font-medium">{testimonial.name}</h3>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-gray-600">{testimonial.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default LandingPage;