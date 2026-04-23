"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  Building2, 
  MapPin, 
  Globe, 
  BadgeCheck, 
  AlertCircle, 
  CalendarDays,
  Briefcase,
  Users,
  Share2,
  Heart,
  ChevronRight,
  ShieldCheck,
  Zap,
  Camera,
  Star,
  ExternalLink,
  Info,
  Navigation
} from "lucide-react";
import api from "@/lib/api";
import dynamic from 'next/dynamic';
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { JobCard } from "@/components/JobCard";

const JobMap = dynamic(() => import('@/components/JobMap'), { ssr: false });

// Mock data for missing backend fields
const MOCK_BENEFITS = [
  { icon: "🏥", title: "Bảo hiểm sức khỏe", desc: "Gói bảo hiểm PVI cao cấp cho nhân viên và người thân." },
  { icon: "⚽", title: "Hoạt động ngoại khóa", desc: "Câu lạc bộ bóng đá, cầu lông, yoga và du lịch hàng năm." },
  { icon: "📚", title: "Đào tạo & Phát triển", desc: "Hỗ trợ chi phí học tập và các khóa đào tạo chuyên sâu." },
  { icon: "🍩", title: "Ăn nhẹ & Trà chiều", desc: "Tea break hàng ngày với trái cây và bánh ngọt." }
];

const MOCK_GALLERY = [
  "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=800"
];

const MOCK_RATINGS = {
  score: 4.8,
  count: 124,
  criteria: [
    { label: "Môi trường làm việc", value: 95 },
    { label: "Lương thưởng & Phúc lợi", value: 88 },
    { label: "Cơ hội thăng tiến", value: 92 },
    { label: "Văn hóa công ty", value: 96 }
  ]
};

