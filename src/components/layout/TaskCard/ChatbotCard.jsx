export default function ChatbotCard() {
    return (
        <div className="w-80 sm:w-96 bg-white rounded-[20px] shadow-md p-4 relative">
            <div className="flex h-32">

                {/* Gambar chatbot dengan position absolute */}
                <img
                src="/src/assets/MindaBot.png"
                alt="MindaBot"
                className="absolute left-[-1px] top-[50%] -translate-y-1/2 h-50 w-36 object-contain  "
                />

                {/* Area untuk konten chat di sebelah kanan */}
                <div className="xs:ml-30  sm:ml-32 h-full text-center">
                
                        <h2 className="sm:text-lg font-bold sm:mb-2 xs:mb-4 text-center">RoGrow</h2>
                        <p className="text-gray-600 text-xs sm:text-sm text-center sm:mb-4 xs:mb-6">Halo, saya RoGrow! Siap membantu belajar seru hari ini?</p>
                        <button className="bg-[#17A1FA] text-white text-[13px] p-1 rounded-3xl hover:bg-blue-700 text-center">
                            <a className="">Chat Now</a>
                        </button>
                </div>
            </div>
        </div>
    );
}