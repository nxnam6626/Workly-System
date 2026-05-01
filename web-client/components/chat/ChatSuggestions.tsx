'use client';

import { Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface ChatSuggestionsProps {
  onSuggest: (text: string) => void;
  hasAiCapability: boolean;
}

export function ChatSuggestions({ onSuggest, hasAiCapability }: ChatSuggestionsProps) {
  const pathname = usePathname() || '';

  return (
    <div className="px-4 pb-2 bg-white flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
      {pathname.includes('/candidates/profile') && (
        <>
          <button
            onClick={() => onSuggest('Đánh giá CV của tôi')}
            className="text-[13px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-colors"
          >
            Đánh giá CV của tôi
          </button>
          <button
            onClick={() => onSuggest('Gợi ý việc làm phù hợp với CV này')}
            className="text-[13px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-3 py-1.5 rounded-full font-medium hover:bg-emerald-100 transition-colors"
          >
            Gợi ý việc làm phù hợp
          </button>
        </>
      )}
      {pathname.includes('/recruiter') && (
        <>
          {hasAiCapability ? (
            <button
              onClick={() => onSuggest('Đăng tin tuyển 2 lập trình viên Frontend ReactJS lương 15-20 triệu')}
              className="text-[13px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" /> Tạo tin tuyển dụng
            </button>
          ) : (
            <button
              onClick={() => onSuggest('Hướng dẫn đăng tin tuyển dụng chuẩn SEO trên hệ thống Workly')}
              className="text-[13px] bg-indigo-50 text-indigo-600 border border-indigo-100 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-colors flex items-center gap-1.5 shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5" /> Hướng dẫn đăng JD
            </button>
          )}
          <button
            onClick={() => onSuggest('Ví của tôi còn bao nhiêu xu?')}
            className="text-[13px] bg-amber-50 text-amber-600 border border-amber-100 px-3 py-1.5 rounded-full font-medium hover:bg-amber-100 transition-colors flex items-center gap-1.5 shrink-0"
          >
            Check số dư ví
          </button>
        </>
      )}
    </div>
  );
}