export default function CompanyDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowed, setIsFollowed] = useState(false);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const { data } = await api.get(`/companies/${id}`);
        setCompany(data);
      } catch (error) {
        console.error("Failed to load company:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin shadow-lg"></div>
          <p className="text-slate-400 font-bold animate-pulse">Luminous Ether is loading...</p>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <Building2 className="w-20 h-20 text-slate-200 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-slate-800">Doanh nghiệp không tồn tại</h2>
          <p className="text-slate-500 mt-2 max-w-sm">Hồ sơ này có thể đã bị gỡ bỏ hoặc quyền truy cập của bạn bị hạn chế.</p>
          <button 
            onClick={() => router.push("/companies")}
            className="mt-8 px-8 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition shadow-xl shadow-blue-200 active:scale-95"
          >
            Quay lại khám phá
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header & Hero Section */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-[280px] md:h-[350px] w-full overflow-hidden">
          <Image 
            src={company.banner || "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=2000"} 
            alt="Banner" 
            fill
            className="object-cover brightness-75 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-black/30" />
        </div>

        {/* Brand Bar */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 relative -mt-16 sm:-mt-20">
          <div className="bg-white/80 backdrop-blur-xl rounded-[32px] p-6 shadow-2xl shadow-slate-200/50 border border-white/40">
            <div className="flex flex-col lg:flex-row gap-6 lg:items-end">
              {/* Logo Overlay */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 sm:w-32 sm:h-32 bg-white rounded-[24px] shadow-xl border border-white p-3 flex items-center justify-center shrink-0 -mt-12 sm:-mt-16 z-20"
              >
                {company.logo ? (
                  <Image 
                    src={company.logo} 
                    alt={company.companyName} 
                    width={100} 
                    height={100} 
                    className="w-full h-full object-contain" 
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-slate-200" />
                )}
              </motion.div>

              {/* Info Stack */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-3 mb-1">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
                    {company.companyName}
                  </h1>
                  {company.verifyStatus === 1 && (
                    <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg shadow-emerald-200">
                      <BadgeCheck className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <p className="text-slate-400 font-bold text-[14px] uppercase tracking-wider mb-4">
                  {company.mainIndustry || "Đa ngành kiến tạo"}
                </p>

                <div className="flex flex-wrap gap-y-3 gap-x-6 text-[14px] font-bold text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-mariner" />
                    <span>{company.address?.split(',').pop()?.trim() || "Toàn quốc"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-mariner" />
                    <span>{company.jobPostings?.length || 0} Vị trí ứng tuyển</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-mariner" />
                    <span>{company.companySize || "100+"} Nhân sự</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 shrink-0 pt-4 lg:pt-0">
                <button 
                  onClick={() => setIsFollowed(!isFollowed)}
                  className={`flex-1 sm:flex-none px-8 py-3 rounded-2xl font-black text-[14px] transition-all flex items-center justify-center gap-2 h-[52px] ${
                    isFollowed 
                    ? "bg-slate-100 text-slate-600" 
                    : "bg-mariner text-white shadow-xl shadow-blue-200 hover:scale-105 active:scale-95"
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isFollowed ? "fill-current" : ""}`} />
                  {isFollowed ? "Đã quan tâm" : "Quan tâm"}
                </button>
                <div className="flex gap-2">
                  <button className="w-[52px] h-[52px] flex items-center justify-center bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-mariner hover:border-mariner transition-all shadow-sm">
                    <Share2 className="w-5 h-5" />
                  </button>
                  {company.websiteUrl && (
                    <a 
                      href={company.websiteUrl} 
                      target="_blank" 
                      className="w-[52px] h-[52px] flex items-center justify-center bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-mariner hover:border-mariner transition-all shadow-sm"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Hiring Section */}
            <motion.section 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-3">
                  <Zap className="w-6 h-6 text-orange-500 fill-orange-500" />
                  Việc đang tuyển ({company.jobPostings?.length || 0})
                </h2>
                <Link href="#" className="text-mariner font-black text-[14px] hover:underline flex items-center gap-1 group">
                  Xem tất cả <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {company.jobPostings?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {company.jobPostings.map((job: any) => (
                    <JobCard key={job.jobPostingId} job={{ ...job, company }} />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-slate-100">
                  <Briefcase className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">Hiện không có vị trí nào đang tuyển</p>
                </div>
              )}
            </motion.section>

            {/* Intro Section */}
            <motion.section 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-slate-50"
            >
              <h2 className="text-xl font-black text-slate-900 mb-8 border-l-4 border-mariner pl-4">
                Giới thiệu công ty
              </h2>
              <div className="prose prose-slate max-w-none">
                <div 
                  className="text-slate-600 leading-relaxed font-medium space-y-4 text-[15px]"
                  dangerouslySetInnerHTML={{ __html: company.description || "Chưa có thông tin giới thiệu." }}
                />
              </div>
              
              {/* Photo Gallery Mock */}
              <div className="mt-12">
                <h3 className="text-[14px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  Không gian làm việc
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {MOCK_GALLERY.map((src, i) => (
                    <motion.div 
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      className="aspect-square relative rounded-2xl overflow-hidden shadow-lg"
                    >
                      <Image src={src} alt="Office" fill className="object-cover" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.section>

            {/* Benefits Section Mock */}
            <motion.section 
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="bg-white rounded-[32px] p-8 md:p-10 shadow-sm border border-slate-50"
            >
              <h2 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                Phúc lợi & Chế độ đãi ngộ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {MOCK_BENEFITS.map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-[24px] bg-slate-50 border border-slate-50 hover:border-blue-100 transition-colors">
                    <span className="text-3xl shrink-0">{item.icon}</span>
                    <div>
                      <h4 className="font-black text-slate-800 text-[15px] mb-1">{item.title}</h4>
                      <p className="text-slate-500 text-[13px] font-medium leading-normal">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>

          </div>

          {/* Sidebar (Right) */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Quick Info Widget */}
            <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Info className="w-5 h-5 text-mariner" />
                Dữ liệu doanh nghiệp
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tên quốc tế</label>
                  <p className="text-[14px] font-bold text-slate-800">{company.internationalName || company.companyName}</p>
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Mã số thuế</label>
                  <p className="text-[14px] font-bold text-slate-800">{company.taxCode || "Đang cập nhật"}</p>
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Loại hình</label>
                  <p className="text-[14px] font-bold text-slate-800">{company.enterpriseType || "Công ty Cổ phần"}</p>
                </div>
                <div>
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Ngày thành lập</label>
                  <p className="text-[14px] font-bold text-slate-800">{company.operatingDate || "Dữ liệu mật"}</p>
                </div>
              </div>
            </section>

            {/* Location & Map Widget */}
            <section className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 overflow-hidden">
              <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                <Navigation className="w-5 h-5 text-mariner" />
                Vị trí & Chi nhánh
              </h3>
              
              <div className="space-y-6 mb-8">
                {company.branches?.length > 0 ? (
                  company.branches.map((b: any, idx: number) => (
                    <div key={b.branchId} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 text-mariner flex items-center justify-center shrink-0 font-black text-[13px] border border-blue-100 group-hover:bg-mariner group-hover:text-white transition-colors">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-[14px] font-black text-slate-800">{b.name}</h4>
                        <p className="text-[12px] font-medium text-slate-500 mt-1 leading-relaxed">{b.address}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <MapPin className="w-5 h-5 text-slate-300" />
                    <p className="text-[13px] font-medium text-slate-500">{company.address || "Trụ sở chính chưa cập nhật"}</p>
                  </div>
                )}
              </div>

              {company.branches?.length > 0 && (
                <div className="h-[280px] w-full rounded-[24px] overflow-hidden border border-slate-100 grayscale hover:grayscale-0 transition-all duration-500">
                  <JobMap branches={company.branches} />
                </div>
              )}
            </section>

            {/* Ratings Summary Mock */}
            <section className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[32px] p-8 shadow-xl text-white">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h3 className="text-xl font-black mb-1">Đánh giá</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-amber-400">{MOCK_RATINGS.score}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= 4 ? "fill-amber-400 text-amber-400" : "text-slate-600"}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-[12px] font-bold text-slate-400">{MOCK_RATINGS.count} nhận xét</p>
              </div>

              <div className="space-y-4">
                {MOCK_RATINGS.criteria.map((c, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[11px] font-black uppercase tracking-widest mb-1.5 opacity-60">
                      <span>{c.label}</span>
                      <span>{c.value}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: `${c.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className="h-full bg-amber-400 rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button className="w-full mt-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[14px] font-black transition-all">
                Viết đánh giá của bạn
              </button>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
