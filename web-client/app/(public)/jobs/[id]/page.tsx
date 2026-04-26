"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
   GraduationCap,
   Zap,
   ShieldAlert,
   Target,
   ExternalLink,
} from "lucide-react";
import dynamic from 'next/dynamic';

const JobMap = dynamic(() => import('@/components/JobMap'), { ssr: false });
import api from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";
import { formatSalary, timeAgo } from "@/lib/utils";
import { JOB_TYPE_LABEL } from "@/lib/constants";
import { MOCK_URGENT_JOBS, MOCK_RECOMMENDED_JOBS, MOCK_FEATURED_JOBS } from "@/lib/mock-data";
import { JobCard, Job } from "@/components/JobCard";
import { JobApplyModal } from "@/components/jobs/JobApplyModal";
import { useAuthStore } from "@/stores/auth";
import { useFavoriteStore } from "@/stores/favorites";

// Industry keyword map
const INDUSTRY_TAG_MAP: Record<string, string[]> = {
   'CNTT / Phần mềm': ['frontend', 'backend', 'developer', 'dev ', 'lập trình', 'software', 'react', 'nodejs', 'java', 'python', 'devops', 'data', 'mobile', 'flutter', 'fullstack', 'qa', 'tester', 'scrum', 'công nghệ thông tin', 'typescript', 'golang', 'php', 'ruby', 'swift', 'kotlin', 'angular', 'vue', '.net', 'c++', 'blockchain', 'ai engineer', 'ml engineer'],
   'Marketing / Truyền thông': ['marketing', 'digital marketing', 'brand', 'tiếp thị', 'thị trường', 'google ads', 'facebook ads', 'campaign', 'crm'],
   'Content / SEO': ['content', 'copywriter', 'seo', 'sem', 'social media', 'blog', 'editor'],
   'Tài chính / Kế toán / Ngân hàng': ['kế toán', 'accounting', 'finance', 'tài chính', 'audit', 'kiểm toán', 'ngân hàng', 'banking', 'tax', 'thuế', 'chứng khoán', 'cfo', 'tín dụng', 'giao dịch viên'],
   'Nhân sự / Hành / Pháp lý': ['nhân sự', 'tuyển dụng', 'recruiter', 'hành chính', 'legal', 'pháp lý', 'compliance', 'hr', 'c&b', 'chuyên viên nhân sự', 'luật'],
   'Kinh doanh / CSKH': ['sales', 'kinh doanh', 'telesale', 'business development', 'bán hàng', 'b2b', 'b2c', 'key account', 'chăm sóc khách hàng', 'cskh', 'customer service', 'tư vấn viên', 'telemarketing'],
   'Thiết kế / Sáng tạo': ['graphic', 'thiết kế', 'figma', 'adobe', 'animation', 'ui/ux', 'creative director', 'đồ họa', 'illustrator', 'video editor', 'dựng phim', 'designer'],
   'Kỹ thuật / Cơ khí / Sản xuất': ['cơ khí', 'electrical', 'điện tử', 'automation', 'qc', 'sản xuất', 'manufacturing', 'cnc', 'plc', 'bảo trì', 'điện lạnh', 'kỹ sư', 'vận hành'],
   'Xây dựng / Kiến trúc': ['xây dựng', 'kiến trúc', 'civil engineering', 'mep', 'construction', 'bim', 'autocad', 'thi công', 'giám sát', 'bản vẽ'],
   'Vận tải / Logistics / Cung ứng': ['logistics', 'supply chain', 'xuất nhập khẩu', 'warehouse', 'forwarder', 'procurement', 'vận tải', 'giao nhận', 'lái xe', 'tài xế', 'kho bãi'],
   'Bán lẻ / LFP / Thời trang': ['retail', 'bán lẻ', 'store manager', 'fmcg', 'consumer', 'bán hàng', 'thu ngân', 'cửa hàng', 'thời trang', 'mỹ phẩm', 'trang sức', 'giày da'],
   'Nhà hàng / Khách sạn / Du lịch': ['hotel', 'khách sạn', 'du lịch', 'f&b', 'nhà hàng', 'hospitality', 'chef', 'bếp', 'pha chế', 'barista', 'phục vụ', 'bồi bàn', 'lễ tân', 'tour guide', 'hướng dẫn viên'],
   'Y tế / Dược phẩm / Sức khỏe': ['y tế', 'dược', 'pharma', 'medical', 'nurse', 'điều dưỡng', 'clinic', 'chăm sóc sức khỏe', 'bác sĩ', 'phòng khám', 'trình dược viên'],
   'Giáo dục / Đào tạo / Ngôn ngữ': ['giáo viên', 'teacher', 'gia sư', 'tutor', 'e-learning', 'training', 'biên dịch', 'giáo dục', 'đào tạo', 'giảng viên', 'trợ giảng', 'tiếng anh'],
   'Nông nghiệp / Môi trường': ['nông nghiệp', 'agriculture', 'môi trường', 'thủy sản', 'lâm nghiệp', 'chăn nuôi', 'thú y'],
   'Bất động sản': ['bất động sản', 'real estate', 'property', 'môi giới bất động sản', 'địa ốc', 'căn hộ'],
   'Truyền thông / Sự kiện': ['báo chí', 'journalist', 'public relations', 'media', 'broadcast', 'sự kiện', 'event', 'phóng viên', 'truyền hình'],
   'Thể thao / Làm đẹp / Giải trí': ['gym', 'fitness', 'spa', 'nail', 'làm đẹp', 'game', 'entertainment', 'thẩm mỹ'],
   'Bảo hiểm / Tư vấn': ['bảo hiểm', 'insurance', 'tư vấn bảo hiểm'],
   'Đa lĩnh vực / Khác': ['ngo', 'phi chính phủ', 'giúp việc', 'bảo vệ', 'tạp vụ', 'trợ lý', 'thư ký', 'part time', 'bán thời gian']
};

