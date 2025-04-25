import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';

const MainPage = () => {
  // Data fitur
  const features = [
    {
      icon: "ai",
      title: "AI Personalized Learning",
      description: "Pembelajaran yang disesuaikan dengan kecerdasan buatan"
    },
    {
      icon: "game",
      title: "Gamifikasi & Tantangan",
      description: "Belajar sambil bermain lewat tantangan dan poin."
    },
    {
      icon: "report",
      title: "Laporan Perkembangan",
      description: "Pantau perkembangan anak secara langsung dan mudah."
    },
    {
      icon: "dashboard",
      title: "Dashboard Orang Tua & guru",
      description: "Kontrol penuh untuk memantau dan mendukung anak belajar."
    }
  ];

  // Data testimoni
  const testimonials = [
    {
      name: "Joko Anwar",
      testimonial: "Platform ini sangat membantu anak saya belajar dengan cara yang menyenangkan. Setiap hari dia selalu ingin belajar lagi!"
    },
    {
      name: "Maria Zoe",
      testimonial: "Saya sangat terkesan dengan pendekatan personalisasi di MINDAGROW. Anak saya yang biasanya sulit fokus jadi lebih semangat belajar."
    },
    {
      name: "Alice Grace",
      testimonial: "Dashboard untuk orang tua sangat informatif, memudahkan saya memantau perkembangan anak dan membantu di area yang perlu ditingkatkan."
    },
    {
      name: "Bunny Chan",
      testimonial: "Fitur gamifikasi membuat anak saya tidak merasa sedang belajar, tapi seperti bermain game. Hasilnya luar biasa!"
    }
  ];

  return (
    <>
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-biru-dasar text-white">
        <div className="container mx-auto py-16 px-4 flex flex-wrap items-center">
          <div className="w-full lg:w-1/2 lg:pr-10">
            <h1 className="text-4xl font-bold mb-4">
              Belajar Jadi Menyenangkan dan Personal dari setiap anak
            </h1>
            <p className="text-lg mb-8">
              platform edukasi berbasis AI & gamifikasi untuk anak usia 5-12 tahun.
            </p>
            <div className="flex space-x-4">
              <Link to="/role-selection" className="bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold py-2 px-6 rounded">
                Daftar sekarang
              </Link>
              <Link to="/login" className="bg-transparent hover:bg-blue-700 text-white border border-white font-semibold py-2 px-6 rounded">
                Masuk
              </Link>
            </div>
          </div>
          <div className="w-full lg:w-1/2 mt-10 lg:mt-0">
            <img 
              src="/images/hero-kids.png" 
              alt="Anak belajar dengan MindaGrow" 
              className="mx-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/500x300/FFD700/0000FF?text=MindaGrow+Kids";
              }}
            />
          </div>
        </div>
      </section>

      {/* Fitur Unggulan */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-blue-500 text-center mb-12">
            Fitur Unggulan
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="p-6 rounded-lg bg-white shadow-lg flex flex-col items-center text-center">
                {/* Icon */}
                <div className="w-12 h-12 flex items-center justify-center text-blue-500 mb-4">
                  {feature.icon === "ai" && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  )}
                  {feature.icon === "game" && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.087c0-.355.186-.676.401-.959.221-.29.349-.634.349-1.003 0-1.036-1.007-1.875-2.25-1.875s-2.25.84-2.25 1.875c0 .369.128.713.349 1.003.215.283.401.604.401.959v0a.64.64 0 01-.657.643 48.39 48.39 0 01-4.163-.3c.186 1.613.293 3.25.315 4.907a.656.656 0 01-.658.663v0c-.355 0-.676-.186-.959-.401a1.647 1.647 0 00-1.003-.349c-1.036 0-1.875 1.007-1.875 2.25s.84 2.25 1.875 2.25c.369 0 .713-.128 1.003-.349.283-.215.604-.401.959-.401v0c.31 0 .555.26.532.57a48.039 48.039 0 01-.642 5.056c1.518.19 3.058.309 4.616.354a.64.64 0 00.657-.643v0c0-.355-.186-.676-.401-.959a1.647 1.647 0 01-.349-1.003c0-1.035 1.008-1.875 2.25-1.875 1.243 0 2.25.84 2.25 1.875 0 .369-.128.713-.349 1.003-.215.283-.4.604-.4.959v0c0 .333.277.599.61.58a48.1 48.1 0 005.427-.63 48.05 48.05 0 00.582-4.717.532.532 0 00-.533-.57v0c-.355 0-.676.186-.959.401-.29.221-.634.349-1.003.349-1.035 0-1.875-1.007-1.875-2.25s.84-2.25 1.875-2.25c.37 0 .713.128 1.003.349.283.215.604.401.96.401v0a.656.656 0 00.658-.663 48.422 48.422 0 00-.37-5.36c-1.886.342-3.81.574-5.766.689a.578.578 0 01-.61-.58v0z" />
                    </svg>
                  )}
                  {feature.icon === "report" && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                    </svg>
                  )}
                  {feature.icon === "dashboard" && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                    </svg>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimoni Orang Tua */}
      <section className="py-16 px-4 bg-gray-100">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Apa kata orang tua mengenai website kami?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                  <h3 className="font-semibold">{testimonial.name}</h3>
                </div>
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-gray-600">{testimonial.testimonial}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
};

export default MainPage;