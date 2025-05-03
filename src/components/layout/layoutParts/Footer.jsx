import { 
    SiFacebook, 
    SiX, 
    SiInstagram, 
    SiYoutube
} from 'react-icons/si';

const socialMedia = [
    { name: "Facebook", icon: SiFacebook, url: "https://facebook.com", color: "hover:bg-[#1877F2]", brandColor: "#1877F2" },
    { name: "Twitter", icon: SiX, url: "https://twitter.com", color: "hover:bg-[#000000]", brandColor: "#000000" },
    { name: "Instagram", icon: SiInstagram, url: "https://instagram.com", color: "hover:bg-[#E4405F]", brandColor: "#E4405F" },
    { name: "YouTube", icon: SiYoutube, url: "https://youtube.com", color: "hover:bg-[#FF0000]", brandColor: "#FF0000" },
];

export default function Footer () {
    return(
        <footer className="bg-biru-tua px-4 md:px-16 lg:px-28 py-8 mt-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                    <h2 className="text-lg font-bold mb-3 text-white">PT MANUT WAE</h2>
                    <p className="text-white">Jl. Kaliurang KM 14.5, Ngaglik</p>
                    <p className="text-white">Sleman, Yogyakarta 12344</p>
                </div>
                <div>
                    <h2 className="text-lg font-bold mb-3 text-white">Cerita</h2>
                    <ul>
                        <li><a className="text-white hover:underline cursor-pointer">Tentang Kami</a></li>
                        <li><a className="text-white hover:underline cursor-pointer">FAQ's</a></li>
                        <li><a className="text-white hover:underline cursor-pointer">Kontak</a></li>
                        <li><a className="text-white hover:underline cursor-pointer">Blok atau Artikel</a></li>
                        <li><a className="text-white hover:underline cursor-pointer">Kebijakan Privasi</a></li>
                        <li><a className="text-white hover:underline cursor-pointer">Syarat dan Ketentuan</a></li>
                    </ul>
                </div>
                <div>
                    <h2 className="text-lg font-bold mb-4 text-white">Follow Kami</h2>
                    <div className="flex space-x-3">
                        {socialMedia.map((social) => (
                            <a 
                                key={social.name}
                                href={social.url}
                                target="_blank"
                                className={`
                                    w-10 h-10 rounded-full bg-white 
                                    flex items-center justify-center 
                                    border border-gray-200 
                                    transition-all duration-300 
                                    ${social.color} hover:text-white
                                    hover:border-transparent hover:shadow-lg
                                `}
                                aria-label={social.name}
                            >
                                <social.icon size={18} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
            <div className='border-t border-amber-50 pt-6 mt-6'>
                <p className="text-center text-white text-sm">
                    &copy; 2023 PT Manut Wae. All rights reserved.
                </p>
            </div>
        </footer>
    );
}