'use client';

import { useState, useRef, useEffect } from 'react';
import { adminAnalyticsApi, AnalyticsResponse } from '@/lib/admin-api';
import { Send, Bot, Database, CheckCircle, AlertCircle, Loader2, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  details?: AnalyticsResponse;
  isLoading?: boolean;
};

export function AdminAnalyticsChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [expandedDetails, setExpandedDetails] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
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
    } catch (error) {
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

  return (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[600px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
            <Sparkles className="w-5 h-5 text-indigo-300" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Workly AI Data Analyst</h3>
            <p className="text-xs text-indigo-200">Text-to-SQL Multi-Agent System</p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 relative">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-50 space-y-4">
            <Database className="w-16 h-16 text-slate-400" />
            <div>
              <p className="text-slate-600 font-medium">Bạn có thể hỏi dữ liệu hệ thống bằng ngôn ngữ tự nhiên</p>
              <p className="text-sm text-slate-400 mt-1">Ví dụ: "Hôm nay có bao nhiêu tin tuyển dụng mới?"</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm'
              }`}>
                {msg.role === 'agent' && (
                  <div className="flex items-center gap-2 mb-2 text-indigo-600 font-medium text-sm">
                    <Bot className="w-4 h-4" /> AI Agent 
                  </div>
                )}
                
                {msg.isLoading ? (
                  <div className="flex items-center gap-3 text-slate-500 py-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-sm font-medium animate-pulse">Đang phân tích dữ liệu & viết SQL...</span>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                )}

                {/* Sub-agent debug details */}
                {msg.details && msg.details.sql && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <button 
                      onClick={() => setExpandedDetails(expandedDetails === msg.id ? null : msg.id)}
                      className="flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {expandedDetails === msg.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      Xem chi tiết quá trình xử lý (Multi-Agent)
                    </button>
                    
                    <AnimatePresence>
                      {expandedDetails === msg.id && (
                        <motion.div 
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 space-y-3 overflow-hidden"
                        >
                          <div className="bg-slate-50 rounded-lg p-3 text-xs border border-slate-200">
                            <div className="flex items-center gap-2 text-emerald-600 font-semibold mb-2">
                              <CheckCircle className="w-4 h-4" /> SqlGeneratorAgent
                            </div>
                            <code className="text-slate-600 font-mono break-all">{msg.details.sql}</code>
                            {(msg.details as any).attempts > 1 && (
                              <div className="mt-2 text-amber-600 flex items-center gap-1 font-medium">
                                <AlertCircle className="w-3 h-3" /> Tự sửa lỗi sau {(msg.details as any).attempts} lần thử
                              </div>
                            )}
                          </div>
                          {msg.details.data && (
                            <div className="bg-slate-50 rounded-lg p-3 text-xs border border-slate-200">
                              <div className="flex items-center gap-2 text-blue-600 font-semibold mb-2">
                                <Database className="w-4 h-4" /> ResultValidatorAgent
                              </div>
                              <pre className="text-slate-500 font-mono overflow-auto max-h-32">
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

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200 z-10">
        <form onSubmit={handleSubmit} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Nhập câu hỏi bằng ngôn ngữ tự nhiên..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-5 pr-14 py-4 text-slate-700 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 text-white rounded-lg px-4 flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
