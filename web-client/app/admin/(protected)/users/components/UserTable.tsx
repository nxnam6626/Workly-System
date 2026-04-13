'use client';

import type { AdminUser } from '@/lib/admin-api';
import {
  Eye,
  Lock,
  Unlock,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  AlertTriangle,
} from 'lucide-react';

interface UserTableProps {
  users: AdminUser[];
  isLoading: boolean;
  totalItems: number;
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
  onLock: (id: string) => void;
  onUnlock: (id: string) => void;
  onDelete: (id: string) => void;
  onQuickView: (user: AdminUser) => void;
  processingId: string | null;
}

const ROLE_COLORS: Record<string, string> = {
  CANDIDATE: 'bg-sky-100 text-sky-700',
  RECRUITER: 'bg-violet-100 text-violet-700',
  ADMIN: 'bg-rose-100 text-rose-700',
};

const ROLE_LABELS: Record<string, string> = {
  CANDIDATE: 'Ứng viên',
  RECRUITER: 'NTD',
  ADMIN: 'Admin',
};

export default function UserTable({
  users,
  isLoading,
  totalItems,
  page,
  totalPages,
  setPage,
  onLock,
  onUnlock,
  onDelete,
  onQuickView,
  processingId,
}: UserTableProps) {
  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('vi-VN') : '—';

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-slate-400">
        <Users className="w-12 h-12 mb-4 opacity-30" />
        <p className="font-medium text-slate-600">Không tìm thấy người dùng nào</p>
        <p className="text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {['Người dùng', 'Vai trò', 'Trạng thái', 'Vi phạm', 'Email xác thực', 'Đăng nhập cuối', 'Hành động'].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap"
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u) => {
              const isProcessing = processingId === u.userId;
              const displayName = u.candidate?.fullName ?? u.recruiter?.position ?? u.email.split('@')[0];
              const roles = u.userRoles.map((ur) => ur.role.roleName);

              return (
                <tr
                  key={u.userId}
                  className="hover:bg-slate-50/60 transition-colors group"
                >
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0 overflow-hidden">
                        {u.avatar ? (
                          <img src={u.avatar} alt={displayName} className="w-full h-full object-cover" />
                        ) : (
                          displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate max-w-[160px]">{displayName}</p>
                        <p className="text-xs text-slate-400 truncate max-w-[160px]">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Roles */}
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {roles.map((r) => (
                        <span
                          key={r}
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[r] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {ROLE_LABELS[r] ?? r}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {u.status === 'ACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                        Bị khóa
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    {u.recruiter ? (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold ${u.recruiter.violationCount >= 3 ? 'bg-rose-100 text-rose-700' : u.recruiter.violationCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        <AlertTriangle className="w-3 h-3" />
                        {u.recruiter.violationCount || 0}/3
                      </span>
                    ) : (
                      <span className="text-slate-200 text-[10px]">N/A</span>
                    )}
                  </td>

                  {/* Email verified */}
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-medium ${u.isEmailVerified ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      {u.isEmailVerified ? '✓ Đã xác thực' : '✗ Chưa xác thực'}
                    </span>
                  </td>

                  {/* Last login */}
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {formatDate(u.lastLogin)}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onQuickView(u)}
                        title="Xem chi tiết"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {u.status === 'ACTIVE' ? (
                        <button
                          onClick={() => onLock(u.userId)}
                          disabled={isProcessing}
                          title="Khóa tài khoản"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-amber-50 hover:text-amber-600 transition-colors disabled:opacity-40"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Lock className="w-4 h-4" />
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => onUnlock(u.userId)}
                          disabled={isProcessing}
                          title="Mở khóa tài khoản"
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors disabled:opacity-40"
                        >
                          {isProcessing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => onDelete(u.userId)}
                        disabled={isProcessing}
                        title="Xóa tài khoản"
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/30">
        <p className="text-xs text-slate-500">
          {totalItems} người dùng · Trang {page}/{totalPages || 1}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
