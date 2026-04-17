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
        {/* Search Bar Container */}
        <div className="w-full bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200/50 flex flex-col md:flex-row items-stretch p-2 md:h-20 max-w-5xl">
          {/* Keyword Field */}
          <div className="flex-[1.5] flex items-center px-5 gap-4 py-3 md:py-0 border-b md:border-b-0 md:border-r border-slate-100">
             <div className="p-2.5 bg-blue-50 rounded-xl text-mariner">
                <Search className="w-5 h-5 stroke-[2.5px]" />
             </div>
             <div className="flex flex-col flex-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Vị trí tuyển dụng</span>
                <input
                  type="text"
                  placeholder="Nhập tên công việc, vị trí..."
                  className="w-full bg-transparent outline-none text-slate-800 font-bold placeholder:text-slate-300 placeholder:font-medium text-[15px]"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
             </div>
          </div>

          {/* Location Field */}
          <div className="flex-1 flex items-center px-5 gap-4 py-3 md:py-0 border-b md:border-b-0 md:border-r border-slate-100">
             <div className="p-2.5 bg-orange-50 rounded-xl text-safety-orange">
                <MapPin className="w-5 h-5 stroke-[2.5px]" />
             </div>
             <div className="flex flex-col flex-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Địa điểm</span>
                <select
                  className="w-full bg-transparent outline-none text-slate-800 font-bold appearance-none cursor-pointer text-[15px]"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="">Toàn quốc</option>
                  {LOCATIONS.map((loc: string) => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
             </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="md:ml-2 h-14 md:h-auto px-10 bg-mariner hover:bg-[#0047a5] text-white font-black rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-[0.97] flex items-center justify-center gap-3"
          >
            <Search className="w-5 h-5 stroke-[3px]" />
            <span className="tracking-wide">TÌM KIẾM</span>
          </button>
        </div>
      </motion.div>
    </section>
  );
}
