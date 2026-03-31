'use client';

import { useState, useEffect } from 'react';
import { PieChart, Users, Briefcase, Activity, Clock, Loader2 } from 'lucide-react';
import { adminDashboardApi, DashboardStats } from '@/lib/admin-api';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminDashboardApi.getStats()
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load dashboard stats:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Thống Kê Tổng Quan</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bảng điều khiển theo dõi hoạt động của hệ thống
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tổng Số Người Dùng', value: stats?.totalUsers || 0, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Tin Đang Hoạt Động', value: stats?.totalJobs || 0, icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Tin Chờ Duyệt', value: stats?.pendingJobs || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Lượt Cào Dữ Liệu', value: stats?.crawlCount || 0, icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : stat.value.toLocaleString()}
              </p>
              <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-sm mt-8">
        <PieChart className="w-16 h-16 mx-auto text-slate-300 mb-4 opacity-50" />
        <h3 className="text-lg font-semibold text-slate-700">Biểu đồ tổng hợp đang cập nhật</h3>
        <p className="text-sm mt-2">Tính năng phân tích độ chính xác AI dựa trên nguồn tin lưới sẽ ra mắt trong tương lai.</p>
        {stats && (
           <div className="mt-4 px-4 py-2 bg-slate-50 inline-block rounded-xl border border-slate-100 text-slate-600 font-medium">
              Tỷ lệ tin duyệt thành công ước tính: {stats.approvalRate}%
           </div>
        )}
      </div>
    </div>
  );
}
