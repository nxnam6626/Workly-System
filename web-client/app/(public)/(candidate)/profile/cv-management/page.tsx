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
} from 'lucide-react';
import { profileApi, type CandidateProfile } from '@/lib/profile-api';
import { useAuthStore } from '@/stores/auth';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useConfirm } from '@/components/ConfirmDialog';
import api from '@/lib/api';
import { CVReviewModal } from '@/components/candidates/CVReviewModal';

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

  // States cho Smart Upload Modal
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [cvTitle, setCvTitle] = useState('');
  const [cvId, setCvId] = useState<string | undefined>(undefined);

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
    const toastId = toast.loading('Đang bóc tách CV bằng AI...');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/candidates/cv/extract', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const { parsedData, fileUrl, cvTitle, cvId } = response.data;
      setExtractedData(parsedData || {});
      setFileUrl(fileUrl);
      setCvTitle(cvTitle);
      setCvId(cvId);

      // Mở modal xác nhận
      setIsReviewModalOpen(true);
      toast.success('Bóc tách thành công!', { id: toastId });
      
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xử lý CV.', { id: toastId });
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
    const toastId = toast.loading('Đang xử lý...');
    try {
      await profileApi.setMainCv(cvId);
      toast.success('Đã chọn CV này làm mặc định.', { id: toastId });
      fetchProfile(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi thay đổi.', { id: toastId });
    }
  };

  const cvs = profile?.candidate?.cvs || [];
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
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-6">
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <div className="w-8 h-8 border border-slate-200 rounded-lg flex items-center justify-center text-blue-600 shadow-sm">
                  <FileText className="w-4 h-4" />
                </div>
                CV của bạn
              </h1>
              <nav className="hidden md:flex items-center gap-5">
                <Link
                  href="/profile"
                  className="text-[13px] font-bold text-slate-400 hover:text-slate-700 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="h-4 w-px bg-slate-200" />
                <span className="text-[13px] font-black text-blue-600">Quản lý CV</span>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/profile"
                className="hidden sm:flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-[13px] hover:bg-slate-50 transition-all shadow-sm"
              >
                <LayoutDashboard className="w-4 h-4" /> Quay lại
              </Link>
            </div>
          </div>
        </div>
      </header>

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
                    className={`group bg-white border ${
                      cv.isMain ? 'border-blue-400 ring-2 ring-blue-50' : 'border-slate-200'
                    } rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-5 hover:shadow-lg hover:border-slate-300 transition-all`}
                  >
                    {/* Icon Hình Trực Quan */}
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                      <FileText className="w-8 h-8" />
                    </div>

                    {/* Chi tiết */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <Link 
                           href={cv.fileUrl} 
                           target="_blank" 
                           className="text-base sm:text-lg font-bold text-slate-800 hover:text-blue-600 transition-colors truncate"
                           title={cv.cvTitle}
                        >
                          {cv.cvTitle}
                        </Link>
                        {cv.isMain && (
                          <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 font-bold border border-blue-200 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                            <Star className="w-3 h-3 fill-blue-600" /> Mặc định
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-[13px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Tải lên thành công
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-slate-400" /> 
                          {new Date(cv.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
                      {!cv.isMain && (
                        <button
                          onClick={() => handleSetMainCv(cv.cvId)}
                          className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 hover:bg-slate-900 border border-slate-200 hover:text-white rounded-xl text-[12px] font-bold transition-all shadow-sm"
                        >
                          Dùng Profile
                        </button>
                      )}
                      
                      <Link
                        href={cv.fileUrl}
                        target="_blank"
                        className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm"
                        title="Xem tài liệu"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      
                      <button
                        onClick={() => handleDeleteCv(cv.cvId)}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all shadow-sm ${
                          cv.isMain
                            ? 'bg-red-50/50 text-red-300 border-red-100 hover:bg-red-50 hover:text-red-500'
                            : 'bg-white text-red-500 border-slate-200 hover:bg-red-50 hover:border-red-200'
                        }`}
                        title="Xoá tài liệu"
                      >
                        <Trash2 className="w-4 h-4" />
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
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-base font-bold text-slate-900 mb-4">Tải tài liệu mới</h3>
                
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
                    isDragActive
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
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 transition-colors ${
                      isDragActive ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isUploading ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                    ) : (
                      <CloudUpload className="w-6 h-6" />
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

              {/* Thông tin hỗ trợ */}
              <div className="bg-slate-900 rounded-3xl p-7 relative overflow-hidden shadow-xl shadow-slate-300 pointer-events-none">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 blur-[40px] rounded-full translate-x-10 -translate-y-10" />
                 <h4 className="text-white text-base font-bold mb-3 flex items-center gap-2 relative z-10">
                   <FileCheck className="w-5 h-5 text-emerald-400" /> Bí quyết gửi CV
                 </h4>
                 <ul className="space-y-3 relative z-10">
                   <li className="text-[12px] text-slate-300 font-medium flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                     Viết tiêu đề file đầy đủ, ví dụ: "CV_NguyenVanA_Frontend.pdf" thay vì "cv.pdf".
                   </li>
                   <li className="text-[12px] text-slate-300 font-medium flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                     Luôn nộp dưới định dạng PDF để giữ nguyên căn lề trên mọi thiết bị máy tính của nhà tuyển dụng.
                   </li>
                   <li className="text-[12px] text-slate-300 font-medium flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                     Để tối ưu, dung lượng file nên dưới 2MB.
                   </li>
                 </ul>
              </div>

            </div>
          </aside>
        </div>
      </main>

      <CVReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        initialData={extractedData}
        fileUrl={fileUrl}
        cvTitle={cvTitle}
        cvId={cvId}
        onSuccess={() => {
          setIsReviewModalOpen(false);
          fetchProfile(true); // Tải lại danh sách CV
          toast.success("Hồ sơ đã được cập nhật đồng bộ!");
        }}
      />
    </div>
  );
}
