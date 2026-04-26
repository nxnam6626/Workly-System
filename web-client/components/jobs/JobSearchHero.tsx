"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Search, 
  MapPin, 
  Briefcase, 
  DollarSign, 
  User, 
  Star, 
  GraduationCap, 
  ChevronDown,
  LayoutGrid,
  X 
} from "lucide-react";
import IndustryMegaMenu from "../shared/IndustryMegaMenu";
import LocationMegaMenu from "../shared/LocationMegaMenu";

interface JobSearchHeroProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  locationParam: string;
  setLocationParam: (val: string) => void;
  industryParam: string;
  setIndustryParam: (val: string) => void;
  jobTypeParam: string;
  setJobTypeParam: (val: string) => void;
  experienceParam: string;
  setExperienceParam: (val: string) => void;
  salaryMinParam?: number;
  setSalaryMinParam: (val?: number) => void;
  salaryMaxParam?: number;
  setSalaryMaxParam: (val?: number) => void;
  rankParam: string;
  setRankParam: (val: string) => void;
  educationParam: string;
  setEducationParam: (val: string) => void;
  handleSearch: (e?: React.FormEvent) => void;
  totalJobs: number;
}

const FILTER_OPTIONS: Record<string, string[]> = {
  "Loại hình": ["Full-time", "Part-time", "Thời vụ", "Remote"],
  "Mức lương": ["Dưới 5 triệu", "5 - 7 triệu", "7 - 10 triệu", "10 - 15 triệu", "15 - 20 triệu", "20 - 30 triệu", "30 - 50 triệu", "Trên 50 triệu", "Thoả thuận"],
  "Chức vụ": ["Thực tập sinh", "Nhân viên/Chuyên viên", "Trưởng nhóm/Trưởng phòng", "Giám đốc/Cấp cao hơn"],
  "Kinh nghiệm": ["Không yêu cầu", "Dưới 1 năm", "1 - 2 năm", "3 - 5 năm", "Trên 5 năm"],
  "Học vấn": ["Không yêu cầu", "Trung học", "Trung cấp", "Cao đẳng", "Đại học", "Trên Đại học"]
};

const JOB_TYPE_MAP: Record<string, string> = {
  "Full-time": "FULLTIME",
  "Part-time": "PARTTIME",
  "Thời vụ": "PARTTIME",
  "Remote": "FULLTIME"
};

const SALARY_MAP: Record<string, { min?: number; max?: number }> = {
  "Dưới 5 triệu": { max: 5000000 },
  "5 - 7 triệu": { min: 5000000, max: 7000000 },
  "7 - 10 triệu": { min: 7000000, max: 10000000 },
  "10 - 15 triệu": { min: 10000000, max: 15000000 },
  "15 - 20 triệu": { min: 15000000, max: 20000000 },
  "20 - 30 triệu": { min: 20000000, max: 30000000 },
  "30 - 50 triệu": { min: 30000000, max: 50000000 },
  "Trên 50 triệu": { min: 50000000 },
  "Thoả thuận": {}
};

interface IndustryItem {
  category: string;
  subCategories: string[];
}

