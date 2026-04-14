'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';
import {
  MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Trash2, Maximize2, Minimize2
} from 'lucide-react';
import { useAiChatStore } from '@/stores/aiChatStore';
import io, { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import ChatJobCard from './chat/ChatJobCard';
import HumanSupportButton from './chat/HumanSupportButton';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AiChatBox() {
  const {
    isOpen, setIsOpen, messages, addMessage, updateMessage, clearChat, isTyping, setTyping
  } = useAiChatStore();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const pathname = usePathname() || '';
  const { user } = useAuthStore();

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/ai-chat`);

      socketRef.current.on('stream_chunk', (data: { text: string }) => {
        setTyping(false);
        const state = useAiChatStore.getState();
        const lastMsg = state.messages[state.messages.length - 1];

        if (lastMsg && lastMsg.role === 'ai' && lastMsg.metadata?.isStreaming) {
          updateMessage(lastMsg.id, { content: lastMsg.content + data.text });
        } else {
          const newId = Date.now().toString();
          addMessage({
            id: newId, role: 'ai', content: data.text, timestamp: new Date(),
            metadata: { isStreaming: true }
          });
        }
      });

      socketRef.current.on('ai_action', (data: any) => {
        setTyping(false);
        const newId = Date.now().toString() + Math.random().toString();
        addMessage({
          id: newId, role: 'ai', content: '', timestamp: new Date(),
          metadata: { action: data.type, payload: data.data }
        });
      });

      socketRef.current.on('stream_end', () => {
        setTyping(false);
        const state = useAiChatStore.getState();
        const lastMsg = state.messages[state.messages.length - 1];
        if (lastMsg && lastMsg.metadata?.isStreaming) {
          updateMessage(lastMsg.id, { metadata: { ...lastMsg.metadata, isStreaming: false } });
        }
      });

      socketRef.current.on('connect_error', () => {
        console.warn('AI Socket Connect Error');
      });
    }

    return () => {
      // Keep socket alive during page transitions if desired.
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  const renderMessageContent = (msg: any) => {
    const isUser = msg.role === 'user';
    const hasContent = msg.content && msg.content.trim().length > 0;
    const hasMetadata = msg.metadata?.action && msg.metadata?.payload;

    if (!hasContent && !hasMetadata) return null;

    return (
      <div className={`p-4 rounded-2xl shadow-md transition-all ${isUser
        ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-tr-none'
        : 'bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 rounded-tl-none'
        }`}>
        {hasContent && (
          <div className="text-sm leading-relaxed markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
        {(msg.metadata?.action === 'recommend_jobs' || msg.metadata?.action === 'SHOW_JOB_CARDS') && msg.metadata?.payload && (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">Việc làm gợi ý cho bạn</p>
            {msg.metadata.payload.map((job: any) => (
              <ChatJobCard key={job.id} job={job} />
            ))}
          </div>
        )}
        {msg.metadata?.action === 'human_support' && (
          <div className="mt-4 border-t border-slate-100 pt-3">
            <HumanSupportButton />
          </div>
        )}
      </div>
    );
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const currentInput = input.trim();
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    });
    setInput('');
    setTyping(true);

    const { accessToken } = useAuthStore.getState();
    const streamUrl = `${API_BASE_URL}/ai/chat-stream?message=${encodeURIComponent(currentInput)}${accessToken ? `&token=${accessToken}` : ''}`;

    const aiMessageId = (Date.now() + 1).toString();
    let aiMessageAdded = false;

    try {
      const response = await fetch(streamUrl);

      if (!response.ok) throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader found');

      let fullContent = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data:')) {
                        let content = line.replace('data:', ''); // REMOVED .trim() to preserve spacing
                        if (content) {
                            // NestJS wraps string data in quotes for SSE
                            if (content.startsWith('"') && content.endsWith('"')) {
                                content = content.slice(1, -1).replace(/\\n/g, '\n');
                            }

                            // Check for internal commands (e.g., job cards)
                            if (content.startsWith('__ACTION__:')) {
                                try {
                                    const actionData = JSON.parse(content.replace('__ACTION__:', ''));
                                    addMessage({
                                        id: Date.now().toString() + Math.random(),
                                        role: 'ai',
                                        content: '',
                                        timestamp: new Date(),
                                        metadata: { action: actionData.type, payload: actionData.payload }
                                    });
                                } catch (e) {
                                    console.error('Failed to parse AI action:', e);
                                }
                                continue;
                            }

                            if (!aiMessageAdded) {
                                addMessage({
                                    id: aiMessageId,
                                    role: 'ai',
                                    content: '',
                                    timestamp: new Date(),
                                    metadata: { isStreaming: true }
                                });
                                aiMessageAdded = true;
                                setTyping(false);
                            }
                            fullContent += content;
                            updateMessage(aiMessageId, { content: fullContent });
                        }
                    }
                }
      }
      // Kết thúc stream
      if (aiMessageAdded) {
        updateMessage(aiMessageId, { metadata: { isStreaming: false } });
      }
    } catch (error: any) {
      console.error('AI Chat Network Error:', error);
      toast.error(`Lỗi: ${error.message || 'Không thể kết nối với AI'}`);
    } finally {
      setTyping(false);
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
            className="w-[380px] sm:w-[420px] h-[580px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-white/50 ring-1 ring-black/5"
          >
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 p-5 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl backdrop-blur-md flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg tracking-tight">Workly AI</h3>
                  <div className="flex items-center gap-1.5 opacity-80">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[11px] font-medium uppercase tracking-wider">Trực tuyến (Socket)</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (confirm('Bạn có muốn xóa toàn bộ lịch sử trò chuyện?')) clearChat();
                  }}
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

            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {renderMessageContent(msg) && (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-blue-600 border border-slate-100'
                        }`}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                    )}
                    {renderMessageContent(msg)}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 items-center">
                    <div className="w-8 h-8 rounded-full bg-white text-blue-600 border border-slate-100 flex items-center justify-center shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2 shadow-sm">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="flex gap-1"
                      >
                        <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        <span className="w-2 h-2 bg-blue-600 rounded-full animation-delay-200"></span>
                        <span className="w-2 h-2 bg-blue-600 rounded-full animation-delay-400"></span>
                      </motion.div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Context-Aware Suggestions */}
            {!isTyping && messages.length > 0 && (
              <div className="px-4 pb-2 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
                {pathname.includes('/candidates/profile') && (
                  <>
                    <button onClick={() => { setInput('Đánh giá CV của tôi'); handleSend(); }} className="text-[13px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-colors">
                      Đánh giá CV của tôi
                    </button>
                    <button onClick={() => { setInput('Gợi ý việc làm phù hợp với CV này'); handleSend(); }} className="text-[13px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-full font-medium hover:bg-emerald-100 transition-colors">
                      Gợi ý việc làm phù hợp
                    </button>
                  </>
                )}
                {pathname.includes('/jobs/') && (
                  <button onClick={() => { setInput('Phân tích độ phù hợp của tôi với công việc này'); handleSend(); }} className="text-[13px] bg-blue-50 text-blue-600 border border-blue-100 px-3 py-1.5 rounded-full font-medium hover:bg-blue-100 transition-colors">
                    Phân tích mức độ phù hợp
                  </button>
                )}
              </div>
            )}

            <div className="p-4 bg-white border-t border-slate-100">
              <form
                onSubmit={handleSend}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Nhập việc làm bạn muốn tìm..."
                  className="w-full bg-slate-100 border-none rounded-2xl py-3.5 pl-4 pr-14 focus:ring-2 focus:ring-blue-500/30 transition-all text-sm text-slate-800 placeholder:text-slate-400"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className={`absolute right-1.5 p-2.5 rounded-xl transition-all ${input.trim() && !isTyping
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
