"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Bookmark,
  ChevronRight,
  BellIcon,
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  Edit,
  CircleDot,
  Trash2,
  Award,
  LayoutDashboard,
  Wand2,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/api";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";
import { useAuthStore } from "@/stores/auth";
import { JobCard, type Job } from "@/components/jobs/JobCard";
import { BasicInfoModal } from "@/components/candidates/profile-edit/BasicInfoModal";
import { ExperienceModal } from "@/components/candidates/profile-edit/ExperienceModal";
import { ProjectsModal } from "@/components/candidates/profile-edit/ProjectsModal";
import { SkillsModal } from "@/components/candidates/profile-edit/SkillsModal";
import { LanguagesModal } from "@/components/candidates/profile-edit/LanguagesModal";
import { CertificationsModal } from "@/components/candidates/profile-edit/CertificationsModal";
import { ProfileSidebar } from "@/components/candidates/ProfileSidebar";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ui/ConfirmDialog";


const INTER_FONT = "'Inter', sans-serif";
const PLAYFAIR_FONT = "'Inter', sans-serif";

const TABS = [
  { id: "OVERVIEW", label: "Tổng quan", icon: LayoutDashboard },
  { id: "PORTFOLIO", label: "Năng lực", icon: Briefcase },
  { id: "SKILLS", label: "Kỹ năng", icon: Wand2 },
];

