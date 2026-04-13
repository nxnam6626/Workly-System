'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  RefreshCw,
  Clock,
  ShieldAlert,
  Briefcase,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { adminJobsApi, JobPosting, JobStatus, PostType, AdminFilterJobPostingDto } from '@/lib/admin-api';
import JobQuickViewModal from './JobQuickViewModal';
import JobStats from './components/JobStats';
import JobFilters from './components/JobFilters';
import JobTable from './components/JobTable';
import BulkActionsBar from './components/BulkActionsBar';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useConfirm } from '@/components/ConfirmDialog';
import { useSocketStore } from '@/stores/socket';
import toast from 'react-hot-toast';

export default function JobsPage() {
  const { socket } = useSocketStore();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<AdminFilterJobPostingDto>({
    status: JobStatus.PENDING,
    postType: undefined,
    minAiScore: undefined,
    searchTerm: '',
  });

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modals & States
  const [quickViewJob, setQuickViewJob] = useState<JobPosting | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const confirm = useConfirm();

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [data, statsData] = await Promise.all([
        adminJobsApi.getAll(filters, page, 10),
        adminJobsApi.getStats()
      ]);
      setJobs(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
      setGlobalStats(statsData);
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu tuyển dụng.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useEffect(() => {
    if (!socket) return;

    const handleNewJob = (job: JobPosting) => {
      // Tự động làm mới danh sách nếu đang ở trang 1
      if (page === 1) {
        fetchJobs();
      } else {
        setTotalItems(prev => prev + 1);
      }
    };

    const handleAdminJobUpdated = () => {
      fetchJobs();
    };

    socket.on('newJobPosting', handleNewJob);
    socket.on('adminJobUpdated', handleAdminJobUpdated);

    return () => {
      socket.off('newJobPosting', handleNewJob);
      socket.off('adminJobUpdated', handleAdminJobUpdated);
    };
  }, [socket, fetchJobs, page]);

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      await adminJobsApi.approve(id);
      setJobs((prev) => prev.map(j => j.jobPostingId === id ? { ...j, status: JobStatus.APPROVED } : j));
      if (quickViewJob?.jobPostingId === id) setQuickViewJob(prev => prev ? { ...prev, status: JobStatus.APPROVED } : null);
    } catch {
      setError('Duyệt tin thất bại.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleReject = async (id: string) => {
    setIsProcessing(id);
    try {
      await adminJobsApi.reject(id);
      setJobs((prev) => prev.map(j => j.jobPostingId === id ? { ...j, status: JobStatus.REJECTED } : j));
      if (quickViewJob?.jobPostingId === id) setQuickViewJob(prev => prev ? { ...prev, status: JobStatus.REJECTED } : null);
    } catch {
      setError('Từ chối tin thất bại.');
    } finally {
      setIsProcessing(null);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await adminJobsApi.bulkApprove(selectedIds);
      fetchJobs();
      setSelectedIds([]);
      toast.success(`Duyệt thành công ${selectedIds.length} tin.`);
    } catch {
      setError('Duyệt hàng loạt thất bại.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const requestBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: 'Từ chối hàng loạt?',
      message: `Bạn có chắc muốn từ chối ${selectedIds.length} tin đã chọn? Hành động này sẽ thay đổi trạng thái và gửi thông báo cho nhà tuyển dụng.`,
      confirmText: 'Từ chối tất cả',
      variant: 'danger',
    });
    if (!ok) return;
    setIsBulkProcessing(true);
    try {
      await adminJobsApi.bulkReject(selectedIds);
      fetchJobs();
      setSelectedIds([]);
      toast.success(`Từ chối thành công ${selectedIds.length} tin.`);
    } catch {
      setError('Từ chối hàng loạt thất bại.');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === jobs.length && jobs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(jobs.map(j => j.jobPostingId));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const statsItems = useMemo(() => [
    { label: 'Chờ duyệt', value: globalStats?.totalPending || 0, color: 'bg-amber-50 text-amber-600', icon: Clock },
    { label: 'Đã Duyệt', value: globalStats?.totalApproved || 0, color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
    { label: 'Đã Từ chối', value: globalStats?.totalRejected || 0, color: 'bg-rose-50 text-rose-600', icon: XCircle },
    { label: 'Điểm AI thấp', value: jobs.filter(j => j.aiReliabilityScore < 60).length, color: 'bg-red-50 text-red-600', icon: ShieldAlert },
    // { label: 'Tin từ Crawler', value: globalStats?.totalCrawled || 0, color: 'bg-indigo-50 text-indigo-600', icon: Briefcase },
  ], [globalStats, jobs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kiểm Duyệt Yêu Cầu Tuyển Dụng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Duyệt yêu cầu đăng tin mới, quản lý AI Score và xử lý hàng loạt dữ liệu crawler
          </p>
        </div>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <JobStats stats={statsItems} />

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
        <div className="p-4 border-b border-slate-100 bg-slate-50/30 space-y-4">
          <JobFilters filters={filters} setFilters={setFilters} />
          <BulkActionsBar
            selectedCount={selectedIds.length}
            onBulkApprove={handleBulkApprove}
            onBulkReject={requestBulkReject}
            onClearSelection={() => setSelectedIds([])}
            isProcessing={isBulkProcessing}
          />
        </div>

        {error && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium text-red-800">{error}</p>
            <button onClick={() => setError('')} className="ml-auto p-1 hover:bg-red-100 rounded-md text-red-400">
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        <JobTable
          jobs={jobs}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          toggleSelectAll={toggleSelectAll}
          onApprove={handleApprove}
          onReject={handleReject}
          onQuickView={setQuickViewJob}
          isProcessing={isProcessing}
          isLoading={isLoading}
          totalItems={totalItems}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
        />
      </div>

      {quickViewJob && (
        <JobQuickViewModal
          job={quickViewJob}
          onClose={() => setQuickViewJob(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          isProcessing={isProcessing === quickViewJob.jobPostingId}
        />
      )}
    </div>
  );
}
