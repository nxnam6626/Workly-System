'use client';

import { useState } from 'react';
import { X, ShieldAlert, Mail, User, Lock, Loader2 } from 'lucide-react';
import { adminUsersApi } from '@/lib/admin-api';
import toast from 'react-hot-toast';

interface CreateAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateAdminModal({ isOpen, onClose, onSuccess }: CreateAdminModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
  });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isSupreme, setIsSupreme] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminUsersApi.createAdmin({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        permissions: isSupreme ? ['ALL'] : permissions,
      });
      toast.success('Tạo tài khoản Quản trị viên thành công!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo tài khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-sm">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Tạo Quản trị viên</h2>
              <p className="text-xs text-slate-500">Cấp quyền truy cập hệ thống toàn quyền</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="font-medium">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="Nhập họ tên Quản trị viên"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Địa chỉ Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Mật khẩu đăng nhập <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Ít nhất 6 ký tự"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="pt-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phân quyền Quản trị <span className="text-red-500">*</span>
              </label>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="flex items-center h-5 mt-0.5">
                    <input
                      type="checkbox"
                      checked={isSupreme}
                      onChange={(e) => {
                        setIsSupreme(e.target.checked);
                        if (e.target.checked) setPermissions([]);
                      }}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isSupreme ? 'text-indigo-700' : 'text-slate-800'}`}>Toàn Quyền (Supreme Admin)</p>
                    <p className="text-xs text-slate-500">Người này có quyền hạn tối cao, vượt qua mọi giới hạn.</p>
                  </div>
                </label>

                {!isSupreme && (
                  <div className="pt-2 border-t border-slate-200 space-y-2.5">
                    {[
                      { id: 'MANAGE_USERS', label: 'Quản lý Người dùng' },
                      { id: 'MANAGE_JOBS', label: 'Quản lý Việc làm' },
                      { id: 'MANAGE_BILLING', label: 'Quản lý Doanh thu' },
                      { id: 'MANAGE_SUPPORT', label: 'Chăm sóc Khách hàng' },
                    ].map(perm => (
                      <label key={perm.id} className="flex items-center gap-2.5 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={permissions.includes(perm.id)}
                          onChange={(e) => {
                            let newPerms = [...permissions];
                            if (e.target.checked) newPerms.push(perm.id);
                            else newPerms = newPerms.filter(p => p !== perm.id);
                            
                            if (newPerms.length === 4) {
                              setIsSupreme(true);
                              setPermissions([]);
                            } else {
                              setPermissions(newPerms);
                            }
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                        />
                        <span className={permissions.includes(perm.id) ? 'font-medium text-slate-800' : 'text-slate-600'}>
                          {perm.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-indigo-400 disabled:border-indigo-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang khởi tạo...
                </>
              ) : (
                'Tạo tài khoản'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
