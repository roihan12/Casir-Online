import React, { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWhatsappChats, useWhatsappMessages, useWhatsappSendMessage, useWhatsappStatus } from '../hooks/useWhatsapp';
import { useCustomerSearch } from '../../../common/hooks/usePosQueries';
import socket from '../../../common/services/socketService';
import { FaSearch, FaPaperclip, FaSmile, FaMicrophone, FaEllipsisV, FaCheck, FaCheckDouble, FaPhone, FaVideo, FaPlus, FaTimes } from 'react-icons/fa';

const ChatPage = () => {
  const queryClient = useQueryClient();
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch chats
  const { data: contacts = [], isLoading: isLoadingChats, refetch: refetchChats } = useWhatsappChats({ limit: 50 });

  // Customer search for new chat
  const { data: customers = [], isLoading: isLoadingCustomers } = useCustomerSearch(customerSearchQuery, null, {
      enabled: customerSearchQuery.length > 2
  });

  // Fetch messages for selected chat
  const { data: messages = [], isLoading: isLoadingMessages, refetch: refetchMessages } = useWhatsappMessages(selectedChat?.jid, { limit: 50 });

  // Send message mutation
  const sendMessageMutation = useWhatsappSendMessage();


  // Socket listener for real-time messages
  useEffect(() => {
    const handleWhatsAppMessage = (event) => {
      if (event.type === 'message' && event.data) {
        const msgData = event.data;

        // Create normalized helper
        const normalizeJid = (jid) => jid ? jid.replace('@s.whatsapp.net', '') : '';
        const selectedJid = normalizeJid(selectedChat?.jid);
        const msgChatId = normalizeJid(msgData.chat_id || msgData.key?.remoteJid);
        
        // If message belongs to current chat, update the React Query cache
        if (selectedJid && msgChatId === selectedJid) {
          const isFromMe = msgData.from_me || msgData.key?.fromMe || false;
          
          const newMessage = {
            id: msgData.id || msgData.key?.id,
            text: msgData.body || msgData.message?.conversation || msgData.message?.extendedTextMessage?.text || 'Media Message',
            sender: isFromMe ? 'me' : 'other', 
            time: new Date(msgData.timestamp * 1000 || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            timestamp: (msgData.timestamp * 1000) || Date.now(),
            status: 'sent',
            fromMe: isFromMe,
            ...msgData
          };

          // Update cache
          queryClient.setQueryData(['whatsapp-messages', selectedChat.jid], (oldData) => {
            if (!oldData) return [newMessage];
            // Prevent duplicate message by ID
            if (oldData.some(msg => msg.id === newMessage.id)) return oldData;
            return [...oldData, newMessage];
          });
          
          // Scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }

        // Always refresh chat list for last message preview
        refetchChats();
      }
    };

    socket.on('whatsapp_message', handleWhatsAppMessage);

    return () => {
      socket.off('whatsapp_message', handleWhatsAppMessage);
    };
  }, [selectedChat, refetchChats, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;

    const currentInput = messageInput;
    const tempId = `temp-${Date.now()}`;
    
    // Optimistically add message to cache
    const optimisticMessage = {
      id: tempId,
      text: currentInput,
      sender: 'me',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      timestamp: Date.now(),
      status: 'sending',
      fromMe: true
    };

    queryClient.setQueryData(['whatsapp-messages', selectedChat.jid], (oldData) => {
      return [...(oldData || []), optimisticMessage];
    });
    
    setMessageInput(''); // Clear input immediately
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    sendMessageMutation.mutate({
        chatJid: selectedChat.jid,
        message: currentInput
    }, {
        onSuccess: (data) => {
            // Update the optimistic message with actual data and sending status -> sent
            queryClient.setQueryData(['whatsapp-messages', selectedChat.jid], (oldData) => {
               if (!oldData) return [];
               return oldData.map(msg => msg.id === tempId ? { ...msg, ...data, status: 'sent', id: data?.messageId || data?.id || tempId } : msg);
            });
            refetchChats();
        },
        onError: () => {
            // Revert cache by removing the optimistic message
            queryClient.setQueryData(['whatsapp-messages', selectedChat.jid], (oldData) => {
               if (!oldData) return [];
               return oldData.filter(msg => msg.id !== tempId);
            });
            setMessageInput(currentInput); // Restore input text
        }
    });
  };

  const formatTime = (timestamp) => {
      try {
          const date = new Date(timestamp * 1000); // WhatsApp usually uses seconds
          if (isNaN(date.getTime())) return '';
          return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
          return '';
      }
  };

  const formatDate = (timestamp) => {
      try {
        const date = new Date(timestamp * 1000);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString();
      } catch (e) {
          return '';
      }
  };


  return (
    <div className="flex h-[calc(100vh-2rem)] md:h-[calc(100vh-4rem)] bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
      {/* Sidebar - Chat List */}
      <div 
        className={`${selectedChat ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-r border-gray-200 flex-col bg-gray-50 h-full`}
      >
        {/* Header Sidebar */}
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 relative shrink-0">
               <span className="font-bold text-sm">ME</span>
             </div>
             <div className="min-w-0">
                <h2 className="font-semibold text-gray-800 truncate">WhatsApp</h2>
             </div>
          </div>
          <div className="flex gap-1 md:gap-2 text-gray-500 shrink-0">
            <button 
                onClick={() => setShowNewChatModal(true)}
                className="p-2 hover:bg-gray-100 rounded-full text-blue-600"
                title="Mulai Chat Baru"
            >
                <FaPlus />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block"><FaEllipsisV /></button>
          </div>
        </div>
        
        {/* Search */}
        <div className="p-3 bg-white border-b border-gray-100 shrink-0">
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
        <div className="flex-1 overflow-y-auto w-full">
          {contacts?.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                  Belum ada chat.
              </div>
          )}
          {contacts?.map((contact) => (
            <div 
              key={contact.jid} 
              onClick={() => setSelectedChat(contact)}
              className={`flex items-center gap-3 p-3 md:p-4 cursor-pointer transition-colors border-b border-gray-100 hover:bg-gray-100 ${selectedChat?.jid === contact.jid ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
            >
              <img src={contact.avatar || `https://ui-avatars.com/api/?name=${contact.name || 'User'}&background=random`} alt={contact.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border border-gray-200 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-1">
                  <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">{contact.name || contact.jid.replace('@s.whatsapp.net', '')}</h3>
                  <span className="text-[10px] md:text-xs text-gray-500 whitespace-nowrap ml-2">
                      {contact.conversationTimestamp ? formatDate(contact.conversationTimestamp.low || contact.conversationTimestamp) : ''}
                  </span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className="text-xs md:text-sm text-gray-600 truncate flex-1">
                      {/* Last message preview if available */}
                      {contact.lastMessage?.conversation || contact.lastMessage?.extendedTextMessage?.text || '...'}
                  </p>
                   {contact.unreadCount > 0 && (
                       <span className="bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center shrink-0">
                           {contact.unreadCount}
                       </span>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      {selectedChat ? (
        <div className={`${selectedChat ? 'flex' : 'hidden md:flex'} w-full md:w-2/3 flex-col bg-[#efeae2] relative h-full absolute inset-0 md:static`}>
            {/* Detail Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}></div>

            {/* Chat Header */}
            <div className="p-3 md:p-4 bg-white border-b border-gray-200 flex justify-between items-center shadow-sm z-10 shrink-0">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-700"
                >
                  <FaTimes /> {/* Menggunakan icon tutup / kembali yang tersedia */}
                </button>
                <img src={selectedChat?.avatar || `https://ui-avatars.com/api/?name=${selectedChat.name || 'User'}&background=random`} alt={selectedChat?.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover cursor-pointer shrink-0" />
                <div className="cursor-pointer min-w-0">
                <h3 className="font-semibold text-gray-900 truncate text-sm md:text-base">{selectedChat?.name || selectedChat.jid.replace('@s.whatsapp.net', '')}</h3>
                </div>
            </div>
            <div className="flex items-center gap-1 md:gap-2 text-gray-600 shrink-0">
                <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block"><FaSearch /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block"><FaPhone /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full hidden sm:block"><FaVideo /></button>
                <button className="p-2 hover:bg-gray-100 rounded-full"><FaEllipsisV /></button>
            </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 z-10 scrollbar-thin scrollbar-thumb-gray-300">
            {isLoadingMessages && messages.length === 0 && (
                <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-md text-blue-500"></span>
                </div>
            )}

            {messages.map((msg, index) => {
                const isFromMe = msg.fromMe || msg.key?.fromMe || msg.sender === 'me';
                const messageText = msg.text || msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.content || 'Media Message';
                const messageTime = msg.time || (msg.messageTimestamp ? formatTime(msg.messageTimestamp.low || msg.messageTimestamp) : '');

                return (
                <div key={msg.id || index} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex max-w-[85%] md:max-w-[75%] ${isFromMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        {/* Avatar for received messages */}
                        {!isFromMe && (
                            <div className="flex-shrink-0 mr-2 hidden sm:block">
                                <img
                                    src={selectedChat?.avatar || `https://ui-avatars.com/api/?name=${selectedChat?.name || 'User'}&background=random`}
                                    alt={selectedChat?.name}
                                    className="w-6 h-6 md:w-8 md:h-8 rounded-full object-cover"
                                />
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div
                            className={`px-3 py-2 md:px-4 md:py-2 relative ${
                                isFromMe
                                    ? 'bg-[#d9fdd3] text-gray-800 rounded-lg rounded-tr-sm'
                                    : 'bg-white text-gray-800 rounded-lg rounded-tl-sm'
                            } shadow-sm`}
                        >
                            {/* Sender name for group chats or received messages */}
                            {!isFromMe && selectedChat?.name && (
                                <p className="text-[10px] md:text-xs font-semibold text-gray-600 mb-0.5 md:mb-1 truncate">{selectedChat.name}</p>
                            )}

                            {/* Message content */}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                {messageText}
                            </p>

                            {/* Time and status */}
                            <div className={`flex items-center gap-1 mt-1 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[9px] md:text-[10px] text-gray-500 whitespace-nowrap">
                                    {messageTime}
                                </span>
                                {isFromMe && (
                                    <span className="flex items-center">
                                        {msg.status >= 3 || msg.status === 'read' ? (
                                            <FaCheckDouble className="text-blue-500 text-[10px]" />
                                        ) : msg.status === 'sending' ? (
                                            <span className="text-[10px] text-gray-400">🕒</span>
                                        ) : (
                                            <FaCheckDouble className="text-gray-400 text-[10px]" />
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );})}
            <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 md:p-4 bg-gray-50 border-t border-gray-200 z-10 shrink-0">
            <div className="flex items-center gap-1 md:gap-2">
                <button className="text-gray-500 hover:text-gray-700 p-1.5 md:p-2 hidden sm:block"><FaSmile size={20} className="md:w-6 md:h-6" /></button>
                <button className="text-gray-500 hover:text-gray-700 p-1.5 md:p-2"><FaPaperclip size={18} className="md:w-5 md:h-5" /></button>
                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Ketik pesan..."
                        onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSendMessage();
                        }}
                        className="w-full px-3 py-2 md:px-4 md:py-3 text-sm md:text-base bg-white rounded-lg border border-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                    />
                </div>
                {messageInput.trim() ? (
                <button 
                    onClick={handleSendMessage}
                    disabled={sendMessageMutation.isPending}
                    className="bg-blue-600 text-white p-2 md:p-3 rounded-full hover:bg-blue-700 transition shadow-md disabled:opacity-50 shrink-0"
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" className="md:w-6 md:h-6"><path d="M1.101 21.757 23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"></path></svg>
                </button>
                ) : (
                    <button className="text-gray-500 hover:text-gray-700 p-1.5 md:p-2 shrink-0"><FaMicrophone size={20} className="md:w-6 md:h-6" /></button>
                )}
            </div>
            </div>
        </div>
      ) : (
          <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-[#f0f2f5] text-center p-8 border-b-8 border-green-500">
              <div className="mb-6">
                  {/* WhatsApp Intro Image */}
                  <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" className="w-16 h-16 md:w-20 md:h-20 opacity-50 mx-auto mb-4" />
                  <h1 className="text-xl md:text-3xl font-light text-gray-700 mb-2">WhatsApp Web untuk POS</h1>
                  <p className="text-sm md:text-base text-gray-600 max-w-lg">
                      Kirim dan terima pesan tanpa perlu agar telepon Anda tetap online.<br className="hidden sm:block"/>
                      Gunakan WhatsApp di hingga 4 perangkat tertaut dan 1 telepon sekaligus.
                  </p>
              </div>
              <div className="text-xs md:text-sm text-gray-500 flex items-center gap-1">
                  <FaCheckDouble size={12} /> End-to-end encrypted
              </div>
          </div>
      )}
      {/* New Chat Modal (Updated for Mobile) */}
      {showNewChatModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center sm:p-4">
              <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col h-[80vh] sm:max-h-[80vh]">
                  <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <h3 className="font-semibold text-gray-800">Mulai Chat Baru</h3>
                      <button onClick={() => setShowNewChatModal(false)} className="text-gray-500 hover:text-gray-700 p-2 -mr-2">
                          <FaTimes size={20} />
                      </button>
                  </div>
                  
                  <div className="p-3 border-b border-gray-100">
                      <div className="relative">
                          <input 
                              type="text" 
                              value={customerSearchQuery}
                              onChange={(e) => setCustomerSearchQuery(e.target.value)}
                              placeholder="Cari nama atau nomor HP..." 
                              className="w-full pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                              autoFocus
                          />
                          <FaSearch className="absolute left-3 top-3 sm:top-3.5 text-gray-400" />
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                      {isLoadingCustomers ? (
                          <div className="flex justify-center py-8">
                              <span className="loading loading-spinner text-blue-500"></span>
                          </div>
                      ) : customers?.length > 0 ? (
                          <div className="space-y-1">
                              {customers.map(customer => {
                                  // Normalize phone number
                                  let phone = customer.telepon || customer.no_hp || '';
                                  phone = phone.replace(/[^0-9]/g, '');
                                  if (phone.startsWith('0')) phone = '62' + phone.slice(1);
                                  if (!phone) return null;

                                  return (
                                      <div 
                                          key={customer.id}
                                          onClick={() => {
                                              const jid = `${phone}@s.whatsapp.net`;
                                              const existingChat = contacts.find(c => c.jid === jid);
                                              
                                              if (existingChat) {
                                                  setSelectedChat(existingChat);
                                              } else {
                                                  // Create temporary chat object
                                                  setSelectedChat({
                                                      jid,
                                                      name: customer.nama,
                                                      avatar: null,
                                                      unreadCount: 0
                                                  });
                                              }
                                              setShowNewChatModal(false);
                                          }}
                                          className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-lg cursor-pointer transition-colors"
                                      >
                                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                              {customer.nama?.charAt(0) || '?'}
                                          </div>
                                          <div className="min-w-0">
                                              <h4 className="font-medium text-gray-900 truncate text-sm sm:text-base">{customer.nama}</h4>
                                              <p className="text-xs sm:text-sm text-gray-500">{phone}</p>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      ) : customerSearchQuery.length > 2 ? (
                          <div className="text-center py-8 text-gray-500 text-sm">
                              Tidak ada pelanggan ditemukan.
                          </div>
                      ) : (
                          <div className="text-center py-8 text-gray-400 text-xs sm:text-sm">
                              Ketik minimal 3 karakter untuk mencari.
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ChatPage;
