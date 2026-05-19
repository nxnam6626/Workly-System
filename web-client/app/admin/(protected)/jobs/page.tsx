'use client';

import { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import {
  RefreshCw,
  Clock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Lock,
  Briefcase,
} from 'lucide-react';
import { adminJobsApi, JobPosting, JobStatus, AdminFilterJobPostingDto } from '@/lib/admin-api';
import JobQuickViewModal from './JobQuickViewModal';
import JobStats from './components/JobStats';
import JobFilters from './components/JobFilters';
import JobTable from './components/JobTable';
import BulkActionsBar from './components/BulkActionsBar';
import { useConfirm } from '@/components/ui/ConfirmDialog';
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

function JobsPageContent() {
  const { user } = useAuthStore();
  const perms: string[] = user?.admin?.permissions ?? [];
  const canAccess = perms.includes('SUPER_ADMIN') || perms.includes('MANAGE_JOBS');

  const { socket } = useSocketStore();
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const searchParams = useSearchParams();
  const defaultStatus = searchParams.get('status') as JobStatus | null;
  const defaultSearch = searchParams.get('searchTerm') || '';
  const viewId = searchParams.get('viewId');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<AdminFilterJobPostingDto>({
    status: defaultStatus || JobStatus.PENDING,
    minAiScore: undefined,
    searchTerm: '',
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quickViewJob, setQuickViewJob] = useState<JobPosting | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
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
      toast.success('Duyệt tin thành công');
    } catch { toast.error('Duyệt tin thất bại.'); }
    finally { setIsProcessing(null); }
  };

  const handleReject = (id: string) => {
    setRejectingId(id);
  };

  const submitReject = async () => {
    if (!rejectingId) return;
    const el = document.getElementById(`reject-reason-${rejectingId}`) as HTMLTextAreaElement;
    const reason = el?.value?.trim() || 'Nội dung chưa đạt yêu cầu';
    setRejectingId(null);
    
    setIsProcessing(rejectingId);
    try {
      await adminJobsApi.reject(rejectingId, reason);
      setJobs((prev) => prev.map(j => j.jobPostingId === rejectingId ? { ...j, status: JobStatus.REJECTED } : j));
      if (quickViewJob?.jobPostingId === rejectingId) setQuickViewJob(prev => prev ? { ...prev, status: JobStatus.REJECTED } : null);
      toast.success('Đã từ chối tin đăng');
    } catch { 
      toast.error('Từ chối tin thất bại.'); 
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
    const pendingJobs = jobs.filter(j => j.status === JobStatus.PENDING);
    if (selectedIds.length === pendingJobs.length && pendingJobs.length > 0) setSelectedIds([]);
    else setSelectedIds(pendingJobs.map(j => j.jobPostingId));
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const statsItems = useMemo(() => [
    { label: 'Chờ duyệt', value: globalStats?.totalPending || 0, color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
    { label: 'Đã Duyệt', value: globalStats?.totalApproved || 0, color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
    { label: 'Đã Từ chối', value: globalStats?.totalRejected || 0, color: 'bg-rose-50 text-rose-600 border-rose-100', icon: XCircle },
    { label: 'Điểm AI thấp', value: globalStats?.totalLowAiScore || 0, color: 'bg-red-50 text-red-600 border-red-100', icon: ShieldAlert },
  ], [globalStats]);

  // --- PERMISSION GATE ---
  if (!canAccess) return <AccessDenied />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
               <Briefcase className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Công Việc
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                  Duyệt yêu cầu đăng tin mới, quản lý AI Score và xử lý hàng loạt.
                </p>
             </div>
          </div>
        </div>
        <button
          onClick={fetchJobs}
          className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      <JobStats stats={statsItems} />

      <div className="bg-white rounded-[2.5rem] border border-indigo-100 shadow-2xl shadow-indigo-50/50 overflow-hidden flex flex-col min-h-[600px] relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-500" />
        <div className="p-8 border-b border-indigo-50 bg-indigo-50/20 space-y-4">
          <JobFilters filters={filters} setFilters={setFilters} />
          <BulkActionsBar
            selectedCount={selectedIds.length}
            onBulkApprove={handleBulkApprove}
            onBulkReject={requestBulkReject}
            onClearSelection={() => setSelectedIds([])}
            isProcessing={isBulkProcessing}
            currentStatus={filters.status}
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

      {rejectingId && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setRejectingId(null)} />
          <div className="relative max-w-md w-full bg-white shadow-2xl rounded-2xl flex flex-col border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-rose-700">Lý do từ chối</h3>
            </div>
            <div className="p-4">
              <textarea
                id={`reject-reason-${rejectingId}`}
                className="w-full border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 resize-none transition-all shadow-sm"
                rows={3}
                defaultValue="Nội dung chưa đạt yêu cầu"
                placeholder="Nhập lý do gửi đến nhà tuyển dụng..."
                autoFocus
              />
            </div>
            <div className="flex border-t border-slate-100 bg-slate-50">
              <button
                onClick={() => setRejectingId(null)}
                className="flex-1 p-3 text-sm font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <div className="w-px bg-slate-200" />
              <button
                onClick={submitReject}
                className="flex-1 p-3 text-sm font-bold text-rose-600 hover:bg-rose-100 transition-colors"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Đang tải dữ liệu...</div>}>
      <JobsPageContent />
    </Suspense>
  );
}
