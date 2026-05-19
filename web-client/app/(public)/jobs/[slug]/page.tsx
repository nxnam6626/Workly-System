"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  MapPin, DollarSign, Building2, Briefcase, 
  Clock, Heart, Share2, AlertCircle, ChevronRight,
  ShieldCheck, Send
} from "lucide-react";
import toast from "react-hot-toast";

import api from "@/lib/api";
import { formatSalary } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth";
import { useFavoriteStore } from "@/stores/favorites";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import type { Job } from "@/components/jobs/JobCard";

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { slug } = params as { slug: string };
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  
  const { isAuthenticated } = useAuthStore();
  const { favoriteIds, toggleFavorite } = useFavoriteStore();
  const isSaved = job ? favoriteIds.has(job.jobPostingId) : false;

  useEffect(() => {
    if (slug) {
      fetchJobDetails();
    }
  }, [slug]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/job-postings/${slug}?trackView=true`);
      setJob(data);
      if (typeof window !== "undefined" && data) {
        try {
          const viewedStr = localStorage.getItem("workly:viewed-jobs");
          let viewed = viewedStr ? JSON.parse(viewedStr) : [];
          viewed = viewed.filter((item: any) => item.jobPostingId !== data.jobPostingId);
          viewed.unshift({
            jobPostingId: data.jobPostingId,
            title: data.title,
            company: {
              companyName: data.company?.companyName,
              logo: data.company?.logo,
            },
            salaryMin: data.salaryMin,
            salaryMax: data.salaryMax,
            currency: data.currency,
            locationCity: data.locationCity,
            jobType: data.jobType,
            createdAt: data.createdAt,
            viewedAt: new Date().toISOString()
          });
          if (viewed.length > 50) viewed = viewed.slice(0, 50);
          localStorage.setItem("workly:viewed-jobs", JSON.stringify(viewed));
        } catch (e) {
          console.error("Failed to save viewed jobs:", e);
        }
      }
    } catch (error) {
      console.error("Failed to load job details:", error);
      toast.error("Không thể tải thông tin công việc");
      router.push("/jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để lưu công việc");
      router.push("/login");
      return;
    }
    if (job) {
      await toggleFavorite(job);
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để ứng tuyển");
      router.push("/login");
      return;
    }
    setIsApplyModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-medium">Đang tải thông tin công việc...</p>
        </div>
      </div>
    );
  }

  if (!job) return null;

  const jobTypeLabelMap: Record<string, string> = {
    FULLTIME: "Toàn thời gian",
    PARTTIME: "Bán thời gian",
    REMOTE: "Từ xa",
  };

  const jobLevelLabelMap: Record<string, string> = {
    INTERN: "Thực tập sinh",
    STAFF: "Nhân viên",
    MANAGER: "Quản lý",
    DIRECTOR: "Giám đốc",
  };

  const expLabelMap: Record<string, string> = {
    NO_EXPERIENCE: "Không yêu cầu",
    UNDER_1_YEAR: "Dưới 1 năm",
    "1_TO_3_YEARS": "1 - 3 năm",
    "3_TO_5_YEARS": "3 - 5 năm",
    OVER_5_YEARS: "Trên 5 năm",
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-4 flex items-center gap-2 text-sm text-slate-500 font-medium">
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/")}>Trang chủ</span>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <span className="hover:text-blue-600 cursor-pointer" onClick={() => router.push("/jobs")}>Việc làm</span>
          <ChevronRight className="w-4 h-4 opacity-50" />
          <span className="text-slate-900 line-clamp-1">{job.title}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 leading-tight">
                {job.title}
              </h1>
              
              <div className="flex flex-wrap gap-6 mb-8">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Mức lương</p>
                    <p className="font-bold text-slate-900 mt-0.5">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Địa điểm</p>
                    <p className="font-bold text-slate-900 mt-0.5 line-clamp-1" title={job.locationCity || job.company?.address || "Toàn quốc"}>
                      {job.locationCity || job.company?.address || "Toàn quốc"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Kinh nghiệm</p>
                    <p className="font-bold text-slate-900 mt-0.5">{job.experience ? (expLabelMap[job.experience] || job.experience) : "Thỏa thuận"}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleApplyClick}
                  disabled={job.hasApplied || job.status === 'CLOSED'}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-white transition-all shadow-md ${
                    job.status === 'CLOSED'
                      ? "bg-slate-300 shadow-none cursor-not-allowed text-slate-500"
                      : job.hasApplied 
                        ? "bg-slate-300 shadow-none cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                  }`}
                >
                  <Send className="w-5 h-5" />
                  {job.status === 'CLOSED' ? "Đã đóng tin" : (job.hasApplied ? "Đã ứng tuyển" : "Ứng tuyển ngay")}
                </button>
                <button 
                  onClick={handleToggleFavorite}
                  className={`p-3.5 rounded-xl border-2 transition-all flex items-center justify-center gap-2 font-bold ${
                    isSaved 
                      ? "border-red-500 text-red-500 bg-red-50" 
                      : "border-slate-200 text-slate-600 hover:border-red-500 hover:text-red-500 hover:bg-red-50"
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isSaved ? "fill-current" : ""}`} />
                  <span className="hidden sm:inline">{isSaved ? "Đã lưu" : "Lưu tin"}</span>
                </button>
              </div>
            </div>

            {/* Details Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 md:p-8 space-y-10">
                {/* Description */}
                {job.description && (
                  <div>
                    <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                      Mô tả công việc
                    </h2>
                    <div 
                      className="prose prose-slate max-w-none text-slate-600 text-[15px] leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: job.description }}
                    />
                  </div>
                )}

                {/* Requirements */}
                {job.requirements && (
                  <div>
                    <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-amber-500 rounded-full"></div>
                      Yêu cầu ứng viên
                    </h2>
                    <div 
                      className="prose prose-slate max-w-none text-slate-600 text-[15px] leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: job.requirements }}
                    />
                  </div>
                )}

                {/* Benefits */}
                {job.benefits && (
                  <div>
                    <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
                      Quyền lợi
                    </h2>
                    <div 
                      className="prose prose-slate max-w-none text-slate-600 text-[15px] leading-relaxed whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: job.benefits }}
                    />
                  </div>
                )}
              </div>
              
              {/* Footer action */}
              <div className="bg-slate-50 p-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-100">
                <div className="flex items-center gap-3 text-slate-500 text-sm font-medium mb-4 sm:mb-0">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Báo cáo tin tuyển dụng nếu có dấu hiệu lừa đảo
                </div>
                <button className="text-rose-600 font-bold text-sm hover:underline">
                  Báo cáo ngay
                </button>
              </div>
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Company Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center p-2 mb-4 overflow-hidden">
                {job.company?.logo ? (
                  <img src={job.company.logo} alt={job.company.companyName} className="w-full h-full object-contain" />
                ) : (
                  <Building2 className="w-10 h-10 text-slate-300" />
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{job.company?.companyName}</h3>
              <p className="text-slate-500 text-sm font-medium mb-6 line-clamp-2 px-2">
                {job.company?.address || "Đang cập nhật địa chỉ"}
              </p>
              <button 
                onClick={() => router.push(`/companies/${job.company?.companyId}`)}
                className="w-full py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors"
              >
                Xem trang công ty
              </button>
            </div>

            {/* General Info Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-900 text-lg mb-6">Thông tin chung</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">Hình thức làm việc</p>
                    <p className="font-bold text-slate-900">{job.jobType ? jobTypeLabelMap[job.jobType] : "Toàn thời gian"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">Cấp bậc</p>
                    <p className="font-bold text-slate-900">{job.jobLevel ? jobLevelLabelMap[job.jobLevel] : "Nhân viên"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">Ngành nghề</p>
                    <p className="font-bold text-slate-900 line-clamp-1">{job.category || "IT - Phần mềm"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                    <Briefcase className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">Kinh nghiệm</p>
                    <p className="font-bold text-slate-900 line-clamp-1">{job.experience ? (expLabelMap[job.experience] || job.experience) : "Không yêu cầu"}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {job && (
        <JobApplyModal
          isOpen={isApplyModalOpen}
          onClose={() => setIsApplyModalOpen(false)}
          jobTitle={job.title}
          companyName={job.company?.companyName || "Công ty"}
          jobPostingId={job.jobPostingId}
          jobLocationCity={job.locationCity || undefined}
          onSuccess={() => {
            fetchJobDetails(); // Refresh to update `hasApplied` status
          }}
        />
      )}
    </div>
  );
}
