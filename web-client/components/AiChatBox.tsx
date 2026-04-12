'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Minimize2, 
  Sparkles,
  Trash2
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

export default function AiChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'ai',
      content: 'Chào bạn! Tôi là Workly AI Assistant. Tôi có thể giúp gì cho bạn trong việc tìm kiếm việc làm hoặc tuyển dụng hôm nay?',
      timestamp: new Date()
    }
  ]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    const aiMessageId = (Date.now() + 1).toString();
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai/chat-stream?message=${encodeURIComponent(currentInput)}`);
      
      if (!response.ok) throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader found');
      
      // Khởi tạo tin nhắn AI trống
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'ai',
        content: '',
        timestamp: new Date()
      }]);

      let fullContent = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const content = line.replace('data:', '').trim();
            if (content) {
              fullContent += content;
              setMessages(prev => prev.map(msg => 
                msg.id === aiMessageId 
                  ? { ...msg, content: fullContent }
                  : msg
              ));
              setIsLoading(false);
            }
          }
        }
      }
    } catch (error: any) {
      console.error('AI Chat Network Error:', error);
      toast.error(`Lỗi: ${error.message || 'Không thể kết nối với AI'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện?')) {
      setMessages([
        {
          id: 'welcome',
          role: 'ai',
          content: 'Chào bạn! Tôi là Workly AI Assistant. Tôi có thể giúp gì cho bạn hôm nay?',
          timestamp: new Date()
        }
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-700 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <MessageSquare className="w-8 h-8 relative z-10" />
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white" 
            />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="w-[380px] sm:w-[420px] h-[550px] bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col overflow-hidden border border-slate-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg tracking-tight">Workly AI</h3>
                  <div className="flex items-center gap-1.5 opacity-80">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[11px] font-medium uppercase tracking-wider">Trực tuyến</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={clearChat}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  title="Xóa lịch sử"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-blue-600 border border-slate-100'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 items-center">
                    <div className="w-8 h-8 rounded-full bg-white text-blue-600 border border-slate-100 flex items-center justify-center shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                      <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                      <span className="text-slate-400 text-xs font-medium italic">AI đang suy nghĩ...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100">
              <form 
                onSubmit={handleSend}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Hỏi AI bất kỳ điều gì..."
                  className="w-full bg-slate-100 border-none rounded-2xl py-3.5 pl-4 pr-14 focus:ring-2 focus:ring-blue-500/30 transition-all text-sm text-slate-800 placeholder:text-slate-400"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`absolute right-1.5 p-2.5 rounded-xl transition-all ${
                    input.trim() && !isLoading 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
              <p className="text-[10px] text-center text-slate-400 mt-2.5 font-medium uppercase tracking-wider">
                Powered by Gemini 3 Flash (Thinking Mode)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
