'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, Briefcase, Clock, XCircle, TrendingUp,
  ArrowUpRight, Loader2, RefreshCw, DollarSign,
  Activity, ShieldAlert, BarChart3, Zap
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
      className="group relative overflow-hidden rounded-2xl p-6 flex flex-col gap-4 transition-all hover:-translate-y-1 hover:shadow-xl shadow-md"
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
        <p className="text-3xl font-black text-white tracking-tight">
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-white/60" /> : value.toLocaleString()}
        </p>
        <p className="text-sm font-bold text-white/90 mt-0.5">{label}</p>
        <p className="text-xs text-white/60 mt-0.5">{description}</p>
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

export default function DashboardPage() {
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
      label: 'Tổng Người Dùng', value: stats?.totalUsers || 0, icon: Users,
      gradient: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
      href: '/admin/users', description: 'Tài khoản đã đăng ký',
    },
    {
      label: 'Tin Đang Hoạt Động', value: stats?.totalJobs || 0, icon: Briefcase,
      gradient: 'linear-gradient(135deg, #064e3b 0%, #059669 100%)',
      href: '/admin/jobs', description: 'Đã được phê duyệt',
    },
    {
      label: 'Chờ Duyệt', value: stats?.pendingJobs || 0, icon: Clock,
      gradient: 'linear-gradient(135deg, #78350f 0%, #f59e0b 100%)',
      href: '/admin/jobs', description: 'Cần xử lý',
      urgent: (stats?.pendingJobs || 0) > 0,
    },
    {
      label: 'Tin Bị Từ Chối', value: stats?.totalRejected || 0, icon: XCircle,
      gradient: 'linear-gradient(135deg, #4c0519 0%, #e11d48 100%)',
      href: '/admin/jobs', description: 'Vi phạm hoặc chưa đạt',
    },
  ];

  return (
    <div className="space-y-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Tổng Quan Hệ Thống</h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            {lastUpdated
              ? `Cập nhật lúc ${lastUpdated.toLocaleTimeString('vi-VN')}`
              : 'Đang tải dữ liệu...'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm disabled:opacity-50 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} isLoading={isLoading} />
        ))}
      </div>

      {/* AI Chat */}
      <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
        <AdminAnalyticsChat />
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Charts */}
        <div className="lg:col-span-2 space-y-5">
          {/* Revenue + Approval row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Approval Rate */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Tỷ Lệ Duyệt JD</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Tỷ lệ tin được phê duyệt</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1 mb-3">
                    <span className="text-4xl font-black text-slate-900">{stats?.approvalRate ?? 0}</span>
                    <span className="text-lg font-bold text-slate-400">%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${stats?.approvalRate ?? 0}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Duyệt', value: stats?.totalApproved ?? 0, cls: 'text-emerald-700 bg-emerald-50 border-emerald-100' },
                      { label: 'Chờ', value: stats?.pendingJobs ?? 0, cls: 'text-amber-700 bg-amber-50 border-amber-100' },
                      { label: 'Từ chối', value: stats?.totalRejected ?? 0, cls: 'text-rose-700 bg-rose-50 border-rose-100' },
                    ].map(item => (
                      <div key={item.label} className={`rounded-xl p-2.5 text-center border ${item.cls}`}>
                        <p className="text-xl font-black">{item.value}</p>
                        <p className="text-[10px] font-semibold mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-500" /> Truy Cập Nhanh
              </h3>
              <div className="space-y-2">
                {[
                  { label: 'Duyệt Tin Tuyển Dụng', href: '/admin/jobs', icon: Briefcase, color: 'blue', desc: 'Xem & phê duyệt JD' },
                  { label: 'Quản Lý Người Dùng', href: '/admin/users', icon: Users, color: 'indigo', desc: 'Khóa / mở khóa tài khoản' },
                  { label: 'Báo Cáo Doanh Thu', href: '/admin/revenue', icon: DollarSign, color: 'emerald', desc: 'Thống kê tài chính' },
                  { label: 'Hỗ Trợ & Vi Phạm', href: '/admin/support', icon: ShieldAlert, color: 'rose', desc: 'Báo cáo vi phạm' },
                ].map(action => {
                  const Icon = action.icon;
                  const colorMap: Record<string, string> = {
                    blue: 'bg-blue-50 text-blue-600 border-blue-100 hover:bg-blue-100',
                    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100',
                    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100',
                    rose: 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100',
                  };
                  return (
                    <Link
                      key={action.href}
                      href={action.href}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 transition-all"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-colors ${colorMap[action.color]}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-700 truncate">{action.label}</p>
                        <p className="text-[10px] text-slate-400">{action.desc}</p>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Revenue Bar Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Doanh Thu 14 Ngày</h3>
                <p className="text-xs text-slate-400 mt-0.5">Thống kê nạp xu & thanh toán dịch vụ</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-slate-900">{formatVnd(totalRevenue)}</p>
                <p className="text-[10px] text-slate-400">Tổng 14 ngày</p>
              </div>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
            ) : (
              <div className="flex items-end gap-1 h-40">
                {chartDays.map(day => {
                  const pct = (day.value / maxRevenue) * 100;
                  return (
                    <div key={day.date} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group relative">
                      {day.value > 0 && (
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {formatVnd(day.value)}
                        </div>
                      )}
                      <div
                        className="w-full rounded-t-md transition-all duration-500"
                        style={{
                          height: `${Math.max(pct, day.value > 0 ? 4 : 1)}%`,
                          background: day.value > 0
                            ? 'linear-gradient(180deg, #6366f1 0%, #4338ca 100%)'
                            : '#e2e8f0'
                        }}
                      />
                      <span className="text-[8px] text-slate-400 shrink-0">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Violations */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <ViolationsList />
        </div>
      </div>
    </div>
  );
}
