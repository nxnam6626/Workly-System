import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2, Crown, Loader2, Plus, X as CloseIcon } from 'lucide-react';

interface AiAdvisorModalProps {
  setAiModalOpen: (open: boolean) => void;
  aiPrompt: string;
  setAiPrompt: (prompt: string) => void;
  aiGenerating: boolean;
  handleAiGenerate: () => void;
  userPlan: string;
}

export const AiAdvisorModal = ({
  setAiModalOpen,
  aiPrompt,
  setAiPrompt,
  aiGenerating,
  handleAiGenerate,
  userPlan
}: AiAdvisorModalProps) => {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] w-full max-w-4xl overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] border border-white/20 relative"
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/p6.png')]" />

        <div className="relative flex flex-col md:flex-row h-full min-h-[520px]">
          {/* Left Panel */}
          <div className="w-full md:w-80 bg-[#F9F9F7] p-10 border-r border-slate-100 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-60" />

            <div className="relative z-10">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center mb-8 transform -rotate-3">
                <Sparkles className="w-7 h-7 text-indigo-600" />
              </div>
              <h3 style={{ fontFamily: "'Inter', sans-serif" }} className="text-3xl text-[#111110] font-bold leading-[1.1] mb-5">
                Trợ lý <em className="text-indigo-600 not-italic">Sáng tạo</em> JD
              </h3>
              <p className="text-sm text-[#666660] leading-relaxed mb-8 font-medium">
                Cung cấp cho AI những ý chính về công việc, chúng tôi sẽ biến chúng thành một bản JD chuyên nghiệp, chuẩn SEO và thu hút nhân tài.
              </p>

              <div className="space-y-5">
                {[
                  'Tự động đề xuất kỹ năng chuyên sâu',
                  'Tối ưu từ khóa chuẩn SEO ngành',
                  'Cấu trúc văn bản thu hút & hiện đại'
                ].map((text, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-white shadow-sm border border-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                    </div>
                    <p className="text-[11px] text-[#444440] font-bold uppercase tracking-wider">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`relative z-10 mt-10 p-5 rounded-2xl border backdrop-blur-sm transition-all duration-500 ${userPlan === 'GROWTH' ? 'bg-amber-50/80 border-amber-200 shadow-sm' :
                userPlan === 'LITE' ? 'bg-indigo-50/80 border-indigo-200 shadow-sm' :
                  'bg-slate-100 border-slate-200'
              }`}>
              <div className="flex items-center gap-2 mb-2.5">
                <Crown className={`w-4 h-4 ${userPlan === 'GROWTH' ? 'text-amber-600' : userPlan === 'LITE' ? 'text-indigo-600' : 'text-slate-500'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#111110]">
                  {userPlan === 'GROWTH' ? 'Growth Engine' : userPlan === 'LITE' ? 'Lite Engine' : 'Basic Engine'}
                </span>
              </div>
              <p className="text-[11px] text-[#666660] leading-snug font-medium">
                {userPlan === 'GROWTH' ? 'Đang kích hoạt mô hình AI cao cấp nhất để tối ưu hóa tỷ lệ chuyển đổi JD.' :
                  userPlan === 'LITE' ? 'Hỗ trợ viết JD cơ bản và tự động hóa trích xuất kỹ năng chuyên môn.' :
                    'Nâng cấp để mở khóa toàn bộ sức mạnh AI và tối ưu hóa SEO chuyên sâu.'}
              </p>
            </div>
          </div>

          {/* Right Panel */}
          <div className="flex-1 p-10 flex flex-col bg-white">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#A0A090] mb-1">Input Workspace</h4>
                <p className="text-[11px] text-[#BEBDB5] font-medium italic">Dán mô tả thô hoặc các ý chính vào đây...</p>
              </div>
              <button onClick={() => setAiModalOpen(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-all hover:rotate-90">
                <CloseIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 relative group">
              <div className="absolute inset-0 bg-[#FAF9F6] rounded-[2rem] opacity-40 pointer-events-none border border-slate-100" />
              <textarea
                className="relative w-full h-full min-h-[320px] p-8 bg-transparent outline-none resize-none transition-all text-[#111110] placeholder-[#D0CFCA] font-medium leading-relaxed text-base"
                placeholder={"Ví dụ: [FPT SHOP] Cần tuyển Nhân viên tư vấn bán hàng tại Đà Nẵng...\nĐịa điểm: Hải Châu, Thanh Khê\nMô tả: Tư vấn sản phẩm, hướng dẫn khách hàng...\nYêu cầu: 18-28 tuổi, thân thiện...\nQuyền lợi: Lương 8-15tr, đầy đủ BHXH..."}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                disabled={aiGenerating}
              />
              <div className="absolute bottom-6 right-6 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                <span className="px-3 py-1.5 bg-white border border-[#E8E8E2] rounded-xl text-[10px] text-[#999890] font-black uppercase tracking-widest shadow-sm">
                  {aiPrompt.length} chars
                </span>
                <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] text-indigo-600 font-black uppercase tracking-widest shadow-sm">
                  {aiPrompt.split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setAiPrompt(aiPrompt + (aiPrompt ? "\n\n" : "") + "Địa điểm: \nMô tả: \nYêu cầu: \nQuyền lợi: ")}
                  className="flex items-center gap-2 text-[10px] font-black text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-[0.2em] group"
                >
                  <Plus className="w-3.5 h-3.5 transition-transform group-hover:rotate-90" />
                  Thêm cấu trúc mẫu
                </button>
              </div>

              <div className="flex items-center gap-5 w-full sm:w-auto">
                <button
                  disabled={aiGenerating}
                  onClick={() => setAiModalOpen(false)}
                  className="flex-1 sm:flex-none text-[11px] font-black uppercase tracking-[0.2em] text-[#BEBDB5] hover:text-[#111110] transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={handleAiGenerate}
                  disabled={aiGenerating || !aiPrompt.trim()}
                  className="flex-1 sm:flex-none relative overflow-hidden group bg-[#111110] text-white px-10 py-4 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-xl shadow-slate-200"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_100%] animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="relative flex items-center justify-center gap-3">
                    {aiGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{aiGenerating ? 'AI đang soạn thảo...' : 'Phát sinh JD ngay'}</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
