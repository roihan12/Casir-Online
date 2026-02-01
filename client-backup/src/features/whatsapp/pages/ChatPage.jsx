import React, { useState } from 'react';
import { FaSearch, FaPaperclip, FaSmile, FaMicrophone, FaEllipsisV, FaCheck, FaCheckDouble, FaPhone, FaVideo } from 'react-icons/fa';

// Mock Data
const chats = [
  { id: 1, name: 'Budi Santoso', lastMessage: 'Apakah barang ready gan?', time: '10:30', unread: 2, avatar: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=random' },
  { id: 2, name: 'Siti Aminah', lastMessage: 'Terima kasih, sudah sampai.', time: '09:15', unread: 0, avatar: 'https://ui-avatars.com/api/?name=Siti+Aminah&background=random' },
  { id: 3, name: 'Gunawan', lastMessage: 'Bisa kirim hari ini?', time: 'Yesterday', unread: 0, avatar: 'https://ui-avatars.com/api/?name=Gunawan&background=random' },
  { id: 4, name: 'Rina Wati', lastMessage: 'Transfer sudah masuk ya kak', time: 'Yesterday', unread: 5, avatar: 'https://ui-avatars.com/api/?name=Rina+Wati&background=random' },
  { id: 5, name: 'Ahmad Dani', lastMessage: 'oke siap', time: 'Mon', unread: 0, avatar: 'https://ui-avatars.com/api/?name=Ahmad+Dani&background=random' },
];

const messages = [
  { id: 1, text: 'Halo, selamat pagi kak', sender: 'me', time: '10:00' },
  { id: 2, text: 'Pagi kak, ada yang bisa dibantu?', sender: 'them', time: '10:05' },
  { id: 3, text: 'Saya mau tanya stok sepatu nike ukuran 42 ada?', sender: 'me', time: '10:10' },
  { id: 4, text: 'Sebentar saya cek dulu ya kak', sender: 'them', time: '10:11' },
  { id: 5, text: 'Masih ada kak, sisa 2 pasang. Mau diorder sekalian?', sender: 'them', time: '10:15' },
  { id: 6, text: 'Boleh kak, saya ambil satu ya. Pembayaran via transfer bisa?', sender: 'me', time: '10:20' },
  { id: 7, text: 'Bisa banget kak, silakan transfer ke rek BCA 1234567890 an Casir Online ya', sender: 'them', time: '10:22' },
];

const ChatPage = () => {
  const [selectedChat, setSelectedChat] = useState(chats[0]);
  const [messageInput, setMessageInput] = useState('');

  return (
    <div className="flex h-[calc(100vh-2rem)] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Sidebar - Chat List */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50">
        {/* Header Sidebar */}
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
               <span className="font-bold">ME</span>
             </div>
             <h2 className="font-semibold text-gray-800">My Chats</h2>
          </div>
          <div className="flex gap-2 text-gray-500">
            <button className="p-2 hover:bg-gray-100 rounded-full"><FaEllipsisV /></button>
          </div>
        </div>
        
        {/* Search */}
        <div className="p-3 bg-white border-b border-gray-100">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Cari atau mulai chat baru" 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <div 
              key={chat.id} 
              onClick={() => setSelectedChat(chat)}
              className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-100 ${selectedChat?.id === chat.id ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
            >
              <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full object-cover border border-gray-200" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">{chat.name}</h3>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{chat.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600 truncate">{chat.lastMessage}</p>
                  {chat.unread > 0 && (
                    <span className="ml-2 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.2rem] text-center">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#efeae2] relative">
         {/* Detail Background Pattern */}
         <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

        {/* Chat Header */}
        <div className="p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
            <img src={selectedChat?.avatar} alt={selectedChat?.name} className="w-10 h-10 rounded-full object-cover cursor-pointer" />
            <div className="cursor-pointer">
              <h3 className="font-semibold text-gray-900">{selectedChat?.name}</h3>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-gray-600">
             <button className="p-2 hover:bg-gray-100 rounded-full"><FaSearch /></button>
             <button className="p-2 hover:bg-gray-100 rounded-full"><FaPhone /></button>
             <button className="p-2 hover:bg-gray-100 rounded-full"><FaVideo /></button>
             <button className="p-2 hover:bg-gray-100 rounded-full"><FaEllipsisV /></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 scrollbar-thin scrollbar-thumb-gray-300">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[70%] rounded-lg px-4 py-2 relative shadow-md ${
                  msg.sender === 'me' 
                    ? 'bg-[#d9fdd3] text-gray-800 rounded-tr-none' 
                    : 'bg-white text-gray-800 rounded-tl-none'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-[10px] text-gray-500">{msg.time}</span>
                  {msg.sender === 'me' && <FaCheckDouble className="text-blue-500 text-[10px]" />}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 z-10">
          <div className="flex items-center gap-2">
            <button className="text-gray-500 hover:text-gray-700 p-2"><FaSmile size={24} /></button>
            <button className="text-gray-500 hover:text-gray-700 p-2"><FaPaperclip size={20} /></button>
            <div className="flex-1 relative">
                <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Ketik pesan..."
                    className="w-full px-4 py-3 bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                />
            </div>
            {messageInput.trim() ? (
               <button className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 transition shadow-md">
                   <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" className=""><path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
               </button>
            ) : (
                <button className="text-gray-500 hover:text-gray-700 p-2"><FaMicrophone size={24} /></button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
