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
  UploadCloud,
  MoreHorizontal,
  CircleDot,
  Loader2,
  Edit,
  Download,
  BellIcon,
  User2Icon,
  PlusCircle,
} from "lucide-react";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/auth";
import { JobCard, type Job } from "@/components/JobCard";

export default function ProfileDashboard() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthStore();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isOpenToWork, setIsOpenToWork] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);

  // Auth guard and fetch profile
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }
    if (isAuthenticated) {
      profileApi
        .getMe()
        .then((data) => setProfile(data))
        .catch((err) => console.error("Failed to load profile", err))
        .finally(() => setLoadingProfile(false));
        
      setLoadingJobs(true);
      api.get('/candidates/recommended-jobs')
        .then((res: any) => setRecommendedJobs(res.data || []))
        .catch((err: any) => console.error("Failed to load recommended jobs", err))
        .finally(() => setLoadingJobs(false));
    }
  }, [authLoading, isAuthenticated, router]);

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
            <div className="relative w-32 h-32 mb-4">
              {/* Outer stroke (orange & blue) */}
              <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="46" fill="transparent" stroke="#E2E8F0" strokeWidth="8" />
                <path
                  d="M 50 4 A 46 46 0 1 1 4 50"
                  fill="transparent"
                  stroke="#2563EB"
                  strokeWidth="8"
                  strokeLinecap="round"
                />

              </svg>
              {/* Inner Avatar */}
              <div className="absolute inset-2 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-white">
                {profile?.avatar ? (
                  <Image src={profile.avatar} alt={fullName} fill className="object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-slate-400">{avatarLetter}</span>
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

              <Link href="/profile/applications" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 hover:text-blue-600">
                <Briefcase className="w-5 h-5" />
                <span className="text-sm font-medium">Việc làm đã ứng tuyển</span>
              </Link>

              <Link href="/profile/saved" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 rounded-xl transition-colors text-slate-600 hover:text-blue-600">
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
                <span className="font-bold text-slate-800 w-[45%]">Ngày sinh:</span>
                <span className="text-slate-600 flex-1">Chưa có dữ liệu</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">Chức vụ:</span>
                <span className="text-slate-600 flex-1">Chưa có dữ liệu</span>
              </div>

              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">Giới tính:</span>
                <span className="text-slate-600 flex-1">Nam</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">Trạng thái tìm việc:</span>
                <span className="text-[#10b981] flex-1 flex items-center gap-1.5"><div className="w-[18px] h-[18px] rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold leading-none italic">i</div> Đang tìm việc</span>
              </div>

              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">Chức danh công việc:</span>
                <span className="text-slate-600 flex-1 flex items-center gap-1.5"><div className="w-[18px] h-[18px] rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold leading-none italic">i</div> Backend Developer</span>
              </div>
              <div className="flex items-center">
                <span className="font-bold text-slate-800 w-[45%]">Ngày cập nhật:</span>
                <span className="text-slate-900 font-medium flex-1">27/03/2026</span>
              </div>
            </div>
          </div>

          {/* CVs & Resumes */}
          <div>
            <div className="flex items-center justify-between m-3">
              <h3 className="text-lg font-bold text-slate-900 px-4">Danh sách CV của bạn</h3>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
                Xem tất cả <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable horizontal list */}
            <div className="flex gap-4 overflow-x-auto pb-2 snap-x hide-scrollbar">
              {[
                { name: "CV Mặc định", type: "CV đã tạo", icon: "📄" },
                { name: "CV Thực tập Công nghệ", type: "CV đã tạo", icon: "💼" },
                { name: "Sáng tạo Portfolio", type: "CV đã tạo", icon: "🎨" },
              ].map((cv, idx) => (
                <div key={idx} className="min-w-[220px] bg-white border border-slate-200 rounded-2xl p-4 snap-start shrink-0 flex flex-col gap-3 hover:border-blue-300 transition-colors shadow-sm">
                  <div className="flex gap-3">
                    <div className="w-12 h-16 bg-slate-100 rounded-md border border-slate-200 flex items-center justify-center text-xl">
                      {cv.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm line-clamp-1">{cv.name}</h4>
                      <p className="text-slate-500 text-xs mt-0.5">{cv.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 bg-blue-900 text-white rounded-lg py-1.5 text-xs font-semibold hover:bg-blue-800 transition">
                      Chỉnh sửa
                    </button>
                    <button className="px-2 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
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
          <h3 className="text-lg font-bold text-slate-900 mb-1">Việc làm gợi ý cho bạn</h3>
          <p className="text-slate-500 text-[13px] mb-4">Các công việc phù hợp với kỹ năng của bạn</p>

          <div className="space-y-4">
            {loadingJobs ? (
              <div className="text-center py-4 text-sm text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2"/> Đang phân tích gợi ý...</div>
            ) : recommendedJobs.length === 0 ? (
              <div className="text-center py-4 text-sm text-slate-500">Chưa có công việc nào khớp với kỹ năng của bạn. Hãy cập nhật kỹ năng profile nhé!</div>
            ) : (
              recommendedJobs.map((job) => (
                <JobCard key={job.jobPostingId} job={job} />
              ))
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
    </div>
  );
}
