"use client";
import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import IndustryPanel from "./IndustryPanel";

import { HIERARCHICAL_INDUSTRIES } from "@/lib/industries";

interface IndustryItem {
  category: string;
  subCategories: string[];
}

interface IndustryMegaMenuProps {
  onSelect?: (industry: string) => void;
  onClose?: () => void;
  height?: string;
  variant?: "default" | "homepage";
}

export default function IndustryMegaMenu({
  onSelect,
  onClose,
  height = "320px",
  variant = "default"
}: IndustryMegaMenuProps) {
  const industries = HIERARCHICAL_INDUSTRIES;
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const loading = false;
  const isHomepage = variant === "homepage";

  return (
    <div
      className={`relative bg-white rounded-2xl shadow-xl border border-slate-100 flex ${isHomepage ? "" : "overflow-hidden"}`}
      style={{ height, width: isHomepage ? "260px" : "100%" }}
      onMouseLeave={() => isHomepage && setActiveCategory(null)}
    >
      {/* Left Sidebar: Main Categories */}
      <div className="w-[260px] bg-[#fdf8f1] border-r border-slate-100 py-4 flex flex-col shrink-0 rounded-l-2xl">
        <div className="px-5 mb-4 flex items-center gap-2">
          <div className="flex flex-col gap-0.5">
            <div className="w-4 h-0.5 bg-slate-800"></div>
            <div className="w-4 h-0.5 bg-slate-800"></div>
            <div className="w-4 h-0.5 bg-slate-800"></div>
          </div>
          <span className="font-black text-slate-900 text-[16px] tracking-tight">NGÀNH NGHỀ</span>
        </div>

        <div className="flex-1 overflow-y-auto custom-sidebar-scroll pr-1">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="px-5 py-3 text-slate-300 animate-pulse">
                <div className="h-4 bg-slate-100 rounded w-3/4" />
              </div>
            ))
          ) : (
            industries.map((item) => (
              <button
                key={item.category}
                onMouseEnter={() => setActiveCategory(item.category)}
                title={item.category}
                className={`w-full flex items-center justify-between px-5 py-3 text-[14px] font-medium transition-all group relative ${activeCategory === item.category
                  ? "bg-white text-[#1e60ad]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#1e60ad]"
                  }`}
              >
                {activeCategory === item.category && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1e60ad]" />
                )}
                <span className="truncate flex-1 text-left pr-2">{item.category}</span>
                <ChevronRight className={`w-4 h-4 shrink-0 transition-all ${activeCategory === item.category ? "opacity-100 translate-x-0 text-[#1e60ad]" : "opacity-0 -translate-x-1"
                  }`} />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel: Sub-categories */}
      <div className={`${isHomepage ? "absolute left-[260px] top-0 bottom-0 z-[60] w-[860px] animate-in fade-in slide-in-from-left-2 duration-200" : "flex-1"}`}>
        <IndustryPanel
          category={activeCategory || ""}
          subCategories={industries.find(i => i.category === activeCategory)?.subCategories || []}
          onSelect={onSelect}
          onClose={onClose}
        />
      </div>

      <style jsx global>{`
        .custom-sidebar-scroll::-webkit-scrollbar { width: 6px; }
        .custom-sidebar-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb { background: #1e60ad; border-radius: 10px; }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #164a8a; }
      `}</style>
    </div>
  );
}
