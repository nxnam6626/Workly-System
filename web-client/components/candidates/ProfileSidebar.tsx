'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { User, Wallet, LogOut, Settings, FileText, Briefcase, CalendarDays, History, Star, Shield, Heart, Eye, MailOpen, Sparkles, ClipboardCheck, Phone, Building2, Clock, Camera, Loader2, ChevronRight, MessageSquare } from 'lucide-react';
import { useAuthStore } from '@/stores/auth';
import ActivateJobSearchModal from '@/components/modals/ActivateJobSearchModal';
import { ConfirmModal } from '@/components/modals/ConfirmModal';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProfileSidebarProps {
  /** Trạng thái open-to-work — chỉ truyền vào khi đang ở trang /profile */
  isOpenToWork?: boolean;
  onToggleOpenToWork?: () => void;
}

export const ProfileSidebar = React.memo(function ProfileSidebar({
  isOpenToWork,
  onToggleOpenToWork,
}: ProfileSidebarProps) {
  const pathname = usePathname();
  const { user, logout, updateUser } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const displayName = user?.name || (user as any)?.candidate?.fullName || user?.email || 'Người dùng';
  const jobTitle = (user as any)?.candidate?.major || 'Ứng viên';
  const initial = displayName.charAt(0).toUpperCase();

  const [isConfirmTurnOnModalOpen, setIsConfirmTurnOnModalOpen] = useState(false);

  // Đọc trạng thái mở tìm việc: ưu tiên prop truyền vào, nếu không có thì đọc từ Auth Store
  const isLookingForJob = isOpenToWork !== undefined ? isOpenToWork : (user?.candidate?.isOpenToWork ?? true);

  const executeToggle = async (newValue: boolean) => {
    const toastId = (await import('react-hot-toast')).default.loading("Đang cập nhật trạng thái...");
    try {
      const { profileApi } = await import('@/lib/profile-api');
      const updated = await profileApi.updateProfile({
        fullName: displayName,
        isOpenToWork: newValue
      });
      updateUser({ candidate: updated.candidate });
      (await import('react-hot-toast')).default.success(newValue ? "Hồ sơ của bạn đã được hiển thị với Nhà tuyển dụng!" : "Đã tắt. Hồ sơ của bạn đang được ẩn khỏi kết quả tìm kiếm.", { id: toastId });
    } catch (error: any) {
      const message = error.response?.data?.message;
      if (message === 'JOB_SEARCH_EXPIRED') {
         (await import('react-hot-toast')).default.dismiss(toastId);
         setIsActivationModalOpen(true);
      } else {
         (await import('react-hot-toast')).default.error("Lỗi cập nhật trạng thái.", { id: toastId });
      }
    }
  };

  const handleToggle = async () => {
    if (onToggleOpenToWork) {
      onToggleOpenToWork();
      return;
    }
    if (!user?.candidate) return;
    const newValue = !isLookingForJob;
    
    if (newValue === false) {
       // Trigger Beautiful Modal instead of native window.confirm
       setIsConfirmModalOpen(true);
       return;
    }
    
    // Check if turning ON and has an accepted job
    if (newValue === true) {
      const toastId = (await import('react-hot-toast')).default.loading("Đang kiểm tra trạng thái...");
      try {
        const { default: api } = await import('@/lib/api');
        const res = await api.get('/applications/me');
        (await import('react-hot-toast')).default.dismiss(toastId);
        
        const hasAccepted = res.data?.some((app: any) => app.appStatus === 'ACCEPTED');
        if (hasAccepted) {
          setIsConfirmTurnOnModalOpen(true);
          return;
        }
      } catch (err) {
        (await import('react-hot-toast')).default.dismiss(toastId);
      }
    }
    
    // If turning ON and no accepted jobs, directly execute
    executeToggle(newValue);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdatingAvatar(true);
    const toastId = (await import('react-hot-toast')).default.loading("Đang tải ảnh đại diện mới...");
    try {
      const { profileApi } = await import('@/lib/profile-api');
      const { avatarUrl } = await profileApi.updateAvatar(file);
      updateUser({ avatar: avatarUrl });
      (await import('react-hot-toast')).default.success("Cập nhật ảnh đại diện thành công!", { id: toastId });
    } catch (error) {
      console.error(error);
      (await import('react-hot-toast')).default.error("Lỗi khi tải ảnh đại diện lên.", { id: toastId });
    } finally {
      setIsUpdatingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const menuItems = [
    {
      icon: User,
      label: 'Thông tin cá nhân',
      href: '/profile',
      isActive: pathname === '/profile',
      accent: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Wallet,
      label: 'Ví của tôi',
      href: '/profile/wallet',
      isActive: pathname === '/profile/wallet',
      accent: 'text-violet-600 bg-violet-50',
    },
    {
      icon: ClipboardCheck,
      label: 'Việc làm ứng tuyển',
      href: '/profile/jobs/applied',
      isActive: pathname === '/profile/jobs/applied',
      accent: 'text-amber-600 bg-amber-50',
    },
    {
      icon: Heart,
      label: 'Việc làm đã lưu',
      href: '/profile/jobs/saved',
      isActive: pathname === '/profile/jobs/saved',
      accent: 'text-rose-500 bg-rose-50',
    },
    {
      icon: Eye,
      label: 'Việc làm đã xem',
      href: '/profile/jobs/viewed',
      isActive: pathname === '/profile/jobs/viewed',
      accent: 'text-slate-500 bg-slate-50',
    },
    {
      icon: Sparkles,
      label: 'Việc làm phù hợp',
      href: '/profile/jobs/matching',
      isActive: pathname === '/profile/jobs/matching',
      badge: 'AI',
      accent: 'text-indigo-600 bg-indigo-50',
    },
    {
      icon: MailOpen,
      label: 'Lời mời tuyển dụng',
      href: '/profile/jobs/invitations',
      isActive: pathname === '/profile/jobs/invitations',
      accent: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: CalendarDays,
      label: 'Lịch phỏng vấn',
      href: '/profile/jobs/interviews',
      isActive: pathname === '/profile/jobs/interviews',
      accent: 'text-orange-600 bg-orange-50',
    },
    {
      icon: MessageSquare,
      label: 'Nhắn tin nhà tuyển dụng',
      href: '/profile/messages',
      isActive: pathname === '/profile/messages',
      accent: 'text-cyan-600 bg-cyan-50',
    },
  ];

  return (
    <aside className="w-full space-y-4">
      {/* Profile Card */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-5 flex flex-col items-center text-center overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-[0.04]" />

        {/* Avatar */}
        <div
          onClick={() => !isUpdatingAvatar && fileInputRef.current?.click()}
          className="relative w-20 h-20 mb-3 mt-1 group cursor-pointer"
          title="Thay đổi ảnh đại diện"
        >
          <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center border border-slate-100 overflow-hidden relative shadow-sm transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-md">
            {user?.avatar ? (
              <Image
                src={user.avatar}
                alt={displayName}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <span className="text-2xl font-bold text-slate-400 transition-transform duration-300 group-hover:scale-105">{initial}</span>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[1px]">
              {isUpdatingAvatar ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white transition-transform duration-300 group-hover:scale-110" />
              )}
            </div>
          </div>

          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center z-10">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleAvatarChange}
            className="hidden"
            accept="image/*"
            disabled={isUpdatingAvatar}
          />
        </div>

        <h3 className="font-bold text-slate-900 text-base leading-tight truncate w-full px-2">{displayName}</h3>
        <p className="text-blue-600 text-xs font-semibold mt-1 px-3 py-0.5 bg-blue-50 rounded-full truncate max-w-full">{jobTitle}</p>

        {/* Open-to-work toggle — Hiển thị trên tất cả các trang */}
        <div className="mt-4 w-full p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold text-slate-700">Sẵn sàng tìm việc</span>
            <button
              onClick={handleToggle}
              className={`w-11 h-6 rounded-full transition-all relative flex items-center shadow-inner ${isLookingForJob ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <motion.div
                animate={{ x: isLookingForJob ? 22 : 3 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="w-4 h-4 rounded-full bg-white shadow-md absolute"
              />
            </button>
          </div>
          
          {isLookingForJob && (user as any)?.candidate?.jobSearchExpiresAt && (() => {
             const diff = new Date((user as any).candidate.jobSearchExpiresAt).getTime() - new Date().getTime();
             const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
             if (days <= 0) return null;
             
             return (
               <div className="mt-2 px-2 py-1 bg-emerald-100/50 text-emerald-700 rounded-lg text-[9px] font-bold inline-flex items-center gap-1">
                 <Sparkles size={10} /> Còn {days} ngày kích hoạt
               </div>
             );
          })()}
        </div>
      </div>

      <ActivateJobSearchModal 
        isOpen={isActivationModalOpen} 
        onClose={() => setIsActivationModalOpen(false)} 
        onSuccess={async () => {
          // Fetch fresh user data to update the context and show the toggle turned ON automatically
          const { profileApi } = await import('@/lib/profile-api');
          const data = await profileApi.getMe();
          updateUser({ candidate: data.candidate });
        }}
      />

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={() => executeToggle(false)}
        title="Tạm dừng hiển thị hồ sơ?"
        message="Lưu ý: Thời gian 30 ngày ưu tiên (nếu đang có) vẫn tiếp tục được tính ngay cả khi bạn ẩn hồ sơ. Bạn vẫn muốn thực hiện?"
        confirmLabel="Đồng ý ẩn"
        cancelLabel="Hủy bỏ"
        type="warning"
      />

      <ConfirmModal
        isOpen={isConfirmTurnOnModalOpen}
        onClose={() => setIsConfirmTurnOnModalOpen(false)}
        onConfirm={() => executeToggle(true)}
        title="Bật trạng thái tìm việc?"
        message="Bạn đã được nhận vào một công việc rồi. Bạn có chắc chắn muốn bật lại trạng thái sẵn sàng tìm việc không?"
        confirmLabel="Vẫn bật"
        cancelLabel="Hủy bỏ"
        type="info"
      />

      {/* Navigation Menu */}
      <nav className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-3 space-y-1">
        {menuItems.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04, duration: 0.22 }}>
              <Link
                href={item.href}
                className={cn(
                  'group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200',
                  item.isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'flex-shrink-0 w-7 h-7 rounded-xl flex items-center justify-center transition-all',
                    item.isActive ? 'bg-white/10' : item.accent
                  )}>
                    <Icon className={cn('w-4 h-4', item.isActive ? 'text-white' : '')} />
                  </div>
                  <span className="text-[13px] font-semibold truncate">{item.label}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.badge && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded-md text-[9px] font-black tracking-wide',
                      item.isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                    )}>
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={cn(
                    'w-3.5 h-3.5 transition-transform duration-200',
                    item.isActive ? 'text-white/60 translate-x-0.5' : 'text-slate-300 group-hover:translate-x-0.5'
                  )} />
                </div>
              </Link>
            </motion.div>
          );
        })}

        <div className="pt-2 mt-2 border-t border-slate-50">
          <button
            onClick={() => logout()}
            className="w-full group flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-200"
          >
            <div className="w-7 h-7 rounded-xl bg-slate-50 group-hover:bg-red-50 flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
            </div>
            <span className="text-[13px] font-semibold">Đăng xuất</span>
          </button>
        </div>
      </nav>

    </aside>
  );
});
