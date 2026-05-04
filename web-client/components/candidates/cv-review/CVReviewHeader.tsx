import React from "react";
import { X, Sparkles, ArrowRight } from "lucide-react";

interface CVReviewHeaderProps {
  onClose: () => void;
}

export const CVReviewHeader: React.FC<CVReviewHeaderProps> = ({ onClose }) => {
  return (
    <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10 flex justify-between items-center">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">AI Review Mode</span>
          </div>
          <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            Xác nhận hồ sơ
            <ArrowRight className="w-6 h-6 text-blue-400" />
          </h2>
          <p className="text-slate-400 font-medium text-sm">Vui lòng tinh chỉnh các thông tin mà AI đã nhận diện từ bản CV của bạn.</p>
        </div>
        <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 active:scale-90">
          <X className="w-6 h-6 text-white/50" />
        </button>
      </div>
    </div>
  );
};
