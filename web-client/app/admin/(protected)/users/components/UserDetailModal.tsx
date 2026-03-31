'use client';

import type { AdminUser } from '@/lib/admin-api';
import {
  X,
  Mail,
  Phone,
  Calendar,
  Clock,
  Lock,
  Unlock,
  Trash2,
  Loader2,
  UserCircle2,
  Briefcase,
  BadgeCheck,
} from 'lucide-react';

interface UserDetailModalProps {
  user: AdminUser;
  onClose: () => void;
  onLock: (id: string) => void;
  onUnlock: (id: string) => void;
  onDelete: (id: string) => void;
  isProcessing: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  CANDIDATE: 'bg-sky-100 text-sky-700 border-sky-200',
  RECRUITER: 'bg-violet-100 text-violet-700 border-violet-200',
  ADMIN: 'bg-rose-100 text-rose-700 border-rose-200',
};

const ROLE_LABELS: Record<string, string> = {
  CANDIDATE: 'Ứng viên',
  RECRUITER: 'Nhà tuyển dụng',
  ADMIN: 'Quản trị viên',
};

export default function UserDetailModal({
  user,
  onClose,
  onLock,
  onUnlock,
  onDelete,
  isProcessing,
}: UserDetailModalProps) {
  const displayName = user.candidate?.fullName ?? user.recruiter?.position ?? user.email.split('@')[0];
  const roles = user.userRoles.map((ur) => ur.role.roleName);

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const handleDelete = () => {
    onDelete(user.userId);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Chi Tiết Người Dùng</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-2xl shrink-0 overflow-hidden shadow-sm">
              {user.avatar ? (
                <img src={user.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-lg leading-tight">{displayName}</h3>
              <div className="flex items-center gap-2 mt-1">
                {user.status === 'ACTIVE' ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> Hoạt động
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" /> Bị khóa
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Roles */}
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Vai trò</p>
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => (
                <span
                  key={r}
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${ROLE_COLORS[r] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
                >
                  {ROLE_LABELS[r] ?? r}
                </span>
              ))}
            </div>
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Thông tin liên hệ</p>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="break-all">{user.email}</span>
              {user.isEmailVerified && <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" />}
            </div>
            {(user.phoneNumber || user.candidate?.phone) && (
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{user.phoneNumber || user.candidate?.phone}</span>
              </div>
            )}
          </div>

          {/* Profile info */}
          {(user.candidate || user.recruiter) && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Hồ sơ</p>
              {user.candidate && (
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <UserCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium">Họ và tên:</span> {user.candidate.fullName}
                  </span>
                </div>
              )}
              {user.recruiter?.position && (
                <div className="flex items-start gap-3 text-sm text-slate-700">
                  <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium">Chức vụ:</span> {user.recruiter.position}
                  </span>
                </div>
              )}
              {user.recruiter?.bio && (
                <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-3 leading-relaxed">
                  {user.recruiter.bio}
                </p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Thời gian</p>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span><span className="font-medium">Ngày tạo:</span> {fmt(user.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Clock className="w-4 h-4 text-slate-400 shrink-0" />
              <span><span className="font-medium">Đăng nhập cuối:</span> {fmt(user.lastLogin)}</span>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 px-6 py-4 flex items-center gap-3">
          {user.status === 'ACTIVE' ? (
            <button
              onClick={() => { onLock(user.userId); onClose(); }}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-semibold text-sm hover:bg-amber-100 transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              Khóa tài khoản
            </button>
          ) : (
            <button
              onClick={() => { onUnlock(user.userId); onClose(); }}
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-semibold text-sm hover:bg-emerald-100 transition-colors disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              Mở khóa
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isProcessing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Xóa
          </button>
        </div>
      </div>
    </div>
  );
}