export function JobSearchHero({
  searchQuery,
  setSearchQuery,
  locationParam,
  setLocationParam,
  industryParam,
  setIndustryParam,
  jobTypeParam,
  setJobTypeParam,
  experienceParam,
  setExperienceParam,
  salaryMinParam,
  setSalaryMinParam,
  salaryMaxParam,
  setSalaryMaxParam,
  rankParam,
  setRankParam,
  educationParam,
  setEducationParam,
  handleSearch,
  totalJobs
}: JobSearchHeroProps) {
  const [openFilter, setOpenFilter] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const locationDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenFilter(null);
      }
      if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target as Node)) {
        setOpenLocation(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [openLocation, setOpenLocation] = useState(false);

  const handleSelectFilterValue = (type: string, label: string) => {
    setOpenFilter(null);
    if (type === "Loại hình") {
      setJobTypeParam(JOB_TYPE_MAP[label] || "");
    } else if (type === "Mức lương") {
      const range = SALARY_MAP[label];
      setSalaryMinParam(range?.min);
      setSalaryMaxParam(range?.max);
    } else if (type === "Kinh nghiệm") {
      setExperienceParam(label === "Không yêu cầu" ? "" : label);
    } else if (type === "Chức vụ") {
      setRankParam(label);
    } else if (type === "Học vấn") {
      setEducationParam(label === "Không yêu cầu" ? "" : label);
    }
  };

  const handleSelectIndustry = (val: string) => {
    setIndustryParam(val);
    setOpenFilter(null);
    handleSearch();
  };

  const filterButtons = [
    { label: "Ngành nghề", icon: <LayoutGrid className="w-4 h-4" /> },
    { label: "Loại hình", icon: <Briefcase className="w-4 h-4" /> },
    { label: "Mức lương", icon: <DollarSign className="w-4 h-4" /> },
    { label: "Chức vụ", icon: <User className="w-4 h-4" /> },
    { label: "Kinh nghiệm", icon: <Star className="w-4 h-4" /> },
    { label: "Học vấn", icon: <GraduationCap className="w-4 h-4" /> },
  ];

  const getJobTypeLabel = (val: string) => Object.keys(JOB_TYPE_MAP).find(k => JOB_TYPE_MAP[k] === val) || val;

  return (
    <div className="w-full bg-[#f8fafc] py-4 border-b border-slate-100 relative z-40">
      <div className="max-w-6xl mx-auto px-4 lg:px-6">
        <div className="bg-[#d7ecf7] rounded-[16px] p-2 shadow-sm border border-blue-50 relative">
          <form
            onSubmit={handleSearch}
            className="bg-white rounded-xl p-1 flex flex-col md:flex-row items-stretch gap-1 mb-2 shadow-md"
          >
            <div className="flex-[1.5] flex items-center gap-2.5 px-4 py-2.5 group">
              <span className="text-slate-800 font-bold text-[14px] whitespace-nowrap">Từ khóa:</span>
              <input
                type="text"
                placeholder="Việc, công ty, ngành nghề..."
                className="flex-1 outline-none text-slate-800 text-[14px] font-medium placeholder:text-slate-300"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px h-8 bg-slate-100 self-center" />
            <div className="flex-1 flex flex-col md:flex-row items-stretch gap-1 relative" ref={locationDropdownRef}>
              <div 
                className="flex-1 flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setOpenLocation(!openLocation)}
              >
                <span className="text-slate-800 font-bold text-[14px] whitespace-nowrap">Địa điểm:</span>
                <input
                  type="text"
                  placeholder="Tỉnh/thành, quận..."
                  className="flex-1 outline-none text-slate-800 text-[14px] font-medium placeholder:text-slate-300 pointer-events-none"
                  value={locationParam}
                  readOnly
                />
                {locationParam && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setLocationParam(""); }}
                    className="p-1 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}
              </div>

              {openLocation && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 md:left-auto md:right-0 md:w-[700px] z-[60]">
                  <LocationMegaMenu 
                    onSelect={(val) => { setLocationParam(val); setOpenLocation(false); }}
                    onClose={() => setOpenLocation(false)}
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              className="px-8 py-2 bg-gradient-to-r from-[#1e60ad] to-[#164a8a] hover:from-[#164a8a] hover:to-[#0f3463] text-white font-black text-[14px] rounded-lg transition-all active:scale-[0.98] tracking-wide shrink-0 shadow-lg shadow-blue-900/10"
            >
              TÌM VIỆC
            </button>
          </form>


          <div className="grid grid-cols-2 md:grid-cols-6 gap-1.5 px-0.5">
            {filterButtons.map((btn) => {
              const getSelectedValue = () => {
                if (btn.label === "Ngành nghề") return industryParam;
                if (btn.label === "Loại hình") return getJobTypeLabel(jobTypeParam);
                if (btn.label === "Mức lương") {
                  if (salaryMinParam && salaryMaxParam) return `${(salaryMinParam / 1000000).toFixed(0)}-${(salaryMaxParam / 1000000).toFixed(0)} triệu`;
                  if (salaryMinParam) return `Trên ${(salaryMinParam / 1000000).toFixed(0)} triệu`;
                  if (salaryMaxParam) return `Dưới ${(salaryMaxParam / 1000000).toFixed(0)} triệu`;
                  return null;
                }
                if (btn.label === "Chức vụ") return rankParam;
                if (btn.label === "Kinh nghiệm") return experienceParam;
                if (btn.label === "Học vấn") return educationParam;
                return null;
              };

              const displayValue = getSelectedValue() || btn.label;
              const hasValue = !!getSelectedValue();

              return (
                <div key={btn.label} className="relative w-full">
                  <button
                    onClick={() => setOpenFilter(openFilter === btn.label ? null : btn.label)}
                    className={`w-full flex items-center justify-between gap-1 px-4 py-2.5 rounded-full text-[13px] font-bold transition-all group shadow-sm active:scale-[0.97] border border-transparent ${
                      openFilter === btn.label 
                        ? "bg-white text-[#1e60ad] border-blue-200 shadow-md" 
                        : "bg-[#1e60ad] text-white hover:bg-[#164a8a]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`shrink-0 transition-opacity ${openFilter === btn.label ? "" : "opacity-90 group-hover:opacity-100"}`}>
                        {btn.icon && <span className="scale-95">{btn.icon}</span>}
                      </span>
                      <span className="truncate">{displayValue}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 shrink-0 transition-all ${openFilter === btn.label ? "rotate-180" : "opacity-70 group-hover:translate-y-0.5"}`} />
                  </button>
                {openFilter === btn.label && btn.label !== "Ngành nghề" && (
                  <div className="absolute top-[calc(100%+8px)] left-0 min-w-[200px] bg-white rounded-xl shadow-2xl border border-slate-100 z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {FILTER_OPTIONS[btn.label]?.map((val) => (
                      <button key={val} onClick={() => handleSelectFilterValue(btn.label, val)} className="w-full text-left px-5 py-2.5 text-[13.5px] font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1e60ad] transition-all">
                        {val}
                      </button>
                    ))}
                  </div>
                )}
                </div>
              );
            })}
          </div>

          {openFilter === "Ngành nghề" && (
            <div ref={dropdownRef} className="absolute top-[calc(100%+8px)] left-4 right-4 z-50">
              <IndustryMegaMenu 
                height="360px"
                onSelect={handleSelectIndustry}
                onClose={() => setOpenFilter(null)}
              />
            </div>
          )}
        </div>
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
