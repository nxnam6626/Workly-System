import React from "react";
import { GraduationCap, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { UseFormRegister } from "react-hook-form";
import { CVFormData } from "./cv-review.schema";

interface EducationSectionProps {
  fields: any[];
  register: UseFormRegister<CVFormData>;
  append: (data: any) => void;
  remove: (index: number) => void;
}

export const EducationSection: React.FC<EducationSectionProps> = ({ 
  fields, 
  register, 
  append, 
  remove 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 border border-orange-100">
            <GraduationCap className="w-5 h-5" />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nền tảng học vấn</h3>
        </div>
        <button 
          type="button" 
          onClick={() => append({ school: "", degree: "", major: "" })} 
          className="px-5 py-2.5 bg-orange-50 text-orange-600 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-orange-100 transition-all active:scale-95 border border-orange-100"
        >
          <Plus className="w-4 h-4" /> Thêm học vấn
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {fields.map((field, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale:0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              key={field.id}
              className="p-8 bg-white border border-slate-100 rounded-[2.5rem] relative group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
            >
              <button 
                type="button" 
                onClick={() => remove(index)} 
                className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Trường đại học / trung tâm</label>
                  <input 
                    {...register(`education.${index}.school`)} 
                    placeholder="VD: Đại học Bách Khoa TP.HCM" 
                    className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 transition-all" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bằng cấp</label>
                    <input 
                      {...register(`education.${index}.degree`)} 
                      placeholder="VD: Cử nhân" 
                      className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Chuyên ngành</label>
                    <input 
                      {...register(`education.${index}.major`)} 
                      placeholder="VD: IT" 
                      className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700" 
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
