"use client";

import React from "react";
import { 
  X, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  Briefcase, 
  GraduationCap, 
  Award, 
  User, 
  Mail, 
  Phone, 
  Target,
  Sparkles,
  ArrowRight,
  ChevronRight,
  Info
} from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";

const cvSchema = z.object({
  fullName: z.string().min(2, "Họ tên quá ngắn"),
  email: z.string().email("Email không hợp lệ"),
  phone: z.string().min(10, "Số điện thoại không hợp lệ"),
  skills: z.array(z.string()).min(1, "Vui lòng nhập ít nhất 1 kỹ năng"),
  experience: z.array(z.object({
    company: z.string().min(1, "Tên công ty không được để trống"),
    role: z.string().min(1, "Vị trí không được để trống"),
    years: z.number().min(0, "Số năm phải >= 0"),
    description: z.string().optional(),
  })),
  education: z.array(z.object({
    school: z.string().min(1, "Tên trường không được để trống"),
    degree: z.string().min(1, "Bằng cấp không được để trống"),
    major: z.string().min(1, "Chuyên ngành không được để trống"),
  })),
  totalYearsExp: z.number().min(0),
  summary: z.string().optional(),
});

type CVFormData = z.infer<typeof cvSchema>;

interface CVReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  fileUrl: string;
  cvTitle: string;
  cvId?: string;
  onSuccess: (savedCv: any) => void;
}

