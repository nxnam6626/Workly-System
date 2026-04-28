"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Trash2, Loader2, Briefcase, ChevronRight, Sparkles, Building2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";

const schema = z.object({
  experiences: z.array(z.object({
    company: z.string().min(1, "Vui lòng nhập tên công ty"),
    role: z.string().min(1, "Vui lòng nhập vị trí"),
    duration: z.string().optional(),
    description: z.string().optional(),
  })),
});

type FormData = z.infer<typeof schema>;

interface ExperienceModalProps {
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

const inputCls = "w-full bg-[#F7F7F5] border border-[#E8E8E2] rounded-xl px-4 py-2.5 text-[#111110] text-sm font-medium placeholder-[#C0BFB8] focus:outline-none focus:border-[#D97706]/50 focus:bg-white transition-all";
const labelCls = "flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-[#999890] uppercase font-semibold";

export function ExperienceModal({ isOpen, onClose, initialData, onSuccess }: ExperienceModalProps) {
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { experiences: initialData.candidate?.experiences || [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "experiences" });

  useEffect(() => {
    if (isOpen) reset({ experiences: initialData.candidate?.experiences || [] });
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const updated = await profileApi.updateProfile({
        experiences: data.experiences.map(e => ({
          company: e.company,
          role: e.role,
          duration: e.duration || '',
          description: e.description || '',
        })),
      });
      toast.success("Kinh nghiệm đã được cập nhật!");
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
            className="relative w-full max-w-[600px] h-full flex flex-col bg-white border-l border-[#E8E8E2] overflow-hidden z-10 shadow-2xl shadow-slate-200">

            {/* Amber top accent line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#D97706] via-[#F59E0B] to-transparent" />

            {/* Header */}
            <header className="relative flex-shrink-0 px-8 pt-10 pb-7 border-b border-[#F0EFE8]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
                      <Briefcase className="w-3.5 h-3.5 text-[#D97706]" />
                    </div>
                    <p className="text-[10px] font-semibold tracking-[0.3em] text-[#D97706] uppercase">Hành trình sự nghiệp</p>
                  </div>
                  <h2 style={{ fontFamily: "'DM Serif Display', serif" }} className="text-[28px] text-[#111110] leading-tight">
                    Kinh nghiệm <em className="text-[#D97706] not-italic">làm việc</em>
                  </h2>
                </div>
                <div className="flex items-center gap-2.5 mt-1">
                  <button type="button"
                    onClick={() => append({ company: "", role: "", duration: "", description: "" })}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-amber-200 text-[#D97706] bg-amber-50 hover:bg-amber-100 transition-all">
                    <Plus className="w-3.5 h-3.5" /> Thêm
                  </button>
                  <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl border border-[#E8E8E2] text-[#BEBDB5] hover:text-[#111110] hover:border-[#D0CFCA] transition-all">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </header>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto bg-[#FAFAF8]">
              <form id="exp-form" onSubmit={handleSubmit(onSubmit)} className="px-8 py-7 space-y-4">
                <AnimatePresence initial={false}>
                  {fields.map((field, index) => (
                    <motion.div key={field.id} custom={index} variants={ITEM_VARIANTS}
                      initial="hidden" animate="visible" exit="exit" layout
                      className="group relative bg-white rounded-2xl border border-[#E8E8E2] overflow-hidden shadow-sm hover:shadow-md hover:border-[#D9D8D0] transition-all">

                      {/* Amber left accent */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#F59E0B] via-[#D97706] to-[#F59E0B]/20" />

                      {/* Serial */}
                      <div className="absolute top-4 right-12 select-none pointer-events-none"
                        style={{ fontFamily: "'DM Serif Display', serif", fontSize: "52px", lineHeight: 1, color: "#F5F4F0", fontWeight: 700 }}>
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="pl-7 pr-5 pt-5 pb-5 space-y-3.5">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className={labelCls}><Building2 className="w-3 h-3" />Công ty</label>
                            <input {...register(`experiences.${index}.company`)} className={inputCls} placeholder="Tên công ty" />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelCls}><Briefcase className="w-3 h-3" />Vị trí</label>
                            <input {...register(`experiences.${index}.role`)} className={inputCls} placeholder="Frontend Developer" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelCls}><Clock className="w-3 h-3" />Thời gian</label>
                          <input {...register(`experiences.${index}.duration`)} className={inputCls} placeholder="01/2023 – Hiện tại" />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelCls}>Mô tả & Thành tựu</label>
                          <textarea {...register(`experiences.${index}.description`)} rows={3}
                            className={`${inputCls} resize-none leading-relaxed`}
                            placeholder="Mô tả nhiệm vụ, dự án và thành tựu nổi bật..." />
                        </div>
                      </div>

                      <button type="button" onClick={() => remove(index)}
                        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-[#C0BFB8] hover:text-red-400 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {fields.length === 0 && (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-[#E8E8E2] flex items-center justify-center bg-white">
                      <Briefcase className="w-7 h-7 text-[#C0BFB8]" />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'DM Serif Display', serif" }} className="text-xl text-[#111110] mb-1">Hành trình còn trống</p>
                      <p className="text-sm text-[#999890]">Thêm kinh nghiệm để gây ấn tượng với nhà tuyển dụng</p>
                    </div>
                    <button type="button"
                      onClick={() => append({ company: "", role: "", duration: "", description: "" })}
                      className="px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-amber-200 text-[#D97706] bg-amber-50 hover:bg-amber-100 transition-all">
                      + Thêm kinh nghiệm đầu tiên
                    </button>
                  </div>
                )}
                <div className="h-2" />
              </form>
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 px-8 py-5 border-t border-[#F0EFE8] bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[10px] text-[#999890] uppercase tracking-widest font-semibold">{fields.length} mục</span>
              </div>
              <div className="flex items-center gap-4">
                <button type="button" onClick={onClose}
                  className="text-[11px] tracking-[0.2em] text-[#BEBDB5] hover:text-[#666660] uppercase font-semibold transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" form="exp-form" disabled={isSubmitting}
                  className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs tracking-[0.12em] uppercase text-white transition-all disabled:opacity-40 shadow-lg shadow-amber-100"
                  style={{ background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)" }}>
                  {isSubmitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Lưu thay đổi <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" /></>}
                </button>
              </div>
            </footer>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
