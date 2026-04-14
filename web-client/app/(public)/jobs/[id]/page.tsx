"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
   Globe,
   Target,
} from "lucide-react";
import dynamic from 'next/dynamic';

const JobMap = dynamic(() => import('@/components/JobMap'), { ssr: false });
import api from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatSalary, timeAgo } from "@/lib/utils";
import { JOB_TYPE_LABEL } from "@/lib/constants";
import { JobCard, Job } from "@/components/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { useAuthStore } from "@/stores/auth";
import { useFavoriteStore } from "@/stores/favorites";

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
   branches?: any[];
   matchScore?: number | null;
   company: {
      companyId: string;
      companyName: string;
      logo: string | null;
      banner: string | null;
      address: string | null;
      description: string | null;
      companySize: number | null;
      websiteUrl: string | null;
      verifyStatus?: number;
   };
}

export default function JobDetailsPage() {
   const { id } = useParams();
   const router = useRouter();
   const [job, setJob] = useState<JobDetails | null>(null);
   const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
   const [loading, setLoading] = useState(true);
   const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
   const { isAuthenticated, user } = useAuthStore();
   const { favoriteIds, toggleFavorite, isInitialized, fetchFavorites } = useFavoriteStore();

   // Sync with global favorites
   const isSaved = job ? favoriteIds.has(job.jobPostingId) : false;

   const fetchJobDetails = useCallback(async () => {
      setLoading(true);
      try {
         let trackView = true;
         if (typeof window !== 'undefined') {
            try {
               const viewedStr = sessionStorage.getItem('viewedJobs') || '[]';
               const viewedJobs = Array.isArray(JSON.parse(viewedStr)) ? JSON.parse(viewedStr) : [];
               if (viewedJobs.includes(id)) {
                  trackView = false;
               } else {
                  viewedJobs.push(id);
                  sessionStorage.setItem('viewedJobs', JSON.stringify(viewedJobs));
               }
            } catch (e) {
               console.error("Session storage error:", e);
            }
         }

         const { data } = await api.get(`/job-postings/${id}`, {
            params: { trackView },
         });
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
      if (!job) return;

      try {
         await toggleFavorite(job);
      } catch (error: any) {
         console.error("Save error:", error);
         toast.error(error.message || "Đã có lỗi xảy ra khi lưu việc làm!");
      }
   };

   const handleApply = useCallback(() => {
      if (job?.postType === 'CRAWLED' && job?.originalUrl) {
         window.open(job.originalUrl, '_blank');
         return;
      }

      if (!isAuthenticated) {
         router.push(`/login?returnUrl=/jobs/${id}`);
         return;
      }

      setIsApplyModalOpen(true);
   }, [job, isAuthenticated, router, id]);

   const searchParams = useSearchParams();

   useEffect(() => {
      if (searchParams.get("apply") === "true" && job && !loading && !job.hasApplied) {
         handleApply();
      }
   }, [searchParams, job, loading, handleApply]);

   useEffect(() => {
      if (isAuthenticated && !isInitialized) {
         fetchFavorites();
      }
   }, [isAuthenticated, isInitialized, fetchFavorites]);

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
                           <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <DollarSign className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Mức lương</p>
                              <p className="text-[17px] font-bold text-emerald-600">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-4">
                           <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                              <MapPin className="w-6 h-6" />
                           </div>
                           <div>
                              <p className="text-xs font-medium text-slate-500 mb-1">Địa điểm</p>
                              <p className="text-sm font-bold text-slate-900">{job.locationCity || 'Xem chi nhánh phía dưới'}</p>
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
                        {job.matchScore != null && (
                           <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-fuchsia-50 text-fuchsia-600 rounded-full flex items-center justify-center flex-shrink-0">
                                 <Target className="w-6 h-6" />
                              </div>
                              <div>
                                 <p className="text-xs font-medium text-slate-500 mb-1">Độ phù hợp AI</p>
                                 <p className="text-[17px] font-bold text-fuchsia-600">{job.matchScore}%</p>
                              </div>
                           </div>
                        )}
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
                        <motion.button
                           onClick={handleToggleSave}
                           whileTap={{ scale: 0.95 }}
                           whileHover={{ scale: 1.02 }}
                           className={`flex-none px-8 py-3 border rounded-xl font-bold transition-all flex items-center justify-center gap-2 group relative overflow-hidden ${isSaved
                              ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm shadow-blue-100'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 shadow-sm hover:shadow-md'
                              }`}
                        >
                           <AnimatePresence mode="wait">
                              <motion.div
                                 key={isSaved ? 'saved' : 'unsaved'}
                                 initial={{ y: 5, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 exit={{ y: -5, opacity: 0 }}
                                 transition={{ duration: 0.15 }}
                                 className="flex items-center gap-2"
                              >
                                 <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current scale-110' : 'group-hover:scale-110 transition-transform'}`} />
                                 <span>{isSaved ? 'Đã lưu' : 'Lưu tin'}</span>
                              </motion.div>
                           </AnimatePresence>
                        </motion.button>
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
                           <div 
                              className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap ml-4 border-l-2 border-slate-50 pl-6 prose prose-slate prose-sm max-w-none" 
                              dangerouslySetInnerHTML={{ __html: job.description || '' }} 
                           />
                        </section>

                        <section>
                           <h3 className="text-md font-bold text-slate-800 mb-4">Yêu cầu ứng viên</h3>
                           <div 
                              className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap ml-4 border-l-2 border-slate-50 pl-6 prose prose-slate prose-sm max-w-none" 
                              dangerouslySetInnerHTML={{ __html: job.requirements || '' }} 
                           />
                        </section>

                        <section>
                           <h3 className="text-md font-bold text-slate-800 mb-4">Quyền lợi</h3>
                           <div 
                              className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap ml-4 border-l-2 border-slate-50 pl-6 prose prose-slate prose-sm max-w-none" 
                              dangerouslySetInnerHTML={{ __html: job.benefits || '' }} 
                           />
                        </section>

                        <section>
                           <h3 className="text-md font-bold text-slate-800 mb-4">Địa điểm làm việc</h3>
                           <div className="text-slate-600 text-sm ml-4 border-l-2 border-slate-50 pl-6">
                              <p className="font-bold mb-1">- {job.locationCity}:</p>
                              <p>{job.company?.address}</p>
                           </div>
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

                  {/* Branches & Map */}
                  {(job.branches && job.branches.length > 0) && (
                     <div className="bg-white rounded-lg p-6 md:p-8 border border-slate-100 shadow-sm mt-6">
                        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                           <MapPin className="w-5 h-5 text-blue-600" />
                           Bản Đồ Chỉ Đường & Các Chi Nhánh
                        </h3>
                        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {job.branches.map((b: any) => (
                                <div key={b.branchId} className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-start gap-3">
                                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-bold text-slate-700 text-sm">{b.name}</p>
                                        <p className="text-xs text-slate-500 mt-1">{b.address}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <JobMap branches={job.branches} />
                     </div>
                  )}

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
                     <h3 className="font-bold text-slate-800 mb-6 uppercase text-sm leading-snug flex items-center justify-center gap-2">
                        {job.company?.companyName}
                        {(job.company?.verifyStatus === 1 || job.isVerified) && (
                           <span title="Công ty đã được xác thực" className="flex-shrink-0 flex items-center"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></span>
                        )}
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
                        {job.company?.websiteUrl && (
                           <div className="flex items-start gap-4">
                              <Globe className="w-4 h-4 text-slate-300 mt-0.5 flex-shrink-0" />
                              <div className="text-xs">
                                 <p className="text-slate-400 mb-0.5 tracking-tight">Website:</p>
                                 <a href={job.company.websiteUrl.startsWith('http') ? job.company.websiteUrl : `https://${job.company.websiteUrl}`} target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline break-all">
                                    {job.company.websiteUrl.replace(/^https?:\/\//, '')}
                                 </a>
                              </div>
                           </div>
                        )}
                     </div>
                     {job.company?.description && (
                        <div className="mt-6 pt-6 border-t border-slate-100 text-left">
                           <h4 className="text-sm font-bold text-slate-800 mb-2">Giới thiệu công ty</h4>
                           <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap line-clamp-5">
                              {job.company.description}
                           </p>
                        </div>
                     )}
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
            jobLocationCity={job.locationCity || ''}
            onSuccess={() => setJob(prev => prev ? { ...prev, hasApplied: true } : null)}
         />
      </div>
   );
}
