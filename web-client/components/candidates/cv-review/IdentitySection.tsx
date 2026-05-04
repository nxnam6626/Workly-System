import React from "react";
import { User, Mail, Phone, Briefcase, Target } from "lucide-react";
import { UseFormRegister, FieldErrors } from "react-hook-form";
import { CVFormData } from "./cv-review.schema";

interface IdentitySectionProps {
  register: UseFormRegister<CVFormData>;
  errors: FieldErrors<CVFormData>;
}

export const IdentitySection: React.FC<IdentitySectionProps> = ({ register, errors }) => {
  return (
    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 border border-blue-100">
          <User className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Thông tin định danh</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Họ và tên</label>
          <div className="relative">
            <input 
              {...register("fullName")} 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800 placeholder:text-slate-300" 
              placeholder="Jane Doe" 
            />
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          </div>
          {errors.fullName && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.fullName.message}</p>}
        </div>
        
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email liên hệ</label>
          <div className="relative">
            <input 
              {...register("email")} 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800" 
            />
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
          <div className="relative">
            <input 
              {...register("phone")} 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800" 
            />
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Kinh nghiệm (năm)</label>
          <div className="relative">
            <input 
              type="number" 
              step="0.1" 
              {...register("totalYearsExp", { valueAsNumber: true })} 
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800" 
            />
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
          </div>
        </div>
        
        <div className="space-y-2 md:col-span-3">
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Giới thiệu ngắn gọn</label>
          <div className="relative">
            <textarea 
              {...register("summary")} 
              className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800 min-h-[120px] leading-relaxed resize-none" 
              placeholder="Hãy viết về mục tiêu hoặc thế mạnh nổi bật của bạn..." 
            />
            <Target className="absolute left-4 top-5 w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
};
