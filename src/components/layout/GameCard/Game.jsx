import { Link } from 'react-router-dom';

export default function Game({ title, progress, image, gameId }) {
    return (
        <Link to={`/game/${gameId}`} className="block">
            <div className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-lg 
            transform transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl
            cursor-pointer group">
                <div className="relative h-48 w-full">
                    <div className="absolute inset-0 bg-black/30 z-10" />
                    <img
                        src={image || "https://via.placeholder.com/400x200"}
                        alt={title}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                    <div className="mb-2">
                        <h3 className="text-white text-xl font-bold">{title}</h3>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                        <div className="w-full mr-4">
                            <div className="w-full bg-gray-300 rounded-full h-2.5">
                                <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                            </div>
                        </div>
                        <span className="text-white text-lg font-bold whitespace-nowrap">{progress}%</span>
                    </div>
                </div>
            </div>
        </Link>
        
    )
}


