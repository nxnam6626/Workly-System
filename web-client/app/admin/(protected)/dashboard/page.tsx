'use client';

import { useState, useEffect } from 'react';
import { Users, Briefcase, Clock, CheckCircle2, XCircle, TrendingUp, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';
import { adminDashboardApi, DashboardStats } from '@/lib/admin-api';
import Link from 'next/link';
import ViolationsList from './components/ViolationsList';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = () => {
    setIsLoading(true);
    adminDashboardApi.getStats()
      .then(data => {
        setStats(data);
        setLastUpdated(new Date());
      })
      .catch(err => console.error('Failed to load dashboard stats:', err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const statCards = [
    {
      label: 'Tổng Người Dùng',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      href: '/admin/users',
      description: 'Tài khoản đã đăng ký',
    },
    {
      label: 'Tin Đang Hoạt Động',
      value: stats?.totalJobs || 0,
      icon: Briefcase,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
      href: '/admin/jobs',
      description: 'Đã được phê duyệt',
    },
    {
      label: 'Tin Chờ Duyệt',
      value: stats?.pendingJobs || 0,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      href: '/admin/jobs',
      description: 'Cần xử lý',
      urgent: (stats?.pendingJobs || 0) > 0,
    },
    {
      label: 'Tin Bị Từ Chối',
      value: stats?.totalRejected || 0,
      icon: XCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      href: '/admin/jobs',
      description: 'Vi phạm hoặc chưa đạt',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Tổng Quan Hệ Thống</h1>
          <p className="text-sm text-slate-500 mt-1">
            {lastUpdated
              ? `Cập nhật lần cuối: ${lastUpdated.toLocaleTimeString('vi-VN')}`
              : 'Đang tải dữ liệu...'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <Link
            key={i}
            href={card.href}
            className={`group bg-white rounded-2xl border ${card.urgent ? 'border-amber-200 shadow-amber-50/80' : 'border-slate-200'} p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col gap-4`}
          >
            <div className="flex items-start justify-between">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.bg} ${card.border} border`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">
                {isLoading
                  ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  : card.value.toLocaleString()}
              </p>
              <p className="text-sm font-semibold text-slate-600 mt-0.5">{card.label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{card.description}</p>
            </div>
            {card.urgent && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 rounded-lg px-2 py-1 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Cần xử lý ngay
              </div>
            )}
          </Link>
        ))}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Approval rate */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800">Tỷ Lệ Duyệt</h3>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-300" />
            </div>
          ) : (
            <>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-black text-slate-900">{stats?.approvalRate ?? 0}</span>
                <span className="text-xl font-bold text-slate-400 mb-1">%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 mb-4">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700"
                  style={{ width: `${stats?.approvalRate ?? 0}%` }}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Đã duyệt', value: stats?.totalApproved ?? 0, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Chờ duyệt', value: stats?.pendingJobs ?? 0, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Từ chối', value: stats?.totalRejected ?? 0, color: 'text-rose-600 bg-rose-50' },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-2 text-center ${item.color}`}>
                    <p className="text-lg font-black">{item.value}</p>
                    <p className="text-[10px] font-semibold">{item.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Violations List */}
        <div className="lg:col-span-1">
          <ViolationsList />
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-slate-800 mb-4 text-sm">Truy Cập Nhanh</h3>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {[
              { label: 'Duyệt Tin', href: '/admin/jobs', icon: Briefcase, color: 'blue' },
              { label: 'Người Dùng', href: '/admin/users', icon: Users, color: 'indigo' },
              { label: 'Doanh Thu', href: '/admin/revenue', icon: TrendingUp, color: 'emerald' },
            ].map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href + action.label}
                  href={action.href}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all"
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-600 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">{action.label}</p>
                </Link>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[10px] text-slate-400 text-center font-medium">Hệ thống quản trị Workly v1.0</p>
          </div>
        </div>
      </div>
    </div>
  );
}
