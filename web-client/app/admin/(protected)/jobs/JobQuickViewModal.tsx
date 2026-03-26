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
  Globe,
  Users,
  Calendar,
  Mail,
  UserCheck,
  Hash,
} from 'lucide-react';
import { JobPosting, JobStatus, PostType } from '@/lib/admin-api';

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
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
      />
      <motion.div
        key="modal"
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
                </span>
                {job.isVerified && (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 uppercase tracking-wider">
                    <UserCheck className="w-3 h-3" />
                     Xác minh
                  </span>
                )}
                <span className="text-xs text-slate-500 font-medium">#{job.jobPostingId.slice(-6)}</span>
                <span className="text-[10px] font-medium text-slate-400">•</span>
                <span className="text-xs text-slate-500 font-medium">Đăng {new Date(job.createdAt).toLocaleDateString('vi-VN')}</span>
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
                <p className="text-sm font-semibold text-slate-900">{job.company?.companyName || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Địa điểm</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{job.locationCity || 'Không rõ'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <CircleDollarSign className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Mức lương</span>
                </div>
                <p className="text-sm font-semibold text-emerald-600">
                  {job.salaryMin || job.salaryMax 
                    ? `${job.salaryMin?.toLocaleString() || '?'} - ${job.salaryMax?.toLocaleString() || '?'} ${job.currency || 'VND'}`
                    : 'Thỏa thuận'}
                </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Briefcase className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Kinh nghiệm</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{job.experience || 'Không yêu cầu'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Layers className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Hình thức</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{job.jobType || 'N/A'}</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Hạn nộp</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Không có'}
                </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <div className="flex items-center gap-2 text-slate-400 mb-1">
                    <Hash className="w-4 h-4" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Số lượng</span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {job.vacancies || 1} người
                </p>
            </div>
          </div>

          {/* Recruiter Info (for Manual Posts) */}
          {job.postType === PostType.MANUAL && job.recruiter && (
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <Mail className="w-5 h-5" />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-indigo-900">Người đăng tuyển</h4>
                    <p className="text-xs text-indigo-700">{job.recruiter.user?.email || 'N/A'}</p>
                </div>
                {job.recruiter.position && (
                  <div className="ml-auto px-3 py-1 bg-white border border-indigo-100 rounded-lg text-[10px] font-bold text-indigo-600 uppercase">
                    {job.recruiter.position}
                  </div>
                )}
            </div>
          )}

          {/* Details Sections */}
          <div className="space-y-6">
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                Mô tả công việc
              </h3>
              <div className={`p-5 rounded-2xl border bg-white shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${!job.description ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                {job.description || 'Không có mô tả công việc (Trống).'}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                Yêu cầu ứng viên
              </h3>
              <div className={`p-5 rounded-2xl border bg-white shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${!job.requirements ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                {job.requirements || 'Không có yêu cầu ứng viên (Trống).'}
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                Quyền lợi
              </h3>
              <div className={`p-5 rounded-2xl border bg-white shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${!job.benefits ? 'text-slate-400 italic' : 'text-slate-600'}`}>
                {job.benefits || 'Không có quyền lợi được liệt kê (Trống).'}
              </div>
            </section>
          </div>

          {/* Company Section */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" />
              Thông tin công ty
            </h3>
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 shadow-sm flex gap-5">
              {job.company?.logo ? (
                <img src={job.company.logo} alt="Logo" className="w-16 h-16 rounded-2xl object-contain bg-white border border-slate-100 shadow-sm" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center border border-slate-100 shadow-sm">
                  <Building2 className="w-8 h-8 text-slate-200" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <h4 className="font-bold text-slate-900">{job.company?.companyName || 'N/A'}</h4>
                <div className="grid grid-cols-1 gap-2 text-xs text-slate-500">
                  {job.company?.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5" /> {job.company.address}
                    </div>
                  )}
                  {job.company?.websiteUrl && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5" />
                      <a href={job.company.websiteUrl} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">{job.company.websiteUrl}</a>
                    </div>
                  )}
                  {job.company?.companySize && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5" /> Quy mô: {job.company.companySize} nhân viên
                    </div>
                  )}
                  {job.company?.description && (
                    <div className="pt-2 italic text-slate-400 mt-2 border-t border-slate-200/50">
                      {job.company.description}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

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
