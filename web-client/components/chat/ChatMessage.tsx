'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { Bot, User, Sparkles, ArrowRight, Crown } from 'lucide-react';
import ChatJobCard from './ChatJobCard';
import HumanSupportButton from './HumanSupportButton';

interface ChatMessageProps {
  msg: any;
  onClose?: () => void;
}

export function ChatMessage({ msg, onClose }: ChatMessageProps) {
  const isUser = msg.role === 'user';
  const hasContent = msg.content && msg.content.trim().length > 0;
  const hasMetadata = msg.metadata?.action && msg.metadata?.payload;

  if (!hasContent && !hasMetadata) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex gap-3 max-w-[88%] items-start ${isUser ? 'flex-row-reverse' : ''}`}>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
          isUser ? 'bg-indigo-600 text-white' : 'bg-white text-blue-600 border border-slate-100'
        }`}>
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>
        
        <div className={`p-4 rounded-2xl shadow-md transition-all ${
          isUser
            ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white rounded-tr-none'
            : 'bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 rounded-tl-none'
        }`}>
          {hasContent && (
            <div className="text-sm leading-relaxed overflow-hidden [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 [&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-2 [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-2 [&_strong]:font-bold [&_strong]:text-slate-900">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Action Renderers */}
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

          {msg.metadata?.action === 'PREFILL_JOB' && msg.metadata?.payload && (
            <div className="mt-4 border border-indigo-100 bg-indigo-50/50 rounded-xl p-4 shadow-sm">
              <h4 className="font-bold text-indigo-900 mb-2 line-clamp-1 flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-500" /> Bản nháp JD
              </h4>
              <div className="text-[13px] text-slate-600 mb-4 space-y-1.5">
                <p><strong>Vị trí:</strong> {msg.metadata.payload.title || 'Chưa xác định'}</p>
                <p><strong>Loại:</strong> {msg.metadata.payload.jobType}</p>
                <p><strong>Lương:</strong> {msg.metadata.payload.salaryMin ? `${new Intl.NumberFormat('vi-VN').format(msg.metadata.payload.salaryMin)}đ` : 'Thỏa thuận'}</p>
                <p><strong>Kỹ năng:</strong> {(msg.metadata.payload.hardSkills || []).slice(0, 3).join(', ')}</p>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('aiPrefillJobData', JSON.stringify({ ...msg.metadata.payload, isAiGenerated: true }));
                  if (onClose) onClose();
                  window.location.href = '/recruiter/post-job';
                }}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-2.5 text-sm font-bold transition-all shadow-md shadow-indigo-600/20 active:scale-95"
              >
                <Sparkles className="w-4 h-4" /> Đi tới Form Đăng Tin
              </button>
            </div>
          )}

          {msg.metadata?.action === 'SHOW_UPGRADE_CTA' && msg.metadata?.payload && (
            <div className="mt-3 rounded-2xl overflow-hidden border border-indigo-200 shadow-md">
              <div className="bg-gradient-to-r from-indigo-600 to-blue-600 p-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-amber-300" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">Nâng cấp tài khoản</span>
                </div>
                <p className="font-bold text-base leading-snug">{msg.metadata.payload.title}</p>
                <p className="text-indigo-200 text-[12px] mt-1">{msg.metadata.payload.subtitle}</p>
              </div>
              <div className="bg-white px-4 py-3 space-y-1.5">
                {[
                  '🤖 Tạo JD tự động bằng AI',
                  '🎯 AI Cố Vấn & tự động sửa JD',
                  '📊 AI Insights phân tích nhân sự',
                  '🔓 Tăng quota đăng tin & mở khóa CV',
                ].map((f, i) => (
                  <p key={i} className="text-[12px] text-slate-600 font-medium">{f}</p>
                ))}
              </div>
              <div className="bg-white px-4 pb-4">
                <button
                  onClick={() => { if (onClose) onClose(); window.location.href = msg.metadata.payload.ctaLink; }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-90 text-white rounded-xl py-2.5 text-sm font-bold transition-all shadow-md active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {msg.metadata.payload.ctaText}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
