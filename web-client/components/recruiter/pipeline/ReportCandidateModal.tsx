import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send, ShieldAlert } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

interface ReportCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  applicationId?: string;
  candidateName: string;
}

export default function ReportCandidateModal({ isOpen, onClose, candidateId, applicationId, candidateName }: ReportCandidateModalProps) {
  const [reason, setReason] = useState('NO_SHOW');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reasons = [
    { id: 'NO_SHOW', label: 'Không đến phỏng vấn', description: 'Ứng viên đã xác nhận nhưng không xuất hiện và không báo trước.' },
    { id: 'SABOTAGE', label: 'Phá hoại / Thái độ xấu', description: 'Ứng viên có hành vi thiếu tôn trọng hoặc cố tình gây rối.' },
    { id: 'FRAUD', label: 'Gian lận thông tin', description: 'Hồ sơ hoặc thông tin ứng viên cung cấp không đúng sự thật.' },
    { id: 'OTHER', label: 'Lý do khác', description: 'Các trường hợp vi phạm quy chuẩn tuyển dụng khác.' },
  ];

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('Vui lòng nhập chi tiết lý do báo cáo');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post(`/reports/candidate/${candidateId}`, {
        applicationId,
        reason,
        content
      });
      toast.success('Báo cáo đã được gửi. Quản trị viên sẽ xem xét hành vi này.');
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
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] max-w-[95vw] bg-white rounded-[2rem] shadow-2xl z-[201] overflow-hidden border border-red-100"
          >
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center">
                    <ShieldAlert size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900">Báo cáo ứng viên</h2>
                    <p className="text-sm font-bold text-slate-500">Đối với ứng viên <span className="text-red-500">{candidateName}</span></p>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-3">
                  {reasons.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setReason(r.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all ${
                        reason === r.id 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <p className={`text-sm font-black ${reason === r.id ? 'text-red-600' : 'text-slate-700'}`}>{r.label}</p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5">{r.description}</p>
                    </button>
                  ))}
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Chi tiết hành vi</label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all resize-none text-slate-700 font-medium"
                    placeholder="Mô tả cụ thể sự việc để Admin có cơ sở xử lý..."
                  />
                </div>

                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                  <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                  <p className="text-[10px] font-bold text-amber-700 leading-relaxed">
                    Lưu ý: Báo cáo sai sự thật có thể ảnh hưởng đến uy tín của tài khoản nhà tuyển dụng. Vui lòng chỉ báo cáo các hành vi thực sự vi phạm.
                  </p>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:shadow-xl hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Gửi báo cáo vi phạm
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
