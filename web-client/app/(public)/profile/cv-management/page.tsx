"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  Upload,
  Loader2,
  Trash2,
  CheckCircle2,
  Plus,
  LayoutDashboard,
  Shield,
  ExternalLink,
  Search,
  PenLine,
  Sparkles,
  Award,
  Zap,
  Clock,
  MoreVertical,
  Activity,
  ArrowRight,
  Eye,
  FileSearch,
  Settings2,
  Star,
  Copy,
  Download,
  Info
} from "lucide-react";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";
import { useAuthStore } from "@/stores/auth";
import { CVReviewModal } from "@/components/candidates/CVReviewModal";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

// Helper để tính toán độ mạnh hồ sơ (%), dựa trên parsedData
const calculateProfileStrength = (parsedData: any) => {
  if (!parsedData) return 20; // Default min 20%
  let points = 20;
  if (parsedData.fullName) points += 10;
  if (parsedData.email && parsedData.phone) points += 10;
  if (parsedData.summary) points += 10;
  if (parsedData.skills?.length >= 3) points += 15;
  if (parsedData.experience?.length >= 1) points += 15;
  if (parsedData.education?.length >= 1) points += 20;
  return Math.min(points, 100);
};

const getProgressBarColor = (strength: number) => {
  if (strength >= 80) return "bg-emerald-500";
  if (strength >= 50) return "bg-blue-500";
  return "bg-orange-500";
};

