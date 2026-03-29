"use client";

import { Search, MapPin, X, TrendingUp, Briefcase } from "lucide-react";
import { LOCATIONS, HOT_KEYWORDS, INDUSTRY_TAG_MAP } from "@/lib/constants";

interface JobSearchHeroProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  locationParam: string;
  setLocationParam: (val: string) => void;
  industryParam: string;
  setIndustryParam: (val: string) => void;
  handleSearch: (e?: React.FormEvent) => void;
  totalJobs: number;
}

export function JobSearchHero({
  searchQuery,
  setSearchQuery,
  locationParam,
  setLocationParam,
  industryParam,
  setIndustryParam,
  handleSearch,
  totalJobs,
}: JobSearchHeroProps) {
  const industries = Object.keys(INDUSTRY_TAG_MAP);

  return (
    <div className="bg-gradient-to-br from-blue-600 via-blue-600 to-blue-700 pt-28 pb-16 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

      <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm mb-6">
          <TrendingUp className="w-4 h-4" />
          <span>Hơn {totalJobs.toLocaleString()}+ tin tuyển dụng đang tuyển</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 leading-tight">
          Tìm việc làm<br />
          <span className="text-yellow-300">phù hợp với bạn</span>
        </h1>
        <p className="text-white/75 text-lg mb-10 max-w-xl mx-auto">
          Hàng ngàn cơ hội nghề nghiệp từ các công ty hàng đầu đang chờ đón bạn.
        </p>

        <form
          onSubmit={handleSearch}
          className="bg-white rounded-2xl p-2 flex flex-col md:flex-row gap-2 shadow-2xl shadow-black/20 max-w-4xl mx-auto"
        >
          <div className="flex-[1.5] flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Chức danh, kỹ năng, công ty..."
              className="w-full outline-none text-gray-700 placeholder:text-gray-400 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery("")}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          <div className="flex-1 flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Briefcase className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <select
              className="w-full outline-none text-gray-700 text-sm bg-transparent cursor-pointer"
              value={industryParam}
              onChange={(e) => setIndustryParam(e.target.value)}
            >
              <option value="">Tất cả ngành nghề</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>{ind}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-xl focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 transition-all md:w-52">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
            <select
              className="w-full outline-none text-gray-700 text-sm bg-transparent cursor-pointer"
              value={locationParam}
              onChange={(e) => setLocationParam(e.target.value)}
            >
              <option value="">Tất cả địa điểm</option>
              {LOCATIONS.map((l: string) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-8 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-500/30 flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Tìm kiếm
          </button>
        </form>

        <div className="flex items-center gap-2 mt-6 flex-wrap justify-center">
          <span className="text-white/60 text-sm">Tìm kiếm phổ biến:</span>
          {HOT_KEYWORDS.map((kw) => (
            <button
              key={kw}
              onClick={() => {
                setSearchQuery(kw);
                setTimeout(() => handleSearch(), 50);
              }}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white/90 text-xs rounded-full transition-colors border border-white/20"
            >
              {kw}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
