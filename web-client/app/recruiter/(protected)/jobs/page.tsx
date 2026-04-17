'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Search, Edit, Lock, Sparkles, Users, BarChart, RefreshCw, AlertTriangle, Bot } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import Link from 'next/link';
import { MatchedCandidatesModal } from '@/components/recruiter/MatchedCandidatesModal';



const formatText = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-amber-900">{part.slice(2, -2)}</strong>;
        }
        
        const subParts = part.split(/(\(\d+\))/g);
        return (
          <span key={i}>
            {subParts.map((sub, j) => {
              if (/^\(\d+\)$/.test(sub)) {
                return (
                  <span key={j}>
                    <br />
                    <span className="inline-block w-3" />
                    <span className="font-semibold text-amber-700">{sub}</span>
                  </span>
                );
              }
              return <span key={j}>{sub}</span>;
            })}
          </span>
        );
      })}
    </>
  );
};

export default function JobsManagementPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<{ id: string, type: 'LOCK' | 'UNLOCK' | 'RENEW' } | null>(null);
  const [acting, setActing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [planType, setPlanType] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();

  // Kiểm tra gói dịch vụ để hiển thị các tính năng AI phù hợp
  const hasAiAdvisorAccess = planType === 'LITE' || planType === 'GROWTH';

  useEffect(() => {
    fetchJobs();
    api.get('/subscriptions/current')
      .then(res => setPlanType(res.data?.planType ?? null))
      .catch(() => setPlanType(null));
  }, [accessToken]);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (msg: any) => {
      if (msg.title?.includes('Tin tuyển dụng') || msg.title?.includes('Hồ sơ')) {
        fetchJobs();
      }
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket]);

  const fetchJobs = async () => {
    if (!accessToken) return;
    try {
      const { data } = await api.get('/job-postings/my-jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const performAction = async () => {
    if (!actionState) return;
    const { id, type } = actionState;
    setActing(true);
    try {
      if (type === 'RENEW') {
        await api.post(`/job-postings/${id}/renew`);
        setJobs(jobs.map((j) => j.jobPostingId === id ? { ...j, status: 'APPROVED' } : j));
        toast.success('Đã gia hạn tin tuyển dụng thành công');
      } else {
        const newStatus = type === 'LOCK' ? 'CLOSED' : 'APPROVED';
        await api.patch(`/job-postings/${id}`, { status: newStatus });
        setJobs(jobs.map((j) => j.jobPostingId === id ? { ...j, status: newStatus } : j));
        toast.success(type === 'LOCK' ? 'Đã khóa tin tuyển dụng thành công' : 'Đã mở khóa tin tuyển dụng thành công');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setActing(false);
      setActionState(null);
    }
  };

  const STATUS_ORDER: Record<string, number> = {
    'PENDING': 0,
    'APPROVED': 1,
    'EXPIRED': 2,
    'CLOSED': 3,
    'REJECTED': 4
  };

  const filteredJobs = jobs
    .filter(job => {
      const matchSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStatus = statusFilter === 'ALL' || job.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const orderA = STATUS_ORDER[a.status] ?? 99;
      const orderB = STATUS_ORDER[b.status] ?? 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return new Date(b.refreshedAt || b.createdAt).getTime() - new Date(a.refreshedAt || a.createdAt).getTime();
    });

  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Briefcase className="h-8 w-8 text-indigo-600" />
            Quản Lý Tin Tuyển Dụng
          </h1>
          <p className="text-slate-500 mt-2">Theo dõi và cập nhật các vị trí đang tuyển của công ty.</p>
        </div>
        <Link
          href="/recruiter/post-job"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-5 h-5" /> Gửi Yêu Cầu Mới
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to page 1 on search
              }}
              placeholder="Tìm kiếm công việc..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm bg-white"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="APPROVED">Đã duyệt (Đang mở)</option>
            <option value="PENDING">Chờ duyệt</option>
            <option value="EXPIRED">Đã hết hạn</option>
            <option value="CLOSED">Đã khóa</option>
            <option value="REJECTED">Bị từ chối</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Vị trí tuyển dụng</th>
                <th className="px-6 py-4">Trạng thái</th>
                <th className="px-6 py-4">Hồ sơ</th>
                <th className="px-6 py-4">Ngày đăng</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    Đang tải biểu mẫu...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400">
                    Bạn chưa có tin tuyển dụng nào.
                  </td>
                </tr>
              ) : (
                paginatedJobs.map((job) => (
                  <tr key={job.jobPostingId} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800 break-words max-w-[280px] lg:max-w-xs align-top">
                      <Link
                        href={`/recruiter/jobs/${job.jobPostingId}`}
                        className="hover:text-indigo-600 transition-colors inline-block font-bold text-base mb-1"
                      >
                        {job.title}
                      </Link>
                      <div className="mt-1 flex flex-col gap-2">
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border ${job.jobTier === 'URGENT' ? 'bg-rose-50 text-rose-600 border-rose-200' : job.jobTier === 'PROFESSIONAL' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {job.jobTier === 'URGENT' ? 'Tuyển Gấp' : job.jobTier === 'PROFESSIONAL' ? 'Nổi Bật' : 'Tin Thường'}
                          </span>
                          {/* Badge: AI Generated */}
                          {(job.structuredRequirements as any)?.isAiGenerated && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200">
                              <Bot className="w-3 h-3" /> Tạo bởi AI
                            </span>
                          )}
                        </div>
                        {/* AI Advisor: chỉ hiển thị khi có gói LITE hoặc GROWTH và JD không phải AI-generated */}
                        {hasAiAdvisorAccess && !(job.structuredRequirements as any)?.isAiGenerated && (job.structuredRequirements as any)?.aiFeedback && (
                          <details className="group p-3 bg-amber-50/80 border border-amber-200 rounded-xl w-full mt-2 shadow-sm cursor-pointer [&_summary::-webkit-details-marker]:hidden overflow-hidden">
                            <summary className="flex items-center justify-between text-amber-800 outline-none">
                              <div className="flex items-center gap-1.5 text-amber-800">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600"/>
                                <span className="text-xs font-bold uppercase tracking-wide">Nhận xét của AI Cố Vấn</span>
                              </div>
                              <span className="text-amber-600 transition-transform duration-300 group-open:rotate-180">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </span>
                            </summary>
                            <div className="text-xs font-medium text-amber-800/90 leading-relaxed pl-1 mt-3 transition-all whitespace-normal break-words">
                              {Array.isArray((job.structuredRequirements as any).aiFeedback) ? (
                                <ul className="list-none space-y-3">
                                  {((job.structuredRequirements as any).aiFeedback).map((str: string, i: number) => (
                                    <li key={i} className="pl-3 border-l-2 border-amber-300">{formatText(str)}</li>
                                  ))}
                                </ul>
                              ) : (
                                <ul className="list-none space-y-3">
                                  {((job.structuredRequirements as any).aiFeedback as string)
                                    .replace(/v\.v\./g, 'v_v_')
                                    .replace(/([0-9])\.([0-9])/g, '$1_$2')
                                    .split('.')
                                    .filter((s: string) => s.trim().length > 5)
                                    .map((s: string, i: number) => (
                                      <li key={i} className="pl-3 border-l-2 border-amber-300">{formatText(s.replace(/v_v_/g, 'v.v.').replace(/([0-9])\_([0-9])/g, '$1.$2').trim() + '.')}</li>
                                    ))
                                  }
                                </ul>
                              )}
                              <div className="mt-3 pt-3 border-t border-amber-200/50 flex justify-end">
                                {(job.structuredRequirements as any)?.autoFixedByAI ? (
                                  <button
                                    disabled
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 text-[11px] font-bold rounded-lg shadow-sm opacity-80 cursor-not-allowed"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" /> Đã được chỉnh sửa
                                  </button>
                                ) : (
                                  <button
                                    onClick={async (e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const aiFeedback = (job?.structuredRequirements as any)?.aiFeedback;
                                      const insightInstruction = Array.isArray(aiFeedback) 
                                        ? aiFeedback.join('\n') 
                                        : String(aiFeedback);
                                      
                                      const loadingToast = toast.loading('AI đang tự động tối ưu JD...');
                                      try {
                                        await api.post('/ai/fix-job', { jobId: job.jobPostingId, insightInstruction });
                                        toast.success('Đã cập nhật JD thành công!', { id: loadingToast });
                                        fetchJobs();
                                      } catch (error: any) {
                                        const msg = error.response?.data?.message || 'Có lỗi xảy ra khi gọi AI!';
                                        toast.error(msg, { id: loadingToast });
                                      }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90 text-white text-[11px] font-bold rounded-lg transition-all shadow-sm"
                                  >
                                    <Sparkles className="w-3.5 h-3.5" /> Sửa tự động (AI)
                                  </button>
                                )}
                              </div>
                            </div>
                          </details>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          job.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : job.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : job.status === 'REJECTED'
                            ? 'bg-red-100 text-red-700'
                            : job.status === 'EXPIRED'
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {job.status === 'APPROVED' ? 'Đã duyệt'
                          : job.status === 'PENDING' ? 'Chờ duyệt'
                          : job.status === 'REJECTED' ? 'Từ chối'
                          : job.status === 'EXPIRED' ? 'Hết hạn'
                          : job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {job.status !== 'REJECTED' && (
                          <button
                            onClick={() => setSelectedJobId(job.jobPostingId)}
                            className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full border border-indigo-100 transition-colors cursor-pointer w-fit"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{job.matchedCount || 0} Phù hợp</span>
                          </button>
                        )}
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 px-2.5 py-1 w-fit">
                          <Users className="w-3.5 h-3.5" />
                          <span>{job.applications?.length || 0} Đã nộp</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {new Date(job.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/recruiter/post-job?jobId=${job.jobPostingId}`}
                          title="Chỉnh sửa tin (sẽ chờ duyệt lại sau khi sửa)"
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/recruiter/jobs/${job.jobPostingId}`}
                          title="Thống kê chiến dịch"
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        >
                          <BarChart className="w-4 h-4" />
                        </Link>
                        {job.status === 'EXPIRED' ? (
                          <button
                            onClick={() => setActionState({ id: job.jobPostingId, type: 'RENEW' })}
                            title="Gia hạn tin này (Sẽ trừ 1 lượt đăng tin trong gói gốc)"
                            className="p-2 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        ) : job.status === 'CLOSED' ? (
                          <button
                            onClick={() => setActionState({ id: job.jobPostingId, type: 'UNLOCK' })}
                            title="Mở khóa tin để ứng viên tiếp tục thấy"
                            className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            <Lock className="w-4 h-4 opacity-70" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setActionState({ id: job.jobPostingId, type: 'LOCK' })}
                            disabled={job.status === 'REJECTED' || job.status === 'PENDING'}
                            title={'Khóa tin này'}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Trang {currentPage} / {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!actionState}
        title={actionState?.type === 'LOCK' ? 'Khóa tin tuyển dụng' : actionState?.type === 'RENEW' ? 'Gia hạn tin tuyển dụng' : 'Mở khóa tin tuyển dụng'}
        message={actionState?.type === 'LOCK' 
          ? "Bạn có chắc chắn muốn khóa tin tuyển dụng này? Ứng viên sẽ không thể thấy tin này trên hệ thống nữa."
          : actionState?.type === 'RENEW' ? "Việc gia hạn sẽ tiêu tốn 1 lượt đăng tin của gói bạn đang sử dụng. Tin sẽ lập tức được gia hạn lại trạng thái tốt nhất làm việc. Đồng ý?"
          : "Bạn muốn mở khóa tin này? Tin sẽ xuất hiện trở lại trên bảng tin cho ứng viên áp tuyển."}
        confirmLabel={actionState?.type === 'LOCK' ? 'Khóa tin' : actionState?.type === 'RENEW' ? 'Gia hạn ngay' : 'Mở khóa'}
        onConfirm={performAction}
        onCancel={() => setActionState(null)}
        isLoading={acting}
      />

      {/* Matched Candidates Modal */}
      <MatchedCandidatesModal
        isOpen={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
        jobId={selectedJobId || ''}
      />
    </motion.div>
  );
}
