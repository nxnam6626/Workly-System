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
    
    let jobSlug = '';
    if (pathname.includes('/jobs/')) {
      const parts = pathname.split('/jobs/');
      if (parts[1]) {
        jobSlug = parts[1].split('/')[0];
      }
    }
    
    const streamUrl = `${API_BASE_URL}/ai/chat-stream?message=${encodeURIComponent(currentInput)}&context=${userContextMode}${jobSlug ? `&jobSlug=${encodeURIComponent(jobSlug)}` : ''}${accessToken ? `&token=${accessToken}` : ''}`;

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
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="absolute bottom-0 right-0 w-14 h-14 bg-gradient-to-br from-[#1e60ad] via-blue-600 to-indigo-600 text-white rounded-full shadow-[0_8px_30px_rgba(30,96,173,0.3)] shadow-[#1e60ad]/40 flex items-center justify-center group ring-4 ring-[#1e60ad]/20 backdrop-blur-md transition-all duration-300 hover:shadow-[#1e60ad]/60"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-[#1e60ad] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-full" />
            <MessageSquare className="w-6 h-6 relative z-10 drop-shadow-md" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute top-0 right-0 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-white flex items-center justify-center z-20 shadow-sm"
            />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="absolute bottom-0 right-0 w-[380px] sm:w-[420px] h-[580px] bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border border-white/50 ring-1 ring-black/5"
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
