"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, Briefcase, Zap, Star, Users, Building2, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import { INDUSTRY_TAG_MAP, LOCATIONS } from "@/lib/constants";

export function HeroSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [industry, setIndustry] = useState("");
  const [location, setLocation] = useState("");

  const quickSearches = [
    "Việc làm Hà Nội",
    "Việc làm TPHCM",
    "Việc làm Marketing",
    "Việc làm Kế toán",
    "Tuyển dụng nhà hàng"
  ];

  const industries = Object.keys(INDUSTRY_TAG_MAP);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("search", keyword);
    if (industry) params.set("industry", industry);
    if (location) params.set("location", location);
    router.push(`/jobs?${params.toString()}`);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="w-full bg-gradient-to-br from-[#f8faff] via-white to-[#f0f5ff] py-16 md:py-24 px-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl -z-1" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-80 h-80 bg-indigo-100/30 rounded-full blur-3xl -z-1" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto flex flex-col items-center text-center space-y-10"
      >
        {/* Eyebrow and Headline */}
        <div className="space-y-4 max-w-3xl">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold tracking-wide uppercase border border-blue-100/50"
          >
            <Star className="w-3 h-3 fill-blue-600" />
            Nền tảng tìm việc hàng đầu Việt Nam
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-5xl lg:text-6xl font-black text-[#1e293b] leading-[1.1] tracking-tight"
          >
            Khám phá
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 px-2 underline decoration-blue-200/50">100,000+</span>
            cơ hội nghề nghiệp mơ ước
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-slate-500 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed"
          >
            Kết nối ứng viên với hàng ngàn nhà tuyển dụng uy tín và môi trường làm việc chuyên nghiệp nhất.
          </motion.p>
        </div>

        {/* Enhanced Search Bar */}
        <motion.div
          variants={itemVariants}
          className="w-full max-w-5xl bg-white p-2 rounded-2xl md:rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-blue-50/50 flex flex-col md:flex-row items-stretch md:items-center gap-1.5"
        >
          {/* Keyword Input */}
          <div className="flex-[1.5] group flex items-center gap-3 px-5 py-3.5 md:py-0 hover:bg-slate-50/80 rounded-xl md:rounded-l-full transition-all">
            <Search className="w-5 h-5 text-blue-500 shrink-0" />
            <input
              type="text"
              placeholder="Vị trí ứng tuyển, kỹ năng..."
              className="w-full bg-transparent outline-none text-slate-700 font-bold placeholder:text-slate-400 placeholder:font-medium text-[15px]"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          <div className="hidden md:block w-px h-8 bg-slate-100" />

          {/* Industry Selection */}
          <div className="flex-1 group flex items-center gap-3 px-5 py-3.5 md:py-0 hover:bg-slate-50/80 transition-all">
            <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <select
                className="w-full bg-transparent outline-none text-slate-700 font-bold appearance-none cursor-pointer text-[15px] pr-4 line-clamp-1"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">Tất cả ngành nghề</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden md:block w-px h-8 bg-slate-100" />

          {/* Location Selection */}
          <div className="flex-1 group flex items-center gap-3 px-5 py-3.5 md:py-0 hover:bg-slate-50/80 transition-all md:mr-1">
            <MapPin className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <select
                className="w-full bg-transparent outline-none text-slate-700 font-bold appearance-none cursor-pointer text-[15px] pr-4"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Địa điểm</option>
                {LOCATIONS.map((loc: string) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={handleSearch}
            className="whitespace-nowrap px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl md:rounded-full flex items-center justify-center gap-2.5 transition-all active:scale-[0.97] shadow-lg shadow-blue-200"
          >
            <Search className="w-5 h-5 stroke-[3px]" />
            <span>Tìm việc</span>
          </button>
        </motion.div>

        {/* Quick Tags and Stats */}
        <div className="w-full max-w-4xl space-y-8">
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <span className="text-slate-400 font-bold text-xs uppercase tracking-widest mr-2">Gợi ý mới:</span>
            {quickSearches.map((tag, idx) => (
              <Link
                key={idx}
                href={`/jobs?search=${tag}`}
                className="text-[13px] font-bold text-slate-600 hover:text-blue-600 hover:bg-white hover:shadow-md px-4 py-2 rounded-xl bg-slate-100/50 border border-transparent hover:border-blue-100 transition-all flex items-center gap-1.5 group"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                {tag}
              </Link>
            ))}
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="pt-4 flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500"
          >
            <div className="flex items-center gap-2.5">
              <Building2 className="w-5 h-5 text-slate-800" />
              <div className="text-left">
                <p className="text-lg font-black text-slate-800 leading-none">5,000+</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Doanh nghiệp</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="w-5 h-5 text-slate-800" />
              <div className="text-left">
                <p className="text-lg font-black text-slate-800 leading-none">2 Triệu+</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Ứng viên</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-5 h-5 text-slate-800" />
              <div className="text-left">
                <p className="text-lg font-black text-slate-800 leading-none">1,200+</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Việc làm mới/ngày</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
