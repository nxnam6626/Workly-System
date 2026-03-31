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

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
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
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await adminJobsApi.getAll(filters, page, 10);
      setJobs(data.items);
      setTotalPages(data.totalPages);
      setTotalItems(data.total);
    } catch (err) {
      setError('Không thể tải danh sách tin tuyển dụng.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
       await adminJobsApi.bulkApprove({ searchTerm: selectedIds.join(',') });
       fetchJobs();
       setSelectedIds([]);
    } catch {
       setError('Duyệt hàng loạt thất bại.');
    } finally {
       setIsBulkProcessing(false);
    }
  };

  const requestBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setIsDeleteModalOpen(true);
  };

  const handleBulkDelete = async () => {
    setIsBulkProcessing(true);
    try {
       await adminJobsApi.bulkDelete({ searchTerm: selectedIds.join(',') });
       fetchJobs();
       setSelectedIds([]);
    } catch {
       setError('Xóa hàng loạt thất bại.');
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
    { label: 'Chờ duyệt', value: totalItems, color: 'bg-amber-50 text-amber-600', icon: Clock },
    { label: 'Điểm AI thấp', value: jobs.filter(j => j.aiReliabilityScore < 60).length, color: 'bg-red-50 text-red-600', icon: ShieldAlert },
    { label: 'Tin từ Crawler', value: jobs.filter(j => j.postType === PostType.CRAWLED).length, color: 'bg-indigo-50 text-indigo-600', icon: Briefcase },
    { label: 'Đã chọn', value: selectedIds.length, color: 'bg-slate-100 text-slate-600', icon: CheckCircle2 },
  ], [totalItems, jobs, selectedIds.length]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Kiểm Duyệt Tin Tuyển Dụng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Duyệt tin mới, quản lý AI Score và xử lý hàng loạt dữ liệu crawler
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
              onBulkDelete={requestBulkDelete}
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

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="Xóa hàng loạt"
        message={`Bạn có chắc muốn xóa ${selectedIds.length} tin đã chọn? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa các tin"
        onConfirm={handleBulkDelete}
        onCancel={() => setIsDeleteModalOpen(false)}
        isLoading={isBulkProcessing}
      />
    </div>
  );
}
