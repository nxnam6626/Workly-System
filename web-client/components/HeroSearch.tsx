"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutGrid, ChevronDown } from "lucide-react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import IndustryMegaMenu from "./shared/IndustryMegaMenu";
import { useRef, useEffect } from "react";

interface HeroSearchProps {
  hideFilters?: boolean;
}

export function HeroSearch({ hideFilters = false }: HeroSearchProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [showIndustry, setShowIndustry] = useState(false);
  const industryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (industryRef.current && !industryRef.current.contains(event.target as Node)) {
        setShowIndustry(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (industry?: string) => {
    const params = new URLSearchParams();
    if (keyword) params.set("search", keyword);
    if (location) params.set("location", location);
    if (industry) params.set("industry", industry);
    router.push(`/jobs?${params.toString()}`);
    setShowIndustry(false);
  };

  return (
    <div className="relative">
      <div className="bg-[#d7ecf7] rounded-[20px] p-2 shadow-sm border border-blue-50">
        <div className="bg-white rounded-xl p-1 flex flex-col md:flex-row items-stretch gap-1 shadow-md">
          {/* Keyword Field */}
          <div className="flex-[1.5] flex items-center gap-2.5 px-4 py-2.5 group">
            <span className="text-slate-800 font-bold text-[14px] whitespace-nowrap">Từ khóa:</span>
            <input
              type="text"
              placeholder="Việc, công ty, ngành nghề..."
              className="flex-1 outline-none text-slate-800 text-[14px] font-medium placeholder:text-slate-300"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          {/* Separator */}
          <div className="hidden md:block w-px h-8 bg-slate-100 self-center" />

          {/* Location Field */}
          <div className="flex-1 flex items-center gap-2.5 px-4 py-2.5">
            <span className="text-slate-800 font-bold text-[14px] whitespace-nowrap">Địa điểm:</span>
            <input
              type="text"
              placeholder="Tỉnh/thành, quận..."
              className="flex-1 outline-none text-slate-800 text-[14px] font-medium placeholder:text-slate-300"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={() => handleSearch()}
            className="px-8 py-2 bg-gradient-to-r from-[#1e60ad] to-[#164a8a] hover:from-[#164a8a] hover:to-[#0f3463] text-white font-black text-[14px] rounded-lg transition-all active:scale-[0.98] tracking-wide shrink-0 shadow-lg shadow-blue-900/10 uppercase"
          >
            TÌM VIỆC
          </button>
        </div>

        {/* Filters Bar */}
        {!hideFilters && (
          <div className="mt-2 flex flex-wrap gap-2">
            <div className="relative" ref={industryRef}>
              <button
                onClick={() => setShowIndustry(!showIndustry)}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all shadow-sm active:scale-[0.97] ${
                  showIndustry ? "bg-white text-[#1e60ad]" : "bg-[#1e60ad] text-white hover:bg-[#164a8a]"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span>Ngành nghề</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showIndustry ? "rotate-180" : ""}`} />
              </button>

              {showIndustry && (
                <div className="absolute top-[calc(100%+8px)] left-0 z-50 w-[800px]">
                  <IndustryMegaMenu 
                    height="360px"
                    onSelect={(industry) => handleSearch(industry)}
                    onClose={() => setShowIndustry(false)}
                  />
                </div>
              )}
            </div>

            {/* Dummy Filters for Visual Consistency */}
            {["Loại hình", "Mức lương", "Chức vụ"].map((label) => (
              <button
                key={label}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-[13px] font-bold bg-[#1e60ad] text-white hover:bg-[#164a8a] transition-all shadow-sm active:scale-[0.97]"
              >
                <span>{label}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
