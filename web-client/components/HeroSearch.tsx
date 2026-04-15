"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, Briefcase } from "lucide-react";
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
    <section className="w-full bg-[#f4f7fa] pt-12 pb-6 px-6 relative">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto flex flex-col items-center gap-8 relative z-10"
      >
        {/* Compact Search Bar */}
        <div className="w-full bg-white rounded-xl shadow-jobsgo border border-slate-200/60 flex items-stretch p-1.5 h-16">
          {/* Keyword */}
          <div className="flex-[2] flex items-center px-6 gap-3">
             <span className="text-slate-500 font-bold text-xs whitespace-nowrap uppercase tracking-wider">Từ khóa:</span>
             <input
                type="text"
                placeholder="Việc, công ty, ngành nghề..."
                className="w-full bg-transparent outline-none text-slate-800 font-bold placeholder:text-slate-400 placeholder:font-normal text-[15px]"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
          </div>

          <div className="w-px h-10 self-center bg-slate-200" />

          {/* Location */}
          <div className="flex-1 flex items-center px-6 gap-3">
             <span className="text-slate-500 font-bold text-xs whitespace-nowrap uppercase tracking-wider">Địa điểm:</span>
             <select
                className="w-full bg-transparent outline-none text-slate-700 font-bold appearance-none cursor-pointer text-[15px]"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Tỉnh/thành, quận...</option>
                {LOCATIONS.map((loc: string) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
          </div>

          <button
            onClick={handleSearch}
            className="h-16 px-12 bg-mariner hover:bg-[#0047a5] text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5 stroke-[2.5px]" />
            <span>TÌM KIẾM</span>
          </button>
        </div>
      </motion.div>
    </section>
  );
}
