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
  Loader2
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

export default function RecruiterDashboard() {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [walletInfo, setWalletInfo] = useState<any>(null);
  const [subInfo, setSubInfo] = useState<any>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isToppingUp, setIsToppingUp] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/recruiters/dashboard');
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
    fetchDashboard();
    fetchWallet();
    fetchSub();
  }, []);

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

    return () => {
      socket.off('jdViewUpdated', handleJdViewed);
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

  const { stats: apiStats, recentJobs } = data || { stats: {}, recentJobs: [] };

  const stats = [
    { label: 'Tin Tuyển Dụng Đang Mở', value: apiStats.activeJobsCount || 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Tổng Số Ứng Viên', value: apiStats.totalApplicantsCount || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Tin Nhắn Chưa Đọc', value: apiStats.newMessagesCount || 0, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Lượt Xem JD', value: apiStats.totalJDViews || 0, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Chào mừng trở lại, {user?.name || 'Nhà tuyển dụng'}!
          </h1>
          <p className="text-slate-500 mt-1">
            Dưới đây là tổng quan về hoạt động tuyển dụng của bạn.
          </p>
        </div>
        <Link 
          href="/recruiter/post-job"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
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
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 mb-1">{stat.value.toLocaleString()}</p>
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Jobs Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-900">Tin tuyển dụng gần đây</h3>
            <Link href="/recruiter/jobs" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg flex items-center transition-colors">
              Xem tất cả <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Vị trí</th>
                  <th className="px-6 py-4">Ứng viên</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
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
                  <tr key={job.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900 line-clamp-1 max-w-[200px]">{job.title}</p>
                      <p className="text-xs text-slate-500">{timeAgo(job.date)}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">{job.applicants}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${getStatusConfig(job.status).className}`}>
                        {getStatusConfig(job.status).label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/recruiter/jobs/${job.id}`} className="inline-block p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 transition-all">
                        <ChevronRight className="w-5 h-5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Tips/Resources */}
        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-100 overflow-hidden relative">
            <Sparkles className="absolute -top-4 -right-4 w-24 h-24 text-white/10" />
            <h3 className="font-bold text-lg mb-2 relative z-10">Phân Tích AI</h3>
            <p className="text-indigo-100 text-sm mb-4 relative z-10">
              Công nghệ AI sẽ giúp bạn tìm ra những điểm yếu trong JD (tin tuyển dụng) của mình, từ đó sửa đổi để thu hút đúng ứng viên tiềm năng!
            </p>
            {subInfo?.canViewAIReport ? (
              <Link href="/recruiter/ai-report" className="w-full inline-block text-center py-2.5 bg-white text-indigo-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors relative z-10">
                Mở Báo Cáo AI
              </Link>
            ) : (
              <Link href="/recruiter/billing/plans" className="w-full inline-block text-center py-2.5 bg-amber-400 text-amber-900 font-bold rounded-xl text-sm hover:bg-amber-500 transition-colors relative z-10">
                Nâng cấp gói Growth để dùng
              </Link>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
               <Wallet className="w-24 h-24 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
               <Wallet className="w-5 h-5 text-indigo-600" /> Ví Nội Bộ
            </h3>
            <p className="text-slate-500 text-sm mb-4">Dùng để mở khóa thông tin ứng viên tiềm năng.</p>
            <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100 flex items-end justify-between">
               <div>
                 <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Số dư khả dụng</p>
                 <p className="text-2xl font-black text-indigo-700">{walletInfo?.balance || 0} Xu</p>
               </div>
            </div>
            <Link 
              href="/recruiter/wallet"
              className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm hover:bg-slate-800 transition-colors inline-block text-center"
            >
               Quản lý Ví
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Tài nguyên</h3>
            <ul className="space-y-3">
              {[
                { label: 'Quy trình phỏng vấn chuẩn', url: '#' },
                { label: 'Mẫu JD chuyên nghiệp', url: '#' },
                { label: 'Báo cáo lương 2024', url: '#' },
              ].map((link, i) => (
                <li key={i}>
                  <Link 
                    href={link.url}
                    className="flex items-center gap-3 text-sm text-slate-600 hover:text-indigo-600 transition-colors group"
                  >
                    <FileText className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <TopUpModal 
        isOpen={isTopUpOpen} 
        onClose={() => setIsTopUpOpen(false)} 
        onTopUp={handleTopUp} 
        isSubmitting={isToppingUp} 
      />
    </div>
  );
}
