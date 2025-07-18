// src/components/layout/GameCard/StreakCountdown.jsx
import { useState, useEffect } from 'react';

export default function StreakCountdown({ 
    secondsUntilReset, 
    onClose, 
    currentStreak = 0, 
    isActive = false,
    showAlert = false 
}) {
    const [timeLeft, setTimeLeft] = useState(secondsUntilReset);
    const [isVisible, setIsVisible] = useState(showAlert);

    useEffect(() => {
        setTimeLeft(secondsUntilReset);
    }, [secondsUntilReset]);

    useEffect(() => {
        setIsVisible(showAlert);
    }, [showAlert]);

    useEffect(() => {
        if (timeLeft <= 0) return;

        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (onClose) onClose();
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

    const getAlertType = () => {
        if (isActive) return 'success';
        if (currentStreak > 0 && !isActive) return 'warning';
        return 'danger';
    };

    const getAlertConfig = () => {
        const alertType = getAlertType();
        
        switch (alertType) {
            case 'success':
                return {
                    bgColor: 'bg-green-600',
                    icon: '🔥',
                    title: 'Streak Aktif!',
                    message: 'Kamu sudah bermain hari ini. Streak tetap terjaga!',
                    buttonColor: 'bg-green-700 hover:bg-green-800'
                };
            case 'warning':
                return {
                    bgColor: 'bg-orange-500',
                    icon: '⚠️',
                    title: 'Streak Belum Aktif!',
                    message: 'Main 1 game sekarang untuk mengaktifkan streak hari ini',
                    buttonColor: 'bg-orange-600 hover:bg-orange-700'
                };
            default:
                return {
                    bgColor: 'bg-red-600',
                    icon: '🚨',
                    title: 'Streak Hampir Hilang!',
                    message: 'Main sekarang atau streak kamu akan reset ke 0!',
                    buttonColor: 'bg-red-700 hover:bg-red-800'
                };
        }
    };

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) onClose();
    };

    if (timeLeft <= 0 || !isVisible) return null;

    const alertConfig = getAlertConfig();

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose}></div>
            
            {/* Alert Bar */}
            <div className={`fixed top-0 left-0 right-0 z-50 ${alertConfig.bgColor} text-white p-4 shadow-lg animate-slide-down`}>
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="text-3xl animate-pulse">
                            {alertConfig.icon}
                        </div>
                        <div>
                            <div className="font-bold text-lg">
                                {alertConfig.title}
                            </div>
                            <div className="text-sm opacity-90">
                                {alertConfig.message}
                            </div>
                            {currentStreak > 0 && (
                                <div className="text-xs opacity-80 mt-1">
                                    Current streak: {currentStreak} hari
                                </div>
                            )}
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
                            onClick={handleClose}
                            className={`${alertConfig.buttonColor} px-3 py-1 rounded text-sm transition-colors`}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Countdown Widget */}
            <div className="fixed bottom-4 right-4 z-50">
                <div className={`${alertConfig.bgColor} text-white rounded-full p-4 shadow-lg animate-bounce`}>
                    <div className="text-center">
                        <div className="text-lg font-bold">
                            {alertConfig.icon}
                        </div>
                        <div className="text-xs font-mono">
                            {formatTime(timeLeft)}
                        </div>
                        {currentStreak > 0 && (
                            <div className="text-xs">
                                {currentStreak}🔥
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// Additional CSS classes (add to your global CSS or Tailwind config)
/*
@keyframes slide-down {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
*/