import React from "react";
import { Loader2, ChevronRight } from "lucide-react";

interface CVReviewFooterProps {
  onClose: () => void;
  isSubmitting: boolean;
}

export const CVReviewFooter: React.FC<CVReviewFooterProps> = ({ onClose, isSubmitting }) => {
  return (
    <div className="p-8 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
      <div className="flex items-center gap-3 text-slate-400">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-[11px] font-black uppercase tracking-widest">Đã sẵn sàng đồng bộ</span>
      </div>
      <div className="flex gap-4 w-full sm:w-auto">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-8 py-4 bg-slate-50 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95 border border-slate-200 w-full sm:w-auto"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          form="cv-review-form"
          disabled={isSubmitting}
          className="px-10 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Đang đồng bộ...
            </>
          ) : (
            <>
              Xác nhận hồ sơ
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
