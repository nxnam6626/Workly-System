'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Plus, Trash2, Edit3, 
  History as HistoryIcon, Layout, Save, X, Zap, Trophy, Target, Users2, Rocket, 
  ShieldCheck, Coffee, Laptop, Palmtree, Gift, Globe
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Company, CompanySection, CompanyHistory, CompanyBenefit } from '@/types/company';

interface CultureTabProps {
  company: Company;
  onUpdate: () => void;
}

const SECTION_TYPE_INFO: Record<string, { icon: React.ElementType; color: string; label: string; placeholder: string }> = {
  HR_POLICY: { 
    icon: Target, 
    color: 'text-purple-500', 
    label: 'Chính sách nhân sự',
    placeholder: 'Các chính sách về con người, môi trường làm việc...'
  },
  ADVANCEMENT: { 
    icon: Trophy, 
    color: 'text-amber-500', 
    label: 'Cơ hội thăng tiến',
    placeholder: 'Lộ trình phát triển sự nghiệp, đào tạo...'
  },
  SALARY: { 
    icon: Zap, 
    color: 'text-orange-500', 
    label: 'Lương & Thưởng',
    placeholder: 'Chế độ lương thưởng, review lương, bonus...'
  },
  INSURANCE: { 
    icon: Heart, 
    color: 'text-red-500', 
    label: 'Bảo hiểm',
    placeholder: 'Chi tiết về BHXH, bảo hiểm sức khỏe PVI/Liberty...'
  },
  ACTIVITIES: { 
    icon: Users2, 
    color: 'text-emerald-500', 
    label: 'Hoạt động',
    placeholder: 'Team building, du lịch, các câu lạc bộ thể thao...'
  },
  GENERAL: { 
    icon: Layout, 
    color: 'text-slate-500', 
    label: 'Khác',
    placeholder: 'Nội dung bổ sung khác...'
  }
};

const BENEFIT_SUGGESTIONS = [
  { title: 'Bảo hiểm sức khỏe', icon: ShieldCheck },
  { title: 'Team building', icon: Users2 },
  { title: 'Du lịch hàng năm', icon: Palmtree },
  { title: 'Thưởng tháng 13', icon: Gift },
  { title: 'Đào tạo chuyên sâu', icon: Trophy },
  { title: 'Trà & Cafe miễn phí', icon: Coffee },
  { title: 'Thiết bị làm việc hiện đại', icon: Laptop },
  { title: 'Chế độ Hybrid/Remote', icon: Zap },
];

