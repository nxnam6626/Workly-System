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
  Award,
  LayoutDashboard,
  Wand2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { JobCard, type Job } from "@/components/JobCard";
import { CVReviewModal } from "@/components/candidates/CVReviewModal";
import { BasicInfoModal } from "@/components/candidates/profile-edit/BasicInfoModal";
import { ExperienceModal } from "@/components/candidates/profile-edit/ExperienceModal";
import { ProjectsModal } from "@/components/candidates/profile-edit/ProjectsModal";
import { SkillsModal } from "@/components/candidates/profile-edit/SkillsModal";
import { LanguagesModal } from "@/components/candidates/profile-edit/LanguagesModal";
import { CertificationsModal } from "@/components/candidates/profile-edit/CertificationsModal";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ConfirmDialog";

const TABS = [
  { id: "OVERVIEW", label: "Tổng quan", icon: LayoutDashboard },
  { id: "PORTFOLIO", label: "Năng lực", icon: Briefcase },
  { id: "SKILLS", label: "Kỹ năng", icon: Wand2 },
  { id: "JOBS", label: "Việc làm", icon: Sparkles },
];

export default function ProfileDashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, updateUser } = useAuthStore();
  const confirm = useConfirm();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isOpenToWork, setIsOpenToWork] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  // Auth guard and fetch profile
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      profileApi
        .getMe()
        .then((data) => {
          setProfile(data);
          if (data.candidate && data.candidate.isOpenToWork !== undefined) {
            setIsOpenToWork(data.candidate.isOpenToWork);
          }
        })
        .catch((err) => console.error("Failed to load profile", err))
        .finally(() => setLoadingProfile(false));

      setLoadingJobs(true);
      api.get('/candidates/recommended-jobs')
        .then((res: any) => setRecommendedJobs(res.data.items || []))
        .catch((err: any) => console.error("Failed to load recommended jobs", err))
        .finally(() => setLoadingJobs(false));
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchProfile = async (silent = false) => {
    if (!silent) setLoadingProfile(true);
    try {
      const data = await profileApi.getMe();
      setProfile(data);
      if (data.candidate && data.candidate.isOpenToWork !== undefined) {
        setIsOpenToWork(data.candidate.isOpenToWork);
      }
    } catch (err) {
      console.error("Failed to load profile", err);
    } finally {
      if (!silent) setLoadingProfile(false);
    }
  };

  const handleToggleOpenToWork = async () => {
    const newValue = !isOpenToWork;
    const toastId = toast.loading("Đang cập nhật trạng thái...");
    setIsOpenToWork(newValue);
    try {
      if (!profile) throw new Error("Profile chưa load");
      const updated = await profileApi.updateProfile({
        fullName: profile.candidate?.fullName || user?.name || "Người dùng",
        phone: profile.phoneNumber || "",
        isOpenToWork: newValue
      });
      setProfile(updated);
      setIsOpenToWork(updated.candidate?.isOpenToWork ?? newValue);
      updateUser({ candidate: updated.candidate });
      toast.success(newValue ? "Hồ sơ của bạn đã được hiển thị với Nhà tuyển dụng!" : "Đã tắt. Hồ sơ của bạn đang được ẩn khỏi kết quả tìm kiếm.", { id: toastId });
    } catch (error: any) {
      setIsOpenToWork(!newValue);
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật trạng thái.", { id: toastId });
    }
  };

  // State cho Smart Upload
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [cvTitle, setCvTitle] = useState("");
  const [cvId, setCvId] = useState<string | undefined>(undefined);

  // Modal states
  const [isBasicInfoOpen, setIsBasicInfoOpen] = useState(false);
  const [isExperienceOpen, setIsExperienceOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isSkillsOpen, setIsSkillsOpen] = useState(false);
  const [isLanguagesOpen, setIsLanguagesOpen] = useState(false);
  const [isCertificationsOpen, setIsCertificationsOpen] = useState(false);

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

      const { parsedData, fileUrl, cvTitle, cvId } = response.data;
      setExtractedData(parsedData || {});
      setFileUrl(fileUrl);
      setCvTitle(cvTitle);
      setCvId(cvId);

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
    const ok = await confirm({
      title: 'Xóa CV',
      message: 'Bạn có chắc chắn muốn xóa CV này? Hành động này không thể hoàn tác.',
      confirmText: 'Xóa CV',
      variant: 'danger',
    });
    if (!ok) return;

    const toastId = toast.loading("Đang xóa CV...");
    try {
      await profileApi.deleteCv(cvId);
      toast.success("Đã xóa CV thành công", { id: toastId });
      fetchProfile(true);
    } catch (error) {
      toast.error("Lỗi khi xóa CV", { id: toastId });
    }
  };

  const handleSetMainCv = async (cvId: string) => {
    const toastId = toast.loading("Đang thiết lập CV mặc định...");
    try {
      await profileApi.setMainCv(cvId);
      toast.success("Đã cập nhật CV mặc định", { id: toastId });
      fetchProfile(true);
    } catch (error) {
      toast.error("Lỗi khi cập nhật CV mặc định", { id: toastId });
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
      updateUser({ avatar: avatarUrl });
      if (profile) {
        setProfile({ ...profile, avatar: avatarUrl });
      }
      toast.success('Cập nhật ảnh đại diện thành công!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật ảnh.', { id: toastId });
    } finally {
      setIsUpdatingAvatar(false);
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
  const avatarLetter = fullName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f8fafc] py-8 px-4 font-sans">
      <div className="max-w-[1300px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* =======================
            LEFT SIDEBAR (3/12)
            ======================= */}
        <aside className="lg:col-span-3 space-y-6">
          <div className="sticky top-24 space-y-6">
            {/* Profile Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 flex flex-col items-center text-center overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-5" />

              <div className="relative w-32 h-32 mb-4 group mt-4">
                <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="48" fill="transparent" stroke="#e2e8f0" strokeWidth="2" />
                  <circle cx="50" cy="50" r="48" fill="transparent" stroke="#2563EB" strokeWidth="4" strokeDasharray="301.59" strokeDashoffset="75" strokeLinecap="round" className="transform -rotate-90 origin-center" />
                </svg>

                <div className="absolute inset-2 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
                  {profile?.avatar ? (
                    <Image src={profile.avatar} alt={fullName} fill className="object-cover transition-transform group-hover:scale-110" />
                  ) : (
                    <span className="text-4xl font-bold text-slate-400">{avatarLetter}</span>
                  )}

                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer">
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
                </div>
              </div>

              <h2 className="text-xl font-bold text-slate-900">{fullName}</h2>
              <p className="text-blue-600 text-sm font-semibold mt-1 px-3 py-1 bg-blue-50 rounded-full">{jobTitle}</p>

              {/* Status Toggle */}
              <div className="mt-8 w-full p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] font-bold text-slate-700">Trạng thái tìm việc</span>
                  <button
                    onClick={handleToggleOpenToWork}
                    className={`w-12 h-6 rounded-full transition-all relative flex items-center shadow-inner ${isOpenToWork ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <motion.div
                      animate={{ x: isOpenToWork ? 24 : 4 }}
                      className="w-4 h-4 rounded-full bg-white shadow-md absolute"
                    />
                  </button>
                </div>
                <p className={`text-[11px] font-medium leading-relaxed ${isOpenToWork ? "text-emerald-600" : "text-slate-400"}`}>
                  {isOpenToWork
                    ? "Hồ sơ của bạn đang được hiển thị ưu tiên với Nhà tuyển dụng."
                    : "Hồ sơ của bạn đang tạm ẩn khỏi danh sách tìm kiếm."}
                </p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-3">
              <nav className="space-y-1">
                {[
                  { icon: Briefcase, label: "Việc làm ứng tuyển", href: "/profile/jobs/applied" },
                  { icon: Bookmark, label: "Việc làm đã lưu", href: "/profile/jobs/saved" },
                  { icon: BellIcon, label: "Thông báo", href: "/profile/notifications" },
                  { icon: Settings, label: "Cài đặt gợi ý", href: "/profile/settings", disabled: true },
                ].map((item) => {
                  const content = (
                    <>
                      <item.icon className={`w-5 h-5 ${item.disabled ? 'text-slate-300' : 'text-slate-400 group-hover:text-blue-600'}`} />
                      <span className={`text-sm font-semibold ${item.disabled ? 'text-slate-300' : 'text-slate-600 group-hover:text-slate-900'}`}>{item.label}</span>
                      {item.disabled && (
                        <span className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100">Sắp có</span>
                      )}
                    </>
                  );

                  if (item.disabled) {
                    return (
                      <div key={item.label} className="flex items-center gap-3 px-4 py-3 opacity-60 cursor-not-allowed select-none">
                        {content}
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-2xl transition-all group"
                    >
                      {content}
                    </Link>
                  );
                })}

              </nav>
            </div>
          </div>
        </aside>

        {/* =======================
            MAIN CONTENT (9/12)
            ======================= */}
        <main className="lg:col-span-9 space-y-6">

          {/* Tabs Navigation */}
          <div className="bg-white p-2 rounded-3xl shadow-sm border border-slate-200/60 flex flex-wrap gap-2 sticky top-24 z-10 backdrop-blur-md bg-white/90">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold transition-all relative ${activeTab === tab.id
                  ? "text-blue-600 bg-blue-50"
                  : "text-slate-500 hover:bg-slate-50"
                  }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-blue-600" : "text-slate-400"}`} />
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 border-2 border-blue-600 rounded-2xl pointer-events-none"
                    transition={{ type: "spring", duration: 0.5 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Tab Content Area */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >

                {/* OVERVIEW TAB */}
                {activeTab === "OVERVIEW" && (
                  <div className="space-y-6">
                    {/* Basic Info Card */}
                    <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 group relative">
                      <div className="flex items-center justify-between mb-5">
                        <h3 className="text-xl font-bold text-slate-900">Thông tin chung</h3>
                        <button onClick={() => setIsBasicInfoOpen(true)}
                          className="p-2 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                        {[
                          { label: "Email", value: profile?.email },
                          { label: "Số điện thoại", value: profile?.phoneNumber },
                          { label: "Địa điểm làm việc", value: profile?.candidate?.location },
                          { label: "Trường học", value: profile?.candidate?.university },
                          { label: "Chuyên ngành", value: profile?.candidate?.major },
                          { label: "GPA", value: profile?.candidate?.gpa ? `${profile.candidate.gpa}/4.0` : null },
                          { label: "Vị trí mong muốn", value: profile?.candidate?.desiredJob?.title },
                          { label: "Mức lương kỳ vọng", value: profile?.candidate?.desiredJob?.salary },
                          { label: "Ngành nghề", value: profile?.candidate?.industries?.join(", ") },
                          { label: "Kinh nghiệm", value: profile?.candidate?.totalYearsExp != null ? `${profile.candidate.totalYearsExp} năm` : null },
                        ].map((item, idx) => (
                          <div key={idx} className="flex flex-col gap-0.5">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</span>
                            <span className="text-[15px] font-semibold text-slate-800">{item.value || "Chưa cập nhật"}</span>
                          </div>
                        ))}
                      </div>

                      {profile?.candidate?.summary && (
                        <div className="mt-6 pt-6 border-t border-slate-100">
                          <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Giới thiệu bản thân</h4>
                          <p className="text-slate-600 leading-snug whitespace-pre-wrap">{profile.candidate.summary}</p>
                        </div>
                      )}
                    </section>

                    {/* CV Management Card */}
                    <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Danh sách CV</h3>
                        <Link href="/profile/cv-management" className="text-blue-600 text-[13px] font-bold hover:underline">Xem tất cả</Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile?.candidate?.cvs?.map((cv) => (
                          <div key={cv.cvId} className="group relative bg-slate-50/50 rounded-2xl p-5 border border-slate-200/60 hover:border-blue-300 transition-all">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:scale-105 transition-transform">
                                <FileText className="w-6 h-6" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-slate-900 text-sm truncate">{cv.cvTitle}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  {cv.isMain && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-bold rounded-full">MẶC ĐỊNH</span>}
                                  <span className="text-[11px] text-slate-400">{new Date(cv.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-5">
                              <Link href={cv.fileUrl} target="_blank" className="flex-1 py-2 bg-slate-900 text-white rounded-xl text-[11px] font-bold text-center hover:bg-slate-800 transition">Xem</Link>
                              {!cv.isMain && (
                                <button onClick={() => handleSetMainCv(cv.cvId)} className="px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[11px] font-bold hover:bg-slate-50 transition">Đặt mặc định</button>
                              )}
                              <button onClick={() => handleDeleteCv(cv.cvId)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </div>
                        ))}

                        <label className="cursor-pointer border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 hover:bg-blue-50/50 hover:border-blue-300 transition-all min-h-[160px]">
                          <input type="file" className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileUpload} disabled={isUploading} />
                          {isUploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                              <span className="text-[12px] font-bold text-blue-600 italic">Đang bóc tách bằng AI...</span>
                            </div>
                          ) : (
                            <>
                              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                <Upload className="w-5 h-5 text-blue-600" />
                              </div>
                              <span className="text-[14px] font-bold text-slate-700">Tải lên CV mới</span>
                              <span className="text-[10px] text-slate-400 mt-1">PDF, DOCX (Max 5MB)</span>
                            </>
                          )}
                        </label>
                      </div>
                    </section>
                  </div>
                )}

                {/* PORTFOLIO TAB */}
                {activeTab === "PORTFOLIO" && (
                  <div className="space-y-6">
                    <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 group relative">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-900">Kinh nghiệm làm việc</h3>
                        <button onClick={() => setIsExperienceOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-50 font-bold text-xs transition-all border border-blue-100 opacity-0 group-hover:opacity-100">
                          <Edit className="w-4 h-4" /> Chỉnh sửa
                        </button>
                      </div>
                      <div className="space-y-10">
                        {profile?.candidate?.experiences?.length ? (
                          profile.candidate.experiences.map((exp, idx) => (
                            <div key={idx} className="relative pl-10">
                              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-slate-100" />
                              <div className="absolute left-[-6px] top-0 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2 mb-2">
                                <div>
                                  <h4 className="text-lg font-bold text-slate-900">{exp.role}</h4>
                                  <p className="text-blue-600 font-bold text-sm">{exp.company}</p>
                                </div>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[11px] font-bold rounded-full">{exp.duration}</span>
                              </div>
                              <p className="text-slate-600 leading-relaxed text-[15px]">{exp.description}</p>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium">Chưa có thông tin kinh nghiệm.</p>
                          </div>
                        )}
                      </div>
                    </section>

                    <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 group relative">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-900">Dự án tiêu biểu</h3>
                        <button onClick={() => setIsProjectsOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-50 font-bold text-xs transition-all border border-blue-100 opacity-0 group-hover:opacity-100">
                          <Edit className="w-4 h-4" /> Chỉnh sửa
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profile?.candidate?.projects?.length ? (
                          profile.candidate.projects.map((p, idx) => (
                            <div key={idx} className="group p-6 bg-slate-50/50 rounded-3xl border border-slate-200/60 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                              <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{p.projectName}</h4>
                              <p className="text-[11px] font-bold text-blue-500 uppercase mt-1 tracking-wider">{p.role}</p>
                              <p className="text-slate-600 text-sm mt-3 leading-relaxed">{p.description}</p>
                              {p.technology && (
                                <div className="flex flex-wrap gap-2 mt-4">
                                  {p.technology.split(',').map((tech, i) => (
                                    <span key={i} className="px-2 py-1 bg-white text-slate-500 text-[10px] font-bold rounded-lg border border-slate-200">{tech.trim()}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full text-center py-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                            <p className="text-slate-400 font-medium">Chưa có thông tin dự án.</p>
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {/* SKILLS TAB */}
                {activeTab === "SKILLS" && (
                  <div className="space-y-6">
                    <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 group relative">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-900">Kỹ năng & Chuyên môn</h3>
                        <button onClick={() => setIsSkillsOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-50 font-bold text-xs transition-all border border-blue-100 opacity-0 group-hover:opacity-100">
                          <Edit className="w-4 h-4" /> Chỉnh sửa
                        </button>
                      </div>
                      <div className="space-y-8">
                        {profile?.candidate?.skills?.length ? (
                          Object.entries(
                            profile.candidate.skills.reduce((acc, s) => {
                              const category = s.category || 'Khác';
                              if (!acc[category]) acc[category] = [];
                              acc[category].push(s);
                              return acc;
                            }, {} as Record<string, any[]>)
                          ).map(([cat, items]) => (
                            <div key={cat}>
                              <h4 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                                {cat}
                              </h4>
                              <div className="flex flex-wrap gap-3">
                                {items.map((s, idx) => {
                                  const levelColors: Record<string, string> = {
                                    ADVANCED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                    INTERMEDIATE: 'bg-blue-50 text-blue-700 border-blue-200',
                                    BEGINNER: 'bg-slate-50 text-slate-600 border-slate-200',
                                  };
                                  return (
                                    <div key={idx} className={`px-4 py-2 rounded-2xl border text-sm font-bold shadow-sm ${levelColors[s.level] || levelColors.BEGINNER}`}>
                                      {s.skillName}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 italic">Chưa có thông tin kỹ năng.</p>
                        )}
                      </div>
                    </section>

                    <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 group relative">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-slate-900">Ngoại ngữ</h3>
                        <button onClick={() => setIsLanguagesOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-emerald-600 hover:bg-emerald-50 font-bold text-xs transition-all border border-emerald-100 opacity-0 group-hover:opacity-100">
                          <Edit className="w-4 h-4" /> Chỉnh sửa
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {profile?.candidate?.languages?.length ? (
                          profile.candidate.languages.map((lang: any, idx: number) => {
                            const levelColors: Record<string, string> = {
                              ADVANCED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                              INTERMEDIATE: 'bg-amber-50 text-amber-700 border-amber-200',
                              BEGINNER: 'bg-slate-50 text-slate-600 border-slate-200',
                            };
                            return (
                              <div key={idx} className={`px-4 py-2 rounded-2xl border text-sm font-bold shadow-sm flex items-center gap-2 ${levelColors[lang.level] || levelColors.BEGINNER}`}>
                                <span>{lang.name}</span>
                                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                                <span className="text-[10px] uppercase font-bold opacity-80">{lang.level === "ADVANCED" ? "Thành thạo" : lang.level === "INTERMEDIATE" ? "Trung bình" : "Cơ bản"}</span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-slate-400 italic">Chưa có thông tin ngoại ngữ.</p>
                        )}
                      </div>
                    </section>

                    <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 group relative">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-bold text-slate-900">Chứng chỉ & Bằng cấp</h3>
                        <button onClick={() => setIsCertificationsOpen(true)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl text-blue-600 hover:bg-blue-50 font-bold text-xs transition-all border border-blue-100 opacity-0 group-hover:opacity-100">
                          <Edit className="w-4 h-4" /> Chỉnh sửa
                        </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile?.candidate?.certifications?.length ? (
                          profile.candidate.certifications.map((cert: any, idx: number) => (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                              <div className="w-12 h-12 bg-white shadow-sm rounded-xl flex items-center justify-center text-blue-600">
                                <Award className="w-6 h-6" />
                              </div>
                              <span className="text-[15px] font-bold text-slate-800">{cert.name}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-slate-400 italic">Chưa có chứng chỉ nào.</p>
                        )}
                      </div>
                    </section>
                  </div>
                )}

                {/* JOBS TAB */}
                {activeTab === "JOBS" && (
                  <div className="space-y-6">
                    <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900">Việc làm gợi ý cho bạn</h3>
                          <p className="text-slate-500 text-sm mt-1">Dựa trên kỹ năng và mục tiêu nghề nghiệp của bạn</p>
                        </div>
                        <Link href="/jobs" className="px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 transition shadow-lg shadow-blue-200">Khám phá tất cả</Link>
                      </div>

                      {loadingJobs ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                          <p className="text-slate-500 font-bold animate-pulse text-sm">AI đang tìm kiếm công việc phù hợp...</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {recommendedJobs.length > 0 ? (
                            recommendedJobs.map((job) => <JobCard key={job.jobPostingId} job={job} />)
                          ) : (
                            <div className="col-span-full text-center py-12 bg-slate-50 rounded-3xl">
                              <Sparkles className="w-12 h-12 text-blue-200 mx-auto mb-4" />
                              <p className="text-slate-500 font-medium">Hãy cập nhật đầy đủ thông tin để AI gợi ý việc làm tốt nhất!</p>
                            </div>
                          )}
                        </div>
                      )}
                    </section>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <CVReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        initialData={extractedData}
        fileUrl={fileUrl}
        cvTitle={cvTitle}
        cvId={cvId}
        onSuccess={() => {
          setIsReviewModalOpen(false);
          fetchProfile(true);
          toast.success("Hồ sơ đã được cập nhật!");
        }}
      />

      {profile && (
        <>
          <BasicInfoModal
            isOpen={isBasicInfoOpen}
            onClose={() => setIsBasicInfoOpen(false)}
            initialData={profile}
            onSuccess={(updated) => { setProfile(updated); updateUser({ candidate: updated.candidate }); }}
          />
          <ExperienceModal
            isOpen={isExperienceOpen}
            onClose={() => setIsExperienceOpen(false)}
            initialData={profile}
            onSuccess={(updated) => setProfile(updated)}
          />
          <ProjectsModal
            isOpen={isProjectsOpen}
            onClose={() => setIsProjectsOpen(false)}
            initialData={profile}
            onSuccess={(updated) => setProfile(updated)}
          />
          <SkillsModal
            isOpen={isSkillsOpen}
            onClose={() => setIsSkillsOpen(false)}
            initialData={profile}
            onSuccess={(updated) => setProfile(updated)}
          />
          <LanguagesModal
            isOpen={isLanguagesOpen}
            onClose={() => setIsLanguagesOpen(false)}
            initialData={profile}
            onSuccess={(updated) => setProfile(updated)}
          />
          <CertificationsModal
            isOpen={isCertificationsOpen}
            onClose={() => setIsCertificationsOpen(false)}
            initialData={profile}
            onSuccess={(updated) => setProfile(updated)}
          />
        </>
      )}
    </div>
  );
}
