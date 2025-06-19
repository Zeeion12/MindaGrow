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
                            Halo, saya RoGrow! Siap membantu belajar seru hari ini? 🌱
                        </p>
                        <button
                            onClick={openPopup}
                            className="bg-gradient-to-r from-[#17A1FA] to-blue-600 text-white text-[13px] px-4 py-2 rounded-full hover:from-blue-600 hover:to-blue-700 transition-all duration-300 text-center shadow-md hover:shadow-lg transform hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            <span>Chat Now</span>
                            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Popup Modal */}
            {isPopupOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
                        onClick={closePopup}
                    ></div>

                    {/* Modal Content */}
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] mx-4 transform transition-all duration-300 scale-100 opacity-100 overflow-hidden">
                        <Chatbot onClose={closePopup} />
                    </div>
                </div>
            )}
        </>
    )
}
