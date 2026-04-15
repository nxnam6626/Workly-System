'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, Plus, Search, MoreVertical, Edit, Lock, Sparkles, Users, BarChart, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import Link from 'next/link';
import { MatchedCandidatesModal } from '@/components/recruiter/MatchedCandidatesModal';

export default function JobsManagementPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<{ id: string, type: 'LOCK' | 'UNLOCK' | 'RENEW' } | null>(null);
  const [acting, setActing] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();

  useEffect(() => {
    fetchJobs();
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
                    <td className="px-6 py-4 font-medium text-slate-800 break-words max-w-xs">
                      <Link
                        href={`/recruiter/jobs/${job.jobPostingId}`}
                        className="hover:text-indigo-600 transition-colors inline-block font-bold"
                      >
                        {job.title}
                      </Link>
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
