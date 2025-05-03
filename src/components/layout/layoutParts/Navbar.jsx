import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/authContext'; // Pastikan path ini benar

export default function Navibar() {
    const navigate = useNavigate();
    const { logout } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Ambil data user dari localStorage jika ada
    const user = JSON.parse(localStorage.getItem('user')) || {};
    
    const handleLogout = () => {
        logout();
        setIsMenuOpen(false);
        navigate('/login');
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    // Menutup menu saat mengklik di luar
    const handleClickOutside = (e) => {
        if (isMenuOpen && !e.target.closest('.user-menu')) {
            setIsMenuOpen(false);
        }
    };

    // Tambahkan event listener untuk menutup menu saat klik di luar
    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMenuOpen]);

    return (
        <nav className="navbar fixed w-full bg-biru-dasar flex justify-between items-center font-poppins shadow-lg ">
            <div className="logoPort">
                <h1 className="text-emerald-50 text-2xl font-bold p-[15px]">MindaGrow</h1>
            </div>
            <div className="navButton font-poppins p-[15px] text-amber-50 font-medium">
                <ul className="flex space-x-5 items-center"> 
                    <li><Link to='/'>Home</Link></li>
                    <li><a href="#about" className="hover:text-coklat">About</a></li>
                    <li><a href="#services" className="hover:text-coklat">Services</a></li>
                    <li><a href="#contact" className="hover:text-coklat">Contact</a></li>
                    <li className="relative user-menu">
                        <button 
                            onClick={toggleMenu}
                            className="flex items-center hover:text-coklat"
                            aria-expanded={isMenuOpen}
                            aria-haspopup="true"
                        >
                            <div className="h-8 w-8 rounded-full bg-white overflow-hidden flex items-center justify-center mr-1 border-2 border-white">
                                {user.profileImage ? (
                                    <img 
                                        src={user.profileImage} 
                                        alt="Profile" 
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <svg 
                                        xmlns="http://www.w3.org/2000/svg" 
                                        className="h-6 w-6 text-biru-dasar" 
                                        fill="none" 
                                        viewBox="0 0 24 24" 
                                        stroke="currentColor"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth="2" 
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" 
                                        />
                                    </svg>
                                )}
                            </div>
                            <svg 
                                xmlns="http://www.w3.org/2000/svg" 
                                className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor"
                            >
                                <path 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round" 
                                    strokeWidth="2" 
                                    d="M19 9l-7 7-7-7" 
                                />
                            </svg>
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                                {user.name && (
                                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                                        Hai, {user.name}
                                    </div>
                                )}
                                <Link 
                                    to="/profile" 
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Profil
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </li>
                </ul>
            </div>
        </nav>
    );
}