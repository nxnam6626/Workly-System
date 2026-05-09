'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { RefreshCw, ChevronRight, Clock, AlertTriangle, CheckCircle2, XCircle, Lock, Calendar } from 'lucide-react';
import { JobsHeader } from '@/components/recruiter/JobsHeader';
import { JobsTabs } from '@/components/recruiter/JobsTabs';
import { JobsFilterBar } from '@/components/recruiter/JobsFilterBar';
import { JobsTable } from '@/components/recruiter/JobsTable';
import { JobsFloatingBar } from '@/components/recruiter/JobsFloatingBar';
import { TabType } from '@/types/job';
import { useJobs } from '@/hooks/useJobs';
import dynamic from 'next/dynamic';

const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal').then(mod => mod.ConfirmModal), { ssr: false });
const MatchedCandidatesModal = dynamic(() => import('@/components/recruiter/MatchedCandidatesModal').then(mod => mod.MatchedCandidatesModal), { ssr: false });

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
  const searchParams = useSearchParams();
  const matchJobId = searchParams.get('matchJobId');

  const {
    loading, actionState, setActionState, acting, selectedIds, setSelectedIds, isBulk, setIsBulk,
    currentPage, setCurrentPage, itemsPerPage, setItemsPerPage, searchQuery, setSearchQuery,
    activeTab, setActiveTab, dateFrom, setDateFrom, dateTo, setDateTo,
    fetchJobs, performAction, toggleSelect, toggleSelectAll,
    paginatedJobs, totalItems, totalPages, startItem, endItem, filteredJobs, jobs
  } = useJobs();

  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (matchJobId) {
      setSelectedJobId(matchJobId);
    }
  }, [matchJobId]);

  const tabs: { id: TabType; label: string; icon: any; count: number }[] = [
    { id: 'PENDING', label: 'Chờ duyệt', icon: Clock, count: jobs.filter(j => j.status === 'PENDING').length },
    { id: 'REJECTED', label: 'Bị từ chối', icon: AlertTriangle, count: jobs.filter(j => j.status === 'REJECTED').length },
    { id: 'ACTIVE', label: 'Hoạt động', icon: CheckCircle2, count: jobs.filter(j => j.status === 'APPROVED').length },
    { id: 'PAUSED', label: 'Tạm dừng', icon: XCircle, count: jobs.filter(j => j.status === 'PAUSED').length },
    { id: 'CLOSED', label: 'Đã đóng', icon: Lock, count: jobs.filter(j => j.status === 'CLOSED').length },
    { id: 'EXPIRED', label: 'Hết hạn', icon: Calendar, count: jobs.filter(j => j.status === 'EXPIRED').length },
  ];

  return (
    <div className="min-h-screen pb-20 space-y-8 animate-in fade-in duration-500">
      <JobsHeader />

      <JobsFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        setCurrentPage={setCurrentPage}
        fetchJobs={fetchJobs}
        startItem={startItem}
        endItem={endItem}
        totalItems={totalItems}
      />

      <JobsTabs
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setCurrentPage={setCurrentPage}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40">
          <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-4" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Đang tải danh sách...</p>
        </div>
      ) : (
        <JobsTable
          paginatedJobs={paginatedJobs}
          selectedIds={selectedIds}
          toggleSelect={toggleSelect}
          toggleSelectAll={toggleSelectAll}
          filteredJobs={filteredJobs}
          activeTab={activeTab}
          setActionState={setActionState}
          setSelectedJobId={setSelectedJobId}
          formatText={formatText}
        />
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex items-center gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl font-black text-xs transition-all ${currentPage === i + 1
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                  : 'bg-white text-slate-500 hover:bg-slate-50'
                  }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 disabled:opacity-30 transition-all"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      <ConfirmModal
        isOpen={!!actionState}
        title={
          actionState?.type === 'PAUSE' ? 'Tạm dừng tin tuyển dụng' :
            actionState?.type === 'RESUME' ? 'Mở lại tin tuyển dụng' :
              actionState?.type === 'CLOSE' ? 'Kết thúc tin tuyển dụng' :
                'Gia hạn tin tuyển dụng'
        }
        message={
          isBulk ? (
            `Bạn có chắc chắn muốn ${actionState?.type === 'PAUSE' ? 'tạm dừng' :
              actionState?.type === 'RESUME' ? 'mở lại' :
                'kết thúc'
            } ${selectedIds.length} tin tuyển dụng đã chọn?`
          ) : (
            actionState?.type === 'PAUSE' ? "Bạn có chắc chắn muốn tạm dừng tin tuyển dụng này? Tin sẽ bị ẩn khỏi bảng tìm kiếm của ứng viên nhưng hồ sơ đã nộp vẫn được giữ nguyên." :
              actionState?.type === 'RESUME' ? "Bạn muốn mở lại tin này? Tin sẽ xuất hiện trở lại trên bảng tin và thời gian đăng tin sẽ được bù lại phần đã tạm dừng." :
                actionState?.type === 'CLOSE' ? "Bạn có chắc chắn muốn đóng tin này vĩnh viễn? Ứng viên sẽ không thể thấy tin này nữa và hành động này không thể hoàn tác." :
                  "Việc gia hạn sẽ tiêu tốn 1 lượt đăng tin của gói bạn đang sử dụng. Tin sẽ lập tức được đưa lên đầu trang và bắt đầu chu kỳ 30 ngày mới. Đồng ý?"
          )
        }
        confirmLabel={
          actionState?.type === 'PAUSE' ? 'Tạm dừng ngay' :
            actionState?.type === 'RESUME' ? 'Mở lại ngay' :
              actionState?.type === 'CLOSE' ? 'Kết thúc ngay' :
                'Gia hạn ngay'
        }
        onConfirm={performAction}
        onCancel={() => setActionState(null)}
        isLoading={acting}
      />

      <MatchedCandidatesModal
        isOpen={!!selectedJobId}
        onClose={() => setSelectedJobId(null)}
        jobId={selectedJobId || ''}
      />

      <JobsFloatingBar
        selectedIds={selectedIds}
        activeTab={activeTab}
        setIsBulk={setIsBulk}
        setActionState={setActionState}
        setSelectedIds={setSelectedIds}
      />
    </div>
  );
}
