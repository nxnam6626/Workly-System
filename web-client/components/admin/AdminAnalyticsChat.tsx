'use client';

import { useState, useRef, useEffect } from 'react';
import { adminAnalyticsApi, AnalyticsResponse } from '@/lib/admin-api';
import { Send, Bot, Database, CheckCircle, AlertCircle, Loader2, Sparkles, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  details?: AnalyticsResponse;
  isLoading?: boolean;
};

// Quick util to format basic markdown bold
const formatMarkdown = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <span key={i} className="font-bold text-slate-900 bg-indigo-50/50 px-1 rounded">{part.slice(2, -2)}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

export function AdminAnalyticsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);

  useEffect(() => {
    if (isExpanded) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isExpanded]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text };
    const agentMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', content: '', isLoading: true };

    setMessages((prev) => [...prev, userMsg, agentMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await adminAnalyticsApi.ask(userMsg.content);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsg.id
            ? { ...msg, content: response.answer, details: response, isLoading: false }
            : msg
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === agentMsg.id
            ? { ...msg, content: 'Đã xảy ra lỗi khi kết nối với AI Agent.', isLoading: false }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header — clickable to expand/collapse */}
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="bg-gradient-to-r from-slate-900 to-indigo-900 px-6 py-4 flex items-center justify-between w-full text-left hover:opacity-95 transition-opacity"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Workly AI Data Analyst</h3>
            <p className="text-xs text-indigo-300">Text-to-SQL Multi-Agent System</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {messages.length > 0 && (
            <span className="text-xs bg-indigo-500/30 text-indigo-200 px-2.5 py-0.5 rounded-full font-medium">
              {messages.filter(m => m.role === 'user').length} câu hỏi
            </span>
          )}
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            {isExpanded
              ? <Minimize2 className="w-3.5 h-3.5 text-indigo-300" />
              : <Maximize2 className="w-3.5 h-3.5 text-indigo-300" />}
          </div>
        </div>
      </button>

      {/* Collapsible body */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key="chat-body"
            initial={{ height: 0 }}
            animate={{ height: 480 }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="flex flex-col overflow-hidden"
          >
            {/* Chat Area */}
            <div className="overflow-y-auto p-5 space-y-5 bg-slate-50" style={{ height: 400 }}>
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8">
                  <Database className="w-12 h-12 text-slate-300" />
                  <div>
                    <p className="text-slate-600 font-medium text-sm">Hỏi dữ liệu bằng ngôn ngữ tự nhiên</p>
                    <p className="text-xs text-slate-400 mt-1">Ví dụ: "Hôm nay có bao nhiêu tin tuyển dụng mới?"</p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {['Tổng doanh thu hôm nay?', 'Bao nhiêu user mới tuần này?', 'JD nào bị từ chối nhiều nhất?'].map(q => (
                      <button
                        key={q}
                        onClick={() => handleSend(q)}
                        className="text-xs bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-full hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-500/20'
                        : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm'
                    }`}>
                      {msg.role === 'agent' && (
                        <div className="flex items-center gap-2 mb-3 text-indigo-600 font-semibold text-xs uppercase tracking-wider">
                          <Bot className="w-4 h-4" /> Workly Agent
                        </div>
                      )}

                      {msg.isLoading ? (
                        <div className="flex items-center gap-3 text-indigo-500 py-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-sm font-medium animate-pulse">Đang phân tích dữ liệu & SQL...</span>
                        </div>
                      ) : (
                        <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{formatMarkdown(msg.content)}</div>
                      )}

                      {msg.details?.sql && (
                        <div className="mt-4 pt-4 border-t border-slate-100/60">
                          <button
                            onClick={() => setExpandedDetails(expandedDetails === msg.id ? null : msg.id)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-all w-fit"
                          >
                            {expandedDetails === msg.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {expandedDetails === msg.id ? 'Thu gọn log' : 'Xem tiến trình Multi-Agent'}
                          </button>
                          <AnimatePresence>
                            {expandedDetails === msg.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="mt-2 space-y-2 overflow-hidden"
                              >
                                <div className="bg-slate-50 rounded-lg p-2.5 text-xs border border-slate-200">
                                  <div className="flex items-center gap-1.5 text-emerald-600 font-semibold mb-1.5">
                                    <CheckCircle className="w-3.5 h-3.5" /> SqlGeneratorAgent
                                  </div>
                                  <code className="text-slate-600 font-mono break-all">{msg.details.sql}</code>
                                  {(msg.details as any).attempts > 1 && (
                                    <div className="mt-1.5 text-amber-600 flex items-center gap-1 font-medium">
                                      <AlertCircle className="w-3 h-3" /> Tự sửa sau {(msg.details as any).attempts} lần
                                    </div>
                                  )}
                                </div>
                                {msg.details.data && (
                                  <div className="bg-slate-50 rounded-lg p-2.5 text-xs border border-slate-200">
                                    <div className="flex items-center gap-1.5 text-blue-600 font-semibold mb-1.5">
                                      <Database className="w-3.5 h-3.5" /> ResultValidatorAgent
                                    </div>
                                    <pre className="text-slate-500 font-mono overflow-auto max-h-24">
                                      {JSON.stringify(msg.details.data, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-slate-200" style={{ height: 80 }}>
              <form onSubmit={handleSubmit} className="relative h-full">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  placeholder="Nhập câu hỏi bằng ngôn ngữ tự nhiên..."
                  className="w-full h-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-14 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-9 bg-indigo-600 text-white rounded-lg px-4 flex items-center gap-1.5 hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm text-sm font-medium"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
