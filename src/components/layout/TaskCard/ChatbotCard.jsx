"use client"

import { useState } from "react"
import MindaBot from "/src/assets/MindaBot.png"
import Chatbot from "../../../service/chatbot/Chatbot"

export default function ChatbotCard() {
    const [isPopupOpen, setIsPopupOpen] = useState(false)

    const openPopup = () => {
        setIsPopupOpen(true)
    }

    const closePopup = () => {
        setIsPopupOpen(false)
    }

    return (
        <>
            {/* Card Component */}
            <div className="w-80 sm:w-96 bg-white rounded-[20px] shadow-lg hover:shadow-xl transition-all duration-300 p-4 relative transform hover:scale-105 border border-gray-100">
                <div className="flex h-32">
                    <img
                        src={MindaBot || "/placeholder.svg"}
                        alt="MindaBot"
                        className="absolute left-[-1px] top-[50%] -translate-y-1/2 h-50 w-36 object-contain"
                    />
                    <div className="xs:ml-30 sm:ml-32 h-full text-center flex flex-col justify-center">
                        <h2 className="sm:text-lg font-bold sm:mb-2 xs:mb-4 text-center text-gray-800">RoGrow</h2>
                        <p className="text-gray-600 text-xs sm:text-sm text-center sm:mb-4 xs:mb-6 leading-relaxed">
                            Halo, saya RoGrow! Siap membantu belajar seru hari ini?
                        </p>
                        <button
                            onClick={openPopup}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-4 rounded-full transition-all duration-200 text-xs sm:text-sm shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                            🤖 Chat Dengan RoGrow
                        </button>
                    </div>
                </div>
            </div>

            {/* Chatbot Popup Modal */}
            {isPopupOpen && (
                <div className="fixed inset-0 z-50">
                    <Chatbot onClose={closePopup} />
                </div>
            )}
        </>
    )
}