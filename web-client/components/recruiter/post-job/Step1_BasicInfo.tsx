import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Search, Plus, X as CloseIcon, ChevronDown, DollarSign, Users, Briefcase, BarChart } from 'lucide-react';
import { JobFormData } from '@/types/job';

interface Step1Props {
  formData: JobFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  suggestedCategories: string[];
  isSuggesting: boolean;
  toggleCategory: (cat: string) => void;
  allIndustries: any[];
}

export const Step1_BasicInfo = ({
  formData,
  handleChange,
  suggestedCategories,
  isSuggesting,
  toggleCategory,
  allIndustries
}: Step1Props) => {
  const [industryMenuOpen, setIndustryMenuOpen] = useState(false);
  const [industrySearch, setIndustrySearch] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState<string | null>(null);

  const filteredIndustries = allIndustries.filter(ind => {
    const categoryMatch = ind?.category?.toLowerCase().includes(industrySearch.toLowerCase());
    const subMatch = ind?.subCategories?.some((sub: string) => 
      sub?.toLowerCase().includes(industrySearch.toLowerCase())
    );
    return categoryMatch || subMatch;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-4">
      {/* Tiêu đề & Lĩnh vực */}
      <div className="bg-slate-50/40 p-6 rounded-3xl border border-slate-100 space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-slate-700 ml-1">Tiêu đề công việc <span className="text-red-500">*</span></label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full h-14 px-6 rounded-2xl border-2 border-slate-200 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 bg-white transition-all font-semibold text-slate-800 placeholder:text-slate-400 shadow-sm"
            placeholder="VD: Senior Frontend Developer (ReactJS)"
          />
        </div>

        <div className="space-y-3">
          <label className="text-sm font-bold text-slate-700 ml-1 flex items-center justify-between">
            <span>Lĩnh vực & Ngành nghề <span className="text-red-500">*</span></span>
            {isSuggesting && <span className="text-[10px] text-indigo-500 flex items-center gap-1 animate-pulse font-black uppercase"><Sparkles className="w-3 h-3" /> AI đang gợi ý...</span>}
          </label>

          {suggestedCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center bg-white/60 p-3 rounded-2xl border border-dashed border-indigo-100">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Gợi ý:
              </span>
              {suggestedCategories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-2 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 ${
                    formData.categories.includes(cat)
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white text-indigo-600 border border-indigo-50 hover:border-indigo-200'
                  }`}
                >
                  {cat}
                  {formData.categories.includes(cat) ? <CloseIcon className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </button>
              ))}
            </div>
          )}

          <div className="relative">
            <button
              type="button"
              onClick={() => setIndustryMenuOpen(!industryMenuOpen)}
              className={`w-full h-14 px-6 rounded-2xl border-2 flex items-center justify-between transition-all text-sm font-bold ${
                industryMenuOpen ? 'border-indigo-500 bg-white shadow-lg shadow-indigo-50' : 'border-slate-100 bg-white text-slate-700'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Search className="w-5 h-5 text-slate-400 shrink-0" />
                {formData.categories.length > 0 ? (
                  <div className="flex gap-1.5 overflow-hidden whitespace-nowrap">
                    {formData.categories.map(c => (
                      <span key={c} className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0">
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-slate-400 font-semibold">Phân loại ngành nghề (Tối đa 3)...</span>
                )}
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${industryMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {industryMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-3xl shadow-2xl border border-slate-100 z-50 p-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="relative mb-6">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={industrySearch}
                    onChange={(e) => setIndustrySearch(e.target.value)}
                    placeholder="Tìm kiếm lĩnh vực..."
                    className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-50 border-none outline-none font-bold text-sm text-slate-800"
                  />
                </div>

                <div className="flex h-96 gap-8">
                  <div className="w-56 overflow-y-auto pr-2 space-y-1.5 custom-scrollbar border-r border-slate-50">
                    {filteredIndustries.map(ind => (
                      <button
                        key={ind.category}
                        type="button"
                        onClick={() => setActiveCategoryTab(ind.category)}
                        className={`w-full text-left px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-[0.1em] transition-all ${
                          activeCategoryTab === ind.category ? 'bg-indigo-600 text-white shadow-xl translate-x-1' : 'text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        {ind.category}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto pr-2 space-y-8 custom-scrollbar">
                    {filteredIndustries
                      .filter(ind => !activeCategoryTab || ind.category === activeCategoryTab)
                      .map(ind => (
                        <div key={ind.category} className="space-y-4">
                          <h5 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] pl-1">{ind.category}</h5>
                          <div className="flex flex-wrap gap-2.5">
                            {ind.subCategories?.map((sub: string) => (
                              <button
                                key={sub}
                                type="button"
                                onClick={() => toggleCategory(sub)}
                                className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all border-2 ${
                                  formData.categories.includes(sub)
                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm'
                                    : 'bg-white border-slate-50 text-slate-600 hover:border-indigo-100 hover:bg-slate-50'
                                }`}
                              >
                                {sub}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chi tiết công việc (Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-500" /> Hình thức
          </label>
          <select 
            name="jobType" 
            value={formData.jobType} 
            onChange={handleChange} 
            className="w-full h-11 px-3 rounded-xl bg-slate-50 border-none outline-none font-bold text-slate-700 text-sm focus:ring-2 ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="FULLTIME">Toàn thời gian</option>
            <option value="PARTTIME">Bán thời gian</option>
            <option value="REMOTE">Làm việc từ xa</option>
          </select>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <BarChart className="w-4 h-4 text-purple-500" /> Cấp bậc
          </label>
          <select 
            name="jobLevel" 
            value={formData.jobLevel} 
            onChange={handleChange} 
            className="w-full h-11 px-3 rounded-xl bg-slate-50 border-none outline-none font-bold text-slate-700 text-sm focus:ring-2 ring-indigo-500/10 transition-all cursor-pointer"
          >
            <option value="INTERN">Thực tập sinh</option>
            <option value="FRESHER">Mới tốt nghiệp</option>
            <option value="STAFF">Nhân viên</option>
            <option value="SENIOR">Chuyên viên / Senior</option>
            <option value="MANAGER">Quản lý / Trưởng phòng</option>
            <option value="DIRECTOR">Giám đốc & Cấp cao hơn</option>
          </select>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" /> Số lượng
          </label>
          <input 
            type="number" 
            name="vacancies" 
            value={formData.vacancies} 
            onChange={handleChange} 
            min={1} 
            className="w-full h-11 px-4 rounded-xl bg-slate-50 border-none outline-none font-bold text-slate-700 text-sm focus:ring-2 ring-indigo-500/10 transition-all"
          />
        </div>
      </div>

      {/* Mức lương */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-500" /> Ngân sách mức lương (VNĐ)
          </label>
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Tùy chọn</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <input 
              type="number" 
              name="salaryMin" 
              value={formData.salaryMin} 
              onChange={handleChange} 
              className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white outline-none transition-all font-bold text-slate-700" 
              placeholder="Tối thiểu" 
            />
          </div>
          <div className="space-y-1.5">
            <input 
              type="number" 
              name="salaryMax" 
              value={formData.salaryMax} 
              onChange={handleChange} 
              className="w-full h-14 px-6 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-emerald-500/20 focus:bg-white outline-none transition-all font-bold text-slate-700" 
              placeholder="Tối đa" 
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-slate-400 bg-slate-50 p-3 rounded-xl border border-slate-100">
           <Sparkles className="w-3.5 h-3.5 text-amber-400" />
           <p className="text-[11px] font-medium italic">Gợi ý: Để trống nếu bạn muốn hiển thị "Thỏa thuận" trên tin tuyển dụng.</p>
        </div>
      </div>
    </motion.div>
  );
};
