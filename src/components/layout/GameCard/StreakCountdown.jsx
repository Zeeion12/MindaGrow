// src/components/layout/GameCard/StreakCountdown.jsx
import { useState, useEffect } from 'react';

export default function StreakCountdown({ secondsUntilReset, onClose }) {
    const [timeLeft, setTimeLeft] = useState(secondsUntilReset);

    useEffect(() => {
        setTimeLeft(secondsUntilReset);
    }, [secondsUntilReset]);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    onClose();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timeLeft, onClose]);

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    };

    if (timeLeft <= 0) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white p-4 shadow-lg animate-pulse">
            <div className="container mx-auto flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="text-2xl">⚠️</div>
                    <div>
                        <div className="font-bold text-lg">Streak Fire Hampir Mati!</div>
                        <div className="text-sm opacity-90">
                            Main 1 game sekarang untuk menjaga streak harian Anda
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    <div className="text-center">
                        <div className="text-2xl font-mono font-bold">
                            {formatTime(timeLeft)}
                        </div>
                        <div className="text-xs opacity-80">tersisa</div>
                    </div>
                    
                    <button 
                        onClick={onClose}
                        className="bg-red-700 hover:bg-red-800 px-3 py-1 rounded text-sm transition-colors"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}