export default function CvManagementPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // States cho Upload mới
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState("");
  const [cvTitle, setCvTitle] = useState("");
  const [cvId, setCvId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login?redirect=/profile/cv-management");
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
      console.error("Failed to load profile", err);
      toast.error("Không thể tải thông tin hồ sơ.");
    } finally {
      if (!silent) setLoadingProfile(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading("Đang bóc tách CV...");
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
    if (!confirm("Bạn có chắc chắn muốn xóa CV này?")) return;

    const toastId = toast.loading("Đang xóa CV...");
    try {
      await profileApi.deleteCv(cvId);
      toast.success("Đã xóa CV thành công", { id: toastId });
      fetchProfile(true); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa CV", { id: toastId });
    }
  };

  const handleSetMainCv = async (cvId: string) => {
    const toastId = toast.loading("Đang cập nhật CV mặc định...");
    try {
      await profileApi.setMainCv(cvId);
      toast.success("Đã cập nhật CV mặc định", { id: toastId });
      fetchProfile(true); 
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi cập nhật CV mặc định", { id: toastId });
    }
  };

  const cvs = (profile?.candidate?.cvs || []).filter(cv => 
    cv.cvTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const mainCv = (profile?.candidate?.cvs || []).find(cv => cv.isMain);

  if (authLoading || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1F5F9]">
        <div className="flex flex-col items-center gap-3">
           <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
           <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Utility Top Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-tighter flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                  <FileText className="w-5 h-5" />
                </div>
                Manage Documents
              </h1>
              <nav className="hidden md:flex items-center gap-6">
                 <Link href="/profile" className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Dashboard</Link>
                 <Link href="/profile/cv-management" className="text-sm font-black text-blue-600">CV & Portfolio</Link>
                 <Link href="/profile/account" className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">Settings</Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
               <button onClick={() => router.push('/cv-builder')} className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-blue-100 transition-all border border-blue-100">
                  <Plus className="w-4 h-4" /> Build New CV
               </button>
               <label htmlFor="cv-upload-head" className="cursor-pointer bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import PDF
               </label>
               <input type="file" id="cv-upload-head" className="hidden" accept=".pdf" onChange={handleFileUpload} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 lg:px-8 py-10">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Main List Column (Left - 70%) */}
          <section className="flex-1 space-y-8 animate-in slide-in-from-left-4 duration-500">
             {/* Action / Search Bar */}
             <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 w-full">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                   <input 
                      type="text" 
                      placeholder="Tìm kiếm hồ sơ theo tên..." 
                      className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 transition-all outline-none font-bold text-slate-700"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                   />
                </div>
                <div className="flex items-center gap-2">
                   <button className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 rounded-xl transition-colors border border-slate-100">
                      <Settings2 className="w-5 h-5" />
                   </button>
                </div>
             </div>

             {/* CV List */}
             <div className="space-y-4">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] px-4">Tất cả bản ghi ({cvs.length})</h2>
                
                {cvs.length > 0 ? (
                  <div className="space-y-4">
                    {cvs.map((cv) => (
                      <motion.div 
                        key={cv.cvId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`bg-white group border rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-center gap-6 transition-all duration-300 ${
                          cv.isMain ? 'border-blue-500 shadow-xl shadow-blue-100/50' : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'
                        }`}
                      >
                         {/* Thumbnail Preview */}
                         <div className="w-full sm:w-32 h-44 sm:h-32 bg-slate-50 rounded-2xl border border-slate-100 shrink-0 overflow-hidden relative group/inner flex items-center justify-center">
                            {cv.fileUrl ? (
                               <>
                                 <iframe src={`${cv.fileUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} className="absolute inset-0 w-full h-[150%] opacity-40 scale-110 pointer-events-none group-hover/inner:opacity-100 transition-opacity" />
                                 <div className="absolute inset-0 bg-slate-900/5 group-hover/inner:bg-transparent transition-colors flex items-center justify-center">
                                    <Eye className="w-6 h-6 text-slate-300 opacity-100 group-hover/inner:opacity-0" />
                                    <Link href={cv.fileUrl} target="_blank" className="p-3 bg-white text-slate-800 rounded-full opacity-0 group-hover/inner:opacity-100 scale-90 group-hover/inner:scale-100 transition-all shadow-xl">
                                      <ExternalLink className="w-5 h-5 text-blue-600" />
                                    </Link>
                                 </div>
                               </>
                            ) : (
                               <div className="bg-gradient-to-br from-blue-600 to-indigo-700 w-full h-full flex items-center justify-center">
                                  <Sparkles className="w-8 h-8 text-white/50" />
                               </div>
                            )}
                            {cv.isMain && (
                               <div className="absolute top-2 left-2 p-1 bg-emerald-500 text-white rounded-md shadow-lg shadow-emerald-200 z-10">
                                  <CheckCircle2 className="w-4 h-4" />
                               </div>
                            )}
                         </div>

                         {/* Info */}
                         <div className="flex-1 min-w-0 py-1 space-y-3">
                            <div>
                               <div className="flex items-center gap-2 mb-1">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${cv.fileUrl ? 'bg-slate-100 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                                     {cv.fileUrl ? 'PDF DOCUMENT' : 'VIRTUAL PROFILE'}
                                  </span>
                                  <span className="text-slate-300">•</span>
                                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 uppercase">
                                     <Clock className="w-3 h-3" /> {new Date(cv.createdAt).toLocaleDateString('vi-VN')}
                                  </span>
                               </div>
                               <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight truncate group-hover:text-blue-600 transition-colors" title={cv.cvTitle}>
                                  {cv.cvTitle}
                               </h3>
                            </div>

                            {/* Strength Mini Bar */}
                            <div className="flex items-center gap-4">
                               <div className="flex-1 max-w-[240px]">
                                  <div className="flex justify-between items-center mb-1.5 px-0.5">
                                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Strength</span>
                                     <span className="text-[10px] font-black text-slate-600">{calculateProfileStrength(cv.parsedData)}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                     <motion.div 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${calculateProfileStrength(cv.parsedData)}%` }}
                                        className={`h-full rounded-full ${getProgressBarColor(calculateProfileStrength(cv.parsedData))}`} 
                                     />
                                  </div>
                               </div>
                               {calculateProfileStrength(cv.parsedData) >= 80 && (
                                 <div className="border border-emerald-100 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1.5">
                                    <Award className="w-3.5 h-3.5" /> VERIFIED
                                 </div>
                               )}
                            </div>
                         </div>

                         {/* Actions Divider (Mobile hidden) */}
                         <div className="hidden sm:block h-20 w-px bg-slate-100" />

                         {/* Right Actions */}
                         <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 self-center">
                            {!cv.isMain ? (
                               <button 
                                  onClick={() => handleSetMainCv(cv.cvId)}
                                  className="flex-1 sm:flex-none px-5 py-3 bg-slate-50 hover:bg-slate-900 hover:text-white border border-slate-100 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95"
                               >
                                  Set Main
                               </button>
                            ) : (
                               <div className="px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[11px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-2">
                                  <Star className="w-4 h-4 fill-emerald-500" /> Active
                               </div>
                            )}
                            
                            <div className="flex items-center gap-2">
                               <button 
                                  onClick={() => handleDeleteCv(cv.cvId)}
                                  disabled={cv.isMain}
                                  className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all ${
                                     cv.isMain 
                                     ? "bg-slate-50/50 text-slate-200 border border-slate-100 cursor-not-allowed" 
                                     : "bg-red-50 text-red-500 hover:bg-red-500 hover:text-white border border-red-100"
                                  }`}
                               >
                                  <Trash2 className="w-5 h-5" />
                               </button>
                               <button className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-400 hover:border-blue-300 hover:text-blue-600 transition-all">
                                  <MoreVertical className="w-5 h-5" />
                               </button>
                            </div>
                         </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white border-2 border-dashed border-slate-200 rounded-[3rem] p-20 flex flex-col items-center text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mb-6">
                         <FileSearch className="w-10 h-10" />
                      </div>
                      <h3 className="text-xl font-black text-slate-800 mb-2">No documents found</h3>
                      <p className="text-slate-500 text-sm max-w-xs font-medium">Try searching for something else or upload a new CV to get started.</p>
                  </div>
                )}
             </div>
          </section>

          {/* Smart Sidebar (Right - 30%) */}
          <aside className="w-full lg:w-[400px] space-y-6">
             <div className="sticky top-24 space-y-6 animate-in slide-in-from-right-4 duration-500">
                
                {/* Active CV Quick Snapshot */}
                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden group shadow-2xl shadow-slate-300">
                   {/* Background Elements */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                   
                   <div className="relative z-10 space-y-6">
                      <div className="flex justify-between items-start">
                         <div className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center">
                            <Star className="w-7 h-7 text-yellow-400 fill-yellow-400" />
                         </div>
                         <Link href={mainCv?.fileUrl || "#"} className="text-xs font-black text-blue-400 hover:underline uppercase tracking-widest flex items-center gap-1.5">
                            View Details <ArrowRight className="w-3.5 h-3.5" />
                         </Link>
                      </div>

                      <div>
                         <h3 className="text-2xl font-black tracking-tight mb-2 line-clamp-1">{mainCv?.cvTitle || "No Active CV"}</h3>
                         <div className="flex items-center gap-2 text-slate-400">
                            <Activity className="w-4 h-4 text-emerald-400" />
                            <span className="text-[11px] font-bold uppercase tracking-widest leading-none mt-0.5">Primary Ranking Profile</span>
                         </div>
                      </div>

                      <div className="h-px bg-white/10" />

                      <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Skill Score</div>
                            <p className="text-xl font-black">{mainCv ? calculateProfileStrength(mainCv.parsedData) : 0}%</p>
                         </div>
                         <div className="space-y-1">
                            <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Applications</div>
                            <p className="text-xl font-black">{profile?.candidate?.applications?.length || 0}</p>
                         </div>
                      </div>

                      <button onClick={() => router.push('/cv-builder')} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-colors">
                         Edit Data manually
                      </button>
                   </div>
                </div>

                {/* AI Improvement Advisor */}
                <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                         <Zap className="w-5 h-5" />
                      </div>
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">AI Recommendation</h4>
                   </div>

                   <p className="text-slate-500 text-sm leading-relaxed font-medium">
                      {mainCv && calculateProfileStrength(mainCv.parsedData) < 90 
                        ? "Hồ sơ chính của bạn đang thiếu mục Kinh nghiệm chi tiết. Hãy bổ sung để thu hút thêm 45% sự chú ý từ nhà tuyển dụng."
                        : "Hồ sơ của bạn đã đạt hạng Gold. Bạn đang xếp hạng cao hơn 85% ứng viên trong khu vực."}
                   </p>

                   <div className="space-y-3">
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer hover:bg-white hover:border-blue-200 transition-all">
                         <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 border border-emerald-200 group-hover:scale-110 transition-transform">
                            <Copy className="w-4 h-4" />
                         </div>
                         <div>
                            <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Duplicate Template</div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Quickly create variants</p>
                         </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer hover:bg-white hover:border-blue-200 transition-all">
                         <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 border border-blue-200 group-hover:scale-110 transition-transform">
                            <Download className="w-4 h-4" />
                         </div>
                         <div>
                            <div className="text-[11px] font-black text-slate-800 uppercase tracking-tight">Export PDF v2.0</div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Convert Digital to PDF</p>
                         </div>
                      </div>
                   </div>

                   <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                      <Info className="w-5 h-5 text-amber-500 shrink-0" />
                      <p className="text-[11px] font-bold text-amber-800 leading-tight">Mẹo: Sử dụng CV duy nhất cho mỗi vị trí ứng tuyển để tăng tỷ lệ phản hồi.</p>
                   </div>
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
          fetchProfile(true); 
          toast.success("Dữ liệu đã được đồng bộ!");
        }}
      />
    </div>
  );
}
