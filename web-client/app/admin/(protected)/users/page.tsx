'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, ShieldAlert, XCircle, Lock } from 'lucide-react';
import {
  adminUsersApi,
  type AdminUser,
  type AdminUserFilters,
} from '@/lib/admin-api';
import UserStats from './components/UserStats';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import UserDetailModal from './components/UserDetailModal';
import CreateAdminModal from './components/CreateAdminModal';
import { useConfirm } from '@/components/ConfirmDialog';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSocketStore } from '@/stores/socket';
import { useAuthStore } from '@/stores/auth';

const PAGE_SIZE = 15;

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

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const [error, setError] = useState('');

  const adminLevel = user?.admin?.adminLevel ?? 2;
  const perms: string[] = user?.admin?.permissions ?? [];
  const canAccess = adminLevel === 1 || perms.includes('MANAGE_USERS');


  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AdminUserFilters>({});

  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const confirm = useConfirm();

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await adminUsersApi.getAll({
        ...filters,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      });
      setUsers(res.data);
      setTotal(res.total);
    } catch {
      setError('Không thể tải danh sách người dùng.');
    } finally {
      setIsLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const { socket } = useSocketStore();

  useEffect(() => {
    if (!socket) return;

    const handleAccountLocked = (data: any) => {
      toast.error(`Hệ thống vừa tự động khóa tài khoản vi phạm: ${data.email || 'Ẩn danh'}`);
      fetchUsers();
    };

    socket.on('adminAccountLocked', handleAccountLocked);

    const handleUserUpdated = () => {
      fetchUsers();
    };
    socket.on('adminUserUpdated', handleUserUpdated);

    return () => {
      socket.off('adminAccountLocked', handleAccountLocked);
      socket.off('adminUserUpdated', handleUserUpdated);
    };
  }, [socket, fetchUsers]);

  // When filters change, go back to page 1
  const handleSetFilters = (f: AdminUserFilters) => {
    setFilters(f);
    setPage(1);
  };

  const requestLock = async (id: string) => {
    const ok = await confirm({
      title: 'Khóa tài khoản?',
      message: 'Người dùng sẽ bị đăng xuất và không thể đăng nhập lại cho đến khi được mở khóa.',
      confirmText: 'Khóa tài khoản',
      variant: 'danger',
    });
    if (!ok) return;
    setProcessingId(id);
    try {
      await adminUsersApi.lock(id);
      setUsers((prev) => prev.map((u) => (u.userId === id ? { ...u, status: 'LOCKED' } : u)));
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
      setUsers((prev) =>
        prev.map((u) => (u.userId === id ? { ...u, status: 'ACTIVE' } : u)),
      );
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
      title: 'Xóa tài khoản?',
      message: 'Hành động này không thể hoàn tác. Mọi dữ liệu liên quan sẽ bị xóa vĩnh viễn.',
      confirmText: 'Xóa tài khoản',
      variant: 'danger',
    });
    if (!ok) return;
    setProcessingId(id);
    try {
      await adminUsersApi.remove(id);
      setUsers((prev) => prev.filter((u) => u.userId !== id));
      setTotal((t) => t - 1);
      if (detailUser?.userId === id) setDetailUser(null);
      toast.success('Tài khoản đã được xóa.');
    } catch {
      setError('Xóa tài khoản thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    setProcessingId(id);
    try {
      const updatedUser = await adminUsersApi.updateRole(id, newRole);
      setUsers((prev) => prev.map((u) => (u.userId === id ? updatedUser : u)));
      if (detailUser?.userId === id) setDetailUser(updatedUser);
    } catch {
      setError('Đổi vai trò thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUpdatePermissions = async (id: string, permissions: string[]) => {
    setProcessingId(id);
    try {
      await adminUsersApi.updateAdminPermissions(id, permissions);
      const updatedUser = { ...detailUser!, admin: { ...detailUser!.admin, permissions, adminLevel: detailUser!.admin?.adminLevel || 2 } };
      setUsers((prev) => prev.map((u) => (u.userId === id ? updatedUser : u)));
      if (detailUser?.userId === id) setDetailUser(updatedUser);
      toast.success('Cập nhật quyền thành công.');
    } catch {
      setError('Cập nhật quyền thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetViolations = async (id: string) => {
    const ok = await confirm({
      title: 'Khôi phục vi phạm?',
      message: 'Toàn bộ số lần vi phạm (bao gồm vi phạm Tin nhắn & Lách luật) sẽ được đặt về 0. Người dùng có thể tiếp tục sử dụng bình thường.',
      confirmText: 'Xác nhận khôi phục',
      variant: 'info',
    });
    if (!ok) return;

    setProcessingId(id);
    try {
      await adminUsersApi.resetViolations(id);
      setUsers((prev) =>
        prev.map((u) =>
          u.userId === id
            ? { ...u, violations: 0, recruiter: u.recruiter ? { ...u.recruiter, violationCount: 0 } : u.recruiter }
            : u,
        ),
      );
      if (detailUser?.userId === id) {
        setDetailUser({
          ...detailUser,
          violations: 0,
          recruiter: detailUser.recruiter ? { ...detailUser.recruiter, violationCount: 0 } : detailUser.recruiter,
        } as AdminUser);
      }
      toast.success('Đã khôi phục số lần vi phạm về 0.');
    } catch {
      setError('Khôi phục vi phạm thất bại.');
    } finally {
      setProcessingId(null);
    }
  };

  const stats = useMemo(() => ({
    total,
    candidates: users.filter((u) =>
      u.userRoles.some((ur) => ur.role.roleName === 'CANDIDATE'),
    ).length,
    recruiters: users.filter((u) =>
      u.userRoles.some((ur) => ur.role.roleName === 'RECRUITER'),
    ).length,
    locked: users.filter((u) => u.status === 'LOCKED').length,
  }), [users, total]);

  // --- PERMISSION GATE ---
  if (!canAccess) return <AccessDenied perm="MANAGE_USERS" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản Lý Người Dùng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem, lọc, khóa và xóa tài khoản người dùng trong hệ thống
          </p>
        </div>
        <div className="flex gap-3">
          {user?.admin?.adminLevel === 1 && (
            <button
              onClick={() => setIsCreateAdminOpen(true)}
              className="flex items-center gap-2 px-4 py-2 border border-transparent bg-indigo-600 rounded-xl text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tạo Admin
            </button>
          )}
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <UserStats {...stats} />

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[560px]">
        {/* Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/30">
          <UserFilters filters={filters} setFilters={handleSetFilters} />
        </div>

        {/* Error */}
        {error && (
          <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <p className="font-medium text-red-800">{error}</p>
            <button
              onClick={() => setError('')}
              className="ml-auto p-1 hover:bg-red-100 rounded-md text-red-400"
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Table */}
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
        />
      </div>

      {/* Detail modal */}
      {detailUser && (
        <UserDetailModal
          user={detailUser}
          onClose={() => setDetailUser(null)}
          onLock={requestLock}
          onUnlock={handleUnlock}
          onDelete={requestDelete}
          onRoleChange={handleRoleChange}
          onUpdatePermissions={handleUpdatePermissions}
          onResetViolations={handleResetViolations}
          isProcessing={processingId === detailUser.userId}
        />
      )}
      
      <CreateAdminModal
        isOpen={isCreateAdminOpen}
        onClose={() => setIsCreateAdminOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
