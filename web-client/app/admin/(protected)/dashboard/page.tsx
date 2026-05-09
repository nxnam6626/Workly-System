'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Briefcase, Clock, XCircle, TrendingUp,
  ArrowUpRight, Loader2, RefreshCw, DollarSign,
  Activity, ShieldAlert, BarChart3, Zap, Building2,
  UserCheck, GraduationCap
} from 'lucide-react';
import { adminDashboardApi, DashboardStats, RevenueStats } from '@/lib/admin-api';
import { AdminAnalyticsChat } from '@/components/admin/AdminAnalyticsChat';
import ViolationsList from './components/ViolationsList';

function StatCard({
  label, value, icon: Icon, gradient, href, description, urgent, delta, isLoading
}: {
  label: string; value: number; icon: any; gradient: string;
  href: string; description: string; urgent?: boolean; delta?: string; isLoading: boolean;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-3xl p-4 flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-2xl shadow-xl border border-white/10"
      style={{ background: gradient }}
    >
      {/* Glow circle */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10 group-hover:scale-125 transition-transform duration-500" />
      <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full bg-white/5 group-hover:scale-150 transition-transform duration-700" />

      <div className="relative flex items-start justify-between">
        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="flex items-center gap-1 text-white/70 group-hover:text-white transition-colors">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>

      <div className="relative">
        <p className="text-2xl font-black text-white tracking-tight leading-none">
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-white/60" /> : value.toLocaleString()}
        </p>
        <p className="text-[11px] font-black text-white/90 mt-1.5 uppercase tracking-widest">{label}</p>
        <p className="text-[10px] font-medium text-white/60 mt-0.5">{description}</p>
      </div>

      {urgent && (
        <div className="relative flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-1.5 w-fit">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          <span className="text-white text-xs font-bold">Cần xử lý ngay</span>
        </div>
      )}
    </Link>
  );
}

export default function AdminDashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);

  const fetchStats = () => {
    setIsLoading(true);
    Promise.allSettled([
      adminDashboardApi.getStats(),
      adminDashboardApi.getRevenueStats()
    ]).then(([statsRes, revRes]) => {
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (revRes.status === 'fulfilled') setRevenue(revRes.value);
      setLastUpdated(new Date());
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  // Build last 14 days chart data
  const chartDays = (() => {
    const days: { date: string; label: string; value: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ date: key, label: `${d.getDate()}/${d.getMonth() + 1}`, value: revenue?.dailyRevenue?.[key] || 0 });
    }
    return days;
  })();

  const maxRevenue = Math.max(...chartDays.map(d => d.value), 1);
  const totalRevenue = chartDays.reduce((s, d) => s + d.value, 0);

  function formatVnd(xu: number) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(xu * 1000);
  }

  const statCards = [
    {
      label: 'Tổng Ứng Viên', value: stats?.totalCandidates || 0, icon: GraduationCap,
      gradient: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      href: '/admin/candidates', description: 'Người tìm việc',
    },
    {
      label: 'Nhà Tuyển Dụng', value: stats?.totalRecruiters || 0, icon: UserCheck,
      gradient: 'linear-gradient(135deg, #334155 0%, #1e293b 100%)',
      href: '/admin/recruiters', description: 'Đơn vị tuyển dụng',
    },
    {
      label: 'Tổng Doanh Nghiệp', value: stats?.totalCompanies || 0, icon: Building2,
      gradient: 'linear-gradient(135deg, #475569 0%, #334155 100%)',
      href: '/admin/companies', description: 'Công ty trên hệ thống',
    },
    {
      label: 'Đang Hoạt Động', value: stats?.totalJobs || 0, icon: Briefcase,
      gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
      href: '/admin/jobs?status=APPROVED', description: 'Đã được phê duyệt',
    },
    {
      label: 'Chờ Duyệt', value: stats?.pendingJobs || 0, icon: Clock,
      gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      href: '/admin/jobs?status=PENDING', description: 'Cần xử lý gấp',
      urgent: (stats?.pendingJobs || 0) > 0,
    },
    {
      label: 'Bị Từ Chối', value: stats?.totalRejected || 0, icon: XCircle,
      gradient: 'linear-gradient(135deg, #e11d48 0%, #be123c 100%)',
      href: '/admin/jobs?status=REJECTED', description: 'Vi phạm hoặc chưa đạt',
    },
  ];

  return (
    <div className="space-y-4 min-h-screen pb-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tổng Quan Hệ Thống</h1>
          <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-slate-400" />
            {lastUpdated
              ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}`
              : 'Đang tải dữ liệu...'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-2xl font-black text-sm text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:shadow-md transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          LÀM MỚI
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} isLoading={isLoading} />
        ))}
      </div>

      {/* AI Chat */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <AdminAnalyticsChat />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-4">
          {/* Revenue + Approval row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Approval Rate */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-5 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-black text-slate-900 text-[15px] tracking-tight">Tỷ Lệ Duyệt JD</h3>
                  <p className="text-[11px] font-medium text-slate-500 mt-0.5">Tỷ lệ tin được phê duyệt</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[2rem] leading-none font-black text-slate-900 tracking-tight">{stats?.approvalRate ?? 0}</span>
                    <span className="text-sm font-bold text-slate-400">%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden shadow-inner">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${stats?.approvalRate ?? 0}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Đã Duyệt', value: stats?.totalApproved ?? 0, cls: 'text-emerald-700 bg-emerald-50 border-emerald-200/60' },
                      { label: 'Chờ Xử Lý', value: stats?.pendingJobs ?? 0, cls: 'text-amber-700 bg-amber-50 border-amber-200/60' },
                      { label: 'Từ Chối', value: stats?.totalRejected ?? 0, cls: 'text-rose-700 bg-rose-50 border-rose-200/60' },
                    ].map(item => (
                      <div key={item.label} className={`rounded-2xl p-3 text-center border shadow-sm ${item.cls}`}>
                        <p className="text-xl font-black">{item.value}</p>
                        <p className="text-[9px] font-black uppercase tracking-widest mt-1 opacity-80">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-5 hover:shadow-2xl transition-all duration-300 flex flex-col justify-center">
              <h3 className="font-black text-slate-900 text-[15px] mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> Truy Cập Nhanh
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Duyệt Tin Tuyển Dụng', href: '/admin/jobs', icon: Briefcase, color: 'blue', desc: 'Xem & phê duyệt JD' },
                  { label: 'Quản Lý Ứng Viên', href: '/admin/candidates', icon: Users, color: 'indigo', desc: 'Khóa / mở khóa tài khoản' },
                  { label: 'Báo Cáo Doanh Thu', href: '/admin/revenue', icon: DollarSign, color: 'emerald', desc: 'Thống kê tài chính' },
                  { label: 'Hỗ Trợ & Vi Phạm', href: '/admin/support', icon: ShieldAlert, color: 'rose', desc: 'Báo cáo vi phạm' },
                ].map(action => {
                  const Icon = action.icon;
                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-50 text-blue-600 border-blue-200/60 shadow-blue-100/50',
                    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200/60 shadow-indigo-100/50',
                    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200/60 shadow-emerald-100/50',
                    rose: 'bg-rose-50 text-rose-600 border-rose-200/60 shadow-rose-100/50',
                  };
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex items-center gap-3 p-2.5 rounded-2xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-sm transition-transform group-hover:scale-110 ${colorMap[action.color]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-black text-slate-800 truncate">{action.label}</p>
                        <p className="text-[10px] font-medium text-slate-400 mt-0.5">{action.desc}</p>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Revenue Bar Chart */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 p-5 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-black text-slate-900 text-[15px] tracking-tight">Doanh Thu 14 Ngày</h3>
                <p className="text-[11px] font-medium text-slate-500 mt-0.5">Thống kê nạp xu & thanh toán dịch vụ</p>
              </div>
              <div className="text-right bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 shadow-inner">
                <p className="text-base font-black text-slate-900 tracking-tight">{formatVnd(totalRevenue)}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Tổng 14 ngày</p>
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
            ) : (
              <div className="flex items-end gap-1.5 h-36">
                {chartDays.map(day => {
                  const pct = (day.value / maxRevenue) * 100;
                  return (
                    <div key={day.date} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group relative">
                      {day.value > 0 && (
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          {formatVnd(day.value)}
                        </div>
                      )}
                      <div
                        className="w-full rounded-t-xl transition-all duration-500 shadow-sm hover:opacity-80"
                        style={{
                          height: `${Math.max(pct, day.value > 0 ? 4 : 1)}%`,
                          background: day.value > 0
                            ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
                            : '#f1f5f9'
                        }}
                      />
                      <span className="text-[9px] font-bold text-slate-400 shrink-0 uppercase tracking-widest">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Violations */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden hover:shadow-2xl transition-all duration-300">
          <ViolationsList />
        </div>
      </div>
    </div>
  );
}