interface DashboardStats {
  applied: number;
  saved: number;
  invitations: number;
  interviews: number;
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200/80 rounded-2xl ${className}`} />;
}

export default function ProfileDashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user, updateUser } = useAuthStore();
  const confirm = useConfirm();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isOpenToWork, setIsOpenToWork] = useState(true);
  const [activeTab, setActiveTab] = useState("OVERVIEW");
  const [stats, setStats] = useState<DashboardStats>({ applied: 0, saved: 0, invitations: 0, interviews: 0 });

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

      // Load dashboard stats in parallel
      Promise.allSettled([
        api.get('/applications/me'),
        api.get('/favorites/me'),
      ]).then(([appliedRes, savedRes]) => {
        const applied = appliedRes.status === 'fulfilled' ? (appliedRes.value as any).data?.length || 0 : 0;
        const saved = savedRes.status === 'fulfilled' ? (savedRes.value as any).data?.length || 0 : 0;
        const interviews = appliedRes.status === 'fulfilled'
          ? ((appliedRes.value as any).data || []).filter((a: any) =>
              ["INTERVIEWING", "INTERVIEW_CONFIRMED", "RESCHEDULE_REQUESTED"].includes(a.appStatus)
            ).length
          : 0;

        setStats({ applied, saved, invitations: 0, interviews });
      });
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

  const [isUploading, setIsUploading] = useState(false);

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
    const toastId = toast.loading("Đang tải CV lên...");
    try {
      const response = await profileApi.uploadCvOnly(file);
      
      toast.success("Tải CV lên thành công! Bạn có thể đặt CV này làm mặc định để đồng bộ vào hồ sơ.", { id: toastId });
      fetchProfile(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi tải CV.", { id: toastId });
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
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
    const cv = profile?.candidate?.cvs?.find(c => c.cvId === cvId);
    if (!cv) return;

    // Nếu CV chưa được bóc tách dữ liệu, tiến hành bóc tách và mở modal review
    if (!cv.parsedData) {
      const toastId = toast.loading("Đang phân tích CV bằng AI để đồng bộ vào hồ sơ...");
      try {
        const response = await profileApi.analyzeCv(cvId);
        toast.success("Phân tích thành công! Vui lòng kiểm tra và xác nhận đồng bộ.", { id: toastId });
        router.push(`/profile/cv-review/${cvId}`);
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Lỗi khi phân tích CV.", { id: toastId });
      }
      return;
    }

    // Tự động chuyển hướng sang trang review để đồng bộ vào hồ sơ
    router.push(`/profile/cv-review/${cvId}`);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

          {/* ── Stats Overview Bar ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                label: "Đã ứng tuyển",
                value: stats.applied,
                href: "/profile/jobs/applied",
                icon: Briefcase,
                accent: "from-amber-400 to-orange-400",
                iconBg: "bg-amber-50",
                iconColor: "text-amber-600",
                textColor: "text-amber-700",
              },
              {
                label: "Đã lưu",
                value: stats.saved,
                href: "/profile/jobs/saved",
                icon: Bookmark,
                accent: "from-rose-400 to-pink-400",
                iconBg: "bg-rose-50",
                iconColor: "text-rose-500",
                textColor: "text-rose-700",
              },
              {
                label: "Lời mời",
                value: stats.invitations,
                href: "/profile/jobs/invitations",
                icon: BellIcon,
                accent: "from-emerald-400 to-teal-400",
                iconBg: "bg-emerald-50",
                iconColor: "text-emerald-600",
                textColor: "text-emerald-700",
              },
              {
                label: "Phỏng vấn",
                value: stats.interviews,
                href: "/profile/jobs/interviews",
                icon: CircleDot,
                accent: "from-blue-400 to-indigo-400",
                iconBg: "bg-blue-50",
                iconColor: "text-blue-600",
                textColor: "text-blue-700",
              },
            ].map((stat) => (
              <Link
                key={stat.label}
                href={stat.href}
                className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-4 flex items-center gap-3 overflow-hidden"
              >
                <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${stat.accent} opacity-0 group-hover:opacity-100 transition-opacity`} />
                <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5 truncate">{stat.label}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-200 ml-auto flex-shrink-0 group-hover:text-slate-400 transition-colors" />
              </Link>
            ))}
          </div>

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
                    {loadingProfile ? (
                      <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-8 w-48" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                          {Array.from({ length: 8 }).map((_, idx) => (
                            <div key={idx} className="space-y-2">
                              <Skeleton className="h-3.5 w-24" />
                              <Skeleton className="h-5 w-40" />
                            </div>
                          ))}
                        </div>
                      </section>
                    ) : (
                      /* Basic Info Card */
                      <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 group relative">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="text-2xl font-bold text-slate-900" style={{ fontFamily: PLAYFAIR_FONT }}>Thông tin chung</h3>
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
                            { label: "Vị trí mong muốn", value: profile?.candidate?.desiredJob?.title || profile?.candidate?.desiredJob?.jobTitle || profile?.candidate?.desiredJob?.job_title },
                            { label: "Mức lương kỳ vọng", value: profile?.candidate?.desiredJob?.salary || profile?.candidate?.desiredJob?.expectedSalary || profile?.candidate?.desiredJob?.expected_salary },
                            { label: "Ngành nghề", value: profile?.candidate?.industries?.length ? profile.candidate.industries.join(", ") : null },
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
                    )}

                    {loadingProfile ? (
                      <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-8 w-36" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Skeleton className="h-[160px] w-full" />
                          <Skeleton className="h-[160px] w-full" />
                        </div>
                      </section>
                    ) : (
                      /* CV Management Card */
                      <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-slate-900" style={{ fontFamily: PLAYFAIR_FONT }}>Danh sách CV</h3>
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
                                <span className="text-[12px] font-bold text-blue-600 italic">Đang tải tệp lên...</span>
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
                    )}
                  </div>
                )}

                {/* PORTFOLIO TAB */}
                {activeTab === "PORTFOLIO" && (
                  <div className="space-y-6">
                    {loadingProfile ? (
                      <>
                        <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 space-y-6">
                          <Skeleton className="h-8 w-48" />
                          <div className="space-y-8">
                            {Array.from({ length: 2 }).map((_, idx) => (
                              <div key={idx} className="space-y-2 pl-6 border-l-2 border-slate-100 relative">
                                <div className="absolute left-[-6px] top-1 w-3 h-3 rounded-full bg-slate-200" />
                                <Skeleton className="h-6 w-1/3" />
                                <Skeleton className="h-4 w-1/4" />
                                <Skeleton className="h-12 w-full mt-2" />
                              </div>
                            ))}
                          </div>
                        </section>
                        <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 space-y-6">
                          <Skeleton className="h-8 w-36" />
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {Array.from({ length: 2 }).map((_, idx) => (
                              <div key={idx} className="p-6 bg-slate-50/50 rounded-3xl border border-slate-200/60 space-y-3">
                                <Skeleton className="h-5 w-2/3" />
                                <Skeleton className="h-3 w-1/3" />
                                <Skeleton className="h-12 w-full" />
                              </div>
                            ))}
                          </div>
                        </section>
                      </>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                )}

                {/* SKILLS TAB */}
                {activeTab === "SKILLS" && (
                  <div className="space-y-6">
                    {loadingProfile ? (
                      <>
                        <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 space-y-6">
                          <Skeleton className="h-8 w-48" />
                          <div className="space-y-6">
                            {Array.from({ length: 2 }).map((_, idx) => (
                              <div key={idx} className="space-y-3">
                                <Skeleton className="h-4 w-24" />
                                <div className="flex flex-wrap gap-3">
                                  {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-9 w-28 rounded-2xl" />
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <section className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/60 space-y-3">
                            <Skeleton className="h-5 w-24" />
                            <div className="flex flex-wrap gap-2">
                              <Skeleton className="h-7 w-20" />
                              <Skeleton className="h-7 w-24" />
                            </div>
                          </section>
                          <section className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/60 space-y-3">
                            <Skeleton className="h-5 w-24" />
                            <div className="flex flex-wrap gap-2">
                              <Skeleton className="h-7 w-20" />
                              <Skeleton className="h-7 w-24" />
                            </div>
                          </section>
                        </div>
                      </>
                    ) : (
                      <>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <section className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/60">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-bold text-slate-900">Ngoại ngữ</h4>
                              <button onClick={() => setIsLanguagesOpen(true)} className="text-blue-600 hover:text-blue-700 transition">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {profile?.candidate?.languages?.length ? (
                                profile.candidate.languages.map((lang: any, idx: number) => (
                                  <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 shadow-sm">
                                    {lang.name} • <span className="text-blue-600 uppercase text-[10px]">{lang.level === "ADVANCED" ? "Thành thạo" : lang.level === "INTERMEDIATE" ? "Trung bình" : "Cơ bản"}</span>
                                  </span>
                                ))
                              ) : (
                                <p className="text-slate-400 text-[12px] italic">Chưa cập nhật</p>
                              )}
                            </div>
                          </section>

                          <section className="bg-slate-50/50 rounded-2xl p-5 border border-slate-200/60">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-sm font-bold text-slate-900">Sở thích</h4>
                              <button className="text-blue-600 hover:text-blue-700 transition">
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {profile?.candidate?.interests?.length ? (
                                profile.candidate.interests.map((interest: string, idx: number) => (
                                  <span key={idx} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[12px] font-bold text-slate-700 shadow-sm">
                                    {interest}
                                  </span>
                                ))
                              ) : (
                                <p className="text-slate-400 text-[12px] italic">Chưa cập nhật</p>
                              )}
                            </div>
                          </section>
                        </div>

                        <section className="bg-white rounded-3xl shadow-sm border border-slate-200/60 p-6 group relative">
                          <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Thông tin bổ sung</h3>
                            <button className="p-2 rounded-xl text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-all opacity-0 group-hover:opacity-100">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-4">
                            {profile?.candidate?.otherInfo?.length ? (
                              profile.candidate.otherInfo.map((info: any, idx: number) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60">
                                  <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-widest mb-1">{info.header}</h4>
                                  <p className="text-slate-700 text-sm leading-relaxed">{info.content}</p>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                <p className="text-slate-400 text-sm italic">Chưa có thông tin bổ sung.</p>
                              </div>
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
                              <p className="text-slate-400 italic text-sm">Chưa có chứng chỉ nào.</p>
                            )}
                          </div>
                        </section>
                      </>
                    )}
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

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
