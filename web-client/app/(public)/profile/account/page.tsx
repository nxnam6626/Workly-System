'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { 
  Shield, 
  Mail, 
  Lock, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Send, 
  Key, 
  Eye, 
  EyeOff, 
  User, 
  Globe, 
  Settings, 
  Zap, 
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Camera
} from 'lucide-react';
import { StatusBanner } from '@/components/ui/StatusBanner';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { profileApi } from '@/lib/profile-api';
import toast from 'react-hot-toast';

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, changePassword, updateUser } = useAuthStore();

  // Avatar state
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

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


  // Calculate Security Score
  const securityScore = useMemo(() => {
    let score = 70; // Base score (assuming email is verified by registration)
    if (user?.avatar) score += 10;
    score += 20; // Password/Social
    return Math.min(score, 100);
  }, [user]);

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


  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn tệp hình ảnh.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Dung lượng ảnh không được vượt quá 2MB.');
      return;
    }

    setIsUpdatingAvatar(true);
    const toastId = toast.loading('Đang cập nhật ảnh đại diện...');
    try {
      const { avatarUrl } = await profileApi.updateAvatar(file);
      
      // Update global auth store
      updateUser({ avatar: avatarUrl });
      
      toast.success('Cập nhật ảnh đại diện thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật ảnh.', { id: toastId });
    } finally {
      setIsUpdatingAvatar(false);
      e.target.value = '';
    }
  };

  if (!user) return null;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-6 py-12"
    >
      {/* Header V4.0 */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
             <Shield className="w-4 h-4 fill-blue-500" />
             <span className="text-[10px] font-black uppercase tracking-widest leading-none mt-0.5">Account Security</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight">Cài đặt tài khoản</h1>
          <p className="text-slate-500 font-medium max-w-xl text-lg leading-relaxed">
            Nơi quản lý toàn bộ bảo mật, thông tin đăng nhập và kết nối của bạn trên Workly.
          </p>
        </div>
        <div className="flex items-center gap-3">
           <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <Globe className="w-6 h-6 text-slate-400" />
           </div>
           <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
              <Settings className="w-6 h-6 text-slate-400" />
           </div>
        </div>
      </motion.div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-10">
        
        {/* Left Column: Security Score & Summary (3 units) */}
        <motion.div variants={itemVariants} className="lg:col-span-3 space-y-8">
           {/* Security Score Card */}
           <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white space-y-8 shadow-2xl shadow-slate-300 relative overflow-hidden">
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="space-y-2 relative z-10">
                 <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em]">Security Score</p>
                 <div className="flex items-end gap-2">
                    <span className="text-6xl font-black tracking-tighter">{securityScore}%</span>
                    <span className="text-sm font-bold text-slate-400 pb-2">/ 100</span>
                 </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-4 relative z-10">
                 <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${securityScore}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${securityScore > 70 ? 'bg-emerald-500' : securityScore > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                    />
                 </div>
                 <p className="text-sm text-slate-400 font-medium">
                    {securityScore === 100 
                      ? "Tài khoản cực kỳ an toàn! Bạn đã thực hiện đầy đủ các bước bảo mật."
                      : "Bạn có thể tăng thêm điểm bảo mật bằng cách xác minh email và đầy đủ thông tin."}
                 </p>
              </div>

              <div className="pt-4 border-t border-white/10 space-y-4 relative z-10">
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest">Email Status</span>
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                 </div>
                 <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase tracking-widest">Two-Factor</span>
                    <span className="px-2 py-0.5 bg-white/10 rounded-md text-[9px] font-black uppercase text-slate-300">Disabled</span>
                 </div>
              </div>
           </div>

           {/* User Quick Info */}
           <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                 <div className="relative group w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                    {user.avatar ? (
                      <Image src={user.avatar} alt={user.name || 'User'} width={64} height={64} className="object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-blue-500" />
                    )}

                    {/* Upload Overlay */}
                    <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer">
                      <Camera className="w-5 h-5 mb-0.5" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">Đổi ảnh</span>
                      <input 
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        disabled={isUpdatingAvatar}
                      />
                    </div>
                    
                    {/* Loading State */}
                    {isUpdatingAvatar && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-10">
                        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                      </div>
                    )}
                 </div>
                 <div className="space-y-0.5">
                    <h3 className="font-black text-slate-900 leading-tight">{user.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Candidate Member</p>
                 </div>
              </div>
              
              <div className="space-y-3">
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <Smartphone className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-slate-600">{user.phoneNumber || "Chưa cập nhật SĐT"}</span>
                 </div>
                 <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm font-bold text-slate-600">Dữ liệu được mã hóa AIS-256</span>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* Right Column: Detailed Controls (7 units) */}
        <motion.div variants={itemVariants} className="lg:col-span-7 space-y-10">
           
           {/* Section 1: Identity & Email */}
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden group">
              <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                 <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <Mail className="w-5 h-5 text-blue-600" />
                    Xác minh danh tính
                 </h2>
                 <AnimatePresence>
                    <div 
                      className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 font-black text-[10px] uppercase tracking-widest"
                    >
                       <CheckCircle className="w-3.5 h-3.5" />
                       Verified Account
                    </div>
                 </AnimatePresence>
              </div>
              <div className="p-8 space-y-8">

                 <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="space-y-2">
                       <span className="text-2xl font-black text-slate-800 tracking-tighter">{user.email}</span>
                       <p className="text-slate-500 font-medium leading-relaxed max-w-sm">
                          Địa chỉ này dùng để nhận thông báo quan trọng và khôi phục tài khoản khi cần thiết.
                       </p>
                    </div>


                 </div>
              </div>
           </div>

           {/* Section 2: Password Management */}
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-8 py-6 bg-slate-50/50 border-b border-slate-100">
                 <h2 className="text-xl font-black text-slate-800 flex items-center gap-3 uppercase tracking-tight">
                    <Lock className="w-5 h-5 text-slate-800" />
                    Thay đổi mật khẩu
                 </h2>
              </div>
              <div className="p-8">
                 <StatusBanner 
                   type={passwordStatus?.type as any} 
                   message={passwordStatus?.message || null} 
                   onClose={() => setPasswordStatus(null)}
                 />

                 <form onSubmit={handleChangePassword} className="space-y-8">
                    <div className="space-y-4">
                       <p className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Security Credentials</p>
                       
                       {/* Current Password */}
                       <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Mật khẩu hiện tại</label>
                          <div className="relative group">
                             <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                <Key className="w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                             </div>
                             <input
                               type={showCurrentPassword ? 'text' : 'password'}
                               required
                               value={currentPassword}
                               onChange={(e) => setCurrentPassword(e.target.value)}
                               className="w-full pl-14 pr-14 py-4.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                               placeholder="********"
                             />
                             <button
                               type="button"
                               onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                               className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"
                             >
                               {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                             </button>
                          </div>
                       </div>

                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* New Password */}
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Mật khẩu mới</label>
                             <div className="relative group">
                                <input
                                  type={showNewPassword ? 'text' : 'password'}
                                  required
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  className="w-full px-6 py-4.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                  placeholder="Mật khẩu 8+ ký tự"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowNewPassword(!showNewPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"
                                >
                                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                             </div>
                          </div>

                          {/* Confirm Password */}
                          <div className="space-y-2">
                             <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest pl-1">Xác nhận lại</label>
                             <div className="relative group">
                                <input
                                  type={showConfirmPassword ? 'text' : 'password'}
                                  required
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  className="w-full px-6 py-4.5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300"
                                  placeholder="Trùng khớp mật khẩu mới"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-all"
                                >
                                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between gap-6">
                       <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-[280px]">
                          Cần sử dụng mật khách ít nhất 8 ký tự, bao gồm cả chữ cái và chữ số để đảm bảo an toàn.
                       </p>
                       <button
                         type="submit"
                         disabled={isChangingPassword}
                         className="px-10 py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-200 disabled:opacity-70 flex items-center gap-3 shrink-0"
                       >
                         {isChangingPassword ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5" /> Cập nhật ngay</>}
                       </button>
                    </div>
                 </form>
              </div>
           </div>

           {/* Integrated Login Options (Feature Preview Context) */}
           <div className="px-8 py-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-blue-200 overflow-hidden relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-700" />
              <div className="space-y-2 relative z-10">
                 <h3 className="text-2xl font-black tracking-tight">Kích hoạt Xác thực 2 bước?</h3>
                 <p className="text-blue-100 text-sm font-medium leading-relaxed max-w-sm">
                    Tăng cường bảo mật cấp độ cao cho tài khoản của bạn bằng mã OTP qua điện thoại mỗi khi đăng nhập.
                 </p>
              </div>
              <button className="px-8 py-4 bg-white text-blue-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg relative z-10 flex items-center gap-2">
                 Tìm hiểu thêm <ChevronRight className="w-4 h-4" />
              </button>
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
