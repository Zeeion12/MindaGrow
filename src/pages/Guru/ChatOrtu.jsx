import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/authContext';
import Header from '../../components/layout/layoutParts/Header';
import {
    RiSendPlaneFill,
    RiAttachment2,
    RiImageLine,
    RiFileLine,
    RiCloseLine,
    RiCheckDoubleLine,
    RiTimeLine,
    RiSearch2Line,
    RiMessage3Line,
    RiPhoneLine,
    RiVideoLine,
    RiUserLine,
} from 'react-icons/ri';

const ChatOrtuPage = () => {
    const { user } = useAuth();
    const [classes, setClasses] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [parents, setParents] = useState([]);
    const [selectedParent, setSelectedParent] = useState(null);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [attachments, setAttachments] = useState([]);

    const messageContainerRef = useRef(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);

                // Dummy data untuk kelas
                const dummyClasses = [
                    { id: 1, name: '5A', totalStudents: 25 },
                    { id: 2, name: '5B', totalStudents: 28 },
                    { id: 3, name: '6A', totalStudents: 30 }
                ];

                setClasses(dummyClasses);

                // Set kelas pertama sebagai default
                if (dummyClasses.length > 0) {
                    setSelectedClass(dummyClasses[0]);

                    // Dummy data untuk orang tua
                    const dummyParents = [
                        {
                            id: 1,
                            name: 'Bapak Ahmad',
                            childName: 'Dimas Ahmad',
                            avatar: '/api/placeholder/50/50',
                            lastOnline: 'Online',
                            isOnline: true
                        },
                        {
                            id: 2,
                            name: 'Ibu Sari',
                            childName: 'Putri Sari',
                            avatar: '/api/placeholder/50/50',
                            lastOnline: '5 menit lalu',
                            isOnline: false
                        },
                        {
                            id: 3,
                            name: 'Bapak Rudi',
                            childName: 'Budi Santoso',
                            avatar: '/api/placeholder/50/50',
                            lastOnline: '1 jam lalu',
                            isOnline: false
                        },
                        {
                            id: 4,
                            name: 'Ibu Diana',
                            childName: 'Anita Diana',
                            avatar: '/api/placeholder/50/50',
                            lastOnline: '3 jam lalu',
                            isOnline: false
                        }
                    ];

                    setParents(dummyParents);
                    setSelectedParent(dummyParents[0]);

                    // Dummy conversations
                    const dummyConversations = dummyParents.map(parent => ({
                        parentId: parent.id,
                        unread: parent.id === 2 ? 2 : 0,
                        lastMessage: {
                            content: getDummyLastMessage(parent.id),
                            time: getDummyTime(parent.id),
                            sender: parent.id === 1 ? 'teacher' : 'parent'
                        }
                    }));

                    setConversations(dummyConversations);

                    // Dummy messages
                    const dummyMessages = [
                        {
                            id: 1,
                            senderId: 'teacher',
                            senderName: 'Anda',
                            content: 'Selamat pagi Bapak Ahmad, saya ingin memberitahu bahwa Dimas menunjukkan kemajuan yang baik dalam pelajaran matematika minggu ini.',
                            time: '09:30',
                            date: 'Hari ini',
                            status: 'read'
                        },
                        {
                            id: 2,
                            senderId: 'parent',
                            senderName: 'Bapak Ahmad',
                            content: 'Selamat pagi Bu, terima kasih atas informasinya. Dimas memang rajin belajar di rumah.',
                            time: '09:45',
                            date: 'Hari ini',
                            status: 'read'
                        },
                        {
                            id: 3,
                            senderId: 'teacher',
                            senderName: 'Anda',
                            content: 'Minggu depan akan ada ujian matematika tentang perkalian dan pembagian pecahan.',
                            time: '10:00',
                            date: 'Hari ini',
                            status: 'read'
                        },
                        {
                            id: 4,
                            senderId: 'parent',
                            senderName: 'Bapak Ahmad',
                            content: 'Baik Bu, saya akan membantu Dimas mempersiapkan diri untuk ujian tersebut.',
                            time: '10:15',
                            date: 'Hari ini',
                            status: 'read'
                        }
                    ];

                    setMessages(dummyMessages);
                }

                setLoading(false);
            } catch (error) {
                console.error('Error fetching data:', error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Helper functions for dummy data
    const getDummyLastMessage = (parentId) => {
        const messages = {
            1: 'Baik Bu, terima kasih informasinya',
            2: 'Bu, Putri izin tidak masuk hari ini karena sakit',
            3: 'Kapan ujian matematika dilaksanakan?',
            4: 'Terima kasih atas bimbingannya, Bu'
        };
        return messages[parentId] || 'Tidak ada pesan';
    };

    const getDummyTime = (parentId) => {
        const times = {
            1: '10:30',
            2: '09:15',
            3: 'Kemarin',
            4: 'Senin'
        };
        return times[parentId] || '';
    };

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Handler functions
    const handleClassSelect = (classData) => {
        setSelectedClass(classData);
        // In a real implementation, we would reload parents and conversations
    };

    const handleParentSelect = (parent) => {
        setSelectedParent(parent);
        setConversations(conversations.map(conv =>
            conv.parentId === parent.id ? { ...conv, unread: 0 } : conv
        ));
    };

    const handleSendMessage = (e) => {
        e.preventDefault();

        if (newMessage.trim() === '' && attachments.length === 0) return;

        const currentTime = new Date();
        const formattedTime = `${currentTime.getHours()}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

        const newMsg = {
            id: messages.length + 1,
            senderId: 'teacher',
            senderName: 'Anda',
            content: newMessage.trim(),
            attachments: [...attachments],
            time: formattedTime,
            date: 'Hari ini',
            status: 'sent'
        };

        setMessages([...messages, newMsg]);
        setConversations(conversations.map(conv =>
            conv.parentId === selectedParent.id
                ? {
                    ...conv,
                    lastMessage: {
                        content: newMessage.length > 25 ? newMessage.substring(0, 25) + '...' : newMessage,
                        time: formattedTime,
                        sender: 'teacher'
                    }
                }
                : conv
        ));

        setNewMessage('');
        setAttachments([]);
    };

    return (
        <div className="flex flex-col h-screen">
            <Header />

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar Kiri - Daftar Kelas */}
                <div className="w-1/4 bg-white border-r overflow-y-auto">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold">Daftar Kelas</h2>
                    </div>
                    <div className="p-4">
                        {loading ? (
                            <p>Loading classes...</p>
                        ) : (
                            <ul>
                                {classes.map((classData) => (
                                    <li
                                        key={classData.id}
                                        onClick={() => handleClassSelect(classData)}
                                        className={`cursor-pointer p-2 rounded-lg transition-all flex items-center ${selectedClass && selectedClass.id === classData.id
                                            ? 'bg-blue-500 text-white'
                                            : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        <RiUserLine className="mr-2" />
                                        {classData.name} ({classData.totalStudents})
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Sidebar Tengah - Daftar Orang Tua */}
                <div className="w-1/4 bg-gray-50 border-r overflow-y-auto">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-semibold">Daftar Orang Tua</h2>
                    </div>
                    <div className="p-4">
                        {loading ? (
                            <p>Loading parents...</p>
                        ) : (
                            <ul>
                                {parents.map((parent) => (
                                    <li
                                        key={parent.id}
                                        onClick={() => handleParentSelect(parent)}
                                        className={`cursor-pointer p-2 rounded-lg transition-all flex items-center ${selectedParent && selectedParent.id === parent.id
                                            ? 'bg-blue-500 text-white'
                                            : 'hover:bg-gray-100'
                                            }`}
                                    >
                                        <img
                                            src={parent.avatar}
                                            alt={parent.name}
                                            className="w-10 h-10 rounded-full mr-3"
                                        />
                                        <div className="flex-1">
                                            <div className="font-semibold">{parent.name}</div>
                                            <div className="text-sm text-gray-500">{parent.childName}</div>
                                        </div>
                                        {parent.isOnline ? (
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        ) : (
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Konten Utama - Chat */}
                <div className="flex-1 bg-white p-4 flex flex-col">
                    {/* Header Chat */}
                    <div className="flex items-center justify-between p-4 bg-blue-500 text-white rounded-lg">
                        <div className="flex items-center">
                            <img
                                src={selectedParent?.avatar}
                                alt={selectedParent?.name}
                                className="w-12 h-12 rounded-full mr-3"
                            />
                            <div>
                                <div className="font-semibold">{selectedParent?.name}</div>
                                <div className="text-sm">{selectedParent?.childName}</div>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <div className="text-xs bg-white text-blue-500 rounded-full px-3 py-1 mr-2">
                                {selectedParent?.isOnline ? 'Online' : 'Offline'}
                            </div>
                            <RiPhoneLine className="text-white mr-3 cursor-pointer" size={20} />
                            <RiVideoLine className="text-white mr-3 cursor-pointer" size={20} />
                            <RiMessage3Line className="text-white cursor-pointer" size={20} />
                        </div>
                    </div>

                    {/* Konten Pesan */}
                    <div
                        ref={messageContainerRef}
                        className="flex-1 overflow-y-auto p-4 border-b"
                    >
                        {loading ? (
                            <p>Loading messages...</p>
                        ) : (
                            <div>
                                {messages.length === 0 ? (
                                    <p>Tidak ada pesan. Kirim pesan pertama Anda!</p>
                                ) : (
                                    <ul className="space-y-4">
                                        {messages.map((message) => (
                                            <li
                                                key={message.id}
                                                className={`flex ${message.senderId === 'teacher'
                                                    ? 'justify-end'
                                                    : 'justify-start'
                                                    }`}
                                            >
                                                <div
                                                    className={`max-w-xs p-3 rounded-lg ${message.senderId === 'teacher'
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    <div className="font-semibold text-sm mb-1">
                                                        {message.senderName}
                                                    </div>
                                                    <div className="text-base">{message.content}</div>
                                                    {message.attachments && message.attachments.length > 0 && (
                                                        <div className="mt-2">
                                                            {message.attachments.map((attachment, index) => (
                                                                <a
                                                                    key={index}
                                                                    href={attachment}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-block bg-gray-200 text-gray-800 rounded-lg px-3 py-1 text-sm mr-2"
                                                                >
                                                                    Lihat Lampiran {index + 1}
                                                                </a>
                                                            ))}
                                                        </div>
                                                    )}
                                                    <div className="text-xs text-gray-500 mt-2">
                                                        {message.time} - {message.date}
                                                    </div>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Input Pesan */}
                    <div className="p-4 bg-gray-50 border-t">
                        <form onSubmit={handleSendMessage} className="flex">
                            <textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 p-3 rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                                rows="1"
                                placeholder="Ketik pesan Anda..."
                            ></textarea>
                            <div className="flex items-center ml-2">
                                <label className="flex items-center cursor-pointer">
                                    <RiAttachment2 className="text-gray-500 mr-2" size={20} />
                                    <input
                                        type="file"
                                        multiple
                                        onChange={(e) => {
                                            const files = Array.from(e.target.files);
                                            setAttachments(files.map(file => URL.createObjectURL(file)));
                                        }}
                                        className="hidden"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    className="bg-blue-500 text-white rounded-lg px-4 py-2 ml-2 flex items-center"
                                >
                                    <RiSendPlaneFill className="mr-2" />
                                    Kirim
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatOrtuPage;