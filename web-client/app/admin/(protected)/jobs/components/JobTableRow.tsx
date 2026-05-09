'use client';

import { CheckCircle2, XCircle, Loader2, ShieldAlert, Eye } from 'lucide-react';
import { JobPosting, JobStatus } from '@/lib/admin-api';
import toast from 'react-hot-toast';

const formatMillions = (value?: number | null) => {
  if (!value) return '?';
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN')} Triệu`;
  }
  return value.toLocaleString('vi-VN');
};

interface JobTableRowProps {
  job: JobPosting;
  index: number;
  isSelected: boolean;
  toggleSelect: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onQuickView: (job: JobPosting) => void;
  isProcessing: boolean;
}

export default function JobTableRow({
  job,
  index,
  isSelected,
  toggleSelect,
  onApprove,
  onReject,
  onQuickView,
  isProcessing,
}: JobTableRowProps) {
  return (
    <tr
      key={`${job.jobPostingId}-${index}`}
      className={`group hover:bg-slate-50/80 transition-colors cursor-default ${isSelected ? 'bg-indigo-50/30' : ''}`}
    >
      <td className="px-8 py-4">
        <input
          type="checkbox"
          checked={isSelected}
          disabled={job.status !== JobStatus.PENDING}
          onChange={() => toggleSelect(job.jobPostingId)}
          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        />
      </td>
      <td className="px-8 py-4">
        <div className="flex flex-col min-w-0">
          <span className="text-[14px] font-black tracking-tight text-slate-900 truncate">{job.title}</span>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <span className={`text-[9px] uppercase tracking-widest font-black px-2 py-1 rounded-xl border ${job.jobTier === 'URGENT' ? 'bg-rose-50 text-rose-600 border-rose-200' : job.jobTier === 'PROFESSIONAL' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
              {job.jobTier === 'URGENT' ? 'Tuyển Gấp' : job.jobTier === 'PROFESSIONAL' ? 'Nổi Bật' : 'Tin Thường'}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 min-w-0">
            <span className="text-xs text-slate-500 font-bold truncate max-w-[150px]">{job.company?.companyName || 'Chưa cập nhật công ty'}</span>
            {job.locationCity && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-[11px] font-medium text-slate-400 truncate max-w-[100px]">{job.locationCity}</span>
              </>
            )}
          </div>
        </div>
      </td>
      <td className="px-8 py-4">
        <div className="text-[13px] font-black text-emerald-600 tracking-tight whitespace-nowrap">
          {job.salaryMin || job.salaryMax 
            ? `${formatMillions(job.salaryMin)} - ${formatMillions(job.salaryMax)}${job.currency && job.currency !== 'VND' ? ` ${job.currency}` : ''}`
            : 'Thỏa thuận'}
        </div>
      </td>
      <td className="px-8 py-4">
        <span className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
          {job.jobType || 'Không Rõ'}
        </span>
      </td>
      <td className="px-8 py-4">
        <span
          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap border ${
            job.status === JobStatus.APPROVED
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : job.status === JobStatus.REJECTED
              ? 'bg-rose-50 text-rose-600 border-rose-100'
              : 'bg-amber-50 text-amber-600 border-amber-100'
          }`}
        >
          {job.status === JobStatus.APPROVED ? 'Đã duyệt' : job.status === JobStatus.REJECTED ? 'Từ chối' : 'Chờ duyệt'}
        </span>
      </td>
      <td className="px-8 py-4">
        <div className="flex items-center gap-2 min-w-[120px]">
          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${job.aiReliabilityScore < 60 ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${job.aiReliabilityScore}%` }}
            />
          </div>
          <span className={`text-[11px] font-black tracking-widest ${job.aiReliabilityScore < 60 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {job.aiReliabilityScore}%
          </span>
        </div>
      </td>
      <td className="px-8 py-4 text-right">
        <div className="flex justify-end items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          <button
            onClick={() => onQuickView(job)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg transition-all active:scale-90"
            title="Xem nhanh"
          >
            <Eye className="w-4 h-4" />
          </button>

          <button
            onClick={() => onApprove(job.jobPostingId)}
            disabled={isProcessing || job.status === JobStatus.APPROVED}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg transition-all disabled:opacity-50 active:scale-90"
            title="Duyệt"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-emerald-500" /> : <CheckCircle2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => onReject(job.jobPostingId)}
            disabled={isProcessing || job.status === JobStatus.REJECTED}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:shadow-lg transition-all disabled:opacity-50 active:scale-90"
            title="Từ chối"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
