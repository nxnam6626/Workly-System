'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import {
  adminUsersApi,
  type AdminUser,
  type AdminUserFilters,
} from '@/lib/admin-api';
import UserStats from './components/UserStats';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import UserDetailModal from './components/UserDetailModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

const PAGE_SIZE = 15;

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<AdminUserFilters>({});

  const [detailUser, setDetailUser] = useState<AdminUser | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [lockUserId, setLockUserId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLocking, setIsLocking] = useState(false);

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

  // When filters change, go back to page 1
  const handleSetFilters = (f: AdminUserFilters) => {
    setFilters(f);
    setPage(1);
  };

  const requestLock = (id: string) => {
    setLockUserId(id);
  };

  const executeLock = async () => {
    if (!lockUserId) return;
    setIsLocking(true);
    setProcessingId(lockUserId);
    try {
      await adminUsersApi.lock(lockUserId);
      setUsers((prev) =>
        prev.map((u) => (u.userId === lockUserId ? { ...u, status: 'LOCKED' } : u)),
      );
      if (detailUser?.userId === lockUserId)
        setDetailUser((p) => (p ? { ...p, status: 'LOCKED' } : null));
      setLockUserId(null);
    } catch {
      setError('Khóa tài khoản thất bại.');
    } finally {
      setIsLocking(false);
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

  const requestDelete = (id: string) => {
    setDeleteUserId(id);
  };

  const executeDelete = async () => {
    if (!deleteUserId) return;
    setIsDeleting(true);
    try {
      await adminUsersApi.remove(deleteUserId);
      setUsers((prev) => prev.filter((u) => u.userId !== deleteUserId));
      setTotal((t) => t - 1);
      if (detailUser?.userId === deleteUserId) setDetailUser(null);
      setDeleteUserId(null);
    } catch {
      setError('Xóa tài khoản thất bại.');
    } finally {
      setIsDeleting(false);
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
        <button
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
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
          isProcessing={processingId === detailUser.userId}
        />
      )}

      <ConfirmModal
        isOpen={!!deleteUserId}
        title="Xóa tài khoản"
        message="Bạn có chắc muốn xóa tài khoản này? Hành động không thể hoàn tác và mọi dữ liệu liên quan sẽ bị xóa."
        confirmLabel="Xóa tài khoản"
        onConfirm={executeDelete}
        onCancel={() => setDeleteUserId(null)}
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={!!lockUserId}
        title="Khóa tài khoản"
        message="Bạn có chắc muốn khóa tài khoản này? Người dùng sẽ bị đăng xuất và không thể đăng nhập lại cho đến khi được mở khóa."
        confirmLabel="Khóa tài khoản"
        onConfirm={executeLock}
        onCancel={() => setLockUserId(null)}
        isLoading={isLocking}
      />
    </div>
  );
}
