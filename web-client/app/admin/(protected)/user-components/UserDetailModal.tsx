'use client';

import {
  adminUsersApi,
  type AdminUser,
  type AdminDegree,
  type AdminCertification,
} from '@/lib/admin-api';
import { profileApi } from '@/lib/profile-api';
import { getCertificateExpirationStatus } from '@/lib/utils';
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
  Award,
  GraduationCap,
  Sparkles,
  Brain,
  XCircle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Check,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import toast from 'react-hot-toast';

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
  onRefreshList?: () => void;
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
  onRefreshList,
}: UserDetailModalProps) {
  const [roleToChange, setRoleToChange] = useState<string | null>(null);
  const [editingPermissions, setEditingPermissions] = useState(false);
  const [tempPermissions, setTempPermissions] = useState<string[]>(user.admin?.permissions || []);
  const [tempIsSupreme, setTempIsSupreme] = useState(user.admin?.permissions?.includes('SUPER_ADMIN') || false);
  const [violations, setViolations] = useState<any[]>([]);
  const [loadingViolations, setLoadingViolations] = useState(false);
  const [showViolations, setShowViolations] = useState(false);

  // Verification & Tab States
  const [activeTab, setActiveTab] = useState<'basic' | 'verification'>('basic');
  const [fullUser, setFullUser] = useState<AdminUser | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemType, setSelectedItemType] = useState<'degree' | 'certification' | null>(null);
  
  const [actionState, setActionState] = useState<{
    id: string;
    type: 'degree' | 'certification';
    action: 'APPROVE' | 'REJECT';
    name: string;
  } | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

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
<<<<<<< HEAD
      const data = await adminUsersApi.getUserViolations(user.userId);
=======
      // @ts-ignore
      const { adminDashboardApi } = await import('@/lib/admin-api');
      const data = await adminDashboardApi.getUserViolationLogs(user.userId);
