import React from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";

interface CVReviewHeaderProps {
  onClose: () => void;
}

export const CVReviewHeader: React.FC<CVReviewHeaderProps> = ({ onClose }) => {
  return (
    <div className="px-8 py-4 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">AI Review Mode</span>
            </div>
            <h2 className="text-xl font-black tracking-tighter flex items-center gap-2">
              Xác nhận hồ sơ
              <ArrowRight className="w-5 h-5 text-blue-400" />
            </h2>
          </div>
          <p className="hidden md:block text-slate-500 font-medium text-[11px] max-w-md leading-snug border-l border-slate-800 pl-6 mt-2">
            Vui lòng tinh chỉnh các thông tin mà AI đã nhận diện từ bản CV của bạn để đảm bảo độ chính xác cao nhất.
          </p>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10 active:scale-90">
          <X className="w-5 h-5 text-white/50" />
        </button>
      </div>
    </div>
  );
};
