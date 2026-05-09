import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, ShieldCheck, User } from 'lucide-react';
import RatingStars from './RatingStars';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface WriteReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  applicationId: string;
  onSuccess: () => void;
}

export default function WriteReviewModal({ isOpen, onClose, companyId, applicationId, onSuccess }: WriteReviewModalProps) {
  const [ratingProcess, setRatingProcess] = useState(0);
  const [ratingInterviewer, setRatingInterviewer] = useState(0);
  const [ratingOffice, setRatingOffice] = useState(0);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (ratingProcess === 0 || ratingInterviewer === 0 || ratingOffice === 0) {
      toast.error('Vui lòng đánh giá đủ các tiêu chí');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/company-reviews/${companyId}/${applicationId}`, {
        ratingProcess,
        ratingInterviewer,
        ratingOffice,
        content,
        isAnonymous
      });
      toast.success('Đánh giá của bạn đã được ghi nhận!');
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-w-[95vw] bg-white rounded-[2rem] shadow-2xl z-[101] overflow-hidden border border-slate-100"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 leading-tight">Đánh giá trải nghiệm</h2>
                  <div className="flex items-center gap-1.5 mt-1 text-emerald-600">
                    <ShieldCheck size={14} className="fill-emerald-100" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Đánh giá đã xác thực</span>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-600">Quy trình tuyển dụng</span>
                    <RatingStars rating={ratingProcess} onRatingChange={setRatingProcess} interactive size={24} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-600">Thái độ người phỏng vấn</span>
                    <RatingStars rating={ratingInterviewer} onRatingChange={setRatingInterviewer} interactive size={24} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-600">Môi trường & Văn phòng</span>
                    <RatingStars rating={ratingOffice} onRatingChange={setRatingOffice} interactive size={24} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-600 mb-2">Chia sẻ thêm (Tùy chọn)</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-mariner/10 focus:border-mariner outline-none transition-all resize-none text-slate-700 font-medium"
                    placeholder="Bạn thấy quy trình thế nào? Có gì cần cải thiện không?"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl transition-colors ${isAnonymous ? 'bg-slate-900 text-white' : 'bg-white text-slate-400'}`}>
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 uppercase tracking-wide">Chế độ ẩn danh</p>
                      <p className="text-[10px] font-bold text-slate-500">Tên của bạn sẽ không hiển thị công khai</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isAnonymous ? 'bg-mariner' : 'bg-slate-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isAnonymous ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Gửi đánh giá ngay
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
