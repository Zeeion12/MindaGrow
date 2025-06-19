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
  RiPhoneLine,
  RiVideoLine
} from 'react-icons/ri';

const ChatGuruPage = () => {
  const { user } = useAuth();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
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

        // Dummy data untuk anak
        const dummyChildren = [
          { id: 1, name: 'Muhamad Dimas', class: '5A', school: 'SD Negeri 1 Surakarta', image: '/api/placeholder/50/50' },
          { id: 2, name: 'Aisyah Putri', class: '3B', school: 'SD Negeri 1 Surakarta', image: '/api/placeholder/50/50' }
        ];

        setChildren(dummyChildren);

        // Set anak pertama sebagai default
        if (dummyChildren.length > 0) {
          setSelectedChild(dummyChildren[0]);

          // Dummy data untuk guru
          const dummyTeachers = [
            {
              id: 1,
              name: 'Ibu Indah Pertiwi',
              subject: 'Matematika',
              avatar: '/api/placeholder/50/50',
              lastOnline: 'Online',
              isOnline: true
            },
            {
              id: 2,
              name: 'Bapak Ahmad Jauhari',
              subject: 'Biologi',
              avatar: '/api/placeholder/50/50',
              lastOnline: '10 menit lalu',
              isOnline: false
            },
            {
              id: 3,
              name: 'Ibu Sri Wahyuni',
              subject: 'Fisika',
              avatar: '/api/placeholder/50/50',
              lastOnline: '30 menit lalu',
              isOnline: false
            },
            {
              id: 4,
              name: 'Bapak Darmawan',
              subject: 'Bahasa Indonesia',
              avatar: '/api/placeholder/50/50',
              lastOnline: '2 jam lalu',
              isOnline: false
            },
            {
              id: 5,
              name: 'Ibu Ratna Sari',
              subject: 'IPS',
              avatar: '/api/placeholder/50/50',
              lastOnline: '1 hari lalu',
              isOnline: false
            },
          ];

          setTeachers(dummyTeachers);
          setSelectedTeacher(dummyTeachers[0]);

          // Dummy conversations
          const dummyConversations = dummyTeachers.map(teacher => ({
            teacherId: teacher.id,
            unread: teacher.id === 2 ? 3 : 0,
            lastMessage: {
              content: teacher.id === 1
                ? 'Baik Bu, terima kasih atas informasinya.'
                : teacher.id === 2
                  ? 'Tugas praktikum akan dikumpulkan hari Jumat ya'
                  : teacher.id === 3
                    ? 'Dimas perlu lebih fokus pada materi Hukum Newton kedua'
                    : teacher.id === 4
                      ? 'Nilai puisinya sangat bagus, Dimas sangat kreatif'
                      : 'Iya Pak, terima kasih',
              time: teacher.id === 1
                ? '10:30'
                : teacher.id === 2
                  ? '09:15'
                  : teacher.id === 3
                    ? 'Kemarin'
                    : teacher.id === 4
                      ? 'Senin'
                      : '20/04',
              sender: teacher.id === 3 || teacher.id === 4 ? 'teacher' : 'parent'
            }
          }));

          setConversations(dummyConversations);

          // Dummy messages with the first teacher
          const dummyMessages = [
            {
              id: 1,
              senderId: 'teacher',
              senderName: 'Ibu Indah Pertiwi',
              content: 'Selamat pagi Bapak/Ibu, saya ingin memberitahu bahwa Dimas telah menunjukkan kemajuan yang sangat baik dalam pelajaran matematika.',
              time: '09:30',
              date: 'Hari ini',
              status: 'read'
            },
            {
              id: 2,
              senderId: 'parent',
              senderName: 'Anda',
              content: 'Selamat pagi Bu Indah, terima kasih atas informasinya. Dimas memang sering belajar matematika di rumah.',
              time: '09:45',
              date: 'Hari ini',
              status: 'read'
            },
            {
              id: 3,
              senderId: 'teacher',
              senderName: 'Ibu Indah Pertiwi',
              content: 'Iya, itu sangat baik. Nilai ujian matematikanya juga meningkat. Saya ingin memberitahu bahwa minggu depan akan ada ujian tentang persamaan kuadrat.',
              time: '10:00',
              date: 'Hari ini',
              status: 'read'
            },
            {
              id: 4,
              senderId: 'teacher',
              senderName: 'Ibu Indah Pertiwi',
              content: 'Tolong ingatkan Dimas untuk lebih fokus pada bagian menentukan faktor dan akar persamaan kuadrat ya.',
              time: '10:05',
              date: 'Hari ini',
              status: 'read'
            },
            {
              id: 5,
              senderId: 'parent',
              senderName: 'Anda',
              content: 'Baik Bu, terima kasih atas informasinya. Saya akan memastikan Dimas mempersiapkan diri dengan baik untuk ujian tersebut.',
              time: '10:30',
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

  useEffect(() => {
    // Scroll to bottom of message container whenever messages change
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleChildSelect = (child) => {
    setSelectedChild(child);
    // In a real implementation, we would reload teachers and conversations
  };

  const handleTeacherSelect = (teacher) => {
    setSelectedTeacher(teacher);

    // Mark conversation as read
    setConversations(conversations.map(conv =>
      conv.teacherId === teacher.id ? { ...conv, unread: 0 } : conv
    ));

    // Load messages for this teacher (would be an API call in real implementation)
    // For this demo, we're only showing messages for the first teacher
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (newMessage.trim() === '' && attachments.length === 0) return;

    const currentTime = new Date();
    const formattedTime = `${currentTime.getHours()}:${currentTime.getMinutes().toString().padStart(2, '0')}`;

    const newMsg = {
      id: messages.length + 1,
      senderId: 'parent',
      senderName: 'Anda',
      content: newMessage.trim(),
      attachments: [...attachments],
      time: formattedTime,
      date: 'Hari ini',
      status: 'sent'
    };

    setMessages([...messages, newMsg]);

    // Update last message in conversation
    setConversations(conversations.map(conv =>
      conv.teacherId === selectedTeacher.id
        ? {
          ...conv,
          lastMessage: {
            content: newMessage.length > 25 ? newMessage.substring(0, 25) + '...' : newMessage,
            time: formattedTime,
            sender: 'parent'
          }
        }
        : conv
    ));

    setNewMessage('');
    setAttachments([]);
  };

  const handleAttachmentAdd = () => {
    // In a real implementation, this would open a file picker
    // For this demo, we'll just add a dummy attachment
    const newAttachment = {
      id: Date.now(),
      name: 'Gambar_latihan_matematika.jpg',
      size: '2.4 MB',
      type: 'image'
    };

    setAttachments([...attachments, newAttachment]);
  };

  const handleAttachmentRemove = (id) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header title="Chat dengan Guru" />

      <div className="h-[calc(100vh-64px)] flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          {/* Pilihan Anak */}
          <div className="p-3 border-b border-gray-200">
            <div className="flex space-x-2">
              {children.map(child => (
                <div
                  key={child.id}
                  onClick={() => handleChildSelect(child)}
                  className={`flex items-center p-2 rounded-lg cursor-pointer transition-all flex-1
                    ${selectedChild?.id === child.id
                      ? 'bg-blue-100 ring-1 ring-blue-500'
                      : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 overflow-hidden">
                    <img src={child.image} alt={child.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="text-sm">
                    <p className="font-medium truncate">{child.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <RiSearch2Line className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari guru..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {filteredTeachers.map(teacher => {
              const conversation = conversations.find(c => c.teacherId === teacher.id);

              return (
                <div
                  key={teacher.id}
                  onClick={() => handleTeacherSelect(teacher)}
                  className={`p-3 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors
                    ${selectedTeacher?.id === teacher.id ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-start">
                    <div className="relative mr-3">
                      <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden">
                        <img src={teacher.avatar} alt={teacher.name} className="w-full h-full object-cover" />
                      </div>
                      {teacher.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-white"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium truncate">{teacher.name}</h3>
                        <span className="text-xs text-gray-500">{conversation?.lastMessage?.time}</span>
                      </div>

                      <p className="text-sm text-gray-500">{teacher.subject}</p>

                      <div className="flex justify-between items-center mt-1">
                        <p className="text-sm truncate text-gray-700">
                          {conversation?.lastMessage?.sender === 'parent' && 'Anda: '}
                          {conversation?.lastMessage?.content}
                        </p>

                        {conversation?.unread > 0 && (
                          <div className="bg-blue-500 text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTeachers.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                Tidak ditemukan guru yang sesuai dengan pencarian.
              </div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-100">
          {selectedTeacher ? (
            <>
              {/* Chat Header */}
              <div className="bg-white p-3 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-gray-300 mr-3 overflow-hidden">
                    <img src={selectedTeacher.avatar} alt={selectedTeacher.name} className="w-full h-full object-cover" />
                  </div>

                  <div>
                    <h3 className="font-medium">{selectedTeacher.name}</h3>
                    <div className="flex items-center text-xs">
                      <span className={`w-2 h-2 rounded-full mr-1 ${selectedTeacher.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      <span className="text-gray-500">
                        {selectedTeacher.isOnline ? 'Online' : selectedTeacher.lastOnline}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex">
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <RiPhoneLine size={20} className="text-gray-600" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-gray-100">
                    <RiVideoLine size={20} className="text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div
                className="flex-1 p-4 overflow-y-auto"
                ref={messageContainerRef}
              >
                {messages.map((message, idx) => {
                  const isParent = message.senderId === 'parent';
                  // Show date if it's the first message or if the date changes
                  const showDate = idx === 0 || messages[idx - 1].date !== message.date;

                  return (
                    <React.Fragment key={message.id}>
                      {showDate && (
                        <div className="flex justify-center my-3">
                          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">
                            {message.date}
                          </span>
                        </div>
                      )}

                      <div className={`mb-4 flex ${isParent ? 'justify-end' : 'justify-start'}`}>
                        {!isParent && (
                          <div className="w-8 h-8 rounded-full bg-gray-300 mr-2 self-end overflow-hidden">
                            <img src={selectedTeacher.avatar} alt={selectedTeacher.name} className="w-full h-full object-cover" />
                          </div>
                        )}

                        <div className={`max-w-[70%] ${isParent ? 'bg-blue-500 text-white' : 'bg-white'} p-3 rounded-lg shadow-sm`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className={`text-xs font-medium ${isParent ? 'text-blue-100' : 'text-gray-500'}`}>
                              {message.senderName}
                            </span>
                            <span className={`text-xs ${isParent ? 'text-blue-100' : 'text-gray-500'}`}>
                              {message.time}
                            </span>
                          </div>

                          <p className="whitespace-pre-wrap">{message.content}</p>

                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map(attachment => (
                                <div key={attachment.id} className={`flex items-center p-2 rounded ${isParent ? 'bg-blue-600' : 'bg-gray-100'}`}>
                                  {attachment.type === 'image'
                                    ? <RiImageLine className={isParent ? 'text-white' : 'text-blue-500'} />
                                    : <RiFileLine className={isParent ? 'text-white' : 'text-blue-500'} />}
                                  <span className={`ml-2 text-sm ${isParent ? 'text-white' : 'text-gray-700'}`}>{attachment.name}</span>
                                  <span className={`ml-1 text-xs ${isParent ? 'text-blue-200' : 'text-gray-500'}`}>({attachment.size})</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {isParent && (
                            <div className="flex justify-end mt-1">
                              <RiCheckDoubleLine className={`text-xs ${message.status === 'read' ? 'text-blue-100' : 'text-blue-200'}`} />
                            </div>
                          )}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Message Input */}
              <div className="bg-white p-3 border-t border-gray-200">
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map(attachment => (
                      <div key={attachment.id} className="bg-gray-100 rounded-md flex items-center p-1 pr-2">
                        {attachment.type === 'image'
                          ? <RiImageLine className="text-blue-500 mx-1" />
                          : <RiFileLine className="text-blue-500 mx-1" />}
                        <span className="text-xs text-gray-700 mr-1">{attachment.name}</span>
                        <button
                          onClick={() => handleAttachmentRemove(attachment.id)}
                          className="w-4 h-4 rounded-full bg-gray-300 flex items-center justify-center hover:bg-gray-400"
                        >
                          <RiCloseLine size={12} className="text-gray-700" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAttachmentAdd}
                    className="p-2 rounded-full hover:bg-gray-100"
                  >
                    <RiAttachment2 size={20} className="text-gray-600" />
                  </button>

                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />

                  <button
                    type="submit"
                    className={`p-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white ${newMessage.trim() === '' && attachments.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    disabled={newMessage.trim() === '' && attachments.length === 0}
                  >
                    <RiSendPlaneFill size={20} />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-gray-400 mb-2">
                <RiMessage3Line size={64} />
              </div>
              <p className="text-gray-500 text-lg">Pilih guru untuk memulai chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatGuruPage;