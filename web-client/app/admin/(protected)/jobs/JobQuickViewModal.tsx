'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Building2,
  MapPin,
  CircleDollarSign,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Briefcase,
  Layers,
} from 'lucide-react';
import { JobPosting, JobStatus, PostType } from '@/lib/admin-jobs-service';

interface Props {
  job: JobPosting | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isProcessing?: boolean;
}

export default function JobQuickViewModal({
  job,
  onClose,
  onApprove,
  onReject,
  isProcessing = false,
}: Props) {
  if (!job) return null;

  const isLowScore = job.aiReliabilityScore < 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-[70] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${job.postType === PostType.CRAWLED ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 line-clamp-1">{job.title}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    job.status === JobStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' :
                    job.status === JobStatus.REJECTED ? 'bg-red-100 text-red-700' :
                    'bg-amber-100 text-amber-700'
                }`}>
                  {job.status}
                </span>
                <span className="text-[10px] font-medium text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">#{job.jobPostingId.slice(-6)}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          {/* AI Score Warning */}
          {isLowScore && job.status === JobStatus.PENDING && (
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-red-50 border border-red-100">
                <div className="p-2 bg-red-100 rounded-xl">
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-red-900">Điểm tin cậy AI thấp ({job.aiReliabilityScore}%)</h4>
                    <p className="text-xs text-red-700 mt-1 leading-relaxed">
                        Hệ thống phát hiện các dấu hiệu bất thường hoặc thiếu thông tin quan trọng. Vui lòng kiểm tra kỹ nội dung trước khi duyệt.
                    </p>
                </div>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Building2 className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Công ty</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{job.companyName}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Địa điểm</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{job.location}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <CircleDollarSign className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Mức lương</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{job.salary || 'Thỏa thuận'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Layers className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Loại tin</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{job.postType === PostType.CRAWLED ? 'Crawler (Tự động)' : 'Thủ công'}</p>
            </div>
          </div>

          {/* AI Analysis */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-500" />
                Phân tích tin cậy AI
            </h3>
            <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Độ tin cậy tổng quát</span>
                    <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${isLowScore ? 'bg-red-500' : 'bg-emerald-500'}`}
                                style={{ width: `${job.aiReliabilityScore}%` }}
                            />
                        </div>
                        <span className={`text-sm font-bold ${isLowScore ? 'text-red-600' : 'text-emerald-600'}`}>
                            {job.aiReliabilityScore}%
                        </span>
                    </div>
                </div>
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-y-3">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Đúng định dạng tiêu đề
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Có thông tin liên hệ
                    </div>
                    <div className={`flex items-center gap-2 text-xs ${isLowScore ? 'text-red-600' : 'text-slate-600'}`}>
                        {isLowScore ? <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                        Mô tả công việc chi tiết
                    </div>
                </div>
            </div>
          </section>

          {/* Description */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Mô tả chi tiết</h3>
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-600 leading-relaxed max-h-96 overflow-y-auto whitespace-pre-wrap">
                {job.description || 'Không có mô tả chi tiết cho vị trí này.'}
            </div>
          </section>

          {/* Links */}
          {job.originalUrl && (
             <div className="pt-4 flex justify-center">
                <a 
                    href={job.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors py-2 px-4 rounded-xl border border-indigo-100 bg-indigo-50/30"
                >
                    <ExternalLink className="w-4 h-4" />
                    Xem trang nguồn gốc bài đăng
                </a>
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white flex items-center gap-4">
            <button
                onClick={() => onReject(job.jobPostingId)}
                disabled={isProcessing || job.status === JobStatus.REJECTED}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 disabled:opacity-50 transition-all"
            >
                <XCircle className="w-4 h-4" />
                Từ chối tin
            </button>
            <button
                onClick={() => onApprove(job.jobPostingId)}
                disabled={isProcessing || job.status === JobStatus.APPROVED}
                className="flex-[2] flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
            >
                <CheckCircle2 className="w-4 h-4" />
                Duyệt tin ngay
            </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