>>>>>>> 30f152d95322597dc12b3a65e4f3e74935cce583
      setViolations(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingViolations(false);
    }
  };

  // Fetch full details including certifications and degrees on mount
  const loadFullUserDetails = async () => {
    setLoadingUser(true);
    try {
      const data = await adminUsersApi.getOne(user.userId);
      setFullUser(data);
      
      // Auto-select first pending item, or fallback to first item
      const cand = data.candidate;
      if (cand) {
        const pendingDegree = cand.degrees?.find(d => d.status === 'PENDING');
        const pendingCert = cand.certifications?.find(c => c.status === 'PENDING');
        
        const firstDegree = cand.degrees?.[0];
        const firstCert = cand.certifications?.[0];
        
        if (pendingDegree) {
          setSelectedItemId(pendingDegree.degreeId);
          setSelectedItemType('degree');
        } else if (pendingCert) {
          setSelectedItemId(pendingCert.certificationId);
          setSelectedItemType('certification');
        } else if (firstDegree) {
          setSelectedItemId(firstDegree.degreeId);
          setSelectedItemType('degree');
        } else if (firstCert) {
          setSelectedItemId(firstCert.certificationId);
          setSelectedItemType('certification');
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải chi tiết người dùng:', err);
      toast.error('Không thể tải chi tiết hồ sơ bằng cấp/chứng chỉ.');
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    if (roles.includes('CANDIDATE')) {
      loadFullUserDetails();
    }
  }, [user.userId]);

  const candidate = fullUser?.candidate || user.candidate;
  
  // Pending verification count for candidate
  const pendingVerificationsCount = candidate
    ? (candidate.degrees?.filter((d) => d.status === 'PENDING').length || 0) +
      (candidate.certifications?.filter((c) => c.status === 'PENDING').length || 0)
    : 0;

  // Selected item reference
  const selectedItem = selectedItemType === 'degree'
    ? candidate?.degrees?.find((d) => d.degreeId === selectedItemId)
    : candidate?.certifications?.find((c) => c.certificationId === selectedItemId);

  const handleActionClick = (
    type: 'degree' | 'certification',
    id: string,
    name: string,
    action: 'APPROVE' | 'REJECT',
    suggestedReason?: string
  ) => {
    setActionState({ id, type, action, name });
    setFeedback(suggestedReason || '');
  };

  const handleActionSubmit = async () => {
    if (!actionState) return;
    if (actionState.action === 'REJECT' && !feedback.trim()) {
      toast.error('Vui lòng nhập lý do từ chối.');
      return;
    }

    setIsSubmittingAction(true);
    const toastId = toast.loading('Đang xử lý...');

    try {
      if (actionState.type === 'certification') {
        await profileApi.actionCertificationVerification(
          actionState.id,
          actionState.action,
          feedback.trim()
        );
      } else {
        await profileApi.actionDegreeVerification(
          actionState.id,
          actionState.action,
          feedback.trim()
        );
      }

      toast.success(
        actionState.action === 'APPROVE'
          ? 'Đã phê duyệt xác minh thành công!'
          : 'Đã từ chối yêu cầu xác minh.',
        { id: toastId }
      );
      
      setActionState(null);
      
      // Reload full user data to update detail view
      await loadFullUserDetails();
      
      // Refresh candidates list in parent component to update pending badges
      if (onRefreshList) onRefreshList();
    } catch (err) {
      const errorMsg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Có lỗi xảy ra khi thực hiện thao tác.';
      toast.error(errorMsg, { id: toastId });
    } finally {
      setIsSubmittingAction(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`relative w-full h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300 transition-all ${
          activeTab === 'verification' ? 'max-w-5xl' : 'max-w-md'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Chi Tiết Người Dùng</h2>
            {roles.includes('CANDIDATE') && (
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Ứng viên: <span className="font-semibold text-slate-600">{displayName}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab System for Candidate */}
        {roles.includes('CANDIDATE') && (
          <div className="flex border-b border-slate-100 bg-slate-50 px-6">
            <button
              onClick={() => setActiveTab('basic')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all ${
                activeTab === 'basic'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Thông tin cơ bản
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'verification'
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Xác minh minh chứng
              {pendingVerificationsCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-emerald-100 text-emerald-700">
                  {pendingVerificationsCount}
                </span>
              )}
            </button>
          </div>
        )}

<<<<<<< HEAD
        {/* Modal Content Switch */}
        {activeTab === 'verification' ? (
          /* Option B: Integrated Two-Column Verification Panel */
          <div className="flex-1 flex overflow-hidden min-h-0 divide-x divide-slate-100">
            {/* Left Column: Certs & Degrees List */}
            <div className="w-80 overflow-y-auto p-5 space-y-5 shrink-0 bg-slate-50/30">
              {/* Bằng cấp học vấn */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-500" /> Bằng cấp học vấn
                </h4>
                {candidate?.degrees && candidate.degrees.length > 0 ? (
                  <div className="space-y-2">
                    {candidate.degrees.map((deg) => {
                      const isSelected = selectedItemId === deg.degreeId && selectedItemType === 'degree';
                      return (
=======
            {/* Role dropdown removed per user request */}

            {roles.includes('ADMIN') && user.admin && (
              <div className="mt-5 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold text-slate-800">Quyền hạn hệ thống</span>
                  </div>
                  {user.admin.permissions.includes('SUPER_ADMIN') ? (
                    <span className="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">Toàn Quyền</span>
                  ) : (
                    <button
                      onClick={() => {
                        if (editingPermissions && onUpdatePermissions) {
                          onUpdatePermissions(user.userId, tempIsSupreme ? ['SUPER_ADMIN'] : tempPermissions);
                          setEditingPermissions(false);
                        } else {
                          setTempPermissions(user.admin!.permissions || []);
                          setTempIsSupreme(user.admin!.permissions.includes('SUPER_ADMIN'));
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
                
                {user.admin.permissions.includes('SUPER_ADMIN') && !editingPermissions ? (
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
                      { id: 'MANAGE_REVENUE', label: 'Quản lý Doanh thu' },
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
>>>>>>> 30f152d95322597dc12b3a65e4f3e74935cce583
                        <button
                          key={deg.degreeId}
                          onClick={() => {
                            setSelectedItemId(deg.degreeId);
                            setSelectedItemType('degree');
                            setActionState(null);
                          }}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                          }`}
                        >
                          <div className={`p-1.5 rounded-xl mt-0.5 shrink-0 ${isSelected ? 'bg-emerald-100/50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{deg.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{deg.school}</p>
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                deg.status === 'VERIFIED' ? 'bg-emerald-500' :
                                deg.status === 'PENDING' ? 'bg-amber-500 animate-pulse' :
                                deg.status === 'REJECTED' ? 'bg-rose-500' : 'bg-slate-400'
                              }`} />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                                {deg.status === 'VERIFIED' ? 'Đã duyệt' :
                                 deg.status === 'PENDING' ? 'Chờ duyệt' :
                                 deg.status === 'REJECTED' ? 'Bị từ chối' : 'Chưa xác minh'}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic pl-1 py-1">Chưa khai báo bằng cấp học vấn.</p>
                )}
              </div>

              {/* Chứng chỉ chuyên môn */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 px-1">
                  <Award className="w-3.5 h-3.5 text-slate-500" /> Chứng chỉ chuyên môn
                </h4>
                {candidate?.certifications && candidate.certifications.length > 0 ? (
                  <div className="space-y-2">
                    {candidate.certifications.map((cert) => {
                      const isSelected = selectedItemId === cert.certificationId && selectedItemType === 'certification';
                      const expStatus = getCertificateExpirationStatus(cert);
                      return (
                        <button
                          key={cert.certificationId}
                          onClick={() => {
                            setSelectedItemId(cert.certificationId);
                            setSelectedItemType('certification');
                            setActionState(null);
                          }}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/10 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                          }`}
                        >
                          <div className={`p-1.5 rounded-xl mt-0.5 shrink-0 ${isSelected ? 'bg-emerald-100/50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Award className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{cert.name}</p>
                            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">{cert.issuer || 'N/A'}</p>
                            {expStatus.expiryDateStr && expStatus.expiryDateStr !== "Vĩnh viễn" && (
                              <p className="text-[10px] font-semibold text-slate-500 mt-0.5">
                                Hết hạn: <span className={expStatus.isExpired ? "text-amber-600 font-bold" : ""}>
                                  {expStatus.expiryDateStr}
                                </span>
                              </p>
                            )}
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                cert.status === 'VERIFIED'
                                  ? (expStatus.isExpired ? 'bg-amber-500' : 'bg-emerald-500')
                                  : cert.status === 'PENDING'
                                  ? 'bg-amber-500 animate-pulse'
                                  : cert.status === 'REJECTED'
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400'
                              }`} />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide">
                                {cert.status === 'VERIFIED'
                                  ? (expStatus.isExpired ? 'Đã duyệt (Hết hạn)' : 'Đã duyệt')
                                  : cert.status === 'PENDING'
                                  ? 'Chờ duyệt'
                                  : cert.status === 'REJECTED'
                                  ? 'Bị từ chối'
                                  : 'Chưa xác minh'}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
<<<<<<< HEAD
                ) : (
                  <p className="text-xs text-slate-400 italic pl-1 py-1">Chưa khai báo chứng chỉ chuyên môn.</p>
                )}
              </div>
            </div>

            {/* Right Column: Verification Panel details & Previews */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 flex flex-col space-y-6">
              {loadingUser ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-emerald-500" />
                  <span className="text-sm font-semibold">Đang đồng bộ dữ liệu...</span>
                </div>
              ) : !selectedItem ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center py-10">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8 text-slate-350" />
                  </div>
                  <h4 className="font-bold text-slate-700">Chọn năng lực cần thẩm định</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">Nhấp vào một bằng cấp hoặc chứng chỉ ở cột trái để xem tài liệu minh chứng và kết quả kiểm tra.</p>
                </div>
              ) : (
                <>
                  {/* Item Details Header */}
                  {(() => {
                    const expStatus = selectedItemType === 'certification'
                      ? getCertificateExpirationStatus(selectedItem as any)
                      : { isExpired: false, expiryDateStr: null, validityDurationMonths: null };

                    const leftBorderColor = selectedItem.status === 'VERIFIED'
                      ? (expStatus.isExpired ? 'bg-amber-500' : 'bg-emerald-500')
                      : selectedItem.status === 'PENDING'
                      ? 'bg-amber-500'
                      : selectedItem.status === 'REJECTED'
                      ? 'bg-rose-500'
                      : 'bg-slate-400';

                    return (
                      <div className="bg-white rounded-3xl border border-slate-150 p-5 space-y-3 shadow-sm relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-1.5 h-full ${leftBorderColor}`} />
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {selectedItemType === 'degree' ? 'Bằng cấp học vấn' : 'Chứng chỉ chuyên môn'}
                            </span>
                            <h3 className="text-base font-black text-slate-800 mt-0.5">{selectedItem.name}</h3>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            selectedItem.status === 'VERIFIED'
                              ? (expStatus.isExpired ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700')
                              : selectedItem.status === 'PENDING' ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : selectedItem.status === 'REJECTED' ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            {selectedItem.status === 'VERIFIED'
                              ? (expStatus.isExpired ? 'Đã duyệt (Hết hạn) ⚠' : 'Đã duyệt ✓')
                              : selectedItem.status === 'PENDING' ? 'Chờ duyệt ⚡'
                              : selectedItem.status === 'REJECTED' ? 'Bị từ chối ✗'
                              : 'Chưa xác minh'}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2 text-xs border-t border-slate-100">
                          <div>
                            <p className="text-slate-400 font-bold">Nơi đào tạo/Nhà cung cấp:</p>
                            <p className="font-semibold text-slate-700 mt-0.5">
                              {selectedItemType === 'degree' ? (selectedItem as AdminDegree).school : (selectedItem as AdminCertification).issuer || 'N/A'}
                            </p>
                          </div>
                          {selectedItemType === 'degree' && (selectedItem as AdminDegree).major && (
                            <div>
                              <p className="text-slate-400 font-bold">Chuyên ngành học:</p>
                              <p className="font-semibold text-slate-700 mt-0.5">{(selectedItem as AdminDegree).major}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-slate-400 font-bold">Thời gian / Ngày cấp:</p>
                            <p className="font-semibold text-slate-700 mt-0.5">{selectedItem.issueDate || 'N/A'}</p>
                          </div>
                          {expStatus.expiryDateStr && expStatus.expiryDateStr !== "Vĩnh viễn" && (
                            <div>
                              <p className="text-slate-400 font-bold">Ngày hết hạn:</p>
                              <p className={`font-semibold mt-0.5 ${expStatus.isExpired ? 'text-amber-600 font-black' : 'text-slate-700'}`}>
                                {expStatus.expiryDateStr} {expStatus.isExpired ? '(Hết hạn)' : ''}
                              </p>
                            </div>
                          )}
                          {selectedItem.credentialId && (
                            <div>
                              <p className="text-slate-400 font-bold">Mã số định danh:</p>
                              <p className="font-mono font-semibold text-slate-700 mt-0.5">{selectedItem.credentialId}</p>
                            </div>
                          )}
                          {selectedItemType === 'certification' && (selectedItem as AdminCertification).credentialUrl && (
                            <div className="col-span-2">
                              <p className="text-slate-400 font-bold">Đường dẫn đối chiếu quốc tế:</p>
                              <a
                                href={(selectedItem as AdminCertification).credentialUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold mt-0.5"
                              >
                                {(selectedItem as AdminCertification).credentialUrl} <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          )}
                        </div>
=======

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
                <span className="font-medium text-slate-700">Vi phạm gian lận:</span>
                <span className={`font-bold ${(user as any).violations >= 3 ? 'text-rose-600' : 'text-amber-600'}`}>
                  {(user as any).violations || 0}/3
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={loadViolations}
                  disabled={isProcessing}
                  className="text-xs font-bold text-slate-600 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  {showViolations ? 'Ẩn lịch sử' : 'Lịch sử vi phạm'}
                </button>
                {((user as any).violations > 0 || (user.recruiter?.violationCount ?? 0) > 0) && (
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
                )}
              </div>
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
                            Lý do vi phạm:
                          </p>
                          <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1.5 py-0.5 rounded">
                            {fmt(v.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm text-slate-800 font-medium pl-1 break-words">
                          {v.reason}
                        </p>
>>>>>>> 30f152d95322597dc12b3a65e4f3e74935cce583
                      </div>
                    );
                  })()}

                  {/* Warning banner if expired */}
                  {selectedItemType === 'certification' && selectedItem.status === 'VERIFIED' && (() => {
                    const expStatus = getCertificateExpirationStatus(selectedItem as any);
                    if (expStatus.isExpired) {
                      return (
                        <div className="bg-amber-50/80 border border-amber-250 rounded-3xl p-4 flex gap-3 text-amber-800 shadow-sm animate-in fade-in duration-200">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <h5 className="text-xs font-black uppercase tracking-wider text-amber-700">Chứng chỉ đã hết hạn hiệu lực</h5>
                            <p className="text-xs leading-relaxed text-amber-750">
                              Hệ thống phát hiện chứng chỉ này đã hết hạn hiệu lực (hết hạn ngày {expStatus.expiryDateStr}). Hãy lưu ý khi đánh giá hồ sơ năng lực của ứng viên.
                            </p>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Document Preview Panel */}
                  <div className="bg-white rounded-3xl border border-slate-150 p-5 space-y-3 shadow-sm">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-500" /> Tài liệu đính kèm làm minh chứng
                    </h4>

                    {selectedItem.fileUrl ? (
                      <div className="space-y-2">
                        {selectedItem.fileUrl.endsWith('.pdf') ? (
                          <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
                            <iframe
                              src={selectedItem.fileUrl}
                              className="w-full h-80 border-none"
                              title="Tài liệu PDF"
                            />
                            <div className="p-3 bg-slate-50 flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Định dạng tài liệu: PDF</span>
                              <a
                                href={selectedItem.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 hover:underline font-bold"
                              >
                                Tải xuống / Mở Tab mới <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full flex flex-col items-center">
                            <img
                              src={selectedItem.fileUrl}
                              alt="Minh chứng"
                              className="max-w-full max-h-80 object-contain rounded-2xl border border-slate-150 shadow-sm bg-slate-900/5 cursor-zoom-in"
                              onClick={() => window.open(selectedItem.fileUrl || '', '_blank')}
                            />
                            <p className="text-[10px] text-slate-400 mt-2 font-medium italic">
                              *Nhấp vào hình ảnh trên để xem kích thước đầy đủ trong tab mới*
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                        <AlertCircle className="w-6 h-6 text-slate-350 mb-2" />
                        <span>Ứng viên chưa tải lên tệp tài liệu đính kèm.</span>
                      </div>
                    )}
                  </div>

                  {/* AI Appraisal Box (Matching Original Style) */}
                  {selectedItem.aiVerification ? (
                    <div className="bg-white rounded-3xl border border-slate-150 p-5 space-y-4 shadow-sm">
                      {/* AI header */}
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Brain className="w-4 h-4 text-indigo-500" /> Kết quả thẩm định Gemini AI (7 tiêu chí)
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            selectedItem.aiVerification.risk_level === 'low' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            selectedItem.aiVerification.risk_level === 'high' ? 'bg-rose-50 border-rose-200 text-rose-700' :
                            'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            Rủi ro: {selectedItem.aiVerification.risk_level === 'low' ? 'Thấp ✓' : selectedItem.aiVerification.risk_level === 'high' ? 'Cao ⚠' : 'Trung bình'}
                          </span>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            selectedItem.aiVerification.confidence_score >= 80 ? 'bg-emerald-100 text-emerald-800' :
                            selectedItem.aiVerification.confidence_score >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                          }`}>Tin cậy: {selectedItem.aiVerification.confidence_score}%</span>
                        </div>
                      </div>

                      {/* Confidence score progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          selectedItem.aiVerification.confidence_score >= 80 ? 'bg-emerald-500' :
                          selectedItem.aiVerification.confidence_score >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                        }`} style={{ width: `${selectedItem.aiVerification.confidence_score}%` }} />
                      </div>

                      {/* Side-by-side details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2 text-xs">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">So đối chiếu thông tin</p>
                          <div className="space-y-1.5">
                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex justify-between gap-2 items-center">
                              <div>
                                <p className="text-slate-400 font-bold text-[10px]">Ứng viên khai báo:</p>
                                <p className="font-bold text-slate-800 mt-0.5">{candidate?.fullName}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-slate-400 font-bold text-[10px]">AI trích xuất:</p>
                                <p className={`font-black mt-0.5 ${selectedItem.aiVerification.name_matches ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {selectedItem.aiVerification.extracted_name || 'N/A'} {selectedItem.aiVerification.name_matches ? '✓' : '✗'}
                                </p>
                              </div>
                            </div>

                            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                              <p className="text-slate-400 font-bold text-[10px]">Trường/Nơi cấp (Trích xuất):</p>
                              <p className="font-bold text-slate-800 mt-0.5">
                                {selectedItem.aiVerification.extracted_institution || 'N/A'}
                                {selectedItem.aiVerification.institution_type && selectedItem.aiVerification.institution_type !== 'unknown' && (
                                  <span className="ml-1 text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-full font-bold border border-blue-100">
                                    {selectedItem.aiVerification.institution_type === 'international_org' ? '🌐 Quốc tế' :
                                     selectedItem.aiVerification.institution_type === 'university' ? '🎓 ĐH' :
                                     selectedItem.aiVerification.institution_type === 'college' ? '🏫 CĐ/TC' :
                                     selectedItem.aiVerification.institution_type === 'vocational' ? '🔧 Nghề' : '🏢 Tổ chức'}
                                  </span>
                                )}
                              </p>
                            </div>

                            {selectedItemType === 'degree' && (
                              <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 flex justify-between gap-2">
                                <div>
                                  <p className="text-slate-400 font-bold text-[10px]">Khai báo ngành:</p>
                                  <p className="font-bold text-slate-850 mt-0.5">{(selectedItem as AdminDegree).major || 'N/A'}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-slate-400 font-bold text-[10px]">AI trích xuất:</p>
                                  <p className="font-bold text-slate-800 mt-0.5">{selectedItem.aiVerification.extracted_major || 'N/A'}</p>
                                </div>
                              </div>
                            )}

                            {selectedItem.aiVerification.extracted_grade && (
                              <div className="p-2 rounded-xl bg-violet-50 border border-violet-100 flex justify-between items-center text-xs">
                                <span className="font-bold text-violet-700">🏅 Kết quả xếp loại (AI):</span>
                                <span className="font-black text-violet-800">{selectedItem.aiVerification.extracted_grade}</span>
                              </div>
                            )}

                            {selectedItem.aiVerification.extracted_credential_id && (
                              <div className="p-2 rounded-xl bg-indigo-50 border border-indigo-100 flex justify-between items-center text-xs">
                                <span className="font-bold text-indigo-700">Số hiệu / Số quyết định (AI):</span>
                                <span className="font-mono font-black text-indigo-800">{selectedItem.aiVerification.extracted_credential_id}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-3 text-xs">
                          {/* Visual signals */}
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tín hiệu bảo mật tài liệu</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div className={`flex items-center gap-1.5 p-2 rounded-xl border font-bold ${selectedItem.aiVerification.has_official_seal ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-150 text-slate-400'}`}>
                              {selectedItem.aiVerification.has_official_seal ? '✓' : '✗'} Dấu mộc đỏ/nổi
                            </div>
                            <div className={`flex items-center gap-1.5 p-2 rounded-xl border font-bold ${selectedItem.aiVerification.has_signature ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-150 text-slate-400'}`}>
                              {selectedItem.aiVerification.has_signature ? '✓' : '✗'} Chữ ký hợp lệ
                            </div>
                            <div className={`flex items-center gap-1.5 p-2 rounded-xl border font-bold ${selectedItem.aiVerification.has_security_features ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-150 text-slate-400'}`}>
                              {selectedItem.aiVerification.has_security_features ? '✓' : '✗'} Hoa văn chống giả
                            </div>
                            <div className={`flex items-center gap-1.5 p-2 rounded-xl border font-bold ${
                              selectedItem.aiVerification.image_quality === 'clear' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                              selectedItem.aiVerification.image_quality === 'poor' ? 'bg-rose-50 border-rose-150 text-rose-700' :
                              'bg-amber-50 border-amber-150 text-amber-700'
                            }`}>
                              {selectedItem.aiVerification.image_quality === 'clear' ? '✓ Ảnh rõ nét' : selectedItem.aiVerification.image_quality === 'poor' ? '✗ Ảnh quá mờ' : '⚠ Ảnh chấp nhận được'}
                            </div>
                          </div>

                          {/* Criterion list summaries */}
                          {selectedItem.aiVerification.verification_criteria_summary && selectedItem.aiVerification.verification_criteria_summary.length > 0 && (
                            <div className="space-y-1 mt-1 border-t border-slate-100 pt-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Tóm tắt kiểm duyệt</p>
                              {selectedItem.aiVerification.verification_criteria_summary.map((crit: string, idx: number) => (
                                <p key={idx} className="text-[11px] text-slate-500 font-medium leading-relaxed">• {crit}</p>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* AI Reason box */}
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Đánh giá chung của AI</p>
                        <div className={`p-3 rounded-2xl border font-medium leading-relaxed ${
                          !selectedItem.aiVerification.is_valid ? 'bg-rose-50 border-rose-100 text-rose-700' :
                          !selectedItem.aiVerification.name_matches ? 'bg-amber-50 border-amber-100 text-amber-700' :
                          'bg-indigo-50/30 border-indigo-100 text-indigo-750'
                        }`}>
                          {selectedItem.aiVerification.reason || 'Không ghi nhận ý kiến từ mô hình.'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-250 flex items-center gap-2.5 text-xs text-slate-500">
                      <AlertCircle className="w-4.5 h-4.5 shrink-0 text-slate-400" />
                      <span>Chứng chỉ/bằng cấp này chưa được xử lý thông tin tự động bằng AI hoặc tài liệu đính kèm trước khi AI được kích hoạt.</span>
                    </div>
                  )}

                  {/* Previous Feedback (For Verified/Rejected status) */}
                  {selectedItem.status !== 'PENDING' && selectedItem.adminFeedback && (
                    <div className="p-4 bg-white rounded-3xl border border-slate-150 text-xs space-y-1">
                      <p className="text-slate-400 font-bold">Ghi chú phản hồi trước đó của Admin:</p>
                      <p className="text-slate-700 font-medium whitespace-pre-wrap">{selectedItem.adminFeedback}</p>
                    </div>
                  )}

                  {/* Action Forms / Buttons */}
                  {selectedItem.status === 'PENDING' ? (
                    <div className="bg-white rounded-3xl border border-slate-150 p-5 shadow-sm space-y-4">
                      {!actionState ? (
                        <div className="flex items-center gap-3">
                          <p className="text-xs text-slate-500 font-medium">Thay đổi trạng thái năng lực ứng viên:</p>
                          <div className="flex-1 flex justify-end gap-2.5">
                            <button
                              onClick={() =>
                                handleActionClick(
                                  selectedItemType!,
                                  selectedItemId!,
                                  selectedItem.name,
                                  'APPROVE',
                                  selectedItem.aiVerification?.is_valid && selectedItem.aiVerification?.name_matches
                                    ? '[AI Tự động thẩm định] Tài liệu minh chứng hợp lệ và trùng khớp.'
                                    : ''
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5" /> Phê duyệt
                            </button>
                            <button
                              onClick={() =>
                                handleActionClick(
                                  selectedItemType!,
                                  selectedItemId!,
                                  selectedItem.name,
                                  'REJECT',
                                  selectedItem.aiVerification?.reason || ''
                                )
                              }
                              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95"
                            >
                              <X className="w-3.5 h-3.5" /> Từ chối
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Inline Decision Form */
                        <div className="space-y-3 animate-in fade-in duration-200">
                          <div className="flex items-center gap-2 font-bold text-xs">
                            <div className={`w-2 h-2 rounded-full ${actionState.action === 'APPROVE' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <span className={actionState.action === 'APPROVE' ? 'text-emerald-700' : 'text-rose-700'}>
                              {actionState.action === 'APPROVE' ? 'PHÊ DUYỆT XÁC MINH' : 'TỪ CHỐI XÁC MINH'}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {actionState.action === 'APPROVE' ? 'Ghi chú phản hồi (Không bắt buộc)' : 'Lý do từ chối (Bắt buộc)'}
                            </label>
                            <textarea
                              rows={3}
                              placeholder={
                                actionState.action === 'APPROVE'
                                  ? 'Nhập nhận xét phê duyệt hồ sơ...'
                                  : 'Nêu rõ lý do từ chối để ứng viên sửa đổi hoặc tải lại tài liệu minh chứng khác...'
                              }
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none"
                            />
                          </div>

                          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                            <button
                              onClick={() => setActionState(null)}
                              disabled={isSubmittingAction}
                              className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition"
                            >
                              Hủy bỏ
                            </button>
                            <button
                              onClick={handleActionSubmit}
                              disabled={isSubmittingAction}
                              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition disabled:opacity-40 active:scale-95 shadow-sm ${
                                actionState.action === 'APPROVE'
                                  ? 'bg-emerald-600 hover:bg-emerald-700'
                                  : 'bg-rose-600 hover:bg-rose-700'
                              }`}
                            >
                              {isSubmittingAction ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang cập nhật...
                                </>
                              ) : (
                                'Xác nhận lưu'
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-150 rounded-3xl p-5 shadow-sm text-xs font-semibold text-slate-500 flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full ${selectedItem.status === 'VERIFIED' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>
                        Năng lực này đã được xác minh ({selectedItem.status === 'VERIFIED' ? 'Đã duyệt' : 'Bị từ chối'}). Không cần thực hiện thêm thao tác.
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          /* Tab 1: Basic Information (Standard User Detail Modal layout) */
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
                      e.target.value = '';
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
                    {user.admin.permissions.includes('SUPER_ADMIN') ? (
                      <span className="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-100 px-2 py-0.5 rounded-full">Toàn Quyền</span>
                    ) : (
                      <button
                        onClick={() => {
                          if (editingPermissions && onUpdatePermissions) {
                            onUpdatePermissions(user.userId, tempIsSupreme ? ['SUPER_ADMIN'] : tempPermissions);
                            setEditingPermissions(false);
                          } else {
                            setTempPermissions(user.admin!.permissions || []);
                            setTempIsSupreme(user.admin!.permissions.includes('SUPER_ADMIN'));
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
                  
                  {user.admin.permissions.includes('SUPER_ADMIN') && !editingPermissions ? (
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
                        { id: 'MANAGE_REVENUE', label: 'Quản lý Doanh thu' },
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
                  <span className="font-medium text-slate-700">Vi phạm gian lận:</span>
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
        )}

        {/* Footer actions (only for Basic Info Tab) */}
        {activeTab === 'basic' && (
          <div className="border-t border-slate-100 px-6 py-4 flex items-center gap-3">
            {user.status === 'ACTIVE' ? (
              <button
                onClick={() => { onLock(user.userId); onClose(); }}
                disabled={isProcessing || user.email === 'admin@test.com'}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 text-amber-700 font-semibold text-sm hover:bg-amber-100 transition-colors disabled:opacity-50"
                title={user.email === 'admin@test.com' ? 'Không thể khóa tài khoản tối cao' : ''}
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
              disabled={isProcessing || user.email === 'admin@test.com'}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 text-red-600 font-semibold text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
              title={user.email === 'admin@test.com' ? 'Không thể xóa tài khoản tối cao' : ''}
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </button>
          </div>
        )}
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
