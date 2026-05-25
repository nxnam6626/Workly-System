"use client";

import { useState, useRef, useEffect } from "react";
import { 
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
import { useRouter } from "next/navigation";

interface JobSearchHeroProps {
  standaloneMode?: boolean;
  searchQuery?: string;
  setSearchQuery?: (val: string) => void;
  locationParam?: string;
  setLocationParam?: (val: string) => void;
  industryParam?: string;
  setIndustryParam?: (val: string) => void;
  jobTypeParam?: string;
  setJobTypeParam?: (val: string) => void;
  experienceParam?: string;
  setExperienceParam?: (val: string) => void;
  salaryMinParam?: number;
  setSalaryMinParam?: (val?: number) => void;
  salaryMaxParam?: number;
  setSalaryMaxParam?: (val?: number) => void;
  jobLevelParam?: string;
  setJobLevelParam?: (val: string) => void;
  educationParam?: string;
  setEducationParam?: (val: string) => void;
  handleSearch?: (e?: React.FormEvent) => void;
  totalJobs?: number;
}

const FILTER_OPTIONS: Record<string, string[]> = {
  "Loại hình": ["Full-time", "Part-time", "Remote"],
  "Mức lương": ["Dưới 5 triệu", "5 - 7 triệu", "7 - 10 triệu", "10 - 15 triệu", "15 - 20 triệu", "20 - 30 triệu", "30 - 50 triệu", "Trên 50 triệu", "Thoả thuận"],
  "Chức vụ": ["Thực tập sinh", "Nhân viên/Chuyên viên", "Trưởng nhóm/Trưởng phòng", "Giám đốc/Cấp cao hơn"],
  "Kinh nghiệm": ["Không yêu cầu", "Dưới 1 năm", "1 - 2 năm", "3 - 5 năm", "Trên 5 năm"],
  "Học vấn": ["Không yêu cầu", "Trung học", "Trung cấp", "Cao đẳng", "Đại học", "Trên Đại học"]
};

const JOB_TYPE_MAP: Record<string, string> = {
  "Full-time": "FULLTIME",
  "Part-time": "PARTTIME",
  "Remote": "REMOTE"
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

const JOB_LEVEL_MAP: Record<string, string> = {
  "Thực tập sinh": "INTERN",
  "Nhân viên/Chuyên viên": "STAFF",
  "Trưởng nhóm/Trưởng phòng": "TEAM_LEAD",
  "Giám đốc/Cấp cao hơn": "DIRECTOR"
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
  jobLevelParam,
  setJobLevelParam,
  educationParam,
  setEducationParam,
  handleSearch,
  totalJobs,
  standaloneMode = false
}: JobSearchHeroProps) {
  const router = useRouter();

  // Local states for Standalone Mode fallback
  const [localSearch, setLocalSearch] = useState("");
  const [localLocation, setLocalLocation] = useState("");
  const [localIndustry, setLocalIndustry] = useState("");
  const [localJobType, setLocalJobType] = useState("");
  const [localExp, setLocalExp] = useState("");
  const [localMin, setLocalMin] = useState<number>();
  const [localMax, setLocalMax] = useState<number>();
  const [localRank, setLocalRank] = useState("");
  const [localEdu, setLocalEdu] = useState("");

  // Dynamic proxies picking state/prop based on mode
  const sQuery = standaloneMode ? localSearch : (searchQuery || "");
  const sSetQuery = standaloneMode ? setLocalSearch : (setSearchQuery || (() => {}));
  const lParam = standaloneMode ? localLocation : (locationParam || "");
  const sSetLocation = standaloneMode ? setLocalLocation : (setLocationParam || (() => {}));
  const iParam = standaloneMode ? localIndustry : (industryParam || "");
  const sSetIndustry = standaloneMode ? setLocalIndustry : (setIndustryParam || (() => {}));
  const jtParam = standaloneMode ? localJobType : (jobTypeParam || "");
  const sSetJobType = standaloneMode ? setLocalJobType : (setJobTypeParam || (() => {}));
  const expParam = standaloneMode ? localExp : (experienceParam || "");
  const sSetExp = standaloneMode ? setLocalExp : (setExperienceParam || (() => {}));
  const rParam = standaloneMode ? localRank : (jobLevelParam || "");
  const sSetRank = standaloneMode ? setLocalRank : (setJobLevelParam || (() => {}));
  const eParam = standaloneMode ? localEdu : (educationParam || "");
  const sSetEdu = standaloneMode ? setLocalEdu : (setEducationParam || (() => {}));
  
  const sMin = standaloneMode ? localMin : salaryMinParam;
  const sSetMin = standaloneMode ? setLocalMin : (setSalaryMinParam || (() => {}));
  const sMax = standaloneMode ? localMax : salaryMaxParam;
  const sSetMax = standaloneMode ? setLocalMax : (setSalaryMaxParam || (() => {}));

  const performSearch = (e?: React.FormEvent, overrides?: any) => {
    e?.preventDefault();
    if (standaloneMode) {
      const p = new URLSearchParams();
      if (sQuery) p.set("search", sQuery);
      const locationToUse = overrides?.location !== undefined ? overrides.location : lParam;
      if (locationToUse) p.set("location", locationToUse);
      
      const industryToUse = overrides?.industry !== undefined ? overrides.industry : iParam;
      if (industryToUse) p.set("industry", industryToUse);
      
      const jtToUse = overrides?.jobType !== undefined ? overrides.jobType : jtParam;
      if (jtToUse) p.set("jobType", jtToUse);
      
      const expToUse = overrides?.experience !== undefined ? overrides.experience : expParam;
      if (expToUse) p.set("experience", expToUse);
      
      const minToUse = overrides?.salaryMin !== undefined ? overrides.salaryMin : sMin;
      if (minToUse) p.set("salaryMin", minToUse.toString());
      
      const maxToUse = overrides?.salaryMax !== undefined ? overrides.salaryMax : sMax;
      if (maxToUse) p.set("salaryMax", maxToUse.toString());
      
      const rankToUse = overrides?.jobLevel !== undefined ? overrides.jobLevel : rParam;
      if (rankToUse) p.set("jobLevel", rankToUse);
      
      const eduToUse = overrides?.education !== undefined ? overrides.education : eParam;
      if (eduToUse) p.set("education", eduToUse);
      
      router.push(`/jobs?${p.toString()}`);
    } else {
      handleSearch?.(e);
    }
  };

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
    let overrides: any = {};
    if (type === "Loại hình") {
      const val = JOB_TYPE_MAP[label] || "";
      sSetJobType(val);
      overrides = { jobType: val };
    } else if (type === "Mức lương") {
      const range = SALARY_MAP[label];
      sSetMin(range?.min);
      sSetMax(range?.max);
      overrides = { salaryMin: range?.min || "", salaryMax: range?.max || "" };
    } else if (type === "Kinh nghiệm") {
      const val = label === "Không yêu cầu" ? "" : label;
      sSetExp(val);
      overrides = { experience: val };
    } else if (type === "Chức vụ") {
      const val = JOB_LEVEL_MAP[label] || "";
      sSetRank(val);
      overrides = { jobLevel: val };
    } else if (type === "Học vấn") {
      const val = label === "Không yêu cầu" ? "" : label;
      sSetEdu(val);
      overrides = { education: val };
    }
    
    if (standaloneMode) {
      performSearch(undefined, overrides);
    }
  };

  const handleSelectIndustry = (val: string) => {
    sSetIndustry(val);
    setOpenFilter(null);
    if (standaloneMode) {
      performSearch(undefined, { industry: val });
    } else {
      // In jobs page, state change triggers useEffect
    }
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
  const getJobLevelLabel = (val: string) => Object.keys(JOB_LEVEL_MAP).find(k => JOB_LEVEL_MAP[k] === val) || val;

  return (
    <div className={`w-full ${standaloneMode ? "" : "bg-[#f8fafc] py-3 border-b border-slate-100"} relative z-40`}>
      <div className={standaloneMode ? "w-full" : "max-w-6xl mx-auto px-4 lg:px-6"}>
        <div className="bg-[#d7ecf7] rounded-[14px] p-1.5 shadow-sm border border-blue-50 relative">
          <form
            onSubmit={performSearch}
            className="bg-white rounded-lg p-0.5 flex flex-col md:flex-row items-stretch gap-1 mb-1.5 shadow-md"
          >
            <div className="flex-[1.5] flex items-center gap-2 px-3 py-2 group">
              <span className="text-slate-800 font-bold text-[13px] whitespace-nowrap">Từ khóa:</span>
              <input
                type="text"
                placeholder="Việc, công ty, ngành nghề..."
                className="flex-1 outline-none text-slate-800 text-[13px] font-medium placeholder:text-slate-300 h-7"
                value={sQuery}
                onChange={(e) => sSetQuery(e.target.value)}
              />
            </div>
            <div className="hidden md:block w-px h-6 bg-slate-100 self-center" />
            <div className="flex-1 flex flex-col md:flex-row items-stretch gap-1 relative" ref={locationDropdownRef}>
              <div 
                className="flex-1 flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setOpenLocation(!openLocation)}
              >
                <span className="text-slate-800 font-bold text-[13px] whitespace-nowrap">Địa điểm:</span>
                <input
                  type="text"
                  placeholder="Tỉnh/thành, quận..."
                  className="flex-1 outline-none text-slate-800 text-[13px] font-medium placeholder:text-slate-300 pointer-events-none h-7"
                  value={lParam}
                  readOnly
                />
                {lParam && (
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      sSetLocation(""); 
                      if (standaloneMode) performSearch(undefined, { location: "" });
                    }}
                    className="p-0.5 hover:bg-slate-200 rounded-full transition-colors"
                  >
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                )}
              </div>

              {openLocation && (
                <div className="absolute top-[calc(100%+8px)] left-0 right-0 md:left-auto md:right-0 md:w-[320px] z-[60]">
                  <LocationMegaMenu 
                    onSelect={(val) => { 
                      sSetLocation(val); 
                      setOpenLocation(false); 
                      if (standaloneMode) performSearch(undefined, { location: val });
                    }}
                    onClose={() => setOpenLocation(false)}
                  />
                </div>
              )}
            </div>
            <button
              type="submit"
              className="px-6 py-1.5 bg-gradient-to-r from-[#1e60ad] to-[#164a8a] hover:from-[#164a8a] hover:to-[#0f3463] text-white font-black text-[13px] rounded-md transition-all active:scale-[0.98] tracking-wide shrink-0 shadow-md shadow-blue-900/10 uppercase"
            >
              TÌM VIỆC
            </button>
          </form>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-1 px-0.5">
            {filterButtons.map((btn) => {
              const getSelectedValue = () => {
                if (btn.label === "Ngành nghề") return iParam;
                if (btn.label === "Loại hình") return getJobTypeLabel(jtParam);
                if (btn.label === "Mức lương") {
                  if (sMin && sMax) return `${(sMin / 1000000).toFixed(0)}-${(sMax / 1000000).toFixed(0)} triệu`;
                  if (sMin) return `Trên ${(sMin / 1000000).toFixed(0)} triệu`;
                  if (sMax) return `Dưới ${(sMax / 1000000).toFixed(0)} triệu`;
                  return null;
                }
                if (btn.label === "Chức vụ") return getJobLevelLabel(rParam);
                if (btn.label === "Kinh nghiệm") return expParam;
                if (btn.label === "Học vấn") return eParam;
                return null;
              };

              const displayValue = getSelectedValue() || btn.label;
              const hasValue = !!getSelectedValue();

              return (
                <div key={btn.label} className="relative w-full">
                  <button
                    onClick={() => setOpenFilter(openFilter === btn.label ? null : btn.label)}
                    className={`w-full flex items-center justify-between gap-1 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all group shadow-sm active:scale-[0.97] border border-transparent ${
                      openFilter === btn.label 
                        ? "bg-white text-[#1e60ad] border-blue-200 shadow-md" 
                        : "bg-[#1e60ad] text-white hover:bg-[#164a8a]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`shrink-0 transition-opacity ${openFilter === btn.label ? "" : "opacity-90 group-hover:opacity-100"}`}>
                        {btn.icon && <span className="scale-90">{btn.icon}</span>}
                      </span>
                      <span className="truncate">{displayValue}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-all ${openFilter === btn.label ? "rotate-180" : "opacity-70 group-hover:translate-y-0.5"}`} />
                  </button>
                {openFilter === btn.label && btn.label !== "Ngành nghề" && (
                  <div className="absolute top-[calc(100%+4px)] left-0 min-w-[180px] bg-white rounded-lg shadow-xl border border-slate-100 z-50 py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {FILTER_OPTIONS[btn.label]?.map((val) => (
                      <button key={val} onClick={() => handleSelectFilterValue(btn.label, val)} className="w-full text-left px-4 py-2 text-[13px] font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1e60ad] transition-all">
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
