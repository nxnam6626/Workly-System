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

export default function RecruiterDashboard() {
  const { user } = useAuthStore();
  const { socket } = useSocketStore();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchDashboard();
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
                      <Link href={`/jobs/${job.id}`} className="inline-block p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600 transition-all">
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
            <h3 className="font-bold text-lg mb-2 relative z-10">Gợi ý từ AI</h3>
            <p className="text-indigo-100 text-sm mb-4 relative z-10">
              JD cho vị trí "Senior Frontend" của bạn có thể thu hút thêm 20% ứng viên nếu bổ sung thông tin về chế độ làm việc Hybrid.
            </p>
            <button className="w-full py-2.5 bg-white text-indigo-600 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors relative z-10">
              Cập nhật JD ngay
            </button>
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
    </div>
  );
}
