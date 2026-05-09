import { useState, useEffect, useRef } from 'react';
import { Users, UserPlus, FileUp, Lock, Unlock, Mail, Shield, ShieldCheck, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useSocketStore } from '@/stores/socket';

interface Member {
  recruiterId: string;
  userId: string;
  fullName: string;
  companyRole: string;
  createdAt: string;
  user: {
    email: string;
    status: string;
    avatar: string | null;
  };
}

export default function MembersTab() {
  const [members, setMembers] = useState<Member[]>([]);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({ fullName: '', email: '' });
  const [submitting, setSubmitting] = useState(false);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [blockModal, setBlockModal] = useState<{ isOpen: boolean; recruiterId: string; isBlocked: boolean }>({ isOpen: false, recruiterId: '', isBlocked: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket } = useSocketStore();

  useEffect(() => {
    fetchMembers();

    if (!socket) return;

    const handleMembersUpdated = (data: any) => {
      fetchMembers();
    };

    socket.on('companyMembersUpdated', handleMembersUpdated);

    return () => {
      socket.off('companyMembersUpdated', handleMembersUpdated);
    };
  }, [socket]);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/companies/my-company/members');
      setMembers(data.members || []);
      setIsMaster(data.isMaster || false);
    } catch (e) {
      toast.error('Không thể tải danh sách thành viên');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.fullName || !newMember.email) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/companies/my-company/members', newMember);
      toast.success('Thêm thành viên thành công (Mật khẩu: 123456)');
      setShowAddModal(false);
      setNewMember({ fullName: '', email: '' });
      fetchMembers();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading('Đang xử lý file CSV...');
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/companies/my-company/members/bulk', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.errors && data.errors.length > 0) {
        setImportErrors(data.errors);
        toast.dismiss(toastId);
      } else {
        toast.dismiss(toastId);
      }
      fetchMembers();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Import thất bại', { id: toastId });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmToggleBlock = async () => {
    const { recruiterId, isBlocked } = blockModal;
    setBlockModal({ ...blockModal, isOpen: false });

    try {
      await api.patch(`/companies/my-company/members/${recruiterId}/block`, { isBlocked });
      fetchMembers();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Có lỗi xảy ra');
    }
  };

  const toggleBlock = (recruiterId: string, currentStatus: string) => {
    const isBlocked = currentStatus === 'ACTIVE';
    setBlockModal({ isOpen: true, recruiterId, isBlocked });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-white rounded-3xl shadow-sm border border-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-mariner" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-mariner" />
            Quản lý Thành viên
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Quản lý quyền truy cập và ví công ty của các nhân sự tuyển dụng.
          </p>
        </div>
        {isMaster && (
          <div className="flex gap-3">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-mariner hover:bg-blue-700 text-white rounded-xl font-semibold transition-colors duration-200 shadow-md shadow-blue-500/20"
            >
              <UserPlus className="w-4 h-4" />
              Thêm nhân sự
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="px-6 py-4 text-sm font-bold text-slate-700">Nhân sự</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">Vai trò</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700">Trạng thái</th>
                <th className="px-6 py-4 text-sm font-bold text-slate-700 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.map((member) => (
                <tr key={member.recruiterId} className="hover:bg-slate-50/50 transition-colors duration-200">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-mariner font-bold overflow-hidden border border-blue-200">
                        {member.user.avatar ? (
                          <img src={member.user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          member.fullName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{member.fullName}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          {member.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {member.companyRole === 'MASTER' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        <ShieldCheck className="w-3.5 h-3.5" /> Quản trị viên
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                        <Shield className="w-3.5 h-3.5" /> Thành viên
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {member.user.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span> Đã khóa
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isMaster && member.companyRole !== 'MASTER' && (
                      <button
                        onClick={() => toggleBlock(member.recruiterId, member.user.status)}
                        className={`p-2 rounded-lg transition-colors duration-200 ${member.user.status === 'ACTIVE'
                            ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                            : 'text-red-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        title={member.user.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
                      >
                        {member.user.status === 'ACTIVE' ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    Chưa có thành viên nào trong công ty.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">Thêm nhân sự mới</h3>
              </div>
              <form onSubmit={handleAddMember} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và tên</label>
                  <input
                    type="text"
                    required
                    value={newMember.fullName}
                    onChange={(e) => setNewMember({ ...newMember, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mariner/20 focus:border-mariner transition-colors bg-slate-50 focus:bg-white"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email công ty</label>
                  <input
                    type="email"
                    required
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-mariner/20 focus:border-mariner transition-colors bg-slate-50 focus:bg-white"
                    placeholder="nva@company.com"
                  />
                </div>
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                  <p>Hệ thống sẽ tạo tài khoản với mật khẩu mặc định là: <span className="font-bold">123456</span></p>
                  <p className="mt-1">Nhân sự có thể đăng nhập và tự đổi mật khẩu sau.</p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 flex justify-center items-center px-4 py-2.5 bg-mariner hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md shadow-blue-500/20 disabled:opacity-70"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Tạo tài khoản'}
                  </button>
                </div>

                <div className="relative flex items-center py-2">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">Hoặc</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={(e) => {
                      handleFileUpload(e);
                      setShowAddModal(false);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold border border-slate-200 transition-colors"
                  >
                    <FileUp className="w-5 h-5" />
                    Nhập danh sách từ file (Excel/CSV)
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importErrors.length > 0 && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="px-6 py-4 border-b border-rose-100 flex justify-between items-center bg-rose-50/50">
                <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Danh sách không hợp lệ
                </h3>
              </div>
              <div className="p-6 overflow-y-auto">
                <p className="text-sm text-slate-600 mb-4">
                  Dưới đây là danh sách các email đã tồn tại trong hệ thống hoặc bị lỗi khi thêm. Bạn có thể kiểm tra và đổi thành email khác:
                </p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
                  {importErrors.map((err, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-rose-500 font-bold">•</span>
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                <button
                  onClick={() => setImportErrors([])}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition-colors"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {blockModal.isOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden p-6 relative text-center"
            >
              <button
                onClick={() => setBlockModal({ ...blockModal, isOpen: false })}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="mx-auto w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-red-600 mb-2">
                {blockModal.isBlocked ? 'Khóa tài khoản?' : 'Mở khóa tài khoản?'}
              </h3>

              <p className="text-sm text-slate-600 mb-6">
                {blockModal.isBlocked
                  ? 'Nhân sự này sẽ bị đăng xuất và mất quyền truy cập vào hệ thống.'
                  : 'Nhân sự này sẽ có thể đăng nhập và truy cập hệ thống bình thường.'}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setBlockModal({ ...blockModal, isOpen: false })}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmToggleBlock}
                  className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold transition-colors shadow-md ${blockModal.isBlocked
                      ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                    }`}
                >
                  {blockModal.isBlocked ? 'Khóa tài khoản' : 'Mở khóa'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
