import { Link } from 'react-router-dom';
export default function Navibar () {
    return (
        <nav className="navbar fixed w-full bg-biru-dasar flex justify-between items-center font-poppins shadow-lg ">
            <div className="logoPort">
                <h1 className="text-emerald-50 text-2xl font-bold p-[15px]">MindaGrow</h1>
            </div>
            <div className="navButton font-poppins p-[15px] text-amber-50 font-medium">
                <ul className="flex space-x-5"> 
                    <li><Link to='/'>Home</Link></li>
                    <li><a href="#about" className="hover:text-coklat">About</a></li>
                    <li><a href="#services" className="hover:text-coklat">Services</a></li>
                    <li><a href="#contact" className="hover:text-coklat">Contact</a></li>
                </ul>
            </div>
        </nav>
    );
}