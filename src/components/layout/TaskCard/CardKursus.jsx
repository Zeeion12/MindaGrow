export default function CardKursus({title, subject }) {
    return (
        <div className="w-80 sm:w-75 bg-white rounded-xl shadow-md p-4">
            <h2 className="text-2xl sm:text-lg font-bold mb-20">{title}</h2>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                <div>
                    <h3 className="text-[14px] sm:text-[16px] font-bold">Tipe</h3>
                    <p className="text-gray-600 text-xs sm:text-sm">{subject}</p>
                </div>
                <button className="bg-[#646464] text-white font-medium text-center p-1 rounded w-full sm:w-[100px] hover:bg-[#545454]">Cek</button>
            </div>
        </div>
    );
}