import FeaturedCard from "../components/layout/layoutParts/FeaturedCard"
import ReviewCard from "../components/layout/layoutParts/ReviewCard";

import { 
    LuUser, 
    LuBot,
    LuGamepad2
} from 'react-icons/lu';

// Replace the problematic LuLoaderPinwheel with a different icon
import { FaSpinner } from 'react-icons/fa';

const iconCard = [
    { title: "Personalized Learning", icon: LuUser, color: "bg-biru-dasar", description: "MindaGrow memberikan pengalaman belajar yang disesuaikan dengan kebutuhan dan gaya belajar setiap anak." },
    { title: "Interactive Learning", icon: FaSpinner, color: "bg-biru-dasar", description: "MindaGrow menggunakan metode pembelajaran interaktif yang membuat anak lebih terlibat dan termotivasi." },
    { title: "AI-Powered Chatbot", icon: LuBot, color: "bg-biru-dasar", description: "MindaGrow dilengkapi dengan chatbot berbasis AI yang siap membantu anak dalam menjawab pertanyaan dan memberikan penjelasan." },
    { title: "Gamification", icon: LuGamepad2, color: "bg-biru-dasar", description: "MindaGrow mengintegrasikan elemen permainan dalam proses belajar untuk meningkatkan minat dan motivasi anak." }
];

const reviewCard = [
    { title: "Ito", description: "MindaGrow adalah platform edukasi inovatif yang didedikasikan untuk membentuk masa depan anak-anak usia 5–12 tahun.", color: "bg-biru-dasar"},
    { title: "Dimas", description: "MindaGrow adalah platform yang bagus untuk membantu anak saya dengan minigame yang menarik", color: "bg-biru-dasar"},
    { title: "Selenia", description: "Dengan MindaGrow anak saya jadi suka belajar karena banyak minigames didalam platform ini", color: "bg-biru-dasar"},
    { title: "Alfonso", description: "Keren Anak Saya Suka", color: "bg-biru-dasar"}
];

export default function Landing() {
    return (
        <>
            {/* Section Hero */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:mt-20 xs:mt-20">
                <div className="flex flex-col md:flex-row items-center my-10 md:my-20 gap-8 md:gap-12 lg:gap-20">
                    <div className="w-full md:w-1/2 mt-10">
                        <h2 className="text-biru-dasar font-bold text-2xl sm:text-3xl lg:text-4xl mb-2.5">
                            Belajar Jadi Menyenangkan Dan Personal Dari Setiap Anak
                        </h2>
                        <p className="font-semibold text-base sm:text-lg mb-6 md:mb-10">
                            Platform edukasi berbasis AI & Gamifikasi untuk anak usia 5 - 12 tahun.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-3">
                            <button className="w-full sm:w-[150px] bg-gold-first text-white font-semibold p-2 rounded-[10px] hover:bg-biru-dasar duration-150">
                                Daftar Sekarang!
                            </button>
                            <button className="w-full sm:w-[150px] bg-gold-first text-white font-semibold p-2 rounded-[10px] hover:bg-biru-dasar duration-150">
                                Masuk
                            </button>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 mt-8 md:mt-0">
                        <img
                        src="/src/assets/landing-image.png"
                        className="w-full max-w-lg mx-auto md:max-w-2xl mt-20"
                        alt="Landing illustration"
                        />
                    </div>
                </div>
            </section>

            {/* Section Featured */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:mt-20 xs:mt-20">
                <div className="md:my-20">
                    <h1 className="text-biru-dasar font-bold text-5xl text-center mt-40">Fitur Unggulan</h1>
                    <p className="font-semibold text-base sm:text-lg text-center mb-6 md:mb-10 mt-7 italic">
                        MindaGrow memiliki fitur yang dapat membantu anak belajar dengan cara yang menyenangkan dan personal.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-10">
                        {iconCard.map((item, index) => (
                            <FeaturedCard
                                key={index}
                                icon={item.icon}
                                title={item.title}
                                description={item.description}
                                color={item.color}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Section About Us*/}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:mt-20 xs:mt-20">
                <h1 className="text-biru-dasar font-bold text-5xl text-center mt-40">Tentang Kami</h1>
                <div className="flex flex-col md:flex-row items-center my-10 md:my-20 gap-8 md:gap-12 lg:gap-20">
                    <div className="w-full md:w-1/2 mt-8 md:mt-0">
                        <img
                        src="/src/assets/About-Us.png"
                        className="w-100 max-w-lg mx-auto md:max-w-2xl"
                        alt="Landing illustration"
                        />
                    </div>
                    <div className="w-full md:w-1/2">
                        <p className="font-semibold text-base sm:text-lg mb-6 md:mb-10">
                        MindaGrow adalah platform edukasi inovatif yang didedikasikan untuk membentuk masa depan anak-anak usia 5–12 tahun. Kami percaya bahwa setiap anak memiliki potensi unik yang dapat berkembang maksimal melalui pendekatan belajar yang personal dan menyenangkan. Dengan memanfaatkan kecanggihan Artificial Intelligence dan konsep gamifikasi, kami menciptakan pengalaman belajar yang tidak hanya interaktif, tetapi juga mampu membangun rasa percaya diri dan semangat eksplorasi pada anak. 
                        </p>
                    </div>
                </div>
            </section>

            {/* Section Komen Orang Tua */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 sm:mt-20 xs:mt-20">
                <div className="md:my-20">
                    <h1 className="text-biru-dasar font-bold text-5xl text-center mt-30 mb-15">Review Pengguna</h1>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mt-10">
                        {reviewCard.map((item, index) => (
                            <ReviewCard
                                key={index}
                                title={item.title}
                                description={item.description}
                                color={item.color}
                            />
                        ))}
                    </div>
                </div>
            </section>
        </>
    )
}