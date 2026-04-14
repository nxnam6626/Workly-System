'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  ArrowLeft,
  Search,
  Bell,
  Trash2,
  Plus,
  Loader2,
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { jobAlertsApi, type JobAlert } from '@/lib/job-alerts-api';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  
  const [alerts, setAlerts] = useState<JobAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile/settings');
      return;
    }
    if (isAuthenticated) {
      fetchAlerts();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await jobAlertsApi.getAlerts();
      setAlerts(data);
    } catch (error) {
      toast.error('Không thể tải dữ liệu gợi ý.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newKeyword.trim();
    if (!trimmed) return;

    if (alerts.some(a => a.keywords.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Từ khoá này đã tồn tại trong danh sách.');
      return;
    }

    if (alerts.length >= 10) {
      toast.error('Bạn chỉ có thể tạo tối đa 10 từ khoá thông báo.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Đang lưu...');
    try {
      const newAlert = await jobAlertsApi.createAlert(trimmed);
      setAlerts([...alerts, newAlert]);
      setNewKeyword('');
      toast.success('Đã lưu từ khoá thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAlert = async (id: string, keyword: string) => {
    if (!confirm(`Bạn muốn hủy nhận thông báo cho từ khoá "${keyword}"?`)) return;

    const toastId = toast.loading('Đang huỷ...');
    try {
      await jobAlertsApi.deleteAlert(id);
      setAlerts(alerts.filter(a => a.jobAlertId !== id));
      toast.success('Đã xoá thành công', { id: toastId });
    } catch (error) {
      toast.error('Có lỗi khi xoá', { id: toastId });
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <div className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                  <Settings className="w-4 h-4" />
                </div>
                Trung tâm việc làm
              </h1>
              <nav className="hidden md:flex items-center gap-5">
                <Link href="/profile" className="text-[13px] font-bold text-slate-400 hover:text-slate-700 transition-colors">Dashboard</Link>
                <div className="h-4 w-px bg-slate-200" />
                <span className="text-[13px] font-black text-blue-600">Cài đặt gợi ý</span>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/profile" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-[13px] hover:bg-blue-100 transition-all shadow-sm">
                Quay lại
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
             <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
               Cài đặt Gợi ý Việc làm (Job Alerts)
             </h2>
             <p className="text-sm text-slate-500">
                Thiết lập các từ khoá (Ví dụ: "ReactJS", "Hồ Chí Minh"). 
                Hệ thống sẽ tự động tổng hợp danh sách việc phù hợp với bạn.
             </p>
          </div>
        </div>

        {/* Cấu hình Alerts */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
             <div className="flex items-center gap-2 text-slate-800 font-bold mb-4">
                <Bell className="w-5 h-5 text-blue-600" /> Thêm từ khoá mới
             </div>
             <form onSubmit={handleAddAlert} className="flex gap-3">
               <div className="relative flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                 <input 
                   type="text" 
                   value={newKeyword}
                   onChange={e => setNewKeyword(e.target.value)}
                   disabled={isSubmitting}
                   placeholder="Nhập chức danh, kỹ năng hoặc địa điểm..."
                   className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-slate-800 outline-none"
                 />
               </div>
               <button 
                 type="submit" 
                 disabled={!newKeyword.trim() || isSubmitting}
                 className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm"
               >
                 {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                 Thêm
               </button>
             </form>
             <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" /> Thêm các cụm từ ngắn gọn sẽ mang lại kết quả tốt nhất. Tối đa 10 từ khoá.
             </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-slate-800">Từ khoá đang theo dõi ({alerts.length}/10)</h3>
            </div>

            {alerts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-slate-100">
                   <Briefcase className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600 mb-1">Chưa có gợi ý nào</p>
                <p className="text-[13px] text-slate-400 max-w-sm">
                   Bạn chưa thiết lập nhận thông báo. Hệ thống sẽ không thể tự động tìm việc giúp bạn.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {alerts.map(alert => (
                  <div key={alert.jobAlertId} className="group relative flex items-center justify-between p-4 bg-slate-50 hover:bg-blue-50 transition-colors border border-slate-100 hover:border-blue-200 rounded-2xl">
                     <div>
                       <p className="font-bold text-slate-800 text-[15px]">{alert.keywords}</p>
                       <p className="text-[11px] font-medium text-slate-400 mt-0.5">
                         Tạo: {new Date(alert.createdAt).toLocaleDateString('vi-VN')}
                       </p>
                     </div>
                     <button
                        onClick={() => handleDeleteAlert(alert.jobAlertId, alert.keywords)}
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 rounded-lg shadow-sm transition-all opacity-100 md:opacity-0 group-hover:opacity-100"
                        title="Xoá từ khoá"
                     >
                        <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
