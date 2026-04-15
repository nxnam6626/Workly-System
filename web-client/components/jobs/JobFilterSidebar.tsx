"use client";

import { useState } from "react";
import { MapPin, Briefcase, Filter, X, Cpu, Search, Zap, ChevronUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LOCATIONS, JOB_TYPES, INDUSTRIES, SALARY_RANGES, EXPERIENCE_LEVELS } from "@/lib/constants";

interface JobFilterSidebarProps {
  locationParam: string;
  setLocationParam: (val: string) => void;
  jobTypeParam: string;
  setJobTypeParam: (val: string) => void;
  industryParam: string;
  setIndustryParam: (val: string) => void;
  salaryMinParam?: number;
  setSalaryMinParam: (val?: number) => void;
  salaryMaxParam?: number;
  setSalaryMaxParam: (val?: number) => void;
  experienceParam: string;
  setExperienceParam: (val: string) => void;
  handleSearch: () => void;
}

export function JobFilterSidebar({
  locationParam,
  setLocationParam,
  jobTypeParam,
  setJobTypeParam,
  industryParam,
  setIndustryParam,
  salaryMinParam,
  setSalaryMinParam,
  salaryMaxParam,
  setSalaryMaxParam,
  experienceParam,
  setExperienceParam,
  handleSearch,
}: JobFilterSidebarProps) {
  const [locSearch, setLocSearch] = useState("");
  const [collapsed, setCollapsed] = useState({
    industry: false,
    location: false,
    jobType: false,
    experience: false,
    salary: false
  });

  const toggle = (section: keyof typeof collapsed) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="space-y-6">
      {/* Industry Filter */}
      <div>
        <button 
          onClick={() => toggle('industry')}
          className="w-full flex items-center justify-between font-semibold text-gray-800 mb-2 group"
        >
          <span className="flex items-center gap-2"><Cpu className="w-4 h-4 text-blue-500" /> Ngành nghề</span>
          <span className="p-1 rounded-md bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            {collapsed.industry ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </button>
        <AnimatePresence initial={false}>
          {!collapsed.industry && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar pt-1">
                <button
                  onClick={() => {
                    setIndustryParam("");
                    handleSearch();
                  }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !industryParam
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Tất cả ngành nghề
                </button>
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => {
                      setIndustryParam(ind);
                      handleSearch();
                    }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      industryParam === ind
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-gray-100" />

      {/* Location Filter */}
      <div>
        <button 
          onClick={() => toggle('location')}
          className="w-full flex items-center justify-between font-semibold text-gray-800 mb-2 group"
        >
          <span className="flex items-center gap-2"><MapPin className="w-4 h-4 text-blue-500" /> Địa điểm</span>
          <span className="p-1 rounded-md bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            {collapsed.location ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {!collapsed.location && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-1">
                {/* Location Search Input */}
                <div className="mb-3 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm tỉnh thành..."
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all"
                    onChange={(e) => {
                      const term = e.target.value.toLowerCase();
                      setLocSearch(term);
                    }}
                  />
                </div>

                <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar text-sm">
                  <button
                    onClick={() => {
                      setLocationParam("");
                      handleSearch();
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      !locationParam
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    Tất cả địa điểm
                  </button>
                  {LOCATIONS.filter((loc: string) => 
                    loc.toLowerCase().includes(locSearch.toLowerCase())
                  ).map((loc: string) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setLocationParam(loc);
                        handleSearch();
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        locationParam === loc
                          ? "bg-blue-50 text-blue-700 font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-gray-100" />

      {/* Job Type Filter */}
      <div>
        <button 
          onClick={() => toggle('jobType')}
          className="w-full flex items-center justify-between font-semibold text-gray-800 mb-2 group"
        >
          <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> Hình thức làm việc</span>
          <span className="p-1 rounded-md bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            {collapsed.jobType ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {!collapsed.jobType && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => {
                    setJobTypeParam("");
                    handleSearch();
                  }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !jobTypeParam
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Tất cả
                </button>
                {JOB_TYPES.map((jt) => (
                  <button
                    key={jt.value}
                    onClick={() => {
                      setJobTypeParam(jt.value);
                      handleSearch();
                    }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      jobTypeParam === jt.value
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {jt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-gray-100" />
      
      {/* Experience Filter */}
      <div>
        <button 
          onClick={() => toggle('experience')}
          className="w-full flex items-center justify-between font-semibold text-gray-800 mb-2 group"
        >
          <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-blue-500" /> Kinh nghiệm</span>
          <span className="p-1 rounded-md bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            {collapsed.experience ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {!collapsed.experience && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 pt-1">
                <button
                  onClick={() => {
                    setExperienceParam("");
                    handleSearch();
                  }}
                  className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                    !experienceParam
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  Tất cả kinh nghiệm
                </button>
                {EXPERIENCE_LEVELS.map((exp) => (
                  <button
                    key={exp}
                    onClick={() => {
                      setExperienceParam(exp);
                      handleSearch();
                    }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      experienceParam === exp
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {exp}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-gray-100" />

      {/* Salary Filter */}
      <div>
        <button 
          onClick={() => toggle('salary')}
          className="w-full flex items-center justify-between font-semibold text-gray-800 mb-2 group"
        >
          <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-blue-500" /> Mức lương</span>
          <span className="p-1 rounded-md bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
            {collapsed.salary ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </span>
        </button>

        <AnimatePresence initial={false}>
          {!collapsed.salary && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="space-y-1 pt-1">
                {SALARY_RANGES.map((range) => (
                  <button
                    key={range.label}
                    onClick={() => {
                      setSalaryMinParam(range.min);
                      setSalaryMaxParam(range.max);
                      handleSearch();
                    }}
                    className={`w-full text-left text-sm px-3 py-2 rounded-lg transition-colors ${
                      salaryMinParam === range.min && salaryMaxParam === range.max
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-gray-100" />

      {/* Active Filters */}
      {(locationParam || jobTypeParam || industryParam || experienceParam || salaryMinParam !== undefined) && (
        <div>
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-500" /> Đang lọc
          </h3>
          <div className="flex flex-wrap gap-2">
            {industryParam && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {industryParam}
                <button onClick={() => { setIndustryParam(""); handleSearch(); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {locationParam && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {locationParam}
                <button onClick={() => { setLocationParam(""); handleSearch(); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {experienceParam && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {experienceParam}
                <button onClick={() => { setExperienceParam(""); handleSearch(); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {salaryMinParam !== undefined && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {SALARY_RANGES.find(r => r.min === salaryMinParam)?.label || "Lương"}
                <button onClick={() => { setSalaryMinParam(undefined); setSalaryMaxParam(undefined); handleSearch(); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {jobTypeParam && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                {JOB_TYPES.find((j) => j.value === jobTypeParam)?.label}
                <button onClick={() => { setJobTypeParam(""); handleSearch(); }}>
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
          <button
            onClick={() => {
              setLocationParam("");
              setJobTypeParam("");
              setIndustryParam("");
              setExperienceParam("");
              setSalaryMinParam(undefined);
              setSalaryMaxParam(undefined);
              handleSearch();
            }}
            className="mt-3 text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Xóa tất cả bộ lọc
          </button>
        </div>
      )}
    </div>
  );
}
