"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Briefcase,
  Bookmark,
  Settings,
  HelpCircle,
  MapPin,
  ChevronRight,
  BrainCircuit,
  Bot,
  TrendingUp,
  BellIcon,
  User2Icon,
  PlusCircle,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Edit,
  MoreHorizontal,
  CircleDot,
  Trash2,
  Camera,
} from "lucide-react";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";
import { useAuthStore } from "@/stores/auth";
import { JobCard, type Job } from "@/components/JobCard";
import { CVReviewModal } from "@/components/candidates/CVReviewModal";
import toast from "react-hot-toast";
import api from "@/lib/api";

export default function ProfileDashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, updateUser } = useAuthStore();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isOpenToWork, setIsOpenToWork] = useState(true);
  const [matchingJobs, setMatchingJobs] = useState<any[]>([]);
  const [loadingMatching, setLoadingMatching] = useState(false);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // Auth guard and fetch profile
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      fetchProfile();
      fetchMatchingJobs();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchProfile = async (silent = false) => {
    if (!silent) setLoadingProfile(true);
    try {
      const data = await profileApi.getMe();
      setProfile(data);
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      if (!silent) setLoadingProfile(false);
    }
  };

  const fetchMatchingJobs = async () => {
    setLoadingMatching(true);
    try {
      const res = await api.get("/job-postings/matching");
      setMatchingJobs(res.data.slice(0, 4)); // Only top 4 for dashboard
    } catch (err) {
      console.error("Failed to load matching jobs", err);
    } finally {
      setLoadingMatching(false);
    }
  };

  // State cho Smart Upload
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [cvTitle, setCvTitle] = useState("");
  const [cvId, setCvId] = useState<string | undefined>(undefined); // ID của bản ghi vừa tạo

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Đang bóc tách CV bằng AI...");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await api.post("/candidates/cv/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Backend quy trình mới trả về object CV đầy đủ
      const { parsedData, fileUrl, cvTitle, cvId } = response.data;
      setExtractedData(parsedData || {});
      setFileUrl(fileUrl);
      setCvTitle(cvTitle);
      setCvId(cvId);

      // Cập nhật danh sách dưới nền ngay lập tức
      fetchProfile(true);

      setIsReviewModalOpen(true);
      toast.success("Bóc tách thành công!", { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tải CV.", { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteCv = async (cvId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa CV này?")) return;

    const toastId = toast.loading("Đang xóa CV...");
    try {
      await profileApi.deleteCv(cvId);
      toast.success("Đã xóa CV thành công", { id: toastId });
      fetchProfile(true); // Silent refresh
    } catch (error) {
      toast.error("Lỗi khi xóa CV", { id: toastId });
    }
  };

  const handleSetMainCv = async (cvId: string) => {
    const toastId = toast.loading("Đang thiết lập CV mặc định...");
    try {
      await profileApi.setMainCv(cvId);
      toast.success("Đã cập nhật CV mặc định", { id: toastId });
      fetchProfile(true); // Silent refresh
    } catch (error) {
      toast.error("Lỗi khi cập nhật CV mặc định", { id: toastId });
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
      
      // Update global auth store for consistency across app
      updateUser({ avatar: avatarUrl });
      
      // Update local state for immediate feedback
      if (profile) {
        setProfile({
          ...profile,
          avatar: avatarUrl
        });
      }
      
      toast.success('Cập nhật ảnh đại diện thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật ảnh.', { id: toastId });
    } finally {
      setIsUpdatingAvatar(false);
      // Reset input value to allow selecting same file again
      e.target.value = '';
    }
  };

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const fullName = profile?.candidate?.fullName || user?.name || "Người dùng";
  const jobTitle = profile?.candidate?.major || "Sinh viên Kỹ thuật Phần mềm";
  const location = "TP. Hồ Chí Minh, Việt Nam"; // Mock as per design
  const avatarLetter = fullName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-sans">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* =======================
            CỘT TRÁI (LEFT SIDEBAR)
            ======================= */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Circular Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
            {/* Circular Progress Avatar */}
            <div className="relative w-32 h-32 mb-4 group">
              {/* Outer stroke (complete circular border) */}
              <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="transparent" stroke="#2563EB" strokeWidth="6" />
              </svg>

              {/* Inner Avatar */}
              <div className="absolute inset-2 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white pointer-events-none">
                {profile?.avatar ? (
                  <Image src={profile.avatar} alt={fullName} fill className="object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-slate-400">{avatarLetter}</span>
                )}
                
                {/* Upload Overlay */}
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white pointer-events-auto cursor-pointer">
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Đổi ảnh</span>
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
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
            <p className="text-slate-500 text-sm mt-1">{jobTitle}</p>

            {/* Toggle Open to Work */}
            <div className="mt-6 flex items-center justify-between w-full font-medium text-slate-700 bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              <span className="text-sm">Sẵn sàng làm việc</span>
              <button
                onClick={() => setIsOpenToWork(!isOpenToWork)}
                className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${isOpenToWork ? "bg-orange-500" : "bg-slate-300"
                  }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm absolute transition-transform ${isOpenToWork ? "translate-x-5" : "translate-x-1"
                    }`}
                />
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-2 mt-5 w-full">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-600 text-white text-[13px] font-semibold rounded-xl hover:bg-blue-700 transition shadow-sm">
                <Edit className="w-3.5 h-3.5" /> Cập nhật hồ sơ
              </button>

            </div>
          </div>

          {/* Quick Links Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">Liên kết nhanh</h3>
            </div>
            <div className="p-2">

              <Link href="/profile/jobs/applied" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 hover:text-blue-600">
                <Briefcase className="w-5 h-5" />
                <span className="text-sm font-medium">Việc làm đã ứng tuyển</span>
              </Link>

              <Link href="/profile/jobs/saved" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 hover:text-blue-600">
                <Bookmark className="w-5 h-5" />
                <span className="text-sm font-medium">Việc làm đã lưu</span>
              </Link>


              <Link href="/profile/account" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 hover:text-blue-600">
                <User2Icon className="w-5 h-5" />
                <span className="text-sm font-medium">Quản lý tài khoản</span>
              </Link>


              <Link href="/profile/notifications" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 hover:text-blue-600">
                <BellIcon className="w-5 h-5" />
                <span className="text-sm font-medium">Thông báo việc làm</span>
              </Link>

              <Link href="/profile/settings" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 hover:text-blue-600">
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Cài đặt gợi ý việc làm</span>

              </Link>
            </div>
          </div>
        </div>

        {/* =======================
            CỘT GIỮA (MAIN CONTENT)
            ======================= */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          {/* Profile Details Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-8 py-4">
            <h1 className="text-[20px] font-bold text-slate-900 mb-4">Thông tin chung</h1>


            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-[15px]">
              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">Email:</span>
                <span className="text-slate-600 flex-1 truncate">{profile?.email || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">Số điện thoại:</span>
                <span className="text-slate-600 flex-1">{profile?.phoneNumber || "Chưa cập nhật"}</span>
              </div>

              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">Trường học:</span>
                <span className="text-slate-600 flex-1">{profile?.candidate?.university || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">Chuyên ngành:</span>
                <span className="text-slate-600 flex-1">{profile?.candidate?.major || "Chưa cập nhật"}</span>
              </div>

              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">GPA:</span>
                <span className="text-slate-600 flex-1">{profile?.candidate?.gpa ? `${profile.candidate.gpa}/4.0` : "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">Ngày tham gia:</span>
                <span className="text-slate-900 font-medium flex-1">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('vi-VN') : "Chưa rõ"}
                </span>
              </div>
            </div>
          </div>

          {/* CVs & Resumes */}
          <div id="cv-list" className="bg-white rounded-2xl shadow-sm border border-slate-100 py-4 w-full overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-6 border-b border-slate-50 pb-3">
              <h3 className="text-[18px] font-bold text-slate-900">Danh sách CV của bạn</h3>
              <Link
                href="/profile/cv-management"
                className="text-[13px] font-bold text-blue-600 hover:text-blue-700 hover:underline bg-blue-50/50 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                Xem tất cả
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Scrollable horizontal list */}
            {profile?.candidate?.cvs && profile.candidate.cvs.length > 0 && (
              <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar px-6 mb-2 border-b border-slate-50">
                {profile.candidate.cvs.map((cv, idx) => (
                  <div key={cv.cvId} className="min-w-[240px] bg-white border border-slate-200 rounded-2xl p-4 snap-start shrink-0 flex flex-col gap-3 hover:border-blue-300 transition-colors shadow-sm">
                    <div className="flex gap-3">
                      <div className="w-12 h-16 bg-blue-50 rounded-md border border-blue-100 flex items-center justify-center text-xl">
                        <FileText className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-slate-900 text-sm truncate">{cv.cvTitle}</h4>
                        <p className="text-slate-500 text-[10px] mt-0.5">
                          {cv.isMain && (
                            <span className="bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase mr-1">Mặc định</span>
                          )}
                          {new Date(cv.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={cv.fileUrl}
                        target="_blank"
                        className="flex-1 bg-slate-900 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-slate-800 transition text-center"
                      >
                        Xem
                      </Link>
                      {!cv.isMain && (
                        <button
                          onClick={() => handleSetMainCv(cv.cvId)}
                          className="px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition"
                        >
                          Mặc định
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteCv(cv.cvId)}
                        className="px-2 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Nút Upload CV mới - Làm nổi bật */}
            <div className="px-6 pb-2">
              <input
                type="file"
                id="cv-upload-profile"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <label
                htmlFor="cv-upload-profile"
                className={`group cursor-pointer w-full bg-slate-50 hover:bg-blue-50 border-2 border-dashed border-slate-200 hover:border-blue-300 text-slate-500 hover:text-blue-600 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${
                  profile?.candidate?.cvs && profile.candidate.cvs.length > 0 ? 'py-4' : 'py-10'
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center gap-2 font-bold text-blue-600">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý bằng AI...
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 bg-white shadow-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5 text-blue-500" />
                    </div>
                    <span className="font-semibold text-[14px]">Tải lên CV mới</span>
                    <span className="text-[11px] text-slate-400">Hỗ trợ định dạng PDF, DOCX (Tối đa 5MB)</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Education & Skills Split */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Education */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Học vấn</h3>
              <div className="space-y-4 flex-1">
                <div className="relative pl-6">
                  <CircleDot className="absolute left-[-2px] top-1 w-3.5 h-3.5 text-blue-500" />
                  <h4 className="font-semibold text-slate-800 text-sm">{profile?.candidate?.major || "Cử nhân khoa học máy tính"}</h4>
                  <p className="text-slate-600 text-[13px] mt-1">{profile?.candidate?.university || "Đại học Khoa học Tự nhiên, ĐHQG-HCM"}</p>
                  <p className="text-slate-500 text-[13px] mt-0.5">{profile?.candidate?.gpa ? `GPA: ${profile?.candidate?.gpa}/4.0` : "Dự kiến tốt nghiệp 2025"}</p>
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-900 mb-4 border-b border-slate-100 pb-3">Kỹ năng</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {(profile?.candidate?.skills?.length ? profile.candidate.skills.map(s => s.skillName) : ["ReactJS", "Node.js", "TypeScript", "PostgreSQL", "REST APIs", "AWS", "Git"]).map((skill, idx) => (
                  <span key={idx} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[13px] font-medium rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>


          {/* Foreign Languages */}
          <div className="bg-white border border-slate-100 rounded-2xl shadow-sm px-6 py-4 ">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[20px] font-bold text-[#1f2937]">Chứng chỉ/bằng cấp</h3>
              <button className="flex items-center gap-1.5 text-[#5c4cf5] font-semibold text-[16px] hover:opacity-80 transition">
                <PlusCircle className="w-[18px] h-[18px]" strokeWidth={2} /> Thêm
              </button>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <p className="text-[#6b7280] text-[15px]">Thêm thông tin khả năng ngoại ngữ để tăng tỷ lệ cạnh tranh</p>
            </div>
          </div>
        </div>

        {/* =======================
            CỘT PHẢI (RIGHT SIDEBAR)
            ======================= */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Việc làm phù hợp</h3>
            <Link href="/profile/jobs/matching" className="text-xs font-bold text-blue-600 hover:underline">Tất cả</Link>
          </div>

          <div className="space-y-4">
            {loadingMatching ? (
              [1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-slate-100" />
              ))
            ) : matchingJobs.length > 0 ? (
              matchingJobs.map((job) => (
                <JobCard key={job.jobPostingId} job={job} />
              ))
            ) : (
              <div className="bg-white rounded-2xl p-6 text-center border border-dashed border-slate-200">
                <Bot className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">Cập nhật CV để nhận gợi ý từ AI</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <CVReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        initialData={extractedData}
        fileUrl={fileUrl}
        cvTitle={cvTitle}
        cvId={cvId}
        onSuccess={() => {
          setIsReviewModalOpen(false);
          fetchProfile(true); // Silent refresh sau khi lưu
          toast.success("Hồ sơ đã được cập nhật!");
        }}
      />
    </div>
  );
}
