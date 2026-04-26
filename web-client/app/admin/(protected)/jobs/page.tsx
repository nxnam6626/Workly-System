'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import {
  RefreshCw,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Lock,
} from 'lucide-react';
import { adminJobsApi, JobPosting, JobStatus, AdminFilterJobPostingDto } from '@/lib/admin-api';
import JobQuickViewModal from './JobQuickViewModal';
import JobStats from './components/JobStats';
import JobFilters from './components/JobFilters';
import JobTable from './components/JobTable';
import BulkActionsBar from './components/BulkActionsBar';
import { useConfirm } from '@/components/ConfirmDialog';
import { useSocketStore } from '@/stores/socket';
import toast from 'react-hot-toast';

function AccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
        <Lock className="w-8 h-8 text-rose-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-800">Không có quyền truy cập</h2>
        <p className="text-slate-400 text-sm mt-1">Tài khoản của bạn không có quyền <span className="font-semibold">MANAGE_JOBS</span>.</p>
        <p className="text-slate-400 text-xs mt-1">Liên hệ Supreme Admin để được cấp thêm quyền.</p>
      </div>
    </div>
  );
}

export default function JobsPage() {
  const { user } = useAuthStore();
  const perms: string[] = user?.admin?.permissions ?? [];
  const canAccess = perms.includes('SUPER_ADMIN') || perms.includes('MANAGE_JOBS');

  const { socket } = useSocketStore();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<AdminFilterJobPostingDto>({
    status: JobStatus.PENDING,
    minAiScore: undefined,
    searchTerm: '',
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickViewJob, setQuickViewJob] = useState<JobPosting | null>(null);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const confirm = useConfirm();

  const fetchJobs = useCallback(async () => {
    if (!canAccess) return;
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
    } finally {
      setIsLoading(false);
    }
  }, [filters, page, canAccess]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    if (!socket || !canAccess) return;
    const handleNewJob = () => { if (page === 1) fetchJobs(); else setTotalItems(prev => prev + 1); };
    const handleAdminJobUpdated = () => { fetchJobs(); };
    socket.on('newJobPosting', handleNewJob);
    socket.on('adminJobUpdated', handleAdminJobUpdated);
    return () => {
      socket.off('newJobPosting', handleNewJob);
      socket.off('adminJobUpdated', handleAdminJobUpdated);
    };
  }, [socket, fetchJobs, page, canAccess]);

  const handleApprove = async (id: string) => {
    setIsProcessing(id);
    try {
      await adminJobsApi.approve(id);
      setJobs((prev) => prev.map(j => j.jobPostingId === id ? { ...j, status: JobStatus.APPROVED } : j));
      if (quickViewJob?.jobPostingId === id) setQuickViewJob(prev => prev ? { ...prev, status: JobStatus.APPROVED } : null);
    } catch { setError('Duyệt tin thất bại.'); }
    finally { setIsProcessing(null); }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Nhập lý do từ chối (Gửi đến nhà tuyển dụng):', 'Nội dung chưa đạt yêu cầu');
    if (reason === null) return;

    setIsProcessing(id);
    try {
      await adminJobsApi.reject(id, reason);
      setJobs((prev) => prev.map(j => j.jobPostingId === id ? { ...j, status: JobStatus.REJECTED } : j));
      if (quickViewJob?.jobPostingId === id) setQuickViewJob(prev => prev ? { ...prev, status: JobStatus.REJECTED } : null);
    } catch { setError('Từ chối tin thất bại.'); }
    finally { setIsProcessing(null); }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkProcessing(true);
    try {
      await adminJobsApi.bulkApprove(selectedIds);
      fetchJobs();
      setSelectedIds([]);
      toast.success(`Duyệt thành công ${selectedIds.length} tin.`);
    } catch { setError('Duyệt hàng loạt thất bại.'); }
    finally { setIsBulkProcessing(false); }
  };

  const requestBulkReject = async () => {
    if (selectedIds.length === 0) return;
    const ok = await confirm({
      title: 'Từ chối hàng loạt?',
      message: `Bạn có chắc muốn từ chối ${selectedIds.length} tin đã chọn?`,
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
    } catch { setError('Từ chối hàng loạt thất bại.'); }
    finally { setIsBulkProcessing(false); }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === jobs.length && jobs.length > 0) setSelectedIds([]);
    else setSelectedIds(jobs.map(j => j.jobPostingId));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const statsItems = useMemo(() => [
    { label: 'Chờ duyệt', value: globalStats?.totalPending || 0, color: 'bg-amber-50 text-amber-600', icon: Clock },
    { label: 'Đã Duyệt', value: globalStats?.totalApproved || 0, color: 'bg-emerald-50 text-emerald-600', icon: CheckCircle2 },
    { label: 'Đã Từ chối', value: globalStats?.totalRejected || 0, color: 'bg-rose-50 text-rose-600', icon: XCircle },
    { label: 'Điểm AI thấp', value: jobs.filter(j => j.aiReliabilityScore < 60).length, color: 'bg-red-50 text-red-600', icon: ShieldAlert },
  ], [globalStats, jobs]);

  // --- PERMISSION GATE ---
  if (!canAccess) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kiểm Duyệt Yêu Cầu Tuyển Dụng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Duyệt yêu cầu đăng tin mới, quản lý AI Score và xử lý hàng loạt
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
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
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
