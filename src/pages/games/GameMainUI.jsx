import Dailymission from '../../components/layout/GameCard/Dailymission';
import Expcard from '../../components/layout/GameCard/Expcard';
import Game from '../../components/layout/GameCard/Game';
import Scoreboard from '../../components/layout/GameCard/Scoreboard';

import game1Image from '../../assets/GameImage/Game1.png'
import game2Image from '../../assets/GameImage/Game2.png'
import game3Image from '../../assets/GameImage/Game3.png'

// Data Dummy Buat Tampilan card gamenya
const gameData = [
    {
        id: 1,
        title: "Tebak Pola (Pattern Puzzle)",
        progress: "25",
        image: game1Image,
    },
    {
        id: 2,
        title: "Yes or No",
        progress: "20",
        image: game2Image,
    },
    {
        id: 3,
        title: "Maze Challenge",
        progress: "35",
        image: game3Image,
    },
    
]

export default function GameMainUI () {
    return (
        <div className="h-screen flex flex-col ">
            <main className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="bg-blue-100 rounded-lg p-6 mb-8">
                    <div className="flex flex-col md:flex-row items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">
                                🧠 Asah logikamu lewat permainan seru dan menantang!
                            </h1>
                        </div>
                    </div>
                </div>


                {/* Content */}
                <div>
                    <h2 className='text-xl font-poppins font-semibold mb-4'>Lanjutkan Progress Game-mu!</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gameData.map((game) => (
                            <Game
                                key={game.id}
                                title={game.title}
                                subject={game.subject}
                                progress={game.progress}
                                image={game.image}
                            />
                        ))}
                    </div>
                </div>

                {/* EXP & Daily Mission*/}
                <div className='mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6'>
                    <div className='lg:col-span-2 space-y-6'>
                        <Expcard progress={75} level={5} />
                        <Dailymission />
                    </div>
                    <div className='lg:col-span-1'>
                        <Scoreboard />
                    </div>
                </div>

            </main>
        </div>
    )
}