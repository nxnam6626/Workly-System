"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, MapPin, Briefcase, Zap, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
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

  return (
    <section className="w-full bg-[#f0f5ff] py-10 px-6">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Search Area */}
        <div className="flex-1 w-full">
          {/* Enhanced Search Bar */}
          <div className="w-full bg-white p-1.5 rounded-full shadow-lg border border-blue-100 flex flex-col md:flex-row items-center gap-1 mb-6">
            <div className="flex-[1.5] flex items-center gap-2 px-4 py-2 w-full border-b md:border-b-0 md:border-r border-slate-100">
              <Search className="w-5 h-5 text-blue-500" />
              <input
                type="text"
                placeholder="Nhập vị trí muốn ứng tuyển"
                className="w-full bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400 text-sm"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="flex-1 flex items-center gap-2 px-4 py-2 w-full border-b md:border-b-0 md:border-r border-slate-100">
              <span className="text-slate-400 font-medium text-sm whitespace-nowrap">Ngành nghề</span>
              <select 
                className="w-full bg-transparent outline-none text-slate-700 font-medium appearance-none cursor-pointer text-sm"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option value="">Tất cả ngành nghề</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 flex items-center gap-2 px-4 py-2 w-full">
              <MapPin className="w-5 h-5 text-slate-400" />
              <select 
                className="w-full bg-transparent outline-none text-slate-700 font-medium appearance-none cursor-pointer text-sm"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">Địa điểm</option>
                {LOCATIONS.map((loc: string) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleSearch}
              className="whitespace-nowrap px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full flex items-center gap-2 transition-all active:scale-95 shadow-md shadow-blue-200"
            >
              <Search className="w-4 h-4" /> Tìm việc
            </button>
          </div>

          {/* Quick Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {quickSearches.map((tag, idx) => (
              <Link
                key={idx}
                href={`/jobs?q=${tag}`}
                className="text-xs font-medium text-blue-600/70 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100 bg-white/50 transition-all flex items-center gap-1"
              >
                <Zap className="w-3 h-3 text-amber-400" /> {tag}
              </Link>
            ))}
          </div>
        </div>


      </div>
    </section>
  );
}
