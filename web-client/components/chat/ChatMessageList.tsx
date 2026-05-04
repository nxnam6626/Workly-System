'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bot } from 'lucide-react';
import { ChatMessage } from './ChatMessage';

interface ChatMessageListProps {
  messages: any[];
  isTyping: boolean;
  onClose?: () => void;
}

export function ChatMessageList({ messages, isTyping, onClose }: ChatMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent hover:scrollbar-thumb-slate-300 transition-colors">
      {messages.map((msg) => (
        <ChatMessage key={msg.id} msg={msg} onClose={onClose} />
      ))}

      {isTyping && (
        <div className="flex justify-start">
          <div className="flex gap-3 items-start">
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
  );
}
