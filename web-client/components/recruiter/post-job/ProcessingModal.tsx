import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Users, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export type ProcessingStatus = 'moderating' | 'matching' | 'inviting' | 'done';

interface ProcessingModalProps {
  isOpen: boolean;
  status: ProcessingStatus;
  matchedCount: number;
  invitedCount: number;
  autoInviteMatches: boolean;
  onClose: () => void;
}

export function ProcessingModal({
  isOpen,
  status,
  matchedCount,
  invitedCount,
  autoInviteMatches,
  onClose,
}: ProcessingModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  const steps = [
    {
      id: 'moderating',
      label: 'AI đang kiểm duyệt nội dung an toàn',
      icon: ShieldCheck,
      isActive: status === 'moderating',
      isPast: ['matching', 'inviting', 'done'].includes(status),
      color: 'text-indigo-500',
      bg: 'bg-indigo-100',
    },
    {
      id: 'matching',
      label: 'AI phân tích độ phù hợp với mạng lưới ứng viên',
      icon: Users,
      isActive: status === 'matching',
      isPast: ['inviting', 'done'].includes(status),
      color: 'text-blue-500',
      bg: 'bg-blue-100',
      extra: ['inviting', 'done'].includes(status) && (
        <span className="ml-2 font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md text-xs">
          Tìm thấy {matchedCount} ứng viên
        </span>
      ),
    },
  ];

  if (autoInviteMatches) {
    steps.push({
      id: 'inviting',
      label: 'Hệ thống tự động gửi lời mời phỏng vấn',
      icon: Zap,
      isActive: status === 'inviting',
      isPast: status === 'done',
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      extra: status === 'done' && (
        <span className="ml-2 font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md text-xs">
          Đã gửi {invitedCount} lời mời
        </span>
      ),
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-8 pb-6 text-center space-y-2 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500" />
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-sm">
            {status === 'done' ? (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </motion.div>
            ) : (
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            )}
          </div>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">
            {status === 'done' ? 'Đăng tin thành công!' : 'Đang xử lý tin tuyển dụng'}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {status === 'done'
              ? 'Tin của bạn đã sẵn sàng tiếp cận ứng viên.'
              : 'Hệ thống AI đang thực hiện chuỗi tác vụ tự động...'}
          </p>
        </div>

        {/* Steps */}
        <div className="p-8 pt-2 bg-slate-50/50">
          <div className="space-y-6">
            {steps.map((step, idx) => (
              <div key={step.id} className="relative flex items-start gap-4">
                {idx !== steps.length - 1 && (
                  <div
                    className={`absolute left-5 top-10 bottom-[-24px] w-[2px] rounded-full transition-colors duration-500 ${
                      step.isPast ? 'bg-indigo-200' : 'bg-slate-200'
                    }`}
                  />
                )}
                
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500 shadow-sm ${
                    step.isPast
                      ? 'bg-emerald-500 text-white shadow-emerald-200'
                      : step.isActive
                      ? `${step.bg} ${step.color} shadow-indigo-100 ring-4 ring-indigo-50`
                      : 'bg-white border-2 border-slate-200 text-slate-300'
                  }`}
                >
                  {step.isPast ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <step.icon className={`w-5 h-5 ${step.isActive ? 'animate-pulse' : ''}`} />
                  )}
                </div>

                <div className="pt-2.5">
                  <p
                    className={`text-sm font-bold transition-colors duration-500 ${
                      step.isPast
                        ? 'text-slate-800'
                        : step.isActive
                        ? 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </p>
                  {step.extra && <div className="mt-1.5">{step.extra}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 flex gap-3">
          <AnimatePresence mode="wait">
            {status === 'done' ? (
              <motion.button
                key="done-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => router.push('/recruiter/jobs')}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-colors shadow-lg shadow-slate-200"
              >
                Quản lý tin tuyển dụng <ArrowRight className="w-4 h-4" />
              </motion.button>
            ) : (
              <motion.button
                key="bg-btn"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onClick={() => router.push('/recruiter/jobs')}
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors"
              >
                Thu nhỏ & Chạy ngầm
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
