'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  CreditCard,
  FileText,
  Eye,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Crown,
  ArrowUpRight,
  Wallet,
  ShieldAlert,
  Lock,
} from 'lucide-react';
import { adminDashboardApi, RevenueStats, ViolatingRecruiter } from '@/lib/admin-api';
import Link from 'next/link';
import { useSocketStore } from '@/stores/socket';
import { useAuthStore } from '@/stores/auth';

function AccessDenied({ perm }: { perm: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center">
        <Lock className="w-8 h-8 text-rose-500" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-800">Không có quyền truy cập</h2>
        <p className="text-slate-400 text-sm mt-1">Tài khoản của bạn không có quyền <span className="font-semibold">{perm}</span>.</p>
        <p className="text-slate-400 text-xs mt-1">Liên hệ Supreme Admin để được cấp thêm quyền.</p>
      </div>
    </div>
  );
}

function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount);
}

function formatXuToVnd(xuAmount: number) {
  return formatVnd(xuAmount * 1000);
}

export default function RevenuePage() {
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [violations, setViolations] = useState<ViolatingRecruiter[]>([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [isLoadingViolations, setIsLoadingViolations] = useState(true);
  const [revenueError, setRevenueError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { socket } = useSocketStore();
  const { user } = useAuthStore();

  const perms: string[] = user?.admin?.permissions ?? [];
  const canAccess = perms.includes('SUPER_ADMIN') || perms.includes('MANAGE_REVENUE');

  const isLoading = isLoadingRevenue || isLoadingViolations;

  const fetchData = async () => {
    setIsLoadingRevenue(true);
    setIsLoadingViolations(true);
    setRevenueError(false);

    // Fetch independently so one failure doesn't block the other
    adminDashboardApi.getRevenueStats()
      .then(setRevenue)
      .catch(() => setRevenueError(true))
      .finally(() => { setIsLoadingRevenue(false); setLastUpdated(new Date()); });

    adminDashboardApi.getViolatingRecruiters()
      .then(setViolations)
      .catch(() => setViolations([]))
      .finally(() => setIsLoadingViolations(false));
  };

  useEffect(() => { 
    if (canAccess) fetchData(); 
  }, [canAccess]);

  useEffect(() => {
    if (!socket) return;
    
    const handleRevenueUpdate = () => {
      adminDashboardApi.getRevenueStats()
        .then(setRevenue)
        .catch(() => setRevenueError(true))
        .finally(() => { setLastUpdated(new Date()); });
    };

    socket.on('revenueUpdated', handleRevenueUpdate);
    return () => {
      socket.off('revenueUpdated', handleRevenueUpdate);
    };
  }, [socket]);

  const revenueCards = revenue ? [
    {
      label: 'Doanh Thu Thực Nhận',
      value: formatXuToVnd(revenue.totalSpendingRevenue),
      sub: `Từ ${revenue.packageCount + revenue.postJobCount + revenue.openCvCount} giao dịch chi tiêu`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-100',
    },
    {
      label: 'Tiền Nạp (VND)',
      value: formatVnd(revenue.totalDepositVnd),
      sub: `${revenue.depositCount} giao dịch nạp`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
    },
    {
      label: 'Chi Tiêu Mua Gói',
      value: formatXuToVnd(revenue.packageSpend),
      sub: `${revenue.packageCount} lượt mua gói`,
      icon: CreditCard,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-100',
    },
    {
      label: 'Chi Phí Đăng Tin',
      value: formatXuToVnd(revenue.postJobSpend),
      sub: `${revenue.postJobCount} tin đã đăng`,
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
    },
    {
      label: 'Mở Khóa CV',
      value: formatXuToVnd(revenue.openCvSpend),
      sub: `${revenue.openCvCount} lần mở hồ sơ`,
      icon: Eye,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
    },
  ] : [];

  // Build last 14 days chart data from dailyRevenue
  const chartDays = (() => {
    const days: { date: string; label: string; value: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      days.push({ date: key, label, value: revenue?.dailyRevenue?.[key] || 0 });
    }
    return days;
  })();

  const maxRevenue = Math.max(...chartDays.map((d) => d.value), 1);

  if (!canAccess) return <AccessDenied perm="MANAGE_REVENUE" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Doanh Thu & Vi Phạm</h1>
          <p className="text-sm text-slate-500 mt-1">
            {lastUpdated
              ? `Cập nhật: ${lastUpdated.toLocaleTimeString('vi-VN')}`
              : 'Đang tải...'}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Revenue Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {revenueCards.map((card, i) => (
              <div
                key={i}
                className={`bg-white rounded-2xl border ${card.border} p-4 shadow-sm flex flex-col gap-3`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.bg} border ${card.border}`}>
                  <card.icon className={`w-5 h-5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-lg font-black text-slate-900 leading-tight">{card.value}</p>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">{card.label}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Daily Revenue Bar Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate-800">Xu Hướng Doanh Thu 14 Ngày</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Dựa trên các hoạt động chi tiêu (VNĐ)</p>
                </div>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex items-end gap-1.5 h-36">
                {chartDays.map((day) => {
                  const pct = (day.value / maxRevenue) * 100;
                  return (
                    <div key={day.date} className="flex-1 h-full flex flex-col justify-end items-center gap-1 group relative pt-8">
                       <div className="flex-1 w-full bg-transparent flex items-end justify-center">
                          <div
                            className="w-full bg-blue-500 rounded-t-md transition-all duration-500 hover:bg-blue-600"
                            style={{ height: `${Math.max(pct, day.value > 0 ? 4 : 0)}%` }}
                          />
                       </div>
                      {/* tooltip */}
                      {day.value > 0 && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          {formatXuToVnd(day.value)}
                        </div>
                      )}
                      <span className="text-[9px] text-slate-400 rotate-0 shrink-0">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Spenders */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-800">Top Chi Tiêu</h3>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              {revenue?.topSpenders?.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-8">Chưa có dữ liệu</div>
              ) : (
                <div className="space-y-3">
                  {revenue?.topSpenders?.map((s, i) => (
                    <div key={s.recruiterId} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex flex-col items-center justify-center font-black text-emerald-600 text-xs shadow-sm">
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{s.companyName}</p>
                        <p className="text-xs font-semibold text-emerald-600 mt-0.5">Đã chi: {formatXuToVnd(s.spentAmount)}</p>
                        <p className="text-[10px] text-slate-400 font-medium">Số dư còn lại: {formatXuToVnd(s.balance)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Violation Recruiters Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 bg-rose-50 rounded-xl flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Nhà Tuyển Dụng Vi Phạm</h3>
                <p className="text-xs text-slate-400">Danh sách recruiter đang bị cảnh báo</p>
              </div>
              {violations.length > 0 && (
                <span className="ml-auto bg-rose-100 text-rose-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  {violations.length} người
                </span>
              )}
            </div>

            {violations.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Không có vi phạm nào được ghi nhận</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Công ty</th>
                      <th className="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Email</th>
                      <th className="text-center px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Vi phạm</th>
                      <th className="text-center px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {violations.map((v) => (
                      <tr key={v.recruiterId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-semibold text-slate-800">{v.companyName}</td>
                        <td className="px-5 py-3.5 text-slate-500">{v.email}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${v.violationCount >= 2 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                            <AlertTriangle className="w-3 h-3" />
                            {v.violationCount}/3
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${v.status === 'LOCKED' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {v.status === 'LOCKED' ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
