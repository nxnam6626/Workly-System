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
  RotateCcw,
  Shield,
  Crown,
  Search,
  AlertTriangle,
} from 'lucide-react';
import { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface UserDetailModalProps {
  user: AdminUser;
  onClose: () => void;
  onLock: (id: string) => void;
  onUnlock: (id: string) => void;
  onDelete: (id: string) => void;
  onRoleChange: (id: string, role: string) => void;
  onUpdatePermissions?: (id: string, permissions: string[]) => void;
  onResetViolations: (id: string) => void;
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
  onRoleChange,
  onUpdatePermissions,
  onResetViolations,
  isProcessing,
}: UserDetailModalProps) {
  const [roleToChange, setRoleToChange] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<string[]>(user.admin?.permissions || []);
  const [tempIsSupreme, setTempIsSupreme] = useState(user.admin?.adminLevel === 1);
  const [violations, setViolations] = useState<any[]>([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [showViolations, setShowViolations] = useState(false);

  const displayName = user.candidate?.fullName ?? user.recruiter?.position ?? user.email.split('@')[0];
  const roles = user.userRoles.map((ur) => ur.role.roleName);

  const fmt = (d?: string) =>
    d ? new Date(d).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  const handleDelete = () => {
    onDelete(user.userId);
  };

  const loadViolations = async () => {
    if (showViolations) {
      setShowViolations(false);
      return;
    }
    setLoadingViolations(true);
    setShowViolations(true);
    try {
      // @ts-ignore
      const { adminUsersApi } = await import('@/lib/admin-api');
      const data = await adminUsersApi.getUserViolations(user.userId);
      setViolations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingViolations(false);
    }
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

            <div className="mt-4">
              <select
                className="text-sm border border-slate-200 w-full rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                onChange={(e) => {
                  if (e.target.value) {
                    setRoleToChange(e.target.value);
                    e.target.value = "";
                  }
                }}
                disabled={isProcessing || user.status === 'LOCKED'}
                value=""
              >
                <option value="" disabled>-- Cấp quyền mới cho tài khoản --</option>
                {!roles.includes('CANDIDATE') && <option value="CANDIDATE">Ứng viên</option>}
                {!roles.includes('RECRUITER') && <option value="RECRUITER">Nhà tuyển dụng</option>}
                {!roles.includes('ADMIN') && <option value="ADMIN">Quản trị viên</option>}
              </select>
            </div>

            {roles.includes('ADMIN') && user.admin && (
              <div className="mt-5 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-slate-800">Quyền hạn hệ thống</span>
                  </div>
                  {user.admin.adminLevel === 1 ? (
                    <span className="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">Toàn Quyền</span>
                  ) : (
                    <button
                      onClick={() => {
                        if (editingPermissions && onUpdatePermissions) {
                          onUpdatePermissions(user.userId, tempIsSupreme ? ['ALL'] : tempPermissions);
                          setEditingPermissions(false);
                        } else {
                          setTempPermissions(user.admin!.permissions || []);
                          setTempIsSupreme(user.admin!.adminLevel === 1);
                          setEditingPermissions(true);
                        }
                      }}
                      disabled={isProcessing}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                      {editingPermissions ? 'Lưu quyền' : 'Chỉnh sửa'}
                    </button>
                  )}
                </div>
                
                {user.admin.adminLevel === 1 && !editingPermissions ? (
                  <p className="text-xs text-slate-600">Supreme Admin - tài khoản này có đầy đủ các quyền và không bị giới hạn.</p>
                ) : (
                  <div className="space-y-3">
                    {editingPermissions && (
                      <label className="flex items-start gap-3 cursor-pointer group pb-2 border-b border-slate-100">
                        <div className="flex items-center h-5 mt-0.5">
                          <input
                            type="checkbox"
                            checked={tempIsSupreme}
                            onChange={(e) => {
                              setTempIsSupreme(e.target.checked);
                              if (e.target.checked) setTempPermissions([]);
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${tempIsSupreme ? 'text-indigo-700' : 'text-slate-800'}`}>Toàn Quyền (Supreme Admin)</p>
                          <p className="text-xs text-slate-500">Bật tùy chọn này để cấp toàn quyền hệ thống.</p>
                        </div>
                      </label>
                    )}

                    {!tempIsSupreme && [
                      { id: 'MANAGE_USERS', label: 'Quản lý Người dùng' },
                      { id: 'MANAGE_JOBS', label: 'Quản lý Việc làm' },
                      { id: 'MANAGE_BILLING', label: 'Quản lý Doanh thu' },
                      { id: 'MANAGE_SUPPORT', label: 'Chăm sóc Khách hàng' },
                    ].map(perm => (
                      <label key={perm.id} className={`flex items-center gap-2.5 text-sm ${editingPermissions ? 'cursor-pointer' : 'opacity-80'}`}>
                        <input
                          type="checkbox"
                          disabled={!editingPermissions || isProcessing}
                          checked={tempPermissions.includes(perm.id)}
                          onChange={(e) => {
                            let newPerms = [...tempPermissions];
                            if (e.target.checked) newPerms.push(perm.id);
                            else newPerms = newPerms.filter(p => p !== perm.id);

                            if (newPerms.length === 4) {
                              setTempIsSupreme(true);
                              setTempPermissions([]);
                            } else {
                              setTempPermissions(newPerms);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
                        />
                        <span className={tempPermissions.includes(perm.id) ? 'font-medium text-slate-800' : 'text-slate-500'}>{perm.label}</span>
                      </label>
                    ))}
                    {editingPermissions && (
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => setEditingPermissions(false)}
                          className="text-xs font-medium text-slate-500 hover:text-slate-700 mr-3"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Thông tin liên hệ</p>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="break-all">{user.email}</span>
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
              {user.recruiter && (
                <div className="space-y-2 mt-3">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 text-sm text-slate-700">
                      <Crown className={`w-4 h-4 ${user.recruiter.recruiterSubscription ? 'text-amber-500' : 'text-slate-400'}`} />
                      <span className="font-medium">Thời hạn sử dụng:</span>
                      {user.recruiter.recruiterSubscription ? (
                        <span className="font-bold text-amber-600">
                          {user.recruiter.recruiterSubscription.planType} - Đến {fmt(user.recruiter.recruiterSubscription.expiryDate)}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Không có gói</span>
                      )}
                    </div>
                  </div>

                  {user.recruiter.recruiterWallet && (
                     <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
                       <div className="flex items-center gap-2 text-sm text-slate-700">
                         <Search className="w-4 h-4 text-emerald-500" />
                         <span className="font-medium">Lượt mở khóa CV:</span>
                         <span className="font-bold text-emerald-600">
                           {user.recruiter.recruiterWallet.cvUnlockQuota} lượt
                         </span>
                       </div>
                     </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* Global Rule Violations */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Vi phạm quy tắc</p>
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className={`w-4 h-4 ${(user as any).violations >= 3 ? 'text-rose-500' : 'text-amber-500'}`} />
                <span className="font-medium text-slate-700">Vi phạm gian lận / Chat:</span>
                <span className={`font-bold ${(user as any).violations >= 3 ? 'text-rose-600' : 'text-amber-600'}`}>
                  {(user as any).violations || 0}/3
                </span>
              </div>
              {((user as any).violations > 0 || (user.recruiter?.violationCount ?? 0) > 0) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadViolations}
                    disabled={isProcessing}
                    className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                  >
                    {showViolations ? 'Ẩn chi tiết' : 'Xem chi tiết'}
                  </button>
                  <button
                    onClick={() => {
                      onResetViolations(user.userId);
                      setViolations([]);
                      setShowViolations(false);
                    }}
                    disabled={isProcessing}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Khôi phục
                  </button>
                </div>
              )}
            </div>
            
            {/* Violations List Expanded */}
            {showViolations && (
              <div className="mt-2 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-[250px] overflow-y-auto animate-in slide-in-from-top-2">
                {loadingViolations ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  </div>
                ) : violations.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Không tìm thấy nội dung vi phạm.</p>
                ) : (
                  <div className="space-y-3">
                    {violations.map((v, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-400 group-hover:bg-red-500 transition-colors"></div>
                        <div className="flex justify-between items-start mb-1.5 pl-1">
                          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Gửi tới: <span className="text-slate-700">{v.conversationName}</span>
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded">
                            {fmt(v.sentAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 font-medium pl-1 break-words">
                          "{v.content}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {user.recruiter && (user.recruiter.violationCount > 0) && (
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 mt-2">
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span className="font-medium text-slate-700">Vi phạm tin đăng việc làm:</span>
                  <span className="font-bold text-amber-600">
                    {user.recruiter.violationCount}/3
                  </span>
                </div>
              </div>
            )}
          </div>

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

      <ConfirmModal
        isOpen={!!roleToChange}
        title="Thay đổi vai trò"
        message={`Bạn có chắc muốn cấp quyền: ${roleToChange ? ROLE_LABELS[roleToChange] : ''} cho người dùng này? Các quyền cũ (ngoại trừ ứng viên cơ bản) sẽ bị ghi đè.`}
        confirmLabel="Xác nhận"
        onConfirm={() => {
          if (roleToChange) onRoleChange(user.userId, roleToChange);
          setRoleToChange(null);
        }}
        onCancel={() => setRoleToChange(null)}
        isLoading={isProcessing}
      />
    </div>
  );
}
