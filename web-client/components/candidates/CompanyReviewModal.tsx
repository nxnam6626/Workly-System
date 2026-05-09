"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, X, MessageSquare, Shield, CheckCircle2, Loader2, Info } from "lucide-react";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface CompanyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string;
  companyId: string;
  companyName: string;
  onSuccess: () => void;
}

export function CompanyReviewModal({
  isOpen,
  onClose,
  applicationId,
  companyId,
  companyName,
  onSuccess,
}: CompanyReviewModalProps) {
  const [ratingProcess, setRatingProcess] = useState(0);
  const [ratingInterviewer, setRatingInterviewer] = useState(0);
  const [ratingOffice, setRatingOffice] = useState(0);
  const [content, setContent] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hover states for stars
  const [hoverProcess, setHoverProcess] = useState(0);
  const [hoverInterviewer, setHoverInterviewer] = useState(0);
  const [hoverOffice, setHoverOffice] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!ratingProcess || !ratingInterviewer || !ratingOffice) {
      toast.error("Vui lòng đánh giá đủ 3 tiêu chí bằng sao!");
      return;
    }
    if (!content.trim()) {
      toast.error("Vui lòng để lại vài lời nhận xét!");
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/company-reviews/${companyId}/${applicationId}`, {
        ratingProcess,
        ratingInterviewer,
        ratingOffice,
        content,
        isAnonymous,
      });
      toast.success("Đánh giá của bạn đã được gửi thành công!");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || "Có lỗi xảy ra khi gửi đánh giá";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (
    value: number,
    hoverValue: number,
    onChange: (v: number) => void,
    onHover: (v: number) => void
  ) => {
    return (
      <div className="flex items-center gap-1.5" onMouseLeave={() => onHover(0)}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => onHover(star)}
            className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
            type="button"
          >
            <Star
              className={`w-8 h-8 transition-colors duration-200 ${
                (hoverValue || value) >= star
                  ? "fill-[#F97316] text-[#F97316]"
                  : "fill-transparent text-slate-300"
              }`}
              strokeWidth={1.5}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 m-auto z-[101] flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto border border-slate-100"
              style={{ fontFamily: "'Inter', sans-serif" }}
            >
              {/* Header - Bold Minimalism */}
              <div className="p-8 pb-6 border-b border-slate-100 relative">
                <button
                  onClick={onClose}
                  className="absolute right-6 top-6 p-2 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <div className="w-16 h-16 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-[#2563EB]" />
                </div>
                <h2 className="text-4xl font-black text-[#1E293B] tracking-tight leading-tight">
                  Đánh giá<br/>
                  <span className="text-[#2563EB]">{companyName}</span>
                </h2>
                <p className="text-slate-500 mt-3 font-medium text-lg">
                  Chia sẻ trải nghiệm phỏng vấn của bạn để giúp đỡ cộng đồng.
                </p>
              </div>

              {/* Body */}
              <div className="p-8 overflow-y-auto">
                <div className="space-y-10">
                  
                  {/* Rating Criteria */}
                  <div className="space-y-8">
                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-lg font-bold text-slate-900">Quy trình phỏng vấn</label>
                        <span className="text-sm font-bold text-[#F97316]">
                          {ratingProcess > 0 ? `${ratingProcess}/5` : "Chưa chọn"}
                        </span>
                      </div>
                      {renderStars(ratingProcess, hoverProcess, setRatingProcess, setHoverProcess)}
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-lg font-bold text-slate-900">Người phỏng vấn</label>
                        <span className="text-sm font-bold text-[#F97316]">
                          {ratingInterviewer > 0 ? `${ratingInterviewer}/5` : "Chưa chọn"}
                        </span>
                      </div>
                      {renderStars(ratingInterviewer, hoverInterviewer, setRatingInterviewer, setHoverInterviewer)}
                    </div>

                    <div>
                      <div className="flex justify-between items-end mb-3">
                        <label className="text-lg font-bold text-slate-900">Không gian văn phòng</label>
                        <span className="text-sm font-bold text-[#F97316]">
                          {ratingOffice > 0 ? `${ratingOffice}/5` : "Chưa chọn"}
                        </span>
                      </div>
                      {renderStars(ratingOffice, hoverOffice, setRatingOffice, setHoverOffice)}
                    </div>
                  </div>

                  {/* Feedback Textarea */}
                  <div>
                    <label className="block text-lg font-bold text-slate-900 mb-3">
                      Nhận xét chi tiết <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Công ty có điểm gì tốt? Có gì cần cải thiện không?"
                      className="w-full h-36 p-5 rounded-2xl bg-[#F8FAFC] border-2 border-slate-100 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#2563EB] focus:ring-4 focus:ring-[#2563EB]/10 transition-all resize-none text-lg"
                    />
                  </div>

                  {/* Anonymous Toggle */}
                  <div className="flex items-start gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsAnonymous(!isAnonymous)}
                      className={`relative w-14 h-8 rounded-full transition-colors duration-300 flex-shrink-0 ${
                        isAnonymous ? "bg-[#10B981]" : "bg-slate-300"
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                          isAnonymous ? "left-7" : "left-1"
                        }`}
                      />
                    </button>
                    <div>
                      <p className="font-bold text-slate-900 text-lg flex items-center gap-2">
                        Đánh giá ẩn danh
                        <Shield className="w-5 h-5 text-emerald-500" />
                      </p>
                      <p className="text-slate-500 text-sm mt-1">
                        Danh tính của bạn sẽ được bảo mật. Công ty sẽ không biết ai đã viết đánh giá này.
                      </p>
                    </div>
                  </div>

                </div>
              </div>

              {/* Footer */}
              <div className="p-8 pt-6 border-t border-slate-100 bg-[#F8FAFC] flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-medium">
                  <Info className="w-4 h-4" />
                  Đánh giá không thể sửa sau khi gửi
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={onClose}
                    className="px-6 py-3.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors text-lg"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-8 py-3.5 rounded-xl font-bold text-white bg-[#2563EB] hover:bg-[#1D4ED8] transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 text-lg disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        Gửi đánh giá
                        <CheckCircle2 className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
