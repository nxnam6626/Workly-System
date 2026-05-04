'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, ShieldAlert, XCircle, Briefcase, ArrowLeft } from 'lucide-react';
import {
  adminUsersApi,
  type AdminUser,
  type AdminUserFilters,
} from '@/lib/admin-api';
import UserFilters from '../user-components/UserFilters';
import UserTable from '../user-components/UserTable';
import UserDetailModal from '../user-components/UserDetailModal';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import toast from 'react-hot-toast';
import { useSocketStore } from '@/stores/socket';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

import useSWR from 'swr';

const PAGE_SIZE = 15;

export default function RecruitersManagement() {
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AdminUserFilters>({ role: 'RECRUITER' });

  const swrKey = ['/admin/users/recruiters', filters, page];
  const { data, isLoading, mutate } = useSWR(swrKey, () => 
    adminUsersApi.getAll({
      ...filters,
      role: 'RECRUITER',
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }), {
      revalidateOnFocus: false,
      dedupingInterval: 10000,
    }
  );

  const users = data?.data ?? [];
  const total = data?.total ?? 0;
  const fetchUsers = () => mutate();

  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const confirm = useConfirm();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;
    const handleUserUpdated = () => fetchUsers();
    socket.on('adminUserUpdated', handleUserUpdated);
    return () => {
      socket.off('adminUserUpdated', handleUserUpdated);
    };
  }, [socket, fetchUsers]);

  const handleSetFilters = (f: AdminUserFilters) => {
    setFilters({ ...f, role: 'RECRUITER' });
    setPage(1);
  };

  const requestLock = async (id: string) => {
    const ok = await confirm({
      title: 'Khóa tài khoản Nhà Tuyển Dụng?',
      message: 'Các tin tuyển dụng đang hoạt động của người này sẽ không bị ảnh hưởng, nhưng họ sẽ không thể đăng nhập.',
      confirmText: 'Khóa tài khoản',
      variant: 'danger',
    });
    if (!ok) return;
    setProcessingId(id);
    try {
      await adminUsersApi.lock(id);
      mutate();
      if (detailUser?.userId === id) setDetailUser((p) => (p ? { ...p, status: 'LOCKED' } : null));
      toast.success('Tài khoản đã bị khóa.');
    } catch {
      setError('Khóa tài khoản thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUnlock = async (id: string) => {
    setProcessingId(id);
    try {
      await adminUsersApi.unlock(id);
      mutate();
      if (detailUser?.userId === id)
        setDetailUser((p) => (p ? { ...p, status: 'ACTIVE' } : null));
    } catch {
      setError('Mở khóa tài khoản thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const requestDelete = async (id: string) => {
    const ok = await confirm({
      title: 'Xóa Nhà Tuyển Dụng?',
      message: 'Hành động này không thể hoàn tác. Các tin tuyển dụng liên quan sẽ bị mồ côi.',
      confirmText: 'Xóa tài khoản',
      variant: 'danger',
    });
    if (!ok) return;
    setProcessingId(id);
    try {
      await adminUsersApi.remove(id);
      mutate();
      if (detailUser?.userId === id) setDetailUser(null);
      toast.success('Tài khoản đã được xóa.');
    } catch {
      setError('Xóa tài khoản thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetViolations = async (id: string) => {
    const ok = await confirm({
      title: 'Khôi phục vi phạm?',
      message: 'Đưa số lần vi phạm của Nhà tuyển dụng về 0.',
      confirmText: 'Xác nhận khôi phục',
      variant: 'info',
    });
    if (!ok) return;
    setProcessingId(id);
    try {
      await adminUsersApi.resetViolations(id);
      mutate();
      if (detailUser?.userId === id) {
        setDetailUser({
          ...detailUser,
          violations: 0,
        } as AdminUser);
      }
      toast.success('Đã khôi phục số lần vi phạm về 0.');
    } catch {
      setError('Khôi phục vi phạm thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 sm:px-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-start justify-between gap-6"
      >
        <div>
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
               <Briefcase className="w-6 h-6" />
             </div>
             <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  Nhà Tuyển Dụng
                </h1>
                <p className="text-slate-500 font-medium mt-1">
                  Quản lý gói Subscription và xử lý các vi phạm của nhà tuyển dụng.
                </p>
             </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </motion.div>

      {/* Main Container Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-[2.5rem] border border-violet-100 shadow-2xl shadow-violet-50/50 overflow-hidden flex flex-col min-h-[600px] relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-400 to-indigo-500" />
        
        {/* Filters Header */}
        <div className="p-8 border-b border-violet-50 bg-violet-50/20">
          <UserFilters filters={filters} setFilters={handleSetFilters} hideRoleFilter={true} />
        </div>

        {/* Global Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mx-8 mt-6"
            >
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 shrink-0" />
                  <p className="text-sm font-bold">{error}</p>
                </div>
                <button onClick={() => setError('')} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Table Content */}
        <div className="flex-1">
          <UserTable
            users={users}
            isLoading={isLoading}
            totalItems={total}
            page={page}
            totalPages={totalPages}
            setPage={setPage}
            onLock={requestLock}
            onUnlock={handleUnlock}
            onDelete={requestDelete}
            onQuickView={setDetailUser}
            processingId={processingId}
            hideRoleColumn={true}
            themeColor="violet"
          />
        </div>
      </motion.div>

      {/* Detail Modal */}
      <AnimatePresence>
        {detailUser && (
          <UserDetailModal
            user={detailUser}
            onClose={() => setDetailUser(null)}
            onLock={requestLock}
            onUnlock={handleUnlock}
            onDelete={requestDelete}
            onRoleChange={() => {}}
            onUpdatePermissions={() => {}}
            onResetViolations={handleResetViolations}
            isProcessing={processingId === detailUser.userId}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
