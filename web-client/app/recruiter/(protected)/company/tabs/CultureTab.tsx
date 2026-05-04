'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Image as ImageIcon, Plus, Trash2, Edit3, 
  History, Layout, Save, X, Sparkles, CheckCircle,
  Zap, Trophy, Target, Users2, Rocket
} from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface CultureTabProps {
  company: any;
  onUpdate: () => void;
}

const SECTION_TYPE_ICONS: Record<string, any> = {
  INTRODUCTION: Rocket,
  HR_POLICY: Target,
  ADVANCEMENT: Trophy,
  SALARY: Zap,
  INSURANCE: Heart,
  ACTIVITIES: Users2,
  GENERAL: Layout
};

export default function CultureTab({ company, onUpdate }: CultureTabProps) {
  const [editingSection, setEditingSection] = useState<any>(null);
  const [editingHistory, setEditingHistory] = useState<any>(null);
  const [newBenefit, setNewBenefit] = useState('');
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpsertSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('section');
    try {
      await api.post('/companies/my-company/sections', editingSection);
      toast.success('Đã lưu mục giới thiệu!');
      setEditingSection(null);
      onUpdate();
    } catch (error) {
      toast.error('Lỗi khi lưu mục giới thiệu');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa mục này?')) return;
    try {
      await api.delete(`/companies/my-company/sections/${id}`);
      toast.success('Đã xóa mục giới thiệu');
      onUpdate();
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  const handleAddBenefit = async () => {
    if (!newBenefit.trim()) return;
    setLoading('benefit');
    try {
      await api.post('/companies/my-company/benefits', { title: newBenefit });
      setNewBenefit('');
      onUpdate();
    } catch (error) {
      toast.error('Lỗi khi thêm phúc lợi');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteBenefit = async (id: string) => {
    try {
      await api.delete(`/companies/my-company/benefits/${id}`);
      onUpdate();
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  const handleUpsertHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('history');
    try {
      await api.post('/companies/my-company/history', editingHistory);
      setEditingHistory(null);
      onUpdate();
    } catch (error) {
      toast.error('Lỗi khi lưu lịch sử');
    } finally {
      setLoading(null);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      await api.delete(`/companies/my-company/history/${id}`);
      onUpdate();
    } catch (error) {
      toast.error('Lỗi khi xóa');
    }
  };

  return (
    <motion.div
      key="culture"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-12 pb-32"
    >
      {/* 1. Header Section - Premium Editorial Look */}
      <section className="relative py-12 px-8 overflow-hidden rounded-[3rem] bg-slate-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-mariner/20 to-transparent"></div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-mariner/10 rounded-full blur-[100px]"></div>
        
        <div className="relative z-10 max-w-3xl">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center gap-2 text-mariner font-black uppercase tracking-[0.3em] text-xs mb-4"
          >
            <Sparkles className="w-4 h-4" /> Employer Branding
          </motion.div>
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-[0.9] mb-6">
            Kiến tạo <span className="text-mariner">Văn hóa</span> <br />Chinh phục <span className="italic">Nhân tài</span>
          </h2>
          <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
            Một hồ sơ văn hóa tốt giúp tăng 60% tỉ lệ ứng tuyển tự nhiên. Hãy kể câu chuyện của bạn một cách chân thực nhất.
          </p>
        </div>
      </section>

      {/* 2. Sections Management - Asymmetric Grid */}
      <section className="space-y-8">
        <div className="flex items-end justify-between px-4">
          <div>
            <h3 className="text-3xl font-black text-slate-800 tracking-tight">Câu chuyện doanh nghiệp</h3>
            <p className="text-slate-500 font-bold">Các mục nội dung chi tiết về định hướng và chính sách.</p>
          </div>
          {!editingSection && (
            <button 
              onClick={() => setEditingSection({ title: '', content: '', type: 'GENERAL', displayOrder: company.sections.length })}
              className="group flex items-center gap-3 px-6 py-3 bg-slate-900 text-white font-black rounded-2xl hover:bg-mariner transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> Thêm chương mới
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {editingSection ? (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onSubmit={handleUpsertSection}
              className="bg-white rounded-[3rem] p-10 border-2 border-mariner/20 shadow-2xl shadow-mariner/5 space-y-8"
            >
              <div className="grid gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Tiêu đề chương</label>
                  <input 
                    type="text"
                    placeholder="VD: Tầm nhìn & Sứ mệnh"
                    value={editingSection.title}
                    onChange={e => setEditingSection({...editingSection, title: e.target.value})}
                    className="w-full text-3xl font-black bg-slate-50 border-none rounded-2xl py-4 px-6 focus:ring-4 focus:ring-mariner/10 outline-none transition-all placeholder:text-slate-300"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nội dung chi tiết</label>
                    <textarea 
                      placeholder="Hãy mô tả một cách lôi cuốn..."
                      value={editingSection.content}
                      onChange={e => setEditingSection({...editingSection, content: e.target.value})}
                      className="w-full h-64 bg-slate-50 border-none rounded-3xl py-4 px-6 focus:ring-4 focus:ring-mariner/10 outline-none transition-all font-medium leading-relaxed resize-none"
                      required
                    />
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Phân loại</label>
                      <select 
                        value={editingSection.type}
                        onChange={e => setEditingSection({...editingSection, type: e.target.value})}
                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-600 outline-none focus:ring-4 focus:ring-mariner/10 transition-all appearance-none"
                      >
                        <option value="GENERAL">Chung</option>
                        <option value="INTRODUCTION">Giới thiệu</option>
                        <option value="HR_POLICY">Chính sách nhân sự</option>
                        <option value="ADVANCEMENT">Cơ hội thăng tiến</option>
                        <option value="SALARY">Lương & Thưởng</option>
                        <option value="INSURANCE">Bảo hiểm</option>
                        <option value="ACTIVITIES">Hoạt động</option>
                      </select>
                    </div>
                    <div className="p-6 bg-mariner/5 rounded-3xl border border-mariner/10">
                      <p className="text-xs font-bold text-mariner/60 leading-relaxed italic">
                        "Mẹo: Các mục như 'Lương & Thưởng' hoặc 'Cơ hội thăng tiến' thường thu hút nhiều lượt xem nhất từ ứng viên tiềm năng."
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="px-8 py-4 text-slate-400 font-black hover:text-slate-600 transition-all"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  disabled={loading === 'section'}
                  className="px-10 py-4 bg-mariner text-white font-black rounded-2xl hover:brightness-110 shadow-xl shadow-mariner/20 flex items-center gap-3 active:scale-95 transition-all"
                >
                  {loading === 'section' ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                  Lưu chương này
                </button>
              </div>
            </motion.form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {company.sections.length === 0 ? (
                <div className="md:col-span-2 py-24 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[3rem] flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Layout className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 font-black text-xl">Chưa có chương nội dung nào</p>
                  <p className="text-slate-400 font-medium max-w-xs mt-2">Nhấp vào "Thêm chương mới" để bắt đầu xây dựng thương hiệu tuyển dụng của bạn.</p>
                </div>
              ) : (
                company.sections.map((section: any, idx: number) => {
                  const Icon = SECTION_TYPE_ICONS[section.type] || Layout;
                  return (
                    <motion.div 
                      key={section.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group relative bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-500"
                    >
                      <div className="flex items-start justify-between mb-6">
                        <div className="p-4 bg-mariner/5 rounded-2xl text-mariner group-hover:bg-mariner group-hover:text-white transition-all duration-500">
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <button 
                            onClick={() => setEditingSection(section)}
                            className="p-3 bg-white text-slate-400 hover:text-mariner rounded-xl border border-slate-100 shadow-sm transition-all"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeleteSection(section.id)}
                            className="p-3 bg-white text-slate-400 hover:text-red-500 rounded-xl border border-slate-100 shadow-sm transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">{section.title}</h4>
                      <p className="text-slate-500 font-medium leading-relaxed line-clamp-3 text-sm">{section.content}</p>
                      <div className="mt-6 pt-6 border-t border-slate-50">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 group-hover:text-mariner transition-colors">
                          Category: {section.type}
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* 3. Benefit Management - Creative Card */}
        <div className="lg:col-span-3 bg-white rounded-[3rem] shadow-xl border border-slate-100 p-10 overflow-hidden relative">
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-red-50 rounded-full blur-3xl opacity-50"></div>
          
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-8">
              <div className="p-2 bg-red-50 rounded-lg"><Heart className="w-6 h-6 text-red-500" /></div> Chế độ đãi ngộ & Phúc lợi
            </h3>
            
            <div className="flex gap-3 mb-10">
              <input 
                type="text"
                placeholder="VD: Macbook Pro cho mọi nhân viên..."
                value={newBenefit}
                onChange={e => setNewBenefit(e.target.value)}
                className="flex-1 bg-slate-50 border-none rounded-2xl px-6 py-4 font-bold outline-none focus:ring-4 focus:ring-red-500/5 transition-all"
                onKeyDown={e => e.key === 'Enter' && handleAddBenefit()}
              />
              <button 
                onClick={handleAddBenefit}
                disabled={loading === 'benefit'}
                className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-red-500 transition-all shadow-xl shadow-slate-900/10"
              >
                {loading === 'benefit' ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Plus className="w-5 h-5" />}
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              {company.benefits.map((benefit: any) => (
                <motion.div 
                  layout
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  key={benefit.id} 
                  className="group flex items-center gap-3 bg-white border border-slate-100 px-5 py-3 rounded-2xl shadow-sm hover:border-red-200 transition-all cursor-default"
                >
                  <div className="w-2 h-2 rounded-full bg-red-500 group-hover:scale-150 transition-transform"></div>
                  <span className="text-sm font-black text-slate-700">{benefit.title}</span>
                  <button 
                    onClick={() => handleDeleteBenefit(benefit.id)}
                    className="ml-2 text-slate-300 hover:text-red-500 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. History Management - Vertical Timeline */}
        <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] shadow-xl p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <History className="w-32 h-32" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-2xl font-black flex items-center gap-3">
                <History className="w-6 h-6 text-amber-500" /> Cột mốc vàng
              </h3>
              {!editingHistory && (
                <button 
                  onClick={() => setEditingHistory({ year: new Date().getFullYear(), event: '' })}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                >
                  <Plus className="w-3 h-3 inline mr-1" /> Thêm mốc
                </button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {editingHistory && (
                <motion.form 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleUpsertHistory}
                  className="bg-white/5 rounded-[2rem] p-6 border border-white/10 mb-8 space-y-4"
                >
                  <div className="space-y-4">
                    <input 
                      type="number"
                      value={editingHistory.year}
                      onChange={e => setEditingHistory({...editingHistory, year: parseInt(e.target.value)})}
                      className="w-full bg-white/5 border-none rounded-xl px-4 py-3 font-black text-amber-500 outline-none focus:ring-2 focus:ring-amber-500/50"
                      placeholder="Năm"
                      required
                    />
                    <textarea 
                      value={editingHistory.event}
                      onChange={e => setEditingHistory({...editingHistory, event: e.target.value})}
                      className="w-full h-24 bg-white/5 border-none rounded-xl px-4 py-3 font-bold text-white outline-none focus:ring-2 focus:ring-amber-500/50 resize-none"
                      placeholder="Sự kiện tiêu biểu..."
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setEditingHistory(null)} className="text-[10px] font-black text-white/40 uppercase hover:text-white transition-colors">Hủy bỏ</button>
                    <button type="submit" disabled={loading === 'history'} className="px-6 py-2 bg-amber-500 text-slate-900 font-black rounded-lg text-xs active:scale-95 transition-all">
                      Xác nhận
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            <div className="space-y-8 relative">
              <div className="absolute left-[11px] top-4 bottom-4 w-[2px] bg-white/10" />
              {company.history.length === 0 ? (
                <p className="text-white/30 font-bold italic text-sm text-center py-10">Kể lại hành trình của bạn...</p>
              ) : (
                company.history.map((h: any) => (
                  <div key={h.id} className="group flex gap-6 relative">
                    <div className="w-6 h-6 rounded-full bg-slate-900 border-2 border-amber-500 flex items-center justify-center shrink-0 z-10 group-hover:scale-125 transition-transform duration-300">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl font-black text-amber-500">{h.year}</span>
                        <button 
                          onClick={() => handleDeleteHistory(h.id)}
                          className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-500 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-slate-300 font-bold leading-relaxed text-sm">{h.event}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
