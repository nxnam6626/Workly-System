"use client";

import React, { useState } from "react";
import { X, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/api";

interface ReportReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  onSuccess: () => void;
}

export default function ReportReviewModal({ isOpen, onClose, reviewId, onSuccess }: ReportReviewModalProps) {
  const [reason, setReason] = useState("FALSE_INFORMATION");
  const [evidence, setEvidence] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidence.trim()) {
      toast.error("Vui lòng cung cấp giải trình và bằng chứng.");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/company-reviews/${reviewId}/report`, {
        reason,
        evidence
      });
      toast.success("Báo cáo thành công. Admin sẽ xem xét và phản hồi.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Có lỗi xảy ra khi gửi báo cáo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 border border-red-100 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Báo cáo đánh giá sai sự thật</h2>
              <p className="text-xs text-slate-500">Gửi yêu cầu cho Admin xem xét và xóa bỏ</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="leading-relaxed">
              Bạn chỉ nên báo cáo những đánh giá cố ý bôi nhọ, chửi bới, hoặc đưa thông tin sai lệch về công ty. Việc lạm dụng báo cáo có thể bị phạt.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Lý do báo cáo <span className="text-red-500">*</span></label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all font-medium"
            >
              <option value="FALSE_INFORMATION">Thông tin sai sự thật / Bôi nhọ</option>
              <option value="OFFENSIVE">Ngôn từ xúc phạm / Chửi thề</option>
              <option value="SPAM">Spam / Quảng cáo</option>
              <option value="OTHER">Lý do khác</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Giải trình & Bằng chứng <span className="text-red-500">*</span></label>
            <p className="text-xs text-slate-500 mb-1">Hãy giải thích tại sao đánh giá này sai sự thật, và cung cấp link chứa ảnh bằng chứng (Google Drive, Imgur...).</p>
            <textarea
              required
              rows={4}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Nhập giải trình và dán link bằng chứng tại đây..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:bg-white transition-all resize-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 border border-red-600 rounded-xl hover:bg-red-700 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Đang gửi...</>
              ) : (
                "Gửi báo cáo"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
