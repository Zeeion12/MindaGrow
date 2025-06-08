export default function Expcard({progress, level}) {
    return (
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-10 items-center p-4">
            <div className="bg-[#DCEEFF] rounded-full p-2 shadow-md w-25 h-25 border-2 border-[#3F8CF4] flex items-center justify-center">
                <div className="bg-white rounded-full w-18 h-18 border-2 border-[#3F8CF4] p-3 text-center">
                    <p className="text-4xl text-[#3F8CF4]">XP</p>
                </div>
            </div>
            <div className="w-full max-w-md">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold">Level Siswa</h2>
                    <span className="font-bold">Lv {level}</span>
                </div>
                <div className="h-3 w-full bg-gray-300 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1e40af] rounded-full" style={{ width: `${progress}%` }}></div>
                </div>   
            </div>     
        </div>
    )
}