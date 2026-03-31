"use client";

import { Search, MapPin, X, Briefcase, LayoutGrid } from "lucide-react";
import { motion, Variants } from "framer-motion";
import { LOCATIONS, HOT_KEYWORDS, INDUSTRY_TAG_MAP } from "@/lib/constants";

interface JobSearchHeroProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  locationParam: string;
  setLocationParam: (val: string) => void;
  industryParam: string;
  setIndustryParam: (val: string) => void;
  handleSearch: (e?: React.FormEvent) => void;
  totalJobs: number;
}

export function JobSearchHero({
  searchQuery,
  setSearchQuery,
  locationParam,
  setLocationParam,
  industryParam,
  setIndustryParam,
  handleSearch,
  totalJobs,
}: JobSearchHeroProps) {
  const industries = Object.keys(INDUSTRY_TAG_MAP);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="bg-[#f8fafc] pt-24 pb-16 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-6">
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* Headline & Stats */}
          <motion.div variants={itemVariants} className="max-w-3xl mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-slate-900 mb-5 tracking-tight leading-[1.2]">
              Tìm Kiếm <span className="text-blue-600">Cơ Hội Nghề Nghiệp</span> Mới
            </h1>
            <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-w-2xl mx-auto">
              Hơn <span className="text-slate-900 font-bold">{totalJobs.toLocaleString()}+</span> tin tuyển dụng chất lượng cao từ các doanh nghiệp hàng đầu đang chờ bạn khám phá.
            </p>
          </motion.div>

          {/* Master Search Card */}
          <motion.div 
            variants={itemVariants} 
            className="w-full max-w-5xl"
          >
            <form
              onSubmit={handleSearch}
              className="bg-white rounded-2xl border border-slate-200 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.06)] flex flex-col md:flex-row items-stretch md:items-center gap-1.5 transition-all duration-300 hover:shadow-[0_25px_60px_rgba(0,0,0,0.1)]"
            >
              {/* Keyword Group */}
              <div className="flex-[1.8] flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 rounded-xl transition-colors group">
                <Search className="w-5 h-5 text-blue-500 shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <span className="block text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Bạn muốn tìm gì?</span>
                  <input
                    type="text"
                    placeholder="Chức danh, kỹ năng, công ty..."
                    className="w-full bg-transparent outline-none text-slate-900 font-bold placeholder:text-slate-400 text-[15px]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="p-1 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              <div className="hidden md:block w-px h-10 bg-slate-100" />

              {/* Industry Group */}
              <div className="flex-1 flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 rounded-xl transition-colors">
                <Briefcase className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <span className="block text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Ngành nghề</span>
                  <select
                    className="w-full outline-none text-slate-900 font-bold text-[15px] bg-transparent cursor-pointer appearance-none truncate pr-4"
                    value={industryParam}
                    onChange={(e) => setIndustryParam(e.target.value)}
                  >
                    <option value="">Tất cả ngành nghề</option>
                    {industries.map((ind) => (
                      <option key={ind} value={ind}>{ind}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="hidden md:block w-px h-10 bg-slate-100" />

              {/* Location Group */}
              <div className="flex-1 flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50 rounded-xl transition-colors md:mr-1">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
                <div className="flex-1 text-left min-w-0">
                  <span className="block text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none mb-1">Địa điểm</span>
                  <select
                    className="w-full outline-none text-slate-900 font-bold text-[15px] bg-transparent cursor-pointer appearance-none"
                    value={locationParam}
                    onChange={(e) => setLocationParam(e.target.value)}
                  >
                    <option value="">Toàn quốc</option>
                    {LOCATIONS.map((l: string) => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98] flex items-center justify-center gap-2.5 min-w-[160px]"
              >
                <Search className="w-5 h-5 stroke-[2.5px]" />
                Tìm kiếm
              </button>
            </form>
          </motion.div>

          {/* Quick Keywords */}
          <motion.div 
            variants={itemVariants}
            className="flex items-center gap-3 mt-10 flex-wrap justify-center"
          >
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              Gợi ý từ khóa:
            </div>
            {HOT_KEYWORDS.map((kw) => (
              <button
                key={kw}
                onClick={() => {
                  setSearchQuery(kw);
                  setTimeout(() => handleSearch(), 50);
                }}
                className="px-4 py-2 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-xs font-bold rounded-xl transition-all border border-slate-200 hover:border-blue-200 shadow-sm"
              >
                {kw}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
