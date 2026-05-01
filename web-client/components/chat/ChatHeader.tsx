'use client';

import { Sparkles, Trash2, X } from 'lucide-react';
import { useAiChatStore } from '@/stores/aiChatStore';
import { useConfirm } from '@/components/ui/ConfirmDialog';

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  const { clearChat } = useAiChatStore();
  const confirm = useConfirm();

  const handleClear = async () => {
    const ok = await confirm({
      title: 'Xóa lịch sử trò chuyện',
      message: 'Bạn có muốn xóa toàn bộ lịch sử trò chuyện với AI không? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa tất cả',
      cancelText: 'Giữ lại',
      variant: 'danger',
    });
    if (ok) clearChat();
  };

  return (
    <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 p-5 text-white flex items-center justify-between shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      <div className="flex items-center gap-3 relative z-10">
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
      <div className="flex items-center gap-1 relative z-10">
        <button
          onClick={handleClear}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Xóa lịch sử"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="Đóng"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
