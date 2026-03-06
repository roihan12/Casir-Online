import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMessageSquare, FiX, FiSend, FiMaximize2, FiMinimize2, FiTrash2 } from 'react-icons/fi';
import { FaRobot, FaUserCircle } from 'react-icons/fa';
import ReactMarkdown from 'react-markdown';
import { useChat } from '../hooks/useChat';
import { useCabang } from '../../../features/cabang/hooks/useCabang';

const PosAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [localSessionId, setLocalSessionId] = useState(localStorage.getItem('pos_chat_session_id'));
  const [localMessages, setLocalMessages] = useState([]);
  
  const messagesEndRef = useRef(null);
  const { selectedCabang } = useCabang();

  // Custom hook for chat API
  const { 
    history, 
    isLoadingHistory,
    createSession,
    isCreatingSession,
    askQuestion,
    isAsking
  } = useChat(localSessionId);

  // Sync server history with local state
  useEffect(() => {
    if (history && history.length > 0) {
      setLocalMessages(history.map(msg => ({
        id: msg.id,
        role: msg.role, // 'user' | 'ai'
        content: msg.content,
      })));
    }
  }, [history]);

  // Handle auto scroll
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [localMessages, isAsking]);

  const handleOpen = async () => {
    setIsOpen(true);
    // Auto-create session if none exists
    if (!localSessionId) {
      try {
        const newSession = await createSession('POS Assistant Chat');
        const sessionId = newSession.data?.id || newSession.id;
        setLocalSessionId(sessionId);
        localStorage.setItem('pos_chat_session_id', sessionId);
        
        // Add initial greeting locally
        setLocalMessages([{
          id: 'welcome-msg',
          role: 'ai',
          content: 'Halo! Saya AI Assistant khusus untuk Dashboard POS Analitik. Ada yang bisa saya bantu terkait laporan penjualan, stok toko, atau aktivitas staf hari ini?'
        }]);
      } catch (error) {
        console.error("Gagal membuat sesi chat:", error);
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleClearChat = () => {
    localStorage.removeItem('pos_chat_session_id');
    setLocalSessionId(null);
    setLocalMessages([]);
    setIsOpen(false);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isAsking) return;

    if (!localSessionId) {
        await handleOpen(); // Ensure session is created
    }

    const question = inputMessage;
    
    // Add user message to UI immediately for perceived speed
    const tempId = Date.now().toString();
    setLocalMessages(prev => [...prev, { id: tempId, role: 'user', content: question }]);
    setInputMessage('');

    try {
      const response = await askQuestion({
        sessionId: localSessionId,
        question: question,
        cabangId: selectedCabang?.id
      });
      
      // Update with AI response
      setLocalMessages(prev => [...prev, { 
        id: response.data?.messageId || Date.now().toString(), 
        role: 'ai', 
        content: response.data?.answer || "Maaf, terjadi kesalahan saat memproses jawaban."
      }]);
    } catch (error) {
      console.error("Gagal mengirim pertanyaan:", error);
      setLocalMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', content: "Maaf, ada masalah terhubung ke server AI. Coba lagi nanti." }]);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleOpen}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xl flex items-center justify-center hover:shadow-blue-500/50 transition-all duration-300 group"
          >
            <FaRobot className="w-6 h-6 animate-pulse group-hover:animate-none" />
            <span className="absolute -top-10 right-0 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden sm:block">
              Tanya AI Assistant
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={`fixed z-50 flex flex-col bg-white overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 dark:bg-gray-900 transition-all duration-300
              ${isExpanded 
                ? 'top-4 bottom-4 right-4 left-4 sm:top-10 sm:bottom-10 sm:right-10 sm:left-auto sm:w-[600px] rounded-2xl' 
                : 'bottom-6 right-6 w-[360px] h-[550px] rounded-2xl'}
              max-h-[calc(100vh-2rem)] max-w-[calc(100vw-2rem)]`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white flex justify-between items-center relative overflow-hidden">
               {/* Decorative background vectors */}
               <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              
              <div className="flex items-center gap-3 relative z-10">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <FaRobot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Casir-Online AI</h3>
                  <p className="text-xs text-blue-100 opacity-90">Analis POS Pintar</p>
                </div>
              </div>
              <div className="flex items-center gap-1 relative z-10">
                 <button 
                  onClick={handleClearChat}
                  className="p-2 hover:bg-white/20 rounded-md transition-colors"
                  title="Reset Chat"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 hover:bg-white/20 rounded-md transition-colors hidden sm:block"
                >
                  {isExpanded ? <FiMinimize2 className="w-4 h-4" /> : <FiMaximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={handleClose}
                  className="p-2 hover:bg-white/20 rounded-md transition-colors"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 scroll-smooth space-y-4">
               {isCreatingSession || isLoadingHistory ? (
                   <div className="flex flex-col gap-3 justify-center items-center h-full text-gray-400">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="text-sm">Menghubungkan ke AI...</p>
                   </div>
               ) : localMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-60">
                     <FaRobot className="w-16 h-16 text-gray-300 mb-4" />
                     <p className="text-sm dark:text-gray-400">Belum ada obrolan. Coba tanya "Berapa total transaksi hari ini?"</p>
                  </div>
               ) : (
                 localMessages.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id || idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                  >
                    <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {/* Avatar */}
                      <div className="flex-shrink-0 mt-1">
                        {msg.role === 'user' ? (
                          <div className="bg-gray-200 dark:bg-gray-700 p-1.5 rounded-full text-gray-600 dark:text-gray-300">
                            <FaUserCircle className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="bg-blue-100 dark:bg-blue-900 p-1.5 rounded-full text-blue-600 dark:text-blue-300 shadow-sm border border-blue-200 dark:border-blue-800">
                             <FaRobot className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      
                      {/* Message Bubble */}
                      <div 
                        className={`p-3 rounded-2xl shadow-sm text-[13px] leading-relaxed
                          ${msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-tr-sm' 
                            : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-tl-sm'
                          }
                        `}
                      >
                         {msg.role === 'ai' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-headings:my-2 prose-headings:text-sm">
                              <ReactMarkdown>
                                {msg.content}
                              </ReactMarkdown>
                            </div>
                         ) : (
                            <p>{msg.content}</p>
                         )}
                      </div>
                    </div>
                  </motion.div>
                ))
               )}

              {/* Thinking Indicator */}
              {isAsking && (
                <div className="flex justify-start mb-4">
                  <div className="flex gap-2 max-w-[85%]">
                     <div className="flex-shrink-0 mt-1">
                       <div className="bg-blue-100 dark:bg-blue-900 p-1.5 rounded-full text-blue-600 dark:text-blue-300 shadow-sm">
                          <FaRobot className="w-4 h-4" />
                       </div>
                     </div>
                     <div className="p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center h-10">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                     </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 z-10 relative">
              <form onSubmit={handleSendMessage} className="flex gap-2 relative">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ketik pertanyaan analitik..."
                  className="flex-1 bg-gray-100 dark:bg-gray-800 dark:text-white border-transparent focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900 rounded-xl px-4 py-2.5 text-sm transition-all duration-200 outline-none placeholder:text-gray-400"
                  disabled={isAsking || isCreatingSession}
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isAsking || isCreatingSession}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-3 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center shrink-0"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </form>
              <div className="text-[10px] text-center mt-2 text-gray-400 dark:text-gray-500">
                Data ditenagai oleh Google Gemini & Dashboard POS API
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PosAssistant;
