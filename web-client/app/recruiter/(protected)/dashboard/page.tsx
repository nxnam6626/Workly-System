'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { useSocketStore } from '@/stores/socket';
import api from '@/lib/api';
import {
  Briefcase,
  Users,
  MessageSquare,
  TrendingUp,
  PlusCircle,
  FileText,
  ChevronRight,
  Sparkles,
  Loader2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Wallet, CreditCard } from 'lucide-react';

const TopUpModal = ({ isOpen, onClose, onTopUp, isSubmitting }: any) => {
  const [amount, setAmount] = useState(100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
        <h3 className="text-xl font-bold text-slate-800 mb-4 pb-4 border-b border-slate-100 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          Nạp tiền vào ví
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Số Xu cần nạp</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              min="10"
            />
          </div>
          <p className="text-xs text-slate-500">1 xu = 1,000 VNĐ. Tiền sẽ được quy đổi tự động (Mock Demo).</p>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => onTopUp(amount)}
              disabled={isSubmitting || amount < 10}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:bg-indigo-400"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Xác Nhận Nạp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditInterviewModal = ({ isOpen, onClose, onSave, interview, isSubmitting }: any) => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (interview && isOpen) {
      if (interview.date) {
        const d = new Date(interview.date);
        const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        setDate(dStr);
      } else {
        setDate('');
      }
      setTime(interview.time || '');
      setLocation(interview.location || '');
    }
  }, [interview, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
        <h3 className="text-xl font-bold text-slate-800 mb-4 pb-4 border-b border-slate-100 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          Đổi Lịch Phỏng Vấn
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Ngày phỏng vấn</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Giờ phỏng vấn</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">Địa điểm / Link Meet</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              placeholder="Vd: meet.google.com/abc-xyz"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => onSave({ date, time, location })}
              disabled={isSubmitting || !date || !time}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:bg-indigo-400"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ConfirmStatusModal = ({ isOpen, onClose, onConfirm, statusStr, isSubmitting }: any) => {
  if (!isOpen) return null;
  const isAccept = statusStr === 'ACCEPTED';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
        <h3 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
          {isAccept ? <CheckCircle className="w-6 h-6 text-emerald-600" /> : <XCircle className="w-6 h-6 text-rose-600" />}
          Xác nhận {isAccept ? 'Trúng Tuyển' : 'Từ Chối'}
        </h3>
        <p className="text-slate-600 text-sm mb-6">
          Bạn có chắc chắn muốn đánh dấu ứng viên này là <strong className={isAccept ? 'text-emerald-600' : 'text-rose-600'}>{isAccept ? 'Trúng Tuyển' : 'Từ Chối'}</strong> không? Hành động này sẽ thông báo cho ứng viên.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={`px-5 py-2 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${isAccept ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default function RecruiterDashboard() {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [subInfo, setSubInfo] = useState<any>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isToppingUp, setIsToppingUp] = useState(false);

  const [editingInterview, setEditingInterview] = useState<any>(null);
  const [isUpdatingInterview, setIsUpdatingInterview] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');

  const [confirmStatusData, setConfirmStatusData] = useState<{ id: string; status: 'ACCEPTED' | 'REJECTED' } | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const fetchDashboard = async (targetDate?: string) => {
    try {
      const url = targetDate ? `/recruiters/dashboard?date=${targetDate}` : '/recruiters/dashboard';
      const res = await api.get(url);
      setData(res.data);
    } catch (err) {
      toast.error('Không thể tải dữ liệu bảng điều khiển.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallets/balance');
      setWalletInfo(res.data);
    } catch (err) {
      console.error('Lỗi tải ví:', err);
    }
  };

  const fetchSub = async () => {
    try {
      const res = await api.get('/subscriptions/current');
      setSubInfo(res.data);
    } catch (err) { }
  };

  useEffect(() => {
    fetchDashboard(selectedDate);
    fetchWallet();
    fetchSub();
  }, [selectedDate]);

  useEffect(() => {
    if (!socket) return;

    const handleJdViewed = (payload: any) => {
      setData((prev: any) => {
        if (!prev || !prev.stats) return prev;
        return {
          ...prev,
          stats: {
            ...prev.stats,
            totalJDViews: (prev.stats.totalJDViews || 0) + 1
          }
        };
      });
    };

    socket.on('jdViewUpdated', handleJdViewed);
    socket.on('dashboardUpdated', fetchDashboard);

    return () => {
      socket.off('jdViewUpdated', handleJdViewed);
      socket.off('dashboardUpdated', fetchDashboard);
    };
  }, [socket]);

  const handleTopUp = async (amount: number) => {
    setIsToppingUp(true);
    try {
      const { data } = await api.post('/wallets/top-up', { amount });
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.success(`Đã yêu cầu nạp ${amount} xu!`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Nạp tiền thất bại!');
      setIsToppingUp(false);
    }
  };

  const handleSaveInterview = async (newData: any) => {
    setIsUpdatingInterview(true);
    try {
      await api.patch(`/applications/${editingInterview.id}/status`, {
        status: 'INTERVIEWING',
        interviewDate: new Date(newData.date).toISOString(),
        interviewTime: newData.time,
        interviewLocation: newData.location
      });
      toast.success('Đã cập nhật lịch phỏng vấn!');
      setEditingInterview(null);
      fetchDashboard();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại!');
    } finally {
      setIsUpdatingInterview(false);
    }
  };

  const updateInterviewStatus = async (id: string, status: 'ACCEPTED' | 'REJECTED') => {
    setIsUpdatingStatus(true);
    try {
      await api.patch(`/applications/${id}/status`, { status });
      toast.success(status === 'ACCEPTED' ? 'Đã duyệt trúng tuyển!' : 'Đã từ chối ứng viên.');
      fetchDashboard();
      setConfirmStatusData(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật thất bại!');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center flex-col items-center min-h-[50vh] gap-4">
        <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Đang tải bảng điều khiển...</p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'APPROVED': return { label: 'Đang mở', className: 'bg-emerald-50 text-emerald-700' };
      case 'PENDING': return { label: 'Chờ duyệt', className: 'bg-amber-50 text-amber-700' };
      case 'REJECTED': return { label: 'Bị từ chối', className: 'bg-red-50 text-red-700' };
      case 'CLOSED': return { label: 'Đã đóng', className: 'bg-slate-100 text-slate-600' };
      default: return { label: status, className: 'bg-slate-100 text-slate-600' };
    }
  };

  const { stats: apiStats, recentJobs, upcomingInterviews = [] } = data || { stats: {}, recentJobs: [], upcomingInterviews: [] };

  const stats = [
    { label: 'Tin Tuyển Dụng Đang Mở', value: apiStats.activeJobsCount || 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tổng Số Ứng Viên', value: apiStats.totalApplicantsCount || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Tin Nhắn Chưa Đọc', value: apiStats.newMessagesCount || 0, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Lượt Xem JD', value: apiStats.totalJDViews || 0, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h1 className="text-[28px] font-black text-slate-900 tracking-tight">
            Chào mừng trở lại, {user?.name || 'Nhà tuyển dụng'}!
          </h1>
          <p className="text-[15px] font-medium text-slate-500 mt-1.5">
            Dưới đây là tổng quan về hoạt động tuyển dụng của bạn.
          </p>
        </div>
        <Link
          href="/recruiter/post-job"
          className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20 active:scale-95"
        >
          <PlusCircle className="w-5 h-5" />
          Đăng tin mới
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform ${stat.bg} ${stat.color}`}>
                <stat.icon className="w-7 h-7" />
              </div>
            </div>
            <p className="text-3xl font-black text-slate-900 tracking-tight mb-1">{stat.value.toLocaleString()}</p>
            <p className="text-[13px] font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Recent Jobs Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-7 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-[17px] text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-indigo-600" /> Tin tuyển dụng gần đây
              </h3>
              <Link href="/recruiter/jobs" className="text-[13px] font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl flex items-center transition-all active:scale-95 shadow-sm hover:shadow-md">
                Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                    <th className="px-7 py-4">Vị trí</th>
                    <th className="px-7 py-4">Ứng viên</th>
                    <th className="px-7 py-4">Trạng thái</th>
                    <th className="px-7 py-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentJobs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                        Chưa có tin tuyển dụng nào.
                      </td>
                    </tr>
                  ) : recentJobs.map((job: any) => (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-7 py-5">
                        <Link href={`/recruiter/jobs/${job.id}`} className="font-bold text-[15px] text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 max-w-[200px] hover:underline underline-offset-4 decoration-2">{job.title}</Link>
                        <p className="text-[13px] text-slate-500 font-medium mt-0.5">{timeAgo(job.date)}</p>
                      </td>
                      <td className="px-7 py-5 font-black text-slate-700 text-[15px]">{job.applicants}</td>
                      <td className="px-7 py-5">
                        <span className={`inline-flex px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-widest shadow-sm ${getStatusConfig(job.status).className}`}>
                          {getStatusConfig(job.status).label}
                        </span>
                      </td>
                      <td className="px-7 py-5 text-right">
                        <Link href={`/recruiter/jobs/${job.id}`} className="inline-flex p-2 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-slate-100 flex flex-wrap items-center justify-between bg-slate-50/50 gap-4">
              <h3 className="font-bold text-[17px] text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Lịch phỏng vấn sắp tới
              </h3>
              <div className="flex items-center gap-2">
                <label htmlFor="interview-date-filter" className="text-[13px] text-slate-500 font-bold uppercase tracking-widest">Lọc:</label>
                <input
                  id="interview-date-filter"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-3 py-2 text-[13px] font-bold rounded-xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none text-slate-700 bg-white transition-all shadow-sm cursor-pointer"
                />
                {selectedDate && (
                  <button
                    onClick={() => setSelectedDate('')}
                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    title="Xóa bộ lọc ngày"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <div className="p-5 space-y-3 bg-slate-50/30">
              {upcomingInterviews.length === 0 ? (
                <div className="py-12 text-center text-slate-500 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                    <Calendar className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium">Chưa có lịch phỏng vấn nào sắp tới.</p>
                </div>
              ) : upcomingInterviews.map((interview: any) => {
                const dateObj = new Date(interview.date);
                const isAccept = interview.status === 'ACCEPTED';
                const isReject = interview.status === 'REJECTED';
                const isConfirmed = interview.status === 'INTERVIEW_CONFIRMED';
                const isReschedule = interview.status === 'RESCHEDULE_REQUESTED';

                return (
                  <div key={interview.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border border-slate-200/60 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50 transition-all duration-300 gap-4">
                    <div className="flex items-start sm:items-center gap-4">
                      {/* Calendar Date Box */}
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-600 flex flex-col items-center justify-center shrink-0 border border-indigo-100/50 shadow-inner">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-80 mb-0.5">Th {dateObj.getMonth() + 1}</span>
                        <span className="text-xl font-black leading-none">{dateObj.getDate()}</span>
                      </div>
                      
                      {/* Info */}
                      <div>
                        <h4 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                          {interview.candidateName}
                          {isConfirmed && <span className="flex w-2 h-2 rounded-full bg-blue-500" title="Đã xác nhận"></span>}
                          {isReschedule && <span className="flex w-2 h-2 rounded-full bg-orange-500" title="Xin dời lịch"></span>}
                        </h4>
                        <p className="text-sm text-slate-500 font-medium line-clamp-1 mb-1.5">{interview.jobTitle}</p>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {interview.time}
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 max-w-[200px] truncate">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate">{interview.location || 'Chưa cập nhật địa điểm'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right side Actions & Status */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                      {/* Status Badge */}
                      {isAccept ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                          <CheckCircle className="w-4 h-4" /> Đã duyệt
                        </span>
                      ) : isReject ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-100">
                          <XCircle className="w-4 h-4" /> Đã từ chối
                        </span>
                      ) : (
                        <div className="flex items-center gap-1 sm:opacity-0 sm:-translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                          <button
                            onClick={() => setConfirmStatusData({ id: interview.id, status: 'ACCEPTED' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:text-white hover:bg-emerald-500 rounded-lg transition-colors border border-emerald-200 hover:border-emerald-500"
                            title="Chấp nhận"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Đậu
                          </button>
                          <button
                            onClick={() => setConfirmStatusData({ id: interview.id, status: 'REJECTED' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-500 rounded-lg transition-colors border border-rose-200 hover:border-rose-500"
                            title="Từ chối"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Rớt
                          </button>
                          <button
                            onClick={() => setEditingInterview(interview)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors ml-1"
                            title="Đổi lịch phỏng vấn"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Tips/Resources */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-7 text-white shadow-xl shadow-slate-900/10 overflow-hidden relative">
            <Sparkles className="absolute -top-4 -right-4 w-32 h-32 text-indigo-400/10" />
            <h3 className="font-black text-xl mb-2.5 relative z-10 flex items-center gap-2">Phân Tích AI</h3>
            <p className="text-indigo-200 text-[13px] leading-relaxed mb-5 relative z-10 font-medium">
              Công nghệ AI sẽ giúp bạn tìm ra những điểm yếu trong JD (tin tuyển dụng) của mình, từ đó sửa đổi để thu hút đúng ứng viên tiềm năng!
            </p>
            {subInfo?.canViewAIReport ? (
              <Link href="/recruiter/ai-report" className="w-full flex items-center justify-center py-3 bg-white text-slate-900 font-bold rounded-2xl text-[14px] hover:bg-slate-50 transition-all shadow-md active:scale-95 relative z-10">
                Mở Báo Cáo AI <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            ) : (
              <Link href="/recruiter/billing/plans" className="w-full flex items-center justify-center py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold rounded-2xl text-[14px] hover:opacity-90 transition-all shadow-md active:scale-95 relative z-10">
                Nâng cấp gói Growth để dùng
              </Link>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-5 opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
              <Wallet className="w-32 h-32 text-indigo-600" />
            </div>
            <h3 className="font-black text-slate-900 text-[17px] mb-1.5 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" /> Ví Nội Bộ
            </h3>
            <p className="text-slate-500 text-[13px] font-medium mb-5">Dùng để mở khóa thông tin ứng viên tiềm năng.</p>
            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-5 mb-5 border border-indigo-100 shadow-inner flex items-end justify-between">
              <div>
                <p className="text-[11px] text-indigo-500 font-black uppercase tracking-widest mb-1.5">Số dư khả dụng</p>
                <p className="text-3xl font-black text-indigo-600 tracking-tight">{walletInfo?.balance || 0} <span className="text-xl">Xu</span></p>
              </div>
            </div>
            <Link
              href="/recruiter/wallet"
              className="w-full flex items-center justify-center py-3 bg-slate-900 text-white font-bold rounded-2xl text-[14px] hover:bg-slate-800 transition-all shadow-md shadow-slate-900/20 active:scale-95"
            >
              Quản lý Ví
            </Link>
          </div>


        </div>
      </div>
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        onTopUp={handleTopUp}
        isSubmitting={isToppingUp}
      />

      <EditInterviewModal
        isOpen={!!editingInterview}
        onClose={() => setEditingInterview(null)}
        onSave={handleSaveInterview}
        interview={editingInterview}
        isSubmitting={isUpdatingInterview}
      />

      <ConfirmStatusModal
        isOpen={!!confirmStatusData}
        onClose={() => setConfirmStatusData(null)}
        onConfirm={() => {
          if (confirmStatusData) updateInterviewStatus(confirmStatusData.id, confirmStatusData.status);
        }}
        statusStr={confirmStatusData?.status}
        isSubmitting={isUpdatingStatus}
      />
    </div>
  );
}
