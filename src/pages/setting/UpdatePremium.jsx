// Import gambar
import PremiumImage2 from "../../assets/PremiumImage/PremiumIMG2.png";
import PremiumImage3 from "../../assets/PremiumImage/PremiumIMG3.png";



export default function UpdatePremium() {
    return (
        <div className="min-h-screen ">
            {/* Header Section */}
            <div className="px-4 py-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-yellow-100 p-3 rounded-full mr-4">
                            <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
                            💸 Upgrade akunmu dan nikmati fitur premium tanpa batas!
                        </h1>
                    </div>

                    {/* MindGrow Pro Branding */}
                    <div className="text-center mb-8">
                        <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold text-gray-800">
                            MindGrow <span className="text-yellow-500">Pro</span>
                        </h2>
                    </div>
                </div>
            </div>

            {/* Pricing Cards Section */}
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid md:grid-cols-3 gap-8 relative">
                    {/* Decorative Images - Ganti Image menjadi img */}
                    <div className="absolute -top-20 -left-10 hidden lg:block">
                        <img
                            src={PremiumImage2}
                            alt="Book illustration"
                            width={120}
                            height={120}
                            className="transform rotate-12"
                        />
                    </div>

                    <div className="absolute -top-10 -right-10 hidden lg:block">
                        <img
                            src={PremiumImage3}
                            alt="Chat bubbles"
                            width={100}
                            height={100}
                        />
                    </div>

                    {/* Pro+ Plan */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-green-200 transition-all duration-300">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 mb-2">Untuk 1 siswa</p>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">
                                MindaGrow <span className="text-yellow-500">Pro+</span>
                            </h3>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700">Akses semua materi pembelajaran</span>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700">Konsultasi materi dengan chatbot (kuota terbatas)</span>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-500">Akses penuh ke semua game edukasi</span>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700">Ikut pada game tak terbatas</span>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-gray-300 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-500">Laporan perkembangan otomatis</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800 mb-4">Rp25.000/bulan</p>
                            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                                Langganan paket ini
                            </button>
                        </div>
                    </div>

                    {/* Super Plan */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-green-200 hover:border-green-300 transition-all duration-300 transform scale-105">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 mb-2">Untuk 1 siswa</p>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">
                                MindaGrow <span className="text-green-500">Super</span>
                            </h3>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700">Semua fitur Pro+</span>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700">Konsultasi chatbot tanpa batas</span>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700">Harga hemat (hemat 16% dari langganan bulanan)</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800 mb-4">Rp210.000/tahun</p>
                            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                                Langganan paket ini
                            </button>
                        </div>
                    </div>

                    {/* Family Plan */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-100 hover:border-green-200 transition-all duration-300">
                        <div className="text-center mb-6">
                            <p className="text-sm text-gray-500 mb-2">Untuk 1 siswa dan 1 orangtua</p>
                            <h3 className="text-2xl font-bold text-gray-800 mb-4">
                                MindaGrow <span className="text-blue-500">Family</span>
                            </h3>
                        </div>

                        <div className="space-y-3 mb-8">
                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700">Semua fitur Pro+</span>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700">Fitur review & rekomendasi dari orang tua</span>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700">Notifikasi perkembangan anak</span>
                            </div>

                            <div className="flex items-start space-x-3">
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                </div>
                                <span className="text-sm text-gray-700">Orang tua bisa pantau progress anak</span>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-2xl font-bold text-gray-800 mb-4">Rp345.000/bulan</p>
                            <button className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
                                Langganan paket ini
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
