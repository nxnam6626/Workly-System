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
  Clock,
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
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoadingRevenue, setIsLoadingRevenue] = useState(true);
  const [isLoadingViolations, setIsLoadingViolations] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);
  const [revenueError, setRevenueError] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  
  const { socket } = useSocketStore();
  const { user } = useAuthStore();

  const perms: string[] = user?.admin?.permissions ?? [];
  const canAccess = perms.includes('SUPER_ADMIN') || perms.includes('MANAGE_REVENUE');

  const isLoading = isLoadingRevenue || isLoadingViolations || isLoadingTransactions;

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

    setIsLoadingTransactions(true);
    adminDashboardApi.getRecentTransactions(20)
      .then(setTransactions)
      .catch(() => setTransactions([]))
      .finally(() => setIsLoadingTransactions(false));
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
        
      adminDashboardApi.getRecentTransactions(20)
        .then(setTransactions)
        .catch(() => setTransactions([]));
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
      shadow: 'shadow-emerald-200/40',
    },
    {
      label: 'Tiền Nạp (VND)',
      value: formatVnd(revenue.totalDepositVnd),
      sub: `${revenue.depositCount} giao dịch nạp`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-100',
      shadow: 'shadow-blue-200/40',
    },
    {
      label: 'Chi Tiêu Mua Gói',
      value: formatXuToVnd(revenue.packageSpend),
      sub: `${revenue.packageCount} lượt mua gói`,
      icon: CreditCard,
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      border: 'border-slate-200',
      shadow: 'shadow-slate-200/40',
    },
    {
      label: 'Chi Phí Đăng Tin',
      value: formatXuToVnd(revenue.postJobSpend),
      sub: `${revenue.postJobCount} tin đã đăng`,
      icon: FileText,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-100',
      shadow: 'shadow-amber-200/40',
    },
    {
      label: 'Mở Khóa CV',
      value: formatXuToVnd(revenue.openCvSpend),
      sub: `${revenue.openCvCount} lần mở hồ sơ`,
      icon: Eye,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-100',
      shadow: 'shadow-rose-200/40',
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
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Doanh Thu & Vi Phạm</h1>
          <p className="text-sm font-medium text-slate-500 mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            {lastUpdated
              ? `Cập nhật lần cuối: ${lastUpdated.toLocaleTimeString('vi-VN')}`
              : 'Đang tải...'}
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isLoading}
          className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-slate-200 rounded-2xl font-black text-sm text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${isLoading ? 'animate-spin' : ''}`} />
          LÀM MỚI
        </button>
      </div>

      {/* Revenue Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {revenueCards.map((card, i) => (
              <div
                key={i}
                className={`bg-white rounded-3xl border ${card.border} p-5 shadow-lg ${card.shadow} hover:-translate-y-1 hover:shadow-xl transition-all duration-300 flex flex-col gap-4 relative overflow-hidden group`}
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-gradient-to-br from-white/40 to-transparent opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${card.bg} border ${card.border} relative z-10 group-hover:rotate-6 transition-transform`}>
                  <card.icon className={`w-6 h-6 ${card.color}`} />
                </div>
                <div className="relative z-10">
                  <p className="text-xl font-black text-slate-900 leading-tight tracking-tight">{card.value}</p>
                  <p className="text-[10px] font-black text-slate-500 mt-1 uppercase tracking-widest">{card.label}</p>
                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily Revenue Bar Chart */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 lg:p-8 lg:col-span-2 hover:shadow-2xl transition-all duration-300 flex flex-col">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">Xu Hướng Doanh Thu 14 Ngày</h3>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">Dựa trên các hoạt động chi tiêu (VNĐ)</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm">
                  <TrendingUp className="w-6 h-6 text-emerald-500" />
                </div>
              </div>
              <div className="flex items-end gap-2 h-48 flex-1 mt-auto">
                {chartDays.map((day) => {
                  const pct = (day.value / maxRevenue) * 100;
                  return (
                    <div key={day.date} className="flex-1 h-full flex flex-col justify-end items-center gap-1.5 group relative pt-8">
                       <div className="flex-1 w-full bg-transparent flex items-end justify-center">
                          <div
                            className="w-full bg-slate-800 rounded-t-xl transition-all duration-500 group-hover:bg-slate-700 shadow-md shadow-slate-300"
                            style={{ height: `${Math.max(pct, day.value > 0 ? 4 : 0)}%` }}
                          />
                       </div>
                      {/* tooltip */}
                      {day.value > 0 && (
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                          {formatXuToVnd(day.value)}
                        </div>
                      )}
                      <span className="text-[10px] font-bold text-slate-400 rotate-0 shrink-0 uppercase tracking-widest">{day.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Spenders */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-6 lg:p-8 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">Top Chi Tiêu</h3>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">Khách hàng VIP</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm">
                  <Crown className="w-6 h-6 text-amber-500" />
                </div>
              </div>
              {revenue?.topSpenders?.length === 0 ? (
                <div className="text-center text-slate-400 text-sm py-12 font-medium">Chưa có dữ liệu</div>
              ) : (
                <div className="space-y-4">
                  {revenue?.topSpenders?.map((s, i) => (
                    <div key={s.recruiterId} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/50 hover:-translate-y-0.5 transition-all group">
                      <div className="w-10 h-10 shrink-0 rounded-xl bg-emerald-100 flex flex-col items-center justify-center font-black text-emerald-600 text-sm shadow-sm border border-emerald-200 group-hover:scale-110 transition-transform">
                        #{i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-black text-slate-800 truncate">{s.companyName}</p>
                        <p className="text-[13px] font-bold text-emerald-600 mt-0.5">Đã chi: {formatXuToVnd(s.spentAmount)}</p>
                        <p className="text-[11px] text-slate-400 font-medium mt-1">Số dư còn lại: {formatXuToVnd(s.balance)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Violation Recruiters Table */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center border border-rose-200 shadow-sm shadow-rose-100">
                <ShieldAlert className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">Nhà Tuyển Dụng Vi Phạm</h3>
                <p className="text-[13px] font-medium text-slate-500 mt-1">Danh sách recruiter đang bị cảnh báo</p>
              </div>
              {violations.length > 0 && (
                <span className="ml-auto bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
                  {violations.length} người
                </span>
              )}
            </div>

            {violations.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8 opacity-30" />
                </div>
                <p className="text-[15px] font-bold text-slate-800">Không có vi phạm nào được ghi nhận</p>
                <p className="text-sm mt-1">Hệ thống đang hoạt động ổn định</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-slate-100">
                    <tr>
                      <th className="text-left px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Công ty</th>
                      <th className="text-left px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Email</th>
                      <th className="text-center px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Vi phạm</th>
                      <th className="text-center px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {violations.map((v) => (
                       <tr key={v.recruiterId} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5 font-black text-slate-800 text-[14px]">{v.companyName}</td>
                        <td className="px-6 py-5 text-slate-500 font-medium text-[13px]">{v.email}</td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-sm ${v.violationCount >= 2 ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60'}`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {v.violationCount}/3
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <span className={`inline-block px-3 py-1.5 rounded-xl text-[11px] font-black tracking-widest uppercase border shadow-sm ${v.status === 'LOCKED' ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'}`}>
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

          {/* Recent Transactions Table */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden hover:shadow-2xl transition-all duration-300">
            <div className="p-6 lg:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center border border-indigo-200 shadow-sm shadow-indigo-100">
                  <Wallet className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-xl tracking-tight">Lịch Sử Chi Tiêu Gần Đây</h3>
                  <p className="text-[13px] font-medium text-slate-500 mt-1">Theo dõi hoạt động giao dịch của các nhà tuyển dụng</p>
                </div>
              </div>
            </div>

            {isLoadingTransactions ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 opacity-30" />
                </div>
                <p className="text-[15px] font-bold text-slate-800">Không có giao dịch nào gần đây</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-slate-100">
                    <tr>
                      <th className="text-left px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Thời gian</th>
                      <th className="text-left px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Khách hàng</th>
                      <th className="text-left px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Loại giao dịch</th>
                      <th className="text-left px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Mô tả</th>
                      <th className="text-right px-6 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Số tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map((tx) => (
                       <tr key={tx.transactionId} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-5 text-slate-500 font-medium text-[13px] whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString('vi-VN')}
                        </td>
                        <td className="px-6 py-5">
                          <p className="font-black text-slate-800 text-[14px]">{tx.companyName}</p>
                          <p className="text-[12px] text-slate-500">{tx.recruiterName}</p>
                        </td>
                        <td className="px-6 py-5">
                           <span className={`inline-block px-3 py-1 rounded-xl text-[11px] font-black tracking-widest uppercase border shadow-sm ${
                              tx.type === 'DEPOSIT' ? 'bg-blue-50 text-blue-700 border-blue-200/60' :
                              tx.type === 'BUY_PACKAGE' ? 'bg-purple-50 text-purple-700 border-purple-200/60' :
                              tx.type === 'POST_JOB' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                              'bg-rose-50 text-rose-700 border-rose-200/60'
                           }`}>
                             {tx.type === 'DEPOSIT' ? 'Nạp xu' : tx.type === 'BUY_PACKAGE' ? 'Mua gói' : tx.type === 'POST_JOB' ? 'Đăng tin' : 'Mở CV'}
                           </span>
                        </td>
                        <td className="px-6 py-5 text-slate-600 font-medium text-[13px] max-w-xs truncate" title={tx.description}>
                          {tx.description}
                        </td>
                        <td className="px-6 py-5 text-right">
                           <p className={`font-black text-[14px] ${tx.type === 'DEPOSIT' ? 'text-blue-600' : 'text-slate-700'}`}>
                              {tx.type === 'DEPOSIT' ? '+' : '-'}{tx.amount} xu
                           </p>
                           {tx.realMoney > 0 && (
                             <p className="text-[11px] text-slate-400 mt-0.5">({formatVnd(tx.realMoney)})</p>
                           )}
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
