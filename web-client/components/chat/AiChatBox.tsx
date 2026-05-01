'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api';
import { MessageSquare, Sparkles } from 'lucide-react';
import { useAiChatStore } from '@/stores/aiChatStore';
import io, { Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import api from '@/lib/api';

// Sub-components
import { ChatHeader } from './ChatHeader';
import { ChatMessageList } from './ChatMessageList';
import { ChatSuggestions } from './ChatSuggestions';
import { ChatInput } from './ChatInput';

export default function AiChatBox() {
  const {
    isOpen, setIsOpen, messages, addMessage, updateMessage, isTyping, setTyping
  } = useAiChatStore();
  
  const socketRef = useRef<Socket | null>(null);
  const pathname = usePathname() || '';
  const { user } = useAuthStore();
  const [hasAiCapability, setHasAiCapability] = useState(false);

  useEffect(() => {
    if (user?.roles?.includes('RECRUITER')) {
      api.get('/subscriptions/current').then(res => {
        if (res.data?.planType === 'LITE' || res.data?.planType === 'GROWTH') {
          setHasAiCapability(true);
        }
      }).catch(() => { });
    }
  }, [user]);

  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(`${API_BASE_URL}/ai-chat`);

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
  }, []);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const currentInput = text.trim();
    addMessage({
      id: Date.now().toString(),
      role: 'user',
      content: currentInput,
      timestamp: new Date()
    });
    setTyping(true);

    const { accessToken } = useAuthStore.getState();
    const userContextMode = pathname.includes('/recruiter') || pathname.includes('/admin') ? 'RECRUITER' : 'CANDIDATE';
    const streamUrl = `${API_BASE_URL}/ai/chat-stream?message=${encodeURIComponent(currentInput)}&context=${userContextMode}${accessToken ? `&token=${accessToken}` : ''}`;

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
            let content = line.slice(5); 
            if (content.startsWith(' ')) content = content.slice(1);

            if (content) {
              if (content.startsWith('"') && content.endsWith('"')) {
                content = content.slice(1, -1)
                  .replace(/\\n/g, '\n')
                  .replace(/\\"/g, '"');
              }

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
              updateMessage(aiMessageId, { content: fullContent.replace(/__NEWLINE__/g, '\n') });
            }
          }
        }
      }
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
            <ChatHeader onClose={() => setIsOpen(false)} />

            <ChatMessageList messages={messages} isTyping={isTyping} onClose={() => setIsOpen(false)} />

            {!isTyping && messages.length > 0 && (
              <ChatSuggestions onSuggest={handleSend} hasAiCapability={hasAiCapability} />
            )}

            <ChatInput onSend={handleSend} disabled={isTyping} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
