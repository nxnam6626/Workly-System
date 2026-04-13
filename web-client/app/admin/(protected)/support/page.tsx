'use client';

import { useState, useEffect } from 'react';
import { adminSupportApi, SupportRequest, adminUsersApi } from '@/lib/admin-api';
import { Mail, CheckCircle2, CircleDashed, Filter, CalendarDays, KeySquare, HelpCircle, LockOpen } from 'lucide-react';
import { useSocketStore } from '@/stores/socket';
import toast from 'react-hot-toast';

export default function SupportAdminPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const { socket } = useSocketStore();

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
    fetchRequests();
  }, []);

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
      alert('Đã mở khóa tài khoản thành công và đóng yêu cầu!');
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
      alert('Mở khóa tài khoản thất bại.');
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-7 h-7 text-blue-600" />
            Quản lý yêu cầu hỗ trợ
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tổng hợp khiếu nại, kháng cáo và liên hệ từ người dùng.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-9 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 appearance-none outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="OPEN">Đang chờ (Open)</option>
              <option value="IN_PROGRESS">Đang xử lý (In Progress)</option>
              <option value="CLOSED">Hoàn thành (Closed)</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20">Đang tải...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-10 font-medium">{error}</div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {filteredRequests.length === 0 ? (
            <div className="py-20 text-center text-slate-400 flex flex-col items-center">
              <Mail className="w-12 h-12 mb-3 text-slate-300" />
              <p className="font-semibold text-base">Chưa có yêu cầu nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="text-left px-6 py-4 font-bold text-slate-600 text-xs uppercase">Trạng thái</th>
                    <th className="text-left px-6 py-4 font-bold text-slate-600 text-xs uppercase">Người gửi</th>
                    <th className="text-left px-6 py-4 font-bold text-slate-600 text-xs uppercase">Nội dung</th>
                    <th className="text-left px-6 py-4 font-bold text-slate-600 text-xs uppercase">Tài khoản</th>
                    <th className="text-right px-6 py-4 font-bold text-slate-600 text-xs uppercase">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRequests.map((req) => (
                    <tr key={req.requestId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 align-top w-32">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-6 py-5 align-top min-w-[200px]">
                        <p className="font-bold text-slate-900">{req.name || 'Người dùng ẩn danh'}</p>
                        <div className="flex items-center gap-1.5 text-slate-500 mt-1 text-xs">
                          <Mail className="w-3.5 h-3.5" />
                          {req.email}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 mt-1 text-xs">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(req.createdAt).toLocaleString('vi-VN')}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top min-w-[300px]">
                        <p className="font-bold text-slate-900 text-[15px] mb-2">{req.subject}</p>
                        <div className="text-slate-600 whitespace-pre-wrap leading-relaxed outline outline-1 outline-slate-100 p-3 rounded-lg bg-slate-50/50">
                          {req.message}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top w-40">
                        {req.user ? (
                          <div className="flex flex-col gap-1.5 align-start">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 w-fit">
                              Có ID hệ thống
                            </span>
                            <span className="text-xs font-semibold text-slate-500">{req.user.userRoles[0]?.role?.roleName}</span>
                            <span className="text-xs font-medium text-slate-400 break-all">{req.user.email}</span>
                            {req.user.status === 'LOCKED' && (
                              <button
                                onClick={() => handleUnlockUser(req.user!.userId, req.requestId)}
                                className="mt-2 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 px-2.5 py-1.5 rounded-lg transition-colors w-fit shadow-sm"
                              >
                                <LockOpen className="w-3.5 h-3.5" />
                                Mở khóa ngay
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Khách (Guest)</span>
                        )}
                      </td>
                      <td className="px-6 py-5 align-top text-right min-w-[140px]">
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
