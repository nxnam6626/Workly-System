"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Search, ChevronRight, X, Check } from "lucide-react";
import { VIETNAM_LOCATIONS, Province } from "@/lib/locations";

interface LocationMegaMenuProps {
  onSelect?: (location: string) => void;
  onClose?: () => void;
}

export default function LocationMegaMenu({ onSelect, onClose }: LocationMegaMenuProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<Province>(VIETNAM_LOCATIONS[0]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const filteredProvinces = useMemo(() => {
    if (!searchQuery) return VIETNAM_LOCATIONS;
    
    const query = searchQuery.toLowerCase();
    return VIETNAM_LOCATIONS.filter((p) => {
      const provinceMatch = p.name.toLowerCase().includes(query);
      const districtMatch = p.districts.some(d => d.toLowerCase().includes(query));
      return provinceMatch || districtMatch;
    });
  }, [searchQuery]);

  // Tự động chọn tỉnh đầu tiên trong kết quả tìm kiếm nếu tỉnh đang chọn bị ẩn
  useEffect(() => {
    if (filteredProvinces.length > 0 && !filteredProvinces.find(p => p.name === selectedProvince.name)) {
      setSelectedProvince(filteredProvinces[0]);
    }
  }, [filteredProvinces, selectedProvince.name]);

  const handleToggleDistrict = (district: string) => {
    if (district === "Tất cả") {
      if (selectedDistricts.includes("Tất cả")) {
        setSelectedDistricts([]);
      } else {
        setSelectedDistricts(["Tất cả"]);
      }
      return;
    }

    const newDistricts = selectedDistricts.includes(district)
      ? selectedDistricts.filter((d) => d !== district)
      : [...selectedDistricts.filter((d) => d !== "Tất cả"), district];
    
    setSelectedDistricts(newDistricts);
  };

  const handleApply = () => {
    if (onSelect) {
      if (selectedDistricts.length === 0 || selectedDistricts.includes("Tất cả")) {
        onSelect(selectedProvince.name);
      } else {
        onSelect(`${selectedDistricts.join(", ")}, ${selectedProvince.name}`);
      }
    }
    if (onClose) onClose();
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 flex overflow-hidden w-full h-[480px] animate-in fade-in zoom-in-95 duration-200">
      {/* Left Column: Provinces */}
      <div className="w-[320px] bg-white border-r border-slate-100 flex flex-col shrink-0">
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
                setSelectedDistricts([]);
              }}
              className={`w-full flex items-center justify-between px-5 py-3 text-[14px] font-medium transition-all group relative ${
                selectedProvince.name === province.name
                  ? "text-[#1e60ad] bg-blue-50/50"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                  selectedProvince.name === province.name ? "border-[#1e60ad] bg-[#1e60ad]" : "border-slate-300"
                }`}>
                   {selectedProvince.name === province.name && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span>{province.name}</span>
              </div>
              <ChevronRight className={`w-4 h-4 transition-all ${
                selectedProvince.name === province.name ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
              }`} />
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Districts */}
      <div className="flex-1 bg-white flex flex-col">
        <div className="p-4 border-b border-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-slate-800 text-[14px]">Quận/Huyện</h3>
          <button 
            onClick={handleApply}
            className="px-6 py-1.5 bg-[#1e60ad] text-white text-[13px] font-bold rounded-lg hover:bg-[#164a8a] transition-all shadow-md shadow-blue-900/10 active:scale-95"
          >
            Áp dụng
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-sidebar-scroll p-2">
          <div className="grid grid-cols-1 gap-1">
            <button
              onClick={() => handleToggleDistrict("Tất cả")}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-all group text-left"
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                selectedDistricts.includes("Tất cả") ? "bg-[#1e60ad] border-[#1e60ad]" : "border-slate-300 bg-white"
              }`}>
                {selectedDistricts.includes("Tất cả") && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
              </div>
              <span className={`text-[14px] font-medium ${selectedDistricts.includes("Tất cả") ? "text-[#1e60ad]" : "text-slate-600"}`}>Tất cả</span>
            </button>

            {selectedProvince.districts.map((district) => (
              <button
                key={district}
                onClick={() => handleToggleDistrict(district)}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-50 transition-all group text-left"
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                  selectedDistricts.includes(district) ? "bg-[#1e60ad] border-[#1e60ad]" : "border-slate-300 bg-white"
                }`}>
                  {selectedDistricts.includes(district) && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                </div>
                <span className={`text-[14px] font-medium ${selectedDistricts.includes(district) ? "text-[#1e60ad]" : "text-slate-600"}`}>
                  {district}
                </span>
              </button>
            ))}
          </div>
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
