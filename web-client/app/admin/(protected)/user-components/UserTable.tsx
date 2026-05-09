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
  Mail,
  ShieldCheck,
  User as UserIcon,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  hideRoleColumn?: boolean;
  themeColor?: 'indigo' | 'emerald' | 'violet' | 'rose';
}

const ROLE_CONFIG: Record<string, { color: string, icon: any, label: string }> = {
  CANDIDATE: { color: 'bg-blue-50 text-blue-600 border-blue-100', icon: UserIcon, label: 'Ứng viên' },
  RECRUITER: { color: 'bg-purple-50 text-purple-600 border-purple-100', icon: Briefcase, label: 'Nhà tuyển dụng' },
  ADMIN: { color: 'bg-rose-50 text-rose-600 border-rose-100', icon: ShieldCheck, label: 'Admin' },
};

const THEME_STYLES = {
  indigo: { border: 'border-indigo-600', text: 'text-indigo-600', bg: 'bg-indigo-50', hoverBorder: 'hover:border-indigo-100', bgProgress: 'bg-indigo-500' },
  emerald: { border: 'border-emerald-600', text: 'text-emerald-600', bg: 'bg-emerald-50', hoverBorder: 'hover:border-emerald-100', bgProgress: 'bg-emerald-500' },
  violet: { border: 'border-violet-600', text: 'text-violet-600', bg: 'bg-violet-50', hoverBorder: 'hover:border-violet-100', bgProgress: 'bg-violet-500' },
  rose: { border: 'border-rose-600', text: 'text-rose-600', bg: 'bg-rose-50', hoverBorder: 'hover:border-rose-100', bgProgress: 'bg-rose-500' },
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
  hideRoleColumn = false,
  themeColor = 'indigo'
}: UserTableProps) {
  const formatDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  
  const theme = THEME_STYLES[themeColor];

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 gap-4">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-slate-100 rounded-full"></div>
          <div className={`absolute top-0 left-0 w-12 h-12 border-4 ${theme.border} rounded-full border-t-transparent animate-spin`}></div>
        </div>
        <p className="text-slate-500 font-medium animate-pulse">Đang tải danh sách người dùng...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100 shadow-inner">
          <Users className="w-10 h-10 text-slate-300" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Không tìm thấy người dùng</h3>
        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">Thử thay đổi bộ lọc hoặc từ khoá tìm kiếm khác để có kết quả tốt hơn.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
              {!hideRoleColumn && <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò</th>}
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Vi phạm</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đăng nhập cuối</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            <AnimatePresence>
              {users.map((u, index) => {
                const isProcessing = processingId === u.userId;
                const displayName = u.candidate?.fullName ?? u.recruiter?.fullName ?? u.email.split('@')[0];
                const roles = u.userRoles.map((ur) => ur.role.roleName);

                return (
                  <motion.tr
                    key={u.userId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.03 }}
                    className="group hover:bg-slate-50/80 transition-all cursor-default"
                  >
                    {/* User Info */}
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          <div className={`w-11 h-11 rounded-2xl ${theme.bg} border border-slate-100 flex items-center justify-center overflow-hidden shadow-sm group-hover:shadow-md transition-shadow`}>
                            {u.avatar ? (
                              <img src={u.avatar} alt={displayName} className="w-full h-full object-cover" />
                            ) : (
                              <span className={`${theme.text} font-black text-sm`}>{displayName.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          {u.status === 'ACTIVE' && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className={`text-[14px] font-black tracking-tight text-slate-900 truncate group-hover:${theme.text} transition-colors`}>{displayName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <p className="text-[11px] font-medium text-slate-400 truncate max-w-[180px]">{u.email}</p>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Roles */}
                    {!hideRoleColumn && (
                      <td className="px-8 py-4">
                        <div className="flex flex-wrap gap-1.5">
                          {roles.map((r) => {
                            const config = ROLE_CONFIG[r] || { color: 'bg-slate-50 text-slate-500', icon: UserIcon, label: r };
                            return (
                              <span
                                key={r}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${config.color}`}
                              >
                                <config.icon className="w-3.5 h-3.5" />
                                {config.label}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    )}

                    {/* Status */}
                    <td className="px-8 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        u.status === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {u.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </td>

                    {/* Violations */}
                    <td className="px-8 py-4 text-center">
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-[11px] font-black border transition-all ${
                          (u as any).violations >= 3 
                            ? 'bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-100' 
                            : (u as any).violations > 0 
                              ? 'bg-amber-50 text-amber-600 border-amber-200' 
                              : 'bg-slate-50 text-slate-400 border-slate-100'
                        }`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {(u as any).violations || 0}/3
                        </span>
                      </div>
                    </td>

                    {/* Last Login */}
                    <td className="px-8 py-4">
                       <p className="text-xs font-bold text-slate-500">{formatDate(u.lastLogin)}</p>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Truy cập cuối</p>
                    </td>

                    {/* Actions */}
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                        <button
                          onClick={() => onQuickView(u)}
                          className={`w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:${theme.text} ${theme.hoverBorder} hover:shadow-lg transition-all active:scale-90`}
                          title="Chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {u.status === 'ACTIVE' ? (
                          <button
                            onClick={() => onLock(u.userId)}
                            disabled={isProcessing}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-100 hover:shadow-lg transition-all disabled:opacity-50 active:scale-90"
                            title="Khóa tài khoản"
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin text-amber-500" /> : <Lock className="w-4 h-4" />}
                          </button>
                        ) : (
                          <button
                            onClick={() => onUnlock(u.userId)}
                            disabled={isProcessing}
                            className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-600 text-white border border-emerald-500 hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all disabled:opacity-50 active:scale-90"
                            title="Mở khóa"
                          >
                            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                          </button>
                        )}

                        <button
                          onClick={() => onDelete(u.userId)}
                          disabled={isProcessing}
                          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 hover:shadow-lg transition-all disabled:opacity-50 active:scale-90"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-8 py-5 border-t border-slate-50 bg-slate-50/30">
        <div className="flex items-center gap-4">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
             Trang <span className="text-slate-900">{page}</span> / <span className="text-slate-900">{totalPages || 1}</span>
           </p>
           <div className="h-1 w-12 bg-slate-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${theme.bgProgress} transition-all duration-500`} 
                style={{ width: `${(page / (totalPages || 1)) * 100}%` }}
              />
           </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            Trước
          </button>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all active:scale-95"
          >
            Sau
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

