import { useParams, Link } from 'react-router-dom';
import YesOrNoGame from './YesOrNoGame';
import PatternPuzzleGame from './PatternPuzzleGame';
import MazeChallengeGame from './MazeChallengeGame';

const gameComponents = {
    'yesorno': YesOrNoGame,
    'patternpuzzle': PatternPuzzleGame,
    'mazechallenge': MazeChallengeGame,
};

export default function GameContainer() {
    const { gameId } = useParams();
    const GameComponent = gameComponents[gameId];

    if (!GameComponent) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="text-6xl mb-6">🎮</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-4">Game Tidak Ditemukan</h1>
                        <p className="text-gray-600 mb-6">
                            Maaf, game yang Anda cari tidak tersedia atau mungkin sedang dalam pengembangan.
                        </p>
                        
                        <div className="space-y-3">
                            <Link 
                                to="/game" 
                                className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105"
                            >
                                ← Kembali ke Daftar Game
                            </Link>
                            <Link 
                                to="/dashboard" 
                                className="block w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200"
                            >
                                Ke Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Link 
                                to="/game" 
                                className="inline-flex items-center bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-all duration-200"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Kembali
                            </Link>
                            <div className="h-6 w-px bg-gray-300"></div>
                            <div>
                                <h1 className="text-lg font-bold text-gray-900">
                                    {gameId === 'yesorno' && 'Yes or No Challenge'}
                                    {gameId === 'patternpuzzle' && 'Pattern Puzzle Master'}
                                    {gameId === 'mazechallenge' && 'Maze Challenge Adventure'}
                                </h1>
                                <p className="text-sm text-gray-600">
                                    {gameId === 'yesorno' && 'Uji kemampuan logika dengan menjawab pernyataan benar atau salah'}
                                    {gameId === 'patternpuzzle' && 'Asah kemampuan analisis dengan menebak pola selanjutnya'}
                                    {gameId === 'mazechallenge' && 'Temukan jalan keluar dari labirin yang menantang'}
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                            <div className="hidden md:flex items-center space-x-3 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                                    Ready to Play
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Game Content */}
            <main>
                <GameComponent />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t">
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-600">
                        <div>
                            <p>&copy; 2024 MindaGrow. Game berjalan dalam mode standalone.</p>
                        </div>
                        <div className="flex items-center space-x-4 mt-2 md:mt-0">
                            <Link to="/game" className="hover:text-blue-600 transition-colors">
                                Game Lainnya
                            </Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}