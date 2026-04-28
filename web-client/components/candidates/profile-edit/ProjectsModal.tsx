"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Trash2, Loader2, Terminal, ChevronRight, Sparkles, Link2, Cpu } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";

const schema = z.object({
  projects: z.array(z.object({
    projectName: z.string().min(1, "Vui lòng nhập tên dự án"),
    role: z.string().optional(),
    description: z.string().optional(),
    technology: z.string().optional(),
    link: z.string().optional(),
  })),
});

type FormData = z.infer<typeof schema>;

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: CandidateProfile;
  onSuccess: (updated: CandidateProfile) => void;
}

const DRAWER_VARIANTS = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { type: "spring" as const, damping: 30, stiffness: 240 } },
  exit: { x: "100%", opacity: 0, transition: { duration: 0.22, ease: "easeIn" as const } },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, x: 16 },
  visible: (i: number) => ({ opacity: 1, x: 0, transition: { delay: i * 0.05, duration: 0.25 } }),
  exit: { opacity: 0, x: -16, transition: { duration: 0.15 } },
};

const inputCls = "w-full bg-[#F4FBF8] border border-[#D1EFE5] rounded-xl px-4 py-2.5 text-[#111110] text-sm font-medium placeholder-[#9ECFBB] focus:outline-none focus:border-[#059669]/50 focus:bg-white transition-all";
const labelCls = "flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-[#6B9E8A] uppercase font-semibold";

export function ProjectsModal({ isOpen, onClose, initialData, onSuccess }: ProjectsModalProps) {
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { projects: initialData.candidate?.projects || [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "projects" });

  useEffect(() => {
    if (isOpen) reset({ projects: initialData.candidate?.projects || [] });
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const updated = await profileApi.updateProfile({
        projects: data.projects.map(p => ({
          projectName: p.projectName,
          role: p.role || '',
          description: p.description || '',
          technology: p.technology || '',
          link: p.link || '',
        })),
      });
      toast.success("Dự án đã được cập nhật!");
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap');`}</style>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="absolute inset-0 bg-slate-800/30 backdrop-blur-[2px]" />

          <motion.aside variants={DRAWER_VARIANTS} initial="hidden" animate="visible" exit="exit"
            className="relative w-full max-w-[600px] h-full flex flex-col bg-white border-l border-[#D1EFE5] overflow-hidden z-10 shadow-2xl shadow-emerald-50">

            {/* Emerald top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#059669] via-[#34D399] to-transparent" />

            {/* Header */}
            <header className="relative flex-shrink-0 px-8 pt-10 pb-7 border-b border-[#E8F5EF]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                      <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-[10px] font-semibold tracking-[0.3em] text-emerald-600 uppercase">Portfolio kỹ thuật</p>
                  </div>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif" }} className="text-[28px] text-[#111110] leading-tight">
                    Dự án <em className="text-emerald-600 not-italic">tiêu biểu</em>
                  </h2>
                </div>
                <div className="flex items-center gap-2.5 mt-1">
                  <button type="button"
                    onClick={() => append({ projectName: "", role: "", description: "", technology: "", link: "" })}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                  <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#D1EFE5] text-[#9ECFBB] hover:text-[#111110] hover:border-emerald-300 transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </header>

            {/* Scrollable */}
            <div className="flex-1 overflow-y-auto bg-[#F7FCF9]">
              <form id="projects-form" onSubmit={handleSubmit(onSubmit)} className="px-8 py-7 space-y-4">
                <AnimatePresence initial={false}>
                  {fields.map((field, index) => (
                    <motion.div key={field.id} custom={index} variants={ITEM_VARIANTS}
                      initial="hidden" animate="visible" exit="exit" layout
                      className="group relative bg-white rounded-2xl border border-[#D1EFE5] overflow-hidden shadow-sm hover:shadow-md hover:border-emerald-300 transition-all">

                      {/* Emerald left bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-200" />

                      {/* Serial */}
                      <div className="absolute top-4 right-12 select-none pointer-events-none"
                        style={{ fontFamily: "'DM Serif Display', serif", fontSize: "52px", lineHeight: 1, color: "#E8F5EF", fontWeight: 700 }}>
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="pl-7 pr-5 pt-5 pb-5 space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className={labelCls}>Tên dự án</label>
                            <input {...register(`projects.${index}.projectName`)} className={inputCls} placeholder="Workly Platform" />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelCls}>Vai trò</label>
                            <input {...register(`projects.${index}.role`)} className={inputCls} placeholder="Fullstack Lead" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelCls}><Cpu className="w-3 h-3" />Công nghệ</label>
                          <input {...register(`projects.${index}.technology`)} className={inputCls} placeholder="Next.js, NestJS, PostgreSQL" />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelCls}><Link2 className="w-3 h-3" />Link Demo / GitHub</label>
                          <input {...register(`projects.${index}.link`)} className={inputCls} placeholder="https://github.com/..." />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelCls}>Mô tả dự án</label>
                          <textarea {...register(`projects.${index}.description`)} rows={3}
                            className={`${inputCls} resize-none leading-relaxed`}
                            placeholder="Tính năng chính, giải pháp kỹ thuật, kết quả đạt được..." />
                        </div>
                      </div>

                      <button type="button" onClick={() => remove(index)}
                        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-[#9ECFBB] hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {fields.length === 0 && (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-emerald-200 flex items-center justify-center bg-white">
                      <Terminal className="w-7 h-7 text-emerald-300" />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'DM Serif Display', serif" }} className="text-xl text-[#111110] mb-1">Chưa có dự án nào</p>
                      <p className="text-sm text-[#999890]">Khoe sản phẩm của bạn với nhà tuyển dụng</p>
                    </div>
                    <button type="button"
                      onClick={() => append({ projectName: "", role: "", description: "", technology: "", link: "" })}
                      className="px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-all">
                      + Thêm dự án đầu tiên
                    </button>
                  </div>
                )}
                <div className="h-2" />
              </form>
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 px-8 py-5 border-t border-[#E8F5EF] bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[10px] text-[#6B9E8A] uppercase tracking-widest font-semibold">{fields.length} dự án</span>
              </div>
              <div className="flex items-center gap-4">
                <button type="button" onClick={onClose}
                  className="text-[11px] tracking-[0.2em] text-[#BEBDB5] hover:text-[#666660] uppercase font-semibold transition-colors">Hủy bỏ</button>
                <button type="submit" form="projects-form" disabled={isSubmitting}
                  className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs tracking-[0.12em] uppercase text-white transition-all disabled:opacity-40 shadow-lg shadow-emerald-100"
                  style={{ background: "linear-gradient(135deg, #34D399 0%, #059669 100%)" }}>
                  {isSubmitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Lưu dự án <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" /></>}
                </button>
              </div>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
