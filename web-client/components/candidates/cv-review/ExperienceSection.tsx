import React from "react";
import { Briefcase, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UseFormRegister } from "react-hook-form";
import { CVFormData } from "./cv-review.schema";

interface ExperienceSectionProps {
  fields: any[];
  register: UseFormRegister<CVFormData>;
  append: (data: any) => void;
  remove: (index: number) => void;
}

export const ExperienceSection: React.FC<ExperienceSectionProps> = ({ 
  fields, 
  register, 
  append, 
  remove 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
            <Briefcase className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hành trình sự nghiệp</h3>
        </div>
        <button 
          type="button" 
          onClick={() => append({ company: "", role: "", years: 0, description: "" })} 
          className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-blue-100 transition-all active:scale-95 border border-blue-100"
        >
          <Plus className="w-4 h-4" /> Thêm mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {fields.map((field, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              key={field.id}
              className="p-8 bg-white border border-slate-100 rounded-[2.5rem] relative group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all ring-1 ring-slate-50"
            >
              <button 
                type="button" 
                onClick={() => remove(index)} 
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 bg-white"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Công ty / Tổ chức</label>
                  <input 
                    {...register(`experience.${index}.company`)} 
                    className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 transition-all" 
                    placeholder="VD: Google Vietnam" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vị trí đảm nhiệm</label>
                  <input 
                    {...register(`experience.${index}.role`)} 
                    className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 transition-all" 
                    placeholder="VD: Senior Product Designer" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số năm làm học</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    {...register(`experience.${index}.years`, { valueAsNumber: true })} 
                    className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 transition-all" 
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả công việc & thành tựu</label>
                  <textarea 
                    {...register(`experience.${index}.description`)} 
                    className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-600 min-h-[100px] leading-relaxed resize-none" 
                    placeholder="Mô tả cụ thể vai trò của bạn..." 
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
