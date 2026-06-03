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

function SupportMessage({ message }: { message: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  let original = message;
  let reply = '';
  let type = '';

  const adminSplit = message.split('\n\n--- Phản hồi từ Admin ---\n');
  if (adminSplit.length > 1) {
    original = adminSplit[0];
    reply = adminSplit[1];
    type = 'Admin';
  } else {
    const sysSplit = message.split('\n\n[Hệ thống tự động] ');
    if (sysSplit.length > 1) {
      original = sysSplit[0];
      reply = sysSplit[1];
      type = 'Hệ thống';
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-[13px] font-medium text-slate-600 whitespace-pre-wrap leading-relaxed outline outline-1 outline-slate-100 p-4 rounded-2xl bg-slate-50/50">
        {original}
      </div>
      {reply && (
        <div className="mt-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
          >
            {isExpanded ? 'Thu gọn phản hồi' : `Xem phản hồi từ ${type}`}
          </button>
          {isExpanded && (
            <div className="mt-2 text-[12px] font-medium text-slate-700 whitespace-pre-wrap leading-relaxed border-l-2 border-blue-400 pl-3 py-1 bg-blue-50/50 rounded-r-xl">
              {type === 'Hệ thống' && <span className="font-bold text-blue-700">[Hệ thống tự động] </span>}
              {reply}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SupportManagementPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // Modal states
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);

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

  const openReplyModal = (id: string) => {
    setSelectedRequestId(id);
    setReplyMessage('');
    setIsReplyModalOpen(true);
  };

  const closeReplyModal = () => {
    setIsReplyModalOpen(false);
    setSelectedRequestId(null);
    setReplyMessage('');
  };

  const handleReplyRequest = async () => {
    if (!selectedRequestId || !replyMessage.trim()) return;
    setIsReplying(true);
    try {
      await adminSupportApi.replyToRequest(selectedRequestId, replyMessage);
      toast.success('Đã gửi phản hồi và đóng yêu cầu.');
      setRequests(requests.map(req => 
        req.requestId === selectedRequestId 
          ? { ...req, status: 'CLOSED', message: req.message + `\n\n--- Phản hồi từ Admin ---\n${replyMessage}` } 
          : req
      ));
      closeReplyModal();
    } catch (err) {
      toast.error('Gửi phản hồi thất bại.');
    } finally {
      setIsReplying(false);
    }
  };

  const handleUnlockUser = async (userId: string, requestId: string) => {
    try {
      await adminUsersApi.unlock(userId);
      const autoMessage = 'Kháng cáo thành công. Tài khoản của bạn đã được mở khóa. Vui lòng tuân thủ các quy tắc cộng đồng của hệ thống Workly nhé!';
      await adminSupportApi.replyToRequest(requestId, autoMessage);
      toast.success('Thao tác thành công. Tài khoản đã được mở khóa và gửi mail phản hồi!');
      // Update local state to reflect unlocked status and closed ticket
      setRequests(requests.map(req => {
        if (req.user?.userId === userId) {
          return {
            ...req,
            status: req.requestId === requestId ? 'CLOSED' : req.status,
            user: { ...req.user, status: 'ACTIVE' },
            message: req.requestId === requestId ? req.message + `\n\n--- Phản hồi từ Admin ---\n${autoMessage}` : req.message
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
      const autoMessage = 'Kháng cáo thành công. Tài khoản của bạn đã được mở khóa nhưng đưa vào diện **Thử thách**. Vui lòng đặc biệt chú ý tuân thủ quy định của hệ thống trong thời gian này để tránh bị khóa vĩnh viễn.';
      await adminSupportApi.replyToRequest(requestId, autoMessage);
      toast.success('Thao tác thành công. Tài khoản đã vào Thử thách và gửi mail phản hồi!');
      setRequests(requests.map(req => {
        if (req.user?.userId === userId) {
          return {
            ...req,
            status: req.requestId === requestId ? 'CLOSED' : req.status,
            user: { ...req.user, status: 'ACTIVE', accountLevel: 'PROBATION' },
            message: req.requestId === requestId ? req.message + `\n\n--- Phản hồi từ Admin ---\n${autoMessage}` : req.message
          };
        }
        return req;
      }));
    } catch (err) {
      toast.error('Thao tác thất bại.');
    }
  };

  const handleRejectUnlock = async (userId: string, requestId: string) => {
    try {
      const autoMessage = 'Kháng cáo của bạn đã bị từ chối. Hệ thống nhận thấy tài khoản của bạn vi phạm nghiêm trọng hoặc tái phạm nhiều lần các quy định của Workly, do đó tài khoản sẽ tiếp tục bị khóa.';
      await adminSupportApi.replyToRequest(requestId, autoMessage);
      toast.success('Đã gửi thông báo từ chối mở khóa!');
      setRequests(requests.map(req => {
        if (req.user?.userId === userId) {
          return {
            ...req,
            status: req.requestId === requestId ? 'CLOSED' : req.status,
            message: req.requestId === requestId ? req.message + `\n\n--- Phản hồi từ Admin ---\n${autoMessage}` : req.message
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
              <option value="OPEN">Đang chờ</option>
              <option value="IN_PROGRESS">Đang xử lý</option>
              <option value="CLOSED">Hoàn thành</option>
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
                        <SupportMessage message={req.message} />
                        {req.attachmentUrl && (
                          <div className="mt-3">
                            <a href={req.attachmentUrl} target="_blank" rel="noreferrer" className="block w-full max-w-[200px] overflow-hidden rounded-xl border border-slate-200 hover:opacity-80 transition-opacity">
                              <img src={req.attachmentUrl} alt="Attachment" className="w-full h-auto object-cover" />
                            </a>
                          </div>
                        )}
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
                            {req.user.status === 'LOCKED' && req.status === 'OPEN' && (
                              <button
                                onClick={() => handleRejectUnlock(req.user!.userId, req.requestId)}
                                className="mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg transition-colors w-fit shadow-sm"
                              >
                                <Lock className="w-3.5 h-3.5" />
                                Từ chối mở khóa
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
                                onClick={() => openReplyModal(req.requestId)}
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
      {/* Reply Modal */}
      {isReplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Soạn thư phản hồi
              </h3>
              <button 
                onClick={closeReplyModal}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="p-5 flex-1">
              <p className="text-sm text-slate-600 mb-3">
                Nội dung bạn nhập dưới đây sẽ được gửi trực tiếp qua Email tới người dùng, đồng thời yêu cầu này sẽ được đánh dấu là <span className="font-semibold text-emerald-600">Hoàn thành</span>.
              </p>
              <textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="Nhập nội dung phản hồi (VD: Xin lỗi, ảnh hóa đơn của bạn quá mờ. Vui lòng tạo yêu cầu mới với hình ảnh rõ nét hơn...)"
                className="w-full h-32 p-3 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-slate-50"
              />
            </div>
            
            <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
              <button
                onClick={closeReplyModal}
                disabled={isReplying}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleReplyRequest}
                disabled={!replyMessage.trim() || isReplying}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isReplying ? (
                  <>
                    <CircleDashed className="w-4 h-4 animate-spin" />
                    Đang gửi...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Gửi Email & Đóng
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
