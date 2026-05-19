'use client';

import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Loader2,
  AlertTriangle,
  Lock,
  Unlock,
  Building,
  User,
  Clock,
  RefreshCw,
} from 'lucide-react';
import {
  adminDashboardApi,
  adminUsersApi,
  ViolatingRecruiter,
  ViolatingCandidate,
} from '@/lib/admin-api';
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

export default function ViolationsPage() {
  const [recruiters, setRecruiters] = useState<ViolatingRecruiter[]>([]);
  const [candidates, setCandidates] = useState<ViolatingCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const { user } = useAuthStore();
  const perms: string[] = user?.admin?.permissions ?? [];
  const canAccess = perms.includes('SUPER_ADMIN') || perms.includes('MANAGE_USERS');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [recruiterData, candidateData] = await Promise.all([
        adminDashboardApi.getViolatingRecruiters(),
        adminDashboardApi.getViolatingCandidates(),
      ]);
      setRecruiters(recruiterData);
      setCandidates(candidateData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch violations', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) fetchData();
  }, [canAccess]);

  const handleToggleLock = async (userId: string, currentStatus: string, type: 'recruiter' | 'candidate') => {
    setIsActionLoading(userId);
    try {
      if (currentStatus === 'LOCKED') {
        await adminUsersApi.unlock(userId);
      } else {
        await adminUsersApi.lock(userId);
      }
      // Re-fetch data
      await fetchData();
    } catch (error) {
      console.error('Action failed', error);
      alert('Không thể thực hiện hành động này. Vui lòng thử lại sau.');
    } finally {
      setIsActionLoading(null);
    }
  };

  if (!canAccess) return <AccessDenied perm="MANAGE_USERS" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Quản Lý Vi Phạm</h1>
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

      {isLoading && recruiters.length === 0 && candidates.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Recruiters Table */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-[700px]">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/80 sticky top-0 z-10">
              <div className="w-12 h-12 bg-rose-100 rounded-2xl flex items-center justify-center border border-rose-200 shadow-sm shadow-rose-100">
                <Building className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">Nhà Tuyển Dụng</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Danh sách recruiter bị cảnh báo</p>
              </div>
              {recruiters.length > 0 && (
                <span className="ml-auto bg-rose-100 border border-rose-200 text-rose-700 text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
                  {recruiters.length} người
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {recruiters.length === 0 ? (
                <div className="py-32 text-center text-slate-400">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-8 h-8 opacity-30" />
                  </div>
                  <p className="text-[15px] font-bold text-slate-800">Không có vi phạm nào</p>
                  <p className="text-sm mt-1">Hệ thống đang hoạt động ổn định</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="text-left px-5 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest bg-white">Thông tin</th>
                      <th className="text-center px-5 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest bg-white">Vi phạm</th>
                      <th className="text-center px-5 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest bg-white">Trạng thái</th>
                      <th className="text-right px-5 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest bg-white">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recruiters.map((v) => (
                      <tr key={v.recruiterId} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-800 text-[14px]">{v.companyName}</p>
                          <p className="text-slate-500 font-medium text-[12px] mt-0.5">{v.email}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-sm ${v.violationCount >= 3 ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60'}`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {v.violationCount}/3
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border shadow-sm ${v.status === 'LOCKED' ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'}`}>
                            {v.status === 'LOCKED' ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleToggleLock(v.userId, v.status, 'recruiter')}
                            disabled={isActionLoading === v.userId}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors shadow-sm disabled:opacity-50
                              ${v.status === 'LOCKED' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' 
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                              }`}
                          >
                            {isActionLoading === v.userId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : v.status === 'LOCKED' ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">
                              {v.status === 'LOCKED' ? 'Mở Khóa' : 'Khóa'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Candidates Table */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-[700px]">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/80 sticky top-0 z-10">
              <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center border border-amber-200 shadow-sm shadow-amber-100">
                <User className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-lg tracking-tight">Ứng Viên</h3>
                <p className="text-xs font-medium text-slate-500 mt-1">Danh sách candidate bị cảnh báo</p>
              </div>
              {candidates.length > 0 && (
                <span className="ml-auto bg-amber-100 border border-amber-200 text-amber-700 text-xs font-black px-3 py-1.5 rounded-xl shadow-sm">
                  {candidates.length} người
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {candidates.length === 0 ? (
                <div className="py-32 text-center text-slate-400">
                  <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-8 h-8 opacity-30" />
                  </div>
                  <p className="text-[15px] font-bold text-slate-800">Không có vi phạm nào</p>
                  <p className="text-sm mt-1">Hệ thống đang hoạt động ổn định</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="text-left px-5 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest bg-white">Thông tin</th>
                      <th className="text-center px-5 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest bg-white">Vi phạm</th>
                      <th className="text-center px-5 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest bg-white">Trạng thái</th>
                      <th className="text-right px-5 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest bg-white">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {candidates.map((c) => (
                      <tr key={c.candidateId} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-5 py-4">
                          <p className="font-black text-slate-800 text-[14px]">{c.fullName}</p>
                          <p className="text-slate-500 font-medium text-[12px] mt-0.5">{c.email}</p>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-sm ${c.violationCount >= 3 ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60'}`}>
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {c.violationCount}/3
                          </span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className={`inline-block px-3 py-1.5 rounded-xl text-[10px] font-black tracking-widest uppercase border shadow-sm ${c.status === 'LOCKED' ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'}`}>
                            {c.status === 'LOCKED' ? 'Đã khóa' : 'Hoạt động'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleToggleLock(c.userId, c.status, 'candidate')}
                            disabled={isActionLoading === c.userId}
                            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors shadow-sm disabled:opacity-50
                              ${c.status === 'LOCKED' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300' 
                                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300'
                              }`}
                          >
                            {isActionLoading === c.userId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : c.status === 'LOCKED' ? (
                              <Unlock className="w-4 h-4" />
                            ) : (
                              <Lock className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">
                              {c.status === 'LOCKED' ? 'Mở Khóa' : 'Khóa'}
                            </span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
