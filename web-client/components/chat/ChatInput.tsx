'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="p-4 bg-white border-t border-slate-100">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Hỏi Workly AI về lộ trình, CV hoặc việc làm..."
          className="w-full bg-slate-100 border-none rounded-2xl py-3.5 pl-4 pr-14 focus:ring-2 focus:ring-blue-500/30 transition-all text-sm text-slate-800 placeholder:text-slate-400/80"
          disabled={disabled}
        />
        <button
          type="submit"
          disabled={!input.trim() || disabled}
          className={`absolute right-1.5 p-2.5 rounded-xl transition-all ${
            input.trim() && !disabled
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
