// GameContainer.jsx
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
            <div className="min-h-[500px] flex flex-col items-center justify-center">
                <div className="text-xl mb-4">Game tidak ditemukan</div>
                <Link 
                    to="/game" 
                    className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                >
                    Kembali ke Daftar Game
                </Link>
            </div>
        );
    }

    return (
        <div>
            <Link 
                to="/game" 
                className="inline-block m-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded"
            >
                ← Kembali
            </Link>
            <GameComponent />
        </div>
    );
}
