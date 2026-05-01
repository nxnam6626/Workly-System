import React from "react";
import { Award, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SkillsSectionProps {
  skills: any[];
  setSkills: (skills: any[]) => void;
  skillInput: string;
  setSkillInput: (input: string) => void;
  addSkill: () => void;
}

export const SkillsSection: React.FC<SkillsSectionProps> = ({ 
  skills, 
  setSkills, 
  skillInput, 
  setSkillInput, 
  addSkill 
}) => {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
          <Award className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hệ sinh thái kỹ năng</h3>
      </div>

      <div className="space-y-4">
        {Object.entries(
          skills.reduce((acc, s, idx) => {
            const category = typeof s === 'string' ? 'Khác' : s.category || 'Khác';
            if (!acc[category]) acc[category] = [];
            acc[category].push({ item: s, originalIndex: idx });
            return acc;
          }, {} as Record<string, { item: any; originalIndex: number }[]>)
        ).map(([category, items]: any) => (
          <div key={category} className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              {category} <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded-full text-[10px]">{items.length}</span>
            </h4>
            <div className="flex flex-wrap gap-2.5">
              <AnimatePresence>
                {items.map(({ item, originalIndex }: { item: any, originalIndex: number }) => (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={originalIndex}
                    className="px-4 py-2 bg-white text-blue-600 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2.5 border border-slate-200 shadow-sm hover:border-blue-300 hover:scale-105 transition-all group"
                  >
                    {typeof item === 'string' ? item : item.skillName}
                    {typeof item === 'object' && item.level && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded uppercase ml-1 opacity-80">
                        {item.level === 'ADVANCED' ? 'Nâng cao' : item.level === 'INTERMEDIATE' ? 'Trung bình' : 'Cơ bản'}
                      </span>
                    )}
                    <button 
                      type="button" 
                      onClick={() => setSkills(skills.filter((_, idx) => idx !== originalIndex))} 
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        ))}

        {skills.length === 0 && (
          <div className="p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 min-h-[60px] flex items-center justify-center">
            <span className="text-slate-300 text-xs font-bold italic">Chưa có kỹ năng nào được thêm...</span>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            placeholder="Thêm kỹ năng (VD: React, Figma, English...)"
            className="w-full pl-6 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800 placeholder:text-slate-400"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-200 rounded-md text-[10px] font-black text-slate-500 uppercase tracking-widest hidden sm:block">Enter</div>
        </div>
        <button 
          type="button" 
          onClick={addSkill} 
          className="px-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase transition-all hover:bg-blue-600 active:scale-95 shadow-lg shadow-slate-200"
        >
          Thêm
        </button>
      </div>
    </div>
  );
};
