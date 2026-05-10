import React from 'react';
import Link from 'next/link';
import {
  Eye, Edit, Users, BarChart, Bot, Sparkles,
  RefreshCw, AlertTriangle, Clock, Lock, XCircle, CheckCircle2
} from 'lucide-react';
import { Job, TabType, ActionType } from '@/types/job';

interface JobsTableProps {
  paginatedJobs: Job[];
  selectedIds: string[];
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  filteredJobs: Job[];
  activeTab: TabType;
  setActionState: (state: { id?: string, type: ActionType } | null) => void;
  setSelectedJobId: (id: string | null) => void;
  formatText: (text: string) => React.ReactNode;
}

export const JobsTable = ({
  paginatedJobs,
  selectedIds,
  toggleSelect,
  toggleSelectAll,
  filteredJobs,
  activeTab,
  setActionState,
  setSelectedJobId,
  formatText
}: JobsTableProps) => {
  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filteredJobs.length && filteredJobs.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tin tuyển dụng</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Ứng viên / Lượt xem</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedJobs.length > 0 ? (
              paginatedJobs.map((job) => (
                <tr key={job.jobPostingId} className="group hover:bg-slate-50/80 transition-all duration-200">
                  <td className="px-6 py-6">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(job.jobPostingId)}
                      onChange={() => toggleSelect(job.jobPostingId)}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-6 min-w-[300px]">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/recruiter/jobs/${job.jobPostingId}`}
                          className="text-sm font-black text-slate-800 hover:text-indigo-600 transition-colors leading-tight"
                        >
                          {job.title}
                        </Link>
                        {job.jobTier === 'URGENT' && (
                          <span className="px-1.5 py-0.5 bg-rose-50 text-rose-600 text-[9px] font-black rounded border border-rose-100 uppercase tracking-tighter">Gấp</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-bold uppercase tracking-tight">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(job.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        {job.structuredRequirements?.isAiGenerated && (
                          <div className="flex items-center gap-1 text-indigo-500">
                            <Bot className="w-3 h-3" />
                            <span>AI Optimized</span>
                          </div>
                        )}
                      </div>
                      {job.status === 'REJECTED' && job.structuredRequirements?.aiFeedback && (
                        <div className="mt-3 p-3 bg-rose-50/50 rounded-xl border border-rose-100/50">
                          <div className="flex items-center gap-1.5 text-rose-600 mb-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="text-[10px] font-black uppercase">Phản hồi từ hệ thống</span>
                          </div>
                          <div className="text-[11px] text-slate-600 italic leading-relaxed">
                            {formatText(Array.isArray(job.structuredRequirements.aiFeedback)
                              ? job.structuredRequirements.aiFeedback[0]
                              : job.structuredRequirements.aiFeedback
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/60 border border-indigo-100/50 rounded-xl hover:bg-indigo-100/80 transition-all cursor-default"
                        title="Số lượng ứng viên phù hợp"
                      >
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span className="text-indigo-700 font-black text-xs whitespace-nowrap">{job.matchedCount} Match</span>
                      </div>

                      <div
                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50/60 border border-emerald-100/50 rounded-xl hover:bg-emerald-100/80 transition-all cursor-default"
                        title="Số lượt xem tin tuyển dụng"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700 font-black text-xs whitespace-nowrap">{job.viewCount} View</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${job.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        job.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          job.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                            job.status === 'PAUSED' ? 'bg-slate-100 text-slate-500 border-slate-200' :
                              'bg-slate-200 text-slate-700 border-slate-300'
                        }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${job.status === 'APPROVED' ? 'bg-emerald-500' :
                          job.status === 'PENDING' ? 'bg-amber-500' :
                            job.status === 'REJECTED' ? 'bg-rose-500' :
                              job.status === 'PAUSED' ? 'bg-slate-400' : 'bg-slate-600'
                          }`} />
                        {job.status === 'APPROVED' ? 'Đang hiển thị' :
                          job.status === 'PENDING' ? 'Chờ kiểm duyệt' :
                            job.status === 'REJECTED' ? 'Đã từ chối' :
                              job.status === 'PAUSED' ? 'Đang tạm dừng' : 'Đã kết thúc'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/recruiter/jobs/${job.jobPostingId}`}
                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:shadow-lg hover:shadow-indigo-50 transition-all group/btn"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4.5 h-4.5 group-hover/btn:scale-110 transition-transform" />
                      </Link>

                      {['APPROVED', 'PAUSED', 'PENDING', 'REJECTED'].includes(job.status) && (
                        <Link
                          href={`/recruiter/edit-job/${job.jobPostingId}`}
                          className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-amber-500 hover:border-amber-100 hover:shadow-lg hover:shadow-amber-50 transition-all group/btn"
                          title="Chỉnh sửa"
                        >
                          <Edit className="w-4.5 h-4.5 group-hover/btn:scale-110 transition-transform" />
                        </Link>
                      )}

                      <button
                        onClick={() => setSelectedJobId(job.jobPostingId)}
                        className="p-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-100 transition-all group/btn"
                        title="Gợi ý ứng viên AI"
                      >
                        <Sparkles className="w-4.5 h-4.5 group-hover/btn:rotate-12 transition-transform" />
                      </button>

                      {job.status === 'EXPIRED' && (
                        <button
                          onClick={() => setActionState({ id: job.jobPostingId, type: 'RENEW' })}
                          className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white hover:shadow-lg hover:shadow-emerald-100 transition-all group/btn"
                          title="Gia hạn"
                        >
                          <RefreshCw className="w-4.5 h-4.5 group-hover/btn:rotate-180 transition-transform duration-500" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200">
                      <Briefcase className="w-10 h-10" />
                    </div>
                    <div>
                      <p className="text-slate-900 font-black">Không tìm thấy tin tuyển dụng nào</p>
                      <p className="text-slate-400 text-sm font-medium mt-1">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Helper for row icon (Briefcase used in empty state)
const Briefcase = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);
