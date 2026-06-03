'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock, Save, Camera, CheckCircle2, ShieldCheck, Mail, Building, Upload, Eye, EyeOff } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth';

export default function RecruiterSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Profile State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phoneNumber: '',
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.recruiter?.fullName || user.name || '',
        phoneNumber: user.phoneNumber || '',
      });
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);

  // Handle Avatar Change
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file hình ảnh hợp lệ.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append('file', file);

    const toastId = toast.loading('Đang tải ảnh lên...');
    try {
      const { data } = await api.patch('/users/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      updateUser({ avatar: data.avatarUrl });
      toast.success('Cập nhật ảnh đại diện thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi khi tải ảnh lên.', { id: toastId });
      setAvatarPreview(user?.avatar || null); // revert
    }
  };

  // Handle Profile Submit
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const toastId = toast.loading('Đang cập nhật thông tin...');
    try {
      await api.patch('/recruiters/me/profile', profileForm);
      // Update local state
      updateUser({ 
        name: profileForm.fullName,
        phoneNumber: profileForm.phoneNumber,
        recruiter: {
          ...user?.recruiter,
          fullName: profileForm.fullName
        }
      });
      toast.success('Cập nhật thông tin thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại.', { id: toastId });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle Password Submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }
    
    setIsChangingPassword(true);
    const toastId = toast.loading('Đang đổi mật khẩu...');
    try {
      await api.patch('/auth/change-password', {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Đổi mật khẩu thành công!', { id: toastId });
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đổi mật khẩu thất bại.', { id: toastId });
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cài đặt tài khoản</h1>
          <p className="text-slate-500 text-sm">Quản lý thông tin cá nhân và bảo mật tài khoản của bạn</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        {/* Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'profile'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <User className="w-5 h-5" />
            Hồ sơ cá nhân
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'security'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                : 'text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            <ShieldCheck className="w-5 h-5" />
            Bảo mật
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Thông tin chung</h2>
                  
                  {/* Avatar Upload */}
                  <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-100 mb-8">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-indigo-100 flex items-center justify-center">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl font-bold text-indigo-400">
                            {profileForm.fullName.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-md transition-colors border-2 border-white"
                        title="Đổi ảnh đại diện"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/png, image/jpeg, image/jpg"
                        onChange={handleAvatarChange}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">Ảnh đại diện</h3>
                      <p className="text-sm text-slate-500 mt-1">Định dạng PNG, JPG. Kích thước tối đa 10MB.</p>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-3 text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Upload className="w-4 h-4" />
                        Tải ảnh lên
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 block">Tên hiển thị</label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={profileForm.fullName}
                            onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                            placeholder="Nhập tên hiển thị"
                          />
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700 block">Số điện thoại</label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={profileForm.phoneNumber}
                            onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                            placeholder="0912345678"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-slate-700 block">Email đăng nhập</label>
                        <div className="relative">
                          <input
                            type="email"
                            value={user?.email || ''}
                            disabled
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 cursor-not-allowed"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        </div>
                        <p className="text-xs text-slate-400">Email không thể thay đổi. Vui lòng liên hệ hỗ trợ nếu cần.</p>
                      </div>
                    </div>
                    
                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSavingProfile}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isSavingProfile ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {activeTab === 'security' && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-6">Đổi mật khẩu</h2>
                  
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-800 leading-relaxed">
                      Đảm bảo tài khoản của bạn đang sử dụng một mật khẩu dài, ngẫu nhiên để giữ an toàn. Nên bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                    </p>
                  </div>

                  <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 block">Mật khẩu hiện tại</label>
                      <div className="relative">
                        <input
                          type={showOldPassword ? "text" : "password"}
                          required
                          value={passwordForm.oldPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                          className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                          placeholder="••••••••"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <button
                          type="button"
                          onClick={() => setShowOldPassword(!showOldPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 block">Mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all"
                          placeholder="••••••••"
                        />
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 block">Xác nhận mật khẩu mới</label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          required
                          minLength={6}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className={`w-full pl-10 pr-12 py-2.5 rounded-xl outline-none transition-all ${
                            passwordForm.confirmPassword
                              ? passwordForm.newPassword === passwordForm.confirmPassword
                                ? 'bg-emerald-50/30 border border-emerald-200 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100'
                                : 'bg-red-50/30 border border-red-200 focus:border-red-400 focus:ring-2 focus:ring-red-100 text-red-600'
                              : 'bg-slate-50 border border-slate-200 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                          }`}
                          placeholder="••••••••"
                        />
                        <CheckCircle2 className={`w-4 h-4 absolute left-3.5 top-3.5 transition-colors ${
                          passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword 
                            ? 'text-emerald-500' 
                            : passwordForm.confirmPassword 
                              ? 'text-red-400'
                              : 'text-slate-400'
                        }`} />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {passwordForm.confirmPassword && passwordForm.confirmPassword !== passwordForm.newPassword && (
                        <p className="text-xs text-red-500 mt-1 font-medium pl-1">
                          Mật khẩu xác nhận chưa khớp.
                        </p>
                      )}
                      {passwordForm.confirmPassword && passwordForm.confirmPassword === passwordForm.newPassword && (
                        <p className="text-xs text-emerald-600 mt-1 font-medium pl-1">
                          Mật khẩu xác nhận hợp lệ.
                        </p>
                      )}
                    </div>
                    
                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={isChangingPassword}
                        className="flex w-full justify-center items-center gap-2 px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-md shadow-slate-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {isChangingPassword ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Lock className="w-4 h-4" />}
                        Cập nhật mật khẩu
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
