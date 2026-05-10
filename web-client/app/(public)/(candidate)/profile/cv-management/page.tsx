'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Upload,
  Loader2,
  Trash2,
  CheckCircle2,
  LayoutDashboard,
  ExternalLink,
  Clock,
  MoreVertical,
  ArrowRight,
  Eye,
  FileSearch,
  Star,
  CloudUpload,
  FileCheck,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { profileApi, type CandidateProfile } from '@/lib/profile-api';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import api from '@/lib/api';

export default function CvManagementPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Stats cho Upload
  const [isUploading, setIsUploading] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // Tinh năng đổi tên
  const [editingCvId, setEditingCvId] = useState<string | null>(null);
  const [tempCvTitle, setTempCvTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/profile/cv-management');
      return;
    }
    if (isAuthenticated) {
      fetchProfile();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchProfile = async (silent = false) => {
    if (!silent) setLoadingProfile(true);
    try {
      const data = await profileApi.getMe();
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile', err);
      toast.error('Không thể tải thông tin hồ sơ.');
    } finally {
      if (!silent) setLoadingProfile(false);
    }
  };

  const uploadFile = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast.error('Vui lòng chọn định dạng PDF.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Dung lượng tệp không vượt quá 5MB.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Đang tải tài liệu lên hệ thống...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post('/candidates/cv/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Đã thêm CV thành công! Giờ đây bạn có thể chọn đồng bộ dữ liệu từ danh sách.', { id: toastId, duration: 4000 });
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchProfile(true); // Reload list instantly
    } catch (error: any) {
      toast.dismiss(toastId);
      const errorData = error.response?.data;
      const msgText = typeof errorData?.message === 'string' ? errorData.message : (errorData?.message?.message || 'Lỗi hệ thống khi xử lý tệp.');

      // Super premium modal for duplicate notification in DEAD CENTER
      if (errorData?.errorCode === 'DUPLICATE_CV' || errorData?.message?.errorCode === 'DUPLICATE_CV') {
         confirm({
           title: 'Tài liệu này đã tồn tại',
           message: 'Bạn vừa tải lên một tệp hoàn toàn trùng khớp với CV hiện có trong hệ thống. Vui lòng không tải trùng lặp nhiều lần.',
           variant: 'warning',
           confirmText: 'Đã hiểu',
           hideCancel: true
         });
      } else {
        toast.error(msgText);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDeleteCv = async (cvId: string) => {
    const cvToDelete = profile?.candidate?.cvs?.find((c) => c.cvId === cvId);

    const ok = await confirm({
      title: 'Xóa tài liệu',
      message: 'Bạn có chắc chắn muốn xóa CV này? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa',
      variant: 'danger',
    });
    if (!ok) return;

    const toastId = toast.loading('Đang xóa...');
    try {
      await profileApi.deleteCv(cvId);
      toast.success('Đã xóa thành công.', { id: toastId });
      fetchProfile(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa tài liệu.', { id: toastId });
    }
  };

  const handleSetMainCv = async (cvId: string) => {
    const tid = toast.loading(
      <div className="flex flex-col items-start gap-1 py-1 px-2">
        <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" /> Đang gửi dữ liệu tới AI...
        </span>
        <span className="text-[12px] text-slate-500 font-medium">Hệ thống đang phân tích chuyên sâu hồ sơ của bạn (thường mất 5-10s). Vui lòng chờ.</span>
      </div>,
      { duration: 20000 }
    );
    
    try {
      // Bước 1: Phân tích và bóc tách AI thực tế
      await api.post(`/candidates/cv/${cvId}/analyze`);
      
      toast.success('Bóc tách thành công!', { id: tid });
      
      // Bước 2: Sau khi có kết quả AI trong Database -> Chuyển tới bước Verify
      router.push(`/profile/cv-review/${cvId}`);
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Không thể khởi chạy công cụ phân tích AI.';
      toast.error(errMsg, { id: tid, duration: 4000 });
    }
  };

  const startRename = (cvId: string, currentTitle: string) => {
    setEditingCvId(cvId);
    setTempCvTitle(currentTitle);
  };

  const handleRenameCv = async () => {
    if (!editingCvId || !tempCvTitle.trim()) {
      setEditingCvId(null);
      return;
    }
    setIsRenaming(true);
    try {
      await profileApi.updateCv(editingCvId, { cvTitle: tempCvTitle.trim() });
      toast.success('Đã cập nhật tên tài liệu.');
      setEditingCvId(null);
      fetchProfile(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không thể đổi tên tài liệu.');
    } finally {
      setIsRenaming(false);
    }
  };

  const cvs = [...(profile?.candidate?.cvs || [])].sort((a, b) => {
    // Ưu tiên CV mặc định lên hàng đầu
    if (a.isMain && !b.isMain) return -1;
    if (!a.isMain && b.isMain) return 1;
    // Nếu cả 2 cùng loại, cái mới hơn xếp trước
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  const mainCv = cvs.find((cv) => cv.isMain);

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">
            Đang tải dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-900 pb-20">
      <main className="max-w-6xl mx-auto px-4 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* CỘT TRÁI - DANH SÁCH CV */}
          <section className="lg:col-span-8 flex flex-col gap-6 animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Danh sách ấn bản CV</h2>
                <p className="text-sm text-slate-500 mt-1 font-medium">Bạn hiện đang lưu trữ {cvs.length} tài liệu trên hệ thống.</p>
              </div>
            </div>

            {/* List */}
            {cvs.length > 0 ? (
              <div className="space-y-4">
                {cvs.map((cv) => (
                  <motion.div
                    key={cv.cvId}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`group bg-white border ${cv.isMain ? 'border-blue-300 ring-2 ring-blue-50/50' : 'border-slate-200'
                      } rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all`}
                  >
                    {/* Icon Hình Trực Quan - Gọn hơn */}
                    <div className={`w-12 h-12 rounded-xl ${cv.isMain ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-400'} border border-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                      <FileText className="w-6 h-6" />
                    </div>

                    {/* Chi tiết */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        {editingCvId === cv.cvId ? (
                          <div className="flex items-center gap-1.5 w-full sm:w-auto flex-1">
                            <input
                              type="text"
                              value={tempCvTitle}
                              onChange={(e) => setTempCvTitle(e.target.value)}
                              className="flex-1 px-2 py-1 bg-slate-50 border border-blue-400 rounded-md text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 ring-blue-100"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameCv();
                                if (e.key === 'Escape') setEditingCvId(null);
                              }}
                              disabled={isRenaming}
                            />
                            <button
                              onClick={handleRenameCv}
                              disabled={isRenaming}
                              className="p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              {isRenaming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => setEditingCvId(null)}
                              disabled={isRenaming}
                              className="p-1.5 bg-slate-100 text-slate-500 rounded-md hover:bg-slate-200 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 group/title min-w-0 max-w-full">
                            <Link
                              href={cv.fileUrl}
                              target="_blank"
                              className="text-sm sm:text-[15px] font-bold text-slate-800 hover:text-blue-600 transition-colors truncate"
                              title={cv.cvTitle}
                            >
                              {cv.cvTitle}
                            </Link>
                            <button
                              onClick={() => startRename(cv.cvId, cv.cvTitle)}
                              className="opacity-0 group-hover/title:opacity-100 p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                              title="Đổi tên"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        
                        {cv.isMain && (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-black border border-blue-100 rounded-full text-[9px] uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <Star className="w-2.5 h-2.5 fill-blue-600" /> Mặc định
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[12px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Tải lên thành công
                        </span>
                        <span className="text-slate-300 shrink-0">•</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {new Date(cv.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 mt-3 sm:mt-0 shrink-0">
                      {!cv.isMain ? (
                        <button
                          onClick={() => handleSetMainCv(cv.cvId)}
                          className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-blue-200 text-blue-600 rounded-xl text-[12px] font-semibold transition-all shadow-sm active:scale-95"
                          title="Đặt CV này làm mặc định"
                        >
                          Đặt làm chính
                        </button>
                      ) : (
                         <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[11px] font-bold flex items-center gap-1">
                            <FileCheck className="w-3 h-3" /> Đang dùng
                         </div>
                      )}

                      <Link
                        href={cv.fileUrl}
                        target="_blank"
                        className="w-8 h-8 flex items-center justify-center bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                        title="Xem tài liệu"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        onClick={() => handleDeleteCv(cv.cvId)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-all shadow-sm ${cv.isMain
                          ? 'bg-red-50/30 text-red-300 border-red-50 cursor-not-allowed opacity-50'
                          : 'bg-white text-red-500 border-slate-200 hover:bg-red-50 hover:border-red-200'
                          }`}
                        title="Xoá tài liệu"
                        disabled={cv.isMain}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-16 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 mb-5">
                  <FileSearch className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">Trống trơn</h3>
                <p className="text-slate-500 text-[13px] font-medium max-w-sm">
                  Bạn chưa có tài liệu nào trong danh sách. Hãy nhấn "Tải lên tài liệu mới" bên phải để bắt đầu hồ sơ xin việc nhé!
                </p>
              </div>
            )}
          </section>

          {/* CỘT PHẢI - UPLOAD BOX */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="sticky top-24 space-y-6 animate-in slide-in-from-right-4 duration-500">

              {/* Box Kéo thả upload */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  Tải tài liệu mới
                </h3>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all ${isDragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".pdf"
                  />
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors ${isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-400'
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    ) : (
                      <CloudUpload className="w-5 h-5" />
                    )}
                  </div>

                  {isUploading ? (
                    <div>
                      <p className="text-[13px] font-bold text-slate-800">Đang thực thi tải lên...</p>
                      <p className="text-[11px] text-slate-400 mt-1">Vui lòng chờ giây lát</p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-[13px] font-bold text-slate-700">
                        Kéo thả file vào đây hoặc <button onClick={() => fileInputRef.current?.click()} className="text-blue-600 hover:underline">Chọn file</button>
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1.5 font-medium">Chứng chỉ định dạng: PDF (Tối đa 5MB)</p>
                    </div>
                  )}
                </div>
              </div>



            </div>
          </aside>
        </div>
      </main>


    </div>
  );
}
