import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  metadata?: any;
}

interface AiChatState {
  isOpen: boolean;
  messages: ChatMessage[];
  isTyping: boolean;
  botContext: any;
  setIsOpen: (isOpen: boolean) => void;
  toggleChat: () => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  setTyping: (isTyping: boolean) => void;
  clearChat: () => void;
  setBotContext: (context: any) => void;
}

export const useAiChatStore = create<AiChatState>((set) => ({
  isOpen: false,
  messages: [
    {
      id: 'welcome',
      role: 'ai',
      content: 'Chào bạn! Tôi là Workly AI Assistant. Tôi có thể giúp gì cho bạn trong việc tìm kiếm việc làm hoặc tuyển dụng hôm nay?',
      timestamp: new Date()
    }
  ],
  isTyping: false,
  botContext: null,
  setIsOpen: (isOpen) => set({ isOpen }),
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map((msg) => msg.id === id ? { ...msg, ...updates } : msg)
  })),
  setTyping: (isTyping) => set({ isTyping }),
  clearChat: () => set({
    messages: [
      {
        id: 'welcome',
        role: 'ai',
        content: 'Chào bạn! Tôi là Workly AI Assistant. Tôi có thể giúp gì cho bạn hôm nay?',
        timestamp: new Date()
      }
    ]
  }),
  setBotContext: (botContext) => set({ botContext })
}));
