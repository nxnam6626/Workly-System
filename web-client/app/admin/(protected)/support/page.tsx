'use client';

import { useState, useEffect } from 'react';
import { adminSupportApi, SupportRequest, adminUsersApi } from '@/lib/admin-api';
import { Mail, CheckCircle2, CircleDashed, Filter, CalendarDays, KeySquare, HelpCircle, LockOpen, Lock } from 'lucide-react';
import { useSocketStore } from '@/stores/socket';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';

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

export default function SupportManagementPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const { socket } = useSocketStore();
  const { user } = useAuthStore();

  const perms: string[] = user?.admin?.permissions ?? [];
  const canAccess = perms.includes('SUPER_ADMIN') || perms.includes('MANAGE_SUPPORT');

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const data = await adminSupportApi.getAll();
      setRequests(data);
    } catch (err) {
      setError('Không thể tải danh sách yêu cầu hỗ trợ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (canAccess) fetchRequests();
  }, [canAccess]);

  useEffect(() => {
    if (!socket) return;
    
    const handleNewRequest = (data: any) => {
      toast.success(`Có khiếu nại mới từ ${data.email || 'người dùng'}`);
      fetchRequests();
    };

    socket.on('newSupportRequest', handleNewRequest);
    return () => {
      socket.off('newSupportRequest', handleNewRequest);
    };
  }, [socket]);

  const handleUpdateStatus = async (id: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'CLOSED') => {
    try {
      await adminSupportApi.updateStatus(id, newStatus);
      setRequests(requests.map(req => req.requestId === id ? { ...req, status: newStatus } : req));
    } catch (err) {
      alert('Cập nhật trạng thái thất bại.');
    }
  };

  const handleUnlockUser = async (userId: string, requestId: string) => {
    try {
      await adminUsersApi.unlock(userId);
      await adminSupportApi.updateStatus(requestId, 'CLOSED');
      toast.success('Thao tác thành công. Tài khoản đã được mở khóa và yêu cầu đã đóng!');
      // Update local state to reflect unlocked status and closed ticket
      setRequests(requests.map(req => {
        if (req.user?.userId === userId) {
          return { 
            ...req, 
            status: req.requestId === requestId ? 'CLOSED' : req.status,
            user: { ...req.user, status: 'ACTIVE' } 
          };
        }
        return req;
      }));
    } catch (err) {
      toast.error('Mở khóa tài khoản thất bại.');
    }
  };

  const handleUnlockWithProbation = async (userId: string, requestId: string) => {
    try {
      await adminUsersApi.unlockWithProbation(userId);
      await adminSupportApi.updateStatus(requestId, 'CLOSED');
      toast.success('Thao tác thành công. Tài khoản đã được đưa vào danh sách Thử thách!');
      setRequests(requests.map(req => {
        if (req.user?.userId === userId) {
          return { 
            ...req, 
            status: req.requestId === requestId ? 'CLOSED' : req.status,
            user: { ...req.user, status: 'ACTIVE', accountLevel: 'PROBATION' } 
          };
        }
        return req;
      }));
    } catch (err) {
      toast.error('Thao tác thất bại.');
    }
  };

  const filteredRequests = filterStatus === 'ALL' ? requests : requests.filter(r => r.status === filterStatus);

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-700 whitespace-nowrap">Đang chờ</span>;
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">Đang xử lý</span>;
      case 'CLOSED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-700 whitespace-nowrap">Hoàn thành</span>;
      default:
        return null;
    }
  };

  if (!canAccess) return <AccessDenied perm="MANAGE_SUPPORT" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
               <HelpCircle className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Hỗ Trợ
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                  Tổng hợp khiếu nại, kháng cáo và liên hệ từ người dùng.
                </p>
             </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative group">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 appearance-none outline-none focus:ring-0 focus:border-indigo-500 transition-all cursor-pointer shadow-sm"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OPEN">Đang chờ (Open)</option>
              <option value="IN_PROGRESS">Đang xử lý (In Progress)</option>
              <option value="CLOSED">Hoàn thành (Closed)</option>
            </select>
            <Filter className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none" />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">Đang tải...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-10 font-medium">{error}</div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-blue-100 shadow-2xl shadow-blue-50/50 overflow-hidden flex flex-col min-h-[600px] relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-400 to-blue-500" />
          {filteredRequests.length === 0 ? (
            <div className="py-32 text-center text-slate-400 flex flex-col items-center">
              <Mail className="w-16 h-16 mb-4 text-slate-200" />
              <p className="font-bold text-lg text-slate-400">Chưa có yêu cầu nào</p>
            </div>
          ) : (
            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap border-collapse">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50/80 backdrop-blur-sm">
                    <th className="px-8 py-5">Trạng thái</th>
                    <th className="px-8 py-5">Người gửi</th>
                    <th className="px-8 py-5 max-w-[300px]">Nội dung</th>
                    <th className="px-8 py-5">Tài khoản</th>
                    <th className="px-8 py-5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 align-top w-32">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-8 py-5 align-top min-w-[200px]">
                        <p className="text-[14px] font-black tracking-tight text-slate-900 truncate">{req.name || 'Người dùng ẩn danh'}</p>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-1 truncate">
                          <Mail className="w-3.5 h-3.5" />
                          {req.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mt-1 truncate">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {new Date(req.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-8 py-5 align-top max-w-[300px]">
                        <p className="text-[14px] font-black text-slate-900 mb-2 truncate" title={req.subject}>{req.subject}</p>
                        <div className="text-[13px] font-medium text-slate-600 whitespace-pre-wrap leading-relaxed outline outline-1 outline-slate-100 p-4 rounded-2xl bg-slate-50/50 line-clamp-3">
                          {req.message}
                        </div>
                      </td>
                      <td className="px-8 py-5 align-top w-40">
                        {req.user ? (
                          <div className="flex flex-col gap-1.5 align-start">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 w-fit">
                              Có ID hệ thống
                            </span>
                            <span className="text-xs font-semibold text-slate-500">{req.user.userRoles[0]?.role?.roleName}</span>
                            <span className="text-xs font-medium text-slate-400 break-all">{req.user.email}</span>
                            {req.user.recruiter && req.user.recruiter.violationCount > 0 && (
                              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 w-fit">
                                Lỗi vi phạm: {req.user.recruiter.violationCount}
                              </span>
                            )}
                            {req.user.accountLevel === 'PROBATION' && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-amber-500 text-white w-fit uppercase tracking-wider">
                                Đang thử thách
                              </span>
                            )}
                            {req.user.status === 'LOCKED' && (
                              <button
                                onClick={() => handleUnlockUser(req.user!.userId, req.requestId)}
                                className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 px-2.5 py-1.5 rounded-lg transition-colors w-fit shadow-sm"
                              >
                                <LockOpen className="w-3.5 h-3.5" />
                                Mở khóa ngay
                              </button>
                            )}
                            {req.user.status === 'LOCKED' && (
                              <button
                                onClick={() => handleUnlockWithProbation(req.user!.userId, req.requestId)}
                                className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2.5 py-1.5 rounded-lg transition-colors w-fit shadow-sm"
                              >
                                <CircleDashed className="w-3.5 h-3.5" />
                                Mở khóa (Thử thách)
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Khách (Guest)</span>
                        )}
                      </td>
                      <td className="px-8 py-5 align-top text-right min-w-[140px]">
                        {req.status !== 'CLOSED' && (
                          <div className="flex flex-col gap-2 items-end">
                            {req.status === 'OPEN' && (
                              <button
                                onClick={() => handleUpdateStatus(req.requestId, 'IN_PROGRESS')}
                                className="flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors border border-amber-200"
                              >
                                <CircleDashed className="w-3.5 h-3.5" />
                                Xử lý ngay
                              </button>
                            )}
                            <button
                              onClick={() => handleUpdateStatus(req.requestId, 'CLOSED')}
                              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Đóng
                            </button>
                          </div>
                        )}
                        {req.status === 'CLOSED' && (
                          <button
                            onClick={() => handleUpdateStatus(req.requestId, 'OPEN')}
                            className="text-xs font-semibold text-slate-400 hover:text-slate-600 underline"
                          >
                            Mở lại
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
