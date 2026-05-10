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
  const [editingSection, setEditingSection] = useState<(Omit<CompanySection, 'id'> & { id?: string }) | null>(null);
  const [editingHistory, setEditingHistory] = useState<(Omit<CompanyHistory, 'id'> & { id?: string }) | null>(null);
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
      setEditingSection(null); // Reset view to default to prevent ghost-state reference
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

  // --- Dynamic Context Resolution ---
  // 1. Canonical selection determining what to render right now
  const currentSection = editingSection || company.sections?.find((s: CompanySection) => s.type === 'HR_POLICY') || {
    title: '',
    content: '',
    type: 'HR_POLICY',
    displayOrder: 0
  } as CompanySection;

  // 2. Unique active resolver supporting multiple items of the same type
  const checkIsActive = (type: string, itemId?: string) => {
    if (itemId && currentSection.id) {
      return currentSection.id === itemId;
    }
    // Catch newly initialized items that don't have IDs yet:
    if (!itemId && !currentSection.id) {
      return currentSection.type === type;
    }
    // Fallback for fixed singletons when not explicitly stored in DB yet:
    return currentSection.type === type && !currentSection.id && !itemId;
  };

  const FIXED_KEYS = ['HR_POLICY', 'ADVANCEMENT', 'SALARY', 'INSURANCE', 'ACTIVITIES'];
  const savedGenerals = company.sections?.filter((s: CompanySection) => s.type === 'GENERAL') || [];

  return (
    <motion.div
      key="culture"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-32"
    >

      <section className="space-y-8">
        <div className="space-y-1 px-4">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">Câu chuyện doanh nghiệp</h3>
          <p className="text-slate-500 font-bold text-sm">Tạo ấn tượng mạnh mẽ tới ứng viên bằng các câu chuyện văn hóa rõ nét.</p>
        </div>

        {/* NEW 2-COLUMN LAYOUT: Permanent Sidebar Navigation + Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* LEFT SIDEBAR: Chapter Navigation */}
          <div className="lg:col-span-4 space-y-6">
            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Danh mục cốt lõi</label>
              <div className="flex flex-col gap-2">
                {FIXED_KEYS.map((key) => {
                  const info = SECTION_TYPE_INFO[key];
                  const existing = company.sections?.find((s: CompanySection) => s.type === key);
                  const isActive = checkIsActive(key, existing?.id);
                  
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
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
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left shadow-sm group ${
                        isActive 
                          ? 'border-slate-900 bg-indigo-50/50 ring-1 ring-slate-900' 
                          : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isActive ? 'bg-white shadow-sm ' + info.color : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'
                      }`}>
                        <info.icon className="w-5 h-5" />
                      </div>
                      
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`font-black text-[13px] uppercase tracking-tight truncate pr-2 ${
                          isActive ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-900'
                        }`}>
                          {info.label}
                        </span>
                        {existing && (
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Mục bổ sung khác</label>
              
              <div className="flex flex-col gap-2">
                {/* Render saved generic sections */}
                {savedGenerals.map((genSection: CompanySection) => {
                  const info = SECTION_TYPE_INFO.GENERAL;
                  const isActive = checkIsActive('GENERAL', genSection.id);
                  const finalLabel = isActive ? (editingSection?.title || genSection.title || info.label) : (genSection.title || info.label);
                  
                  return (
                    <button
                      key={genSection.id}
                      type="button"
                      onClick={() => setEditingSection(genSection)}
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all text-left shadow-sm group ${
                        isActive 
                          ? 'border-slate-900 bg-indigo-50/50 ring-1 ring-slate-900' 
                          : 'border-slate-100 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`p-2 rounded-lg transition-colors ${
                        isActive ? 'bg-white shadow-sm ' + info.color : 'bg-slate-50 text-slate-400 group-hover:text-slate-600'
                      }`}>
                        <info.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span className={`font-black text-[13px] uppercase tracking-tight truncate pr-2 ${
                          isActive ? 'text-indigo-700' : 'text-slate-600 group-hover:text-slate-900'
                        }`}>
                          {finalLabel}
                        </span>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                      </div>
                    </button>
                  );
                })}

                {/* Dynamic Unsaved Blank State if actively creating */}
                {(!currentSection.id && currentSection.type === 'GENERAL') && (
                  <button
                    type="button"
                    className="flex items-center gap-4 p-4 rounded-xl border transition-all text-left shadow-sm border-slate-900 bg-indigo-50/50 ring-1 ring-slate-900"
                  >
                    <div className="p-2 rounded-lg bg-white shadow-sm text-slate-500">
                      <Layout className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                       <span className="font-black text-[13px] uppercase tracking-tight text-indigo-700 truncate block pr-2">
                          {currentSection.title || 'Mục mới đang soạn...'}
                       </span>
                    </div>
                  </button>
                )}

                {/* Add Button */}
                <button 
                  onClick={() => {
                    setEditingSection({
                      title: '',
                      content: '',
                      type: 'GENERAL',
                      displayOrder: company.sections?.length || 0
                    } as CompanySection);
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all active:scale-95 font-black text-xs uppercase tracking-widest mt-2"
                >
                  <Plus className="w-4 h-4" /> THÊM MỤC TỰ CHỌN
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Active Content Editor */}
          <div className="lg:col-span-8">
            {(() => {
              const sectionInfo = SECTION_TYPE_INFO[currentSection.type] || SECTION_TYPE_INFO.HR_POLICY;
              const isExisting = !!currentSection.id;

              return (
                <motion.form
                  key={currentSection.id || currentSection.type}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setLoading('section');
                    try {
                      // If type is GENERAL, use explicitly typed title. Else use default label.
                      const finalTitle = currentSection.type === 'GENERAL' 
                        ? currentSection.title 
                        : sectionInfo.label;

                      const response = await api.post(`/companies/my-company/sections`, {
                        ...currentSection,
                        title: finalTitle 
                      });
                      
                      // IMPORTANT: Sync response data into local edit state to secure the database ID and stop "Add New" loop!
                      setEditingSection(response.data);
                      
                      onUpdate();
                      toast.success('Đã lưu nội dung!');
                    } catch {
                      toast.error('Không thể lưu nội dung');
                    } finally {
                      setLoading(null);
                    }
                  }}
                  className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl flex flex-col min-h-[400px] relative overflow-hidden"
                >
                  {/* Top Toolbar */}
                  <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100 ${sectionInfo.color}`}>
                        <sectionInfo.icon className="w-5 h-5" />
                      </div>
                      <div>
                        {currentSection.type === 'GENERAL' ? (
                          <div className="flex items-center gap-2">
                             <span className="text-lg font-black text-slate-800 tracking-tight shrink-0">Biên tập:</span>
                             <input 
                               value={currentSection.title}
                               placeholder="Nhập tên loại chương..."
                               onChange={e => setEditingSection({...currentSection, title: e.target.value})}
                               className="text-lg font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 focus:border-indigo-400 outline-none tracking-tight min-w-[200px]"
                               required
                             />
                          </div>
                        ) : (
                          <h4 className="text-lg font-black text-slate-800 tracking-tight">Biên tập: {sectionInfo.label}</h4>
                        )}
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Chỉnh sửa và lưu ngay</p>
                      </div>
                    </div>
                    
                    {isExisting && (
                      <button 
                        type="button"
                        onClick={() => handleDeleteSection((currentSection as CompanySection).id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Xóa
                      </button>
                    )}
                  </div>

                  {/* Editor Fields */}
                  <div className="flex-1 p-8 flex flex-col space-y-6">
                    <div className="space-y-2 flex-1 flex flex-col">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả nội dung chi tiết</label>
                      <textarea 
                        placeholder={sectionInfo.placeholder}
                        value={currentSection.content}
                        onChange={e => setEditingSection({...currentSection, content: e.target.value})}
                        className="w-full flex-1 min-h-[320px] bg-slate-50 border border-slate-100 focus:border-indigo-200 focus:bg-white rounded-2xl py-5 px-6 outline-none transition-all font-medium text-slate-700 leading-relaxed resize-none text-sm placeholder:text-slate-300 shadow-inner-sm"
                        required
                      />
                    </div>
                  </div>

                  {/* Footer Save Button */}
                  <div className="px-8 py-5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end gap-4">
                     <button 
                       type="submit"
                       disabled={loading === 'section'}
                       className="px-10 py-3.5 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-slate-900/10 hover:shadow-indigo-200 flex items-center gap-2 active:scale-95 transition-all text-xs uppercase tracking-widest"
                     >
                       {loading === 'section' ? (
                         <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       ) : (
                         <Save className="w-4 h-4" />
                       )}
                       Lưu thay đổi
                     </button>
                  </div>
                </motion.form>
              );
            })()}
          </div>
        </div>
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

        <section className="bg-white rounded-[3rem] shadow-xl p-10 text-slate-900 border border-slate-100 relative overflow-hidden flex flex-col">
          <div className="relative z-10 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <h3 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                     <div className="p-1.5 bg-amber-50 rounded-lg"><HistoryIcon className="w-5 h-5 text-amber-500" /></div> Lịch sử phát triển
                   </h3>
                </div>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-wider">Cột mốc vàng</p>
              </div>
              {!editingHistory && (
                <button 
                  onClick={() => setEditingHistory({ year: '', event: '' } as CompanyHistory)}
                  className="px-4 py-2 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-600 font-black text-[10px] uppercase tracking-widest rounded-lg border border-slate-200 transition-all active:scale-95"
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
                  className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-8 space-y-4"
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Thời gian (Ngày-Tháng-Năm)</label>
                       <input 
                        type="text"
                        value={editingHistory.year}
                        onChange={e => setEditingHistory({...editingHistory, year: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-black text-amber-600 text-base outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                        placeholder="VD: 2007-10-10"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sự kiện chính</label>
                      <input 
                        type="text"
                        value={editingHistory.event}
                        onChange={e => setEditingHistory({...editingHistory, event: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 font-bold text-slate-800 text-sm outline-none focus:ring-2 focus:ring-amber-100 transition-all"
                        placeholder="VD: Công ty chính thức hoạt động."
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setEditingHistory(null)} className="text-[9px] font-black text-slate-400 uppercase hover:text-slate-600 transition-colors tracking-widest">HỦY BỎ</button>
                    <button type="submit" disabled={loading === 'history'} className="px-6 py-2.5 bg-amber-500 text-white font-black rounded-lg text-[10px] uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-all">
                       {loading === 'history' ? 'ĐANG LƯU...' : 'XÁC NHẬN'}
                    </button>
                  </div>
                </motion.form>
              ) : null}
            </AnimatePresence>

            <div className="flex-1 overflow-y-auto max-h-[300px] pr-4 custom-scrollbar">
              {(!company.history || company.history.length === 0) ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 py-10">
                  <HistoryIcon className="w-12 h-12 mb-4 opacity-50" />
                  <p className="text-sm font-bold">Chưa có cột mốc nào</p>
                </div>
              ) : (
                <ul className="space-y-4">
                  {company.history.map((h: CompanyHistory) => (
                    <li key={h.id} className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:border-amber-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                        <p className="text-xs font-bold text-slate-600">
                          <span className="text-amber-600 mr-2">{h.year}:</span>
                          {h.event}
                        </p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all shrink-0">
                        <button onClick={() => setEditingHistory(h)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeleteHistory(h.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
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