function detectIndustries(title: string, description: string, maxResults = 3): string[] {
   const text = ` ${title} ${description} `.toLowerCase();
   const matched: string[] = [];
   for (const [industry, keywords] of Object.entries(INDUSTRY_TAG_MAP)) {
      if (keywords.some(kw => text.includes(kw.toLowerCase()))) {
         matched.push(industry);
         if (matched.length >= maxResults) break;
      }
   }
   return matched;
}

function inferJobLevel(title: string, description: string): string {
   const text = `${title} ${description}`.toLowerCase();
   if (text.includes("thực tập") || text.includes("intern")) return "Thực tập sinh";
   if (text.includes("trưởng phòng") || text.includes("manager") || text.includes("giám đốc") || text.includes("trưởng nhóm") || text.includes("leader") || text.includes("quản lý")) return "Quản lý / Trưởng nhóm";
   return "Nhân viên / Chuyên viên";
}

function inferEducation(reqs: string): string {
   const text = (reqs || "").toLowerCase();
   if (text.includes("đại học") || text.includes("bachelor")) return "Đại học trở lên";
   if (text.includes("cao đẳng")) return "Cao đẳng trở lên";
   if (text.includes("trung cấp")) return "Trung cấp";
   if (text.includes("thpt") || text.includes("phổ thông") || text.includes("12/12")) return "Tốt nghiệp THPT";
   return "Không yêu cầu bằng cấp";
}

interface JobDetails extends Job {
   companyId: string;
   description: string;
   requirements: string;
   benefits: string;
   vacancies: number | null;
   updatedAt: string;
   hasApplied: boolean;
   isSaved: boolean;
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
   };
   recruiter?: {
      userId: string;
   };
}

const parseToHtml = (text: string) => {
   if (!text) return 'Chưa cập nhật';
   let cleanTxt = text.trim().replace(/^(?:\*\*.*?\*\*|#+)?\s*(?:mô tả công việc|yêu cầu công việc|yêu cầu ứng viên|thông tin chung|quyền lợi)\s*(?::|-)?\s*(?:\*\*.*?\*\*|#+)?\s*\n*/i, '');
   if (cleanTxt.includes('<p>') || cleanTxt.includes('<ul>') || cleanTxt.includes('<li>')) return cleanTxt;
   let html = cleanTxt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
   const lines = html.split('\n');
   let result = '';
   let inList = false;
   for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('* ')) {
         if (!inList) { result += '<ul class="list-disc pl-5 my-2 space-y-1">\n'; inList = true; }
         result += `<li>${line.substring(2)}</li>\n`;
      } else {
         if (inList) { result += '</ul>\n'; inList = false; }
         if (line !== '') result += `<p class="my-2">${line}</p>\n`;
      }
   }
   if (inList) result += '</ul>\n';
   return result;
};

