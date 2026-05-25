"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { Search, ChevronRight, X, Check } from "lucide-react";
import { VIETNAM_LOCATIONS, Province } from "@/lib/locations";

interface LocationMegaMenuProps {
  onSelect?: (location: string) => void;
  onClose?: () => void;
}

export default function LocationMegaMenu({ onSelect, onClose }: LocationMegaMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<Province>(VIETNAM_LOCATIONS[0]);

  const filteredProvinces = useMemo(() => {
    if (!searchQuery) return VIETNAM_LOCATIONS;
    
    const query = searchQuery.toLowerCase();
    return VIETNAM_LOCATIONS.filter((p) => {
      return p.name.toLowerCase().includes(query);
    });
  }, [searchQuery]);

  // Tự động chọn tỉnh đầu tiên trong kết quả tìm kiếm nếu tỉnh đang chọn bị ẩn
  useEffect(() => {
    if (filteredProvinces.length > 0 && !filteredProvinces.find(p => p.name === selectedProvince.name)) {
      setSelectedProvince(filteredProvinces[0]);
    }
  }, [filteredProvinces, selectedProvince.name]);

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 flex overflow-hidden w-full h-[360px] animate-in fade-in zoom-in-95 duration-200">
      {/* Provinces List */}
      <div className="w-full bg-white flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm Tỉnh/Thành"
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-lg text-[14px] outline-none focus:border-[#1e60ad] transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-sidebar-scroll">
          {filteredProvinces.map((province) => (
            <button
              key={province.name}
              onClick={() => {
                setSelectedProvince(province);
                if (onSelect) onSelect(province.name);
                if (onClose) onClose();
              }}
              className={`w-full flex items-center justify-between px-5 py-3 text-[14px] font-medium transition-all group relative hover:bg-slate-50 text-slate-600`}
            >
              <div className="flex items-center gap-3">
                <span>{province.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .custom-sidebar-scroll::-webkit-scrollbar { width: 5px; }
        .custom-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
      `}</style>
    </div>
  );
}