export default function CultureTab({ company, onUpdate }: CultureTabProps) {
  const [editingSection, setEditingSection] = useState<CompanySection | Omit<CompanySection, 'id'> | null>(null);
  const [editingHistory, setEditingHistory] = useState<CompanyHistory | Omit<CompanyHistory, 'id'> | null>(null);
  const [newBenefit, setNewBenefit] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  
  // New state for additional social/video info
  const [socialInfo, setSocialInfo] = useState({
    websiteUrl: company.websiteUrl || ''
  });

  const handleUpdateSocial = async () => {
    setLoading('social');
    try {
      await api.patch('/companies/my-company', socialInfo);
      toast.success('Đã cập nhật thông tin liên kết!');
      onUpdate();
    } catch {
      toast.error('Lỗi khi cập nhật thông tin');
    } finally {
      setLoading(null);
    }
  };

  const handleUpsertSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;

    setLoading('section');
    try {
      await api.post(`/companies/my-company/sections`, editingSection);
      setEditingSection(null);
      onUpdate();
      toast.success('Đã lưu nội dung!');
    } catch {
      toast.error('Không thể lưu nội dung');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phần này?')) return;
    setLoading('section');
    try {
      await api.delete(`/companies/my-company/sections/${id}`);
      onUpdate();
      toast.success('Đã xóa nội dung!');
    } catch {
      toast.error('Không thể xóa nội dung');
    } finally {
      setLoading(null);
    }
  };

  const handleAddBenefit = async (title?: string) => {
    const benefitTitle = title || newBenefit;
    if (!benefitTitle.trim()) return;

    setLoading('benefit');
    try {
      await api.post(`/companies/my-company/benefits`, { title: benefitTitle });
      setNewBenefit('');
      onUpdate();
      toast.success('Đã thêm quyền lợi!');
    } catch {
      toast.error('Không thể thêm quyền lợi');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteBenefit = async (benefitId: string) => {
    setLoading('benefit');
    try {
      await api.delete(`/companies/my-company/benefits/${benefitId}`);
      onUpdate();
      toast.success('Đã xóa quyền lợi!');
    } catch {
      toast.error('Không thể xóa quyền lợi');
    } finally {
      setLoading(null);
    }
  };

  const handleUpsertHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHistory) return;

    setLoading('history');
    try {
      await api.post(`/companies/my-company/history`, editingHistory);
      setEditingHistory(null);
      onUpdate();
      toast.success('Đã lưu cột mốc!');
    } catch {
      toast.error('Không thể lưu cột mốc');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    setLoading('history');
    try {
      await api.delete(`/companies/my-company/history/${id}`);
      onUpdate();
      toast.success('Đã xóa cột mốc!');
    } catch {
      toast.error('Không thể xóa cột mốc');
    } finally {
      setLoading(null);
    }
  };

  return (
    <motion.div
      key="culture"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-32"
    >
      <section className="relative py-12 px-10 overflow-hidden rounded-[3rem] bg-[#0f172a] text-white group shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-mariner/20 via-transparent to-purple-500/5 opacity-60"></div>
        
        <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
              Hồ sơ <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-mariner to-blue-400">Truyền thông & Văn hóa</span>
            </h2>
            <div className="space-y-4 max-w-md">
               <p className="text-slate-400 text-sm font-medium leading-relaxed">
                 Cung cấp các liên kết truyền thông để ứng viên có cái nhìn trực quan nhất về doanh nghiệp của bạn.
               </p>
               
               <div className="grid grid-cols-1 gap-3">
                  <SocialInput 
                    icon={<Globe className="w-4 h-4" />} 
                    placeholder="Website URL (Trang chủ công ty)" 
                    value={socialInfo.websiteUrl}
                    onChange={val => setSocialInfo({...socialInfo, websiteUrl: val})}
                  />
                  <button 
                    onClick={handleUpdateSocial}
                    disabled={loading === 'social'}
                    className="w-full py-3 bg-mariner hover:bg-blue-600 text-white font-black rounded-xl text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                  >
                    {loading === 'social' ? 'Đang cập nhật...' : 'Cập nhật liên kết'}
                  </button>
               </div>
            </div>
          </div>
          
          <div className="hidden md:grid grid-cols-2 gap-4">
             <StatCard icon={<Rocket className="text-blue-400" />} label="Giới thiệu" />
             <StatCard icon={<Heart className="text-red-400" />} label="Quyền lợi" />
             <StatCard icon={<HistoryIcon className="text-amber-400" />} label="Lịch sử" />
             <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 flex flex-col justify-center">
                <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">Hoàn thiện</div>
                <div className="text-2xl font-black">85%</div>
             </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <h3 className="text-3xl font-black text-slate-900 tracking-tight">Câu chuyện doanh nghiệp</h3>
            </div>
            <p className="text-slate-500 font-bold text-sm">Chia sẻ những nét đặc sắc về môi trường và văn hóa làm việc.</p>
          </div>
          {!editingSection && (
            <button 
              onClick={() => setEditingSection({ title: '', content: '', type: 'GENERAL', displayOrder: company.sections?.length || 0 })}
              className="group flex items-center gap-2 px-6 py-3 bg-mariner text-white font-black rounded-xl hover:shadow-lg transition-all active:scale-95 whitespace-nowrap text-sm"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Thêm nội dung
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {editingSection ? (
            <motion.form 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              onSubmit={handleUpsertSection}
              className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-2xl space-y-8 relative overflow-hidden"
            >
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl bg-slate-50 ${SECTION_TYPE_INFO[editingSection.type]?.color || 'text-slate-500'}`}>
                      {(() => {
                        const Icon = SECTION_TYPE_INFO[editingSection.type]?.icon || Layout;
                        return <Icon className="w-6 h-6" />;
                      })()}
                    </div>
                    <div>
                      <h4 className="text-xl font-black text-slate-800">Biên tập chương</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">{SECTION_TYPE_INFO[editingSection.type]?.label}</p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setEditingSection(null)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-all"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề chương</label>
                      <input 
                        type="text"
                        placeholder="VD: Giới thiệu chung về công ty"
                        value={editingSection.title}
                        onChange={e => setEditingSection({...editingSection, title: e.target.value})}
                        className="w-full text-lg font-black bg-slate-50 border-2 border-transparent focus:border-mariner/20 focus:bg-white rounded-xl py-4 px-6 outline-none transition-all placeholder:text-slate-200"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung</label>
                      <textarea 
                        placeholder={SECTION_TYPE_INFO[editingSection.type]?.placeholder}
                        value={editingSection.content}
                        onChange={e => setEditingSection({...editingSection, content: e.target.value})}
                        className="w-full h-64 bg-slate-50 border-2 border-transparent focus:border-mariner/20 focus:bg-white rounded-2xl py-5 px-6 outline-none transition-all font-medium leading-relaxed resize-none text-xs placeholder:text-slate-200"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại chương</label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {Object.entries(SECTION_TYPE_INFO).map(([key, info]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              const existing = company.sections?.find((s: CompanySection) => s.type === key);
                              if (existing) {
                                setEditingSection(existing);
                              } else {
                                setEditingSection({
                                  title: '',
                                  content: '',
                                  type: key,
                                  displayOrder: company.sections?.length || 0
                                } as CompanySection);
                              }
                            }}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                              editingSection.type === key 
                                ? 'border-mariner bg-mariner/5 text-mariner' 
                                : 'border-slate-100 hover:border-slate-200 text-slate-500'
                            }`}
                          >
                            <info.icon className={`w-4 h-4 ${editingSection.type === key ? 'text-mariner' : 'text-slate-400'}`} />
                            <div className="flex items-center gap-2">
                               <span className="font-black text-[11px] uppercase tracking-tight">{info.label}</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-8 border-t border-slate-100">
                  <button type="button" onClick={() => setEditingSection(null)} className="px-6 py-3 text-slate-400 font-black hover:text-slate-900 transition-all text-xs tracking-widest">HỦY BỎ</button>
                  <button 
                    type="submit"
                    disabled={loading === 'section'}
                    className="px-10 py-3 bg-slate-900 text-white font-black rounded-xl hover:bg-mariner shadow-lg flex items-center gap-2 active:scale-95 transition-all text-sm uppercase tracking-widest"
                  >
                    {loading === 'section' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Lưu nội dung
                  </button>
                </div>
              </div>
            </motion.form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(!company.sections || company.sections.length === 0) ? (
                <div className="lg:col-span-3 py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center text-center">
                  <Plus className="w-10 h-10 text-slate-200 mb-4" />
                  <h4 className="text-xl font-black text-slate-400 uppercase tracking-widest">Chưa có nội dung</h4>
                </div>
              ) : (
                company.sections.map((section: CompanySection) => {
                  const info = SECTION_TYPE_INFO[section.type] || SECTION_TYPE_INFO.GENERAL;
                  return (
                    <motion.div 
                      layout
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative bg-white rounded-3xl p-8 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className={`p-3 rounded-xl bg-slate-50 ${info.color} group-hover:bg-white group-hover:shadow-md transition-all`}>
                          <info.icon className="w-5 h-5" />
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => setEditingSection(section)} className="p-2.5 text-slate-400 hover:text-mariner transition-all"><Edit3 className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteSection(section.id)} className="p-2.5 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                      <div className="flex-1 space-y-3">
                        <h4 className="text-xl font-black text-slate-800 leading-tight group-hover:text-mariner transition-colors">{section.title}</h4>
                        <p className="text-slate-500 font-medium leading-relaxed line-clamp-3 text-xs">{section.content}</p>
                      </div>
                      <div className="mt-6 pt-6 border-t border-slate-50">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${info.color}`}>
                          {info.label}
                        </span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </AnimatePresence>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="bg-white rounded-[3rem] shadow-xl border border-slate-100 p-10 space-y-8">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                 <div className="p-1.5 bg-red-50 rounded-lg"><Heart className="w-5 h-5 text-red-500" /></div> Quyền lợi & Đãi ngộ
               </h3>
            </div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Đặc quyền dành cho nhân tài</p>
          </div>

          <div className="space-y-6">
            <div className="relative group">
              <input 
                type="text"
                placeholder="Thêm quyền lợi mới..."
                value={newBenefit}
                onChange={e => setNewBenefit(e.target.value)}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-red-100 focus:bg-white rounded-2xl px-6 py-4 font-bold text-sm outline-none transition-all placeholder:text-slate-200"
                onKeyDown={e => e.key === 'Enter' && handleAddBenefit()}
              />
              <button 
                onClick={() => handleAddBenefit()}
                disabled={loading === 'benefit'}
                className="absolute right-2 top-2 bottom-2 px-6 bg-slate-900 text-white rounded-xl font-black hover:bg-red-500 transition-all shadow-md flex items-center gap-2 active:scale-95 text-xs"
              >
                {loading === 'benefit' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                THÊM
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {BENEFIT_SUGGESTIONS.map((suggestion, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddBenefit(suggestion.title)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-full text-[10px] font-black border border-transparent hover:border-red-100 transition-all"
                >
                  <suggestion.icon className="w-3 h-3" />
                  {suggestion.title}
                </button>
              ))}
            </div>

            <div className="pt-6 border-t border-slate-50">
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {company.benefits?.map((benefit: CompanyBenefit) => (
                    <motion.div 
                      layout
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      key={benefit.id} 
                      className="group flex items-center gap-2.5 bg-white border border-slate-100 px-4 py-2 rounded-xl hover:border-red-200 transition-all shadow-sm"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                      <span className="text-xs font-bold text-slate-700">{benefit.title}</span>
                      <button onClick={() => handleDeleteBenefit(benefit.id)} className="p-0.5 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-all"><X className="w-3 h-3" /></button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#0f172a] rounded-[3rem] shadow-xl p-10 text-white relative overflow-hidden flex flex-col">
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <h3 className="text-2xl font-black flex items-center gap-2">
                     <div className="p-1.5 bg-white/5 rounded-lg border border-white/10"><HistoryIcon className="w-5 h-5 text-amber-400" /></div> Lịch sử phát triển
                   </h3>
                </div>
                <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">Cột mốc vàng</p>
              </div>
              {!editingHistory && (
                <button 
                  onClick={() => setEditingHistory({ year: '', event: '' } as CompanyHistory)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-lg border border-white/10 transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5 inline mr-1.5" /> THÊM MỐC
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {editingHistory ? (
                <motion.form 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleUpsertHistory}
                  className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8 space-y-4"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Thời gian (Ngày-Tháng-Năm)</label>
                       <input 
                        type="text"
                        value={editingHistory.year}
                        onChange={e => setEditingHistory({...editingHistory, year: e.target.value})}
                        className="w-full bg-white/5 border-none rounded-lg px-4 py-3 font-black text-amber-400 text-base outline-none focus:ring-1 focus:ring-amber-500/50"
                        placeholder="VD: 2007-10-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Sự kiện chính</label>
                      <input 
                        type="text"
                        value={editingHistory.event}
                        onChange={e => setEditingHistory({...editingHistory, event: e.target.value})}
                        className="w-full bg-white/5 border-none rounded-lg px-4 py-3 font-bold text-white text-sm outline-none focus:ring-1 focus:ring-amber-500/50"
                        placeholder="VD: Công ty chính thức hoạt động."
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setEditingHistory(null)} className="text-[9px] font-black text-white/40 uppercase hover:text-white transition-colors tracking-widest">HỦY BỎ</button>
                    <button type="submit" disabled={loading === 'history'} className="px-6 py-2.5 bg-amber-500 text-slate-950 font-black rounded-lg text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                       {loading === 'history' ? 'ĐANG LƯU...' : 'XÁC NHẬN'}
                    </button>
                  </div>
                </motion.form>
              ) : null}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto max-h-[300px] pr-4 custom-scrollbar">
              {(!company.history || company.history.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 py-10">
                  <HistoryIcon className="w-12 h-12 mb-4" />
                  <p className="text-sm font-bold">Chưa có cột mốc nào</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {company.history.map((h: CompanyHistory) => (
                    <li key={h.id} className="group flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-transparent hover:border-white/10 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <p className="text-xs font-bold text-slate-300">
                          <span className="text-amber-500 mr-2">{h.year}:</span>
                          {h.event}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button onClick={() => setEditingHistory(h)} className="p-1.5 text-white/20 hover:text-white"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteHistory(h.id)} className="p-1.5 text-white/20 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function SocialInput({ icon, placeholder, value, onChange }: { icon: React.ReactNode; placeholder: string; value: string; onChange: (val: string) => void }) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-mariner transition-colors">
        {icon}
      </div>
      <input 
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs font-medium focus:border-mariner transition-all outline-none"
      />
    </div>
  );
}

function StatCard({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm p-6 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group cursor-default">
      <div className="mb-3">{icon}</div>
      <div className="flex items-center gap-2">
         <span className="text-sm font-black text-white">{label}</span>
      </div>
      <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Thông tin cốt lõi</div>
    </div>
  );
}