export default function JobDetailsPage() {
   const { id } = useParams();
   const router = useRouter();
   const [job, setJob] = useState<JobDetails | null>(null);
   const [relatedJobs, setRelatedJobs] = useState<Job[]>([]);
   const [loading, setLoading] = useState(true);
   const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
   const { isAuthenticated, user } = useAuthStore();
   const { favoriteIds, toggleFavorite, isInitialized, fetchFavorites } = useFavoriteStore();

   const isSaved = job ? favoriteIds.has(job.jobPostingId) : false;

   const fetchJobDetails = useCallback(async () => {
      setLoading(true);
      try {
         if (typeof id === 'string' && (id.startsWith('u') || id.startsWith('i') || id.startsWith('f') || id.startsWith('m'))) {
            const allMocks = [...MOCK_URGENT_JOBS, ...MOCK_RECOMMENDED_JOBS, ...MOCK_FEATURED_JOBS];
            const foundMock = allMocks.find(j => j.jobPostingId === id);
            if (foundMock) {
               const mockDetails: JobDetails = {
                  ...foundMock,
                  companyId: "mock-company",
                  description: foundMock.description || "Chưa cập nhật mô tả",
                  requirements: foundMock.requirements || "Chưa cập nhật yêu cầu",
                  benefits: foundMock.benefits || "Chưa cập nhật quyền lợi",
                  vacancies: 1,
                  updatedAt: new Date().toISOString(),
                  hasApplied: false,
                  isSaved: false,
                  company: {
                     companyId: "mock-company",
                     companyName: foundMock.company.companyName,
                     logo: foundMock.company.logo,
                     banner: null,
                     address: foundMock.locationCity || "Toàn quốc",
                     description: "Đây là thông tin về công ty đối tác của Workly.",
                     companySize: 100,
                     websiteUrl: "workly.vn",
                  }
               };
               setJob(mockDetails);
               setRelatedJobs(allMocks.filter(j => j.jobPostingId !== id).slice(0, 4));
               setLoading(false);
               return;
            }
         }

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

         const { data } = await api.get(`/job-postings/${id}`, { params: { trackView } });
         setJob(data as JobDetails);

         const detectedIndustries = detectIndustries(data.title, data.description || '', 1);
         const primaryIndustry = detectedIndustries[0];
         const relatedParams: Record<string, any> = { limit: 6 };
         if (primaryIndustry) relatedParams.industry = primaryIndustry;

         const resRelated = await api.get(`/job-postings`, { params: relatedParams });
         const tierOrder: Record<string, number> = { URGENT: 0, PROFESSIONAL: 1, BASIC: 2 };
         const sorted = (resRelated.data.items || [])
            .filter((j: Job) => j.jobPostingId !== id)
            .sort((a: Job, b: Job) => (tierOrder[a.jobTier || 'BASIC'] ?? 2) - (tierOrder[b.jobTier || 'BASIC'] ?? 2));

         if (sorted.length < 2) {
            const fallback = await api.get(`/job-postings`, { params: { limit: 6 } });
            const fallbackSorted = (fallback.data.items || [])
               .filter((j: Job) => j.jobPostingId !== id && !sorted.find((s: Job) => s.jobPostingId === j.jobPostingId))
               .sort((a: Job, b: Job) => (tierOrder[a.jobTier || 'BASIC'] ?? 2) - (tierOrder[b.jobTier || 'BASIC'] ?? 2));
            setRelatedJobs([...sorted, ...fallbackSorted].slice(0, 4));
         } else {
            setRelatedJobs(sorted.slice(0, 4));
         }
      } catch (error) {
         console.error("Error fetching job details:", error);
      } finally {
         setLoading(false);
      }
   }, [id, router]);

   const handleToggleSave = async () => {
      if (!isAuthenticated) { router.push(`/login?returnUrl=/jobs/${id}`); return; }
      if (!job) return;
      if (job.recruiter?.userId === user?.userId) { toast.error("Bạn không thể lưu tin tuyển dụng của chính mình."); return; }
      if (!user?.roles?.includes('CANDIDATE')) { toast.error("Vui lòng sử dụng tài khoản Ứng viên để lưu việc làm."); return; }
      try {
         await toggleFavorite(job);
      } catch (error: any) {
         toast.error(error.message || "Đã có lỗi xảy ra!");
      }
   };

   const handleApply = useCallback(() => {
      if (!isAuthenticated) { router.push(`/login?returnUrl=/jobs/${id}`); return; }
      if (!job) return;
      if (job.recruiter?.userId === user?.userId) { toast.error("Bạn không thể ứng tuyển vào tin tuyển dụng của chính mình."); return; }
      if (!user?.roles?.includes('CANDIDATE')) { toast.error("Vui lòng sử dụng tài khoản Ứng viên."); return; }
      setIsApplyModalOpen(true);
   }, [job, isAuthenticated, user, router, id]);

   const searchParams = useSearchParams();
   useEffect(() => {
      if (searchParams.get("apply") === "true" && job && !loading && !job.hasApplied) handleApply();
   }, [searchParams, job, loading, handleApply]);

   useEffect(() => {
      if (isAuthenticated && !isInitialized) fetchFavorites();
   }, [isAuthenticated, isInitialized, fetchFavorites]);

   useEffect(() => {
      if (id) fetchJobDetails();
   }, [id, fetchJobDetails]);

   if (loading) {
      return (
         <div className="min-h-screen bg-[#f4f7f6] pt-40 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-[#1e60ad] rounded-full animate-spin mb-4" />
            <p className="text-slate-400 font-medium">Đang tải thông tin...</p>
         </div>
      );
   }

   if (!job) {
      return (
         <div className="min-h-screen bg-[#f4f7f6] pt-40 text-center">
            <h2 className="text-2xl font-black text-slate-800">KHÔNG TÌM THẤY TIN TUYỂN DỤNG</h2>
            <button onClick={() => router.push('/jobs')} className="mt-6 px-10 py-3 bg-[#1e60ad] text-white font-black rounded-xl uppercase">
               Trở lại trang chủ
            </button>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-[#f4f7f6] pb-20">
         <div className="pt-24 max-w-7xl mx-auto px-4 lg:px-6">
            {/* Breadcrumb */}
            <nav className="flex items-center text-[13px] text-slate-500 gap-2 mb-6 py-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
               <Link href="/" className="hover:text-[#1e60ad]">Workly</Link>
               <ChevronRight className="w-3.5 h-3.5" />
               <Link href="/jobs" className="hover:text-[#1e60ad]">Việc làm</Link>
               <ChevronRight className="w-3.5 h-3.5" />
               <span className="text-slate-800 font-bold truncate max-w-[300px]">{job.title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
               <div className="lg:col-span-8 space-y-8">
                  {/* Header */}
                  <div className="bg-white rounded-2xl p-6 md:p-10 border border-slate-100 shadow-sm relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-2.5 h-full bg-[#1e60ad]" />
                     <h1 className="text-xl md:text-2xl font-black text-slate-900 leading-tight mb-8">
                        {job.title}
                     </h1>
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-slate-50/50 p-6 rounded-2xl mb-8">
                        <div className="flex flex-col gap-1">
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Mức lương</p>
                           <p className="text-sm font-black text-slate-900">{formatSalary(job.salaryMin, job.salaryMax, job.currency)}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Địa điểm</p>
                           <p className="text-sm font-black text-slate-900">{job.locationCity || 'Toàn quốc'}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kinh nghiệm</p>
                           <p className="text-sm font-black text-slate-900">{job.experience || 'Không yêu cầu'}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                           <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Học vấn</p>
                           <p className="text-sm font-black text-slate-900">{inferEducation(job.requirements)}</p>
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-4">
                        <button onClick={handleApply} disabled={job.hasApplied} className="flex-[2] min-w-[200px] py-4 rounded-xl font-black bg-[#1e60ad] text-white uppercase shadow-lg shadow-blue-100 flex items-center justify-center gap-2">
                           {job.hasApplied ? <CheckCircle2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                           {job.hasApplied ? 'Đã ứng tuyển' : 'Ứng tuyển ngay'}
                        </button>
                        <button className="flex-1 min-w-[150px] py-4 rounded-xl border-2 border-blue-50 text-[#1e60ad] font-black uppercase flex items-center justify-center gap-2">
                           <Send className="w-4 h-4 rotate-45" /> Chat
                        </button>
                        <button onClick={handleToggleSave} className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center ${isSaved ? 'bg-blue-50 border-blue-100 text-[#1e60ad]' : 'border-slate-100 text-slate-400'}`}>
                           <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                        </button>
                     </div>
                  </div>

                  {/* AI Bar */}
                  <div className="bg-gradient-to-r from-orange-500/10 to-white p-6 rounded-2xl border border-orange-100 flex flex-col md:flex-row items-center justify-between gap-6">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                           <Zap className="w-8 h-8 text-white fill-white" />
                        </div>
                        <div>
                           <p className="font-black text-slate-800 uppercase tracking-tight">Kỹ năng của bạn có phù hợp?</p>
                           <p className="text-sm text-slate-500 font-medium">Để AI của Workly phân tích CV và so sánh với yêu cầu!</p>
                        </div>
                     </div>
                     <button className="px-8 py-3 bg-orange-500 text-white font-black rounded-xl uppercase text-sm shadow-xl shadow-orange-200">
                        Kiểm tra ngay
                     </button>
                  </div>

                  {/* Body */}
                  <div className="bg-white rounded-2xl p-8 md:p-10 border border-slate-100 shadow-sm space-y-12">
                     <section>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center gap-3">
                           <div className="w-1.5 h-6 bg-[#1e60ad] rounded-full" /> Mô tả công việc
                        </h2>
                        <div className="text-slate-600 leading-relaxed text-sm pl-5 border-l-2 border-slate-50" dangerouslySetInnerHTML={{ __html: parseToHtml(job.description) }} />
                     </section>
                     <section>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center gap-3">
                           <div className="w-1.5 h-6 bg-[#1e60ad] rounded-full" /> Yêu cầu ứng viên
                        </h2>
                        <div className="text-slate-600 leading-relaxed text-sm pl-5 border-l-2 border-slate-50" dangerouslySetInnerHTML={{ __html: parseToHtml(job.requirements) }} />
                     </section>
                     <section>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-6 flex items-center gap-3">
                           <div className="w-1.5 h-6 bg-[#1e60ad] rounded-full" /> Quyền lợi
                        </h2>
                        <div className="text-slate-600 leading-relaxed text-sm pl-5 border-l-2 border-slate-50" dangerouslySetInnerHTML={{ __html: parseToHtml(job.benefits) }} />
                     </section>
                     <div className="pt-6 border-t border-slate-50 flex gap-4">
                        <button onClick={handleApply} className="flex-1 py-4 bg-[#1e60ad] text-white font-black rounded-xl uppercase">Ứng tuyển ngay</button>
                        <button onClick={handleToggleSave} className="px-8 border-2 border-slate-100 rounded-xl font-black uppercase text-slate-400">Lưu tin</button>
                     </div>
                  </div>

                  {/* Warning */}
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 flex items-start gap-4">
                     <div className="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
                        <ShieldAlert className="w-6 h-6" />
                     </div>
                     <p className="text-sm text-slate-500 font-medium">
                        <span className="font-black text-red-500">CẢNH BÁO:</span> Workly khuyên bạn nên cẩn trọng nếu nhà tuyển dụng yêu cầu nộp bất kỳ loại phí nào. <Link href="#" className="text-red-500 font-black underline">Báo cáo vi phạm</Link> nếu thấy nghi ngờ.
                     </p>
                  </div>
               </div>

               {/* Sidebar */}
               <aside className="lg:col-span-4 space-y-8">
                  <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                     <div className="h-32 bg-[#1e60ad] relative">
                        {job.company.banner && <img src={job.company.banner} className="w-full h-full object-cover opacity-40" alt="" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20" />
                     </div>
                     <div className="px-6 pb-8 text-center">
                        <div className="w-24 h-24 bg-white rounded-2xl p-3 shadow-xl border-4 border-white mx-auto -mt-12 relative z-10 flex items-center justify-center">
                           {job.company.logo ? <img src={job.company.logo} className="max-w-full max-h-full object-contain" alt="" /> : <Building2 className="w-10 h-10 text-slate-200" />}
                        </div>
                        <h3 className="font-black text-slate-900 text-lg mt-5 uppercase line-clamp-2 px-2">{job.company.companyName}</h3>
                        <div className="mt-8 pt-8 border-t border-slate-50 space-y-6 text-left px-2">
                           <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><Briefcase className="w-5 h-5 text-[#1e60ad]" /></div>
                              <div><p className="text-[10px] font-black text-slate-400 uppercase">Lĩnh vực</p><p className="text-sm font-black text-slate-800">{detectIndustries(job.title, job.description)[0] || 'Phát triển phần mềm'}</p></div>
                           </div>
                           <div className="flex gap-4">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0"><MapPin className="w-5 h-5 text-[#1e60ad]" /></div>
                              <div><p className="text-[10px] font-black text-slate-400 uppercase">Địa chỉ</p><p className="text-sm font-black text-slate-800 line-clamp-2">{job.company.address || 'Đang cập nhật'}</p></div>
                           </div>
                        </div>
                        <Link href={`/companies/${job.companyId}`} className="w-full mt-8 py-4 bg-[#1e60ad]/5 text-[#1e60ad] font-black rounded-xl inline-block transition-colors hover:bg-[#1e60ad] hover:text-white uppercase text-sm">Xem trang công ty</Link>
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                     <h3 className="text-base font-black text-slate-900 uppercase mb-8 flex items-center gap-2"><div className="w-1.5 h-4 bg-[#1e60ad] rounded-full" /> Thông tin chung</h3>
                     <div className="space-y-6">
                        <div className="flex gap-5">
                           <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><Clock className="w-6 h-6" /></div>
                           <div><p className="text-[10px] font-black text-slate-400 uppercase">Hình thức</p><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{job.jobType ? (JOB_TYPE_LABEL as any)[job.jobType] : 'Toàn thời gian'}</p></div>
                        </div>
                        <div className="flex gap-5">
                           <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><Target className="w-6 h-6" /></div>
                           <div><p className="text-[10px] font-black text-slate-400 uppercase">Cấp bậc</p><p className="text-sm font-black text-slate-800 uppercase tracking-tight">{inferJobLevel(job.title, job.description)}</p></div>
                        </div>
                     </div>
                  </div>

                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                     <h3 className="text-base font-black text-slate-900 uppercase mb-8 flex items-center gap-2"><div className="w-1.5 h-4 bg-[#1e60ad] rounded-full" /> Việc làm tương tự</h3>
                     <div className="space-y-8">
                        {relatedJobs.slice(0, 4).map(rj => (
                           <Link key={rj.jobPostingId} href={`/jobs/${rj.jobPostingId}`} className="flex gap-4 group">
                              <div className="w-14 h-14 bg-white rounded-xl border border-slate-100 p-2 flex-shrink-0 group-hover:border-blue-200 transition-all flex items-center justify-center">
                                 {rj.company.logo ? <img src={rj.company.logo} className="max-w-full max-h-full object-contain" alt="" /> : <Building2 className="w-6 h-6 text-slate-100" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <h4 className="text-[13px] font-black text-slate-800 leading-tight uppercase line-clamp-2 group-hover:text-[#1e60ad] transition-colors">{rj.title}</h4>
                                 <p className="text-[#1e60ad] font-black text-[12px] mt-1.5">{formatSalary(rj.salaryMin, rj.salaryMax, rj.currency)}</p>
                              </div>
                           </Link>
                        ))}
                     </div>
                  </div>
               </aside>
            </div>
         </div>

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
