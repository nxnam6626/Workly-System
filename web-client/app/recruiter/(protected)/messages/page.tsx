'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Send, MoreVertical, Phone, Video, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { useMessageStore } from '@/stores/message';
import api from '@/lib/api';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getOnlineStatusText = (usr: any) => {
    if (!usr) return '';
    if (usr.isOnline) return 'Đang hoạt động';
    if (!usr.lastActive) return 'Ngoại tuyến';
    const mins = Math.max(0, Math.floor((Date.now() - new Date(usr.lastActive).getTime()) / 60000));
    if (mins < 1) return 'Vừa truy cập';
    if (mins < 60) return `Hoạt động ${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hoạt động ${hours} giờ trước`;
    return `Hoạt động ${Math.floor(hours / 24)} ngày trước`;
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeChat) {
      fetchMessages(activeChat.conversationId);
      api.patch(`/messages/conversations/${activeChat.conversationId}/read`)
        .then(() => {
          setConversations(prev => prev.map(c => c.conversationId === activeChat.conversationId ? { ...c, isRead: true, unread: 0 } : c));
          useMessageStore.getState().fetchUnreadCount();
        })
        .catch(console.error);
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg: any) => {
      // If we are currently in this chat, add to messages
      setMessages((prev) => {
        // use function setState to safely check current activeChat inside effect
        if (msg.conversationId === activeChat?.conversationId) {
          if (!prev.find(m => m.messageId === msg.messageId)) return [...prev, msg];
        }
        return prev;
      });

      if (msg.conversationId === activeChat?.conversationId && msg.senderId !== user?.userId) {
         api.patch(`/messages/conversations/${msg.conversationId}/read`);
      }

      // Update lastMessage in conversations list and bubble to top
      setConversations((prev) => {
        const index = prev.findIndex(c => c.conversationId === msg.conversationId);
        if (index === -1) {
          fetchConversations(); // fetch if new
          return prev;
        }
        const updated = [...prev];
        const moved = { ...updated[index] };
        updated.splice(index, 1);
        
        moved.lastMessage = msg.content;
        moved.updatedAt = msg.sentAt;
        if (msg.senderId !== user?.userId && activeChat?.conversationId !== msg.conversationId) {
          moved.isRead = false; // pseudo unread if needed, DB handles properly later
          moved.unread = (moved.unread || 0) + 1;
        }
        return [moved, ...updated];
      });
    };

    const handleUserStatusChanged = (status: { userId: string; isOnline: boolean; lastActive?: string }) => {
      setConversations(prev => prev.map(c => {
        if (c.candidate?.user?.userId === status.userId) {
          return { ...c, candidate: { ...c.candidate, user: { ...c.candidate.user, isOnline: status.isOnline, lastActive: status.lastActive } } };
        }
        return c;
      }));
      if (activeChat?.candidate?.user?.userId === status.userId) {
        setActiveChat((prev: any) => prev ? { ...prev, candidate: { ...prev.candidate, user: { ...prev.candidate!.user, isOnline: status.isOnline, lastActive: status.lastActive } } as any } : prev);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('userStatusChanged', handleUserStatusChanged);
    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('userStatusChanged', handleUserStatusChanged);
    };
  }, [socket, activeChat, user?.userId]);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data);
      // Auto select first if none active
      if (data.length > 0 && !activeChat) {
        setActiveChat(data[0]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const { data } = await api.get(`/messages/conversations/${conversationId}/messages`);
      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat || !socket) return;
    
    // We expect the receiver to be the candidate for the recruiter dashboard
    const receiverUserId = activeChat.candidate?.user?.userId;

    socket.emit('sendMessage', {
      conversationId: activeChat.conversationId,
      content: inputText,
      receiverUserId,
    });
    
    setInputText('');
  };

  const filteredConversations = conversations.filter(c => 
    c.candidate?.fullName?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-[calc(100vh-100px)] flex flex-col pt-0" // Adjusted for sticky header
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-indigo-600" />
            Nhắn Tin
          </h1>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-0">
        
        {/* Sidebar Contacts */}
        <div className="w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0 flex-1 md:flex-none">
          <div className="p-4 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm tin nhắn..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 scrollbar-hide">
            {filteredConversations.length === 0 ? (
               <p className="text-center text-sm text-slate-400 mt-4">Không tìm thấy cuộc trò chuyện nào.</p>
            ) : filteredConversations.map(conv => {
              const isActive = activeChat?.conversationId === conv.conversationId;
              const name = conv.candidate?.fullName || 'Người dùng';
              return (
              <button 
                key={conv.conversationId}
                onClick={() => setActiveChat(conv)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${isActive ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
              >
                <div className="relative">
                  {conv.candidate?.user?.avatar ? (
                     <img src={conv.candidate.user.avatar} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
                      {name.charAt(0)}
                    </div>
                  )}
                  {conv.candidate?.user?.isOnline && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span className={`font-semibold text-sm truncate pr-2 ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>{name}</span>
                    <span className={`text-xs whitespace-nowrap ${conv.unread ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>{formatTime(conv.updatedAt)}</span>
                  </div>
                  <div className="flex justify-between items-center gap-4">
                     <p className={`text-xs truncate ${conv.unread ? 'text-slate-800 font-semibold text-sm' : 'text-slate-500'}`}>{conv.lastMessage || 'Chưa có tin nhắn'}</p>
                     {conv.unread > 0 && (
                       <span className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                         {conv.unread}
                       </span>
                     )}
                  </div>
                </div>
              </button>
            )})}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col hidden md:flex bg-slate-50/30">
          {activeChat ? (
            <>
              {/* Chat Header */}
              <div className="h-16 px-6 border-b border-slate-100 bg-white flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                    {activeChat.candidate?.fullName?.charAt(0) || 'N'}
                  </div>
                  <div>
                    <h2 className="font-semibold text-slate-800">{activeChat.candidate?.fullName || 'Người dùng'}</h2>
                    <p className={`text-xs font-medium flex items-center gap-1 ${activeChat.candidate?.user?.isOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
                      {activeChat.candidate?.user?.isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>}
                      {getOnlineStatusText(activeChat.candidate?.user)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-slate-400">
                   <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Phone className="w-5 h-5" /></button>
                   <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><Video className="w-5 h-5" /></button>
                   <div className="w-px h-6 bg-slate-200 mx-1"></div>
                   <button className="p-2 hover:bg-slate-100 rounded-full transition-colors"><MoreVertical className="w-5 h-5" /></button>
                </div>
              </div>

              {/* Messages Iteration */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => {
                  const isSender = msg.senderId === user?.userId;
                  return (
                  <div key={msg.messageId || Math.random().toString()} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] xl:max-w-[60%] flex gap-3 ${isSender ? 'flex-row-reverse' : ''}`}>
                      {!isSender && (
                        <div className="w-8 h-8 rounded-full bg-indigo-100 shrink-0 flex items-center justify-center font-bold text-indigo-700 text-xs mt-auto">
                          {activeChat.candidate?.fullName?.charAt(0) || 'N'}
                        </div>
                      )}
                      
                      <div className={`flex flex-col ${isSender ? 'items-end' : 'items-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl ${
                          isSender 
                            ? 'bg-indigo-600 text-white rounded-br-sm shadow-sm shadow-indigo-600/20' 
                            : 'bg-white text-slate-700 border border-slate-100 rounded-bl-sm shadow-sm'
                        }`}>
                          <p className={`text-[15px] leading-relaxed ${isSender ? 'text-indigo-50' : ''}`}>{msg.content}</p>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 px-1">{formatTime(msg.sentAt)}</span>
                      </div>
                    </div>
                  </div>
                )})}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-4 bg-white border-t border-slate-100">
                <form onSubmit={handleSend} className="flex gap-3">
                   <div className="flex-1 relative">
                     <input
                       type="text"
                       value={inputText}
                       onChange={(e) => setInputText(e.target.value)}
                       placeholder="Nhập tin nhắn..."
                       className="w-full h-12 pl-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-[15px]"
                     />
                   </div>
                   <button 
                     type="submit" 
                     className="w-12 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors shadow-md shadow-indigo-500/30 shrink-0"
                   >
                     <Send className="w-5 h-5 ml-1" />
                   </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-6">
              <MessageSquare className="w-16 h-16 text-slate-200 mb-4" />
              <p className="text-lg font-medium text-slate-500">Chọn cuộc trò chuyện</p>
              <p className="text-sm">Bắt đầu trò chuyện với ứng viên từ danh sách bên trái.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
