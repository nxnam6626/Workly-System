"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  Building2,
  Users,
  Calendar,
  ChevronRight,
  Share2,
  Bookmark,
  Send,
  CheckCircle2,
  Info,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
  Flag,
  Lightbulb,
  Frown,
  Meh,
  Smile,
  Zap,
  ShieldAlert,
} from "lucide-react";
import axios from "axios";
import api from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatSalary, timeAgo } from "@/lib/utils";
import { JOB_TYPE_LABEL } from "@/lib/constants";
import { JobCard, Job } from "@/components/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { useAuthStore } from "@/stores/auth";

interface JobDetails extends Job {
  companyId: string;
  description: string;
  requirements: string;
  benefits: string;
  vacancies: number | null;
  updatedAt: string;
  hasApplied: boolean;
  isSaved: boolean;
  postType: 'CRAWLED' | 'MANUAL';
  originalUrl?: string;
  company: {
    companyId: string;
    companyName: string;
    logo: string | null;
    banner: string | null;
    address: string | null;
    description: string | null;
    companySize: number | null;
    websiteUrl: string | null;
  };
}

export default function JobDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [job, setJob] = useState<JobDetails | null>(null);
  const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const fetchJobDetails = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/job-postings/${id}`);
      setJob(data as JobDetails);
      
      const resRelated = await api.get(`/job-postings`, {
        params: {
          limit: 3,
          location: data.locationCity || undefined,
        }
      });
      setRelatedJobs(resRelated.data.items?.filter((j: Job) => j.jobPostingId !== id) || []);
    } catch (error) {
      console.error("Error fetching job details:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/jobs/${id}`);
      return;
    }
    try {
      const { data } = await api.post(`/favorites/toggle/${id}`);
      setJob(prev => prev ? { ...prev, isSaved: data.saved } : null);
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.response?.data?.message || "Vui lòng đăng nhập để lưu việc làm!");
    }
  };

  const handleApply = () => {
    if (job?.postType === 'CRAWLED' && job?.originalUrl) {
      window.open(job.originalUrl, '_blank');
      return;
    }

    if (!isAuthenticated) {
      router.push(`/login?returnUrl=/jobs/${id}`);
    } else {
      setIsApplyModalOpen(true);
    }
  };

  useEffect(() => {
    if (id) fetchJobDetails();
  }, [id, fetchJobDetails]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-40 pb-12 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-50 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-medium">Đang tải chi tiết việc làm...</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-50 pt-40 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Không tìm thấy tin tuyển dụng</h2>
        <button onClick={() => router.back()} className="text-blue-600 font-bold mt-4 hover:underline">
          Quay lại danh sách
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f6] pb-20">
      {/* Breadcrumb Area */}
      <div className="pt-24 max-w-7xl mx-auto px-4 lg:px-6">
        <nav className="flex items-center text-xs text-slate-500 gap-2 mb-6 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
           <Link href="/" className="hover:text-blue-600">Trang chủ</Link>
           <ChevronRight className="w-3 h-3 text-slate-300" />
           <Link href="/jobs" className="hover:text-blue-600">Tìm việc làm {job.locationCity}</Link>
           <ChevronRight className="w-3 h-3 text-slate-300" />
           <span className="text-slate-400 truncate max-w-[300px]">{job.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
           
           {/* Main Column */}
           <div className="lg:col-span-8 space-y-6">
              
              {/* Top Detail Card (Sticky Header feel) */}
              <div className="bg-white rounded-lg p-6 md:p-8 border border-slate-100 shadow-sm">
                 <h1 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 leading-tight">
                    {job.title}
                 </h1>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Mức lương</p>
                          <p className="text-sm font-bold text-slate-900">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Địa điểm</p>
                          <p className="text-sm font-bold text-slate-900">{job.locationCity}, Hà Nội</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <Briefcase className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="text-xs font-medium text-slate-500 mb-1">Kinh nghiệm</p>
                          <p className="text-sm font-bold text-slate-900">{job.experience || 'Không yêu cầu'}</p>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center gap-2 text-xs text-slate-400 mb-8 pb-8 border-b border-slate-50">
                    <Clock className="w-4 h-4" />
                    <span>Hạn nộp hồ sơ: <b>{job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Đang cập nhật'}</b></span>
                 </div>

                  <div className="flex gap-4">
                    {job.hasApplied ? (
                      <button 
                         disabled
                         className="flex-1 py-3 bg-slate-100 text-slate-400 font-bold rounded-md flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed"
                      >
                         <CheckCircle2 className="w-4 h-4 text-green-500" /> Đã ứng tuyển
                      </button>
                    ) : (
                      <button 
                         onClick={handleApply}
                         className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                      >
                         {job.postType === 'CRAWLED' ? (
                           <>
                             <ExternalLink className="w-4 h-4" /> Xem tin gốc
                           </>
                         ) : (
                           <>
                             <Send className="w-4 h-4" /> Ứng tuyển ngay
                           </>
                         )}
                      </button>
                    )}
                     <button 
                        onClick={handleToggleSave}
                        className={`flex-none px-6 py-3 border rounded-md font-bold transition-all flex items-center justify-center gap-2 ${job.isSaved ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                     >
                        <Bookmark className={`w-4 h-4 ${job.isSaved ? 'fill-current' : ''}`} /> {job.isSaved ? 'Đã lưu' : 'Lưu tin'}
                     </button>
                  </div>
              </div>

              {/* Main Content Sections */}
              <div className="bg-white rounded-lg p-6 md:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-32 bg-blue-600" />
                 <h2 className="text-lg font-bold text-slate-900 mb-8 flex items-center gap-3">
                    Chi tiết tin tuyển dụng
                 </h2>

                 <div className="space-y-10">
                    <section>
                       <div className="flex flex-wrap gap-2 mb-6">
                          <span className="px-3 py-1 bg-slate-50 text-slate-500 text-xs rounded border border-slate-100">Kinh doanh / Bán hàng</span>
                          <span className="px-3 py-1 bg-slate-50 text-slate-500 text-xs rounded border border-slate-100">Tư vấn</span>
                          <span className="px-3 py-1 bg-slate-50 text-slate-500 text-xs rounded border border-slate-100">B2C</span>
                       </div>
                    </section>

                    <section>
                       <h3 className="text-md font-bold text-slate-800 mb-4">Mô tả công việc</h3>
                       <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap ml-4 border-l-2 border-slate-50 pl-6">
                          {job.description}
                       </div>
                    </section>

                    <section>
                       <h3 className="text-md font-bold text-slate-800 mb-4">Yêu cầu ứng viên</h3>
                       <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap ml-4 border-l-2 border-slate-50 pl-6">
                          {job.requirements}
                       </div>
                    </section>

                    <section>
                       <h3 className="text-md font-bold text-slate-800 mb-4">Quyền lợi</h3>
                       <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap ml-4 border-l-2 border-slate-50 pl-6">
                          {job.benefits}
                       </div>
                    </section>

                    <section>
                       <h3 className="text-md font-bold text-slate-800 mb-4">Địa điểm làm việc</h3>
                       <div className="text-slate-600 text-sm ml-4 border-l-2 border-slate-50 pl-6">
                          <p className="font-bold mb-1">- {job.locationCity}:</p>
                          <p>{job.company?.address}</p>
                       </div>
                    </section>

                    <section>
                       <h3 className="text-md font-bold text-slate-800 mb-4">Cách thức ứng tuyển</h3>
                       <div className="text-slate-600 text-sm ml-4 border-l-2 border-slate-50 pl-6 mb-8">
                          Ứng viên nộp hồ sơ trực tuyến bằng cách nhấn <b>Ứng tuyển</b> ngay dưới đây.
                       </div>
                       <div className="flex gap-4">
                           {job.hasApplied ? (
                              <button 
                                 disabled
                                 className="px-10 py-3 bg-slate-100 text-slate-400 font-bold rounded-md flex items-center justify-center gap-2 border border-slate-200 cursor-not-allowed"
                              >
                                 <CheckCircle2 className="w-4 h-4 text-green-500" /> Đã ứng tuyển
                              </button>
                           ) : (
                              <button 
                                 onClick={handleApply}
                                 className="px-10 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                              >
                                 {job.postType === 'CRAWLED' ? (
                                   <>
                                     <ExternalLink className="w-4 h-4" /> Xem tin gốc
                                   </>
                                 ) : (
                                   <>
                                     <Send className="w-4 h-4" /> Ứng tuyển ngay
                                   </>
                                 )}
                              </button>
                           )}
                           <button 
                              onClick={handleToggleSave}
                              className={`px-6 py-3 border rounded-md font-bold transition-all flex items-center justify-center gap-2 ${job.isSaved ? 'bg-blue-50 border-blue-500 text-blue-600' : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'}`}
                           >
                              <Bookmark className={`w-4 h-4 ${job.isSaved ? 'fill-current' : ''}`} /> {job.isSaved ? 'Đã lưu' : 'Lưu tin'}
                           </button>
                        </div>
                       <p className="text-[10px] text-slate-400 mt-4 italic">Hạn nộp hồ sơ: {job.deadline ? new Date(job.deadline).toLocaleDateString('vi-VN') : 'Đang cập nhật'}</p>
                    </section>
                 </div>
              </div>

              {/* Security Hint Banner */}
              <div className="bg-blue-50/50 p-4 rounded-lg flex items-center gap-3 border border-blue-100">
                 <ShieldAlert className="w-5 h-5 text-blue-500" />
                 <p className="text-xs text-blue-700">
                    Báo cáo tin tuyển dụng: Nếu bạn thấy rằng tin tuyển dụng này không đúng hoặc có dấu hiệu lừa đảo, <Link href="#" className="underline font-bold">hãy phản ánh với chúng tôi.</Link>
                 </p>
              </div>

              {/* CV Banner */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg p-8 flex items-center justify-between text-white overflow-hidden relative group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 scale-150 transition-transform group-hover:scale-[2]" />
                 <div className="relative z-10 flex gap-6 items-center">
                    <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md border border-white/20">
                       <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                       <h4 className="text-xl font-bold mb-1 leading-tight text-white">Số lượng NTD tìm kiếm ứng viên của bạn</h4>
                       <p className="text-sm text-blue-100/80 mb-4 max-w-md">Lên khoảng 13% trong tuần gần đây. Tạo mới CV ngay để không bỏ lỡ cơ hội!</p>
                       <button className="px-6 py-2 bg-blue-400 text-white font-bold rounded text-sm hover:bg-blue-300 transition-all flex items-center gap-2">
                          Tạo CV ngay <ChevronRight className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
                 <div className="hidden lg:block relative z-10">
                    <div className="flex flex-col items-center">
                        <Zap className="w-10 h-10 text-yellow-400 mb-2" />
                       <span className="text-2xl font-black">13%</span>
                    </div>
                 </div>
              </div>

              {/* Feedback Block */}
              <div className="bg-white rounded-lg p-8 border border-slate-100 shadow-sm text-center">
                 <h4 className="font-bold text-slate-800 mb-8">Bạn thấy độ tin cậy và rõ ràng của tin tuyển dụng này thế nào?</h4>
                 <div className="flex justify-center gap-8 md:gap-12 flex-wrap">
                    <div className="flex flex-col items-center gap-3 group cursor-pointer">
                       <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all border border-slate-100">
                          <Frown className="w-6 h-6" />
                       </div>
                       <span className="text-[10px] text-slate-400 font-medium">Không đáng tin</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 group cursor-pointer">
                       <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all border border-slate-100">
                          <Meh className="w-6 h-6" />
                       </div>
                       <span className="text-[10px] text-slate-400 font-medium">Bình thường</span>
                    </div>
                    <div className="flex flex-col items-center gap-3 group cursor-pointer">
                       <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-all border border-slate-100">
                          <Smile className="w-6 h-6" />
                       </div>
                       <span className="text-[10px] text-slate-400 font-medium">Rất tin cậy</span>
                    </div>
                 </div>
              </div>

           </div>

           {/* Sidebar Column */}
           <aside className="lg:col-span-4 space-y-6">
              
              {/* Company Info Box */}
              <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm text-center">
                 <div className="w-20 h-20 bg-white border border-slate-100 rounded-full p-3 flex items-center justify-center mx-auto mb-4 overflow-hidden shadow-sm">
                   {job.company?.logo ? (
                     <img src={job.company.logo} alt={job.company.companyName} className="max-w-full max-h-full object-contain" />
                   ) : (
                     <Building2 className="w-10 h-10 text-slate-200" />
                   )}
                 </div>
                 <h3 className="font-bold text-slate-800 mb-6 uppercase text-sm leading-snug">
                    {job.company?.companyName}
                 </h3>
                 <div className="space-y-4 text-left">
                    <div className="flex items-start gap-4">
                       <Users className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                       <div className="text-xs">
                          <p className="text-slate-400 mb-0.5 tracking-tight">Quy mô:</p>
                          <p className="font-bold text-slate-700">{job.company?.companySize ? `${job.company.companySize} nhân viên` : 'Chưa cập nhật'}</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <Briefcase className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                       <div className="text-xs">
                          <p className="text-slate-400 mb-0.5 tracking-tight">Lĩnh vực:</p>
                          <p className="font-bold text-slate-700">Dược phẩm / Thiết bị y tế</p>
                       </div>
                    </div>
                    <div className="flex items-start gap-4">
                       <MapPin className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                       <div className="text-xs">
                          <p className="text-slate-400 mb-0.5 tracking-tight">Địa điểm:</p>
                          <p className="font-bold text-slate-700 leading-relaxed">{job.company?.address}</p>
                       </div>
                    </div>
                 </div>
                 <Link href={`/companies/${job.companyId}`} className="text-blue-600 text-xs font-bold mt-6 hover:underline flex items-center gap-1 justify-center transition-all">
                    Xem trang công ty <ExternalLink className="w-3 h-3" />
                 </Link>
              </div>

              {/* General Summary Box */}
              <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-6 text-sm flex items-center gap-2">
                    Thông tin chung
                 </h3>
                 <div className="space-y-4">
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                          <GraduationCap className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-[10px] text-slate-400 tracking-tight">Cấp bậc</p>
                          <p className="text-xs font-bold text-slate-700">Nhân viên</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                          <CheckCircle2 className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-[10px] text-slate-400 tracking-tight">Học vấn</p>
                          <p className="text-xs font-bold text-slate-700">Cao đẳng trở lên</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                          <Users className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-[10px] text-slate-400 tracking-tight">Số lượng tuyển</p>
                          <p className="text-xs font-bold text-slate-700">{job.vacancies || '1'} người</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                          <Clock className="w-4 h-4" />
                       </div>
                       <div>
                          <p className="text-[10px] text-slate-400 tracking-tight">Hình thức làm việc</p>
                          <p className="text-xs font-bold text-slate-700 uppercase">{job.jobType ? (JOB_TYPE_LABEL[job.jobType] || job.jobType) : 'Toàn thời gian'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Categories Tags */}
              <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-6 text-sm">Danh mục nghề liên quan</h3>
                 <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] rounded hover:text-blue-600 cursor-pointer border border-slate-100">Kinh doanh / Bán hàng</span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] rounded hover:text-blue-600 cursor-pointer border border-slate-100">Dược phẩm / Thiết bị y tế</span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] rounded hover:text-blue-600 cursor-pointer border border-slate-100">Direct Sales</span>
                 </div>
              </div>

              {/* Tips Section */}
              <div className="bg-white rounded-lg p-6 border border-slate-100 shadow-sm">
                 <h3 className="font-bold text-slate-800 mb-4 text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" /> Bí kíp tìm việc an toàn
                 </h3>
                 <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                    Để hành trình tìm việc của bạn an toàn và hiệu quả, Workly gợi ý một số lưu ý quan trọng dành cho ứng viên:
                 </p>
                 <ul className="space-y-3 text-[11px] text-slate-500">
                    <li className="flex items-start gap-2">
                       <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                       <span>Cẩn thận với các lời mời làm việc với mức lương cao bất thường.</span>
                    </li>
                    <li className="flex items-start gap-2">
                       <Lightbulb className="w-3 h-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                       <span>Không thực hiện bất kỳ giao dịch chuyển tiền nào trước khi ký hợp đồng.</span>
                    </li>
                 </ul>
                 <button className="w-full mt-6 py-2 border border-blue-600 text-blue-600 font-bold rounded text-[11px] hover:bg-blue-50 transition-all uppercase tracking-tight">
                    Tìm hiểu thêm
                 </button>
              </div>

           </aside>
        </div>

        {/* Bottom Detailed Related List */}
        <div className="mt-12 space-y-6">
           <h3 className="text-lg font-bold text-slate-800 flex items-center gap-3 border-l-4 border-blue-600 pl-4 py-1">
              Việc làm liên quan
           </h3>
           <div className="grid grid-cols-1 gap-4">
              {relatedJobs.length > 0 ? (
                relatedJobs.map((rj) => (
                  <JobCard key={rj.jobPostingId} job={rj} />
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 italic">Không tìm thấy việc làm liên quan</div>
              )}
           </div>
        </div>

      </div>

      {/* Re-using Apply Modal */}
      <JobApplyModal 
        isOpen={isApplyModalOpen} 
        onClose={() => setIsApplyModalOpen(false)} 
        jobTitle={job.title}
        companyName={job.company?.companyName}
        jobPostingId={job.jobPostingId}
        onSuccess={() => setJob(prev => prev ? { ...prev, hasApplied: true } : null)}
      />
    </div>
  );
}
