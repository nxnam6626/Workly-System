"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Plus, Trash2, Loader2, ChevronRight, Sparkles, ShieldCheck, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { profileApi, type CandidateProfile } from "@/lib/profile-api";

const schema = z.object({
  certifications: z.array(z.object({
    name: z.string().min(1, "Vui lòng nhập tên chứng chỉ"),
    organization: z.string().optional(),
    issueDate: z.string().optional(),
  })),
});

type FormData = z.infer<typeof schema>;

interface CertificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: CandidateProfile;
  onSuccess: (updated: CandidateProfile) => void;
}

const MODAL_VARIANTS: Variants = {
  hidden: { scale: 0.95, opacity: 0, y: 20 },
  visible: { 
    scale: 1, 
    opacity: 1, 
    y: 0, 
    transition: { 
      type: "spring", 
      damping: 25, 
      stiffness: 300,
      mass: 0.5 
    } 
  },
  exit: { 
    scale: 0.95, 
    opacity: 0, 
    y: 20, 
    transition: { 
      duration: 0.2, 
      ease: "easeOut" 
    } 
  },
};

const inputCls = "w-full bg-[#FFF1F2] border border-[#FECDD3] rounded-xl px-4 py-2.5 text-[#111110] text-sm font-medium placeholder-[#FDA4AF] focus:outline-none focus:border-rose-400/60 focus:bg-white transition-all";
const labelCls = "flex items-center gap-1.5 text-[10px] tracking-[0.2em] text-rose-500 uppercase font-semibold";

export function CertificationsModal({ isOpen, onClose, initialData, onSuccess }: CertificationsModalProps) {
  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      certifications: initialData.candidate?.certifications?.map((c: any) => ({
        name: c.name || "",
        organization: c.organization || "",
        issueDate: c.issueDate || "",
      })) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "certifications" });

  useEffect(() => {
    if (isOpen) {
      reset({
        certifications: initialData.candidate?.certifications?.map((c: any) => ({
          name: c.name || "",
          organization: c.organization || "",
          issueDate: c.issueDate || "",
        })) || [],
      });
    }
  }, [isOpen, initialData, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      const updated = await profileApi.updateProfile({ certifications: data.certifications as any });
      toast.success("Chứng chỉ đã được cập nhật!");
      onSuccess(updated);
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Lỗi khi cập nhật.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 md:p-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
          `}</style>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose} 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
          />

          <motion.div 
            variants={MODAL_VARIANTS} 
            initial="hidden" 
            animate="visible" 
            exit="exit"
            className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-white/95 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden z-10 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] border border-white/20"
          >
            {/* Rose top accent line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 via-rose-400 to-rose-600" />

            {/* Header */}
            <header className="relative flex-shrink-0 px-8 pt-10 pb-7 border-b border-[#F3EEFF]">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="w-7 h-7 rounded-lg bg-rose-50 border border-rose-100 flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-600" />
                    </div>
                    <p className="text-[10px] font-bold tracking-[0.3em] text-rose-600 uppercase">Bằng chứng chuyên môn</p>
                  </div>
                  <h2 className="text-3xl text-slate-900 leading-tight font-bold" style={{ fontFamily: "'Inter', sans-serif" }}>
                    Chứng chỉ & <span className="text-rose-600 italic">Bằng cấp</span>
                  </h2>
                </div>
                  <div className="flex items-center gap-2.5 mt-1">
                    <button type="button"
                      onClick={() => append({ name: "", organization: "", issueDate: "" })}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all">
                      <Plus className="w-3.5 h-3.5" /> Thêm
                    </button>
                    <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl border border-rose-100 text-rose-300 hover:text-rose-600 hover:border-rose-300 transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
              </div>
            </header>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-[#FAF7FF]">
              <form id="cert-form" onSubmit={handleSubmit(onSubmit)} className="px-8 py-7 space-y-4">
                <AnimatePresence initial={false}>
                  {fields.map((field: any, index: number) => (
                    <motion.div key={field.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: index * 0.05 } }}
                      exit={{ opacity: 0, x: -16, transition: { duration: 0.15 } }}
                      layout
                      className="group relative bg-white rounded-2xl border border-[#E9D5FF] overflow-hidden shadow-sm hover:shadow-md hover:border-violet-300 transition-all p-6"
                    >
                      {/* Rose left bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-rose-400 via-rose-500 to-rose-200" />

                      {/* Serial */}
                      <div className="absolute top-4 right-12 select-none pointer-events-none"
                        style={{ fontFamily: "'Inter', sans-serif", fontSize: "52px", lineHeight: 1, color: "#FFF1F2", fontWeight: 700 }}>
                        {String(index + 1).padStart(2, "0")}
                      </div>

                      <div className="pl-4 space-y-3.5">
                        <div className="space-y-1.5">
                          <label className={labelCls}>Tên chứng chỉ</label>
                          <input {...register(`certifications.${index}.name`)} className={inputCls}
                            placeholder="AWS Certified Solutions Architect" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className={labelCls}><ShieldCheck className="w-3 h-3" />Tổ chức cấp</label>
                            <input {...register(`certifications.${index}.organization`)} className={inputCls}
                              placeholder="Amazon Web Services" />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelCls}><Calendar className="w-3 h-3" />Ngày cấp</label>
                            <input {...register(`certifications.${index}.issueDate`)} className={inputCls}
                              placeholder="12/2023" />
                          </div>
                        </div>
                      </div>

                      <button type="button" onClick={() => remove(index)}
                        className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg text-rose-300 hover:text-red-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {fields.length === 0 && (
                  <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-violet-200 flex items-center justify-center bg-white">
                      <ShieldCheck className="w-7 h-7 text-violet-200" />
                    </div>
                    <div>
                      <p style={{ fontFamily: "'Inter', sans-serif" }} className="text-xl font-bold text-slate-900 mb-1">Chưa có chứng chỉ</p>
                      <p className="text-sm text-slate-400 font-medium">Thêm chứng chỉ để tăng uy tín hồ sơ</p>
                    </div>
                    <button type="button"
                      onClick={() => append({ name: "", organization: "", issueDate: "" })}
                      className="px-5 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-widest border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100 transition-all">
                      + Thêm chứng chỉ đầu tiên
                    </button>
                  </div>
                )}
                <div className="h-2" />
              </form>
            </div>

            {/* Footer */}
            <footer className="flex-shrink-0 px-8 py-5 border-t border-[#F3EEFF] bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-[10px] text-[#A78BFA] uppercase tracking-widest font-semibold">{fields.length} chứng chỉ</span>
              </div>
              <div className="flex items-center gap-4">
                <button type="button" onClick={onClose}
                  className="text-[11px] tracking-[0.2em] text-[#BEBDB5] hover:text-[#666660] uppercase font-semibold transition-colors">Hủy bỏ</button>
                <button type="submit" form="cert-form" disabled={isSubmitting}
                  className="group flex items-center gap-2.5 px-6 py-3 rounded-xl font-bold text-xs tracking-[0.12em] uppercase text-white transition-all disabled:opacity-40 shadow-lg shadow-violet-100"
                  style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}>
                  {isSubmitting
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang lưu...</>
                    : <><Sparkles className="w-3.5 h-3.5" /> Lưu chứng chỉ <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" /></>}
                </button>
              </div>
            </footer>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
