'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Send, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import api from '@/lib/api';

export default function CandidateMessagesPage() {
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
    }
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewMessage = (msg: any) => {
      setMessages((prev) => {
        if (msg.conversationId === activeChat?.conversationId) {
          if (!prev.find(m => m.messageId === msg.messageId)) return [...prev, msg];
        }
        return prev;
      });

      setConversations((prev) => {
        const index = prev.findIndex(c => c.conversationId === msg.conversationId);
        if (index === -1) {
          fetchConversations();
          return prev;
        }
        const updated = [...prev];
        const moved = { ...updated[index] };
        updated.splice(index, 1);
        
        moved.lastMessage = msg.content;
        moved.updatedAt = msg.sentAt;
        if (msg.senderId !== user?.userId && activeChat?.conversationId !== msg.conversationId) {
           moved.isRead = false;
        }
        return [moved, ...updated];
      });
    };

    const handleUserStatusChanged = (status: { userId: string; isOnline: boolean; lastActive?: string }) => {
      setConversations(prev => prev.map(c => {
        if (c.recruiter?.user?.userId === status.userId) {
          return { ...c, recruiter: { ...c.recruiter, user: { ...c.recruiter.user, isOnline: status.isOnline, lastActive: status.lastActive } } };
        }
        return c;
      }));
      if (activeChat?.recruiter?.user?.userId === status.userId) {
        setActiveChat((prev: any) => prev ? { ...prev, recruiter: { ...prev.recruiter, user: { ...prev.recruiter!.user, isOnline: status.isOnline, lastActive: status.lastActive } } as any } : prev);
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

    // Sender is candidate, receiver is recruiter
    const receiverUserId = activeChat.recruiter?.user?.userId;

    socket.emit('sendMessage', {
      conversationId: activeChat.conversationId,
      content: inputText,
      receiverUserId,
    });
    
    setInputText('');
  };

  const filteredConversations = conversations.filter(c => 
    c.recruiter?.company?.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="h-[calc(100vh-250px)] flex flex-col pt-0" 
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
              <MessageSquare className="h-8 w-8 text-indigo-600" />
              Tin nhắn từ Nhà tuyển dụng
            </h1>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-0">
          
          <div className="w-full md:w-80 border-r border-slate-100 flex flex-col shrink-0 flex-1 md:flex-none">
            <div className="p-4 border-b border-slate-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm kiếm nhà tuyển dụng..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 rounded-xl border border-transparent focus:bg-white focus:border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1 scrollbar-hide">
              {filteredConversations.length === 0 ? (
                 <p className="text-center text-sm text-slate-400 mt-4">Chưa có tin nhắn nào.</p>
              ) : filteredConversations.map(conv => {
                const isActive = activeChat?.conversationId === conv.conversationId;
                const name = conv.recruiter?.company?.companyName || 'Công ty';
                return (
                <button 
                  key={conv.conversationId}
                  onClick={() => setActiveChat(conv)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left ${isActive ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
                >
                  <div className="relative">
                    {conv.recruiter?.user?.avatar ? (
                       <img src={conv.recruiter.user.avatar} className="w-12 h-12 rounded-2xl object-cover shrink-0" alt="Company icon"/>
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold text-lg shrink-0">
                        {name.charAt(0)}
                      </div>
                    )}
                    {conv.recruiter?.user?.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className={`font-semibold text-sm truncate pr-2 ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>{name}</span>
                      <span className={`text-xs whitespace-nowrap ${conv.isRead === false ? 'text-indigo-600 font-medium' : 'text-slate-400'}`}>{formatTime(conv.updatedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center gap-4">
                       <p className={`text-xs truncate ${conv.isRead === false ? 'text-slate-800 font-semibold text-sm' : 'text-slate-500'}`}>{conv.lastMessage || 'Chưa có tin nhắn'}</p>
                    </div>
                  </div>
                </button>
              )})}
            </div>
          </div>

          <div className="flex-1 flex flex-col hidden md:flex bg-slate-50/30">
            {activeChat ? (
              <>
                <div className="h-16 px-6 border-b border-slate-100 bg-white flex items-center justify-between shadow-sm z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                      {(activeChat.recruiter?.company?.companyName?.charAt(0) || 'C')}
                    </div>
                    <div>
                      <h2 className="font-semibold text-slate-800">{activeChat.recruiter?.company?.companyName || 'Công ty'}</h2>
                      <p className={`text-xs font-medium flex items-center gap-1 ${activeChat.recruiter?.user?.isOnline ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {activeChat.recruiter?.user?.isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>}
                        {getOnlineStatusText(activeChat.recruiter?.user)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg) => {
                    const isSender = msg.senderId === user?.userId;
                    return (
                    <div key={msg.messageId || Math.random()} className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] xl:max-w-[60%] flex gap-3 ${isSender ? 'flex-row-reverse' : ''}`}>
                        {!isSender && (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 shrink-0 flex items-center justify-center font-bold text-indigo-700 text-xs mt-auto">
                            {(activeChat.recruiter?.company?.companyName?.charAt(0) || 'C')}
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
                <p className="text-lg font-medium text-slate-500">Chọn hộp thư</p>
                <p className="text-sm">Bắt đầu trò chuyện với nhà tuyển dụng từ danh sách bên trái.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
