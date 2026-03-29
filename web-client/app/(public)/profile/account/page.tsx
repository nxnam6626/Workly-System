'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Shield, Mail, Lock, CheckCircle, AlertCircle, Loader2, Send, Key, Eye, EyeOff } from 'lucide-react';
import { StatusBanner } from '@/components/ui/StatusBanner';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, changePassword, sendVerificationEmail } = useAuthStore();

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Email verification state
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword !== confirmPassword) {
      setPasswordStatus({ type: 'error', message: 'Mật khẩu mới không khớp!' });
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordStatus({ type: 'success', message: 'Đổi mật khẩu thành công! Mật khẩu của bạn đã được cập nhật.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordStatus({ type: 'error', message: error.response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSendVerification = async () => {
    setEmailStatus(null);
    setIsSendingVerification(true);
    try {
      await sendVerificationEmail();
      setEmailStatus({ type: 'success', message: 'Mã xác minh đã được gửi! Đang chuyển hướng bạn tới trang nhập mã...' });
      setTimeout(() => {
        if (user?.email) {
          router.push(`/verify-email?email=${user.email}`);
        }
      }, 1500);
    } catch (error: any) {
      setEmailStatus({ type: 'error', message: error.response?.data?.message || 'Không thể gửi email xác minh. Vui lòng thử lại sau.' });
    } finally {
      setIsSendingVerification(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in duration-700">
      <div className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 flex items-center gap-4 tracking-tight">
          <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-200">
            <Shield className="w-8 h-8 text-white" />
          </div>
          Bảo mật & Tài khoản
        </h1>
        <p className="text-slate-500 mt-4 text-xl leading-relaxed max-w-2xl">
          Quản lý thông tin đăng nhập và xác thực để đảm bảo an toàn tối đa cho hồ sơ Workly của bạn.
        </p>
      </div>

      <div className="grid gap-10">
        {/* Email Verification Section */}
        <section className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200/50">
          <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              Xác minh danh tính
            </h2>
            {user.isEmailVerified ? (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 font-bold text-sm">
                <CheckCircle className="w-4 h-4" />
                Đã xác minh
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-100 font-bold text-sm animate-pulse">
                <AlertCircle className="w-4 h-4" />
                Chờ xác minh
              </div>
            )}
          </div>
          <div className="p-8">
            <StatusBanner 
              type={emailStatus?.type as any} 
              message={emailStatus?.message || null} 
              onClose={() => setEmailStatus(null)}
            />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="space-y-2">
                <div className="flex items-center gap-3 text-slate-900">
                  <span className="text-2xl font-bold tracking-tight">{user.email}</span>
                </div>
                <p className="text-slate-500 text-base max-w-md leading-relaxed">
                  Chúng tôi sẽ gửi mã OTP đến địa chỉ này để xác thực quyền sở hữu tài khoản của bạn.
                </p>
              </div>
              
              {!user.isEmailVerified && (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <button
                    onClick={() => router.push(`/verify-email?email=${user?.email}`)}
                    className="w-full sm:w-auto px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <Key className="w-5 h-5" />
                    <span>Tôi có mã rồi</span>
                  </button>

                  <button
                    onClick={handleSendVerification}
                    disabled={isSendingVerification}
                    className="group relative w-full sm:w-auto px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-70 flex items-center justify-center gap-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    {isSendingVerification ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        <span>Gửi mã ngay</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Change Password Section */}
        <section className="bg-white rounded-[2rem] shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden transition-all hover:shadow-2xl hover:shadow-slate-200/50">
          <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-slate-900 rounded-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              Mật khẩu đăng nhập
            </h2>
          </div>
          <div className="p-8">
            <StatusBanner 
              type={passwordStatus?.type as any} 
              message={passwordStatus?.message || null} 
              onClose={() => setPasswordStatus(null)}
            />

            <form onSubmit={handleChangePassword} className="max-w-xl space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 md:col-span-2">
                  <label className="text-sm font-bold text-slate-700 tracking-wide uppercase opacity-70">Mật khẩu hiện tại</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 bg-slate-50/50 font-medium pr-14"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200/50 rounded-xl text-slate-400 transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 tracking-wide uppercase opacity-70">Mật khẩu mới</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 bg-slate-50/50 font-medium pr-14"
                      placeholder="Tối thiểu 8 ký tự"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200/50 rounded-xl text-slate-400 transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 tracking-wide uppercase opacity-70">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl border-2 border-slate-50 focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-slate-300 bg-slate-50/50 font-medium pr-14"
                      placeholder="Nhập lại mật khẩu"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-200/50 rounded-xl text-slate-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full md:w-auto px-10 py-5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all shadow-xl hover:shadow-slate-200 disabled:opacity-70 flex items-center justify-center gap-3"
                >
                  {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Cập nhật mật khẩu ngay'}
                </button>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