export function CVReviewModal({ isOpen, onClose, initialData, fileUrl, cvTitle, cvId, onSuccess }: CVReviewModalProps) {
  const { register, control, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CVFormData>({
    resolver: zodResolver(cvSchema),
    defaultValues: {
      fullName: initialData?.fullName || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      skills: initialData?.skills || [],
      experience: initialData?.experience || [],
      education: initialData?.education || [],
      totalYearsExp: initialData?.totalYearsExp || 0,
      summary: initialData?.summary || "",
    },
  });

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control,
    name: "experience",
  });

  const { fields: eduFields, append: appendEdu, remove: removeEdu } = useFieldArray({
    control,
    name: "education",
  });

  const [skillInput, setSkillInput] = React.useState("");
  const [skills, setSkills] = React.useState<string[]>(initialData?.skills || []);

  // Sync skills when they change
  React.useEffect(() => {
    setValue("skills", skills);
  }, [skills, setValue]);

  if (!isOpen) return null;

  const onFormSubmit = async (data: CVFormData) => {
    try {
      let response;
      if (cvId) {
        response = await api.patch(`/candidates/cv/${cvId}`, {
          cvTitle,
          fileUrl,
          isMain: true,
          parsedData: { ...data, skills },
        });
      } else {
        response = await api.post("/candidates/cv", {
          cvTitle,
          fileUrl,
          isMain: true,
          parsedData: { ...data, skills },
        });
      }
      toast.success("Hồ sơ đã được xác nhận và cập nhật thành công!");
      onSuccess(response.data);
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu hồ sơ.");
    }
  };

  const onFormError = (errors: any) => {
    console.error("Validation Errors:", errors);
    toast.error("Vui lòng kiểm tra lại thông tin. Một số trường chưa hợp lệ.");
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Dynamic Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-5xl max-h-[92vh] rounded-[2.5rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col relative z-10 border border-slate-200"
      >
        {/* Superior Header */}
        <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
          {/* Decorative Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 flex justify-between items-center">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">AI Review Mode</span>
              </div>
              <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                Xác nhận hồ sơ
                <ArrowRight className="w-6 h-6 text-blue-400" />
              </h2>
              <p className="text-slate-400 font-medium text-sm">Vui lòng tinh chỉnh các thông tin mà AI đã nhận diện từ bản CV của bạn.</p>
            </div>
            <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 active:scale-90">
              <X className="w-6 h-6 text-white/50" />
            </button>
          </div>
        </div>

        {/* Content Area (Glassmorphism inspired) */}
        <div className="flex-1 overflow-y-auto p-10 bg-[#F8FAFC]">
          <form id="cv-review-form" onSubmit={handleSubmit(onFormSubmit as any, onFormError)} className="space-y-12">
            
            {/* Phase 1: Essential Identity */}
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
                    <input {...register("fullName")} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800 placeholder:text-slate-300" placeholder="Jane Doe" />
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-[10px] font-bold ml-1">{errors.fullName.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Email liên hệ</label>
                  <div className="relative">
                   <input {...register("email")} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800" />
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                  <div className="relative">
                    <input {...register("phone")} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800" />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Kinh nghiệm (năm)</label>
                  <div className="relative">
                    <input type="number" step="0.1" {...register("totalYearsExp", { valueAsNumber: true })} className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800" />
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Giới thiệu ngắn gọn</label>
                  <div className="relative">
                    <textarea {...register("summary")} className="w-full pl-11 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-3xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all outline-none font-bold text-slate-800 min-h-[120px] leading-relaxed resize-none" placeholder="Hãy viết về mục tiêu hoặc thế mạnh nổi bật của bạn..." />
                    <Target className="absolute left-4 top-5 w-4 h-4 text-slate-300" />
                  </div>
                </div>
              </div>
            </div>

            {/* Phase 2: Skills Galaxy */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                    <Award className="w-5 h-5" />
                 </div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hệ sinh thái kỹ năng</h3>
              </div>
              
              <div className="flex flex-wrap gap-2.5 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-200 min-h-[60px]">
                <AnimatePresence>
                  {skills.map((s, i) => (
                    <motion.span 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      key={i} 
                      className="px-4 py-2 bg-white text-blue-600 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2.5 border border-slate-200 shadow-sm hover:border-blue-300 hover:scale-105 transition-all group"
                    >
                      {s}
                      <button type="button" onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} className="hover:text-red-500 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
                {skills.length === 0 && <span className="text-slate-300 text-xs font-bold self-center ml-2 italic">Chưa có kỹ năng nào được thêm...</span>}
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
                <button type="button" onClick={addSkill} className="px-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase transition-all hover:bg-blue-600 active:scale-95 shadow-lg shadow-slate-200">
                  Thêm
                </button>
              </div>
            </div>

            {/* Phase 3: Professional Journey */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100">
                      <Briefcase className="w-5 h-5" />
                   </div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Hành trình sự nghiệp</h3>
                </div>
                <button type="button" onClick={() => appendExp({ company: "", role: "", years: 0, description: "" })} className="px-5 py-2.5 bg-blue-50 text-blue-600 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-blue-100 transition-all active:scale-95 border border-blue-100">
                  <Plus className="w-4 h-4" /> Thêm mới
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-6">
                <AnimatePresence>
                  {expFields.map((field, index) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      key={field.id} 
                      className="p-8 bg-white border border-slate-100 rounded-[2.5rem] relative group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all ring-1 ring-slate-50"
                    >
                      <button type="button" onClick={() => removeExp(index)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 bg-white">
                        <Trash2 className="w-5 h-5" />
                      </button>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Công ty / Tổ chức</label>
                          <input {...register(`experience.${index}.company`)} className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 transition-all" placeholder="VD: Google Vietnam" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vị trí đảm nhiệm</label>
                          <input {...register(`experience.${index}.role`)} className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 transition-all" placeholder="VD: Senior Product Designer" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Số năm làm học</label>
                          <input type="number" step="0.1" {...register(`experience.${index}.years`, { valueAsNumber: true })} className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 transition-all" />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Mô tả công việc & thành tựu</label>
                          <textarea {...register(`experience.${index}.description`)} className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-3xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-600 min-h-[100px] leading-relaxed resize-none" placeholder="Mô tả cụ thể vai trò của bạn..." />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Phase 4: Academic Foundation */}
            <div className="space-y-6">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600 border border-orange-100">
                      <GraduationCap className="w-5 h-5" />
                   </div>
                   <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Nền tảng học vấn</h3>
                </div>
                <button type="button" onClick={() => appendEdu({ school: "", degree: "", major: "" })} className="px-5 py-2.5 bg-orange-50 text-orange-600 rounded-xl font-black text-[11px] uppercase tracking-wider flex items-center gap-2 hover:bg-orange-100 transition-all active:scale-95 border border-orange-100">
                  <Plus className="w-4 h-4" /> Thêm học vấn
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {eduFields.map((field, index) => (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      key={field.id} 
                      className="p-8 bg-white border border-slate-100 rounded-[2.5rem] relative group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                    >
                      <button type="button" onClick={() => removeEdu(index)} className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 transition-all">
                        <X className="w-5 h-5" />
                      </button>
                      <div className="space-y-5">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Trường đại học / trung tâm</label>
                           <input {...register(`education.${index}.school`)} placeholder="VD: Đại học Bách Khoa TP.HCM" className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700 transition-all" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Bằng cấp</label>
                            <input {...register(`education.${index}.degree`)} placeholder="VD: Cử nhân" className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Chuyên ngành</label>
                            <input {...register(`education.${index}.major`)} placeholder="VD: IT" className="w-full px-6 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-blue-500 outline-none font-bold text-slate-700" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </form>
        </div>

        {/* Powerful Footer */}
        <div className="p-8 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-3 text-slate-400">
             <div className="w-2 h-2 rounded-full bg-emerald-500" />
             <span className="text-[11px] font-black uppercase tracking-widest">Đã sẵn sàng đồng bộ</span>
          </div>
          <div className="flex gap-4 w-full sm:w-auto">
            <button type="button" onClick={onClose} className="px-8 py-4 bg-slate-50 text-slate-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-100 transition-all active:scale-95 border border-slate-200 w-full sm:w-auto">
              Hủy bỏ
            </button>
            <button 
              type="submit" 
              form="cv-review-form" 
              disabled={isSubmitting}
              className="px-10 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-700 hover:scale-105 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 active:scale-95 flex items-center justify-center gap-3 w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang đồng bộ...
                </>
              ) : (
                <>
                  Xác nhận hồ sơ
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
