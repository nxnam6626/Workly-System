import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import { Job, ActionType, TabType } from '@/types/job';
import useSWR from 'swr';

export function useJobs() {
  const { accessToken } = useAuthStore();
  const { socket } = useSocketStore();

  const { data: initialData, error, isLoading: loading, mutate } = useSWR(
    accessToken ? ['/job-postings/my-jobs', accessToken] : null,
    async () => {
      const [jobsRes, subRes] = await Promise.all([
        api.get('/job-postings/my-jobs'),
        api.get('/subscriptions/current').catch(() => ({ data: null }))
      ]);
      return {
        jobs: Array.isArray(jobsRes.data) ? jobsRes.data : [],
        planType: subRes.data?.planType ?? null
      };
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  const jobs = initialData?.jobs ?? [];
  const planType = initialData?.planType ?? null;

  const [actionState, setActionState] = useState<{ id?: string, type: ActionType } | null>(null);
  const [acting, setActing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulk, setIsBulk] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('ACTIVE');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchInitialData = () => mutate();

  // Using a ref to keep fetchJobs current for event listeners
  const fetchJobsRef = useRef<() => void>(undefined);
  useEffect(() => {
    fetchJobsRef.current = fetchInitialData;
  });

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (msg: { title?: string; type?: string }) => {
      if (
        msg.title?.includes('Tin tuyển dụng') ||
        msg.title?.includes('Hồ sơ') ||
        msg.type === 'candidate_match' ||
        msg.title?.includes('ứng viên phù hợp')
      ) {
        if (fetchJobsRef.current) fetchJobsRef.current();
      }
    };

    const handleJobMatchUpdated = (payload: { jobId: string; matchedCount: number }) => {
      // Bỏ `false` ở tham số thứ 2 để SWR tự động fetch lại API (Revalidate)
      // Vừa update giao diện ngay lập tức, vừa gọi API ngầm để đồng bộ chính xác
      mutate(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          jobs: prev.jobs.map(j =>
            j.jobPostingId === payload.jobId
              ? { ...j, matchedCount: payload.matchedCount, matchingStatus: 'COMPLETED' }
              : j
          )
        };
      }, true);
    };

    const handleJobMatchStarted = (payload: { jobId: string; status: string }) => {
      mutate(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          jobs: prev.jobs.map(j =>
            j.jobPostingId === payload.jobId
              ? { ...j, matchingStatus: 'RUNNING' }
              : j
          )
        };
      }, false);
    };

    socket.on('notification', handleNotification);
    socket.on('job_match_updated', handleJobMatchUpdated);
    socket.on('job_match_started', handleJobMatchStarted);
    return () => {
      socket.off('notification', handleNotification);
      socket.off('job_match_updated', handleJobMatchUpdated);
      socket.off('job_match_started', handleJobMatchStarted);
    };
  }, [socket]);

  const performAction = async () => {
    if (!actionState) return;
    const { id, type } = actionState;
    setActing(true);
    try {
      if (isBulk) {
        const endpoint = type === 'PAUSE' ? 'pause' : type === 'RESUME' ? 'resume' : 'close';
        await api.post(`/job-postings/bulk/${endpoint}`, { ids: selectedIds });
        toast.success(`Đã thực hiện ${type} cho ${selectedIds.length} tin tuyển dụng`);
        setSelectedIds([]);
      } else {
        if (type === 'RENEW') {
          await api.post(`/job-postings/${id}/renew`);
          toast.success('Đã gia hạn tin tuyển dụng thành công');
        } else if (type === 'PAUSE') {
          await api.post(`/job-postings/${id}/pause`);
          toast.success('Đã tạm dừng tin tuyển dụng');
        } else if (type === 'RESUME') {
          await api.post(`/job-postings/${id}/resume`);
          toast.success('Đã mở lại tin tuyển dụng');
        } else if (type === 'CLOSE') {
          await api.post(`/job-postings/${id}/close`);
          toast.success('Đã đóng tin tuyển dụng');
        }
      }
      fetchInitialData();
    } catch (error: unknown) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Thao tác thất bại';
      toast.error(message);
    } finally {
      setActing(false);
      setActionState(null);
      setIsBulk(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const filteredJobs = jobs
    .filter(job => {
      const matchSearch = job.title?.toLowerCase().includes(searchQuery.toLowerCase());

      let statusMatch = false;
      if (activeTab === 'ACTIVE') statusMatch = job.status === 'APPROVED';
      else if (activeTab === 'PENDING') statusMatch = job.status === 'PENDING';
      else if (activeTab === 'REJECTED') statusMatch = job.status === 'REJECTED';
      else if (activeTab === 'PAUSED') statusMatch = job.status === 'PAUSED';
      else if (activeTab === 'CLOSED') statusMatch = job.status === 'CLOSED';
      else if (activeTab === 'EXPIRED') statusMatch = job.status === 'EXPIRED';

      let dateMatch = true;
      if (dateFrom) dateMatch = dateMatch && new Date(job.createdAt) >= new Date(dateFrom);
      if (dateTo) dateMatch = dateMatch && new Date(job.createdAt) <= new Date(dateTo);

      return matchSearch && statusMatch && dateMatch;
    })
    .sort((a, b) => new Date(b.refreshedAt || b.createdAt).getTime() - new Date(a.refreshedAt || a.createdAt).getTime());

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredJobs.length && filteredJobs.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredJobs.map(j => j.jobPostingId));
    }
  };

  const totalItems = filteredJobs.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedJobs = filteredJobs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return {
    jobs,
    loading,
    actionState,
    setActionState,
    acting,
    selectedIds,
    setSelectedIds,
    isBulk,
    setIsBulk,
    planType,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    fetchJobs: fetchInitialData,
    performAction,
    toggleSelect,
    toggleSelectAll,
    filteredJobs,
    paginatedJobs,
    totalItems,
    totalPages,
    startItem,
    endItem
  };
}
